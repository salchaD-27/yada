#!/usr/bin/env node

/**
 * YADA CLI Entry Point
 * Uses the bundled CLI from rollup for faster startup
 */

const { runCli } = require('../dist/cli/index.js');
runCli(process.argv.slice(2));
