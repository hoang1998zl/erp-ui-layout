
// src/integrations/ocr/mockProviders.ts — simulate multiple OCR providers and basic parsing
import type { OCRConfig, OcrOptions, OCRResult, Field, Provider } from './types';

function sleep(ms:number){ return new Promise(res => setTimeout(res, ms)); }
function readAsText(file: File): Promise<string>{
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(fr.error);
    fr.onload = () => res(String(fr.result||''));
    fr.readAsText(file);
  });
}

function ensure(cond:boolean, msg:string){ if(!cond) throw new Error(msg); }

function parseInvoiceLike(src: string): Field[]{
  const out: Field[] = [];
  // Invoice number patterns
  const inv = /(INV[-\s_]*\d{3,}|HÓA\s*ĐƠN[-\s#]*\d{3,})/i.exec(src);
  if (inv) out.push({ key:'invoice_number', label:'Invoice No', value: inv[0].trim(), confidence: 0.86 });
  // Date patterns
  const date = /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})/.exec(src);
  if (date) out.push({ key:'invoice_date', label:'Invoice Date', value: date[0], confidence: 0.78 });
  // Total amounts: find largest money-like number
  const nums = Array.from(src.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d+[.,]\d{2}|\d{6,})/g)).map(m => m[1]);
  if (nums.length){
    const norm = (s:string) => Number(String(s).replace(/[^\d]/g,''));
    const maxv = nums.map(n => ({ n, v: norm(n) })).sort((a,b)=> b.v-a.v)[0];
    if (maxv && maxv.v>0){ out.push({ key:'total_amount', label:'Total', value: maxv.n, confidence: 0.82 }); }
  }
  // VAT
  const vat = /(VAT|Thuế)\s*[:=]?\s*(\d{1,2})\s*%/i.exec(src);
  if (vat) out.push({ key:'vat_rate', label:'VAT %', value: vat[2], confidence: 0.72 });
  // Currency
  const cur = /(VND|USD|EUR)/i.exec(src);
  if (cur) out.push({ key:'currency', label:'Currency', value: cur[1].toUpperCase(), confidence: 0.7 });
  // Vendor
  const vendor = /(?:Vendor|Nhà cung cấp)[:\-]?\s*([A-Za-z0-9&\.\s]{3,})/i.exec(src);
  if (vendor) out.push({ key:'vendor_name', label:'Vendor', value: vendor[1].trim(), confidence: 0.68 });
  return out;
}

export const MockOCR = {
  async testConnection(cfg: OCRConfig){
    // Simulate per provider requirements
    await sleep(250);
    if (cfg.provider==='google_vision'){ ensure(!!cfg.apiKey, 'Missing apiKey for Google Vision'); }
    if (cfg.provider==='azure_cognitive'){ ensure(!!cfg.apiKey && !!cfg.endpoint, 'Missing endpoint/apiKey for Azure'); }
    if (cfg.provider==='aws_textract'){ ensure(!!cfg.accessKeyId && !!cfg.secretAccessKey && !!cfg.region, 'Missing AWS credentials/region'); }
    if (cfg.provider==='fpt_ai'){ ensure(!!cfg.apiKey, 'Missing apiKey for FPT.AI'); }
    // tesseract/mock require nothing
    return { ok: true, message: 'Connected (mock)' };
  },

  async recognize(cfg: OCRConfig, file: File, opt: OcrOptions): Promise<OCRResult>{
    const t0 = performance.now();
    await sleep(500);
    let src = '';
    try { src = await readAsText(file); } catch { /* binary */ }
    if (!src || src.length < 20){
      // Fallback to filename heuristics
      src = `File: ${file.name}\nVendor: ABC Corp\nINV-000123\nDate: 2025-09-01\nTotal: 12,345,000 VND\nVAT 10%`;
    }
    // Some normalization
    if (opt.language==='vi'){
      src = src.replace(/Hóa[\s_-]?đơn/gi, 'Hóa đơn').replace(/Số tiền/i,'Total');
    }
    // Build fields based on docType
    let fields: Field[] = [];
    if (opt.docType==='invoice' || /invoice|hóa\s*đơn/i.test(src)){
      fields = parseInvoiceLike(src);
    }
    // generic fallback
    if (!fields.length){
      const firstLine = src.split(/\r?\n/).find(x => x.trim().length>5) || file.name;
      fields.push({ key:'title', label:'Title', value:firstLine.trim().slice(0,80), confidence:0.6 });
    }

    const t1 = performance.now();
    return {
      provider: cfg.provider,
      model: cfg.provider==='tesseract' ? 'tesseract-js (mock)' : 'general (mock)',
      durationMs: Math.round(t1 - t0),
      pages: 1,
      text: src,
      fields,
      warnings: cfg.provider==='mock' ? ['Using mock OCR. Results are simulated.'] : undefined
    };
  }
};
