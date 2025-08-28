import React, { useEffect, useState } from "react";
import { Card, Button, Tag } from "../../ui-helpers.jsx";

export default function UI74_DocumentAI() {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);

  const mockUpload = (name) => new Promise((resolve) => setTimeout(() => resolve({ id: `doc-${Date.now()}`, name, status: 'Queued', uploadedAt: new Date().toISOString() }), 200));
  const mockProcess = (doc) => new Promise((resolve) => setTimeout(() => resolve({ ...doc, status: Math.random()<0.85 ? 'Processed' : 'Failed', processedAt: new Date().toISOString() }), 700));

  const uploadFile = async () => {
    const name = `invoice_${Math.random().toString(36).slice(2,8)}.pdf`;
    const doc = await mockUpload(name);
    setQueue((q) => [doc, ...q]);
  };

  const startProcessing = async () => {
    setProcessing(true);
    for (let i=queue.length-1;i>=0;i--) {
      const doc = queue[i];
      if (doc.status === 'Queued') {
        setQueue((q)=> q.map(x=> x.id===doc.id?{...x,status:'Processing'}:x));
        // eslint-disable-next-line no-await-in-loop
        const res = await mockProcess(doc);
        setQueue((q)=> q.map(x=> x.id===doc.id?res:x));
      }
    }
    setProcessing(false);
  };

  return (
    <div className="p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">UI74 — Document AI</h1>
          <p className="mt-2 text-gray-600">Mock OCR and document processing queue.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={uploadFile}>Upload sample</Button>
          <Button onClick={startProcessing} variant="primary">Start processing</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-3">
        <Card title="Queue" subtitle="Recent uploads" className="lg:col-span-2">
          <div className="space-y-2">
            {queue.map(d => (
              <div key={d.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-gray-500">{d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag tone={d.status==='Processed'?'green':d.status==='Processing'?'indigo':'slate'}>{d.status}</Tag>
                  {d.status==='Failed' && <Button onClick={() => setQueue((q)=> q.map(x=> x.id===d.id?{...x,status:'Queued'}:x))}>Retry</Button>}
                </div>
              </div>
            ))}
            {queue.length===0 && <div className="text-sm text-gray-500">No uploads yet.</div>}
          </div>
        </Card>

        <Card title="Stats" subtitle="Processing summary">
          <div className="space-y-2 text-sm">
            <div>Total: {queue.length}</div>
            <div>Processing: {queue.filter(q=>q.status==='Processing').length}</div>
            <div>Processed: {queue.filter(q=>q.status==='Processed').length}</div>
            <div>Failed: {queue.filter(q=>q.status==='Failed').length}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
