/**
 * YADA State Module
 * Manages .yadasmith file persistence
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Yadasmith, YadasmithEntry, ValidationResult } from '../types/dp';

const YADASMITH_FILE = '.yadasmith';

/**
 * Read .yadasmith file
 */
export function readYadasmith(rootDir: string): Yadasmith | null {
  const filePath = path.join(rootDir, YADASMITH_FILE);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content) as Yadasmith;
    return data;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

/**
 * Write .yadasmith file
 */
export function writeYadasmith(rootDir: string, yadasmith: Yadasmith): void {
  const filePath = path.join(rootDir, YADASMITH_FILE);
  
  try {
    const content = yaml.dump(yadasmith, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

/**
 * Mark tasks as completed up to a specific ID
 */
export function markUntil(rootDir: string, targetId: string, verbose = false): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const yadasmith = readYadasmith(rootDir);
  
  if (!yadasmith) {
    result.errors.push('No .yadasmith file found. Run "yada compile" first.');
    result.valid = false;
    return result;
  }

  const targetTask = findTask(yadasmith, targetId);
  
  if (!targetTask) {
    result.errors.push(`Task not found: ${targetId}`);
    result.valid = false;
    return result;
  }

  let foundTarget = false;
  let completed = 0;

  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      if (foundTarget) {
        if (entry.status === 'completed') {
          entry.status = 'pending';
        }
      } else {
        entry.status = 'completed';
        completed++;
        if (entry.id === targetId) {
          foundTarget = true;
        }
      }
    }
  }

  yadasmith.compiledAt = new Date().toISOString();
  writeYadasmith(rootDir, yadasmith);

  if (verbose) {
    console.log(`Marked ${completed} tasks as completed up to '${targetId}'`);
  }

  return result;
}

/**
 * Mark a single task by ID
 */
export function markOne(rootDir: string, taskId: string, verbose = false): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const yadasmith = readYadasmith(rootDir);
  
  if (!yadasmith) {
    result.errors.push('No .yadasmith file found. Run "yada compile" first.');
    result.valid = false;
    return result;
  }

  const task = findTask(yadasmith, taskId);
  
  if (!task) {
    result.errors.push(`Task not found: ${taskId}`);
    result.valid = false;
    return result;
  }

  task.status = 'completed';
  yadasmith.compiledAt = new Date().toISOString();
  writeYadasmith(rootDir, yadasmith);

  if (verbose) {
    console.log(`Marked '${taskId}' as completed`);
  }

  return result;
}

/**
 * Reset all task statuses
 */
export function resetAll(rootDir: string, verbose = false): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const yadasmith = readYadasmith(rootDir);
  
  if (!yadasmith) {
    result.warnings.push('No .yadasmith file found. Nothing to reset.');
    return result;
  }

  let reset = 0;

  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      if (entry.status === 'completed') {
        entry.status = 'pending';
        reset++;
      }
    }
  }

  yadasmith.compiledAt = new Date().toISOString();
  writeYadasmith(rootDir, yadasmith);

  if (verbose) {
    console.log(`Reset ${reset} tasks to pending`);
  }

  return result;
}

/**
 * Get status summary
 */
export function getStatus(rootDir: string, verbose = false): {
  completed: number;
  pending: number;
  total: number;
  percentComplete: number;
  nextTask?: YadasmithEntry;
} {
  const yadasmith = readYadasmith(rootDir);
  
  if (!yadasmith) {
    return { completed: 0, pending: 0, total: 0, percentComplete: 0 };
  }

  let completed = 0;
  let total = 0;
  let nextTask: YadasmithEntry | undefined;

  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      total++;
      if (entry.status === 'completed') {
        completed++;
      } else if (!nextTask) {
        nextTask = entry;
      }
    }
  }

  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (verbose && yadasmith) {
    console.log(`Status: ${completed}/${total} completed (${percentComplete}%)`);
    if (nextTask) {
      console.log(`Next: ${nextTask.id} (${nextTask.ref})`);
    }
  }

  return {
    completed,
    pending: total - completed,
    total,
    percentComplete,
    nextTask,
  };
}

/**
 * Find a task by ID
 */
function findTask(yadasmith: Yadasmith, taskId: string): YadasmithEntry | undefined {
  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      if (entry.id === taskId) {
        return entry;
      }
    }
  }
  return undefined;
}

/**
 * Check if .yadasmith exists
 */
export function hasYadasmith(rootDir: string): boolean {
  const filePath = path.join(rootDir, YADASMITH_FILE);
  return fs.existsSync(filePath);
}

/**
 * Get file path
 */
export function getYadasmithPath(rootDir: string): string {
  return path.join(rootDir, YADASMITH_FILE);
}

