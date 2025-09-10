// src/mock/users.ts — minimal employee profile (EIM‑04 dependency placeholder)
export type UUID = string;
export type Employee = {
  id: UUID;
  code: string;
  name: string;
  dept_code?: string;
  default_project?: string;
};
const LS = "erp.eim.users.v1";
function rid(): UUID {
  return Math.random().toString(36).slice(2);
}
export function seedUsersIfEmpty(): void {
  if (localStorage.getItem(LS)) return;
  const arr: Employee[] = [
    {
      id: rid(),
      code: "E0001",
      name: "Nguyen Van A",
      dept_code: "IT",
      default_project: "PRJ-001",
    },
    { id: rid(), code: "E0002", name: "Tran Thi B", dept_code: "HR" },
    { id: rid(), code: "E0003", name: "Le Van C", dept_code: "FINANCE", default_project: "PRJ-002" },
    { id: rid(), code: "E0004", name: "Pham Thi D", dept_code: "SALES", default_project: "PRJ-003" },
    { id: rid(), code: "E0005", name: "Hoang Van E", dept_code: "IT", default_project: "PRJ-001" },
    { id: rid(), code: "M0001", name: "Vu Thi Manager", dept_code: "FINANCE" },
    { id: rid(), code: "D0001", name: "Dao Van Director", dept_code: "EXECUTIVE" },
  ];
  localStorage.setItem(LS, JSON.stringify(arr));
}
export function currentUser(): Employee {
  try {
    const arr: Employee[] = JSON.parse(localStorage.getItem(LS) || "[]");
    return arr[0] || { id: rid(), code: "E0000", name: "Demo User" };
  } catch {
    return { id: rid(), code: "E0000", name: "Demo User" };
  }
}
export function listEmployees(): Employee[] {
  try {
    const arr: Employee[] = JSON.parse(localStorage.getItem(LS) || "[]");
    return arr || [];
  } catch {
    return [];
  }
}