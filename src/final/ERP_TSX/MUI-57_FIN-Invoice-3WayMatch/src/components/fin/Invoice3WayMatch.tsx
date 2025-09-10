
// src/components/fin/Invoice3WayMatch.tsx — FIN-13 Invoice_3WayMatch
import React, { useEffect, useMemo, useState } from 'react';
import { seedVendorsIfEmpty, listVendors } from '../../mock/vendors';
import { seedContractsIfEmpty, listContracts } from '../../mock/contracts';
import { seedPOsIfEmpty, listPOs } from '../../mock/pos';
import { seedInvoicesIfEmpty, listInvoices, updateInvoice, type Invoice } from '../../mock/invoices';
import { loadRules, saveRules, type MatchRules } from '../../mock/match_rules';
import { listByStatus, suggestForInvoice, autoEvaluateAndMark, approveInvoice, markException } from '../../mock/threeway';

type Tab = 'new'|'suggested'|'approved'|'exception'|'all';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function pct(n:number){ return (Number(n)||0).toFixed(2)+'%'; }
function money(n:number){ return (Number(n)||0).toLocaleString(); }

export const Invoice3WayMatch: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  useEffect(()=>{ seedVendorsIfEmpty(); seedContractsIfEmpty(); seedPOsIfEmpty(); seedInvoicesIfEmpty(); }, []);

  const vendors = useMemo(()=> listVendors(), []);
  const contracts = useMemo(()=> listContracts(), []);
  const pos = useMemo(()=> listPOs(), []);

  const [rules, setRules] = useState<MatchRules>(loadRules());
  const [tab, setTab] = useState<Tab>('new');
  const [invList, setInvList] = useState<Invoice[]>(listInvoices());
  const [selectedId, setSelectedId] = useState<string>('');
  const [showRules, setShowRules] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  const reload = () => { setInvList(listInvoices()); };
  useEffect(()=>{ reload(); }, []);

  const grouped = useMemo(()=> listByStatus(), [invList]);
  const list = grouped[tab];

  const selected = useMemo(()=> invList.find(x => x.id===selectedId) || list[0], [invList, selectedId, list]);

  const vendorName = (code?:string)=> vendors.find(v => v.code===code)?.name || code || '—';

  const evaluate = (inv: Invoice) => {
    autoEvaluateAndMark(inv);
    reload();
  };

  const manualSuggest = (inv: Invoice) => {
    inv.match = suggestForInvoice(inv);
    inv.status = 'suggested';
    updateInvoice(inv);
    reload();
  };

  const approve = (inv: Invoice) => { approveInvoice(inv); reload(); };
  const toException = (inv: Invoice) => { markException(inv, note); setNote(''); reload(); };

  const invTotal = (inv: Invoice) => inv.lines.reduce((s,l)=> s + (Number(l.unit_price)*Number(l.qty))*(1+Number(l.tax_rate||0)/100), 0);

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12 }}>
      {/* Header */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontWeight:800 }}>{t('Đối soát 3 chiều: HĐ↔PO↔Invoice','3‑Way Match: Contract↔PO↔Invoice')}</div>
          <Badge text="FIN-13" />
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Auto-approve theo ngưỡng','Auto-approve with thresholds')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=> setShowRules(true)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Rules','Rules')}</button>
          <button onClick={()=> selected && evaluate(selected)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Auto‑Evaluate','Auto‑Evaluate')}</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {(['new','suggested','approved','exception','all'] as Tab[]).map(s => (
          <button key={s} onClick={()=> setTab(s)} style={{ border:'1px solid #e5e7eb', borderRadius:999, padding:'6px 12px', background: tab===s ? '#eef2ff' : '#fff' }}>
            <b style={{ textTransform:'capitalize' }}>{s}</b> <span style={{ color:'#6b7280' }}>({grouped[s].length})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(320px, 420px) 1fr', gap:12 }}>
        {/* Left list */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto 1fr' }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>{t('Hoá đơn','Invoices')}</div>
          </div>
          <div style={{ overflow:'auto' }}>
            {list.map(inv => (
              <div key={inv.id} onClick={()=> setSelectedId(inv.id)} style={{ padding:10, borderBottom:'1px solid #f1f5f9', cursor:'pointer', background: selected?.id===inv.id?'#eef2ff':'transparent' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:700 }}>{inv.inv_no}</div>
                  <div><Badge text={inv.status} tone={inv.status==='approved'?'green': inv.status==='exception'?'red': inv.status==='suggested'?'amber':'slate'} /></div>
                </div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{new Date(inv.date).toISOString().slice(0,10)} • {vendorName(inv.vendor_code)}</div>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tổng','Total')}: {money(invTotal(inv))} {inv.currency}</div>
              </div>
            ))}
            {list.length===0 && <div style={{ color:'#6b7280', padding:10 }}>— {t('Không có dữ liệu','No data')} —</div>}
          </div>
        </div>

        {/* Right detail */}
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', display:'grid', gridTemplateRows:'auto auto 1fr auto' }}>
          {selected ? (
            <>
              <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontWeight:700 }}>{selected.inv_no}</div>
                  <div style={{ color:'#6b7280' }}>{new Date(selected.date).toISOString().slice(0,10)} • {vendorName(selected.vendor_code)} • {selected.currency}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=> manualSuggest(selected)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đề xuất khớp','Suggest match')}</button>
                  <button onClick={()=> evaluate(selected)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Auto‑Evaluate','Auto‑Evaluate')}</button>
                </div>
              </div>

              <div style={{ padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div><div style={{ color:'#6b7280', fontSize:12 }}>Contract</div><div>{selected.contract_no||'—'}</div></div>
                <div><div style={{ color:'#6b7280', fontSize:12 }}>PO</div><div>{selected.po_no||'—'}</div></div>
              </div>

              <div style={{ overflow:'auto', padding:'0 10px 10px 10px' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                    <th style={{ padding:'6px' }}>{t('Mã','SKU')}</th>
                    <th style={{ padding:'6px' }}>{t('Mô tả','Desc')}</th>
                    <th style={{ padding:'6px', textAlign:'right' }}>{t('SL','Qty')}</th>
                    <th style={{ padding:'6px', textAlign:'right' }}>{t('Đơn giá','Unit Price')}</th>
                    <th style={{ padding:'6px' }}>{t('Thuế %','Tax%')}</th>
                    <th style={{ padding:'6px' }}>{t('PO match','PO match')}</th>
                    <th style={{ padding:'6px' }}>{t('Chênh lệch','Variance')}</th>
                    <th style={{ padding:'6px' }}>{t('TT','OK')}</th>
                  </tr></thead>
                  <tbody>
                    {(selected.lines||[]).map((l, idx) => {
                      const m = (selected.match||[])[idx];
                      const ok = m && m.qty_ok && m.price_ok && m.tax_ok;
                      const po = m?.po_id ? pos.find(p => p.id===m.po_id) : null;
                      const pol = m?.po_line_id && po ? po.lines.find(x => x.id===m.po_line_id) : null;
                      return (
                        <tr key={l.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'6px', fontFamily:'monospace' }}>{l.sku||'—'}</td>
                          <td style={{ padding:'6px' }}>{l.desc}</td>
                          <td style={{ padding:'6px', textAlign:'right' }}>{l.qty}</td>
                          <td style={{ padding:'6px', textAlign:'right' }}>{money(l.unit_price)}</td>
                          <td style={{ padding:'6px' }}>{l.tax_rate||0}</td>
                          <td style={{ padding:'6px' }}>
                            {pol ? (<div>
                              <div style={{ fontFamily:'monospace' }}>{po?.po_no}</div>
                              <div style={{ color:'#6b7280', fontSize:12 }}>{pol.sku} • {pol.desc}</div>
                            </div>) : '—'}
                          </td>
                          <td style={{ padding:'6px' }}>
                            {m?.variance ? (
                              <div style={{ color:'#6b7280', fontSize:12 }}>
                                {t('SL','Qty')}: {pct(m.variance.qty_pct)}; {t('Giá','Price')}: {pct(m.variance.price_pct)}; Tax: {pct(m.variance.tax_pct)}
                              </div>
                            ) : '—'}
                          </td>
                          <td style={{ padding:'6px' }}>
                            {ok ? <Badge text="OK" tone="green" /> : <Badge text="CHECK" tone="amber" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ borderTop:'1px solid #e5e7eb', padding:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ color:'#6b7280', fontSize:12 }}>{t('Tổng','Total')}: <b>{money(invTotal(selected))} {selected.currency}</b></div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input value={note} onChange={e=> setNote(e.target.value)} placeholder={t('Ghi chú exception (tuỳ chọn)','Exception note (optional)')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', minWidth:220 }} />
                  <button onClick={()=> toException(selected)} style={{ border:'1px solid #ef4444', color:'#ef4444', background:'#fff', borderRadius:8, padding:'8px 12px' }}>{t('Gắn Exception','Mark Exception')}</button>
                  <button onClick={()=> approve(selected)} style={{ border:'1px solid #16a34a', color:'#fff', background:'#16a34a', borderRadius:8, padding:'8px 12px' }}>{t('Approve','Approve')}</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color:'#6b7280', padding:10 }}>— {t('Chọn một hoá đơn bên trái','Pick an invoice on the left')} —</div>
          )}
        </div>
      </div>

      {/* Rules Drawer */}
      {showRules && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', gridTemplateColumns:'1fr min(560px, 96vw)' }} onClick={()=> setShowRules(false)}>
          <div />
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', height:'100%', boxShadow:'-8px 0 24px rgba(0,0,0,.12)', display:'grid', gridTemplateRows:'auto 1fr auto' }}>
            <div style={{ padding:10, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{t('Rules tự động duyệt','Auto-approve rules')}</div>
              <button onClick={()=> setShowRules(false)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Đóng','Close')}</button>
            </div>
            <div style={{ padding:10, display:'grid', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}>
                <div>{t('Dung sai số lượng (%)','Qty tolerance (%)')}</div>
                <input type="number" value={rules.qty_tolerance_pct} onChange={e=> { const x={ ...rules, qty_tolerance_pct: Number(e.target.value) }; setRules(x); saveRules(x); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:160 }} />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <div>{t('Dung sai đơn giá (%)','Unit price tolerance (%)')}</div>
                <input type="number" value={rules.price_tolerance_pct} onChange={e=> { const x={ ...rules, price_tolerance_pct: Number(e.target.value) }; setRules(x); saveRules(x); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:160 }} />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <div>{t('Dung sai thuế suất (%)','Tax rate tolerance (%)')}</div>
                <input type="number" value={rules.tax_tolerance_pct} onChange={e=> { const x={ ...rules, tax_tolerance_pct: Number(e.target.value) }; setRules(x); saveRules(x); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:160 }} />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <div>{t('Bật auto-approve','Enable auto-approve')}</div>
                <input type="checkbox" checked={rules.auto_approve_enabled} onChange={e=> { const x={ ...rules, auto_approve_enabled: (e.target as HTMLInputElement).checked }; setRules(x); saveRules(x); }} />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <div>{t('Giới hạn số tiền auto-approve','Auto-approve cap')}</div>
                <input type="number" value={rules.auto_approve_cap} onChange={e=> { const x={ ...rules, auto_approve_cap: Number(e.target.value) }; setRules(x); saveRules(x); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:200 }} />
              </label>
            </div>
            <div style={{ padding:10, borderTop:'1px solid #e5e7eb', color:'#6b7280', fontSize:12 }}>
              {t('Lưu tự động vào trình duyệt (demo). Sản phẩm thật lưu vào DB và dùng workflow APP‑01 để duyệt.','Auto-saved in browser (demo). In production, persist to DB and use APP‑01 workflow for approvals.')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
