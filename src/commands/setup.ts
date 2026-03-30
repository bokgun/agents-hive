import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { success, error, warn, cyan, dim } from '../lib/colors.js';
import { requireWorkspace } from '../lib/workspace.js';
import { httpsGet, sendMessage } from '../lib/telegram.js';

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function saveToEnv(ws: string, key: string, value: string): void {
  const envPath = path.join(ws, '.env');
  let content = '';

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
      fs.writeFileSync(envPath, content);
      return;
    }
  }

  fs.appendFileSync(envPath, `${content && !content.endsWith('\n') ? '\n' : ''}${key}=${value}\n`);
}

export async function setupTelegram(): Promise<void> {
  const ws = requireWorkspace();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('');
  console.log(cyan('Telegram Setup'));
  console.log('');

  // Step 1: Bot token
  console.log('Step 1: Create a bot');
  console.log('  → Open Telegram and message @BotFather');
  console.log('  → Send /newbot and follow the prompts');
  console.log(`  → Copy the bot token ${dim('(looks like: 123456:ABC-DEF...)')}`);
  console.log('');

  const token = (await ask(rl, 'Paste your bot token: ')).trim();

  if (!token || !token.includes(':')) {
    console.error(error('Invalid token format. Expected something like: 123456:ABC-DEF...'));
    rl.close();
    process.exit(1);
  }

  // Step 2: Chat ID
  console.log('');
  console.log('Step 2: Get your Chat ID');
  console.log('  → Send any message to your new bot in Telegram');
  console.log(`  → ${dim("We'll fetch your Chat ID automatically")}`);
  console.log('');

  await ask(rl, 'Press Enter after sending a message to the bot...');

  let chatId: string | null = null;

  try {
    const raw = await httpsGet(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = JSON.parse(raw);

    if (data.ok && data.result?.length > 0) {
      const msg = data.result[data.result.length - 1].message;
      if (msg?.chat?.id) {
        chatId = String(msg.chat.id);
      }
    }
  } catch {
    // ignore
  }

  if (!chatId) {
    console.log(warn('Could not detect Chat ID automatically.'));
    chatId = (await ask(rl, 'Enter your Chat ID manually: ')).trim();
  } else {
    console.log(success(`Chat ID: ${cyan(chatId)}`));
  }

  if (!chatId) {
    console.error(error('No Chat ID provided.'));
    rl.close();
    process.exit(1);
  }

  // Step 3: Test
  console.log('');
  console.log('Step 3: Sending test message...');

  const sent = await sendMessage(token, chatId, '✅ agents-hive connected!');

  if (sent) {
    console.log(success('Message sent! Check your Telegram.'));
  } else {
    console.log(warn('Test message failed — check your token and Chat ID.'));
  }

  // Step 4: Save
  console.log('');
  console.log('Step 4: Saving to .env');

  saveToEnv(ws, 'TELEGRAM_BOT_TOKEN', token);
  saveToEnv(ws, 'TELEGRAM_CHAT_ID', chatId);

  console.log(success(`Saved to ${cyan(path.join(ws, '.env'))}`));
  console.log('');
  console.log(dim('You can now use: hive notify "your message"'));

  rl.close();
}
