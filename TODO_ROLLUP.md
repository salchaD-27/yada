# Rollup Setup for NPM Publishing - TODO

## Phase 1: Install Dependencies ✓
- [x] Install rollup and related plugins
  - rollup
  - rollup-plugin-typescript2
  - @rollup/plugin-node-resolve
  - @rollup/plugin-commonjs

## Phase 2: Create Rollup Configuration ✓
- [x] Create rollup.config.js with ESM, CJS, and IIFE builds
- [x] Configure TypeScript declarations
- [x] Externalize runtime dependencies
- [x] Create tsconfig.build.json for ESM module support

## Phase 3: Update Package Configuration ✓
- [x] Update package.json fields:
  - Add 'module' field
  - Update 'main' field
  - Add 'exports' field for proper module resolution
  - Add 'files' field for package publishing
- [x] Update build scripts to use rollup
- [x] Add prepublishOnly hook

## Phase 4: Update CLI Entry Point ✓
- [x] Update bin/yada.js to point to bundled CLI
- [x] Simplified CLI to use CJS require

## Phase 5: Testing ✓
- [x] Run build to verify output (dist/index.js, dist/index.mjs, dist/yada.min.js)
- [x] Test CLI functionality (--help, --version, status)
- [x] Test programmatic CJS usage
- [x] Test programmatic ESM usage

## Generated Output Files
- dist/index.js (CJS build)
- dist/index.mjs (ESM build)
- dist/yada.min.js (IIFE/browser build)
- dist/cli/index.js (CLI bundle)
- dist/index.d.ts (TypeScript declarations)
- dist/cli/index.d.ts (CLI TypeScript declarations)

## Usage Examples
```bash
# Build the package
npm run build

# Build with watch mode
npm run build:watch

# Use CLI
./bin/yada.js --help

# Use as CJS module
const yada = require('yada-kit');

# Use as ESM module
import * as yada from 'yada-kit';
```

## NPM Publishing Notes
1. Update version in package.json before publishing
2. Run `npm run build` to generate all bundles
3. Test locally with `npm link`
4. Publish with `npm publish`
5. Consider adding --access public for scoped packages


