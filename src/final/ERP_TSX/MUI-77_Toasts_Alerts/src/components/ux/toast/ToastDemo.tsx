
// src/components/ux/toast/ToastDemo.tsx — demo triggers for toasts and alerts
import React, { useState } from 'react';
import { ToastProvider, useToast } from './ToastProvider';
import { AlertBanner } from '../alerts/AlertBanner';

function DemoInner(){
  const toast = useToast();
  const [banner, setBanner] = useState<{v:'success'|'error'|'info'|'warning', key:number}|null>({v:'info', key: 1});

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:12, display:'grid', gap:10 }}>
        <div style={{ fontWeight:700 }}>Toast examples</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=> toast.success('Saved successfully', { title:'Success', actionText:'View', onAction:()=> console.log('view') })} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Success</button>
          <button onClick={()=> toast.error('Something went wrong', { title:'Error', durationMs:6000 })} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Error</button>
          <button onClick={()=> toast.info('Background sync completed', { title:'Info' })} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Info</button>
          <button onClick={()=> toast.warning('Credit nearing limit', { title:'Warning', durationMs:0 })} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Warning (sticky)</button>
          <button onClick={()=> { for (let i=0;i<3;i++) toast.success('Saved successfully', { title:'Success' }); }} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Merge duplicates</button>
          <button onClick={()=> toast.clear()} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Clear all</button>
        </div>
        <div style={{ color:'#64748b', fontSize:12 }}>Features: merge duplicates within 1.5s, queue &gt; max (5), pause on hover, progress bar, sticky with duration=0, action button.</div>
      </div>

      <div style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:12, display:'grid', gap:10 }}>
        <div style={{ fontWeight:700 }}>Alert banners (page-level)</div>
        {banner && (
          <AlertBanner variant={banner.v} title="Policy update" onClose={()=> setBanner(null)}>
            Please review the updated procurement policy and acknowledge by Friday.
          </AlertBanner>
        )}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=> setBanner({ v:'success', key: Math.random() })} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Show success</button>
          <button onClick={()=> setBanner({ v:'error', key: Math.random() })} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Show error</button>
          <button onClick={()=> setBanner({ v:'info', key: Math.random() })} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Show info</button>
          <button onClick={()=> setBanner({ v:'warning', key: Math.random() })} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Show warning</button>
        </div>
        <div style={{ color:'#64748b', fontSize:12 }}>Use banners for persistent, page-scoped notices; use toasts for ephemeral background events.</div>
      </div>
    </div>
  );
}

export const ToastDemo: React.FC = () => {
  return (
    <ToastProvider>
      <DemoInner />
    </ToastProvider>
  );
};
