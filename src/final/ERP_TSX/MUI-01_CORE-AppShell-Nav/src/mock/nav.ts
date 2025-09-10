// src/mock/nav.ts
export type NavItem = { key: string; label: string; icon?: string; children?: NavItem[]; route?: string };
export const navItems: NavItem[] = [
  { key:'dashboard', label:'Dashboard', icon:'📊', route:'/dashboard' },
  { key:'projects',  label:'Projects',  icon:'📁', route:'/projects' },
  { key:'finance',   label:'Finance',   icon:'💳', children: [
      { key:'expenses', label:'Expenses', route:'/finance/expenses' },
      { key:'budget',   label:'Budget',   route:'/finance/budget' },
    ]},
  { key:'hr',        label:'HR',        icon:'👥', children: [
      { key:'profile',  label:'Profile',  route:'/hr/profile' },
      { key:'timesheet',label:'Timesheet',route:'/hr/timesheet' },
    ]},
  { key:'docs',      label:'Documents', icon:'📄', route:'/docs' },
  { key:'approvals', label:'Approvals', icon:'✅', route:'/approvals' },
  { key:'admin',     label:'Admin',     icon:'⚙️', children: [
      { key:'users',    label:'Users',    route:'/admin/users' },
      { key:'rbac',     label:'RBAC Matrix', route:'/admin/rbac' },
      { key:'settings', label:'Org Settings', route:'/admin/settings' },
    ]},
];
