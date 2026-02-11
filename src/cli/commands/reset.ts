/**
 * YADA Reset Command
 * Resets all completed tasks to pending
 */

import { resetAll, hasYadasmith, readYadasmith } from '../../core/state';
import { ResetOptions } from '../../types/dp';

/**
 * Execute reset command
 */
export function reset(rootDir: string, options: ResetOptions = {}): void {
  const { force = false, verbose = false } = options;

  if (!hasYadasmith(rootDir)) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                    ⚠️  Info                          ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║   No workflow found to reset                      ║');
    console.log('║                                                      ║');
    console.log('║   Run "yada compile" first to generate workflow   ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    return;
  }

  // Show warning if not forced
  if (!force) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║              ⚠️  Confirmation Required             ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║   This will reset ALL completed tasks to pending.  ║');
    console.log('║                                                      ║');
    console.log('║   This action CANNOT be undone!                    ║');
    console.log('║                                                      ║');
    console.log('║   Use "--force" to skip this confirmation          ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    return;
  }

  const yadasmith = readYadasmith(rootDir);
  const completedBefore = yadasmith?.levels.flatMap(l => l.dps).filter(d => d.status === 'completed').length || 0;

  const result = resetAll(rootDir, verbose);

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║              🔄 Workflow Reset                       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   Tasks Reset:    ${String(completedBefore).padEnd(28)}║`);
  console.log(`║   New Progress:   ${'0/' + String(yadasmith?.levels.flatMap(l => l.dps).length || 0).padEnd(28)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    result.warnings.forEach(w => console.log(`   ⚠ ${w}`));
    console.log('');
  }

  console.log('💡 Run "yada status" to see the reset progress');
  console.log('');
}

