// Types for build-registry.mjs (used by tests).

export interface RegistryFile {
  path: string;
  type: string;
  target: string;
  content: string;
}

export interface RegistryItem {
  $schema: string;
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  css?: Record<string, unknown>;
}

export function readThemeCss(): Promise<string>;

export function readCssVars(css: string, selector: string): Record<string, string>;

export function themeFromCss(css: string): Pick<RegistryItem, 'cssVars' | 'css'>;

export function buildRegistry(options?: {
  registryUrl?: string;
}): Promise<{ index: unknown; items: RegistryItem[] }>;
