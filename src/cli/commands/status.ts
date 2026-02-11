/**
 * YADA Status Command
 * Shows current status of completed/pending tasks
 */

import { getStatus, readYadasmith } from '../../core/state';
import { StatusOptions } from '../../types/dp';

/**
 * Execute status command
 */
export function status(rootDir: string, options: StatusOptions = {}): void {
  const { verbose = false, json = false } = options;

  const yadasmith = readYadasmith(rootDir);
  
  if (!yadasmith) {
    console.log('No .yadasmith file found.');
    console.log('Run "yada compile" to generate workflow.');
    process.exit(0);
  }

  const stats = getStatus(rootDir, verbose);

  if (json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  // Display status
  console.log('Workflow Status');
  console.log('='.repeat(40));
  console.log(`Progress: ${stats.completed}/${stats.total} (${stats.percentComplete}%)`);
  
  if (stats.nextTask) {
    console.log(`Next: ${stats.nextTask.id} (${stats.nextTask.ref})`);
  }

  console.log('\nTask Status:');
  console.log('-'.repeat(40));

  for (const level of yadasmith.levels) {
    console.log(`Level ${level.level}:`);
    for (const entry of level.dps) {
      const statusIcon = entry.status === 'completed' ? '✓' : '○';
      console.log(`  ${statusIcon} ${entry.id} (${entry.ref})`);
    }
  }
}

