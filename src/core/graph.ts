/**
 * YADA Graph Module
 * Builds adjacency list and detects cycles
 */

import { ParsedDP, Graph, GraphNode, ValidationResult } from '../types/dp';

/**
 * Build graph from parsed DPs
 */
export function buildGraph(dps: ParsedDP[]): Graph {
  const nodes = new Map<string, GraphNode>();
  const levels = new Map<number, string[]>();

  // Initialize nodes
  for (const dp of dps) {
    nodes.set(dp.id, {
      id: dp.id,
      dp,
      dependencies: [],
      dependents: [],
      level: 0,
    });
  }

  // Build edges (dependencies)
  for (const dp of dps) {
    const node = nodes.get(dp.id)!;
    
    // External dependencies from DP
    if (dp.dependencies) {
      for (const depId of dp.dependencies) {
        if (nodes.has(depId)) {
          const depNode = nodes.get(depId)!;
          node.dependencies.push(depId);
          depNode.dependents.push(dp.id);
        }
      }
    }
  }

  // Calculate topological levels (Kahn's algorithm approach)
  calculateLevels(nodes);

  // Group by levels
  for (const node of nodes.values()) {
    const levelNodes = levels.get(node.level) || [];
    levelNodes.push(node.id);
    levels.set(node.level, levelNodes);
  }

  return { nodes, levels };
}

/**
 * Calculate levels using BFS-based topological sort
 */
function calculateLevels(nodes: Map<string, GraphNode>): void {
  const inDegree = new Map<string, number>();
  
  // Calculate in-degrees
  for (const [id, node] of nodes) {
    inDegree.set(id, node.dependencies.length);
  }

  // Start with nodes that have no dependencies (level 0)
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
      const node = nodes.get(id)!;
      node.level = 1;
    }
  }

  // BFS to assign levels
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentNode = nodes.get(currentId)!;

    for (const dependentId of currentNode.dependents) {
      const dependentNode = nodes.get(dependentId)!;
      const currentDegree = inDegree.get(dependentId)! - 1;
      inDegree.set(dependentId, currentDegree);

      // Level is max of dependencies + 1
      dependentNode.level = Math.max(dependentNode.level, currentNode.level + 1);

      if (currentDegree === 0) {
        queue.push(dependentId);
      }
    }
  }
}

/**
 * Detect cycles in the graph
 */
export function detectCycles(graph: Graph): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart).concat([nodeId]);
      result.errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
      result.valid = false;
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const node = graph.nodes.get(nodeId);
    if (node) {
      for (const depId of node.dependencies) {
        if (dfs(depId)) {
          return true;
        }
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
    return false;
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        break;
      }
    }
  }

  return result;
}

/**
 * Get nodes at a specific level
 */
export function getNodesAtLevel(graph: Graph, level: number): GraphNode[] {
  const nodeIds = graph.levels.get(level) || [];
  return nodeIds.map(id => graph.nodes.get(id)!).filter(Boolean);
}

/**
 * Get all levels sorted
 */
export function getSortedLevels(graph: Graph): number[] {
  return Array.from(graph.levels.keys()).sort((a, b) => a - b);
}

/**
 * Check if graph is empty
 */
export function isEmpty(graph: Graph): boolean {
  return graph.nodes.size === 0;
}

/**
 * Get node by ID
 */
export function getNode(graph: Graph, id: string): GraphNode | undefined {
  return graph.nodes.get(id);
}

/**
 * Get all node IDs
 */
export function getAllNodeIds(graph: Graph): string[] {
  return Array.from(graph.nodes.keys());
}

