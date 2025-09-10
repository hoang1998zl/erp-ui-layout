
import React, { useEffect, useState } from 'react';
import { QuickCreateLauncher } from './components/ux/quick/QuickCreateLauncher';
import { ToastProvider } from './components/ux/toast/Toast';
import { listAll } from './integrations/quick/mockApi';

export default function App() {
  const [db, setDb] = useState<any>({ tasks:[], expenses:[], documents:[] });
  const refresh = () => setDb(listAll());

  useEffect(()=>{
    const t = setInterval(refresh, 800); // naive refresh to reflect new items
    return ()=> clearInterval(t);
  }, []);

  return (
    <ToastProvider>
      <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'grid', gridTemplateRows:'auto 1fr' }}>
        <header style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'#fff', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:800 }}>ERP Header</div>
          <div style={{ marginLeft:'auto' }}>
            <QuickCreateLauncher />
          </div>
        </header>

        <main style={{ padding:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(260px, 1fr))', gap:12 }}>
            <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
              <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>Recent Tasks</div>
              <div style={{ display:'grid', gap:8, padding:10 }}>
                {db.tasks.slice(0,5).map((t:any) => (
                  <div key={t.id} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'6px 8px' }}>
                    <div style={{ fontWeight:600 }}>{t.id} — {t.title}</div>
                    <div style={{ color:'#64748b', fontSize:12 }}>{t.project} • {t.assignee} • {t.due||'no due'}</div>
                  </div>
                ))}
                {db.tasks.length===0 && <div style={{ color:'#64748b', fontSize:12, padding:'6px 8px' }}>— None —</div>}
              </div>
            </section>

            <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
              <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>Recent Expenses</div>
              <div style={{ display:'grid', gap:8, padding:10 }}>
                {db.expenses.slice(0,5).map((t:any) => (
                  <div key={t.id} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'6px 8px' }}>
                    <div style={{ fontWeight:600 }}>{t.id} — {new Date(t.date).toLocaleDateString()}</div>
                    <div style={{ color:'#64748b', fontSize:12 }}>{t.category} • {t.vendor||'—'} • VND {t.amount?.toLocaleString('vi-VN')}</div>
                  </div>
                ))}
                {db.expenses.length===0 && <div style={{ color:'#64748b', fontSize:12, padding:'6px 8px' }}>— None —</div>}
              </div>
            </section>

            <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
              <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>Recent Documents</div>
              <div style={{ display:'grid', gap:8, padding:10 }}>
                {db.documents.slice(0,5).map((t:any) => (
                  <div key={t.id} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'6px 8px' }}>
                    <div style={{ fontWeight:600 }}>{t.id} — {t.title}</div>
                    <div style={{ color:'#64748b', fontSize:12 }}>{t.folder} • {(t.tags||[]).join(', ')}</div>
                  </div>
                ))}
                {db.documents.length===0 && <div style={{ color:'#64748b', fontSize:12, padding:'6px 8px' }}>— None —</div>}
              </div>
            </section>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
