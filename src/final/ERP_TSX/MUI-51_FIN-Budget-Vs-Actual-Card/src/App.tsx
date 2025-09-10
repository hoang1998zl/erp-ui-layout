
// src/App.tsx — Runner for FIN-07 Budget_Vs_Actual_Card
import React from 'react';
import { BudgetVsActualCard } from './components/fin/BudgetVsActualCard';

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <BudgetVsActualCard locale="vi" />
    </div>
  );
}
