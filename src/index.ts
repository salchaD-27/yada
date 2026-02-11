/**
 * YADA - Yet Another Designing Assistant
 * A deterministic DAG orchestration library with CLI interface
 */

// Core modules
export * from './types/dp';
export { parseAll, parseByName } from './core/parser';
export { validateAll, validateDP } from './core/validator';
export { resolve } from './core/resolver';
export { readYadasmith, writeYadasmith, getStatus } from './core/state';

// CLI
export { runCli } from './cli/index';

// Version
export const VERSION = '1.0.0';

