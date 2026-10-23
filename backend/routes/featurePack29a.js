
'use strict';
const express=require('express');
const {authenticateToken}=require('../middleware/auth');
const pool=require('../config/database'); async function fetchRecords(){ const r=await pool.query('SELECT * FROM inventory ORDER BY created_at DESC LIMIT 500'); return r.rows; }

const helpers=require('../domain/featurePack29a');
const router=express.Router();
const store=helpers.createTaskStore();
const ownerId=(req)=> (req.user&&(req.user.id||req.user.email))||'user';
router.use(authenticateToken);
async function callProvider(prompt){
  const isOpenRouter=Boolean(process.env.OPENROUTER_API_KEY);
  const key=isOpenRouter?process.env.OPENROUTER_API_KEY:process.env.OPENAI_API_KEY;
  const url=isOpenRouter?'https://openrouter.ai/api/v1/chat/completions':'https://api.openai.com/v1/chat/completions';
  const model=process.env.OPENROUTER_MODEL||process.env.OPENAI_MODEL||(isOpenRouter?'anthropic/claude-3-5-sonnet-20241022':'gpt-4o-mini');
  const res=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:'Return valid JSON only.'},{role:'user',content:prompt}],max_tokens:1200})});
  if(!res.ok) throw new Error(`Provider error ${res.status}`);
  const data=await res.json(); const text=data.choices?.[0]?.message?.content||'';
  try{ return JSON.parse(text); }catch{ return {summary:text}; }
}
async function aiRespond(res, feature, fallback, prompt){
  if(!helpers.hasAIKey()) return res.json({aiGenerated:false, provider:'deterministic-fallback', label:'Deterministic fallback — no AI provider configured', feature, result:fallback});
  try{ const result=await callProvider(prompt); return res.json({aiGenerated:true, provider:process.env.OPENROUTER_API_KEY?'openrouter':'openai', feature, result}); }
  catch(e){ return res.json({aiGenerated:false, provider:'deterministic-fallback', label:'Deterministic fallback — provider unavailable', providerError:e.message, feature, result:fallback}); }
}
router.get('/tasks',(req,res)=>res.json({data:store.list(ownerId(req))}));
router.post('/tasks',(req,res)=>{ try{ res.status(201).json(store.create(ownerId(req),req.body||{})); }catch(e){ res.status(400).json({error:e.message}); }});
router.put('/tasks/:id',(req,res)=>{ try{ const t=store.update(ownerId(req),req.params.id,req.body||{}); if(!t) return res.status(404).json({error:'Task not found'}); res.json(t); }catch(e){ res.status(400).json({error:e.message}); }});
router.get('/records/search',async(req,res)=>{ try{ const all=await fetchRecords(); const data=helpers.filterRecords(all,{search:req.query.search||req.query.q||'',status:req.query.status||'',type:req.query.type||''}); res.json({data,total:data.length}); }catch(e){ res.status(500).json({error:e.message}); }});
router.get('/records/export',async(req,res)=>{ try{ const all=await fetchRecords(); const data=helpers.filterRecords(all,{search:req.query.search||req.query.q||'',status:req.query.status||'',type:req.query.type||''}); const fmt=String(req.query.format||'json').toLowerCase(); if(fmt==='csv'){ res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="records.csv"'); return res.send(helpers.toCSV(data)); } res.setHeader('Content-Disposition','attachment; filename="records.json"'); return res.json({data}); }catch(e){ res.status(500).json({error:e.message}); }});

router.post('/ai/pricing-check', async (req,res)=>{ try{ const record=(req.body&&req.body.record)||{}; const records=Array.isArray(req.body&&req.body.records)?req.body.records:(record&&Object.keys(record).length?[record]:[]); const fallback=helpers.pricingCheck(record); await aiRespond(res,'pricing-check',fallback,`pricingCheck for record: ${JSON.stringify(record)}. Return JSON.`); }catch(e){ res.status(500).json({error:e.message}); } });

router.post('/ai/inventory-aging', async (req,res)=>{ try{ const record=(req.body&&req.body.record)||{}; const records=Array.isArray(req.body&&req.body.records)?req.body.records:(record&&Object.keys(record).length?[record]:[]); const fallback=helpers.inventoryAging(records); await aiRespond(res,'inventory-aging',fallback,`inventoryAging for records: ${JSON.stringify(records)}. Return JSON.`); }catch(e){ res.status(500).json({error:e.message}); } });

router.post('/ai/margin-summary', async (req,res)=>{ try{ const record=(req.body&&req.body.record)||{}; const records=Array.isArray(req.body&&req.body.records)?req.body.records:(record&&Object.keys(record).length?[record]:[]); const fallback=helpers.marginSummary(records); await aiRespond(res,'margin-summary',fallback,`marginSummary for records: ${JSON.stringify(records)}. Return JSON.`); }catch(e){ res.status(500).json({error:e.message}); } });

module.exports=router;
