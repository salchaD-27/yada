/**
 * YADA GraphMap Module
 * Generates visual graph representation of DPs using Mermaid.js
 * Supports image output via Mermaid CLI or live editor
 */

import * as fs from 'fs';
import * as path from 'path';
import { Graph, ParsedDP } from '../types/dp';
import { execSync } from 'child_process';

const YADAMAP_FILE = '.yadamap';
const GRAPH_SVG_FILE = 'graph.svg';
const GRAPH_MMD_FILE = 'graph.mmd';

/**
 * Generate Mermaid.js flowchart diagram definition
 */
export function generateMermaidDefinition(dps: ParsedDP[], graph: Graph): string {
  const lines: string[] = [];

  lines.push('flowchart TD');
  lines.push('    %% YADA Dependency Graph');
  lines.push(`    %% Generated at: ${new Date().toISOString()}`);
  lines.push('    %% Nodes represent Design Prescriptions');
  lines.push('    %% Edges represent dependencies');
  lines.push('');

  // Style definitions for different node types
  lines.push('    %% Node Styles');
  lines.push('    classDef pending fill:#f9f9f9,stroke:#333,stroke-width:1px;');
  lines.push('    classDef module fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;');
  lines.push('    classDef standard fill:#fff3e0,stroke:#f57c00,stroke-width:2px;');
  lines.push('    classDef completed fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;');
  lines.push('');

  // Node definitions with labels
  for (const node of graph.nodes.values()) {
    const label = node.dp.name || node.id;
    const nature = node.dp.nature || 'standard';
    let className = nature === 'module' ? 'module' : 'standard';
    lines.push(`    ${node.id}["${label}"]:::${className}`);
  }

  lines.push('');

  // Dependency edges
  for (const node of graph.nodes.values()) {
    for (const depId of node.dependencies) {
      lines.push(`    ${depId} --> ${node.id}`);
    }
  }

  lines.push('');

  // Level grouping (subgraphs for execution levels)
  const levels = Array.from(graph.levels.keys()).sort((a, b) => a - b);
  
  if (levels.length > 1) {
    lines.push('    %% Execution Levels (subgraphs)');
    for (const level of levels) {
      const nodeIds = graph.levels.get(level) || [];
      if (nodeIds.length > 0) {
        lines.push(`    subgraph Level_${level} ["Level ${level} (Parallel Execution)"]`);
        for (const nodeId of nodeIds) {
          lines.push(`        ${nodeId}`);
        }
        lines.push('    end');
      }
    }
  }

  lines.push('');

  // Legend
  lines.push('    %% Legend');
  lines.push('    subgraph Legend ["Legend"]');
  lines.push('        direction LR');
  lines.push('        M1[(Module)]:::module');
  lines.push('        S1[Standard]:::standard');
  lines.push('        P[Pending]:::pending');
  lines.push('        C[Completed]:::completed');
  lines.push('    end');

  return lines.join('\n');
}

/**
 * Try to generate SVG image using mermaid CLI
 */
function tryGenerateWithCli(mmdPath: string, svgPath: string): boolean {
  try {
    // Check if mmdc (Mermaid CLI) is available
    execSync('which mmdc', { stdio: 'ignore' });
    
    // Generate SVG using mermaid CLI
    execSync(`mmdc -i "${mmdPath}" -o "${svgPath}" -b transparent`, {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate ASCII art graph representation
 */
export function generateAsciiGraph(dps: ParsedDP[], graph: Graph): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('YADA Dependency Graph');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push('='.repeat(60));
  lines.push('');

  // Group nodes by level
  const levels = Array.from(graph.levels.keys()).sort((a, b) => a - b);
  
  for (const level of levels) {
    const nodeIds = graph.levels.get(level) || [];
    lines.push(`Level ${level}:`);
    lines.push('-'.repeat(40));
    
    for (const nodeId of nodeIds) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        const label = node.dp.name || nodeId;
        const deps = node.dependencies.join(', ') || '(none)';
        lines.push(`  [${nodeId}] ${label}`);
        lines.push(`      Dependencies: ${deps}`);
        
        // Show subdps count
        const subdpCount = Object.keys(node.dp.subdps).filter(k => !isNaN(parseInt(k))).length;
        if (subdpCount > 0) {
          lines.push(`      SubDPs: ${subdpCount}`);
        }
        lines.push('');
      }
    }
    
    if (level < levels.length) {
      lines.push('');
      lines.push('    │');
      lines.push('    ▼');
      lines.push('');
    }
  }

  lines.push('='.repeat(60));
  lines.push('Legend:');
  lines.push('  [id]  - Node ID');
  lines.push('  name  - DP name');
  lines.push('  Dependencies - List of DPs this depends on');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Get graph summary
 */
export function getGraphSummary(dps: ParsedDP[], graph: Graph): string {
  const lines: string[] = [];

  lines.push('Graph Summary');
  lines.push('-'.repeat(40));
  lines.push(`Total DPs: ${graph.nodes.size}`);
  lines.push(`Total Levels: ${graph.levels.size}`);
  lines.push(`Max Depth: ${Math.max(...graph.levels.keys(), 0)}`);
  lines.push('');

  // Level breakdown
  lines.push('Level Distribution:');
  for (const level of Array.from(graph.levels.keys()).sort((a, b) => a - b)) {
    const nodeIds = graph.levels.get(level) || [];
    lines.push(`  Level ${level}: ${nodeIds.length} DPs - ${nodeIds.join(', ')}`);
  }

  lines.push('');

  // Dependency stats
  let totalDeps = 0;
  for (const node of graph.nodes.values()) {
    totalDeps += node.dependencies.length;
  }
  lines.push(`Total Dependencies: ${totalDeps}`);
  lines.push(`Avg Dependencies per DP: ${(totalDeps / graph.nodes.size).toFixed(2)}`);

  return lines.join('\n');
}

/**
 * Write YADAMAP file with Mermaid code and ASCII fallback
 */
export function writeYadamap(rootDir: string, dps: ParsedDP[], graph: Graph): void {
  const mermaidDefinition = generateMermaidDefinition(dps, graph);
  const asciiGraph = generateAsciiGraph(dps, graph);
  const summary = getGraphSummary(dps, graph);

  const content = `<!-- YADA Graph Map -->
<!-- Visual representation of Design Prescription dependencies -->

## Graph Visualization

### SVG Image
\`graph.svg\` - Vector graphics file (open in browser)

### Mermaid.js Diagram
Copy the code below to [Mermaid Live Editor](https://mermaid.live/) or any Markdown editor with mermaid support:

\`\`\`mermaid
${mermaidDefinition}
\`\`\`

---

## ASCII Representation

${asciiGraph}

---

## Summary

${summary}

---

## Installation for CLI Image Generation

To generate SVG images directly from the CLI, install the Mermaid CLI:

\`\`\`bash
npm install -g @mermaid-js/mermaid-cli
# or
brew install mermaid-cli
\`\`\`

Then run:
\`\`\`bash
mmdc -i graph.mmd -o graph.svg -b transparent
\`\`\`
`;

  const filePath = path.join(rootDir, YADAMAP_FILE);
  
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

/**
 * Write graph Mermaid definition file
 */
export function writeGraphMermaid(rootDir: string, dps: ParsedDP[], graph: Graph): void {
  const mermaidDefinition = generateMermaidDefinition(dps, graph);
  const filePath = path.join(rootDir, GRAPH_MMD_FILE);
  
  try {
    fs.writeFileSync(filePath, mermaidDefinition, 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

/**
 * Generate SVG image using Mermaid CLI (if available)
 */
export async function writeGraphImage(rootDir: string, dps: ParsedDP[], graph: Graph): Promise<void> {
  const mmdPath = path.join(rootDir, GRAPH_MMD_FILE);
  const svgPath = path.join(rootDir, GRAPH_SVG_FILE);
  
  // Write the mermaid definition file
  writeGraphMermaid(rootDir, dps, graph);
  
  // Try to generate SVG using CLI
  const success = tryGenerateWithCli(mmdPath, svgPath);
  
  if (!success) {
    console.warn('Note: graph.svg not generated. Install @mermaid-js/mermaid-cli for image generation.');
    console.warn('  npm install -g @mermaid-js/mermaid-cli');
  }
}

/**
 * Check if .yadamap exists
 */
export function hasYadamap(rootDir: string): boolean {
  const filePath = path.join(rootDir, YADAMAP_FILE);
  return fs.existsSync(filePath);
}

/**
 * Get YADAMAP file path
 */
export function getYadamapPath(rootDir: string): string {
  return path.join(rootDir, YADAMAP_FILE);
}

/**
 * Read YADAMAP file
 */
export function readYadamap(rootDir: string): string | null {
  const filePath = path.join(rootDir, YADAMAP_FILE);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

