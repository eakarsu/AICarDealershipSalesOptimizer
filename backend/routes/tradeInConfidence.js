const express = require('express');

const router = express.Router();

function n(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

router.post('/score', (req, res) => {
  const {
    vehicle = { year: 2020, make: 'Honda', model: 'CR-V', mileage: 61500 },
    condition = 'clean title, minor bumper repaint, tires at 5/32',
    payoff = 14500,
    offer = 21750,
    marketRange = { low: 20500, high: 23800 },
  } = req.body || {};

  const mileage = n(vehicle.mileage, 60000);
  const age = Math.max(1, new Date().getFullYear() - n(vehicle.year, 2020));
  const low = n(marketRange.low, 20000);
  const high = n(marketRange.high, 24000);
  const midpoint = (low + high) / 2;
  const offerValue = n(offer, midpoint);
  const equity = offerValue - n(payoff, 0);
  const reconditioningRisk = /frame|airbag|salvage|check engine/i.test(condition)
    ? 'high'
    : /paint|tires|dent|scratch/i.test(condition)
      ? 'medium'
      : 'low';
  const confidence = Math.max(42, Math.min(96, 88 - age * 2 - Math.max(0, mileage - 45000) / 7000 - Math.abs(offerValue - midpoint) / 900));

  res.json({
    vehicleLabel: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
    confidence: Math.round(confidence),
    equity,
    reconditioningRisk,
    deskRange: {
      floor: Math.round(low * 0.96),
      target: Math.round(midpoint),
      stretch: Math.round(high * 1.02),
    },
    talkingPoints: [
      equity >= 0 ? `Customer has about $${Math.round(equity).toLocaleString()} positive equity.` : `Customer is about $${Math.abs(Math.round(equity)).toLocaleString()} upside down.`,
      reconditioningRisk === 'high' ? 'Require manager inspection before final number.' : 'Use inspection photos to defend the desk range.',
      offerValue > midpoint ? 'Offer is above midpoint; reserve margin with F&I attachment.' : 'Offer leaves room for a fast close.',
    ],
  });
});

module.exports = router;
