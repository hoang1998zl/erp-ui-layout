// src/mock/orgSettings.ts
export type UUID = string;

export type Company = {
  name: string;
  tax_code?: string;
  address?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_data_url?: string | null;
};

export type Localization = {
  locale: 'vi'|'en';
  timeZone: string; // e.g., 'Asia/Ho_Chi_Minh'
  currency: 'VND'|'USD'|'EUR';
};

export type Finance = {
  base_currency: 'VND'|'USD'|'EUR';
  vat_rates: number[]; // e.g., [0, 8, 10]
  fiscal_year_start_month: number; // 1..12
  rounding: 'none'|'round'|'ceil'|'floor';
};

export type Approvals = {
  expense: {
    enabled: boolean;
    levels: number; // 1..3
    thresholds: Array<{ level: number; amount: number }>; // sorted by level
    auto_escalation: boolean;
  };
  purchase: {
    enabled: boolean;
    min_quotes?: number; // e.g., 2
  };
};

export type Security = {
  password_min_length: number;
  password_require_mixed: boolean;
  mfa_required: boolean;
  session_timeout_minutes: number;
  allow_sso: boolean;
  sso_providers: string[]; // ['Microsoft', 'Google', 'Okta']
};

export type Integrations = {
  webhook_url?: string;
  sharepoint_site?: string;
  sso_tenant_id?: string;
};

export type DataPolicy = {
  audit_retention_days: number;      // for audit logs
  document_retention_days: number;   // for temp documents
  backup_window?: string;            // e.g., '02:00-03:00'
};

export type OrgSettings = {
  company: Company;
  localization: Localization;
  finance: Finance;
  approvals: Approvals;
  security: Security;
  integrations: Integrations;
  data_policy: DataPolicy;
};

const DEFAULTS: OrgSettings = {
  company: {
    name: 'Your Company Co., Ltd.',
    tax_code: '',
    address: '',
    country: 'Vietnam',
    phone: '',
    email: '',
    website: '',
    logo_data_url: null,
  },
  localization: {
    locale: 'vi',
    timeZone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
  },
  finance: {
    base_currency: 'VND',
    vat_rates: [0, 8, 10],
    fiscal_year_start_month: 1,
    rounding: 'round',
  },
  approvals: {
    expense: {
      enabled: true,
      levels: 2,
      thresholds: [{ level:1, amount: 5000000 }, { level:2, amount: 20000000 }],
      auto_escalation: true,
    },
    purchase: {
      enabled: true,
      min_quotes: 2,
    },
  },
  security: {
    password_min_length: 8,
    password_require_mixed: true,
    mfa_required: false,
    session_timeout_minutes: 30,
    allow_sso: false,
    sso_providers: [],
  },
  integrations: {
    webhook_url: '',
    sharepoint_site: '',
    sso_tenant_id: '',
  },
  data_policy: {
    audit_retention_days: 365,
    document_retention_days: 180,
    backup_window: '02:00-03:00',
  },
};

const LS_KEY = 'erp.org.settings.v1';

function deepClone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }
function delay(ms=150){ return new Promise(res=>setTimeout(res,ms)); }

export async function getSettings(): Promise<OrgSettings> {
  await delay();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return deepClone(DEFAULTS);
}

export async function saveSettings(payload: OrgSettings): Promise<void> {
  await delay();
  localStorage.setItem(LS_KEY, JSON.stringify(payload));
}

export async function resetSettings(): Promise<OrgSettings> {
  await delay();
  localStorage.removeItem(LS_KEY);
  return deepClone(DEFAULTS);
}

export async function exportJSON(): Promise<string> {
  await delay();
  const cur = await getSettings();
  return JSON.stringify(cur, null, 2);
}

export async function importJSON(file: File): Promise<void> {
  await delay();
  const text = await file.text();
  const data = JSON.parse(text);
  // naive validation
  if (!data.company || !data.localization || !data.finance) throw new Error('Invalid settings JSON');
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
