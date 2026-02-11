/**
 * YADA Check Command
 * Validates DPs for errors and missing dependencies
 */

import { validateAll, validateDPFile, validateDP } from '../../core/validator';
import { parseAll, parseByName } from '../../core/parser';
import { CheckOptions } from '../../types/dp';

/**
 * Execute check command
 */
export function check(rootDir: string, options: CheckOptions = {}): void {
  const { dpName, verbose = false } = options;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║              🔍 YADA Validator                        ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  if (dpName) {
    checkSingleDP(rootDir, dpName, verbose);
  } else {
    checkAllDPs(rootDir, verbose);
  }
}

/**
 * Check a single DP
 */
function checkSingleDP(rootDir: string, dpName: string, verbose: boolean): void {
  console.log(`📁 Checking: ${dpName}`);

  const fileResult = validateDPFile(rootDir, dpName);
  if (!fileResult.valid) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                    ❌ Failed                          ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    fileResult.errors.forEach(e => console.log(`║   ${'✗ ' + e}`.padEnd(48) + '║'));
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  const dp = parseByName(rootDir, dpName);
  if (!dp) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                    ❌ Failed                          ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║   Failed to parse: ${dpName}`.padEnd(48) + '║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  const allDpsResult = parseAll(rootDir);
  const validationResult = validateDP(dp, allDpsResult.dps, verbose);

  if (!validationResult.valid) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                    ❌ Failed                          ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    validationResult.errors.forEach(e => console.log(`║   ${'✗ ' + e}`.padEnd(48) + '║'));
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  if (validationResult.warnings.length > 0) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                    ⚠️  Warnings                       ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    validationResult.warnings.forEach(w => console.log(`║   ${'⚠ ' + w}`.padEnd(48) + '║'));
    console.log('╚══════════════════════════════════════════════════════╝');
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║                    ✅ Valid                           ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   DP:        ${dp.name.padEnd(33)}║`);
  console.log(`║   ID:        ${dp.id.padEnd(33)}║`);
  console.log(`║   Nature:    ${dp.nature.padEnd(33)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
}

/**
 * Check all DPs
 */
function checkAllDPs(rootDir: string, verbose: boolean): void {
  console.log(`📁 Scanning: ${rootDir}`);

  const parseResult = parseAll(rootDir);

  if (parseResult.errors.length > 0) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                  ❌ Parse Errors                     ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    parseResult.errors.forEach(e => console.log(`║   ${'✗ ' + e}`.padEnd(48) + '║'));
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  if (parseResult.dps.length === 0) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                    ⚠️  Empty                         ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║   No DPs found in the dps/ directory              ║');
    console.log('║                                                      ║');
    console.log('║   Create .yada files to define your workflow      ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    return;
  }

  console.log(`   Found ${parseResult.dps.length} Design Prescriptions`);

  const validationResult = validateAll(parseResult.dps, verbose);

  if (!validationResult.valid) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                  ❌ Validation Failed                ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    validationResult.errors.forEach(e => console.log(`║   ${'✗ ' + e}`.padEnd(48) + '║'));
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(1);
  }

  if (validationResult.warnings.length > 0) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                    ⚠️  Warnings                       ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    validationResult.warnings.forEach(w => console.log(`║   ${'⚠ ' + w}`.padEnd(48) + '║'));
    console.log('╚══════════════════════════════════════════════════════╝');
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║                    ✅ All Valid                       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   Total DPs:    ${String(parseResult.dps.length).padEnd(33)}║`);
  console.log(`║   Validated:   ${String(parseResult.dps.length).padEnd(33)}║`);
  console.log(`║   Errors:       ${'0'.padEnd(33)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  console.log('');
  console.log('📋 Design Prescriptions:');
  console.log('─'.repeat(52));

  for (const dp of parseResult.dps) {
    const subdpCount = Object.keys(dp.subdps).filter(k => !isNaN(parseInt(k))).length;
    const deps = dp.dependencies?.length || 0;
    console.log(`   ✅ ${dp.id.padEnd(20)} ${dp.name.padEnd(15)} [${subdpCount} subDPs, ${deps} deps]`);
  }

  console.log('');
}

