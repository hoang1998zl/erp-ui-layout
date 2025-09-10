
// src/components/fin/GLPostingSimulator.tsx — FIN-11 GL_Posting_Simulator
import React, { useEffect, useMemo, useState } from 'react';
import { listApprovedUnposted, listDrafts, markPosted, type ExpenseDraft } from '../../mock/expense';
import { loadRules, saveRules, findAccountFor, type RulesPack } from '../../mock/posting_rules';
import { addJournal, totals, type GLLine } from '../../mock/gl';

type Mode = 'per-expense'|'consolidated';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function money(n:number){ return (Number(n)||0).toLocaleString(); }

export const GLPostingSimulator: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [credit, setCredit] = useState<string>('334');
  const [mode, setMode] = useState<Mode>('per-expense');
  const [rules, setRules] = useState<RulesPack>(loadRules());
  const [rows, setRows] = useState<ExpenseDraft[]>([]);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<Array<{ expense_id: string; lines: GLLine[]; ok:boolean; err?:string }>>([]);

  const reload = () => { setRows(listApprovedUnposted()); setSel({}); setPreview([]); };
  useEffect(()=>{ reload(); }, []);

  const selectedIds = Object.entries(sel).filter(([,v])=>v).map(([k])=>k);
  const anySelected = selectedIds.length>0;

  const calcLineParts = (gross: number, tax_rate: number) => {
    const rate = Number(tax_rate||0)/100;
    const tax = gross - gross / (1+rate);
    const net = gross - tax;
    return { net: Math.round(net*100)/100, tax: Math.round(tax*100)/100 };
  };

  const simulate = () => {
    if (!anySelected) { alert(t('Chọn ít nhất 1 phiếu','Select at least 1 expense')); return; }
    const out: Array<{ expense_id: string; lines: GLLine[]; ok:boolean; err?:string }> = [];
    selectedIds.forEach(eid => {
      const exp = rows.find(r => r.id===eid);
      if (!exp) return;
      const lines: GLLine[] = [];
      let error = '';
      try {
        const currency = (exp as any).currency || 'VND';
        (exp.lines||[]).forEach(l => {
          const expAcc = findAccountFor(l.category, rules);
          if (!expAcc) { error = t('Thiếu mapping tài khoản cho','Missing account mapping for')+` ${l.category}`; }
          const gross = Number(l.amount||0);
          const { net, tax } = calcLineParts(gross, Number(l.tax_rate||0));
          // Debit expense
          lines.push({ id: Math.random().toString(36).slice(2), account: expAcc||'???', debit: net, credit: 0, project_code: l.project_code || exp.project_code, dept_code: exp.dept_code, memo: l.description||exp.title, expense_id: exp.id, expense_line_id: l.id });
          // Debit VAT if any
          if (tax>0) lines.push({ id: Math.random().toString(36).slice(2), account: rules.vat_account, debit: tax, credit: 0, project_code: l.project_code || exp.project_code, dept_code: exp.dept_code, memo: 'VAT', expense_id: exp.id, expense_line_id: l.id });
        });
        // Credit payable (gross total)
        const grossTotal = (exp.lines||[]).reduce((s,l)=> s + (Number(l.amount)||0), 0);
        lines.push({ id: Math.random().toString(36).slice(2), account: credit, debit: 0, credit: grossTotal, project_code: exp.project_code, dept_code: exp.dept_code, memo: `Payable for expense ${exp.title||exp.id}`, expense_id: exp.id });
      } catch (e:any) { error = e?.message || String(e); }
      const { debit, credit } = totals(lines);
      out.push({ expense_id: eid, lines, ok: Math.abs(debit-credit) < 0.01 && !error, err: error || (Math.abs(debit-credit) >= 0.01 ? t('Lệch Nợ/Có','Out of balance') : undefined) });
    });
    setPreview(out);
  };

  const commit = () => {
    if (!preview.length) { alert(t('Chưa có preview','No preview')); return; }
    const bad = preview.filter(p => !p.ok);
    if (bad.length) { alert(t('Có journal chưa cân bằng/thiếu mapping','Some journals invalid')); return; }
    if (!confirm(t('Xác nhận hạch toán GL cho các phiếu đã chọn?','Commit GL posting for selected expenses?'))) return;

    // Create journals (per expense or consolidated)
    if (mode==='per-expense'){
      preview.forEach(p => {
        const exp = rows.find(r => r.id===p.expense_id)!;
        const j = addJournal({ date: new Date(date).toISOString(), currency: (exp as any).currency || 'VND', source:'expense', expense_ids:[exp.id], lines: p.lines });
        markPosted(exp.id, j.id);
      });
    } else {
      const allLines = preview.flatMap(p => p.lines);
      const expense_ids = preview.map(p => p.expense_id);
      const j = addJournal({ date: new Date(date).toISOString(), currency: 'VND', source:'expense', expense_ids, lines: allLines });
      expense_ids.forEach(id => markPosted(id, j.id));
    }
    alert(t('Đã tạo bút toán GL','GL journals created'));
    reload();
  };

  const exportCSV = () => {
    if (!preview.length) { alert(t('Chưa có preview','No preview')); return; }
    const header = 'expense_id,account,debit,credit,project,dept,memo';
    const rows = preview.flatMap(p => p.lines.map(l => [p.expense_id, l.account, String(l.debit||0), String(l.credit||0), l.project_code||'', l.dept_code||'', (l.memo||'').replace(/,/g,' ')].join(',')));
    const csv = [header, ...rows].join('\\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='gl_posting_preview.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const saveRule = (cat:string, acc:string) => {
    const pack = { ...rules, rules: rules.rules.map(r => r.category===cat ? { ...r, expense_account: acc } : r) };
    setRules(pack); saveRules(pack);
  };

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr auto', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Giả lập hạch toán GL','GL Posting Simulator')}</div>
          <Badge text="FIN-11" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Từ Expense đã APPROVED → Journal GL (preview & commit)','From approved Expenses → GL Journals (preview & commit)')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={exportCSV} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export CSV</button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10, alignItems:'end' }}>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Ngày hạch toán','Posting date')}</div>
          <input type="date" value={date} onChange={e=> setDate(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Tài khoản có (credit)','Credit account')}</div>
          <select value={credit} onChange={e=> setCredit(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}>
            {['334','111','112','331'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('Chế độ','Mode')}</div>
          <select value={mode} onChange={e=> setMode(e.target.value as Mode)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}>
            <option value="per-expense">{t('1 journal / 1 expense','1 journal / 1 expense')}</option>
            <option value="consolidated">{t('Gộp 1 journal','Consolidated 1 journal')}</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('TK VAT đầu vào','VAT input account')}</div>
          <input value={rules.vat_account} onChange={e=> { const p = { ...rules, vat_account: e.target.value }; setRules(p); saveRules(p); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{t('TK credit mặc định','Default credit')}</div>
          <input value={rules.default_credit} onChange={e=> { const p = { ...rules, default_credit: e.target.value }; setRules(p); saveRules(p); setCredit(e.target.value); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }} />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={simulate} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff', width:'100%' }}>{t('Giả lập','Simulate')}</button>
        </div>
      </div>

      {/* List of approved expenses (unposted) */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:6 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 6px' }}>
          <div style={{ fontWeight:700 }}>{t('Phiếu đã duyệt (chưa post)','Approved expenses (unposted)')}</div>
          <div>{t('Đã chọn','Selected')}: {selectedIds.length}</div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
              <th style={{ padding:'6px' }}><input type="checkbox" onChange={e=> {
                const check = (e.target as HTMLInputElement).checked; const next:any = {};
                rows.forEach(r => next[r.id] = check); setSel(next);
              }} /></th>
              <th style={{ padding:'6px' }}>Date</th>
              <th style={{ padding:'6px' }}>{t('Tiêu đề','Title')}</th>
              <th style={{ padding:'6px' }}>{t('Nhân viên','Employee')}</th>
              <th style={{ padding:'6px' }}>Project</th>
              <th style={{ padding:'6px' }}>{t('Số dòng','Lines')}</th>
              <th style={{ padding:'6px', textAlign:'right' }}>{t('Tổng (gross)','Total (gross)')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:'6px' }}><input type="checkbox" checked={!!sel[r.id]} onChange={e=> setSel({ ...sel, [r.id]: (e.target as HTMLInputElement).checked })} /></td>
                <td style={{ padding:'6px' }}>{new Date(r.date).toISOString().slice(0,10)}</td>
                <td style={{ padding:'6px' }}>{r.title||'—'}</td>
                <td style={{ padding:'6px', fontFamily:'monospace' }}>{r.employee_code}</td>
                <td style={{ padding:'6px' }}>{r.project_code||'—'}</td>
                <td style={{ padding:'6px' }}>{(r.lines||[]).length}</td>
                <td style={{ padding:'6px', textAlign:'right' }}>{(r.lines||[]).reduce((s,l)=> s + (Number((l as any).amount)||0),0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length===0 && <div style={{ color:'#6b7280', padding:'8px' }}>— {t('Không có phiếu cần post','Nothing to post')} —</div>}
      </div>

      {/* Preview area */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:700 }}>{t('Preview bút toán GL','GL journal preview')}</div>
          <div style={{ color:'#6b7280' }}>{t('Số journal','Journals')}: {preview.length}</div>
        </div>
        {preview.length===0 ? (
          <div style={{ color:'#6b7280', padding:10 }}>— {t('Chưa có preview','No preview')} —</div>
        ) : (
          <div style={{ display:'grid', gap:10, padding:10 }}>
            {preview.map((p, idx) => {
              const tt = p.lines.reduce((s,l)=> ({ d: s.d + (Number(l.debit)||0), c: s.c + (Number(l.credit)||0) }), { d:0, c:0 });
              return (
                <div key={idx} style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'#fafafa', borderBottom:'1px solid #e5e7eb' }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ fontWeight:700 }}>{t('Expense','Expense')} #{p.expense_id.slice(0,6)}</div>
                      {p.ok ? <Badge text={t('Cân bằng','Balanced')} tone="green" /> : <Badge text={p.err||t('Lỗi','Error')} tone="red" />}
                    </div>
                    <div style={{ fontFamily:'monospace' }}>D {money(tt.d)} • C {money(tt.c)}</div>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                      <th style={{ padding:'6px' }}>{t('TK','Acc')}</th>
                      <th style={{ padding:'6px', textAlign:'right' }}>Debit</th>
                      <th style={{ padding:'6px', textAlign:'right' }}>Credit</th>
                      <th style={{ padding:'6px' }}>Project</th>
                      <th style={{ padding:'6px' }}>Dept</th>
                      <th style={{ padding:'6px' }}>{t('Diễn giải','Memo')}</th>
                    </tr></thead>
                    <tbody>
                      {p.lines.map((l,i) => (
                        <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'6px', fontFamily:'monospace' }}>{l.account}</td>
                          <td style={{ padding:'6px', textAlign:'right' }}>{money(l.debit)}</td>
                          <td style={{ padding:'6px', textAlign:'right' }}>{money(l.credit)}</td>
                          <td style={{ padding:'6px' }}>{l.project_code||'—'}</td>
                          <td style={{ padding:'6px' }}>{l.dept_code||'—'}</td>
                          <td style={{ padding:'6px' }}>{l.memo||''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rules editor + Commit */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{t('Mapping nhóm chi phí → TK chi phí','Category → Expense account mapping')}</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}><th style={{ padding:'6px' }}>{t('Nhóm chi phí','Category')}</th><th style={{ padding:'6px' }}>{t('Tài khoản','Account')}</th></tr></thead>
            <tbody>
              {rules.rules.map(r => (
                <tr key={r.category} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'6px' }}>{r.category}</td>
                  <td style={{ padding:'6px' }}><input value={r.expense_account} onChange={e=> saveRule(r.category, e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 6px', width:160, fontFamily:'monospace' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ color:'#6b7280', fontSize:12, marginTop:6 }}>{t('Thiếu mapping sẽ báo lỗi ở preview.','Missing mappings will show as errors in preview.')}</div>
        </div>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', alignContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Hành động','Actions')}</div>
            <div style={{ color:'#6b7280', fontSize:12, marginBottom:8 }}>{t('Kiểm tra preview cân bằng trước khi Post.','Ensure balanced preview before posting.')}</div>
            <button onClick={commit} disabled={!preview.length || preview.some(p => !p.ok)} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'10px 12px' }}>{t('Commit Post','Commit Post')}</button>
          </div>
          <div style={{ color:'#6b7280', fontSize:12, marginTop:12 }}>
            {t('Sau khi Post','After Post')}: {t('Expenses sẽ được gắn posting_id và lưu Journal vào sổ GL.','Expenses will be marked with posting_id and journal saved.')}
          </div>
        </div>
      </div>
    </div>
  );
};
