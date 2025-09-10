// src/mock/essProfile.ts
export type UUID = string;

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship?: string;
};

export type Profile = {
  id: UUID;
  avatar_data_url?: string | null;
  full_name: string;
  employee_code?: string;
  email: string;
  phone?: string;
  dob?: string | null;           // ISO date
  gender?: 'male'|'female'|'other'|null;
  address_line?: string;
  district?: string;
  province?: string;
  country?: string;
  emergency?: EmergencyContact;
  updated_at: string;
  created_at: string;
};

const LS_KEY = 'erp.ess.profile.v1';

function deepClone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }
function delay(ms=120){ return new Promise(res=>setTimeout(res,ms)); }
function nowISO(){ return new Date().toISOString(); }

const DEFAULT: Profile = {
  id: 'me',
  avatar_data_url: null,
  full_name: 'Nguyễn Văn A',
  employee_code: 'EMP-001',
  email: 'emp1@company.vn',
  phone: '0901234567',
  dob: '1995-05-20',
  gender: 'male',
  address_line: '123 Lê Lợi',
  district: 'Quận 1',
  province: 'Hồ Chí Minh',
  country: 'Vietnam',
  emergency: { name:'Trần Thị B', phone:'0907654321', relationship:'Vợ/Chồng' },
  created_at: nowISO(),
  updated_at: nowISO(),
};

export async function getMyProfile(): Promise<Profile> {
  await delay();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return deepClone(DEFAULT);
}

export async function saveMyProfile(patch: Partial<Profile>): Promise<Profile> {
  await delay();
  const cur = await getMyProfile();
  const next = { ...cur, ...patch, id: cur.id, email: cur.email, updated_at: nowISO() };
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  return next;
}

export async function setAvatar(file: File): Promise<string> {
  await delay();
  const buf = await file.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const mime = file.type || 'image/png';
  const dataUrl = `data:${mime};base64,${b64}`;
  await saveMyProfile({ avatar_data_url: dataUrl });
  return dataUrl;
}

export async function clearAvatar(): Promise<void> {
  await delay();
  await saveMyProfile({ avatar_data_url: null });
}

export async function exportJSON(): Promise<string> {
  await delay();
  const cur = await getMyProfile();
  return JSON.stringify(cur, null, 2);
}

export async function importJSON(file: File): Promise<Profile> {
  await delay();
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.full_name || !data.email) throw new Error('Invalid profile JSON');
  // never overwrite id or created_at
  const cur = await getMyProfile();
  const next: Profile = { ...cur, ...data, id: cur.id, created_at: cur.created_at, updated_at: nowISO() };
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  return next;
}
