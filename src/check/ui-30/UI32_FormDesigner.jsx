import React from 'react'
import { Card, Tag, Input, Select, Button } from '../../ui-helpers.jsx'

export default function UI32_FormDesigner(){
  const [fields, setFields] = React.useState([
    { key:'vendor', label:'Vendor name', type:'text', required:true },
    { key:'amount', label:'Amount (VND)', type:'number', required:true },
    { key:'currency', label:'Currency', type:'select', options:['VND','USD','EUR'], required:true },
  ])
  const [preview, setPreview] = React.useState({})
  const addField = (type)=> setFields(f=>[...f, { key:'f'+(f.length+1), label:'New field', type, required:false }])

  // additional UI state
  const [loading, setLoading] = React.useState(false)
  const [toasts, setToasts] = React.useState([])
  const fileRef = React.useRef(null)

  function showToast(text, tone='default'){ const id = Math.random().toString(36).slice(2,9); setToasts(t => [...t, { id, text, tone }]); setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==id)), 4000) }

  function Toasts({ items, onClose }){ return (
    <div className="fixed z-40 flex flex-col gap-2 right-4 bottom-4">
      {items.map(t=> (
        <div key={t.id} className={`px-3 py-2 rounded-lg shadow-md text-sm ${t.tone==='error'? 'bg-rose-600 text-white':'bg-zinc-900 text-white'}`}>
          <div className="flex items-center justify-between">
            <div>{t.text}</div>
            <button onClick={()=>onClose(t.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )}

  // mock save/load/export/import
  function saveSchema(){
    setLoading(true)
    setTimeout(()=>{
      try{
        const payload = { fields, savedAt: new Date().toISOString() }
        const list = JSON.parse(localStorage.getItem('form_schemas')||'[]')
        list.push(payload)
        localStorage.setItem('form_schemas', JSON.stringify(list))
        showToast('Schema saved (mock)')
      }catch(e){ showToast('Save failed','error') }
      setLoading(false)
    }, 400)
  }

  function exportJSON(){
    const obj = { fields }
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'form-schema.json'; a.click(); URL.revokeObjectURL(url)
    showToast('Exported schema')
  }

  function importJSONFile(file){
    const r = new FileReader()
    r.onload = e=>{
      try{
        const obj = JSON.parse(e.target.result)
        if(obj.fields){ setFields(obj.fields); showToast('Imported schema') }
        else showToast('Invalid schema','error')
      }catch(err){ showToast('Invalid JSON','error') }
    }
    r.readAsText(file)
  }

  // keyboard shortcut: save with Ctrl/Cmd+S
  React.useEffect(()=>{
    const onKey = (e)=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); saveSchema() } }
    window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey)
  }, [fields])

  return (
    <div className="p-5 space-y-4">
      <Toasts items={toasts} onClose={(id)=> setToasts(t=>t.filter(x=>x.id!==id))} />

      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">UI32 · Form Designer</div>
        <div className="flex items-center gap-2 ml-auto">
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={e=>{ if(e.target.files && e.target.files[0]) importJSONFile(e.target.files[0]) }} />
          <Button onClick={()=>addField('text')}>+ Text</Button>
          <Button onClick={()=>addField('number')}>+ Number</Button>
          <Button onClick={()=>addField('select')}>+ Select</Button>
          <Button onClick={saveSchema} variant="primary" disabled={loading}>{loading? 'Saving...':'Save schema'}</Button>
          <Button onClick={exportJSON}>Export</Button>
          <Button onClick={()=>fileRef.current?.click()}>Import</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6 space-y-3">
          <Card title="Fields">
            <ul className="space-y-3">
              {fields.map((f,i)=>(
                <li key={f.key} className="flex items-center gap-3 p-3 border rounded-2xl border-neutral-200">
                  <Tag tone="indigo">{f.type}</Tag>
                  <Input className="flex-1" value={f.label} onChange={e=>setFields(arr=>arr.map((x,idx)=> idx===i? {...x, label:e.target.value}:x))}/>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={f.required} onChange={e=>setFields(arr=>arr.map((x,idx)=> idx===i? {...x, required:e.target.checked}:x))}/>
                    required
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="col-span-6 space-y-3">
          <Card title="Preview">
            <form className="space-y-3">
              {fields.map(f=> (
                <div key={f.key}>
                  <div className="mb-1 text-xs text-neutral-500">{f.label} {f.required && <span className="text-rose-600">*</span>}</div>
                  {f.type==='text' && <Input value={preview[f.key]||''} onChange={e=>setPreview(p=>({...p,[f.key]:e.target.value}))}/>} 
                  {f.type==='number' && <Input type="number" value={preview[f.key]||''} onChange={e=>setPreview(p=>({...p,[f.key]:e.target.value}))}/>} 
                  {f.type==='select' && (
                    <Select value={preview[f.key]||''} onChange={e=>setPreview(p=>({...p,[f.key]:e.target.value}))}>
                      <option value="" disabled>-- chọn --</option>
                      {(f.options||[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                  )}
                </div>
              ))}
              <Button variant="primary" onClick={e=>{e.preventDefault(); /* submit preview */ showToast('Preview submitted (demo)') }}>Submit</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
