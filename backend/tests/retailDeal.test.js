const assert=require('assert');const test=require('node:test');const d=require('../domain/retailDeal');
test('calculates deterministic zero-rate payment',()=>assert.equal(d.monthlyPayment(24000,0,48),500));
test('rejects malformed VIN',()=>assert.throws(()=>d.normalizeDeal({customerId:'1',vehicleId:'2',vin:'bad',leadSource:'web'}),/VIN/));
test('requires manager approval for large discounts',()=>assert.throws(()=>d.validateTransition('vehicle_reserved','desking',{role:'sales'},{sellingPrice:9000,advertisedPrice:10000}),/Manager approval/));
test('requires recorded credit consent',()=>assert.throws(()=>d.validateTransition('desking','credit_consented',{role:'finance'},{}),/consent/));
