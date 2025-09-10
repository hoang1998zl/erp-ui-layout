
// src/App.tsx — Runner for FIN-08 Expense_Form
import React from 'react';
import { ExpenseForm } from './components/fin/ExpenseForm';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', padding:12 }}>
      <ExpenseForm locale="vi" />
    </div>
  );
}
