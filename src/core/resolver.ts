/**
 * YADA Resolver Module
 * Resolves graph into ordered levels with parallel grouping
 */

import { Graph, Yadasmith, YadasmithLevel, YadasmithEntry, ResolveResult, ParsedDP } from '../types/dp';
import { buildGraph, detectCycles, getSortedLevels, getNode } from './graph';

/**
 * Resolve graph to Yadasmith format (levels with parallel DPs)
 */
export function resolve(dps: ParsedDP[], verbose = false): ResolveResult {
  const result: ResolveResult = {
    yadasmith: createEmptyYadasmith(),
    errors: [],
    warnings: [],
  };

  if (dps.length === 0) {
    result.warnings.push('No DPs found to compile');
    return result;
  }

  // Build graph
  const graph = buildGraph(dps);
  
  if (verbose) {
    console.log(`Graph built with ${graph.nodes.size} nodes`);
  }

  // Detect cycles
  const cycleCheck = detectCycles(graph);
  if (!cycleCheck.valid) {
    result.errors.push(...cycleCheck.errors);
    return result;
  }

  // Get sorted levels
  const levels = getSortedLevels(graph);
  
  if (verbose) {
    console.log(`Found ${levels.length} execution levels`);
  }

  // Build Yadasmith levels
  const yadasmithLevels: YadasmithLevel[] = [];
  let entryIndex = 1;

  for (const levelNum of levels) {
    const levelDps: YadasmithEntry[] = [];
    const levelNodes = graph.levels.get(levelNum) || [];

    for (const nodeId of levelNodes) {
      const node = getNode(graph, nodeId);
      if (node) {
        const entry: YadasmithEntry = {
          ref: node.dp.name,
          id: nodeId,
          status: 'pending',
          level: levelNum,
        };
        levelDps.push(entry);
        entryIndex++;
      }
    }

    yadasmithLevels.push({
      level: levelNum,
      dps: levelDps,
    });
  }

  result.yadasmith = {
    version: '1.0.0',
    compiledAt: new Date().toISOString(),
    levels: yadasmithLevels,
  };

  // Sort by priority within each level (for deterministic ordering)
  sortByPriority(result.yadasmith, dps);

  if (verbose) {
    console.log(`Compiled ${entryIndex - 1} tasks across ${yadasmithLevels.length} levels`);
  }

  return result;
}

/**
 * Create empty Yadasmith structure
 */
function createEmptyYadasmith(): Yadasmith {
  return {
    version: '1.0.0',
    compiledAt: new Date().toISOString(),
    levels: [],
  };
}

/**
 * Sort entries within each level by priority (higher priority first)
 * For same priority, sort alphabetically
 */
function sortByPriority(yadasmith: Yadasmith, dps: ParsedDP[]): void {
  const priorityMap = new Map<string, number>();
  
  for (const dp of dps) {
    priorityMap.set(dp.id, dp.priority || 0);
  }

  for (const level of yadasmith.levels) {
    level.dps.sort((a, b) => {
      const priorityA = priorityMap.get(a.id) || 0;
      const priorityB = priorityMap.get(b.id) || 0;
      
      // Higher priority first
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }
      
      // Alphabetical for same priority
      return a.id.localeCompare(b.id);
    });
  }
}

/**
 * Get all task IDs in order (flat list)
 */
export function getFlatTaskOrder(yadasmith: Yadasmith): string[] {
  const order: string[] = [];
  
  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      order.push(entry.id);
    }
  }
  
  return order;
}

/**
 * Get task by ID
 */
export function getTaskById(yadasmith: Yadasmith, id: string): YadasmithEntry | undefined {
  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      if (entry.id === id) {
        return entry;
      }
    }
  }
  return undefined;
}

/**
 * Get task level
 */
export function getTaskLevel(yadasmith: Yadasmith, id: string): number | undefined {
  const entry = getTaskById(yadasmith, id);
  return entry?.level;
}

/**
 * Count completed tasks
 */
export function countCompleted(yadasmith: Yadasmith): number {
  let count = 0;
  
  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      if (entry.status === 'completed') {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Count pending tasks
 */
export function countPending(yadasmith: Yadasmith): number {
  let count = 0;
  
  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      if (entry.status === 'pending') {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Check if all tasks are completed
 */
export function isFullyCompleted(yadasmith: Yadasmith): boolean {
  return countPending(yadasmith) === 0;
}

/**
 * Get next task (first pending)
 */
export function getNextTask(yadasmith: Yadasmith): YadasmithEntry | undefined {
  for (const level of yadasmith.levels) {
    for (const entry of level.dps) {
      if (entry.status === 'pending') {
        return entry;
      }
    }
  }
  return undefined;
}

/**
 * Get tasks at a specific level
 */
export function getTasksAtLevel(yadasmith: Yadasmith, level: number): YadasmithEntry[] {
  const found = yadasmith.levels.find(l => l.level === level);
  return found?.dps || [];
}

/**
 * Get max level
 */
export function getMaxLevel(yadasmith: Yadasmith): number {
  if (yadasmith.levels.length === 0) {
    return 0;
  }
  return Math.max(...yadasmith.levels.map(l => l.level));
}

