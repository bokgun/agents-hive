import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { success, error, cyan, dim } from '../lib/colors.js';
import { requireWorkspace } from '../lib/workspace.js';

function cronFilePath(workspace: string): string {
  return path.join(workspace, '.hive', 'crontab.generated');
}

export function cronAdd(name: string, schedule: string, command: string): void {
  const ws = requireWorkspace();
  const cronFile = cronFilePath(ws);

  fs.mkdirSync(path.join(ws, '.hive'), { recursive: true });

  if (!fs.existsSync(cronFile)) {
    fs.writeFileSync(
      cronFile,
      `# agents-hive crontab (auto-generated)
# Apply: hive cron apply
PATH=/usr/local/bin:/usr/bin:/bin
HIVE_WORKSPACE=${ws}

`,
    );
  }

  fs.appendFileSync(cronFile, `# [${name}]\n${schedule} ${command}\n\n`);

  console.log(success(`Cron added: ${cyan(name)}`));
  console.log(`    ${dim(`${schedule} ${command}`)}`);
}

export function cronList(): void {
  const ws = requireWorkspace();
  const cronFile = cronFilePath(ws);

  if (!fs.existsSync(cronFile)) {
    console.log(dim('No cron jobs registered'));
    return;
  }

  console.log(cyan('Cron Jobs'));
  const content = fs.readFileSync(cronFile, 'utf-8');
  const matches = content.match(/^# \[.*\]$/gm);
  if (!matches || matches.length === 0) {
    console.log('  (none)');
    return;
  }
  for (const m of matches) {
    console.log('  ' + m.replace(/^# \[/, '').replace(/\]$/, ''));
  }
}

export function cronRemove(name: string): void {
  const ws = requireWorkspace();
  const cronFile = cronFilePath(ws);

  if (!fs.existsSync(cronFile)) {
    console.error(error('No cron file'));
    process.exit(1);
  }

  const lines = fs.readFileSync(cronFile, 'utf-8').split('\n');
  const result: string[] = [];
  let skip = false;

  for (const line of lines) {
    if (line.match(/^# \[/) && line.includes(`[${name}]`)) {
      skip = true;
      continue;
    }
    if (skip && (line.match(/^[^#]/) || line === '')) {
      skip = false;
      continue;
    }
    result.push(line);
  }

  fs.writeFileSync(cronFile, result.join('\n'));
  console.log(success(`Removed: ${name}`));
}

export function cronApply(): void {
  const ws = requireWorkspace();
  const cronFile = cronFilePath(ws);

  if (!fs.existsSync(cronFile)) {
    console.error(error(`No cron file. Run ${cyan('hive cron add')} first.`));
    process.exit(1);
  }

  try {
    let existing = '';
    try {
      existing = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8' });
    } catch {
      // no existing crontab
    }

    const filtered = existing
      .split('\n')
      .filter((l) => !l.includes('agents-hive') && !l.includes(ws))
      .join('\n');

    const newCron = fs.readFileSync(cronFile, 'utf-8');
    const combined = filtered.trimEnd() + '\n' + newCron;

    execSync(`echo ${JSON.stringify(combined)} | crontab -`, {
      encoding: 'utf-8',
      shell: '/bin/bash',
    });

    console.log(success('Crontab applied'));
    console.log(`    ${dim('Verify: crontab -l')}`);
  } catch (e) {
    console.error(error(`Failed to apply crontab: ${e}`));
    process.exit(1);
  }
}

export function cronShow(): void {
  const ws = requireWorkspace();
  const cronFile = cronFilePath(ws);

  if (!fs.existsSync(cronFile)) {
    console.log(dim('No cron jobs'));
    return;
  }

  console.log(fs.readFileSync(cronFile, 'utf-8'));
}

export function cronHelp(): void {
  console.log('Usage: hive cron <add|list|remove|apply|show>');
  console.log('');
  console.log('Examples:');
  console.log(
    "  hive cron add blog-research '0 9 * * *' 'cd $HIVE_WORKSPACE/blog && gemini -p \"trending analysis\"'",
  );
  console.log(
    "  hive cron add rtb-test '*/30 * * * *' 'cd $HIVE_WORKSPACE/rtb && claude -p \"npm test\"'",
  );
  console.log('  hive cron apply');
}
