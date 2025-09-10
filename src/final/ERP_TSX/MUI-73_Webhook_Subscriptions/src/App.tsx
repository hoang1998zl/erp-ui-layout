
// src/App.tsx — Runner for INT-05 Webhook_Subscriptions
import React, { useEffect } from 'react';
import { WebhookSubscriptions } from './components/integrations/WebhookSubscriptions';
import { listSubs } from './integrations/webhooks/mockStore';

export default function App() {
  // expose subs for textarea cURL builder (simple hack)
  useEffect(()=> { (window as any).SUBS = listSubs(); }, []);
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 0' }}>
      <div style={{ width:'min(1700px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', fontWeight:700 }}>INT-05 — Webhook Subscriptions</div>
        <div style={{ padding:12 }}>
          <WebhookSubscriptions locale="vi" />
        </div>
      </div>
    </div>
  );
}
