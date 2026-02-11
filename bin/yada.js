#!/usr/bin/env node

/**
 * YADA CLI Entry Point
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { runCli } = await import(join(__dirname, '../dist/cli/index.js'));
runCli(process.argv.slice(2));