/**
 * YADA CLI Entry Point
 * Routes commands and handles arguments
 */

import * as path from 'path';
import * as fs from 'fs';
import { compile } from './commands/compile';
import { check } from './commands/check';
import { mark } from './commands/mark';
import { status } from './commands/status';
import { reset } from './commands/reset';
import { CliOptions } from '../types/dp';

/**
 * Get project root directory
 */
function getProjectRoot(): string {
  const possiblePaths = [
    process.cwd(),
    path.join(process.cwd(), 'yada'),
    path.dirname(process.cwd()),
  ];

  for (const p of possiblePaths) {
    const dpsPath = path.join(p, 'dps');
    try {
      const stat = fs.statSync(dpsPath);
      if (stat.isDirectory()) {
        return p;
      }
    } catch {
      // Continue checking other paths
    }
  }

  return process.cwd();
}

/**
 * Display version
 */
function showVersion(): void {
  try {
    const pkg = require('../../package.json');
    console.log(`YADA version ${pkg.version}`);
  } catch {
    console.log('YADA version unknown');
  }
}

/**
 * Display help
 */
function showHelp(): void {
  console.log(`
YADA (Yet Another Designing Assistant) - Workflow Graph Engine

Usage: yada [options] [command]

Options:
  -v, --version    Show version
  -h, --help       Show help
  -V, --verbose    Verbose output

Commands:
  compile          Compile DPs into executable workflow (default)
  --check-dp <dp>  Validate specific DP
  --check-dps      Validate all DPs
  --mark <id>      Mark task as completed
  status           Show workflow status
  reset            Reset all tasks to pending

Examples:
  yada compile
  yada --check-dp dp1.yada
  yada --mark task_001
  yada status --verbose

For more information, see README.md
`);
}

/**
 * Main CLI handler
 */
export function runCli(args: string[]): void {
  const projectRoot = getProjectRoot();

  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-v' || arg === '--version') {
      showVersion();
      return;
    }

    if (arg === '-h' || arg === '--help') {
      showHelp();
      return;
    }

    if (arg === '-V' || arg === '--verbose') {
      options.verbose = true;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--check-dp') {
      options.command = 'check';
      options.dpName = args[++i];
      continue;
    }

    if (arg === '--check-dps') {
      options.command = 'check';
      continue;
    }

    if (arg === '--mark') {
      options.command = 'mark';
      options.id = args[++i];
      continue;
    }

    if (arg === 'compile' || arg === 'status' || arg === 'reset') {
      options.command = arg;
      continue;
    }
  }

  const command = options.command || 'compile';

  switch (command) {
    case 'compile':
      compile(projectRoot, options);
      break;
    case 'check':
      check(projectRoot, options);
      break;
    case 'mark':
      if (!options.id) {
        console.error('Error: Task ID required');
        console.error('Usage: yada --mark <task_id>');
        process.exit(1);
      }
      mark(projectRoot, { id: options.id, verbose: options.verbose });
      break;
    case 'status':
      status(projectRoot, options);
      break;
    case 'reset':
      reset(projectRoot, options);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}
