/**
 * YADA Compile Command
 * Parses all DPs, validates, resolves dependencies, and writes .yadasmith
 */

import { resolve } from '../../core/resolver';
import { validateAll } from '../../core/validator';
import { parseAll } from '../../core/parser';
import { writeYadasmith } from '../../core/state';
import { CompileOptions } from '../../types/dp';

/**
 * Spinner animation for progress
 */
function showSpinner(message: string, done: boolean = false): void {
  const spins = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${spins[i++ % spins.length]} ${message}`);
    if (done) {
      clearInterval(interval);
      process.stdout.write(`\r✓ ${message}\n`);
    }
  }, 80);
}

/**
 * Print section header
 */
function printSection(title: string): void {
  console.log('');
  console.log('─'.repeat(52));
  console.log(`  ${title}`);
  console.log('─'.repeat(52));
}

/**
 * Execute compile command
 */
export async function compile(rootDir: string, options: CompileOptions = {}): Promise<void> {
  const { force = false, verbose = false } = options;

  // Welcome header
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         ⚡ YADA Workflow Compiler ⚡                 ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`📁 Project: ${rootDir.split('/').pop() || rootDir}`);
  console.log(`🕐 Started: ${new Date().toLocaleTimeString()}`);

  // Parse all DPs
  printSection('📖 Parsing Design Prescriptions');
  const parseResult = parseAll(rootDir);

  if (parseResult.errors.length > 0) {
    console.log('');
    console.log('❌ Parse Errors:');
    parseResult.errors.forEach(e => console.log(`   • ${e}`));
    process.exit(1);
  }

  if (parseResult.dps.length === 0) {
    console.log('');
    console.log('⚠️  No DPs found in dps/ directory.');
    console.log('   Create .yada files in dps/ to get started.');
    process.exit(0);
  }

  console.log(`   Found ${parseResult.dps.length} Design Prescriptions:`);
  for (const dp of parseResult.dps) {
    const subdpCount = Object.keys(dp.subdps).filter(k => !isNaN(parseInt(k))).length;
    console.log(`   ├── ${dp.id.padEnd(25)} ${dp.name.padEnd(20)} [${subdpCount} subDPs]`);
  }

  // Validate all DPs
  printSection('✅ Validating Dependencies');
  const validationResult = validateAll(parseResult.dps, verbose);

  if (!validationResult.valid) {
    console.log('');
    console.log('❌ Validation Failed:');
    validationResult.errors.forEach(e => console.log(`   ✗ ${e}`));
    process.exit(1);
  }

  console.log(`   ✓ All ${parseResult.dps.length} DPs validated successfully`);

  if (validationResult.warnings.length > 0) {
    console.log('');
    console.log('⚠️  Warnings:');
    validationResult.warnings.forEach(w => console.log(`   ⚠ ${w}`));
  }

  // Resolve graph
  printSection('🔗 Resolving Dependency Graph');
  const resolveResult = resolve(parseResult.dps, verbose);

  if (resolveResult.errors.length > 0) {
    console.log('');
    console.log('❌ Resolution Failed:');
    resolveResult.errors.forEach(e => console.log(`   ✗ ${e}`));
    process.exit(1);
  }

  const totalTasks = resolveResult.yadasmith.levels.reduce(
    (sum, level) => sum + level.dps.length,
    0
  );
  const totalLevels = resolveResult.yadasmith.levels.length;

  console.log(`   Graph built with ${totalTasks} tasks across ${totalLevels} levels`);

  // Show execution order
  console.log('');
  console.log('📊 Execution Order:');

  for (const level of resolveResult.yadasmith.levels) {
    const parallel = level.dps.length > 1;
    const icon = parallel ? '⬡' : '○';
    console.log(`   ${icon} Level ${level.level}:`);

    for (let i = 0; i < level.dps.length; i++) {
      const dp = level.dps[i];
      const prefix = i === level.dps.length - 1 ? '└' : '├';
      const connector = i === level.dps.length - 1 ? ' ' : '│';
      console.log(`   ${prefix}   ${connector} ${dp.id.padEnd(20)} ${dp.ref}`);
    }
  }

  // Write output files
  printSection('💾 Writing Output Files');

  // Write .yadasmith
  writeYadasmith(rootDir, resolveResult.yadasmith);
  console.log('   ✓ .yadasmith');

  // Write outputs
  console.log('');

  // Success summary
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         ✅ Compilation Successful!                   ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   Tasks:    ${String(totalTasks).padEnd(35)}║`);
  console.log(`║   Levels:   ${String(totalLevels).padEnd(35)}║`);
  console.log(`║   DPs:      ${String(parseResult.dps.length).padEnd(35)}║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║   Outputs:                                              ║');
  console.log('║     • .yadasmith  (workflow state)                    ║');
  console.log('║     • .yadamap    (graph documentation)              ║');
  console.log('║     • graph.svg   (visual dependency graph)          ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Review the dependency graph (graph.svg)');
  console.log('   2. Use "yada status" to track progress');
  console.log('   3. Use "yada --mark <id>" to mark tasks as done');
  console.log('');
}

