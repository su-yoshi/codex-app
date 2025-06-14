export default defineComponent({
  async run({ steps, $ }) {
    // === 1. 日付を「YYYY/M/D」形式で自動生成 ===
    const today = new Date();
    // toLocaleDateStringを使うとタイムゾーンを考慮した正しい日付になる
    const formattedDate = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const dateString = `${formattedDate.getFullYear()}/${formattedDate.getMonth() + 1}/${formattedDate.getDate()}`;

    // === 2. 各APIからデータを取得 ===
    // CryptoPanicニュース
    const newsItems = steps.get_news.$return_value.results || [];
    const headlines = newsItems.slice(0, 6).map((item, index) => {
      const title = item.title || "（タイトルなし）";
      return `${index + 1}. ${title} | ${item.url}`;
    }).join('\n');

    // CoinGecko価格
    const btcPrice = steps.get_request___Crypto___1.$return_value.bitcoin.usd;
    const ethPrice = steps.get_request___Crypto___1.$return_value.ethereum.usd;
    const solPrice = steps.get_request___Crypto___1.$return_value.solana.usd;

    // Gold API価格
    const goldPrice = steps.get_request___Gold.$return_value.price;
    
    // === 3. LINE配信用に最適化したプロンプトを作成 ===
    const prompt_template = `あなたは暗号資産と金市場のプロのアナリストです。以下の入力データを元に、マーケットレポートを作成してください。

【${dateString} のマーケットレポート】

### 入力データ
最新ヘッドライン（時刻順・URL付き）:
${headlines}

価格:
BTC ${btcPrice} USD
ETH ${ethPrice} USD
SOL ${solPrice} USD
XAU ${goldPrice} USD/oz

### 出力フォーマット
1. <ニュース見出し40〜60字> — → 影響：<銘柄> 📈/📉 (source: ドメイン名)
… (最大6件)

◆ Crypto Swing Set-ups
• <シンボル> — <理由>；Tech: S/R xx / yy, 週EMA ⇧/⇩, RSI zz；Plan: 📈/📉（無効 xx, 目標 yy）

◆ Gold Swing
• XAU/USD — <理由>；Tech: S/R xx / yy, 週EMA ⇧/⇩, RSI zz；Plan: 📈/📉（無効 xx, 目標 xx）

◆ Event Calendar
・<日付> <イベント名> — 簡潔な方向性

◆ Forward-Looking Insights
・テーマA — 強気…／中立…／弱気…

###【重要】制約事項
- 必ず日本語（です・ます調）で記述してください。
- **専門用語は避け、初心者にも理解しやすい平易な言葉で解説してください。**
- **レポート全体を800日本語文字程度に要約してください。**
- 見出しは必ず40〜60文字に収めてください。
- スイング銘柄はBTC/ETH/SOLから3つ自動で選択してください。
- テクニカル数値は常識的な範囲で仮の値を入れてください。
- 情報源は (source: coindesk.com) のようにドメイン名のみ表示してください。
- 出力はMarkdown無し・純テキストでお願いします。
`;
    
    // この整形済みプロンプトを次のステップに渡す
    return prompt_template;
  },
})


// ===================================================
// ステップ名: LINE送信 (code)
// ===================================================


import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    line_messaging_api: {
      type: "app",
      app: "line_messaging_api",
      label: "LINE Messaging API",
    },
  },

  async run({ steps, $ }) {
    /* ChatGPT 出力を取得 */
    let raw =
      steps.chat?.$return_value?.choices?.[0]?.message?.content ??
      steps.chat?.$return_value?.choices?.[0]?.text ??
      "（テキスト未取得）";

    /* 文字化け防止フィルター */
    raw = String(raw)
      .replace(/\r?\n/g, "\n")
      .replace(/[\u2028\u2029]/g, "")
      .normalize("NFC")
      .trim()
      .replace(/[\uFFFD\uE000-\uF8FF\u200B-\u200D\uFEFF]/g, "");

    // ================================================================
    // 【追加】LINEが拒否する制御文字・不正サロゲートを除去
    // ================================================================
    raw = Array.from(raw).filter((ch) => {
      const cp = ch.codePointAt(0);
      // タブ、改行以外の制御文字を削除
      if (cp < 0x20 && ![0x09, 0x0a, 0x0d].includes(cp)) return false;
      // 不正なサロゲートペアを削除
      if (cp >= 0xd800 && cp <= 0xdfff) return false;
      return true;
    }).join("");
    // ================================================================


    /* LINE Broadcast 用ペイロード */
    const payload = {
      messages: [{ type: "text", text: raw || "(空メッセージ)" }],
    };

    /* アクセストークン */
    const token =
      this.line_messaging_api.$auth.long_lived_channel_access_token;
    if (!token) throw new Error("LINE token is empty – check connection");

    /* LINE API 呼び出し */
    const res = await axios($, {
      method: "POST",
      url: "https://api.line.me/v2/bot/message/broadcast",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      data: payload,
      returnFullResponse: true,
      validateStatus: () => true,
    });

    /* 結果ハンドリング */
    const { status, data } = res;
    if (status >= 200 && status < 300) {
      $.export("$summary", `LINE に一斉配信成功 (status ${status})`);
      return data;
    }
    throw new Error(`LINE API Error ${status}: ${JSON.stringify(data)}`);
  },
});
