
// src/components/ux/modals/ModalDemo.tsx — demo all templates
import React, { useState } from 'react';
import { ModalProvider, useModal } from './ModalProvider';

function DemoInner(){
  const modal = useModal();
  const [log, setLog] = useState<string>('');

  const runConfirm = async () => {
    const ok = await modal.confirm({
      title: 'Delete Purchase Order',
      description: 'PO-000123 • Vendor V001',
      warning: 'This action cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel'
    });
    setLog(`Confirm result: ${ok}`);
  };

  const runForm = async () => {
    const data = await modal.form<{ code:string; name:string; taxId?:string; email?:string }>({
      title: 'Create Vendor',
      description: 'Enter basic vendor information',
      initial: { code:'', name:'', taxId:'', email:'' },
      render: ({ draft, set }) => (
        <div style={{ display:'grid', gap:10 }}>
          <label style={{ display:'grid', gap:6 }}><span>Code *</span><input value={draft.code} onChange={e=> set('code', e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          <label style={{ display:'grid', gap:6 }}><span>Name *</span><input value={draft.name} onChange={e=> set('name', e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          <label style={{ display:'grid', gap:6 }}><span>Tax ID</span><input value={draft.taxId||''} onChange={e=> set('taxId', e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          <label style={{ display:'grid', gap:6 }}><span>Email</span><input value={draft.email||''} onChange={e=> set('email', e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
        </div>
      ),
      validate: (d) => {
        if (!d.code?.trim()) return 'Code is required';
        if (!d.name?.trim()) return 'Name is required';
        if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'Invalid email';
        return null;
      },
      onSubmit: async (d) => { await new Promise(res => setTimeout(res, 400)); },
      okText: 'Save'
    });
    setLog('Form result: ' + JSON.stringify(data));
  };

  const runWizard = async () => {
    const data = await modal.wizard<{ fullName:string; dept:string; startDate:string; contract:string }>({
      title: 'New Employee',
      description: '3-step onboarding wizard',
      initial: { fullName:'', dept:'', startDate:'', contract:'Full-time' },
      steps: [
        {
          title: 'Basic info',
          render: ({ draft, set }) => (
            <div style={{ display:'grid', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}><span>Full Name *</span><input value={draft.fullName} onChange={e=> set('fullName', e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'grid', gap:6 }}><span>Department *</span>
                <select value={draft.dept} onChange={e=> set('dept', e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  <option value="">— Select —</option>
                  <option value="PMO">PMO</option><option value="IT">IT</option><option value="Finance">Finance</option>
                </select>
              </label>
            </div>
          ),
          validate: (d) => (!d.fullName?.trim() || !d.dept) ? 'Fill all required fields' : null
        },
        {
          title: 'Start & Contract',
          render: ({ draft, set }) => (
            <div style={{ display:'grid', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}><span>Start date *</span><input type="date" value={draft.startDate} onChange={e=> set('startDate', e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
              <label style={{ display:'grid', gap:6 }}><span>Contract</span>
                <select value={draft.contract} onChange={e=> set('contract', e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                  <option>Full-time</option><option>Part-time</option><option>Contractor</option>
                </select>
              </label>
            </div>
          ),
          validate: (d) => (!d.startDate) ? 'Start date required' : null
        },
        {
          title: 'Review & Confirm',
          render: ({ all }) => (
            <div style={{ lineHeight:1.9 }}>
              <div><b>Full Name:</b> {all.fullName}</div>
              <div><b>Dept:</b> {all.dept}</div>
              <div><b>Start Date:</b> {all.startDate}</div>
              <div><b>Contract:</b> {all.contract}</div>
            </div>
          )
        }
      ],
      onFinish: async (d) => { await new Promise(res => setTimeout(res, 500)); },
      finishText: 'Create employee'
    });
    setLog('Wizard result: ' + JSON.stringify(data));
  };

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button onClick={runConfirm} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Open Confirm</button>
        <button onClick={runForm} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Open Form</button>
        <button onClick={runWizard} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', background:'#fff' }}>Open Wizard</button>
      </div>
      <div style={{ fontSize:12, color:'#64748b' }}>{log}</div>
      <div style={{ border:'1px dashed #e5e7eb', borderRadius:10, padding:10, color:'#64748b', fontSize:12 }}>
        Tips: <b>Esc</b> to close; <b>Tab/Shift+Tab</b> cycles focus; overlay click closes (if dismissible).
      </div>
    </div>
  );
}

export const ModalDemo: React.FC = () => {
  return (
    <ModalProvider>
      <DemoInner />
    </ModalProvider>
  );
};
