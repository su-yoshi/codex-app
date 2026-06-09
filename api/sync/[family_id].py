from http.server import BaseHTTPRequestHandler
import json
import os
from pathlib import Path
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen


TMP_DIR = Path("/tmp/kids-money-planner-sync")
MAX_BODY_BYTES = 2 * 1024 * 1024


def _json_response(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _safe_family_id(raw):
    family_id = unquote((raw or "").strip())
    if not family_id:
        return None
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_")
    safe = "".join(ch for ch in family_id if ch in allowed)
    return safe[:80] or None


def _kv_config():
    url = os.environ.get("KV_REST_API_URL")
    token = os.environ.get("KV_REST_API_TOKEN")
    if not url or not token:
        return None
    return url.rstrip("/"), token


def _kv_request(command):
    config = _kv_config()
    if not config:
        return None
    base_url, token = config
    body = json.dumps(command).encode("utf-8")
    req = Request(
        base_url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urlopen(req, timeout=8) as res:
        return json.loads(res.read().decode("utf-8"))


def _load_data(family_id):
    key = f"family-sync:{family_id}"
    if _kv_config():
        result = _kv_request(["GET", key])
        value = result.get("result") if isinstance(result, dict) else None
        if not value:
            return {}
        if isinstance(value, str):
            return json.loads(value)
        return value

    file_path = TMP_DIR / f"{family_id}.json"
    if not file_path.exists():
        return {}
    return json.loads(file_path.read_text(encoding="utf-8"))


def _save_data(family_id, payload):
    key = f"family-sync:{family_id}"
    if _kv_config():
        _kv_request(["SET", key, json.dumps(payload, ensure_ascii=False)])
        return

    TMP_DIR.mkdir(parents=True, exist_ok=True)
    (TMP_DIR / f"{family_id}.json").write_text(
        json.dumps(payload, ensure_ascii=False),
        encoding="utf-8",
    )


class handler(BaseHTTPRequestHandler):
    def _family_id(self):
        parts = urlparse(self.path).path.rstrip("/").split("/")
        return _safe_family_id(parts[-1] if parts else "")

    def do_GET(self):
        family_id = self._family_id()
        if not family_id:
            _json_response(self, 400, {"error": "invalid family id"})
            return
        try:
            _json_response(self, 200, _load_data(family_id))
        except Exception:
            _json_response(self, 500, {"error": "sync load failed"})

    def do_POST(self):
        family_id = self._family_id()
        if not family_id:
            _json_response(self, 400, {"error": "invalid family id"})
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        if length > MAX_BODY_BYTES:
            _json_response(self, 413, {"error": "payload too large"})
            return

        try:
            raw_body = self.rfile.read(length).decode("utf-8")
            payload = json.loads(raw_body or "{}")
            _save_data(family_id, payload)
            _json_response(self, 200, {"status": "ok"})
        except json.JSONDecodeError:
            _json_response(self, 400, {"error": "invalid json"})
        except Exception:
            _json_response(self, 500, {"error": "sync save failed"})
