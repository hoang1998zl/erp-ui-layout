// src/App.tsx — Runner for CORE-01: AppShell_Nav
import React from 'react';
import { AppShellNav } from './components/core/AppShellNav';

export default function App() {
  return (
    <AppShellNav
      breadcrumbs={['Home','Dashboard']}
      onNavigate={(route) => alert('Navigate to: ' + route)}
      onLocaleChange={(loc) => console.log('locale:', loc)}
      rightPane={<div>
        <div style={{ fontWeight:700, marginBottom:8 }}>Context / Ngữ cảnh</div>
        <ul style={{ lineHeight:1.8 }}>
          <li>Recent activity</li>
          <li>Pinned docs</li>
          <li>Shortcuts</li>
        </ul>
      </div>}
    >
      <div style={{ padding:16 }}>
        <h3 style={{ marginTop:0 }}>Welcome to App Shell</h3>
        <p>Use the left sidebar to open modules, the top bar search (Ctrl/⌘+K), and the right context pane.</p>
        <p>Sidebar can be collapsed, supports workspaces, nested menus, and command palette.</p>
      </div>
    </AppShellNav>
  );
}
