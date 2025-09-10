
// src/integrations/email/types.ts
export type Provider = 'mock'|'gmail'|'m365'|'imap';
export type Folder = { id: string; name: string };
export type Attachment = { id: string; name: string; size: number; mime: string };
export type Email = {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  date: string; // ISO
  unread: boolean;
  headers: Record<string, string>;
  snippet: string;
  body?: string;
  attachments: Attachment[];
  ingested?: boolean;
  ingestRef?: { type:'doc'|'ticket'; ref: string }; // ERP ref after ingest
};

export type Config = {
  provider: Provider;
  mailbox: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;   // for m365
  imapHost?: string;   // for imap
  imapPort?: number;
  useSSL?: boolean;
};

export type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  when: {
    fromIncludes?: string;
    toIncludes?: string;
    subjectIncludes?: string;
    hasAttachment?: boolean;
    bodyRegex?: string; // simple regex
  };
  then: {
    type: 'doc'|'ticket';
    projectField?: string; // extracted group name from regex (?<project>)
    defaultProject?: string;
    tagsFromSubject?: boolean;
  };
};
