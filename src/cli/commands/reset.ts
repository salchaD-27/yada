/**
 * YADA Reset Command
 * Resets all completed tasks to pending
 */

import { resetAll, hasYadasmith } from '../../core/state';
import { ResetOptions } from '../../types/dp';

/**
 * Execute reset command
 */
export function reset(rootDir: string, options: ResetOptions = {}): void {
  const { force = false, verbose = false } = options;

  if (!hasYadasmith(rootDir)) {
    console.log('No .yadasmith file found. Nothing to reset.');
    process.exit(0);
  }

  // If not force, ask for confirmation
  if (!force) {
    console.log('This will reset all completed tasks to pending.');
    console.log('Use --force to skip this confirmation.');
    process.exit(0);
  }

  const result = resetAll(rootDir, verbose);

  if (result.warnings.length > 0) {
    result.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
  }

  console.log('✓ All tasks reset to pending');
}

