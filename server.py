from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote
import json
import os


HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", "3333"))
ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("DATA_DIR", ROOT_DIR / "data")).resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)


def safe_family_id(value):
    family_id = unquote(value).strip()
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_")
    cleaned = "".join(ch for ch in family_id if ch in allowed)
    return cleaned[:80]


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def end_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.end_json(200, {"status": "ok"})

    def do_GET(self):
        if self.path == "/healthz":
            self.end_json(200, {"status": "ok"})
            return

        if self.path.startswith("/api/sync/"):
            family_id = safe_family_id(self.path.removeprefix("/api/sync/"))
            if not family_id:
                self.end_json(400, {"error": "family_id is required"})
                return

            file_path = DATA_DIR / f"{family_id}.json"
            if not file_path.exists():
                self.end_json(200, {"data": None})
                return

            try:
                self.end_json(200, {"data": json.loads(file_path.read_text(encoding="utf-8"))})
            except Exception as exc:
                self.end_json(500, {"error": str(exc)})
            return

        super().do_GET()

    def do_POST(self):
        if not self.path.startswith("/api/sync/"):
            self.end_json(404, {"error": "not found"})
            return

        family_id = safe_family_id(self.path.removeprefix("/api/sync/"))
        if not family_id:
            self.end_json(400, {"error": "family_id is required"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            data = payload.get("data", payload)
            (DATA_DIR / f"{family_id}.json").write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            self.end_json(200, {"status": "ok"})
        except Exception as exc:
            self.end_json(500, {"error": str(exc)})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Serving on http://127.0.0.1:{PORT}")
    server.serve_forever()
