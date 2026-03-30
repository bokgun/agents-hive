import { success, warn } from '../lib/colors.js';
import { sendMessage } from '../lib/telegram.js';

export async function notify(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(warn(`Telegram not configured. Run: hive setup telegram`));
    return;
  }

  const ok = await sendMessage(token, chatId, message);
  if (ok) {
    console.log(success('Sent'));
  } else {
    console.log(warn('Failed to send'));
  }
}
