# YADA - Complete Usage Guide

## What is YADA?

**YADA (Yet Another Designing Assistant)** is a deterministic DAG orchestration library with CLI interface. It compiles declarative Design Prescriptions (DPs) into executable workflow graphs.

### Key Features

- Production-ready npm package - Install via `npm install yada`
- Dependency Graph Engine - Parses and resolves complex dependencies
- Deterministic Compilation - Predictable execution order based on priority
- Parallel Level Grouping - Identifies parallelizable tasks
- State Persistence - Tracks progress with `.yadasmith` file
- CLI & Programmatic API - Use as CLI tool or import as library

---

## Installation

```bash
# From source
cd /Users/salchad27/Desktop/TAG/yada
npm install
npm run build

# Make globally available
npm link

# Now use from anywhere
yada --help
```

---

## Project Structure

```
your-project/
├── dps/                          # Design Prescriptions directory
│   ├── 01-setup.yada
│   ├── 02-architecture.yada
│   └── 03-implementation.yada
├── .yadasmith                    # Compiled workflow (auto-generated)
├── graph.svg                      # Visual dependency graph (auto-generated)
└── .yadamap                      # Graph documentation (auto-generated)
```

---

## Creating Design Prescriptions (DPs)

### Basic DP Structure

```yaml
name: my-feature
nature: standard
phase: development
priority: 50
description: |
  /* Description of what this DP accomplishes */

dependencies:                    # External DP dependencies
  - previous-feature

subdps:
  order: false                   # true = chain subdps 1→2→3
  1:
    name: sub-feature-1
    type: specification          # specification = has workflow steps
    description: |
      /* Description */
    workflow:
      - step 1
      - step 2
    intents:
      - Goal achieved

  2:
    name: sub-feature-2
    type: dependency            # dependency = has prerequisites
    nature: required             # optional | required
    description: |
      /* Description */
    dependencies:
      - sub-feature-1           # Local subdp dependency
    intents:
      - Another goal
```

### DP Fields Reference

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `name` | Yes | string | Human-readable identifier |
| `nature` | Yes | `module` \| `standard` | Module = foundational, Standard = regular |
| `phase` | No | string | Phase classification |
| `priority` | Yes | number (0-100) | Higher = executed first at same level |
| `description` | Yes | string | What this DP accomplishes |
| `dependencies` | No | DP IDs | External DP references |
| `subdps.order` | Yes | boolean | Chain subdps numerically? |
| `subdp.type` | Yes | `specification` \| `dependency` | Specification = has workflow, Dependency = has deps |
| `subdp.nature` | No | `optional` \| `required` | Only for type=dependency |
| `subdp.workflow` | No | string[] | Steps (only for type=specification) |
| `subdp.dependencies` | No | string[] | Prerequisites (for type=dependency) |
| `subdp.intents` | No | string[] | Goals/intended outcomes |

### Naming Convention

IMPORTANT: DP filenames MUST use numbered IDs:

```
01-project-foundation.yada
02-architecture-design.yada
03-infrastructure-setup.yada
```

Then reference them with those IDs:
```yaml
dependencies:
  - 01-project-foundation    # Correct
  - project-foundation        # Will fail
```

---

## CLI Commands

### Compile Command

Parses all DPs, validates dependencies, builds graph, writes `.yadasmith`.

```bash
# Basic compilation
yada compile

# Verbose output
yada compile --verbose
yada compile -V

# Force recompile (overwrite existing)
yada compile --force
```

Output Files Generated:
- `.yadasmith` - Compiled workflow state
- `graph.svg` - Visual dependency graph
- `.yadamap` - Graph documentation

### Status Command

Shows current workflow progress.

```bash
# Basic status
yada status

# Verbose output
yada status --verbose
yada status -V

# JSON output (for scripts)
yada status --json
```

### Mark Command

Mark a task as completed.

```bash
# Mark specific task
yada --mark 01-project-foundation
```

How it works:
- Marks the specified task as `completed`
- Tasks before it in the execution order remain completed
- Tasks after it remain `pending`

### Check Commands

Validate DPs for errors and missing dependencies.

```bash
# Check all DPs
yada --check-dps

# Check specific DP
yada --check-dp 01-setup.yada

# Check with verbose output
yada --check-dps --verbose
```

What it validates:
- Required fields present
- Dependencies exist
- No circular dependencies
- Subdp types valid
- Priority values valid

### Reset Command

Reset all tasks to pending.

```bash
# Reset with confirmation
yada reset

# Force reset (skip confirmation)
yada reset --force
```

### Help Command

```bash
yada --help
yada -h
```

### Version Command

```bash
yada --version
yada -v
```

---

## Programmatic API

### Import YADA as Library

```typescript
import {
  parseAll,
  validateAll,
  resolve,
  readYadasmith,
  writeYadasmith,
  getStatus,
  markOne,
  resetAll
} from 'yada';
```

### Usage Examples

#### Compile Workflow

```typescript
import { parseAll, validateAll, resolve, writeYadasmith } from 'yada';

const rootDir = './my-project';

// 1. Parse all DPs
const parseResult = parseAll(rootDir);
if (parseResult.errors.length > 0) {
  console.error('Parse errors:', parseResult.errors);
  process.exit(1);
}

// 2. Validate DPs
const validationResult = validateAll(parseResult.dps);
if (!validationResult.valid) {
  console.error('Validation errors:', validationResult.errors);
  process.exit(1);
}

// 3. Resolve graph
const resolveResult = resolve(parseResult.dps, true);

// 4. Write output
writeYadasmith(rootDir, resolveResult.yadasmith);

console.log(`Compiled ${resolveResult.yadasmith.levels.length} levels`);
```

#### Check Task Status

```typescript
import { readYadasmith, getStatus, getTaskById } from 'yada';

const rootDir = './my-project';
const status = getStatus(rootDir);

console.log(`${status.completed}/${status.total} tasks completed`);

if (status.nextTask) {
  console.log('Next:', status.nextTask.ref);
}
```

---

## Dependency Resolution Logic

### How Levels Are Calculated

1. Build Graph - Create adjacency list from DPs
2. Detect Cycles - Fail if circular dependencies found
3. Calculate In-Degrees - Count dependencies per node
4. Start with Level 1 - Nodes with no dependencies
5. BFS Propagation - Level = max(parent level) + 1
6. Group by Level - Parallel tasks same level

### Priority Resolution

When multiple tasks are at the same level:
1. Higher `priority` value executes first
2. Alphabetical order as tiebreaker

---

## Best Practices

1. Number Your DPs Sequentially
2. Use Clear Priorities (90-100: Critical, 70-89: High, 50-69: Standard, 1-29: Optional)
3. Group Related Subdps with `order: true`
4. Document Intents Clearly

---

## Examples

### Simple Example (3 DPs)

```bash
cd example
yada compile --verbose
yada status
yada --mark 01-setup
yada status
```

### Enterprise Example (15 DPs)

```bash
cd example2
yada compile --verbose
yada status --json
yada --check-dps
yada --mark 01-project-foundation
yada status
```

---

## Troubleshooting

### "DP file not found"
Ensure filename matches exactly (case-sensitive):
```bash
# Wrong
yada --check-dp Setup.yada
yada --check-dp 1-setup

# Correct
yada --check-dp 01-setup.yada
```

### "Dependency not found"
Check that:
1. Dependency DP file exists
2. Filename uses numbered ID
3. ID format matches exactly (e.g., `01-setup` not `setup`)

### "Circular dependency detected"
Review dependency chain and remove one of the circular references.

---

## Summary

| Command | Purpose |
|---------|---------|
| `yada compile` | Parse & build workflow |
| `yada status` | Show progress |
| `yada --mark <id>` | Mark task complete |
| `yada --check-dps` | Validate all DPs |
| `yada reset` | Reset all tasks |

YADA transforms declarative DPs into executable workflows with deterministic ordering and state tracking.

Ready to use: `npm install yada`
