
// src/integrations/sharepoint/mockGraph.ts — simulate Microsoft Graph for SharePoint
import type { SPConfig, SPSite, SPDrive, SPItem } from './types';

const LS = 'erp.int.sharepoint.mock.v1';

type MockDB = {
  site: SPSite;
  drives: SPDrive[];
  tree: Record<string, Record<string, SPItem[]>>; // driveId -> path -> items[]
};

function seed(): MockDB {
  const now = new Date().toISOString();
  const site: SPSite = { id: 'site-mock-001', webUrl: 'https://contoso.sharepoint.com/sites/ERP', displayName: 'ERP Site (Mock)' };
  const drives: SPDrive[] = [
    { id:'drv-A', name:'Documents', driveType:'documentLibrary' },
    { id:'drv-B', name:'Finance', driveType:'documentLibrary' },
    { id:'drv-C', name:'Projects', driveType:'documentLibrary' },
  ];
  const tree: MockDB['tree'] = {
    'drv-A': {
      '/': [
        { id:'A1', name:'Company Handbook.pdf', isFolder:false, size: 2_100_000, lastModified: now, createdBy:'hr', webUrl:'#' },
        { id:'A2', name:'Policies', isFolder:true, size: 0, lastModified: now, createdBy:'hr', webUrl:'#' },
      ],
      '/Policies': [
        { id:'A3', name:'IT_Security.docx', isFolder:false, size: 560_000, lastModified: now, createdBy:'it', webUrl:'#' },
      ]
    },
    'drv-B': {
      '/': [
        { id:'B1', name:'Invoices', isFolder:true, size:0, lastModified: now, createdBy:'finance', webUrl:'#' },
        { id:'B2', name:'Budget_2025.xlsx', isFolder:false, size: 310_000, lastModified: now, createdBy:'finance', webUrl:'#' },
      ],
      '/Invoices': [
        { id:'B3', name:'INV-0001.pdf', isFolder:false, size: 480_000, lastModified: now, createdBy:'sales', webUrl:'#' },
      ]
    },
    'drv-C': {
      '/': [
        { id:'C1', name:'PRJ-A', isFolder:true, size:0, lastModified: now, createdBy:'pm', webUrl:'#' },
      ],
      '/PRJ-A': [
        { id:'C2', name:'Kickoff Notes.txt', isFolder:false, size: 12_000, lastModified: now, createdBy:'pm', webUrl:'#' },
      ]
    }
  };
  return { site, drives, tree };
}

function load(): MockDB {
  const raw = localStorage.getItem(LS);
  if (!raw) { const db = seed(); localStorage.setItem(LS, JSON.stringify(db)); return db; }
  try { return JSON.parse(raw); } catch { const db = seed(); localStorage.setItem(LS, JSON.stringify(db)); return db; }
}

function save(db: MockDB){ localStorage.setItem(LS, JSON.stringify(db)); }

function delay(ms=300){ return new Promise(res => setTimeout(res, ms)); }

export const MockGraph = {
  async testConnection(cfg: SPConfig){
    await delay(300);
    if (!cfg.tenantId || !cfg.clientId || !cfg.siteHostname || !cfg.sitePath) throw new Error('Missing required fields');
    // Simulate success
    return { ok: true, message: 'Connected (mock)' };
  },
  async getSite(cfg: SPConfig): Promise<SPSite>{
    await delay(200);
    const db = load();
    return db.site;
  },
  async listDrives(cfg: SPConfig): Promise<SPDrive[]>{
    await delay(200);
    const db = load();
    return db.drives;
  },
  async listChildren(cfg: SPConfig, driveId: string, path: string): Promise<SPItem[]>{
    await delay(200);
    const db = load();
    const p = path || '/';
    return (db.tree[driveId] && db.tree[driveId][p]) ? db.tree[driveId][p] : [];
  },
  async createFolder(cfg: SPConfig, driveId: string, path: string, folderName: string): Promise<SPItem>{
    await delay(200);
    const db = load();
    const p = path || '/';
    const id = Math.random().toString(36).slice(2);
    const item: SPItem = { id, name: folderName, isFolder:true, size:0, lastModified:new Date().toISOString(), createdBy:'me', webUrl:'#' };
    db.tree[driveId] = db.tree[driveId] || {};
    db.tree[driveId][p] = db.tree[driveId][p] || [];
    db.tree[driveId][p].push(item);
    db.tree[driveId][p+'/'+folderName] = [];
    save(db);
    return item;
  },
  async uploadFile(cfg: SPConfig, driveId: string, path: string, file: File): Promise<SPItem>{
    await delay(300);
    const db = load();
    const p = path || '/';
    const id = Math.random().toString(36).slice(2);
    const item: SPItem = { id, name: file.name, isFolder:false, size:file.size, lastModified:new Date().toISOString(), createdBy:'me', webUrl:'#' };
    db.tree[driveId] = db.tree[driveId] || {};
    db.tree[driveId][p] = db.tree[driveId][p] || [];
    db.tree[driveId][p].push(item);
    save(db);
    return item;
  },
  async deleteItem(cfg: SPConfig, driveId: string, path: string, itemId: string){
    await delay(200);
    const db = load();
    const p = path || '/';
    const list = db.tree[driveId]?.[p] || [];
    const idx = list.findIndex(x => x.id===itemId);
    if (idx>=0) list.splice(idx,1);
    save(db);
    return { ok:true };
  }
};
