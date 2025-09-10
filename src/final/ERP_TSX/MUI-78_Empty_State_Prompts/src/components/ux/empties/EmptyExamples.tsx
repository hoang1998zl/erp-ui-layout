
// src/components/ux/empties/EmptyExamples.tsx — examples per common use
import React, { useState } from 'react';
import { InlineEmpty, PageEmpty } from './EmptyState';

// fake seeds
const loadSampleExpenses = () => new Promise<void>(res => setTimeout(res, 500));

export const EmptyExamples: React.FC = () => {
  const [hasExpenseData, setHasExpenseData] = useState(false);
  const [filterNoResults, setFilterNoResults] = useState(true);
  const [offline, setOffline] = useState(false);
  const [noPerm, setNoPerm] = useState(false);

  return (
    <div style={{ display:'grid', gap:14 }}>
      {/* 1) First-use page (no data at all) */}
      <section style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:12, display:'grid', gap:10 }}>
        <div style={{ fontWeight:700 }}>First-use (page)</div>
        {!hasExpenseData ? (
          <PageEmpty
            kind="first-use"
            title="Chưa có Expense nào"
            description="Bắt đầu bằng cách tạo Expense đầu tiên của bạn, hoặc nhập thử dữ liệu mẫu."
            suggestions={[
              { label:'Tạo Expense', onClick:()=> alert('open FIN‑06 quick create') },
              { label:'Nhập mẫu', onClick:async ()=> { await loadSampleExpenses(); setHasExpenseData(true); } },
              { label:'Xem hướng dẫn', onClick:()=> window.open('https://example.com/docs/expense','_blank') }
            ]}
            tips={[
              'Có thể chụp ảnh hoá đơn rồi OCR tự điền.',
              'Expense có thể gắn Project & Cost center.',
              'Phê duyệt chạy theo workflow 2 cấp.'
            ]}
            helpLink={{ label:'Tài liệu: quản lý Expense', href:'#' }}
          />
        ) : (
          <div style={{ padding:16, color:'#16a34a' }}>Đã nạp dữ liệu mẫu ✔</div>
        )}
      </section>

      {/* 2) Inline: No-results (filters) */}
      <section style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:12, display:'grid', gap:10 }}>
        <div style={{ fontWeight:700 }}>No-results (inline)</div>
        {filterNoResults ? (
          <InlineEmpty
            kind="no-results"
            title="Không tìm thấy bản ghi nào"
            description="Hãy thử xóa bớt điều kiện lọc, hoặc kiểm tra chính tả."
            suggestions={[
              { label:'Xoá tất cả filter', onClick:()=> setFilterNoResults(false) },
              { label:'Tìm theo Vendor', onClick:()=> alert('focus vendor filter') },
            ]}
          />
        ) : (
          <div style={{ padding:8, color:'#334155' }}>Đã xoá filters — hiển thị lại danh sách.</div>
        )}
      </section>

      {/* 3) Permission / Offline / Error (inline) */}
      <section style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:12, display:'grid', gap:12 }}>
        <div style={{ fontWeight:700 }}>Permission / Offline / Error</div>
        {noPerm ? (
          <InlineEmpty
            kind="permission"
            tone="danger"
            title="Bạn không có quyền xem mục này"
            description="Liên hệ Admin để được cấp vai trò phù hợp."
            suggestions={[{ label:'Yêu cầu quyền', onClick:()=> alert('open ticket to Admin') }]}
          />
        ) : <button onClick={()=> setNoPerm(true)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Giả lập no-permission</button>}

        {offline ? (
          <InlineEmpty
            kind="offline"
            tone="warning"
            title="Mất kết nối mạng"
            description="Kiểm tra kết nối Internet và thử lại."
            actions={[{ label:'Thử lại', onClick:()=> setOffline(false), variant:'primary' }]}
          />
        ) : <button onClick={()=> setOffline(true)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', background:'#fff' }}>Giả lập offline</button>}

        <InlineEmpty
          kind="error"
          tone="danger"
          title="Đã xảy ra lỗi"
          description="Không thể tải dữ liệu do máy chủ bận. Vui lòng thử lại sau."
          actions={[{ label:'Thử lại', onClick:()=> alert('retry load'), variant:'primary' }]}
          tips={['Nếu lỗi tiếp diễn, liên hệ IT và gửi mã lỗi: SRV‑503']}
        />
      </section>
    </div>
  );
};
