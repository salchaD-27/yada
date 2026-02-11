/**
 * YADA Mark Command
 * Marks tasks as completed
 */

import { markUntil, markOne, readYadasmith } from '../../core/state';
import { getTaskById } from '../../core/resolver';
import { MarkOptions } from '../../types/dp';

/**
 * Execute mark command
 */
export function mark(rootDir: string, options: MarkOptions): void {
  const { id, verbose = false } = options;

  if (!id) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                     ⚠️  Error                         ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║   Task ID is required                                ║');
    console.log('║                                                      ║');
    console.log('║   Usage: yada --mark <task_id>                       ║');
    console.log('║                                                      ║');
    console.log('║   Run "yada status" to see available tasks           ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  // Check if task exists
  const yadasmith = readYadasmith(rootDir);
  if (!yadasmith) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                     ⚠️  Error                         ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║   No workflow found                                  ║');
    console.log('║                                                      ║');
    console.log('║   Run "yada compile" first to generate workflow       ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  const task = getTaskById(yadasmith, id);
  if (!task) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                     ⚠️  Error                         ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║   Task not found: ${id.padEnd(33)}║`);
    console.log('║                                                      ║');
    console.log('║   Run "yada status" to see available tasks           ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  // Mark the task
  const result = markOne(rootDir, id, verbose);

  if (!result.valid) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                     ❌ Error                          ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    result.errors.forEach(e => console.log(`║   ${e.padEnd(46)}║`));
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  // Success output
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║               ✅ Task Marked Complete                 ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   Task:    ${task.ref.padEnd(35)}║`);
  console.log(`║   ID:      ${task.id.padEnd(35)}║`);
  console.log(`║   Level:   ${String(task.level).padEnd(35)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  // Show next task hint
  const nextTask = yadasmith.levels
    .flatMap(l => l.dps)
    .find(d => d.status === 'pending');

  if (nextTask) {
    console.log(`💡 Next: Run "yada --mark ${nextTask.id}" to mark next task`);
  } else {
    console.log('🎉 All tasks completed! Great job!');
  }
  console.log('');
}

