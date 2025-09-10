
// src/mock/threeway.ts — 3-way matching logic
import { listPOs, updatePO, type PO, type POLine } from './pos';
import { listContracts, type Contract } from './contracts';
import { listInvoices, updateInvoice, type Invoice, type InvMatch } from './invoices';
import { loadRules, type MatchRules } from './match_rules';

function abs(n:number){ return Math.abs(Number(n)||0); }
function pctDiff(a:number, b:number){ if (!b) return 100; return abs(a-b)/abs(b)*100; }

export function suggestForInvoice(inv: Invoice): InvMatch[] {
  const rules = loadRules();
  const pos = listPOs().filter(p => p.vendor_code===inv.vendor_code && p.currency===inv.currency);
  const matches: InvMatch[] = [];
  inv.lines.forEach(line => {
    // find best PO line by sku or desc similarity
    let best: { po:PO, pol:POLine, score:number } | null = null;
    pos.forEach(po => {
      po.lines.forEach(pol => {
        const sameSku = line.sku && pol.sku && line.sku===pol.sku;
        const nameHit = (line.desc||'').toLowerCase().includes((pol.desc||'').toLowerCase().split(' ')[0]);
        const priceNear = pctDiff(line.unit_price, pol.unit_price) <= (rules.price_tolerance_pct*2);
        const remainQty = Math.max(0, pol.qty_ordered - pol.qty_invoiced);
        const qtyFit = remainQty >= line.qty;
        let score = 0;
        if (sameSku) score += 70;
        if (nameHit) score += 15;
        if (priceNear) score += 10;
        if (qtyFit) score += 5;
        if (!best || score>best.score) best = { po, pol, score };
      });
    });
    if (best){
      const v_qty = pctDiff(line.qty, Math.max(0, best.pol.qty_ordered - best.pol.qty_invoiced));
      const v_price = pctDiff(line.unit_price, best.pol.unit_price);
      const v_tax = pctDiff(line.tax_rate||0, best.pol.tax_rate||0);
      matches.push({
        po_id: best.po.id, po_line_id: best.pol.id,
        qty_ok: v_qty <= rules.qty_tolerance_pct,
        price_ok: v_price <= rules.price_tolerance_pct,
        tax_ok: v_tax <= rules.tax_tolerance_pct,
        variance: { qty_pct: v_qty, price_pct: v_price, tax_pct: v_tax }
      });
    } else {
      matches.push({});
    }
  });
  return matches;
}

export function autoEvaluateAndMark(inv: Invoice): Invoice {
  const rules = loadRules();
  const total = inv.lines.reduce((s,l)=> s + (Number(l.unit_price||0)*Number(l.qty||0))*(1+Number(l.tax_rate||0)/100), 0);
  const m = suggestForInvoice(inv);
  const allOk = m.length && m.every(x => x.po_id && x.qty_ok && x.price_ok && x.tax_ok);
  inv.match = m;
  if (allOk && rules.auto_approve_enabled && total <= rules.auto_approve_cap){
    inv.status = 'approved';
    // update PO qty_invoiced
    const pos = listPOs();
    m.forEach((mm, idx) => {
      if (!mm.po_id || !mm.po_line_id) return;
      const po = pos.find(p => p.id===mm.po_id); if (!po) return;
      const pol = po.lines.find(l => l.id===mm.po_line_id); if (!pol) return;
      pol.qty_invoiced += inv.lines[idx].qty;
      updatePO(po);
    });
  } else {
    inv.status = 'suggested';
  }
  updateInvoice(inv);
  return inv;
}

export function approveInvoice(inv: Invoice){
  inv.status='approved';
  updateInvoice(inv);
}
export function markException(inv: Invoice, note?: string){
  inv.status='exception'; inv.note = note||inv.note; updateInvoice(inv);
}

export function listByStatus(){ 
  const arr = listInvoices();
  return {
    new: arr.filter(x=>x.status==='new'),
    suggested: arr.filter(x=>x.status==='suggested'),
    approved: arr.filter(x=>x.status==='approved'),
    exception: arr.filter(x=>x.status==='exception'),
    all: arr
  };
}
