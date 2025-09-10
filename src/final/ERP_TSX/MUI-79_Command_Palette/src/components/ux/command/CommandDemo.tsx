
// src/components/ux/command/CommandDemo.tsx — demo register commands & role-aware filtering
import React, { useEffect, useState } from 'react';
import { CommandProvider, useCommand, Role, type Command } from './CommandProvider';

function SeedCommands({ role }: { role: Role }){
  const cmd = useCommand();
  useEffect(()=> {
    const nav = (to: string) => () => alert('Navigate to: '+to);
    const toggleDark = () => {
      const dark = document.documentElement.style.getPropertyValue('--bg')==='#0b1220';
      document.documentElement.style.setProperty('--bg', dark? '#f3f4f6':'#0b1220');
      document.documentElement.style.setProperty('--fg', dark? '#0f172a':'#e2e8f0');
    };
    const commands: Command[] = [
      { id:'go.home', title:'Go to Home', section:'Go to', keywords:['dashboard','main'], icon:'🏠', run: nav('Home'), pinned:true },
      { id:'go.expense', title:'Open Expense list', section:'Go to', keywords:['FIN-06','expense list'], icon:'💳', run: nav('Finance/Expense'), allowedRoles:['Finance','Admin'] },
      { id:'go.po', title:'Open Purchase Orders', section:'Go to', keywords:['PO'], icon:'📑', run: nav('Procurement/PO'), allowedRoles:['Admin','Finance','PM'] },
      { id:'go.tasks', title:'Open My Tasks', section:'Go to', keywords:['PM-02','board'], icon:'📋', run: nav('Projects/Tasks') },

      { id:'create.expense', title:'Create Expense', section:'Create', keywords:['new','claim'], icon:'➕', run: ()=> alert('Open quick create Expense'), allowedRoles:['Finance','Employee','Admin'] },
      { id:'create.vendor', title:'Create Vendor', section:'Create', keywords:['master data','supplier'], icon:'🏭', run: ()=> alert('Open quick create Vendor'), allowedRoles:['Admin','Finance'] },

      { id:'act.approve', title:'Approve selected', section:'Actions', keywords:['workflow','approve'], icon:'✅', run: ()=> alert('Approve current selection'), allowedRoles:['Finance','PM','Admin'] },
      { id:'act.reject', title:'Reject selected', section:'Actions', keywords:['workflow','reject'], icon:'⛔', run: ()=> alert('Reject current selection'), allowedRoles:['Finance','PM','Admin'] },
      { id:'act.export', title:'Export to CSV', section:'Actions', keywords:['download','spreadsheet'], icon:'⬇', run: ()=> alert('Export CSV'), },

      { id:'pref.dark', title:'Toggle dark background', section:'Actions', keywords:['theme','dark mode'], icon:'🌓', run: toggleDark },
      { id:'pref.lang', title:'Switch language (VI/EN)', section:'Actions', keywords:['i18n','language'], icon:'🌐', run: ()=> alert('Toggle VI/EN') },

      { id:'admin.users', title:'User & Roles', section:'Admin', keywords:['ADM-07','RBAC'], icon:'👤', run: nav('Admin/Users'), allowedRoles:['Admin'] },
      { id:'admin.audit', title:'Audit Logs', section:'Admin', keywords:['ADM-09','security'], icon:'🧾', run: nav('Admin/Audit Logs'), allowedRoles:['Admin'] },
    ];
    cmd.setCommands(commands);
  }, [cmd, role]);
  return null;
}

export const CommandDemo: React.FC = () => {
  const [role, setRole] = useState<Role>('Employee');
  return (
    <CommandProvider initialRole={role}>
      <SeedCommands role={role} />
      <div style={{ display:'grid', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700 }}>UX‑06 — Command Palette</div>
            <div style={{ color:'#64748b', fontSize:12 }}>Shortcut: <kbd style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 6px', background:'#f8fafc' }}>Ctrl</kbd>+<kbd style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 6px', background:'#f8fafc' }}>K</kbd> • Role-aware actions</div>
          </div>
          <label style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ color:'#64748b' }}>Role</span>
            <select value={role} onChange={e=> setRole(e.target.value as Role)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
              <option>Employee</option><option>Finance</option><option>PM</option><option>HR</option><option>Admin</option>
            </select>
          </label>
        </div>

        <div style={{ border:'1px dashed #e5e7eb', borderRadius:12, padding:12, background:'var(--bg, #f8fafc)', color:'var(--fg, #0f172a)' }}>
          <div style={{ color:'#64748b', fontSize:12, marginBottom:6 }}>Press <b>Ctrl/Cmd + K</b> to open palette.</div>
          <div style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(2, minmax(260px, 1fr))' }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'#fff' }}>
              <div style={{ fontWeight:600, marginBottom:6 }}>Pinned & Recents</div>
              <div style={{ color:'#64748b', fontSize:12 }}>With empty query, palette shows **pinned** items and **recents** (per user).</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'#fff' }}>
              <div style={{ fontWeight:600, marginBottom:6 }}>Sections & Role</div>
              <div style={{ color:'#64748b', fontSize:12 }}>Tabs **Go to / Create / Actions / Admin**; commands filtered by **role**.</div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=> alert('This area represents app content. Use palette to navigate/act.')} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Dummy content action</button>
          <button onClick={()=> { const e = new KeyboardEvent('keydown', { key:'k', ctrlKey:true }); window.dispatchEvent(e); }} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Open palette (programmatic)</button>
        </div>
      </div>
    </CommandProvider>
  );
};
