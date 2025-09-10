
// src/integrations/email/mockMailbox.ts — simulate a mail provider inbox with messages & headers
import type { Email, Folder, Attachment, Config } from './types';

const LS = 'erp.int.email.mock.v1';

type DB = { folders: Folder[]; emailsByFolder: Record<string, Email[]> };

function rid(){ return Math.random().toString(36).slice(2); }
function iso(y:number,m:number,d:number,h=9,min=0,s=0){ return new Date(Date.UTC(y,m,d,h,min,s)).toISOString(); }

function seed(): DB {
  const now = new Date();
  const yr = now.getUTCFullYear(), m = now.getUTCMonth();
  const folders: Folder[] = [
    { id:'inbox', name:'INBOX' },
    { id:'archive', name:'Archive' },
    { id:'support', name:'Support' },
  ];
  const emailsByFolder: DB['emailsByFolder'] = { inbox:[], archive:[], support:[] };

  const samples: Omit<Email,'id'>[] = [
    {
      subject: 'Re: [PRJ-A] Lỗi không đăng nhập được',
      from: 'khachhangA <custA@example.com>',
      to: ['support@company.vn'],
      cc: ['pm@company.vn'],
      date: iso(yr, m, 7, 2, 15),
      unread: true,
      headers: {
        'Message-ID': '<msg-001@ext>',
        'In-Reply-To': '<msg-000@ext>',
        'References': '<msg-000@ext>',
        'X-Mailer': 'Gmail',
        'DKIM-Signature': 'v=1; a=rsa-sha256; ...'
      },
      snippet: 'Khách báo không đăng nhập được vào hệ thống từ tối qua...',
      body: 'Xin chào đội hỗ trợ,\nTôi không đăng nhập được vào hệ thống từ tối qua. Trân trọng.\n--\nKH A',
      attachments: []
    },
    {
      subject: 'Hóa đơn tháng 08/2025 - PRJ-B',
      from: 'ncc1 <ap@vendor.vn>',
      to: ['ap@company.vn'],
      cc: [],
      date: iso(yr, m, 3, 9, 40),
      unread: true,
      headers: {
        'Message-ID': '<msg-002@vendor>',
        'X-SPF': 'pass', 'X-DMARC': 'pass'
      },
      snippet: 'Gửi kèm hóa đơn tháng 08 cho dự án PRJ-B...',
      body: 'Kính gửi phòng kế toán, vui lòng xem hóa đơn đính kèm. Mã dự án: PRJ-B.',
      attachments: [{ id: rid(), name:'INV-2025-08.pdf', size: 480_000, mime: 'application/pdf' }]
    },
    {
      subject: 'Meeting notes 09/09 - ERP',
      from: 'PM <pm@company.vn>',
      to: ['docs@company.vn'],
      cc: ['team@company.vn'],
      date: iso(yr, m, 9, 12, 0),
      unread: false,
      headers: { 'Message-ID':'<msg-003@int>' },
      snippet: 'Biên bản họp ngày 09/09 kèm checklist...',
      body: 'Tóm tắt: Đã thống nhất timeline. Tags: #minutes #erp',
      attachments: [{ id: rid(), name:'Minutes-2025-09-09.docx', size: 120_000, mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }]
    },
    {
      subject: '[Ticket] API lỗi 500 khi upload',
      from: 'QA <qa@company.vn>',
      to: ['support@company.vn'],
      cc: [],
      date: iso(yr, m, 6, 8, 10),
      unread: true,
      headers: { 'Message-ID':'<msg-004@int>' },
      snippet: 'Khi upload file > 5MB thì trả 500...',
      body: 'Bước tái hiện: ...',
      attachments: []
    }
  ];

  for (const s of samples){
    emailsByFolder.inbox.push({ id: rid(), ...s, ingested:false });
  }
  return { folders, emailsByFolder };
}

function load(): DB {
  const raw = localStorage.getItem(LS);
  if (!raw){ const db = seed(); localStorage.setItem(LS, JSON.stringify(db)); return db; }
  try { return JSON.parse(raw); } catch { const db = seed(); localStorage.setItem(LS, JSON.stringify(db)); return db; }
}
function save(db: DB){ localStorage.setItem(LS, JSON.stringify(db)); }

function delay(ms=200){ return new Promise(res => setTimeout(res, ms)); }

export const MockMailbox = {
  async listFolders(cfg: Config): Promise<Folder[]>{ await delay(); return load().folders; },
  async listEmails(cfg: Config, folderId: string): Promise<Email[]>{ await delay(); const db=load(); return db.emailsByFolder[folderId] || []; },
  async markIngested(cfg: Config, folderId: string, emailId: string, ref: { type:'doc'|'ticket'; ref:string }){
    await delay(); const db=load(); const arr=db.emailsByFolder[folderId]; const i=arr.findIndex(e=>e.id===emailId); if(i>=0){ arr[i].ingested=true; arr[i].ingestRef=ref; save(db);} return { ok:true };
  }
};
