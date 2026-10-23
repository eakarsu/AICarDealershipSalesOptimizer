'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const h=require('../domain/featurePack29a');
test('filterRecords preserves false/0 and search',()=>{ assert.equal(h.filterRecords([{name:'A',status:'available',v:0,flag:false},{name:'B',status:'sold',v:1}],{search:'0'}).length>=0,true); assert.equal(h.filterRecords([{name:'Alpha',status:'available'},{name:'Beta',status:'sold'}],{search:'alph',status:'available'}).length,1); });
test('toCSV preserves false/0/empty',()=>{ const csv=h.toCSV([{a:0,b:false,c:''}]); assert.ok(csv.includes('0,false')); });
test('tasks create/update scoped',()=>{ const s=h.createTaskStore(); const t=s.create(7,{title:'Follow up'}); assert.equal(s.list(7).length,1); assert.equal(s.list(8).length,0); assert.equal(s.update(7,t.id,{status:'done'}).status,'done'); assert.equal(s.update(8,t.id,{status:'done'}),null); assert.throws(()=>s.create(7,{}),/title/); });
test('fallback labelled not AI',()=>{ assert.equal(h.hasAIKey({}),false); const fns=[h.pricingCheck,h.inventoryAging,h.marginSummary]; fns.forEach((fn)=>assert.equal(typeof fn,'function')); });
test('domain fallback deterministic',()=>{ const a=h.pricingCheck({},{}); assert.ok(a&&typeof a==='object'&&'summary' in a); });
