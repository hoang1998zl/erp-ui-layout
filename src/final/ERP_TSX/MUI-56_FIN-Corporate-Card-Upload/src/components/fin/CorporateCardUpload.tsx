
// src/components/fin/CorporateCardUpload.tsx — FIN-12 Corporate_Card_Upload
import React, { useEffect, useMemo, useState } from 'react';
import { listTxns, upsertMany, updateTxn, type CardTxn } from '../../mock/corp_card';
import { listDrafts, type ExpenseDraft } from '../../mock/expense';

type Step = 1|2|3; // 1 Upload, 2 Map, 3 Review

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}

function parseCSV(text: string): { header: string[]; rows: string[][] } {
  // Simple CSV parser (no quotes nesting)
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  const header = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));
  return { header, rows };
}

function hashTxn(o: any): string {
  const k = `${o.date}|${o.amount}|${(o.merchant||'').toLowerCase()}|${o.currency||''}|${o.card_last4||''}`;
  let h = 0; for (let i=0; i<k.length; i++) { h = (h*31 + k.charCodeAt(i))|0; }
  return String(h);
}

function tryParseDate(s: string): string | null {
  // Accept YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
  if (!s) return null;
  let d: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) d = new Date(s);
  else if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [a,b,c] = s.split('/'); // try DD/MM/YYYY then MM/DD/YYYY (ambiguous)
    const dd = parseInt(a,10), mm = parseInt(b,10)-1, yy = parseInt(c,10);
    d = new Date(yy, mm, dd);
    if (isNaN(d.getTime())) { d = new Date(yy, parseInt(a,10)-1, parseInt(b,10)); } // fallback
  } else if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
    const [a,b,c] = s.split('-'); d = new Date(parseInt(c,10), parseInt(b,10)-1, parseInt(a,10));
  } else {
    const t = Date.parse(s); if (!isNaN(t)) d = new Date(t);
  }
  if (!d || isNaN(d.getTime())) return null;
  const iso = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
  return iso;
}

// Fuzzy match to expenses (submitted/approved)
function suggestMatch(txn: CardTxn, expenses: ExpenseDraft[]) {
  const cand = expenses.filter((e:any)=> ['submitted','approved'].includes(e.status));
  type Cand = { expense: ExpenseDraft; line_id?: string; score: number; reason: string };
  const out: Cand[] = [];
  cand.forEach(e => {
    const headerScore = (() => {
      // amount ~ sum lines? loosely
      const sum = (e.lines||[]).reduce((s:any,l:any)=> s + (Number(l.amount)||0), 0);
      const diff = Math.abs(sum - Math.abs(txn.amount));
      let s = 0;
      if (diff <= Math.max(10000, Math.abs(txn.amount)*0.02)) s += 60; // amount closeness
      const days = Math.abs((new Date(e.date).getTime() - new Date(txn.date).getTime())/(86400000));
      if (days <= 7) s += 20;
      const text = ((e.title||'') + ' ' + (e.lines||[]).map((l:any)=>l.description||'').join(' ')).toLowerCase();
      if (txn.merchant && text.includes(txn.merchant.toLowerCase().split(' ')[0])) s += 20;
      return { s, reason: `Δ${diff.toFixed(0)}, ${days}d` };
    })();
    out.push({ expense: e, score: headerScore.s, reason: headerScore.reason });
    // also try per-line match
    (e.lines||[]).forEach((l:any) => {
      const diff = Math.abs(Number(l.amount||0) - Math.abs(txn.amount));
      let s = 0;
      if (diff <= Math.max(5000, Math.abs(txn.amount)*0.01)) s += 70;
      const days = Math.abs((new Date(e.date).getTime() - new Date(txn.date).getTime())/(86400000));
      if (days <= 10) s += 20;
      const desc = ((l.description||'')+' '+(e.title||'')).toLowerCase();
      if (txn.merchant && desc.includes(txn.merchant.toLowerCase().split(' ')[0])) s += 10;
      out.push({ expense: e, line_id: l.id, score: s, reason: `Δ${diff.toFixed(0)}, ${days}d` });
    });
  });
  out.sort((a,b)=> b.score - a.score);
  return out.slice(0, 5);
}

export const CorporateCardUpload: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [step, setStep] = useState<Step>(1);
  const [raw, setRaw] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);

  // mapping
  const [colDate, setColDate] = useState<string>('');
  const [colAmount, setColAmount] = useState<string>('');
  const [colCurrency, setColCurrency] = useState<string>('');
  const [colMerchant, setColMerchant] = useState<string>('');
  const [colLast4, setColLast4] = useState<string>('');
  const [colDesc, setColDesc] = useState<string>('');
  const [colExtId, setColExtId] = useState<string>('');

  // review
  const [imported, setImported] = useState<CardTxn[]>([]);
  const [txns, setTxns] = useState<CardTxn[]>([]);

  const expenses = useMemo(()=> listDrafts(), []);

  useEffect(()=>{ setTxns(listTxns()); }, []);

  // Auto map headers
  const autoMap = (h: string[]) => {
    const pick = (cands: RegExp[]) => h.find(x => cands.some(r => r.test(x.toLowerCase()))) || '';
    setColDate(pick([/date/,/ngày/,/posting/]));
    setColAmount(pick([/amount/,/số.*tiền/,/amt/]));
    setColCurrency(pick([/currency/,/tiền.*tệ/,/cur/]));
    setColMerchant(pick([/merchant|vendor|payee|description|memo|chi tiết/]));
    setColLast4(pick([/last.?4|card|thẻ/]));
    setColDesc(pick([/desc|memo|note|chi tiết/]));
    setColExtId(pick([/id|ref|transaction|số tham chiếu/]));
  };

  const onUpload = (file: File) => {
    setFileName(file.name);
    const fr = new FileReader();
    fr.onload = () => {
      const text = String(fr.result||'');
      setRaw(text);
      const { header, rows } = parseCSV(text);
      setHeader(header); setRows(rows);
      autoMap(header);
      setStep(2);
    };
    fr.readAsText(file);
  };

  const sample = () => {
    const csv = 'date,amount,currency,merchant,card_last4,description,ext_id\n2025-03-01,-150000,VND,Grab,1234,Grab ride 03/01,TXN001\n2025-03-02,-320000,VND,Highlands,1234,Lunch with client,TXN002\n2025-03-05,-900000,VND,HotelABC,1234,Hotel stay,TXN003\n';
    const { header, rows } = parseCSV(csv);
    setFileName('sample.csv'); setRaw(csv); setHeader(header); setRows(rows); autoMap(header); setStep(2);
  };

  const toCardTxns = (): CardTxn[] => {
    const idx = (name: string) => header.indexOf(name);
    const get = (row: string[], name: string) => {
      const i = idx(name); return i>=0 ? row[i] : '';
    };
    // Make a mapping from selected columns to actual header name
    const m: Record<string,string> = { date: colDate, amount: colAmount, currency: colCurrency, merchant: colMerchant, last4: colLast4, desc: colDesc, ext_id: colExtId };
    const id = (name: string) => header.indexOf(m[name]||''); 
    const out: CardTxn[] = rows.map(r => {
      const dateISO = tryParseDate(r[id('date')]) || new Date().toISOString();
      const amt = Number(String(r[id('amount')]||'').replace(/,/g,''));
      const cur = (r[id('currency')]||'VND') || 'VND';
      const merchant = r[id('merchant')] || '';
      const last4 = r[id('last4')] || '';
      const desc = r[id('desc')] || '';
      const extId = r[id('ext_id')] || '';
      const o = { date: dateISO, amount: amt, currency: cur, merchant, card_last4: last4, description: desc, ext_id: extId, source_file: fileName, status:'new' as const };
      (o as any).hash = hashTxn(o);
      return o as any;
    });
    return out;
  };

  const importNow = () => {
    const arr = toCardTxns();
    setImported(arr);
    upsertMany(arr);
    setTxns(listTxns());
    setStep(3);
  };

  const suggestFor = (txn: CardTxn) => suggestMatch(txn, expenses);

  const [drawerId, setDrawerId] = useState<string>('');

  const acceptMatch = (txn: CardTxn, e: ExpenseDraft, line_id?: string) => {
    updateTxn(txn.id, { status:'matched', match: { expense_id: e.id, line_id, score: 100, decided_at: new Date().toISOString() } as any });
    setTxns(listTxns());
    setDrawerId('');
  };

  const txNew = useMemo(()=> txns.filter(t => t.status!=='matched'), [txns]);
  const txMatched = useMemo(()=> txns.filter(t => t.status==='matched'), [txns]);

  return (
    <div style={{ display:'grid', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Import sao kê thẻ (Corporate Card)','Corporate Card import')}</div>
          <Badge text="FIN-12" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Upload CSV → Map cột → Tự gợi ý khớp Expense','Upload CSV → Map columns → Auto-suggest matches to Expense')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={sample} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Dùng file mẫu','Sample file')}</button>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
        {[1,2,3].map(n => (
          <div key={n} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:10, background: step===n ? '#eef2ff' : '#fff' }}>
            <div style={{ fontWeight:700 }}>{n}. {n===1?t('Upload','Upload'): n===2?t('Map cột','Map columns') : t('Rà soát & ghép','Review & match')}</div>
            <div style={{ color:'#6b7280', fontSize:12 }}>
              {n===1? t('Chọn tệp CSV sao kê thẻ','Pick CSV statement file'):
               n===2? t('Chọn cột Date/Amount/Merchant...','Select Date/Amount/Merchant...'):
               t('Xem gợi ý khớp và xác nhận','See suggestions and confirm')}
            </div>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step===1 && (
        <div style={{ border:'2px dashed #cbd5e1', borderRadius:12, background:'#fff', padding:20, textAlign:'center' }}>
          <input type="file" accept=".csv,text/csv" onChange={e=>{ const f = e.target.files?.[0]; if (f) onUpload(f); }} />
          <div style={{ color:'#6b7280', marginTop:8 }}>{t('Chấp nhận CSV với cột: date, amount, currency, merchant, (card_last4), (description), (ext_id).','Accepts CSV columns: date, amount, currency, merchant, (card_last4), (description), (ext_id).')}</div>
        </div>
      )}

      {/* Step 2 */}
      {step===2 && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
          <div style={{ padding:10, display:'grid', gap:10 }}>
            <div style={{ fontWeight:700 }}>{t('Map cột','Map columns')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}><div>Date</div><select value={colDate} onChange={e=> setColDate(e.target.value)}>{['',...header].map(h => <option key={h} value={h}>{h||'—'}</option>)}</select></label>
              <label style={{ display:'grid', gap:6 }}><div>Amount</div><select value={colAmount} onChange={e=> setColAmount(e.target.value)}>{['',...header].map(h => <option key={h} value={h}>{h||'—'}</option>)}</select></label>
              <label style={{ display:'grid', gap:6 }}><div>Currency</div><select value={colCurrency} onChange={e=> setColCurrency(e.target.value)}>{['',...header].map(h => <option key={h} value={h}>{h||'—'}</option>)}</select></label>
              <label style={{ display:'grid', gap:6 }}><div>Merchant</div><select value={colMerchant} onChange={e=> setColMerchant(e.target.value)}>{['',...header].map(h => <option key={h} value={h}>{h||'—'}</option>)}</select></label>
              <label style={{ display:'grid', gap:6 }}><div>Card last4</div><select value={colLast4} onChange={e=> setColLast4(e.target.value)}>{['',...header].map(h => <option key={h} value={h}>{h||'—'}</option>)}</select></label>
              <label style={{ display:'grid', gap:6 }}><div>Description</div><select value={colDesc} onChange={e=> setColDesc(e.target.value)}>{['',...header].map(h => <option key={h} value={h}>{h||'—'}</option>)}</select></label>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}><div>External ID</div><select value={colExtId} onChange={e=> setColExtId(e.target.value)}>{['',...header].map(h => <option key={h} value={h}>{h||'—'}</option>)}</select></label>
              <div />
            </div>
            <div style={{ color:'#6b7280', fontSize:12 }}>{t('Xem trước 5 dòng','Preview first 5 rows')}:</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{header.map(h => <th key={h} style={{ padding:'6px', borderBottom:'1px solid #e5e7eb' }}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0,5).map((r, i) => <tr key={i}>{r.map((v,j)=><td key={j} style={{ padding:'6px', borderTop:'1px solid #f1f5f9' }}>{v}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <div style={{ borderTop:'1px solid #e5e7eb', padding:10, display:'flex', justifyContent:'space-between' }}>
            <button onClick={()=> setStep(1)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff' }}>← {t('Quay lại','Back')}</button>
            <button onClick={importNow} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'8px 12px' }}>{t('Nhập & tiếp tục','Import & continue')}</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step===3 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:700 }}>{t('Giao dịch mới cần rà soát','New transactions for review')}</div>
              <div style={{ color:'#6b7280' }}>{t('Tổng','Total')}: {txNew.length}</div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px' }}>Date</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Số tiền','Amount')}</th>
                <th style={{ padding:'6px' }}>Cur</th>
                <th style={{ padding:'6px' }}>{t('Đơn vị chấp nhận','Merchant')}</th>
                <th style={{ padding:'6px' }}></th>
              </tr></thead>
              <tbody>
                {txNew.map(tx => (
                  <tr key={tx.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px' }}>{new Date(tx.date).toISOString().slice(0,10)}</td>
                    <td style={{ padding:'6px', textAlign:'right' }}>{Math.abs(tx.amount).toLocaleString()}</td>
                    <td style={{ padding:'6px' }}>{tx.currency}</td>
                    <td style={{ padding:'6px' }}>{tx.merchant||'—'}</td>
                    <td style={{ padding:'6px' }}><button onClick={()=> setDrawerId(tx.id)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', background:'#fff' }}>{t('Khớp','Match')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {txNew.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Không còn giao dịch cần rà soát','No pending transactions')} —</div>}
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:700 }}>{t('Đã khớp','Matched')}</div>
              <div style={{ color:'#6b7280' }}>{t('Tổng','Total')}: {txMatched.length}</div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                <th style={{ padding:'6px' }}>Date</th>
                <th style={{ padding:'6px', textAlign:'right' }}>{t('Số tiền','Amount')}</th>
                <th style={{ padding:'6px' }}>{t('Expense','Expense')}</th>
                <th style={{ padding:'6px' }}>{t('Line','Line')}</th>
              </tr></thead>
              <tbody>
                {txMatched.map(tx => (
                  <tr key={tx.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px' }}>{new Date(tx.date).toISOString().slice(0,10)}</td>
                    <td style={{ padding:'6px', textAlign:'right' }}>{Math.abs(tx.amount).toLocaleString()}</td>
                    <td style={{ padding:'6px' }}>{tx.match?.expense_id?.slice(0,8) || '—'}</td>
                    <td style={{ padding:'6px' }}>{(tx.match?.line_id||'—').slice(0,8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {txMatched.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Chưa có giao dịch nào được khớp','No matched yet')} —</div>}
          </div>
        </div>
      )}

      {/* Drawer for match suggestion */}
      {drawerId && (()=>{
        const tx = txns.find(x => x.id===drawerId);
        if (!tx) return null;
        const sug = suggestFor(tx);
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', gridTemplateColumns:'1fr min(900px, 96vw)' }} onClick={()=> setDrawerId('')}>
            <div />
            <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', height:'100%', boxShadow:'-8px 0 24px rgba(0,0,0,.12)', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
              <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontWeight:700 }}>{t('Ghép giao dịch thẻ','Match card transaction')}</div>
                  <Badge text={tx.currency} tone="violet" />
                </div>
                <button onClick={()=> setDrawerId('')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
              </div>
              <div style={{ overflow:'auto', padding:10, display:'grid', gap:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><div style={{ color:'#6b7280', fontSize:12 }}>Date</div><div>{new Date(tx.date).toISOString().slice(0,10)}</div></div>
                  <div><div style={{ color:'#6b7280', fontSize:12 }}>{t('Số tiền','Amount')}</div><div style={{ fontWeight:700 }}>{Math.abs(tx.amount).toLocaleString()} {tx.currency}</div></div>
                </div>
                <div><div style={{ color:'#6b7280', fontSize:12 }}>{t('Merchant','Merchant')}</div><div>{tx.merchant||'—'}</div></div>
                <div><div style={{ color:'#6b7280', fontSize:12 }}>{t('Mô tả','Description')}</div><div>{tx.description||'—'}</div></div>
                <div style={{ fontWeight:700, marginTop:6 }}>{t('Gợi ý khớp','Suggestions')}</div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                    <th style={{ padding:'6px' }}>{t('Expense','Expense')}</th>
                    <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
                    <th style={{ padding:'6px', textAlign:'right' }}>{t('Tổng','Total')}</th>
                    <th style={{ padding:'6px' }}>{t('Dòng','Line')}</th>
                    <th style={{ padding:'6px' }}>{t('Điểm','Score')}</th>
                    <th style={{ padding:'6px' }}>{t('Lý do','Reason')}</th>
                    <th style={{ padding:'6px' }}></th>
                  </tr></thead>
                  <tbody>
                    {sug.map((c,i) => (
                      <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'6px', fontFamily:'monospace' }}>{c.expense.id.slice(0,8)}</td>
                        <td style={{ padding:'6px' }}>{c.expense.title||'—'}</td>
                        <td style={{ padding:'6px', textAlign:'right' }}>{(c.expense.lines||[]).reduce((s:any,l:any)=> s + (Number(l.amount)||0),0).toLocaleString()}</td>
                        <td style={{ padding:'6px' }}>{c.line_id? c.line_id.slice(0,8) : '—'}</td>
                        <td style={{ padding:'6px' }}>{c.score}</td>
                        <td style={{ padding:'6px' }}>{c.reason}</td>
                        <td style={{ padding:'6px' }}><button onClick={()=> acceptMatch(tx, c.expense, c.line_id)} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'4px 8px' }}>{t('Chọn','Select')}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sug.length===0 && <div style={{ color:'#6b7280' }}>— {t('Không có gợi ý, hãy tìm tay','No suggestions, pick manually')} —</div>}
                <div style={{ display:'grid', gap:6 }}>
                  <div style={{ color:'#6b7280', fontSize:12 }}>{t('Hoặc chọn thủ công','Or pick manually')}</div>
                  <select onChange={e=> { const id = e.target.value; const e1 = expenses.find(x => x.id===id); if (e1) acceptMatch(tx, e1); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    <option value="">{t('— Chọn Expense —','— Pick Expense —')}</option>
                    {expenses.map(e => <option key={e.id} value={e.id}>{new Date(e.date).toISOString().slice(0,10)} • {(e.title||'—')} • {e.employee_code}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ padding:10, borderTop:'1px solid #e5e7eb', display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={()=> setDrawerId('')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
