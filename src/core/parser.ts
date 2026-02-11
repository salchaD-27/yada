/**
 * YADA Parser Module
 * Parses .yada files into typed DP objects
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { DP, ParsedDP, SubDP, SubDPs, ParseResult, SubDPNature } from '../types/dp';

const YADA_EXTENSION = '.yada';
const DPS_DIRECTORY = 'dps';

/**
 * Parse a single .yada file
 */
export function parseDP(filePath: string): ParsedDP | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const raw = yaml.load(content) as Record<string, unknown>;
    
    if (!raw) {
      return null;
    }

    // Extract basic properties
    const dp: Partial<DP> = {
      name: String(raw.name || ''),
      nature: raw.nature as DP['nature'],
      phase: raw.phase as string | undefined,
      priority: Number(raw.priority) || 0,
      description: extractDescription(raw),
      subdps: parseSubDPs(raw.subdps),
      dependencies: raw.dependencies as string[] | undefined,
    };

    // Validate required fields
    if (!dp.name) {
      console.error(`Error: DP in ${filePath} missing required 'name' field`);
      return null;
    }

    // Create ID from filename
    const id = path.basename(filePath, YADA_EXTENSION);

    return {
      ...dp,
      id,
      filePath,
    } as ParsedDP;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract description from raw YAML (handle block format)
 */
function extractDescription(raw: Record<string, unknown>): string {
  const desc = raw.description;
  if (typeof desc === 'string') {
    return desc.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  }
  return '';
}

/**
 * Parse subdps section
 */
function parseSubDPs(raw: unknown): SubDPs {
  const subdps: SubDPs = {
    order: false,
  };

  if (!raw || typeof raw !== 'object') {
    return subdps;
  }

  const rawSubdps = raw as Record<string, unknown>;
  
  // Parse order flag
  if ('order' in rawSubdps) {
    subdps.order = Boolean(rawSubdps.order);
  }

  // Parse numbered subdps
  for (const key of Object.keys(rawSubdps)) {
    const num = parseInt(key, 10);
    if (!isNaN(num) && num > 0) {
      const subRaw = rawSubdps[key] as Record<string, unknown>;
      if (subRaw) {
        subdps[num] = parseSubDP(subRaw, num);
      }
    }
  }

  return subdps;
}

/**
 * Parse a single subdp
 */
function parseSubDP(raw: Record<string, unknown>, index: number): SubDP {
  const subdp: SubDP = {
    name: String(raw.name || `subdp${index}`),
    type: raw.type as SubDP['type'],
    description: extractDescription(raw as unknown as Record<string, unknown>),
  };

  // Optional fields
  if (raw.nature) {
    subdp.nature = raw.nature as SubDPNature;
  }

  if (raw.workflow) {
    subdp.workflow = Array.isArray(raw.workflow) 
      ? raw.workflow.map(String)
      : [];
  }

  if (raw.dependencies) {
    subdp.dependencies = Array.isArray(raw.dependencies)
      ? raw.dependencies.map(String)
      : [];
  }

  if (raw.intents) {
    subdp.intents = Array.isArray(raw.intents)
      ? raw.intents.map(String)
      : [];
  }

  return subdp;
}

/**
 * Find all .yada files in dps directory
 */
export function findDPFiles(rootDir: string): string[] {
  const dpsDir = path.join(rootDir, DPS_DIRECTORY);
  
  if (!fs.existsSync(dpsDir)) {
    console.warn(`Warning: dps directory not found at ${dpsDir}`);
    return [];
  }

  const files = fs.readdirSync(dpsDir);
  return files
    .filter(f => f.endsWith(YADA_EXTENSION))
    .map(f => path.join(dpsDir, f))
    .filter(f => fs.statSync(f).isFile());
}

/**
 * Parse all DPs in a project
 */
export function parseAll(rootDir: string): ParseResult {
  const dps: ParsedDP[] = [];
  const errors: string[] = [];

  const dpFiles = findDPFiles(rootDir);

  for (const file of dpFiles) {
    const dp = parseDP(file);
    if (dp) {
      dps.push(dp);
    } else {
      errors.push(`Failed to parse: ${file}`);
    }
  }

  // Sort by name for deterministic ordering
  dps.sort((a, b) => a.name.localeCompare(b.name));

  return { dps, errors };
}

/**
 * Parse a single DP by name
 */
export function parseByName(rootDir: string, name: string): ParsedDP | null {
  const filePath = path.join(rootDir, DPS_DIRECTORY, `${name}${YADA_EXTENSION}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: DP file not found: ${filePath}`);
    return null;
  }

  return parseDP(filePath);
}

