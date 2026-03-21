import https from 'node:https';
import { success, warn } from '../lib/colors.js';

export function notify(message: string): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(warn(`Telegram not configured. Message: ${message}`));
    return;
  }

  const data = new URLSearchParams({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
  }).toString();

  const req = https.request(
    {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
    () => {
      console.log(success('Sent'));
    },
  );

  req.on('error', () => {
    console.log(warn('Failed to send notification'));
  });

  req.write(data);
  req.end();
}
