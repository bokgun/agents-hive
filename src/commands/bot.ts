import { execSync } from 'node:child_process';
import { success, error, warn, cyan, dim } from '../lib/colors.js';
import { sendMessage, getUpdates, stripAnsi } from '../lib/telegram.js';
import { requireWorkspace, readStatus } from '../lib/workspace.js';

// Lazy imports to avoid circular issues — resolved at dispatch time
import { status } from './status.js';
import { ps } from './daemon.js';
import { start, stop } from './daemon.js';
import { projectList } from './project.js';
import { briefing } from './briefing.js';
import { memo } from './memo.js';
import { run } from './run.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tmuxSessionExists(name: string): boolean {
  try {
    execSync(`tmux has-session -t ${name}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/** Inject a slash command (e.g. /compact, /clear) into a running hive tmux session */
export function sendSlashCommand(project: string, slash: string): string {
  const sessionName = `hive-${project}`;
  if (!tmuxSessionExists(sessionName)) {
    return `Not running: ${sessionName}`;
  }
  try {
    execSync(`tmux send-keys -t ${sessionName} ${JSON.stringify(slash)} Enter`, {
      stdio: 'pipe',
    });
    return `Sent ${slash} to ${sessionName}`;
  } catch (e) {
    return `Failed to send ${slash} to ${sessionName}: ${e}`;
  }
}

/** Capture console output from a sync/async function without killing the process */
export async function captureOutput(fn: () => void | Promise<void>): Promise<string> {
  const lines: string[] = [];
  const origLog = console.log;
  const origError = console.error;
  const origExit = process.exit;

  console.log = (...args: unknown[]) => lines.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => lines.push(args.map(String).join(' '));
  process.exit = ((code?: number) => {
    throw new Error(`EXIT:${code ?? 1}`);
  }) as typeof process.exit;

  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
  } catch (e) {
    const msg = String(e);
    if (!msg.includes('EXIT:')) {
      lines.push(`Error: ${msg}`);
    }
  } finally {
    console.log = origLog;
    console.error = origError;
    process.exit = origExit;
  }

  return stripAnsi(lines.join('\n'));
}

function formatHelp(): string {
  return [
    'Available commands:',
    '',
    '/help — Show this help',
    '/ping — Health check',
    '/status — Show all project status',
    '/ps — List running sessions',
    '/projects — List all projects',
    '/briefing — Generate daily briefing',
    '/memo <target> [content] — View/write memo',
    '/start <project> — Start background session',
    '/stop <project> — Stop background session',
    '/run <project> <command> — Run agent command',
    '/compact <project> — Compact context in running session',
    '/clear <project> — Clear context in running session',
  ].join('\n');
}

async function handleCommand(token: string, chatId: string, text: string): Promise<void> {
  // Strip bot mention suffix (e.g., "/status@my_bot" -> "/status")
  const cleaned = text.replace(/@\S+/, '');
  const parts = cleaned.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  let response: string;

  switch (cmd) {
    case '/help':
      response = formatHelp();
      break;

    case '/ping':
      response = 'Pong!';
      break;

    case '/status':
    case '/st':
      response = await captureOutput(() => status());
      break;

    case '/ps':
      response = await captureOutput(() => ps());
      break;

    case '/projects':
      response = await captureOutput(() => projectList());
      break;

    case '/briefing':
      response = await captureOutput(() => briefing());
      break;

    case '/memo': {
      const target = args[0] ?? 'global';
      const content = args.length > 1 ? args.slice(1).join(' ') : undefined;
      response = await captureOutput(() => memo(target, content));
      break;
    }

    case '/start': {
      if (!args[0]) {
        response = 'Usage: /start <project>';
        break;
      }
      response = await captureOutput(() => start(args[0], []));
      break;
    }

    case '/stop': {
      if (!args[0]) {
        response = 'Usage: /stop <project>';
        break;
      }
      response = await captureOutput(() => stop(args[0]));
      break;
    }

    case '/compact': {
      if (!args[0]) {
        response = 'Usage: /compact <project>';
        break;
      }
      response = sendSlashCommand(args[0], '/compact');
      break;
    }

    case '/clear': {
      if (!args[0]) {
        response = 'Usage: /clear <project>';
        break;
      }
      response = sendSlashCommand(args[0], '/clear');
      break;
    }

    case '/run': {
      if (args.length < 2) {
        response = 'Usage: /run <project> <command>';
        break;
      }
      const project = args[0];
      const command = args.slice(1).join(' ');

      // Validate project exists
      try {
        const ws = requireWorkspace();
        const st = readStatus(ws);
        if (!st.projects[project]) {
          response = `Unknown project: ${project}`;
          break;
        }
      } catch {
        response = 'Workspace not found.';
        break;
      }

      await sendMessage(token, chatId, `Running: ${project} > ${command}...`);
      response = await captureOutput(() => run(project, command));
      break;
    }

    default:
      response = `Unknown command: ${cmd}\nSend /help for available commands.`;
      break;
  }

  await sendMessage(token, chatId, response.trim() || '(no output)');
}

export async function bot(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(warn('Telegram not configured. Run: hive setup telegram'));
    process.exit(1);
  }

  console.log(success('Telegram bot started'));
  console.log(dim(`Listening for commands from chat ${chatId}...`));
  console.log(dim('Press Ctrl+C to stop'));

  let offset = 0;
  let running = true;

  const shutdown = () => {
    running = false;
    console.log('\n' + dim('Bot stopping...'));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await sendMessage(token, chatId, 'Bot started. Send /help for available commands.');

  while (running) {
    try {
      const updates = await getUpdates(token, offset, 30);

      for (const update of updates) {
        offset = update.update_id + 1;

        // Security: only process messages from configured chat
        if (!update.message || String(update.message.chat.id) !== chatId) {
          continue;
        }

        const text = update.message.text?.trim();
        if (!text || !text.startsWith('/')) continue;

        await handleCommand(token, chatId, text);
      }
    } catch (err) {
      if (running) {
        console.log(warn(`Poll error: ${err}. Retrying in 5s...`));
        await sleep(5000);
      }
    }
  }

  await sendMessage(token, chatId, 'Bot stopped.');
}

export function startBotDaemon(): void {
  const sessionName = 'hive-bot';

  if (tmuxSessionExists(sessionName)) {
    console.error(warn('Bot already running: hive-bot'));
    console.log(`    Attach: ${cyan('tmux attach -t hive-bot')}`);
    return;
  }

  try {
    execSync(`tmux new-session -d -s ${sessionName}`, { stdio: 'pipe' });
    execSync(`tmux send-keys -t ${sessionName} "hive bot" Enter`, { stdio: 'pipe' });
  } catch (e) {
    console.error(error(`Failed to start bot: ${e}`));
    process.exit(1);
  }

  console.log(success('Telegram bot started in background'));
  console.log(`    Attach: ${cyan('tmux attach -t hive-bot')}`);
}
