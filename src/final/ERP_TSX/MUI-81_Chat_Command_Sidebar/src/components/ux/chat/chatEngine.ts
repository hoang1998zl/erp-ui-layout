
// src/components/ux/chat/chatEngine.ts — mock chat engine + command handlers
export type Role = 'Admin'|'Finance'|'PM'|'HR'|'Employee';

export type ChatMsg = {
  id: string;
  from: 'user'|'assistant'|'system';
  text: string;
  at: number;
};

export type Command = {
  id: string;
  title: string;
  sample?: string;
  run: (input: string, ctx: { role: Role }) => Promise<string>;
  keywords?: string[];
};

const rid = () => Math.random().toString(36).slice(2);

const sleep = (ms:number) => new Promise(res => setTimeout(res, ms));

// Simple templates per role
const roleGreetings: Record<Role, string> = {
  Admin: "Xin chào Admin! Em có thể giúp anh quản lý quyền, audit logs và cấu hình hệ thống.",
  Finance: "Chào Finance! Em sẵn sàng hỗ trợ Expense, PO/Invoice, đối soát và báo cáo.",
  PM: "Chào PM! Em có thể hỗ trợ tasks, sprint, burn-down và risk register.",
  HR: "Chào HR! Em có thể hỗ trợ onboarding, chấm công, và báo cáo nhân sự.",
  Employee: "Xin chào! Em có thể hướng dẫn anh tạo yêu cầu, xin nghỉ, hoặc báo cáo đơn giản."
};

// Command handlers (mock)
export const commands: Command[] = [
  {
    id:'help',
    title:'Help',
    sample:'/help',
    keywords:['help','assist'],
    run: async () => {
      return [
        "Các lệnh phổ biến:",
        "• /expense policy — Tóm tắt chính sách Expense",
        "• /po new — Tạo PO nhanh (mẫu form)",
        "• /task status <PRJ> — Tình trạng dự án",
        "• /approve <entity> — Gợi ý các bước phê duyệt",
        "• /kb <keyword> — Tìm trong knowledge base",
      ].join('\n');
    }
  },
  {
    id:'expense.policy',
    title:'Expense policy',
    sample:'/expense policy',
    keywords:['expense','policy','quy trinh chi phi'],
    run: async () => {
      return [
        "Chính sách Expense (rút gọn):",
        "• Hạn mức mặc định: 2,000,000 VND / ngày cho Meal; 10,000,000 VND / trip cho Travel.",
        "• Phải đính kèm hoá đơn VAT nếu > 200,000 VND.",
        "• Thời hạn nộp: trong vòng 07 ngày kể từ khi phát sinh.",
        "• Quy trình duyệt: Line manager → Finance.",
        "Lệnh nhanh: gõ `/expense new` để mở form tạo Expense (mock)."
      ].join('\n');
    }
  },
  {
    id:'expense.new',
    title:'Create expense (mock form)',
    sample:'/expense new',
    keywords:['expense','new'],
    run: async () => {
      return "📄 Mở form tạo Expense giả lập: Date, Category, Amount, Vendor. (Kết nối FIN‑08 ở bản thật)";
    }
  },
  {
    id:'po.new',
    title:'Create PO (mock form)',
    sample:'/po new',
    keywords:['po','purchase order','new'],
    run: async () => "📄 Mở form tạo PO giả lập: Vendor, Lines, Delivery date. (Kết nối PRC‑05 ở bản thật)"
  },
  {
    id:'task.status',
    title:'Project status',
    sample:'/task status PRJ-A',
    keywords:['task','status','project'],
    run: async (input) => {
      const prj = (input.split(' ').pop() || 'PRJ-A').toUpperCase();
      await sleep(350);
      return [
        `Tình trạng ${prj} (mock):`,
        "• Tasks: 42 (Done 28, Doing 10, To Do 4)",
        "• Sprint burndown: 72%",
        "• Risks: 1 (High), 3 (Medium)",
        "• Blockers: Chờ vendor giao hàng.",
      ].join('\n');
    }
  },
  {
    id:'approve',
    title:'Approval guidance',
    sample:'/approve EX-1023',
    keywords:['approve','flow','duyet'],
    run: async (input) => {
      const id = input.split(' ').pop() || 'EX-0000';
      return [
        `Hướng dẫn phê duyệt cho ${id} (mock):`,
        "1) Kiểm tra hồ sơ & hoá đơn đính kèm.",
        "2) Đối chiếu ngân sách/Cost center.",
        "3) Nếu hợp lệ → Approve; nếu thiếu → Request changes.",
        "Gợi ý lệnh: `/open "+id+"` để mở bản ghi (mock)."
      ].join('\n');
    }
  },
  {
    id:'kb.search',
    title:'Search knowledge base',
    sample:'/kb OCR invoice',
    keywords:['kb','knowledge','search','docs'],
    run: async (input) => {
      const q = input.replace(/^\/kb\s*/i,'').trim()||'OCR invoice';
      return [
        `Kết quả KB cho “${q}” (mock):`,
        "• Hướng dẫn OCR hoá đơn – v1.3",
        "• Quy định lưu trữ tài liệu 2024",
        "• Mẫu PO chuẩn (xlsx)",
        "Gõ `/open DOC-1029` để xem tài liệu (mock)."
      ].join('\n');
    }
  }
];

export async function answer(input: string, role: Role): Promise<ChatMsg[]>{
  const id = rid();
  // slash command detection
  const slash = input.trim().startsWith('/');
  if (slash){
    const found = commands.find(c => input.toLowerCase().startsWith('/'+c.id.replace('.',' ')) || (c.sample && input.toLowerCase().startsWith(c.sample.toLowerCase())) || (c.id==='help' && input.trim()==='/help'));
    if (found){
      const out = await found.run(input, { role });
      return [{ id, from:'assistant', text: out, at: Date.now() }];
    }
    // fallback
    return [{ id, from:'assistant', text: "Không nhận diện được lệnh. Gõ `/help` để xem danh sách lệnh.", at: Date.now() }];
  }

  // small‑talk / intent guess (mock)
  const greet = roleGreetings[role];
  if (/^(hi|hello|chao|xin chao)/i.test(input)) {
    return [{ id, from:'assistant', text: greet, at: Date.now() }];
  }
  // heuristic intents
  if (/expense/i.test(input)) {
    return [{ id, from:'assistant', text: "Anh muốn xem chính sách Expense hay tạo Expense mới? Gõ `/expense policy` hoặc `/expense new`.", at: Date.now() }];
  }
  if (/po|purchase/i.test(input)) {
    return [{ id, from:'assistant', text: "Để tạo PO nhanh, gõ `/po new`. Cần duyệt luồng? Gõ `/approve PO-xxxx`.", at: Date.now() }];
  }
  return [{ id, from:'assistant', text: "Em chưa hiểu ý anh. Gõ `/help` hoặc mô tả chi tiết hơn.", at: Date.now() }];
}
