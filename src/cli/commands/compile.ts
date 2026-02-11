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
 * Execute compile command
 */
export function compile(rootDir: string, options: CompileOptions = {}): void {
  const { force = false, verbose = false } = options;

  if (verbose) {
    console.log('YADA Compile Starting...');
    console.log(`Root directory: ${rootDir}`);
  }

  // Parse all DPs
  if (verbose) {
    console.log('Parsing DPs...');
  }
  const parseResult = parseAll(rootDir);

  if (parseResult.errors.length > 0) {
    console.error('Parse errors:');
    parseResult.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (parseResult.dps.length === 0) {
    console.log('No DPs found in dps/ directory.');
    console.log('Create .yada files in dps/ to get started.');
    process.exit(0);
  }

  if (verbose) {
    console.log(`Found ${parseResult.dps.length} DPs`);
  }

  // Validate all DPs
  if (verbose) {
    console.log('Validating DPs...');
  }
  const validationResult = validateAll(parseResult.dps, verbose);

  if (!validationResult.valid) {
    console.error('Validation errors:');
    validationResult.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (validationResult.warnings.length > 0) {
    validationResult.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
  }

  // Resolve graph
  if (verbose) {
    console.log('Resolving dependency graph...');
  }
  const resolveResult = resolve(parseResult.dps, verbose);

  if (resolveResult.errors.length > 0) {
    console.error('Resolution errors:');
    resolveResult.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (resolveResult.warnings.length > 0) {
    resolveResult.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
  }

  // Write .yadasmith
  if (verbose) {
    console.log('Writing .yadasmith...');
  }
  writeYadasmith(rootDir, resolveResult.yadasmith);

  // Summary
  const totalTasks = resolveResult.yadasmith.levels.reduce(
    (sum, level) => sum + level.dps.length,
    0
  );
  const totalLevels = resolveResult.yadasmith.levels.length;

  console.log('✓ Compilation successful');
  console.log(`  Tasks: ${totalTasks}`);
  console.log(`  Levels: ${totalLevels}`);
  console.log(`  Output: .yadasmith`);

  // Show level breakdown
  if (verbose || totalLevels <= 5) {
    console.log('\nExecution Levels:');
    for (const level of resolveResult.yadasmith.levels) {
      const tasks = level.dps.map(d => d.id).join(', ');
      console.log(`  Level ${level.level}: ${tasks}`);
    }
  }
}

