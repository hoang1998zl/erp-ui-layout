// src/App.tsx — Runner for CORE-03 Notification_Center
import React from 'react';
import { NotificationBell } from './components/core/NotificationCenter';
import { mockSubscribe } from './mock/notifications';

export default function App() {
  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <h2>CORE-03 — Notification Center</h2>
      <p>Live mock stream every ~3s. Click the bell to open. Filter groups, mark all read, or open an item.</p>
      <div>
        <NotificationBell
          subscribe={mockSubscribe(3000)}
          locale="vi"
          onNavigate={(route)=>alert('Navigate to: ' + route)}
        />
      </div>
    </div>
  );
}
