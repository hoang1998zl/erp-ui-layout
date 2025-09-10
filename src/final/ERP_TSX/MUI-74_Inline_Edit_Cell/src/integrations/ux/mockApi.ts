
// src/integrations/ux/mockApi.ts — optimistic update simulator
export async function saveCell(rowId: string|number, field: string, value: any): Promise<void>{
  await new Promise(res => setTimeout(res, 300 + Math.floor(Math.random()*300)));
  // random failure to showcase error path
  const fail = Math.random() < 0.12;
  if (fail){
    const reasons = ['Validation failed at server','Conflicted — row changed by another user','Network timeout'];
    const msg = reasons[Math.floor(Math.random()*reasons.length)];
    throw new Error(msg);
  }
}
