
// src/integrations/sharepoint/types.ts
export type AuthMode = 'delegated'|'app-only';

export type SPConfig = {
  authMode: AuthMode;
  tenantId: string;
  clientId: string;
  siteHostname: string;   // e.g., contoso.sharepoint.com
  sitePath: string;       // e.g., sites/ERP or teams/Finance
};

export type SPSite = { id: string; webUrl: string; displayName: string };
export type SPDrive = { id: string; name: string; driveType: 'documentLibrary'|'business'|'personal'|'unknown' };
export type SPItem = { id: string; name: string; isFolder: boolean; size: number; lastModified: string; createdBy?: string; webUrl?: string };

export type MappingRule = { id: string; module: string; driveId: string; path: string }; // ERP module -> drive/path
