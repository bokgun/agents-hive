import https from 'node:https';
import { success, warn } from '../lib/colors.js';

export async function notify(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(warn(`Telegram not configured. Run: hive setup telegram`));
    return;
  }

  const data = new URLSearchParams({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
  }).toString();

  return new Promise<void>((resolve) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      (res) => {
        if (res.statusCode === 200) {
          console.log(success('Sent'));
        } else {
          console.log(warn(`Failed (HTTP ${res.statusCode})`));
        }
        res.resume();
        resolve();
      },
    );

    req.on('error', (err) => {
      console.log(warn(`Failed to send: ${err.message}`));
      resolve();
    });

    req.write(data);
    req.end();
  });
}
