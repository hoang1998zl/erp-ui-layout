import React, { useEffect, useRef, useState } from "react";
import { Card, Input, Button, Tag } from "../../ui-helpers.jsx";

export default function UI71_AIChatOps() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);
  const containerRef = useRef(null);

  const pushToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 3000);
  };

  useEffect(() => {
    // seed
    setMessages([
      { id: 'm-1', role: 'system', ts: '2025-08-01T10:00:00Z', text: 'Welcome to AI ChatOps. Ask about deployments or incidents.' },
      { id: 'm-2', role: 'assistant', ts: '2025-08-01T10:00:05Z', text: 'I can show recent deploys, incidents, and runbooks.' },
    ]);
  }, []);

  useEffect(() => { containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const id = `u-${Date.now()}`;
    const msg = { id, role: 'user', ts: new Date().toISOString(), text };
    setMessages((m) => [...m, msg]);
    setText('');

    // mock assistant response
    setTimeout(() => {
      const r = { id: `a-${Date.now()}`, role: 'assistant', ts: new Date().toISOString(), text: `Mock reply to: ${msg.text.slice(0,80)}` };
      setMessages((m) => [...m, r]);
      pushToast('Received reply');
    }, 600 + Math.random()*800);
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `chatops_history_${new Date().toISOString()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    pushToast('Exported chat history');
  };

  const filtered = messages.filter(m => !search.trim() || m.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">UI71 — AI ChatOps</h1>
          <p className="mt-1 text-gray-600">Mock chat interface for operations assistants. Messages are synthetic.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search messages" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-64" />
          <Button onClick={exportHistory}>Export</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-3">
        <Card title="Conversation" subtitle="Messages" className="lg:col-span-2">
          <div ref={containerRef} className="h-64 overflow-auto p-2 bg-gray-50 rounded">
            {filtered.map(m => (
              <div key={m.id} className={`mb-2 ${m.role==='user' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-[80%] p-2 rounded ${m.role==='assistant' ? 'bg-white' : 'bg-blue-50'}`}>
                  <div className="text-xs text-gray-500">{m.role} • {new Date(m.ts).toLocaleString()}</div>
                  <div className="mt-1 text-sm whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-sm text-gray-500">No messages match search.</div>}
          </div>

          <div className="mt-3 flex gap-2">
            <Input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Type a message" />
            <Button onClick={send} variant="primary">Send</Button>
          </div>
        </Card>

        <Card title="Status" subtitle="Summary">
          <div className="space-y-2">
            <div className="text-sm">Total messages: <strong>{messages.length}</strong></div>
            <div className="text-sm">Search filter: <strong>{search || '—'}</strong></div>
            <div className="text-sm">Last activity: <strong>{messages[messages.length-1]?.ts ? new Date(messages[messages.length-1].ts).toLocaleString() : '—'}</strong></div>
            <div className="mt-2">
              <Tag tone="slate">Mock-only</Tag>
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed right-4 bottom-4 space-y-2 z-60">
        {toasts.map(t => <div key={t.id} className="px-3 py-2 bg-black text-white text-sm rounded">{t.msg}</div>)}
      </div>
    </div>
  );
}
