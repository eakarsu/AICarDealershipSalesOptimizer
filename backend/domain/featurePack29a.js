
'use strict';
// Feature pack 29A pure helpers — no DB/provider side effects.
function hasAIKey(env=process.env){ return Boolean(env.OPENROUTER_API_KEY||env.OPENAI_API_KEY); }
function filterRecords(records, opts={}){
  const list=Array.isArray(records)?records:[];
  const q=String(opts.search||opts.q||'').trim().toLowerCase();
  return list.filter((r)=>{
    if(!r||typeof r!=='object') return false;
    if(opts.status!==undefined&&opts.status!==''&&String(r.status??'')!==String(opts.status)) return false;
    if(opts.type!==undefined&&opts.type!==''&&String(r.projectType??r.type??r.plot_type??r.body_type??'')!==String(opts.type)) return false;
    if(!q) return true;
    return Object.values(r).some((v)=> v===false||v===0 ? String(v)===q : String(v??'').toLowerCase().includes(q));
  });
}
function toCSV(records){
  const list=Array.isArray(records)?records:[]; if(!list.length) return '';
  const keys=[...new Set(list.flatMap((r)=>Object.keys(r||{})))];
  const esc=(v)=>{ if(v===null||v===undefined) return ''; const s=typeof v==='object'?JSON.stringify(v):String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  return [keys.join(','), ...list.map((r)=>keys.map((k)=>esc(r[k])).join(','))].join('\n');
}
function createTaskStore(){
  const tasks=new Map(); let seq=1;
  return {
    list(ownerId){ return [...tasks.values()].filter((t)=>String(t.ownerId)===String(ownerId)); },
    create(ownerId, body={}){
      const title=String(body.title||'').trim(); if(!title) throw new Error('title is required');
      const status=['todo','in_progress','done'].includes(body.status)?body.status:'todo';
      const task={id:seq++, ownerId, title, notes:body.notes??'', status, dueDate:body.dueDate??null, createdAt:new Date().toISOString()};
      tasks.set(task.id,task); return task;
    },
    update(ownerId,id,patch={}){
      const t=tasks.get(Number(id)); if(!t||String(t.ownerId)!==String(ownerId)) return null;
      if(patch.title!==undefined){ if(!String(patch.title).trim()) throw new Error('title is required'); t.title=String(patch.title).trim(); }
      if(patch.status!==undefined){ if(!['todo','in_progress','done'].includes(patch.status)) throw new Error('invalid status'); t.status=patch.status; }
      if(patch.notes!==undefined) t.notes=patch.notes; if(patch.dueDate!==undefined) t.dueDate=patch.dueDate;
      return t;
    },
    _clear(){ tasks.clear(); seq=1; }
  };
}
const num=(v)=>{ const n=Number(v); return Number.isFinite(n)?n:0; };

function pricingCheck(record={}){
  const list=num(record.listing_price??record.listingPrice); const purch=num(record.purchase_price??record.purchasePrice); const margin=list-purch;
  return {listingPrice:list, purchasePrice:purch, grossMargin:margin, marginPercent:purch?Math.round((margin/purch)*1000)/10:0, isFree:list===0, daysOnLot:num(record.days_on_lot??record.daysOnLot), recommendation: margin<0?'Below cost — reprice':num(record.days_on_lot)>90?'Aged unit — consider price action':'Margin within recorded range', summary:`Margin ${margin} on ${record.make||''} ${record.model||''}`.trim()};
}
function inventoryAging(records=[]){
  const list=Array.isArray(records)?records:[]; const aged=list.filter((r)=>num(r.days_on_lot??r.daysOnLot)>90);
  return {recordCount:list.length, agedCount:aged.length, freshCount:list.length-aged.length, emptyInventory:list.length===0, averageDaysOnLot:list.length?Math.round(list.reduce((s,r)=>s+num(r.days_on_lot??r.daysOnLot),0)/list.length):0, summary:`${aged.length} of ${list.length} vehicles over 90 days on lot`};
}
function marginSummary(records=[]){
  const list=Array.isArray(records)?records:[]; const total=list.reduce((s,r)=>s+(num(r.listing_price??r.listingPrice)-num(r.purchase_price??r.purchasePrice)),0);
  return {recordCount:list.length, totalGrossMargin:total, averageMargin:list.length?Math.round(total/list.length):0, hasZeroMargin:list.some((r)=>(num(r.listing_price)-num(r.purchase_price))===0), summary:`Total recorded gross margin ${total} across ${list.length} vehicles`};
}

module.exports={hasAIKey,filterRecords,toCSV,createTaskStore,pricingCheck,inventoryAging,marginSummary};
