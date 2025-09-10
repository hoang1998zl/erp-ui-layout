// src/components/admin/OrgSettings.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  getSettings, saveSettings, resetSettings, exportJSON, importJSON,
  type OrgSettings
} from '../../mock/orgSettings';

export type OrgSettingsProps = {
  locale?: 'vi'|'en';
  adapters?: {
    getSettings?: typeof getSettings;
    saveSettings?: typeof saveSettings;
    resetSettings?: typeof resetSettings;
    exportJSON?: typeof exportJSON;
    importJSON?: typeof importJSON;
  };
};

type TabKey = 'company'|'branding'|'localization'|'finance'|'approvals'|'security'|'integrations'|'data';

export const OrgSettingsAdmin: React.FC<OrgSettingsProps> = ({ locale='vi', adapters={} }) => {
  const t = (vi:string, en:string) => locale==='vi'?vi:en;
  const fns = {
    getSettings: adapters.getSettings || getSettings,
    saveSettings: adapters.saveSettings || saveSettings,
    resetSettings: adapters.resetSettings || resetSettings,
    exportJSON: adapters.exportJSON || exportJSON,
    importJSON: adapters.importJSON || importJSON,
  };

  const [data, setData] = useState<OrgSettings | null>(null);
  const [tab, setTab] = useState<TabKey>('company');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { fns.getSettings().then(setData); }, []);

  if (!data) return <div style={{ padding:12 }}>{t('Đang tải...','Loading...')}</div>;

  const save = async () => {
    setBusy(true);
    await fns.saveSettings(data);
    setBusy(false);
    setToast(t('Đã lưu cài đặt','Settings saved'));
  };

  const restore = async () => {
    if (!confirm(t('Khôi phục mặc định?','Restore defaults?'))) return;
    const fresh = await fns.resetSettings();
    setData(fresh);
    setToast(t('Đã khôi phục mặc định','Defaults restored'));
  };

  const onExport = async () => {
    const text = await fns.exportJSON();
    const blob = new Blob([text], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='org_settings.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = async (file: File) => {
    await fns.importJSON(file);
    const fresh = await fns.getSettings();
    setData(fresh);
    setToast(t('Đã nhập cấu hình','Imported'));
  };

  const NavButton: React.FC<{ k: TabKey; children: React.ReactNode }> = ({ k, children }) => (
    <button onClick={()=>setTab(k)} style={{ textAlign:'left', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background: tab===k ? '#eef2ff' : '#fff', fontWeight: tab===k ? 700 : 500 }}>
      {children}
    </button>
  );

  const Section: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right, children }) => (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontWeight:800 }}>{title}</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>{right}</div>
      </div>
      <div style={{ padding:12 }}>{children}</div>
    </div>
  );

  const CurrencyFmt = useMemo(() => new Intl.NumberFormat(data.localization.locale.replace('_','-'), { style:'currency', currency: data.localization.currency, timeZone: data.localization.timeZone as any }), [data.localization]);
  const DateFmt = useMemo(() => new Intl.DateTimeFormat(data.localization.locale.replace('_','-'), { timeZone: data.localization.timeZone }), [data.localization]);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:12, padding:12 }}>
      {/* Left nav */}
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', padding:10, display:'grid', gap:8, alignContent:'start' }}>
        <NavButton k="company">{t('Hồ sơ công ty','Company profile')}</NavButton>
        <NavButton k="branding">{t('Thương hiệu','Branding')}</NavButton>
        <NavButton k="localization">{t('Ngôn ngữ & Định dạng','Localization')}</NavButton>
        <NavButton k="finance">{t('Tài chính','Finance')}</NavButton>
        <NavButton k="approvals">{t('Phê duyệt','Approvals')}</NavButton>
        <NavButton k="security">{t('Bảo mật','Security')}</NavButton>
        <NavButton k="integrations">{t('Tích hợp','Integrations')}</NavButton>
        <NavButton k="data">{t('Dữ liệu & Lưu trữ','Data & Retention')}</NavButton>
        <div style={{ height:8 }} />
        <div style={{ display:'flex', gap:8 }}>
          <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff', cursor:'pointer' }}>
            {t('Nhập JSON','Import JSON')}<input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
          </label>
          <button onClick={onExport} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Export</button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={restore} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{t('Mặc định','Defaults')}</button>
          <button onClick={save} disabled={busy} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px', opacity: busy?0.7:1 }}>{t('Lưu tất cả','Save all')}</button>
        </div>
      </aside>

      {/* Right content */}
      <main style={{ display:'grid', gap:12, alignContent:'start' }}>
        {tab==='company' && (
          <Section title={t('Hồ sơ công ty','Company profile')}>
            <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:10, alignItems:'center' }}>
              <label style={{ color:'#6b7280' }}>{t('Tên công ty','Company name')}</label>
              <input value={data.company.name} onChange={e=>setData({...data, company: { ...data.company, name:e.target.value }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>{t('Mã số thuế','Tax code')}</label>
              <input value={data.company.tax_code || ''} onChange={e=>setData({...data, company: { ...data.company, tax_code:e.target.value }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>{t('Địa chỉ','Address')}</label>
              <input value={data.company.address || ''} onChange={e=>setData({...data, company: { ...data.company, address:e.target.value }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>{t('Quốc gia','Country')}</label>
              <input value={data.company.country || ''} onChange={e=>setData({...data, company: { ...data.company, country:e.target.value }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>{t('Điện thoại','Phone')}</label>
              <input value={data.company.phone || ''} onChange={e=>setData({...data, company: { ...data.company, phone:e.target.value }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>Email</label>
              <input value={data.company.email || ''} onChange={e=>setData({...data, company: { ...data.company, email:e.target.value }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>Website</label>
              <input value={data.company.website || ''} onChange={e=>setData({...data, company: { ...data.company, website:e.target.value }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
          </Section>
        )}

        {tab==='branding' && (
          <Section title={t('Thương hiệu','Branding')}>
            <div style={{ display:'grid', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:120, height:120, border:'1px dashed #e5e7eb', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb' }}>
                  {data.company.logo_data_url
                    ? <img src={data.company.logo_data_url} alt="logo" style={{ maxWidth:'100%', maxHeight:'100%' }} />
                    : <span style={{ color:'#6b7280' }}>{t('Không có logo','No logo')}</span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <label style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', background:'#fff', cursor:'pointer' }}>
                    {t('Tải logo','Upload logo')}<input type="file" accept="image/*" style={{ display:'none' }} onChange={async e=>{
                      const f = e.target.files?.[0]; if (!f) return;
                      const reader = new FileReader(); reader.onload = () => setData({...data, company:{...data.company, logo_data_url: String(reader.result)} }); reader.readAsDataURL(f);
                      (e.currentTarget as HTMLInputElement).value='';
                    }} />
                  </label>
                  <button onClick={()=>setData({...data, company:{...data.company, logo_data_url: null}})} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'8px 12px', background:'#fff' }}>{t('Xóa logo','Clear')}</button>
                </div>
              </div>
              <div style={{ color:'#6b7280', fontSize:12 }}>{t('Logo sẽ xuất hiện trên header, báo cáo, và email hệ thống.','Logo will appear on header, reports, and system emails.')}</div>
            </div>
          </Section>
        )}

        {tab==='localization' && (
          <Section title={t('Ngôn ngữ & Định dạng','Localization & Formatting')}>
            <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:10, alignItems:'center' }}>
              <label style={{ color:'#6b7280' }}>{t('Ngôn ngữ','Language')}</label>
              <select value={data.localization.locale} onChange={e=>setData({...data, localization:{ ...data.localization, locale: e.target.value as any }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                <option value="vi">Tiếng Việt (vi-VN)</option>
                <option value="en">English (en-US)</option>
              </select>
              <label style={{ color:'#6b7280' }}>{t('Múi giờ','Time zone')}</label>
              <select value={data.localization.timeZone} onChange={e=>setData({...data, localization:{ ...data.localization, timeZone: e.target.value }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                {['Asia/Ho_Chi_Minh','Asia/Bangkok','Asia/Singapore','Asia/Tokyo','Europe/London','America/Los_Angeles'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
              <label style={{ color:'#6b7280' }}>{t('Tiền tệ','Currency')}</label>
              <select value={data.localization.currency} onChange={e=>setData({...data, localization:{ ...data.localization, currency: e.target.value as any }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                {['VND','USD','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginTop:12, border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'#f9fafb' }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Xem trước định dạng','Format preview')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8 }}>
                <div style={{ color:'#6b7280' }}>{t('Ngày','Date')}</div>
                <div>{DateFmt.format(new Date())}</div>
                <div style={{ color:'#6b7280' }}>{t('Giờ','Time')}</div>
                <div>{new Intl.DateTimeFormat(data.localization.locale.replace('_','-'), { timeStyle:'medium', timeZone: data.localization.timeZone }).format(new Date())}</div>
                <div style={{ color:'#6b7280' }}>{t('Tiền','Currency')}</div>
                <div>{CurrencyFmt.format(12345678.9)}</div>
              </div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:6 }}>{t('Dùng chung với Locale Switcher (#4).','Works with Locale Switcher (#4).')}</div>
            </div>
          </Section>
        )}

        {tab==='finance' && (
          <Section title={t('Thiết lập tài chính','Finance settings')}>
            <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:10, alignItems:'start' }}>
              <label style={{ color:'#6b7280' }}>{t('Tiền tệ gốc','Base currency')}</label>
              <select value={data.finance.base_currency} onChange={e=>setData({...data, finance:{ ...data.finance, base_currency: e.target.value as any }})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                {['VND','USD','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={{ color:'#6b7280' }}>{t('VAT (%)','VAT (%)')}</label>
              <div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {data.finance.vat_rates.map((r, idx) => (
                    <span key={idx} style={{ display:'inline-flex', alignItems:'center', gap:6, border:'1px solid #e5e7eb', borderRadius:999, padding:'4px 8px', background:'#fff' }}>
                      {r}% <button onClick={()=>{
                        const arr = data.finance.vat_rates.filter((_,i)=>i!==idx);
                        setData({...data, finance:{...data.finance, vat_rates: arr }});
                      }} style={{ border:'none', background:'transparent', color:'#ef4444', cursor:'pointer' }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ marginTop:8 }}>
                  <input type="number" placeholder="e.g., 5" style={{ width:120, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} onKeyDown={e=>{
                    if (e.key === 'Enter') {
                      const v = parseFloat((e.target as HTMLInputElement).value);
                      if (!isNaN(v)) {
                        const arr = Array.from(new Set([...data.finance.vat_rates, Math.max(0, Math.min(100, v))])).sort((a,b)=>a-b);
                        setData({...data, finance:{...data.finance, vat_rates: arr }});
                        (e.target as HTMLInputElement).value='';
                      }
                    }
                  }} /> <span style={{ fontSize:12, color:'#6b7280' }}>{t('Nhấn Enter để thêm','Press Enter to add')}</span>
                </div>
              </div>

              <label style={{ color:'#6b7280' }}>{t('Bắt đầu năm tài chính','Fiscal year starts')}</label>
              <select value={data.finance.fiscal_year_start_month} onChange={e=>setData({...data, finance:{...data.finance, fiscal_year_start_month: Number(e.target.value)}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                {Array.from({length:12}, (_,i)=>i+1).map(m => <option key={m} value={m}>{t('Tháng','Month')} {m}</option>)}
              </select>

              <label style={{ color:'#6b7280' }}>{t('Làm tròn','Rounding')}</label>
              <select value={data.finance.rounding} onChange={e=>setData({...data, finance:{...data.finance, rounding: e.target.value as any}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                <option value="none">{t('Không','None')}</option>
                <option value="round">{t('Chuẩn','Round')}</option>
                <option value="ceil">{t('Lên','Ceil')}</option>
                <option value="floor">{t('Xuống','Floor')}</option>
              </select>
            </div>
            <div style={{ marginTop:12, border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'#f9fafb' }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>{t('Xem trước VAT & làm tròn','VAT & rounding preview')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8 }}>
                <div style={{ color:'#6b7280' }}>{t('Số tiền gốc','Base amount')}</div>
                <VatPreview currency={data.finance.base_currency} rates={data.finance.vat_rates} rounding={data.finance.rounding} />
              </div>
            </div>
          </Section>
        )}

        {tab==='approvals' && (
          <Section title={t('Chính sách phê duyệt','Approval policies')}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10 }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>{t('Chi phí','Expense')}</div>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={data.approvals.expense.enabled} onChange={e=>setData({...data, approvals:{...data.approvals, expense:{...data.approvals.expense, enabled:e.target.checked}}})} />
                  {t('Kích hoạt quy trình phê duyệt','Enable approval workflow')}
                </label>
                <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8, marginTop:8 }}>
                  <label style={{ color:'#6b7280' }}>{t('Số cấp','Levels')}</label>
                  <input type="number" min={1} max={3} value={data.approvals.expense.levels} onChange={e=>setData({...data, approvals:{...data.approvals, expense:{...data.approvals.expense, levels: Math.max(1, Math.min(3, Number(e.target.value)))}}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:120 }} />
                </div>
                <div style={{ marginTop:8 }}>
                  <div style={{ fontWeight:600, marginBottom:4 }}>{t('Ngưỡng phê duyệt theo cấp','Approval thresholds')}</div>
                  <div style={{ display:'grid', gap:6 }}>
                    {data.approvals.expense.thresholds.map((t0, idx) => (
                      <div key={idx} style={{ display:'grid', gridTemplateColumns:'100px 1fr auto', gap:6, alignItems:'center' }}>
                        <div>Level {t0.level}</div>
                        <input type="number" value={t0.amount} onChange={e=>{
                          const arr = data.approvals.expense.thresholds.slice();
                          arr[idx] = { ...t0, amount: Number(e.target.value) };
                          setData({...data, approvals:{...data.approvals, expense:{...data.approvals.expense, thresholds: arr}}});
                        }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                        <button onClick={()=>{
                          const arr = data.approvals.expense.thresholds.filter((_,i)=>i!==idx);
                          setData({...data, approvals:{...data.approvals, expense:{...data.approvals.expense, thresholds: arr}}});
                        }} style={{ border:'1px solid #ef4444', color:'#ef4444', borderRadius:6, padding:'6px 8px', background:'#fff' }}>✕</button>
                      </div>
                    ))}
                    <button onClick={()=>{
                      const nextLevel = (data.approvals.expense.thresholds[data.approvals.expense.thresholds.length-1]?.level || 0) + 1;
                      const arr = [...data.approvals.expense.thresholds, { level: nextLevel, amount: 0 }];
                      setData({...data, approvals:{...data.approvals, expense:{...data.approvals.expense, thresholds: arr}}});
                    }} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff', width:120 }}>{t('Thêm cấp','Add level')}</button>
                  </div>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                  <input type="checkbox" checked={data.approvals.expense.auto_escalation} onChange={e=>setData({...data, approvals:{...data.approvals, expense:{...data.approvals.expense, auto_escalation:e.target.checked}}})} />
                  {t('Tự động đẩy cấp khi quá hạn','Auto escalate on SLA breach')}
                </label>
              </div>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10 }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>{t('Mua sắm','Procurement')}</div>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={data.approvals.purchase.enabled} onChange={e=>setData({...data, approvals:{...data.approvals, purchase:{...data.approvals.purchase, enabled:e.target.checked}}})} />
                  {t('Kích hoạt phê duyệt mua sắm','Enable procurement approvals')}
                </label>
                <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8, marginTop:8 }}>
                  <label style={{ color:'#6b7280' }}>{t('Số báo giá tối thiểu','Minimum quotes')}</label>
                  <input type="number" min={1} value={data.approvals.purchase.min_quotes || 2} onChange={e=>setData({...data, approvals:{...data.approvals, purchase:{...data.approvals.purchase, min_quotes: Math.max(1, Number(e.target.value))}}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:120 }} />
                </div>
              </div>
            </div>
          </Section>
        )}

        {tab==='security' && (
          <Section title={t('Bảo mật & SSO','Security & SSO')}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10 }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>{t('Chính sách mật khẩu','Password policy')}</div>
                <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:8, alignItems:'center' }}>
                  <label style={{ color:'#6b7280' }}>{t('Độ dài tối thiểu','Min length')}</label>
                  <input type="number" min={6} value={data.security.password_min_length} onChange={e=>setData({...data, security:{...data.security, password_min_length: Math.max(6, Number(e.target.value))}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:120 }} />
                  <label style={{ color:'#6b7280' }}>{t('Yêu cầu ký tự phức tạp','Require mixed chars')}</label>
                  <input type="checkbox" checked={data.security.password_require_mixed} onChange={e=>setData({...data, security:{...data.security, password_require_mixed: e.target.checked}})} />
                  <label style={{ color:'#6b7280' }}>{t('Hết phiên sau (phút)','Session timeout (min)')}</label>
                  <input type="number" min={5} value={data.security.session_timeout_minutes} onChange={e=>setData({...data, security:{...data.security, session_timeout_minutes: Math.max(5, Number(e.target.value))}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:120 }} />
                  <label style={{ color:'#6b7280' }}>{t('Bắt buộc MFA','Require MFA')}</label>
                  <input type="checkbox" checked={data.security.mfa_required} onChange={e=>setData({...data, security:{...data.security, mfa_required: e.target.checked}})} />
                </div>
              </div>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10 }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>SSO</div>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={data.security.allow_sso} onChange={e=>setData({...data, security:{...data.security, allow_sso: e.target.checked}})} />
                  {t('Cho phép đăng nhập SSO','Allow SSO login')}
                </label>
                <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:8, marginTop:8, alignItems:'center' }}>
                  <label style={{ color:'#6b7280' }}>{t('Nhà cung cấp','Providers')}</label>
                  <select multiple value={data.security.sso_providers} onChange={e=>{
                    const opts = Array.from(e.target.selectedOptions).map(o=>o.value);
                    setData({...data, security:{...data.security, sso_providers: opts}});
                  }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                    {['Microsoft','Google','Okta'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <label style={{ color:'#6b7280' }}>Tenant ID</label>
                  <input value={data.integrations.sso_tenant_id || ''} onChange={e=>setData({...data, integrations:{...data.integrations, sso_tenant_id: e.target.value}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
                </div>
              </div>
            </div>
          </Section>
        )}

        {tab==='integrations' && (
          <Section title={t('Tích hợp','Integrations')}>
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:10, alignItems:'center' }}>
              <label style={{ color:'#6b7280' }}>Webhook URL</label>
              <input value={data.integrations.webhook_url || ''} onChange={e=>setData({...data, integrations:{...data.integrations, webhook_url: e.target.value}})} placeholder="https://..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
              <label style={{ color:'#6b7280' }}>SharePoint Site</label>
              <input value={data.integrations.sharepoint_site || ''} onChange={e=>setData({...data, integrations:{...data.integrations, sharepoint_site: e.target.value}})} placeholder="https://tenant.sharepoint.com/sites/your-site" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }} />
            </div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:8 }}>{t('Các tích hợp nâng cao (kế toán, e-invoice, HRM) sẽ được cấu hình ở màn riêng.','Advanced integrations (accounting, e-invoice, HRM) will be configured in dedicated screens.')}</div>
          </Section>
        )}

        {tab==='data' && (
          <Section title={t('Dữ liệu & Lưu trữ','Data & Retention')}>
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:10, alignItems:'center' }}>
              <label style={{ color:'#6b7280' }}>{t('Lưu audit log (ngày)','Audit retention (days)')}</label>
              <input type="number" min={30} value={data.data_policy.audit_retention_days} onChange={e=>setData({...data, data_policy:{...data.data_policy, audit_retention_days: Math.max(30, Number(e.target.value))}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:160 }} />
              <label style={{ color:'#6b7280' }}>{t('Lưu tài liệu tạm (ngày)','Temp document retention (days)')}</label>
              <input type="number" min={30} value={data.data_policy.document_retention_days} onChange={e=>setData({...data, data_policy:{...data.data_policy, document_retention_days: Math.max(30, Number(e.target.value))}})} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:160 }} />
              <label style={{ color:'#6b7280' }}>{t('Cửa sổ sao lưu','Backup window')}</label>
              <input value={data.data_policy.backup_window || ''} onChange={e=>setData({...data, data_policy:{...data.data_policy, backup_window: e.target.value}})} placeholder="02:00-03:00" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} />
            </div>
            <div style={{ marginTop:12, fontSize:12, color:'#6b7280' }}>{t('Ảnh hưởng đến Audit_Log_Viewer (#5) & Document modules.','Affects Audit_Log_Viewer (#5) & document modules.')}</div>
          </Section>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:'#111827', color:'#fff', padding:'8px 12px', borderRadius:999, fontSize:13 }}
            onAnimationEnd={()=>setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
};

const VatPreview: React.FC<{ currency: 'VND'|'USD'|'EUR'; rates: number[]; rounding: 'none'|'round'|'ceil'|'floor' }> = ({ currency, rates, rounding }) => {
  const [base, setBase] = useState<number>(2350000);
  const fmt = useMemo(() => new Intl.NumberFormat(undefined, { style:'currency', currency }), [currency]);
  const applyRound = (n:number) => rounding==='round'?Math.round(n): rounding==='ceil'?Math.ceil(n): rounding==='floor'?Math.floor(n): n;
  return (
    <div style={{ display:'grid', gap:6 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input type="number" value={base} onChange={e=>setBase(Number(e.target.value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:160 }} />
        <span style={{ color:'#6b7280', fontSize:12 }}>({fmt.format(base)})</span>
      </div>
      <div style={{ display:'grid', gap:4 }}>
        {rates.map(r => {
          const tax = applyRound(base * r / 100);
          const total = base + tax;
          return (
            <div key={r} style={{ display:'grid', gridTemplateColumns:'80px 1fr', gap:6 }}>
              <div><b>VAT {r}%</b></div>
              <div>→ {fmt.format(total)} <span style={{ color:'#6b7280', fontSize:12 }}>({fmt.format(base)} + {fmt.format(tax)})</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
