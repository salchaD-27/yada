/**
 * YADA Validator Module
 * Validates DPs and their dependencies
 */

import * as path from 'path';
import { ParsedDP, ValidationResult } from '../types/dp';
import { parseDP } from './parser';

const DPS_DIRECTORY = 'dps';

/**
 * Validate a single DP
 */
export function validateDP(dp: ParsedDP, allDps: ParsedDP[], verbose = false): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check for duplicate names
  const duplicates = allDps.filter(d => d.name === dp.name && d.id !== dp.id);
  if (duplicates.length > 0) {
    result.errors.push(`DP name '${dp.name}' is duplicated in: ${duplicates.map(d => d.id).join(', ')}`);
    result.valid = false;
  }

  // Check ID matches filename
  const expectedId = path.basename(dp.filePath, '.yada');
  if (dp.id !== expectedId) {
    result.warnings.push(`DP ID '${dp.id}' doesn't match expected filename '${expectedId}'`);
  }

  // Validate external dependencies
  if (dp.dependencies) {
    for (const depId of dp.dependencies) {
      const exists = allDps.some(d => d.id === depId);
      if (!exists) {
        result.errors.push(`DP '${dp.id}' depends on non-existent DP: ${depId}`);
        result.valid = false;
      }
    }
  }

  // Validate subdps
  validateSubDPs(dp, result, allDps);

  if (verbose && result.valid) {
    console.log(`✓ ${dp.id}: Valid`);
  }

  return result;
}

/**
 * Validate subdps
 */
function validateSubDPs(dp: ParsedDP, result: ValidationResult, allDps: ParsedDP[]): void {
  const subdpIds: number[] = [];
  const subdpNames: string[] = [];

  for (const key of Object.keys(dp.subdps)) {
    const num = parseInt(key, 10);
    if (!isNaN(num) && num > 0) {
      subdpIds.push(num);
      const subdp = dp.subdps[num];
      if (subdp) {
        subdpNames.push(subdp.name);
      }
    }
  }

  // Check for duplicate subdp names
  const nameSet = new Set(subdpNames);
  if (nameSet.size !== subdpNames.length) {
    result.errors.push(`DP '${dp.id}' has duplicate subdp names`);
    result.valid = false;
  }

  // Validate subdp dependencies
  for (const num of subdpIds) {
    const subdp = dp.subdps[num];
    if (!subdp) continue;

    if (subdp.dependencies) {
      for (const dep of subdp.dependencies) {
        const isLocalSubdp = subdpNames.includes(dep);
        const isExternalDP = allDps.some(d => d.id === dep);

        // Check for cross-DP subdp dependency format: "dpName:subdpName"
        let isCrossDPSubdp = false;
        if (dep.includes(':')) {
          const [dpName, subdpName] = dep.split(':');
          const targetDP = allDps.find(d => d.name === dpName);
          if (targetDP) {
            for (const key of Object.keys(targetDP.subdps)) {
              const sNum = parseInt(key, 10);
              if (!isNaN(sNum) && sNum > 0) {
                const targetSubdp = targetDP.subdps[sNum];
                if (targetSubdp && targetSubdp.name === subdpName) {
                  isCrossDPSubdp = true;
                  break;
                }
              }
            }
          }
        }

        if (!isLocalSubdp && !isExternalDP && !isCrossDPSubdp) {
          result.errors.push(`Subdp '${subdp.name}' in '${dp.id}' depends on non-existent: ${dep}`);
          result.valid = false;
        }
      }
    }



    if (subdp.type === 'dependency' && !subdp.nature) {
      result.warnings.push(`Subdp '${subdp.name}' is type 'dependency' but missing 'nature' field`);
    }

    if (subdp.type === 'specification' && (!subdp.workflow || subdp.workflow.length === 0)) {
      result.warnings.push(`Subdp '${subdp.name}' is type 'specification' but has no workflow steps`);
    }
  }

  if (dp.subdps.order && subdpIds.length > 1) {
    const max = Math.max(...subdpIds);
    if (subdpIds.length !== max) {
      result.warnings.push(`DP '${dp.id}' has order=true but missing subdp numbers (found: ${subdpIds.join(', ')}, expected: 1-${max})`);
    }
  }
}

/**
 * Validate all DPs
 */
export function validateAll(dps: ParsedDP[], verbose = false): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (dps.length === 0) {
    result.warnings.push('No DPs to validate');
    return result;
  }

  if (verbose) {
    console.log(`Validating ${dps.length} DPs...`);
  }

  // Check for missing external dependencies
  const allDpIds = new Set(dps.map(d => d.id));

  for (const dp of dps) {
    if (dp.dependencies) {
      for (const depId of dp.dependencies) {
        if (!allDpIds.has(depId)) {
          result.errors.push(`DP '${dp.id}' depends on missing DP: ${depId}`);
          result.valid = false;
        }
      }
    }
  }

  // Validate each DP individually
  for (const dp of dps) {
    const dpResult = validateDP(dp, dps, verbose);
    result.valid = result.valid && dpResult.valid;
    result.errors.push(...dpResult.errors);
    result.warnings.push(...dpResult.warnings);
  }

  // Check for circular dependencies
  const sortedIds = Array.from(allDpIds);
  for (let i = 0; i < sortedIds.length; i++) {
    for (let j = i + 1; j < sortedIds.length; j++) {
      const dp1 = dps.find(d => d.id === sortedIds[i]);
      const dp2 = dps.find(d => d.id === sortedIds[j]);
      
      if (dp1 && dp2) {
        const dp1Dep = dp1.dependencies?.includes(sortedIds[j]);
        const dp2Dep = dp2.dependencies?.includes(sortedIds[i]);
        
        if (dp1Dep && dp2Dep) {
          result.errors.push(`Direct circular dependency between '${dp1.id}' and '${dp2.id}'`);
          result.valid = false;
        }
      }
    }
  }

  if (verbose) {
    if (result.valid) {
      console.log(`✓ All ${dps.length} DPs are valid`);
    } else {
      console.log(`✗ Validation failed with ${result.errors.length} errors`);
    }
  }

  return result;
}

/**
 * Validate DP file exists and can be parsed
 */
export function validateDPFile(rootDir: string, dpName: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const filePath = path.join(rootDir, DPS_DIRECTORY, `${dpName}.yada`);
  
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    result.errors.push(`DP file not found: ${filePath}`);
    result.valid = false;
    return result;
  }

  const dp = parseDP(filePath);
  if (!dp) {
    result.errors.push(`Failed to parse DP: ${dpName}`);
    result.valid = false;
  }

  return result;
}

