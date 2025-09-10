
// src/components/integrations/OCRProviderSettings.tsx — INT-03
import React, { useMemo, useState } from 'react';
import type { OCRConfig, OcrOptions, OCRResult, Provider } from '../../integrations/ocr/types';
import { MockOCR } from '../../integrations/ocr/mockProviders';

const LS_CFG = 'erp.int.ocr.cfg.v1';
const LS_MAP = 'erp.int.ocr.map.v1';

function Badge({ text, tone='slate' }: { text:string, tone?: 'slate'|'green'|'red'|'amber'|'violet' }) {
  const bg = tone==='green' ? '#dcfce7' : tone==='red' ? '#fee2e2' : tone==='amber' ? '#fef9c3' : tone==='violet' ? '#ede9fe' : '#f1f5f9';
  return <span style={{ background:bg, borderRadius:999, padding:'0 8px', fontSize:12 }}>{text}</span>;
}
function Key({ val, masked }: { val?: string; masked: boolean }){
  if (!val) return <i style={{ color:'#9ca3af' }}>—</i>;
  return <code>{masked ? '•'.repeat(Math.min(val.length, 8))+'…' : val}</code>;
}

const providerLabels: Record<Provider,string> = {
  google_vision: 'Google Vision',
  aws_textract: 'AWS Textract',
  azure_cognitive: 'Azure Cognitive',
  tesseract: 'Tesseract (on-prem)',
  fpt_ai: 'FPT.AI Vision',
  mock: 'Mock OCR'
};

const DEFAULT_CFG: OCRConfig = { provider:'mock', defaultLanguage: 'vi' };

export const OCRProviderSettings: React.FC<{ locale?: 'vi'|'en' }> = ({ locale='vi' }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;

  const [cfg, setCfg] = useState<OCRConfig>(()=> { try { return JSON.parse(localStorage.getItem(LS_CFG)||'null') || DEFAULT_CFG; } catch { return DEFAULT_CFG; } });
  const [masked, setMasked] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  // Test harness
  const [file, setFile] = useState<File|null>(null);
  const [opt, setOpt] = useState<OcrOptions>({ language: 'vi', docType:'invoice', normalize:true });
  const [result, setResult] = useState<OCRResult|null>(null);

  // Field mapping (recognized -> ERP schema)
  type MapRow = { from: string; to: string };
  const [mapping, setMapping] = useState<MapRow[]>(()=> { try { return JSON.parse(localStorage.getItem(LS_MAP)||'[]'); } catch { return []; } });

  const saveConfig = () => { localStorage.setItem(LS_CFG, JSON.stringify(cfg)); setStatus(t('Đã lưu cấu hình (local).','Saved (local).')); };
  const testConn = async () => { setBusy(true); setStatus(t('Đang kiểm tra kết nối...','Testing connection...')); try { await MockOCR.testConnection(cfg); setStatus(t('Kết nối OK (mock)','Connection OK (mock)')); } catch (e:any){ setStatus((t('Lỗi: ','Error: ')) + (e.message||String(e))); } finally { setBusy(false); } };
  const runOCR = async () => {
    if (!file){ setStatus(t('Chọn tệp trước.','Pick a file first.')); return; }
    setBusy(true); setStatus(t('Đang nhận dạng...','Recognizing...')); setResult(null);
    try { const r = await MockOCR.recognize(cfg, file, opt); setResult(r); setStatus(t('Xong','Done')); } 
    catch (e:any){ setStatus(t('Lỗi OCR: ','OCR error: ')+(e.message||String(e))); } finally { setBusy(false); }
  };

  const addMap = () => setMapping([...mapping, { from:'invoice_number', to:'fin.expense.invoice_no' }]);
  const saveMap = () => { localStorage.setItem(LS_MAP, JSON.stringify(mapping)); setStatus(t('Đã lưu mapping (local).','Mapping saved (local).')); };
  const removeMap = (i:number) => { const arr=[...mapping]; arr.splice(i,1); setMapping(arr); };

  const exportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='ocr_result.json'; a.click(); URL.revokeObjectURL(url);
  };

  const secNote = t('Lưu ý: khóa API chỉ lưu tạm thời trong trình duyệt (localStorage) cho mục đích demo. Ở môi trường thật, lưu khóa an toàn phía server, mã hóa ở REST & at-rest, và áp RBAC + audit.','Security: API keys here are stored in localStorage for demo. In production, keep them server-side, encrypt, and enforce RBAC + audit.');

  return (
    <div style={{ display:'grid', gridTemplateColumns:'400px 1fr 420px', gap:12 }}>
      {/* Left: Provider & Keys */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:800 }}>{t('Cấu hình OCR','OCR Provider Settings')}</div>
          <Badge text="INT-03" />
        </div>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Provider','Provider')}</span>
          <select value={cfg.provider} onChange={e=> setCfg({ ...cfg, provider: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            {(['google_vision','aws_textract','azure_cognitive','tesseract','fpt_ai','mock'] as Provider[]).map(p => <option key={p} value={p}>{providerLabels[p]}</option>)}
          </select>
        </label>
        <label style={{ display:'grid', gap:6 }}>
          <span>{t('Ngôn ngữ mặc định','Default language')}</span>
          <select value={cfg.defaultLanguage} onChange={e=> setCfg({ ...cfg, defaultLanguage: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </label>
        {/* Provider-specific keys */}
        {cfg.provider==='google_vision' && (
          <label style={{ display:'grid', gap:6 }}>
            <span>API Key</span>
            <input value={cfg.apiKey||''} onChange={e=> setCfg({ ...cfg, apiKey: e.target.value })} placeholder="AIza..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </label>
        )}
        {cfg.provider==='azure_cognitive' && (
          <div style={{ display:'grid', gap:6 }}>
            <label style={{ display:'grid', gap:6 }}><span>Endpoint</span><input value={cfg.endpoint||''} onChange={e=> setCfg({ ...cfg, endpoint: e.target.value })} placeholder="https://<res>.cognitiveservices.azure.com/" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>API Key</span><input value={cfg.apiKey||''} onChange={e=> setCfg({ ...cfg, apiKey: e.target.value })} placeholder="xxxxxxxxxxxxxxxx" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          </div>
        )}
        {cfg.provider==='aws_textract' && (
          <div style={{ display:'grid', gap:6 }}>
            <label style={{ display:'grid', gap:6 }}><span>Access Key ID</span><input value={cfg.accessKeyId||''} onChange={e=> setCfg({ ...cfg, accessKeyId: e.target.value })} placeholder="AKIA..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>Secret Access Key</span><input value={cfg.secretAccessKey||''} onChange={e=> setCfg({ ...cfg, secretAccessKey: e.target.value })} placeholder="********" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>Region</span><input value={cfg.region||''} onChange={e=> setCfg({ ...cfg, region: e.target.value })} placeholder="ap-southeast-1" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          </div>
        )}
        {cfg.provider==='fpt_ai' && (
          <label style={{ display:'grid', gap:6 }}>
            <span>API Key</span>
            <input value={cfg.apiKey||''} onChange={e=> setCfg({ ...cfg, apiKey: e.target.value })} placeholder="FPTAI-..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
          </label>
        )}
        {cfg.provider==='tesseract' && (
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Không cần khóa. Cần dịch vụ OCR on-prem phía server.','No keys required. Needs on‑prem OCR service on server.')}</div>
        )}
        {cfg.provider==='mock' && (
          <div style={{ color:'#6b7280', fontSize:12 }}>{t('Chế độ giả lập để demo UI.','Mock mode for UI demo.')}</div>
        )}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={saveConfig} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Lưu (local)','Save (local)')}</button>
          <button onClick={async ()=> await testConn()} disabled={busy} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Test kết nối (mock)','Test connection (mock)')}</button>
          <button onClick={()=> setMasked(m => !m)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{masked? t('Hiện khóa','Unmask'): t('Ẩn khóa','Mask')}</button>
        </div>
        <div style={{ color:'#6b7280', fontSize:12 }}>{status}</div>

        <div style={{ border:'1px dashed #e5e7eb', borderRadius:12, padding:8 }}>
          <div style={{ fontWeight:700, marginBottom:4 }}>{t('Khóa hiện tại','Current keys')}</div>
          <div style={{ display:'grid', gap:2, fontSize:12 }}>
            <div>apiKey: <Key val={cfg.apiKey} masked={masked} /></div>
            <div>endpoint: <code>{cfg.endpoint||'—'}</code></div>
            <div>region: <code>{cfg.region||'—'}</code></div>
            <div>accessKeyId: <Key val={cfg.accessKeyId} masked={masked} /></div>
            <div>secretAccessKey: <Key val={cfg.secretAccessKey} masked={masked} /></div>
          </div>
        </div>

        <div style={{ color:'#64748b', fontSize:12 }}>{secNote}</div>
      </div>

      {/* Middle: Test harness */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gridTemplateRows:'auto auto 1fr', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:700 }}>{t('Kiểm thử OCR','OCR Test')}</div>
          <Badge text="Demo" tone="violet" />
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
              {t('Chọn tệp','Choose file')}
              <input type="file" style={{ display:'none' }} accept=".png,.jpg,.jpeg,.pdf,.txt" onChange={e=> setFile((e.target as HTMLInputElement).files?.[0]||null)} />
            </label>
            <button onClick={runOCR} disabled={!file || busy} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Nhận dạng (mock)','Recognize (mock)')}</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <label style={{ display:'grid', gap:6 }}>
            <span>{t('Loại tài liệu','Document type')}</span>
            <select value={opt.docType} onChange={e=> setOpt({ ...opt, docType: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="invoice">{t('Hóa đơn','Invoice')}</option>
              <option value="receipt">{t('Biên nhận','Receipt')}</option>
              <option value="id">{t('Giấy tờ định danh','ID')}</option>
              <option value="generic">{t('Khác','Generic')}</option>
            </select>
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>{t('Ngôn ngữ','Language')}</span>
            <select value={opt.language} onChange={e=> setOpt({ ...opt, language: e.target.value as any })} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, minHeight:360 }}>
          <div style={{ border:'1px dashed #e5e7eb', borderRadius:12, padding:10, overflow:'auto' }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Trường nhận dạng','Recognized fields')}</div>
            {!result && <div style={{ color:'#6b7280' }}>{t('Chưa có kết quả','No result yet')}</div>}
            {result && (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ padding:'6px' }}>Key</th>
                  <th style={{ padding:'6px' }}>{t('Nhãn','Label')}</th>
                  <th style={{ padding:'6px' }}>{t('Giá trị','Value')}</th>
                  <th style={{ padding:'6px', textAlign:'right' }}>{t('Độ tin cậy','Conf.')}</th>
                </tr></thead>
                <tbody>
                  {result.fields.map((f,i) => (
                    <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'6px', fontFamily:'monospace' }}>{f.key}</td>
                      <td style={{ padding:'6px' }}>{f.label||'—'}</td>
                      <td style={{ padding:'6px' }}>{f.value}</td>
                      <td style={{ padding:'6px', textAlign:'right' }}>{Math.round((f.confidence||0)*100)/100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {result && (
              <div style={{ color:'#6b7280', fontSize:12, marginTop:6 }}>
                {t('Provider','Provider')}: <b>{result.provider}</b> • {t('Model','Model')}: {result.model||'—'} • {t('Thời gian','Time')}: {result.durationMs}ms
              </div>
            )}
          </div>
          <div style={{ border:'1px dashed #e5e7eb', borderRadius:12, padding:10, overflow:'auto' }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{t('Văn bản thô','Plain text')}</div>
            {!result && <div style={{ color:'#6b7280' }}>{t('Chưa có kết quả','No result yet')}</div>}
            {result && <pre style={{ whiteSpace:'pre-wrap', margin:0, fontSize:12 }}>{result.text.slice(0,5000)}</pre>}
            {result?.warnings?.length ? <div style={{ color:'#f59e0b', fontSize:12, marginTop:6 }}>{result.warnings.join(' • ')}</div> : null}
            {result && <div style={{ marginTop:8 }}><button onClick={exportJSON} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export JSON</button></div>}
          </div>
        </div>
      </div>

      {/* Right: Mapping to ERP */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:12, display:'grid', gap:10, alignSelf:'start' }}>
        <div style={{ fontWeight:700 }}>{t('Mapping trường → ERP','Field mapping → ERP')}</div>
        <div style={{ color:'#6b7280', fontSize:12 }}>{t('Ánh xạ các khóa OCR (vd. "invoice_number") vào schema ERP (vd. "fin.expense.invoice_no").','Map OCR keys (e.g., "invoice_number") to ERP schema (e.g., "fin.expense.invoice_no").')}</div>
        <div style={{ display:'grid', gap:6 }}>
          {mapping.map((m, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8 }}>
              <input value={m.from} onChange={e=> { const arr=[...mapping]; arr[i]={ ...arr[i], from:e.target.value }; setMapping(arr); }} placeholder="invoice_number" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <input value={m.to} onChange={e=> { const arr=[...mapping]; arr[i]={ ...arr[i], to:e.target.value }; setMapping(arr); }} placeholder="fin.expense.invoice_no" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
              <button onClick={()=> removeMap(i)} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Xóa','Delete')}</button>
            </div>
          ))}
          {mapping.length===0 && <div style={{ color:'#6b7280', fontSize:12 }}>— {t('Chưa có mapping','No mappings yet')} —</div>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={addMap} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Thêm dòng','Add row')}</button>
          <button onClick={saveMap} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Lưu mapping (local)','Save mapping (local)')}</button>
        </div>

        <div style={{ height:1, background:'#e5e7eb' }} />

        <div style={{ fontWeight:700 }}>{t('Tích hợp thật (gợi ý nhanh)','Production integration (quick guide)')}</div>
        <ol style={{ paddingLeft:16, color:'#475569', fontSize:12, display:'grid', gap:6 }}>
          <li>{t('Lưu khóa ở server (ENV/Secret Manager), không để trên FE.','Store keys on server (ENV/Secret Manager), never on FE.')}</li>
          <li>{t('Tạo endpoint backend','Create backend endpoint')}: <code>POST /int/ocr/recognize</code> {t('nhận multipart file + options, gọi provider, trả OCRResult','accepts multipart + options, calls provider, returns OCRResult')}.</li>
          <li>{t('Chuẩn hóa schema','Normalize schema')}: <code>{'{ text, fields:[{key,label,value,confidence}] }'}</code>.</li>
          <li>{t('Theo luật VN','VN compliance')}: {t('ẩn/mask dữ liệu nhạy cảm; tuân thủ Nghị định 13/2023/NĐ‑CP; lưu log truy cập','mask PII; comply with Decree 13/2023; audit logs')}.</li>
          <li>{t('Hiệu năng','Performance')}: {t('xử lý async, hàng đợi (queue), retry, idempotency bằng hash tệp','async processing, queue, retry, idempotency via file hash')}.</li>
        </ol>
      </div>
    </div>
  );
};
