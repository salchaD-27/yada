/**
 * Rollup Configuration for YADA NPM Package
 * Supports ESM, CJS, and IIFE builds with TypeScript
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// External dependencies that should not be bundled
const external = [
  'commander',
  'js-yaml',
];

// Package.json for version info (read as JSON)
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default [
  // ESM Build (modern Node.js/npm packages)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },
    external,
    plugins: [
      resolve({
        browser: false,
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        useTsconfigDeclarationDir: true,
        declarationDir: 'dist',
      }),
    ],
  },

  // CJS Build (Node.js CommonJS for backward compatibility)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      interop: 'auto',
    },
    external,
    plugins: [
      resolve({
        browser: false,
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        useTsconfigDeclarationDir: true,
        declarationDir: 'dist',
      }),
    ],
  },

  // CLI Build (Standalone executable for bin/yada.js)
  {
    input: 'src/cli/index.ts',
    output: {
      file: 'dist/cli/index.js',
      format: 'cjs',
      sourcemap: true,
      banner: '#!/usr/bin/env node',
    },
    external: [
      ...external,
      'path',
      'fs',
      'url',
    ],
    plugins: [
      resolve({
        browser: false,
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        useTsconfigDeclarationDir: true,
        declarationDir: 'dist',
      }),
    ],
  },

  // IIFE Build (Browser/simple usage with global variable)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/yada.min.js',
      format: 'iife',
      name: 'YADA',
      sourcemap: true,
      exports: 'named',
      globals: {
        'commander': 'commander',
        'js-yaml': 'jsyaml',
      },
    },
    external,
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        useTsconfigDeclarationDir: true,
        declarationDir: 'dist',
      }),
    ],
  },
];