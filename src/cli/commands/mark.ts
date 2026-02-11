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
    console.error('Error: Task ID required');
    console.error('Usage: yada --mark <task_id>');
    process.exit(1);
  }

  // Check if task exists
  const yadasmith = readYadasmith(rootDir);
  if (!yadasmith) {
    console.error('Error: No .yadasmith file found. Run "yada compile" first.');
    process.exit(1);
  }

  const task = getTaskById(yadasmith, id);
  if (!task) {
    console.error(`Error: Task not found: ${id}`);
    console.error('Run "yada status" to see available tasks.');
    process.exit(1);
  }

  // Mark the task
  const result = markOne(rootDir, id, verbose);

  if (!result.valid) {
    console.error('Errors:');
    result.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log(`✓ Marked '${id}' as completed`);
}
