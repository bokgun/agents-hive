#!/usr/bin/env node

import { Command } from 'commander';
import { initWorkspace } from './commands/init.js';
import { projectCreate, projectEdit, projectDelete, projectList } from './commands/project.js';
import { memo } from './commands/memo.js';
import { cronAdd, cronList, cronRemove, cronApply, cronShow, cronHelp } from './commands/cron.js';
import { run } from './commands/run.js';
import { session } from './commands/session.js';
import { status } from './commands/status.js';
import { briefing } from './commands/briefing.js';
import { cleanup } from './commands/cleanup.js';
import { notify } from './commands/notify.js';
import { uninstall } from './commands/uninstall.js';
import { N, Y } from './lib/colors.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('hive')
  .description('Multi-agent workspace manager for Claude Code, Gemini CLI, and Codex CLI')
  .version(VERSION, '-v, --version');

// --- init ---
program
  .command('init [path]')
  .description('Initialize a new workspace')
  .action((targetPath?: string) => {
    initWorkspace(targetPath);
  });

// --- project ---
const projectCmd = program.command('project').alias('p').description('Manage projects');

projectCmd
  .command('create <name> <agent> <description...>')
  .aliases(['add', 'new'])
  .description('Create a new project')
  .action((name: string, agent: string, descParts: string[]) => {
    projectCreate(name, agent, descParts.join(' '));
  });

projectCmd
  .command('edit <name> <field> <value...>')
  .alias('update')
  .description('Edit a project field')
  .action((name: string, field: string, valueParts: string[]) => {
    projectEdit(name, field, valueParts.join(' '));
  });

projectCmd
  .command('delete <name>')
  .aliases(['rm', 'remove'])
  .description('Delete a project')
  .action(async (name: string) => {
    await projectDelete(name);
  });

projectCmd
  .command('list')
  .alias('ls')
  .description('List all projects')
  .action(() => {
    projectList();
  });

// --- memo ---
program
  .command('memo <target> [content...]')
  .alias('m')
  .description('Manage memos')
  .action((target: string, contentParts?: string[]) => {
    const content = contentParts && contentParts.length > 0 ? contentParts.join(' ') : undefined;
    memo(target, content);
  });

// --- cron ---
const cronCmd = program.command('cron').alias('c').description('Manage cron jobs');

cronCmd
  .command('add <name> <schedule> <command...>')
  .alias('new')
  .description('Add a cron job')
  .action((name: string, schedule: string, cmdParts: string[]) => {
    cronAdd(name, schedule, cmdParts.join(' '));
  });

cronCmd
  .command('list')
  .alias('ls')
  .description('List cron jobs')
  .action(() => {
    cronList();
  });

cronCmd
  .command('remove <name>')
  .aliases(['rm', 'delete'])
  .description('Remove a cron job')
  .action((name: string) => {
    cronRemove(name);
  });

cronCmd
  .command('apply')
  .alias('install')
  .description('Apply cron jobs to system crontab')
  .action(() => {
    cronApply();
  });

cronCmd
  .command('show')
  .alias('cat')
  .description('Show generated crontab')
  .action(() => {
    cronShow();
  });

cronCmd.action(() => {
  cronHelp();
});

// --- run ---
program
  .command('run <project> <command...>')
  .alias('r')
  .description('Run command via assigned agent')
  .action((project: string, cmdParts: string[]) => {
    run(project, cmdParts.join(' '));
  });

// --- session ---
program
  .command('session <project> [extra...]')
  .alias('s')
  .description('Start interactive session')
  .action((project: string, extra: string[]) => {
    session(project, extra);
  });

// --- status ---
program
  .command('status')
  .alias('st')
  .description('Show all project status')
  .action(() => {
    status();
  });

// --- briefing ---
program
  .command('briefing')
  .alias('b')
  .description('Generate daily briefing')
  .action(() => {
    briefing();
  });

// --- cleanup ---
program
  .command('cleanup')
  .description('Archive old memory')
  .action(() => {
    cleanup();
  });

// --- notify ---
program
  .command('notify <message...>')
  .alias('n')
  .description('Send Telegram notification')
  .action((msgParts: string[]) => {
    notify(msgParts.join(' '));
  });

// --- uninstall ---
program
  .command('uninstall')
  .description('Uninstall agents-hive CLI')
  .action(() => {
    uninstall();
  });

// Custom help
program.addHelpText(
  'after',
  `
${Y}Agents${N}  claude (coding/design), gemini (research), codex (async tasks)
${Y}Auth${N}    Subscription login — no API keys needed
`,
);

program.parse();
