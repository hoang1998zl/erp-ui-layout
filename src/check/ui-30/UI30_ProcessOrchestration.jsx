import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Play,
  Pause,
  Settings,
  BarChart3,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Bell,
  Database,
  Workflow,
  Save,
  Download,
  Upload,
  CornerDownLeft
} from 'lucide-react';

export default function UI30_ProcessOrchestration() {
  const [activeView, setActiveView] = useState('overview');
  const [selectedProcess, setSelectedProcess] = useState(null);

  const processMetrics = [
    {
      title: 'Quy trình đang chạy',
      value: '24',
      change: '+3',
      icon: Activity,
      color: 'bg-blue-500'
    },
    {
      title: 'Tỷ lệ thành công',
      value: '96.8%',
      change: '+2.1%',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Thời gian trung bình',
      value: '4.2 phút',
      change: '-0.8 phút',
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      title: 'Cảnh báo',
      value: '3',
      change: '-2',
      icon: AlertTriangle,
      color: 'bg-orange-500'
    }
  ];

  const processes = [
    {
      id: 'PROC-001',
      name: 'Xử lý đơn hàng',
      description: 'Quy trình từ đặt hàng đến giao hàng',
      status: 'running',
      health: 'healthy',
      instances: 156,
      avgDuration: '3.2 phút',
      successRate: 98.5,
      lastRun: '2 phút trước',
      category: 'Sales'
    },
    {
      id: 'PROC-002', 
      name: 'Phê duyệt thanh toán',
      description: 'Quy trình phê duyệt các khoản thanh toán',
      status: 'running',
      health: 'warning',
      instances: 89,
      avgDuration: '8.1 phút',
      successRate: 94.2,
      lastRun: '5 phút trước',
      category: 'Finance'
    },
    {
      id: 'PROC-003',
      name: 'Onboarding nhân viên',
      description: 'Quy trình đưa nhân viên mới vào làm việc',
      status: 'paused',
      health: 'healthy',
      instances: 12,
      avgDuration: '2.3 giờ',
      successRate: 100,
      lastRun: '1 giờ trước',
      category: 'HR'
    },
    {
      id: 'PROC-004',
      name: 'Kiểm tra chất lượng',
      description: 'Quy trình kiểm tra chất lượng sản phẩm',
      status: 'error',
      health: 'critical',
      instances: 45,
      avgDuration: '12.5 phút',
      successRate: 87.3,
      lastRun: '10 phút trước',
      category: 'Quality'
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'running': return 'text-green-600 bg-green-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'stopped': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthColor = (health) => {
    switch(health) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'running': return Play;
      case 'paused': return Pause;
      case 'error': return AlertTriangle;
      default: return Clock;
    }
  };

  // --- mock data & UI state ---
  const [processMetricsState, setProcessMetricsState] = useState(processMetrics);
  const [processesState, setProcessesState] = useState(processes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [toasts, setToasts] = useState([]);

  // sorting & pagination
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);
  const pollingRef = useRef(null);

  // Toast helper
  function showToast(text, tone='default'){
    const id = Math.random().toString(36).slice(2,9);
    setToasts(t => [...t, { id, text, tone }]);
    // allow manual close too
    setTimeout(()=> setToasts(t => t.filter(x=> x.id !== id)), 5000);
  }

  function Toasts({ items, onClose }){
    return (
      <div className="fixed z-40 flex flex-col gap-2 right-4 bottom-4">
        {items.map(t => (
          <div key={t.id} className={`px-3 py-2 rounded-lg shadow-md text-sm ${t.tone==='error'? 'bg-rose-600 text-white': t.tone==='warn'? 'bg-amber-500 text-black':'bg-zinc-900 text-white'}`}>
            <div className="flex items-start gap-3"><div className="flex-1">{t.text}</div><button onClick={()=> onClose(t.id)} className="opacity-80">✕</button></div>
          </div>
        ))}
      </div>
    );
  }

  // CSV / JSON helper
  function downloadCSV(name, rows){
    const keys = Object.keys(rows[0]||{});
    const csv = [keys.join(',')].concat(rows.map(r => keys.map(k=> JSON.stringify(r[k]??'')).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJSON(name, data){
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  // save/load to localStorage
  function saveState(){
    const payload = { processes: processesState, metrics: processMetricsState };
    localStorage.setItem('ui30_state_v1', JSON.stringify(payload));
    showToast('Saved workspace', 'default');
  }
  function loadState(){
    try{
      const raw = localStorage.getItem('ui30_state_v1');
      if(!raw) { showToast('No saved state', 'warn'); return; }
      const parsed = JSON.parse(raw);
      setProcessesState(parsed.processes || processesState);
      setProcessMetricsState(parsed.metrics || processMetricsState);
      showToast('Loaded workspace', 'default');
    }catch(e){ showToast('Failed to load saved state','error'); }
  }

  // mock fetch
  const fetchMock = useCallback(()=>{
    setLoading(true); setError(null);
    setTimeout(()=>{
      try{
        setProcessMetricsState(processMetrics);
        setProcessesState(processes);
        showToast('Loaded mock processes');
      }catch(e){ setError('Failed to load'); showToast('Load failed','error'); }
      setLoading(false);
    }, 700);
  }, []);

  useEffect(()=>{ fetchMock(); }, [fetchMock]);

  // keyboard shortcuts (r=refresh, e=export, ctrl/cmd+s save)
  useEffect(()=>{
    const onKey = (e)=>{
      // save
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
        e.preventDefault(); saveState();
      }
      if(e.key.toLowerCase()==='r'){ fetchMock(); showToast('Refreshing'); }
      if(e.key.toLowerCase()==='e'){ downloadCSV('processes.csv', processesState); showToast('Exported CSV'); }
    };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [processesState, fetchMock]);

  // selection helpers
  function toggleSelect(id){ setSelectedIds(s => s.includes(id)? s.filter(x=> x!==id): [...s, id]); }
  function clearSelection(){ setSelectedIds([]); }
  function bulkAction(action){ showToast(`${action} on ${selectedIds.length} items`); clearSelection(); }

  // filter by search (debounced)
  useEffect(()=>{
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(()=> setSearchDebounced(search.trim()), 300);
    return ()=> clearTimeout(debounceRef.current);
  }, [search]);

  const filteredProcesses = useMemo(()=>{
    const q = searchDebounced.toLowerCase();
    return processesState.filter(p => !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
  }, [processesState, searchDebounced]);

  // sorting
  const sortedProcesses = useMemo(()=>{
    const arr = [...filteredProcesses];
    arr.sort((a,b)=>{
      const A = (a[sortBy] ?? '').toString().toLowerCase();
      const B = (b[sortBy] ?? '').toString().toLowerCase();
      if(A < B) return sortDir === 'asc' ? -1 : 1;
      if(A > B) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredProcesses, sortBy, sortDir]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(sortedProcesses.length / pageSize));
  useEffect(()=>{ if(page > totalPages) setPage(1); }, [totalPages]);
  const paginated = useMemo(()=> sortedProcesses.slice((page-1)*pageSize, page*pageSize), [sortedProcesses, page, pageSize]);

  // select all on page
  function toggleSelectAllPage(){
    const idsOnPage = paginated.map(p=>p.id);
    const allSelected = idsOnPage.every(id=> selectedIds.includes(id));
    if(allSelected) setSelectedIds(s => s.filter(x=> !idsOnPage.includes(x)));
    else setSelectedIds(s => Array.from(new Set([...s, ...idsOnPage])));
  }
  function selectAll(){ setSelectedIds(processesState.map(p=>p.id)); }

  // import JSON
  function handleImportJSON(file){
    const reader = new FileReader();
    reader.onload = (ev)=>{
      try{
        const parsed = JSON.parse(ev.target.result);
        if(Array.isArray(parsed)) setProcessesState(parsed);
        else if(parsed.processes) setProcessesState(parsed.processes);
        showToast('Imported JSON', 'default');
      }catch(e){ showToast('Invalid JSON','error'); }
    };
    reader.readAsText(file);
  }
  function onPickFile(){ fileInputRef.current?.click(); }

  // detail drawer
  const [drawerProcess, setDrawerProcess] = useState(null);
  function openDrawer(p){ setDrawerProcess(p); }
  function closeDrawer(){ setDrawerProcess(null); }

  // polling updates (simulate occasional changes)
  useEffect(()=>{
    pollingRef.current = setInterval(()=>{
      setProcessesState(prev => prev.map(p => {
        // random tiny update to lastRun
        if(Math.random() < 0.25){
          return { ...p, instances: p.instances + (Math.random()<0.5?1:0), lastRun: 'vừa xong' };
        }
        return p;
      }));
    }, 8000);
    return ()=> clearInterval(pollingRef.current);
  }, []);

  // small helpers
  function formatRate(n){ return (typeof n === 'number')? `${n}%` : n; }

  return (
    <>
      <Toasts items={toasts} onClose={(id)=> setToasts(t => t.filter(x=> x.id !== id))} />

      <div className="min-h-screen p-6 bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Điều phối Quy trình</h1>
              <p className="text-gray-600">Giám sát và quản lý các quy trình nghiệp vụ tự động</p>
            </div>
            <div className="flex gap-3">
              <button onClick={saveState} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Save className="w-4 h-4" />
                Lưu
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" onClick={onPickFile}>
                <Upload className="w-4 h-4" />
                Import JSON
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e)=> e.target.files?.[0] && handleImportJSON(e.target.files[0])} />
              <button onClick={()=> downloadJSON('processes.json', processesState)} className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button onClick={()=> { fetchMock(); showToast('Refresh requested'); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <CornerDownLeft className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
          {processMetricsState.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white shadow-sm rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      metric.change.startsWith('+') ? 'text-green-600' : 
                      metric.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.change}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">so với hôm qua</span>
                  </div>
                </div>
                <div className={`${metric.color} p-3 rounded-lg`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white shadow-sm rounded-xl">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex px-6 space-x-8">
                  {['overview', 'processes', 'monitoring'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveView(tab)}
                      className={`py-4 border-b-2 font-medium text-sm ${
                        activeView === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'overview' ? 'Tổng quan' : 
                       tab === 'processes' ? 'Quy trình' : 'Giám sát'}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={e=>{ setSearch(e.target.value); setPage(1); }}
                      placeholder="Tìm kiếm quy trình..."
                      className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={sortBy} onChange={e=> setSortBy(e.target.value)} className="px-3 py-2 border rounded">
                      <option value="name">Tên</option>
                      <option value="id">Mã</option>
                      <option value="category">Danh mục</option>
                      <option value="instances">Instances</option>
                    </select>
                    <button onClick={()=> setSortDir(d=> d==='asc'?'desc':'asc')} className="px-3 py-2 border rounded">{sortDir==='asc'?'↑':'↓'}</button>
                    <select value={pageSize} onChange={e=> { setPageSize(Number(e.target.value)); setPage(1);}} className="px-3 py-2 border rounded">
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={()=> toggleSelectAllPage()}>
                      Chọn trang
                    </button>
                  </div>
                </div>
              </div>

              {/* Process List */}
              <div className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="w-full h-6 bg-gray-200 rounded" />
                      <div className="w-full h-3 bg-gray-200 rounded" />
                      <div className="w-3/4 h-3 bg-gray-200 rounded" />
                    </div>
                  ) : error ? (
                    <div className="text-sm text-rose-600">
                      {error} <button onClick={fetchMock} className="ml-2 underline">Retry</button>
                    </div>
                  ) : (
                    paginated.map((process) => {
                      const StatusIcon = getStatusIcon(process.status);
                      return (
                        <motion.div
                          key={process.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <input type="checkbox" checked={selectedIds.includes(process.id)} onChange={()=> toggleSelect(process.id)} />
                                <StatusIcon className="w-5 h-5 text-gray-500" />
                                <h3 className="font-medium text-gray-900">{process.name} <span className="ml-2 text-xs text-gray-500">{process.id}</span></h3>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}>
                                  {process.status === 'running' ? 'Đang chạy' :
                                   process.status === 'paused' ? 'Tạm dừng' :
                                   process.status === 'error' ? 'Lỗi' : process.status}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(process.health)}`}>
                                  {process.health === 'healthy' ? 'Tốt' :
                                   process.health === 'warning' ? 'Cảnh báo' :
                                   process.health === 'critical' ? 'Nghiêm trọng' : process.health}
                                </span>
                                <span className="text-sm text-gray-500">· {process.instances} instances</span>
                                <span className="text-sm text-gray-400">· {formatRate(process.successRate)}</span>
                                <span className="text-sm text-gray-400">· {process.lastRun}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button onClick={()=> openDrawer(process)} className="p-2 text-gray-400 hover:text-gray-600">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={()=> { showToast('Started '+process.name); }} className="p-2 text-green-600 rounded hover:bg-green-50">
                                <Play className="w-4 h-4" />
                              </button>
                              <button onClick={()=> { showToast('Paused '+process.name); }} className="p-2 text-yellow-600 rounded hover:bg-yellow-50">
                                <Pause className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}

                  {/* pagination controls */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                      <button onClick={()=> setPage(p=> Math.max(1, p-1))} className="px-3 py-2 border rounded">Prev</button>
                      <span>Trang {page} / {totalPages}</span>
                      <button onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="px-3 py-2 border rounded">Next</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={()=> selectAll()} className="px-3 py-2 border rounded">Chọn tất cả ({processesState.length})</button>
                      <button onClick={()=> { downloadCSV('processes.csv', sortedProcesses); showToast('Exported CSV'); }} className="px-3 py-2 border rounded">Export CSV</button>
                      <button onClick={()=> { downloadJSON('processes.json', sortedProcesses); showToast('Exported JSON'); }} className="px-3 py-2 border rounded">Export JSON</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 space-y-6 lg:col-span-4">
            {/* quick export */}
            <div className="p-4 bg-white shadow-sm rounded-xl">
              <div className="flex gap-2">
                <button onClick={()=> { downloadCSV('processes.csv', filteredProcesses); showToast('Exported CSV') }} className="px-3 py-2 border rounded">Export CSV</button>
                <button onClick={()=> { downloadCSV('selected.csv', processesState.filter(p=> selectedIds.includes(p.id))); showToast('Exported selected') }} className="px-3 py-2 border rounded">Export selected</button>
                <button onClick={()=> { fileInputRef.current?.click(); }} className="px-3 py-2 border rounded">Import JSON</button>
              </div>
            </div>

            {/* System Health */}
            <div className="p-6 bg-white shadow-sm rounded-xl">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Sức khỏe hệ thống</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Cơ sở dữ liệu</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">Tốt</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Engine quy trình</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">Tốt</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Hệ thống thông báo</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">Cảnh báo</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 bg-white shadow-sm rounded-xl">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Thao tác nhanh</h3>
              <div className="space-y-3">
                <button onClick={()=> { setProcessesState(s => [{ id: `PROC-${Math.floor(Math.random()*1000)}`, name: 'Quy trình tạm', description: 'Auto-created', status: 'running', health: 'healthy', instances: 1, avgDuration: '1 phút', successRate: 100, lastRun: 'vừa tạo', category: 'Misc' }, ...s]); showToast('Created temporary process'); }} className="flex items-center w-full gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>Tạo quy trình mới</span>
                </button>
                <button className="flex items-center w-full gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span>Báo cáo hiệu suất</span>
                </button>
                <button className="flex items-center w-full gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Settings className="w-4 h-4 text-purple-600" />
                  <span>Cấu hình engine</span>
                </button>
                <button className="flex items-center w-full gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span>Xem logs hệ thống</span>
                </button>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="p-6 bg-white shadow-sm rounded-xl">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Cảnh báo gần đây</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-red-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Quy trình PROC-004 có tỷ lệ lỗi cao</p>
                    <p className="text-xs text-gray-500">3 phút trước</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-yellow-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Thời gian xử lý PROC-002 tăng 20%</p>
                    <p className="text-xs text-gray-500">15 phút trước</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Quy trình mới PROC-005 đã được tạo</p>
                    <p className="text-xs text-gray-500">1 giờ trước</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Detail drawer */}
        <div aria-hidden={!drawerProcess} className={`fixed top-0 right-0 h-full w-full z-50 ${drawerProcess? 'pointer-events-auto': 'pointer-events-none'}`}>
          <div onClick={closeDrawer} className={`absolute inset-0 bg-black/30 transition-opacity ${drawerProcess? 'opacity-100':'opacity-0'}`} />
          <aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg transform transition-transform ${drawerProcess? 'translate-x-0':'translate-x-full'}`}>
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Chi tiết quy trình</h3>
                <button onClick={closeDrawer} className="text-gray-500">Đóng</button>
              </div>
              {drawerProcess ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">{drawerProcess.name} <span className="ml-2 text-xs text-gray-400">{drawerProcess.id}</span></p>
                  <p className="text-sm text-gray-600">{drawerProcess.description}</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium">{drawerProcess.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Health</p>
                      <p className="font-medium">{drawerProcess.health}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Instances</p>
                      <p className="font-medium">{drawerProcess.instances}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Avg duration</p>
                      <p className="font-medium">{drawerProcess.avgDuration}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium">Actions</h4>
                    <div className="flex gap-2 mt-2">
                      <button onClick={()=> { showToast('Restarted '+drawerProcess.name); }} className="px-3 py-2 border rounded">Restart</button>
                      <button onClick={()=> { showToast('Stopped '+drawerProcess.name); }} className="px-3 py-2 border rounded">Stop</button>
                      <button onClick={()=> { downloadJSON(`${drawerProcess.id}.json`, drawerProcess); showToast('Exported detail'); }} className="px-3 py-2 border rounded">Export</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-sm text-gray-500">No selection</div>
              )}
            </div>
          </aside>
        </div>

      </div>
    </>
  );
}
