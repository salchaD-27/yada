/**
 * YADA Type Definitions
 * Defines all TypeScript interfaces for the YADA workflow graph engine
 */

// DP (Design Prescription) Types
export type DPNature = 'module' | 'standard';
export type DPType = 'specification' | 'dependency';
export type SubDPNature = 'optional' | 'required';
export type TaskStatus = 'pending' | 'completed' | 'in_progress' | 'skipped';

/**
 * SubDP (Sub-Design Prescription)
 * Represents a sub-task within a DP
 */
export interface SubDP {
  name: string;
  type: DPType;
  nature?: SubDPNature; // Only for type='dependency'
  description: string;
  workflow?: string[]; // Only for type='specification'
  dependencies?: string[]; // Only for type='dependency' or explicit deps
  intents?: string[];
}

/**
 * SubDPs container
 */
export interface SubDPs {
  order: boolean;
  [key: number]: SubDP;
}

/**
 * DP (Design Prescription)
 * Represents a node in the workflow graph
 */
export interface DP {
  name: string;
  nature: DPNature;
  phase?: string;
  priority: number;
  description: string;
  subdps: SubDPs;
  // External dependencies (DP references)
  dependencies?: string[];
}

/**
 * Parsed DP with metadata
 */
export interface ParsedDP extends DP {
  id: string; // filename without .yada
  filePath: string;
}

/**
 * Yadasmith Entry
 * Represents a single task in the compiled workflow
 */
export interface YadasmithEntry {
  ref: string; // DP name
  id: string; // Unique identifier (e.g., dp1, dp2)
  status: TaskStatus;
  level?: number; // Execution level (for parallel grouping)
}

/**
 * Yadasmith Level
 * Represents a level of parallelizable DPs
 */
export interface YadasmithLevel {
  level: number;
  dps: YadasmithEntry[];
}

/**
 * Yadasmith
 * The compiled workflow output file
 */
export interface Yadasmith {
  version: string;
  compiledAt: string;
  levels: YadasmithLevel[];
}

/**
 * Graph Node
 */
export interface GraphNode {
  id: string;
  dp: ParsedDP;
  dependencies: string[]; // IDs this node depends on
  dependents: string[]; // IDs that depend on this node
  level: number; // Topological level
}

/**
 * Graph
 */
export interface Graph {
  nodes: Map<string, GraphNode>;
  levels: Map<number, string[]>; // level -> node IDs
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * CLI Command Options
 */
export interface CompileOptions {
  force?: boolean;
  verbose?: boolean;
}

export interface CheckOptions {
  dpName?: string;
  verbose?: boolean;
}

export interface MarkOptions {
  id: string;
  verbose?: boolean;
}

export interface StatusOptions {
  verbose?: boolean;
  json?: boolean;
}

export interface ResetOptions {
  force?: boolean;
  verbose?: boolean;
}

/**
 * Combined CLI Options
 */
export interface CliOptions {
  command?: string;
  force?: boolean;
  verbose?: boolean;
  json?: boolean;
  dpName?: string;
  id?: string;
}

/**
 * Parse Result
 */
export interface ParseResult {
  dps: ParsedDP[];
  errors: string[];
}

/**
 * Resolve Result
 */
export interface ResolveResult {
  yadasmith: Yadasmith;
  errors: string[];
  warnings: string[];
}

