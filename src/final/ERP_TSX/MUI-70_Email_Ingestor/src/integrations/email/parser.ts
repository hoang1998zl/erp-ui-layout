
// src/integrations/email/parser.ts — header/subject/body parser and rule engine
import type { Email, Rule } from './types';

export type Parsed = {
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  tags: string[];
  project?: string;
  hasAttachment: boolean;
  suggestedType?: 'doc'|'ticket';
};

export function parseEmail(e: Email): Parsed {
  const h = e.headers||{};
  const messageId = h['Message-ID'] || h['Message-Id'] || h['message-id'];
  const inReplyTo = h['In-Reply-To'] || h['in-reply-to'];
  const references = h['References'] || h['references'];

  const tags = new Set<string>();
  const tagRegex = /#([a-zA-Z0-9_-]+)/g;
  const src = `${e.subject}\n${e.body||''}`;
  let m: RegExpExecArray|null;
  while ((m = tagRegex.exec(src)) !== null){ tags.add(m[1]); }

  // Extract project like PRJ-XXX
  const pj = /PRJ-[A-Z0-9]+/i.exec(src);
  const project = pj ? pj[0].toUpperCase() : undefined;

  // Decide suggested type
  const subj = e.subject.toLowerCase();
  const suggestedType = (subj.includes('lỗi') || subj.includes('bug') || subj.includes('ticket') || (e.to||[]).some(x => x.toLowerCase().includes('support'))) ? 'ticket' : 'doc';

  return { messageId, inReplyTo, references, tags: Array.from(tags), project, hasAttachment: (e.attachments||[]).length>0, suggestedType };
}

export function applyRules(e: Email, rules: Rule[]): { matched?: Rule; target: { type:'doc'|'ticket'; title: string; project?: string; tags: string[] } } {
  const p = parseEmail(e);

  for (const r of rules.filter(x=>x.enabled)){
    const conds: boolean[] = [];
    if (r.when.fromIncludes){ conds.push(e.from.toLowerCase().includes(r.when.fromIncludes.toLowerCase())); }
    if (r.when.toIncludes){ conds.push((e.to||[]).join(';').toLowerCase().includes(r.when.toIncludes.toLowerCase())); }
    if (r.when.subjectIncludes){ conds.push((e.subject||'').toLowerCase().includes(r.when.subjectIncludes.toLowerCase())); }
    if (r.when.hasAttachment!==undefined){ conds.push(p.hasAttachment===r.when.hasAttachment); }
    if (r.when.bodyRegex){
      try {
        const rx = new RegExp(r.when.bodyRegex, 'i');
        conds.push(rx.test(`${e.subject}\n${e.body||''}`));
      } catch { /* ignore invalid regex */ }
    }
    if (conds.length && conds.every(Boolean)){
      const tags = r.then.tagsFromSubject ? p.tags : [];
      const title = e.subject.replace(/^\s*(re:|fw:)\s*/i,'').trim();
      const project = r.then.projectField ? p.project || r.then.defaultProject : r.then.defaultProject;
      return { matched: r, target: { type: r.then.type, title, project, tags } };
    }
  }

  // default
  const title = e.subject.replace(/^\s*(re:|fw:)\s*/i,'').trim();
  return { target: { type: p.suggestedType || 'doc', title, project: p.project, tags: p.tags } };
}
