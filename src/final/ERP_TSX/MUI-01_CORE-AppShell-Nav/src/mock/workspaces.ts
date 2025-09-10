// src/mock/workspaces.ts
export type Workspace = { id: string; name: string };
export const workspaces: Workspace[] = [
  { id: 'main', name: 'KTEST Main' },
  { id: 'rnd', name: 'R&D Lab' },
  { id: 'demo', name: 'Demo Tenant' },
];
