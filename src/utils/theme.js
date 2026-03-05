// Theme constants
export const C = {
  bg: '#0b1220',
  card: '#111b2e',
  card2: '#162036',
  bdr: '#1e2d47',
  bdr2: '#2a3f63',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  amber: '#f59e0b',
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  purple: '#8b5cf6',
  txt: '#e2e8f0',
  mid: '#94a3b8',
  dim: '#64748b',
};

export const Fnt = "'Instrument Sans','DM Sans',system-ui,sans-serif";
export const FM = "'JetBrains Mono',monospace";

// Spot type color
export const sc = (t) =>
  ({ wade: C.amber, boat: C.blue, kayak: C.green, drivein: C.purple }[t] || C.dim);

// Spot type icon
export const si = (t) =>
  ({ wade: '\u{1F6B6}', boat: '\u{1F6A4}', kayak: '\u{1F6F6}', drivein: '\u{1F697}' }[t] || '\u{1F4CD}');

// Launch type icon
export const li = (t) =>
  ({ boat: '\u26F5', kayak: '\u{1F6F6}', drivein: '\u{1F697}' }[t] || '\u{1F4CD}');
