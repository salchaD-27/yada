/**
 * YADA Status Command
 * Shows current status of completed/pending tasks
 */

import { getStatus, readYadasmith } from '../../core/state';
import { StatusOptions, Yadasmith } from '../../types/dp';

/**
 * Format status with colors and progress bar
 */
function formatStatus(yadasmith: Yadasmith): void {
  const stats = getStatus(process.cwd());

  // Header with title
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║              📋 YADA Workflow Status                 ║');
  console.log('╠══════════════════════════════════════════════════════╣');

  // Progress bar
  const barLength = 40;
  const filledLength = Math.round((stats.completed / stats.total) * barLength) || 0;
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(`║  Progress: [${bar}] ${stats.completed}/${stats.total} (${stats.percentComplete}%)`.padEnd(51) + '║');

  // Stats row
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Completed: ${stats.completed}    ⏳ Pending: ${stats.pending}    📊 Total: ${stats.total}`.padEnd(51) + '║');

  // Next task
  if (stats.nextTask) {
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  📌 Next Task: ${stats.nextTask.ref}`.padEnd(51) + '║');
    console.log(`║     ID: ${stats.nextTask.id}`.padEnd(51) + '║');
  }

  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  // Task breakdown by level
  console.log('📁 Task Breakdown by Level:');
  console.log('─'.repeat(52));

  for (const level of yadasmith.levels) {
    const levelCompleted = level.dps.filter(e => e.status === 'completed').length;
    const levelTotal = level.dps.length;

    console.log(`\n  Level ${level.level} (${levelCompleted}/${levelTotal} completed)`);

    for (const entry of level.dps) {
      const statusIcon = entry.status === 'completed' ? '✅' :
                         entry.status === 'in_progress' ? '🔄' :
                         entry.status === 'skipped' ? '⏭️' : '○';

      const line = `     ${statusIcon} ${entry.id.padEnd(25)} ${entry.ref}`;
      console.log(line);

      if (entry.status === 'pending' && !stats.nextTask) {
        console.log(`         └─ Next up in this level`);
      }
    }
  }

  console.log('\n' + '─'.repeat(52));
  console.log('💡 Tip: Use "yada --mark <task_id>" to mark a task as done');
  console.log('💡 Use "yada compile -V" to regenerate the graph visualization\n');
}

/**
 * Execute status command
 */
export function status(rootDir: string, options: StatusOptions = {}): void {
  const { verbose = false, json = false } = options;

  const yadasmith = readYadasmith(rootDir);

  if (!yadasmith) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                                                      ║');
    console.log('║         ⚠️  No workflow found                        ║');
    console.log('║                                                      ║');
    console.log('║   Run "yada compile" to generate your workflow      ║');
    console.log('║                                                      ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    return;
  }

  if (json) {
    const stats = getStatus(rootDir, verbose);
    console.log(JSON.stringify({
      workflow: {
        version: yadasmith.version,
        compiledAt: yadasmith.compiledAt,
        totalLevels: yadasmith.levels.length,
      },
      progress: stats,
      tasks: yadasmith.levels.flatMap(level =>
        level.dps.map(dp => ({
          id: dp.id,
          ref: dp.ref,
          status: dp.status,
          level: dp.level,
        }))
      ),
    }, null, 2));
    return;
  }

  formatStatus(yadasmith);
}

