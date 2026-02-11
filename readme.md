# YADA - Yet Another Designing Assistant

**Declarative workflow graph engine with deterministic compilation and state tracking**

[![npm](https://img.shields.io/npm/v/yada-kit)](https://www.npmjs.com/package/yada-kit)
[![License](https://img.shields.io/npm/l/yada-kit)](LICENSE)

## What is YADA?

YADA transforms declarative **Design Prescriptions (DPs)** into executable workflow graphs. It handles dependency resolution, state tracking, and deterministic task ordering automatically.

### What can you use it for?

- **Project Planning**: Define tasks as declarative YAML files
- **Workflow Orchestration**: Build dependency-aware task pipelines
- **Progress Tracking**: Persist and resume workflow state
- **CI/CD Pipelines**: Integrate as a library for workflow management

---

## Quick Start

### Installation

```bash
# Install globally for CLI usage
npm install -g yada-kit

# Or install locally for programmatic use
npm install yada-kit
```

### CLI Usage

```bash
# Initialize a new workflow project
mkdir my-workflow && cd my-workflow
mkdir dps

# Create your first Design Prescription
cat > dps/01-setup.yada << 'EOF'
name: Project Setup
nature: standard
priority: 100
description: Initial project configuration

subdps:
  order: true
  1:
    name: Initialize Repository
    type: specification
    description: Set up git repository
    workflow:
      - git init
      - create .gitignore

  2:
    name: Install Dependencies  
    type: dependency
    dependencies:
      - 1
EOF

# Compile and run
yada compile
yada status

# Mark tasks as complete
yada --mark 01-setup
yada status
```

### Programmatic Usage

```bash
npm install yada-kit
```

```typescript
import { parseAll, resolve, writeYadasmith } from 'yada-kit';

const rootDir = './my-project';

// Parse all Design Prescriptions
const { dps, errors } = parseAll(rootDir);
if (errors.length > 0) {
  console.error('Parse errors:', errors);
  process.exit(1);
}

// Resolve dependency graph
const result = resolve(dps, true);

// Write compiled workflow
writeYadasmith(rootDir, result.yadasmith);

console.log(\`Compiled \${result.yadasmith.levels.length} parallel levels\`);
```

---

## Installation Options

### Option 1: Global CLI

```bash
npm install -g yada-kit

# Now use from any directory
yada --help
```

### Option 2: Local Development Dependency

```bash
npm install --save-dev yada-kit

# Add to package.json scripts
"scripts": {
  "workflow": "yada compile && yada status"
}
```

### Option 3: Programmatic Library

```bash
npm install yada-kit

# Use in your Node.js/TypeScript project
import { parseAll, validateAll, resolve } from 'yada-kit';
```

---

## Creating Design Prescriptions

Design Prescriptions (DPs) are YAML files that define tasks and their dependencies.

### Example DP

\`\`\`yaml
name: Backend API
nature: standard
phase: development
priority: 80
description: REST API implementation

dependencies:
  - 01-database-schema  # Must complete before this

subdps:
  order: false
  1:
    name: Set Up Express
    type: specification
    description: Initialize Express server
    workflow:
      - npm init -y
      - npm install express

  2:
    name: Create Routes
    type: dependency
    nature: required
    description: Define API endpoints
    dependencies:
      - 1
    intents:
      - CRUD endpoints created
\`\`\`

### DP Structure Reference

| Field | Required | Description |
|-------|----------|-------------|
| \`name\` | Yes | Human-readable identifier |
| \`nature\` | Yes | \`module\` (foundational) or \`standard\` (regular) |
| \`priority\` | Yes | Number 0-100; higher = earlier execution |
| \`description\` | Yes | What this DP accomplishes |
| \`dependencies\` | No | Array of DP IDs that must complete first |
| \`subdps\` | Yes | Nested tasks within this DP |
| \`subdps.order\` | Yes | \`true\` = chain subdps sequentially |
| \`subdp.type\` | Yes | \`specification\` (has steps) or \`dependency\` (has prerequisites) |

### SubDP Reference

\`\`\`yaml
subdps:
  order: false  # false = all run in parallel at same level
  
  1:
    name: Task Name
    type: specification  # or 'dependency'
    description: What this does
    workflow:            # Only for type=specification
      - step 1
      - step 2
    dependencies: []    # Only for type=dependency
    intents: []          # Goals achieved
\`\`\`

---

## CLI Commands

### \`yada compile\`

Parses all DPs and generates the workflow graph.

\`\`\`bash
yada compile              # Basic compilation
yada compile --verbose   # Detailed output
yada compile --force     # Overwrite existing
\`\`\`

**Output:**
- \`.yadasmith\` - Compiled workflow state file

### \`yada status\`

View current progress through the workflow.

\`\`\`bash
yada status              # Human-readable progress
yada status --verbose    # Detailed view
yada status --json      # JSON output for scripts
\`\`\`

### \`yada --mark <task-id>\`

Mark a task as completed and update progress.

\`\`\`bash
yada --mark 01-setup           # Mark specific task
yada --mark 03-api-development # Mark by DP filename (without .yada)
\`\`\`

### \`yada --check-dps\`

Validate all DPs for errors.

\`\`\`bash
yada --check-dps              # Check all
yada --check-dp 01-setup      # Check specific DP
yada --check-dps --verbose    # Detailed validation
\`\`\`

**Validates:**
- Required fields present
- Dependencies exist
- No circular dependencies
- Type and nature values valid

### \`yada reset\`

Reset all progress to pending.

\`\`\`bash
yada reset              # With confirmation
yada reset --force      # Skip confirmation
\`\`\`

### \`yada --help\` / \`yada -h\`

Show available commands and options.

\`\`\`bash
yada --help
\`\`\`

---

## Programmatic API

### Import the Library

\`\`\`typescript
// ES Modules
import * as yada from 'yada-kit';

// CommonJS
const yada = require('yada-kit');
\`\`\`

### Core Functions

#### \`parseAll(rootDir)\`

Parse all DPs from a directory.

\`\`\`typescript
const { dps, errors } = parseAll('./my-project');
console.log(\`Parsed \${dps.length} Design Prescriptions\`);
\`\`\`

#### \`validateAll(dps)\`

Validate parsed DPs.

\`\`\`typescript
const result = validateAll(dps);
if (!result.valid) {
  console.error('Errors:', result.errors);
  console.error('Warnings:', result.warnings);
}
\`\`\`

#### \`resolve(dps, usePriority)\`

Build the dependency graph and calculate execution levels.

\`\`\`typescript
const result = resolve(dps, true);
console.log(\`Levels: \${result.yadasmith.levels.length}\`);
console.log(\`Errors: \${result.errors}\`);
\`\`\`

#### \`writeYadasmith(rootDir, yadasmith)\`

Write compiled workflow to \`.yadasmith\` file.

\`\`\`typescript
writeYadasmith('./my-project', result.yadasmith);
\`\`\`

#### \`getStatus(rootDir)\`

Get current workflow progress.

\`\`\`typescript
const status = getStatus('./my-project');
console.log(\`\${status.completed}/\${status.total} complete\`);

if (status.nextTask) {
  console.log('Next task:', status.nextTask.ref);
}
\`\`\`

---

## Project Structure

\`\`\`
my-project/
├── dps/                          # Design Prescriptions
│   ├── 01-initialization.yada
│   ├── 02-architecture.yada
│   └── 03-development.yada
├── .yadasmith                    # Compiled workflow (auto-generated)
└── package.json
\`\`\`

### File Naming

DP files must be numbered:
- \`01-setup.yada\`
- \`02-config.yada\`
- \`03-build.yada\`

Reference them without the extension:
\`\`\`yaml
dependencies:
  - 01-setup  # Correct
  - setup     # Incorrect
\`\`\`

---

## Workflow Execution

### How Levels Work

YADA groups tasks into **levels** where all tasks at the same level can execute in parallel.

**Example:**
\`\`\`
Level 1: 01-setup → 02-config       (No dependencies, run in parallel)
    ↓
Level 3: 03-api                     (Depends on both Level 1 tasks)
    ↓
Level 4: 04-frontend                (Depends on 03-api)
\`\`\`

### Priority Within Levels

When multiple tasks are at the same level:
1. Higher \`priority\` value executes first
2. Alphabetical order breaks ties

---

## Real-World Example

### Microservices Project

\`\`\`bash
mkdir microservices && cd microservices
mkdir dps
\`\`\`

**\`dps/01-database.yada\`**
\`\`\`yaml
name: Database Setup
nature: module
priority: 100
description: Database infrastructure

subdps:
  order: true
  1:
    name: Provision Database
    type: specification
    workflow:
      - docker-compose up -d
\`\`\`

**\`dps/02-backend.yada\`**
\`\`\`yaml
name: Backend API
nature: standard
priority: 80
description: REST API development

dependencies:
  - 01-database

subdps:
  order: false
  1:
    name: User Service
    type: specification
    workflow:
      - npm init
      - create routes/users.ts
\`\`\`

**\`dps/03-frontend.yada\`**
\`\`\`yaml
name: Frontend App
nature: standard
priority: 60
description: Web interface

dependencies:
  - 02-backend

subdps:
  1:
    name: UI Components
    type: specification
    workflow:
      - create App.tsx
\`\`\`

\`\`\`bash
yada compile        # Build workflow
yada status         # Check progress
yada --mark 01-database
yada --mark 02-backend
\`\`\`

---

## Common Patterns

### Sequential Subdps

Use \`subdps.order: true\` to chain subdps 1 → 2 → 3:

\`\`\`yaml
subdps:
  order: true  # Must complete 1 before 2, 2 before 3
  1:
    name: Step 1
    type: specification
  2:
    name: Step 2
    type: dependency
    dependencies:
      - 1
  3:
    name: Step 3
    type: dependency
    dependencies:
      - 2
\`\`\`

### Parallel Subdps

Use \`subdps.order: false\` to run all at once:

\`\`\`yaml
subdps:
  order: false  # All run at same time
  1:
    name: Task A
    type: specification
  2:
    name: Task B  
    type: specification
\`\`\`

### Cross-DP Dependencies

\`\`\`yaml
# In 02-backend.yada
dependencies:
  - 01-database  # Complete 01-database before 02-backend
\`\`\`

---

## Troubleshooting

### "DP file not found"

Ensure exact filename match:
\`\`\`bash
# Wrong
yada --check-dp Setup.yada
yada --check-dp 1-setup

# Correct  
yada --check-dp 01-setup.yada
\`\`\`

### "Dependency not found"

1. Verify DP file exists
2. Check numbered ID format: \`01-setup\` not \`setup\`
3. Confirm exact match (case-sensitive)

### "Circular dependency detected"

Example circular chain:
\`\`\`
01 → 02 → 03 → 01
\`\`\`

Remove one of the circular references in your DPs.

### "Missing required field"

Required fields per DP:
- \`name\`
- \`nature\`
- \`priority\`
- \`description\`
- \`subdps.order\`

### Commands not found after install

\`\`\`bash
# Global install
npm install -g yada-kit

# Ensure npm global bin is in PATH
export PATH="$(npm global bin):$PATH"

# Or use npx
npx yada-kit --help
\`\`\`

---

## Best Practices

1. **Number sequentially**: 01, 02, 03...
2. **Set clear priorities**: 
   - 90-100: Critical path
   - 70-89: High priority
   - 50-69: Standard
   - 1-29: Optional/deferred
3. **Document intents**: Help future maintainers understand goals
4. **Group related work**: Put related tasks in same DP
5. **Use subdps**: Break complex DPs into smaller tasks

---

## API Reference

### CLI Options

| Option | Description |
|--------|-------------|
| \`-v, --version\` | Show version |
| \`-h, --help\` | Show help |
| \`-V, --verbose\` | Verbose output |
| \`--force\` | Force overwrite |
| \`--json\` | JSON output |
| \`--mark <id>\` | Mark task complete |
| \`--check-dp <file>\` | Check specific DP |
| \`--check-dps\` | Check all DPs |

### Library Exports

\`\`\`typescript
// Parsing
parseAll(rootDir: string): ParseResult
parseByName(rootDir: string, name: string): ParsedDP | null

// Validation
validateAll(dps: ParsedDP[]): ValidationResult
validateDP(dp: ParsedDP): ValidationResult

// Resolution
resolve(dps: ParsedDP[], usePriority: boolean): ResolveResult

// State Management
readYadasmith(rootDir: string): Yadasmith
writeYadasmith(rootDir: string, yadasmith: Yadasmith): void
getStatus(rootDir: string): Status

// CLI
runCli(args: string[]): void
\`\`\`

---

## License

ISC License

---

## Contributing

Issues and PRs welcome on [GitHub](https://github.com/salchaD-27/yada)

---

**Ready to plan? Start with:**
\`\`\`bash
npm install -g yada-kit
mkdir my-workflow && cd my-workflow
mkdir dps
\`\`\`
