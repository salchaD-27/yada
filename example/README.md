# YADA Example Project

This example demonstrates how to use YADA for a typical software development workflow.

## Project Structure

```
example/
├── dps/
│   ├── 01-setup.yada          # Phase 1: Initial setup
│   ├── 02-architecture.yada    # Phase 2: Architecture design
│   └── 03-implementation.yada # Phase 3: Implementation
└── .yadasmith                  # Compiled workflow (generated)
```

## Workflow Levels

- **Level 1 (setup)**: Initialize repository and environment
- **Level 2 (architecture)**: Design modules and create scaffold (parallel with setup completion)
- **Level 3 (implementation)**: Implement core functionality (after architecture)

## Usage

```bash
# Navigate to example directory
cd example

# Compile DPs into workflow
yada compile

# Check status
yada status

# Mark a task as completed
yada --mark task_id

# Reset all tasks
yada reset
```

## DP Dependencies

```
01-setup.yada → No external dependencies
02-architecture.yada → Depends on: 01-setup:setup-env
03-implementation.yada → Depends on: 02-architecture:create-scaffold
```

## Sub-DP Order

- `01-setup.yada`: order: true → subdps execute in sequence (1 → 2)
- `02-architecture.yada`: order: false → subdps can execute based on explicit dependencies
- `03-implementation.yada`: order: true → subdps execute in sequence (1 → 2 → 3)
