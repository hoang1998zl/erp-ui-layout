
import React, { useRef, useState } from 'react';
import { Modal } from '../modals/Modal';
import { createTask, createExpense, createDocument } from '../../../integrations/quick/mockApi';
import { useToast } from '../toast/Toast';

export type QuickKind = 'Task'|'Expense'|'Document';

export const QuickCreateForms: React.FC<{ kind: QuickKind|null; onClose: ()=>void }> = ({ kind, onClose }) => {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  // common fields state
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('PRJ-A');
  const [assignee, setAssignee] = useState('me');
  const [due, setDue] = useState<string>('');
  const [priority, setPriority] = useState<'Low'|'Normal'|'High'>('Normal');

  const [date, setDate] = useState<string>('');
  const [category, setCategory] = useState('Travel');
  const [amount, setAmount] = useState<number>(0);
  const [vendor, setVendor] = useState<string>('');
  const [receipt, setReceipt] = useState<string>(''); // base64 name

  const [docTitle, setDocTitle] = useState('');
  const [folder, setFolder] = useState('General');
  const [tags, setTags] = useState<string>('');

  const fmtVND = (v:number)=> new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(v||0);

  const submit = async () => {
    try {
      setBusy(true);
      if (kind==='Task'){
        if (!title.trim()) throw new Error('Title is required');
        const row = await createTask({ title, project, assignee, due, priority });
        toast.success('Task created: '+row.id);
      } else if (kind==='Expense'){
        if (!date) throw new Error('Date is required');
        if (!amount || amount<=0) throw new Error('Amount must be > 0');
        const row = await createExpense({ date, category, amount, vendor, receipt });
        toast.success('Expense created: '+row.id);
      } else if (kind==='Document'){
        if (!docTitle.trim()) throw new Error('Title is required');
        const row = await createDocument({ title: docTitle, folder, tags: tags.split(',').map(s=>s.trim()).filter(Boolean) });
        toast.success('Document created: '+row.id);
      }
      onClose();
    } catch (e:any){
      toast.error(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <>
      <button onClick={onClose} disabled={busy} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Cancel</button>
      <button onClick={submit} disabled={busy} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>{busy? 'Saving…' : 'Create'}</button>
    </>
  );

  // receipt to base64 name only (demo)
  const onFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReceipt(f.name);
  };

  return (
    <>
      <Modal open={kind==='Task'} title="Quick Create — Task" onClose={onClose} footer={footer} width={680}>
        <div style={{ display:'grid', gap:10 }}>
          <label style={{ display:'grid', gap:6 }}><span>Title *</span><input value={title} onChange={e=> setTitle(e.target.value)} placeholder="Define scope for PRJ-A" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <label style={{ display:'grid', gap:6 }}><span>Project</span>
              <select value={project} onChange={e=> setProject(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option>PRJ-A</option><option>PRJ-B</option><option>PRJ-C</option>
              </select>
            </label>
            <label style={{ display:'grid', gap:6 }}><span>Assignee</span>
              <select value={assignee} onChange={e=> setAssignee(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option value="me">Me</option><option>pm.tran</option><option>fin.nguyen</option>
              </select>
            </label>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <label style={{ display:'grid', gap:6 }}><span>Due date</span><input type="date" value={due} onChange={e=> setDue(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>Priority</span>
              <select value={priority} onChange={e=> setPriority(e.target.value as any)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option>Low</option><option>Normal</option><option>High</option>
              </select>
            </label>
          </div>
        </div>
      </Modal>

      <Modal open={kind==='Expense'} title="Quick Create — Expense" onClose={onClose} footer={footer} width={720}>
        <div style={{ display:'grid', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <label style={{ display:'grid', gap:6 }}><span>Date *</span><input type="date" value={date} onChange={e=> setDate(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>Category</span>
              <select value={category} onChange={e=> setCategory(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option>Travel</option><option>Meal</option><option>Office</option><option>Other</option>
              </select>
            </label>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <label style={{ display:'grid', gap:6 }}><span>Amount (VND) *</span><input type="number" min={0} value={amount} onChange={e=> setAmount(Number(e.target.value))} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', textAlign:'right' }} /></label>
            <label style={{ display:'grid', gap:6 }}><span>Vendor</span><input value={vendor} onChange={e=> setVendor(e.target.value)} placeholder="Grab, Vietjet, ..." style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          </div>
          <label style={{ display:'grid', gap:6 }}><span>Receipt (optional)</span><input type="file" onChange={onFile} /></label>
          <div style={{ color:'#64748b', fontSize:12 }}>Preview: <b>{fmtVND(amount)}</b>{receipt? ' • receipt: '+receipt : ''}</div>
        </div>
      </Modal>

      <Modal open={kind==='Document'} title="Quick Create — Document" onClose={onClose} footer={footer} width={680}>
        <div style={{ display:'grid', gap:10 }}>
          <label style={{ display:'grid', gap:6 }}><span>Title *</span><input value={docTitle} onChange={e=> setDocTitle(e.target.value)} placeholder="Nghị quyết họp Q3" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <label style={{ display:'grid', gap:6 }}><span>Folder</span>
              <select value={folder} onChange={e=> setFolder(e.target.value)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }}>
                <option>General</option><option>Finance</option><option>Projects</option><option>HR</option>
              </select>
            </label>
            <label style={{ display:'grid', gap:6 }}><span>Tags (comma)</span><input value={tags} onChange={e=> setTags(e.target.value)} placeholder="policy, 2025" style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px' }} /></label>
          </div>
        </div>
      </Modal>
    </>
  );
};
