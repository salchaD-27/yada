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
  if (verbose) {
    console.log(`Checking DP: ${dpName}`);
  }

  const fileResult = validateDPFile(rootDir, dpName);
  if (!fileResult.valid) {
    console.error('Errors:');
    fileResult.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const dp = parseByName(rootDir, dpName);
  if (!dp) {
    console.error(`Failed to parse DP: ${dpName}`);
    process.exit(1);
    return;
  }

  const allDpsResult = parseAll(rootDir);
  const validationResult = validateDP(dp, allDpsResult.dps, verbose);

  if (!validationResult.valid) {
    console.error('Errors:');
    validationResult.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (validationResult.warnings.length > 0) {
    console.warn('Warnings:');
    validationResult.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
  }

  console.log(`✓ ${dpName}: Valid`);
}

/**
 * Check all DPs
 */
function checkAllDPs(rootDir: string, verbose: boolean): void {
  if (verbose) {
    console.log('Checking all DPs...');
  }

  const parseResult = parseAll(rootDir);

  if (parseResult.errors.length > 0) {
    console.error('Parse errors:');
    parseResult.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (parseResult.dps.length === 0) {
    console.log('No DPs found.');
    process.exit(0);
  }

  const validationResult = validateAll(parseResult.dps, verbose);

  if (!validationResult.valid) {
    console.error('Errors:');
    validationResult.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (validationResult.warnings.length > 0) {
    console.warn('Warnings:');
    validationResult.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
  }

  console.log(`✓ All ${parseResult.dps.length} DPs are valid`);
}

