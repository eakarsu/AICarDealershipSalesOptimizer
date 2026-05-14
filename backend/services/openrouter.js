const https = require('https');
require('dotenv').config({ path: '../.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'anthropic/claude-3-5-sonnet-20241022';
const DEALERSHIP_SYSTEM_PROMPT = 'You are an expert automotive deal analyst and dealership operations specialist. Provide data-driven insights for sales optimization and customer management.';

async function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AutoGenius AI Dealership',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          return resolve({ error: 'AI response parsing failed', raw: body });
        }
        if (parsed.error) {
          reject(new Error(parsed.error.message || 'OpenRouter API error'));
        } else {
          const content = parsed.choices?.[0]?.message?.content || 'No response generated';
          resolve(content);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 3-strategy parser: direct parse → first balanced object → fenced ```json block
function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error, raw: response.raw };
  }
  if (response === null || response === undefined) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();

  // Strategy 1: direct parse
  try { return JSON.parse(text); } catch (_) { /* fall through */ }

  // Strategy 2: first balanced JSON object
  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      let inStr = false;
      let escape = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            return JSON.parse(text.slice(start, i + 1));
          }
        }
      }
    }
  } catch (_) { /* fall through */ }

  // Strategy 3: fenced ```json ... ``` block
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) {
      return JSON.parse(fenced[1].trim());
    }
  } catch (_) { /* fall through */ }

  return { ...fallback, summary: text };
}

// AI Feature: Inventory Pricing Analysis
async function analyzeInventoryPricing(vehicle) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze the vehicle and provide a comprehensive pricing recommendation. Return your analysis in this exact JSON format:
{
  "recommended_price": number,
  "price_range": { "low": number, "high": number },
  "market_position": "below_market" | "at_market" | "above_market",
  "confidence_score": number (0-100),
  "factors": [{ "factor": string, "impact": "positive" | "negative" | "neutral", "detail": string }],
  "competitor_comparison": string,
  "days_to_sell_estimate": number,
  "pricing_strategy": string,
  "summary": string
}`;

  const userPrompt = `Analyze pricing for: ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}
- Mileage: ${vehicle.mileage?.toLocaleString()} miles
- Color: ${vehicle.color}
- Condition: ${vehicle.condition || 'Good'}
- Current listing price: $${vehicle.listing_price?.toLocaleString()}
- Purchase price: $${vehicle.purchase_price?.toLocaleString()}
- Days on lot: ${vehicle.days_on_lot || 0}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response, recommended_price: vehicle.listing_price });
}

// AI Feature: Customer-Vehicle Matching
async function matchCustomerToVehicles(customer, vehicles) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Match customers with their perfect vehicle. Analyze the customer profile and available inventory. Return your analysis in this exact JSON format:
{
  "top_matches": [{ "vehicle_id": number, "vehicle_name": string, "match_score": number (0-100), "reasons": [string], "selling_points": [string], "potential_objections": [string] }],
  "customer_insights": { "buyer_type": string, "key_motivators": [string], "budget_flexibility": string },
  "approach_strategy": string,
  "summary": string
}`;

  const vehicleList = vehicles.map(v =>
    `ID:${v.id} - ${v.year} ${v.make} ${v.model} ${v.trim || ''}, $${v.listing_price?.toLocaleString()}, ${v.mileage?.toLocaleString()} mi, ${v.color}`
  ).join('\n');

  const userPrompt = `Customer Profile:
- Name: ${customer.first_name} ${customer.last_name}
- Budget: $${customer.budget_min?.toLocaleString()} - $${customer.budget_max?.toLocaleString()}
- Preferred Make: ${customer.preferred_make || 'Any'}
- Preferred Type: ${customer.preferred_type || 'Any'}
- Credit Score Range: ${customer.credit_score_range || 'Unknown'}
- Financing Needed: ${customer.financing_needed ? 'Yes' : 'No'}

Available Inventory:
${vehicleList}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response, top_matches: [] });
}

// AI Feature: Trade-In Valuation
async function valuateTradeIn(tradeIn) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Provide a detailed trade-in valuation. Return your analysis in this exact JSON format:
{
  "estimated_value": number,
  "value_range": { "low": number, "high": number },
  "condition_grade": "Excellent" | "Good" | "Fair" | "Poor",
  "condition_factors": [{ "area": string, "rating": string, "notes": string }],
  "market_demand": "High" | "Medium" | "Low",
  "wholesale_value": number,
  "retail_value": number,
  "depreciation_factors": [string],
  "reconditioning_estimate": number,
  "profit_potential": number,
  "summary": string
}`;

  const userPrompt = `Valuate this trade-in:
- Vehicle: ${tradeIn.year} ${tradeIn.make} ${tradeIn.model}
- Mileage: ${tradeIn.mileage?.toLocaleString()} miles
- Condition: ${tradeIn.condition}
- Notes: ${tradeIn.notes || 'None'}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response, estimated_value: 0 });
}

// AI Feature: F&I Product Recommendations
async function recommendFniProducts(customer, deal, products) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Recommend the best F&I products for this customer and deal. Return your analysis in this exact JSON format:
{
  "recommended_products": [{ "product_id": number, "product_name": string, "priority": "High" | "Medium" | "Low", "estimated_profit": number, "customer_benefit": string, "pitch_strategy": string }],
  "total_potential_revenue": number,
  "customer_risk_profile": string,
  "financing_recommendations": { "suggested_term": number, "suggested_rate_range": string, "down_payment_suggestion": number },
  "compliance_notes": [string],
  "summary": string
}`;

  const productList = products.map(p =>
    `ID:${p.id} - ${p.name} ($${p.base_price}), Category: ${p.category}, Coverage: ${p.coverage_term}`
  ).join('\n');

  const userPrompt = `Customer: ${customer.first_name} ${customer.last_name}
- Credit Score Range: ${customer.credit_score_range || 'Unknown'}
- Budget: $${customer.budget_min?.toLocaleString()} - $${customer.budget_max?.toLocaleString()}

Deal Details:
- Vehicle Price: $${deal.sale_price?.toLocaleString()}
- Trade-In Value: $${deal.trade_in_value?.toLocaleString() || '0'}

Available F&I Products:
${productList}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response, recommended_products: [] });
}

// AI Feature: Lead Scoring
async function scoreLead(lead) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Score this lead and provide actionable insights. Return your analysis in this exact JSON format:
{
  "score": number (0-100),
  "grade": "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F",
  "buy_probability": number (0-100),
  "urgency": "Hot" | "Warm" | "Cold",
  "scoring_factors": [{ "factor": string, "score": number, "weight": number, "reasoning": string }],
  "recommended_actions": [{ "action": string, "priority": "Immediate" | "Today" | "This Week" | "Follow Up", "channel": string }],
  "best_contact_time": string,
  "estimated_timeline": string,
  "objection_predictions": [string],
  "summary": string
}`;

  const userPrompt = `Score this lead:
- Name: ${lead.customer_name}
- Source: ${lead.source}
- Interest: ${lead.interest_type}
- Vehicle Interest: ${lead.vehicle_interest || 'Not specified'}
- Last Contact: ${lead.last_contact || 'Never'}
- Status: ${lead.status}
- Notes: ${lead.notes || 'None'}
- Email: ${lead.email}
- Phone: ${lead.phone}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response, score: 50, grade: 'C' });
}

// AI Feature: Deal Analysis
async function analyzeDeal(deal, vehicle, customer) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze this deal for profitability and optimization. Return your analysis in this exact JSON format:
{
  "deal_rating": "Excellent" | "Good" | "Fair" | "Poor",
  "profit_analysis": { "gross_profit": number, "margin_percentage": number, "vs_average": string },
  "optimization_suggestions": [{ "suggestion": string, "potential_impact": number, "difficulty": "Easy" | "Medium" | "Hard" }],
  "risk_factors": [{ "risk": string, "severity": "High" | "Medium" | "Low", "mitigation": string }],
  "negotiation_insights": { "customer_leverage": string, "dealer_leverage": string, "sweet_spot_price": number },
  "summary": string
}`;

  const userPrompt = `Analyze this deal:
- Vehicle: ${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''}
- Sale Price: $${deal.sale_price?.toLocaleString()}
- Purchase Cost: $${vehicle?.purchase_price?.toLocaleString() || 'Unknown'}
- Trade-In Value: $${deal.trade_in_value?.toLocaleString() || '0'}
- F&I Total: $${deal.fni_total?.toLocaleString() || '0'}
- Customer: ${customer?.first_name || ''} ${customer?.last_name || ''}
- Credit Score: ${customer?.credit_score_range || 'Unknown'}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response, deal_rating: 'Fair' });
}

// AI Feature: Sales Analytics Insights
async function generateAnalyticsInsights(stats) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze the dealership metrics and provide strategic insights. Return your analysis in this exact JSON format:
{
  "overall_health": "Excellent" | "Good" | "Needs Attention" | "Critical",
  "key_metrics_analysis": [{ "metric": string, "value": string, "trend": "up" | "down" | "stable", "insight": string }],
  "opportunities": [{ "opportunity": string, "potential_revenue": string, "action_required": string }],
  "risks": [{ "risk": string, "impact": string, "recommendation": string }],
  "30_day_forecast": { "projected_sales": number, "projected_revenue": string, "confidence": number },
  "action_items": [{ "item": string, "priority": "High" | "Medium" | "Low", "owner": string }],
  "summary": string
}`;

  const userPrompt = `Analyze these dealership metrics:
${JSON.stringify(stats, null, 2)}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response, overall_health: 'Good' });
}

// AI Feature: Service Needs Analysis
async function analyzeServiceNeeds(appointment) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze the service appointment and recommend additional services. Return your analysis in this exact JSON format:
{
  "recommended_services": [{ "service": string, "urgency": "Immediate" | "Soon" | "Upcoming", "estimated_cost": number, "reason": string }],
  "upsell_opportunities": [{ "service": string, "pitch": string, "estimated_profit": number }],
  "maintenance_forecast": [{ "service": string, "estimated_mileage": number, "estimated_date": string }],
  "customer_communication": string,
  "cost_savings_preventive": number,
  "summary": string
}`;

  const userPrompt = `Analyze this service appointment:
- Vehicle: ${appointment.vehicle_description}
- Service Type: ${appointment.service_type}
- Mileage: ${appointment.mileage_at_service?.toLocaleString() || 'Unknown'} miles
- Description: ${appointment.description || 'None'}
- Current Cost: $${appointment.total_cost || 0}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Vehicle Inspection Analysis
async function analyzeInspection(inspection) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze the inspection results and provide comprehensive assessment. Return your analysis in this exact JSON format:
{
  "overall_assessment": "Excellent" | "Good" | "Fair" | "Poor",
  "confidence_score": number (0-100),
  "safety_flags": [{ "area": string, "severity": "Critical" | "Moderate" | "Minor", "recommendation": string }],
  "reconditioning_plan": [{ "item": string, "estimated_cost": number, "priority": "Must Do" | "Recommended" | "Optional", "roi_estimate": string }],
  "pricing_impact": { "adjustment": number, "reasoning": string },
  "customer_disclosure": [string],
  "certification_eligible": boolean,
  "total_reconditioning_cost": number,
  "summary": string
}`;

  const userPrompt = `Analyze this vehicle inspection:
- Inspection Type: ${inspection.inspection_type}
- Engine: ${inspection.engine_rating}, Transmission: ${inspection.transmission_rating}
- Brakes: ${inspection.brakes_rating}, Suspension: ${inspection.suspension_rating}
- Tires: ${inspection.tires_rating}, Exterior: ${inspection.exterior_rating}
- Interior: ${inspection.interior_rating}, Electrical: ${inspection.electrical_rating}
- Overall Score: ${inspection.overall_score}/100
- Issues Found: ${inspection.issues_found || 'None'}
- Current Reconditioning Cost: $${inspection.reconditioning_cost || 0}
- Passed: ${inspection.passed ? 'Yes' : 'No'}
- Notes: ${inspection.notes || 'None'}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Test Drive Analysis
async function analyzeTestDrive(testDrive) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze the test drive experience and provide follow-up recommendations. Return your analysis in this exact JSON format:
{
  "purchase_probability": number (0-100),
  "interest_trend": "Increased" | "Stable" | "Decreased",
  "follow_up_strategy": { "timing": string, "channel": string, "message_tone": string, "key_points": [string] },
  "alternative_vehicles": [{ "vehicle": string, "reason": string }],
  "objection_handling": [{ "likely_objection": string, "recommended_response": string }],
  "negotiation_guidance": { "starting_position": string, "flexibility_areas": [string], "deal_sweeteners": [string] },
  "summary": string
}`;

  const userPrompt = `Analyze this test drive:
- Customer: ${testDrive.customer_name}
- Vehicle: ${testDrive.vehicle_description}
- Route Type: ${testDrive.route_type || 'Mixed'}
- Duration: ${testDrive.duration_minutes} minutes
- Pre-Drive Interest: ${testDrive.pre_drive_interest || 'Unknown'}/10
- Post-Drive Interest: ${testDrive.post_drive_interest || 'Unknown'}/10
- Feedback: ${testDrive.feedback || 'None'}
- Outcome: ${testDrive.outcome}
- Notes: ${testDrive.notes || 'None'}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Follow-Up Analysis
async function analyzeFollowUp(followUp) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze the customer follow-up history and provide actionable recommendations. Return your analysis in this exact JSON format:
{
  "engagement_score": number (0-100),
  "sentiment_analysis": { "current": string, "trend": "Improving" | "Stable" | "Declining", "risk_level": "Low" | "Medium" | "High" },
  "recommended_action": { "type": string, "timing": string, "channel": string, "priority": string },
  "message_draft": { "subject": string, "body": string, "tone": string },
  "conversation_starters": [string],
  "escalation_needed": boolean,
  "escalation_reason": string,
  "win_back_strategy": string,
  "summary": string
}`;

  const userPrompt = `Analyze this customer follow-up:
- Customer: ${followUp.customer_name}
- Contact Type: ${followUp.contact_type}
- Direction: ${followUp.direction}
- Subject: ${followUp.subject || 'None'}
- Outcome: ${followUp.outcome || 'Unknown'}
- Sentiment: ${followUp.sentiment || 'Unknown'}
- Priority: ${followUp.priority}
- Status: ${followUp.status}
- Notes: ${followUp.notes || 'None'}
- Sales Person: ${followUp.sales_person}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Marketing Campaign Analysis
async function analyzeCampaign(campaign) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze the campaign performance and provide optimization recommendations. Return your analysis in this exact JSON format:
{
  "performance_rating": "Excellent" | "Good" | "Average" | "Poor",
  "roi_analysis": { "current_roi": number, "industry_benchmark": number, "cost_per_lead": number, "cost_per_acquisition": number },
  "optimization_suggestions": [{ "area": string, "current": string, "recommended": string, "expected_impact": string }],
  "audience_insights": { "best_performing_segment": string, "underperforming_segment": string, "new_segment_suggestion": string },
  "budget_recommendations": { "current_allocation": string, "recommended_allocation": string, "potential_savings": number },
  "messaging_suggestions": [{ "channel": string, "headline": string, "key_message": string }],
  "forecast": { "projected_leads": number, "projected_revenue": number, "confidence": number },
  "summary": string
}`;

  const userPrompt = `Analyze this marketing campaign:
- Campaign: ${campaign.name}
- Type: ${campaign.campaign_type}
- Channel: ${campaign.channel}
- Target: ${campaign.target_audience}
- Budget: $${campaign.budget?.toLocaleString()} (Spent: $${campaign.spent?.toLocaleString()})
- Leads Generated: ${campaign.leads_generated}
- Deals Closed: ${campaign.deals_closed}
- Revenue: $${campaign.revenue_attributed?.toLocaleString()}
- Impressions: ${campaign.impressions?.toLocaleString()}
- Clicks: ${campaign.clicks?.toLocaleString()}
- Conversion Rate: ${campaign.conversion_rate}%
- ROI: ${campaign.roi}%
- Status: ${campaign.status}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Trade-In Photo Analysis (text-based)
async function analyzeTradeInPhoto(vehicleInfo, conditionDescription) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Assess vehicle condition and provide reconditioning estimate and pricing impact based on the description. Return your analysis in this exact JSON format:
{
  "condition_assessment": {
    "overall_grade": "Excellent" | "Good" | "Fair" | "Poor",
    "exterior_condition": string,
    "interior_condition": string,
    "mechanical_condition": string,
    "key_issues": [string]
  },
  "reconditioning_estimate": {
    "total_cost": number,
    "breakdown": [{ "item": string, "cost": number, "priority": "Required" | "Recommended" | "Optional" }]
  },
  "pricing_impact": {
    "adjustment_amount": number,
    "adjustment_direction": "increase" | "decrease",
    "adjusted_value": number,
    "reasoning": string
  },
  "summary": string
}`;

  const userPrompt = `Assess trade-in vehicle condition:
Vehicle Info: ${JSON.stringify(vehicleInfo, null, 2)}
Condition Description: ${conditionDescription}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Inventory Aging Analysis
async function analyzeInventoryAging(inventory) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze slow-moving inventory and provide markdown timing and auction recommendations. Return your analysis in this exact JSON format:
{
  "aging_summary": {
    "critical_count": number,
    "warning_count": number,
    "healthy_count": number,
    "total_at_risk_value": number
  },
  "slow_movers": [{ "vehicle_id": number, "vehicle": string, "days_on_lot": number, "recommended_action": "markdown" | "auction" | "trade" | "hold", "urgency": "Immediate" | "This Week" | "This Month", "suggested_discount": number, "reasoning": string }],
  "markdown_schedule": [{ "vehicle_id": number, "vehicle": string, "suggested_markdown_date": string, "markdown_percentage": number }],
  "auction_recommendations": [{ "vehicle_id": number, "vehicle": string, "auction_date_suggestion": string, "estimated_auction_value": number, "reasoning": string }],
  "overall_strategy": string,
  "summary": string
}`;

  const userPrompt = `Analyze inventory aging:
${JSON.stringify(inventory, null, 2)}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Payment Optimizer
async function optimizePayment(creditScore, downPayment, vehiclePrice) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Provide optimal financing terms and default risk score. Return your analysis in this exact JSON format:
{
  "optimal_financing": {
    "recommended_term_months": number,
    "estimated_rate_range": { "low": number, "high": number },
    "monthly_payment_range": { "low": number, "high": number },
    "total_interest_estimate": number
  },
  "default_risk": {
    "score": number (0-100, higher = more risk),
    "grade": "Very Low" | "Low" | "Medium" | "High" | "Very High",
    "key_factors": [string],
    "mitigation_suggestions": [string]
  },
  "term_comparison": [{ "term_months": number, "monthly_payment": number, "total_cost": number, "recommended": boolean }],
  "lender_tier": "Tier 1" | "Tier 2" | "Tier 3" | "Subprime",
  "stipulations": [string],
  "summary": string
}`;

  const userPrompt = `Optimize payment structure:
- Credit Score: ${creditScore}
- Down Payment: $${downPayment?.toLocaleString()}
- Vehicle Price: $${vehiclePrice?.toLocaleString()}
- Loan Amount: $${((vehiclePrice || 0) - (downPayment || 0)).toLocaleString()}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Market Demand Analysis
async function analyzeMarketDemand(models, zipCode, season) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Predict demand and provide stocking priorities and shortage alerts. Return your analysis in this exact JSON format:
{
  "demand_predictions": [{ "model": string, "demand_level": "Very High" | "High" | "Medium" | "Low" | "Very Low", "demand_score": number (0-100), "trend": "Rising" | "Stable" | "Declining", "factors": [string] }],
  "stocking_priorities": [{ "model": string, "priority_rank": number, "recommended_units": number, "reasoning": string }],
  "shortage_alerts": [{ "model": string, "alert_level": "Critical" | "Warning" | "Watch", "expected_shortage_days": number, "recommendation": string }],
  "seasonal_insights": { "season": string, "top_categories": [string], "avoid_categories": [string], "opportunity": string },
  "market_summary": string,
  "summary": string
}`;

  const userPrompt = `Analyze market demand:
- Vehicle Models: ${models.join(', ')}
- ZIP Code Area: ${zipCode}
- Current Season: ${season}`;

  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Customer Persona Builder
async function buildCustomerPersona(customer, purchaseHistory) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Build a rich persona profile from purchase history and demographics, predict repeat purchase likelihood, and surface upsell opportunities. Return your analysis in this exact JSON format:
{
  "persona": {
    "label": string,
    "lifestyle_segment": string,
    "values": [string],
    "motivators": [string],
    "communication_preferences": { "channel": string, "tone": string, "frequency": string }
  },
  "demographics_summary": string,
  "repeat_purchase_probability": number,
  "next_purchase_window_months": { "low": number, "high": number },
  "lifecycle_stage": "New" | "Active" | "Lapsing" | "Loyal" | "VIP" | "At Risk",
  "upsell_opportunities": [{ "product_or_service": string, "rationale": string, "estimated_revenue": number, "best_timing": string }],
  "cross_sell_opportunities": [{ "product_or_service": string, "rationale": string, "estimated_revenue": number }],
  "retention_strategy": [{ "tactic": string, "channel": string, "expected_impact": string }],
  "summary": string
}`;
  const userPrompt = `Build customer persona:
Customer Profile: ${JSON.stringify(customer)}
Purchase History: ${JSON.stringify(purchaseHistory || [])}`;
  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Extended Warranty Analyzer
async function analyzeWarrantyOpportunity(vehicle, claimsHistory, customerProfile) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Track warranty claims, identify high-risk vehicle combinations, recommend warranty packages, and calculate profitability. Return your analysis in this exact JSON format:
{
  "risk_assessment": {
    "vehicle_risk_score": number,
    "risk_grade": "Very Low" | "Low" | "Medium" | "High" | "Very High",
    "high_risk_components": [{ "component": string, "failure_probability": number, "average_repair_cost": number }],
    "comparable_models_claim_rate": number
  },
  "recommended_packages": [{ "package": string, "term_months": number, "price": number, "coverage_summary": string, "match_score": number, "why": string }],
  "expected_loss_ratio": number,
  "profit_projection": {
    "expected_premium": number,
    "expected_payouts": number,
    "expected_gross_profit": number,
    "margin_percentage": number
  },
  "customer_pitch": { "headline": string, "key_points": [string], "objection_handling": [{ "objection": string, "response": string }] },
  "summary": string
}`;
  const userPrompt = `Analyze warranty opportunity:
Vehicle: ${JSON.stringify(vehicle)}
Claims History (model/year): ${JSON.stringify(claimsHistory || [])}
Customer Profile: ${JSON.stringify(customerProfile || {})}`;
  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Compliance Document Checker
async function checkComplianceDocuments(tradeIn, documents) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Verify trade-in title, detect liens, check for recalls, validate emissions compliance, and flag title issues before closing. Return your analysis in this exact JSON format:
{
  "overall_status": "Clear" | "Needs Attention" | "Blocked",
  "title_check": { "status": "Clean" | "Salvage" | "Rebuilt" | "Lemon" | "Unknown", "issues": [string], "state_of_title": string },
  "lien_check": { "liens_found": boolean, "lienholders": [{ "name": string, "amount": number, "payoff_required": boolean }] },
  "recall_check": { "open_recalls": [{ "campaign_id": string, "description": string, "severity": "Critical" | "Important" | "Routine" }] },
  "emissions_compliance": { "passes": boolean, "state": string, "notes": string },
  "odometer_verification": { "consistent": boolean, "discrepancy_notes": string },
  "blocking_issues": [{ "issue": string, "severity": "Critical" | "Major" | "Minor", "remediation": string, "estimated_resolution_days": number }],
  "documents_required": [{ "document": string, "status": "Provided" | "Missing" | "Outdated" }],
  "estimated_closing_delay_days": number,
  "summary": string
}`;
  const userPrompt = `Validate trade-in compliance:
Trade-In: ${JSON.stringify(tradeIn)}
Documents Provided: ${JSON.stringify(documents || [])}`;
  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

// AI Feature: Sales Skill Coaching
async function coachSalesSkills(repProfile, recentInteractions) {
  const systemPrompt = `${DEALERSHIP_SYSTEM_PROMPT} Analyze recorded test drives, calls, and follow-ups; identify objection-handling gaps; suggest scripts; track rep performance improvement. Return your analysis in this exact JSON format:
{
  "rep_summary": { "name": string, "tenure_months": number, "current_performance_tier": "Top" | "Strong" | "Average" | "Developing" | "Underperforming" },
  "skill_assessment": [{ "skill": string, "score": number, "trend": "Improving" | "Stable" | "Declining", "evidence": [string] }],
  "objection_handling_gaps": [{ "objection_type": string, "miss_frequency": string, "recommended_script": string }],
  "coaching_priorities": [{ "priority": "High" | "Medium" | "Low", "skill": string, "drill": string, "expected_lift": string }],
  "recommended_scripts": [{ "scenario": string, "opener": string, "key_phrases": [string], "close": string }],
  "shadow_or_role_play_plan": { "weekly_minutes": number, "scenarios": [string] },
  "30_day_improvement_targets": [{ "metric": string, "current": string, "target": string }],
  "summary": string
}`;
  const userPrompt = `Coach this sales rep:
Rep Profile: ${JSON.stringify(repProfile)}
Recent Interactions (calls, test drives, follow-ups): ${JSON.stringify(recentInteractions || [])}`;
  const response = await callOpenRouter(systemPrompt, userPrompt);
  return safeJsonParse(response, { summary: response });
}

module.exports = {
  callOpenRouter,
  analyzeInventoryPricing,
  matchCustomerToVehicles,
  valuateTradeIn,
  recommendFniProducts,
  scoreLead,
  analyzeDeal,
  generateAnalyticsInsights,
  analyzeServiceNeeds,
  analyzeInspection,
  analyzeTestDrive,
  analyzeFollowUp,
  analyzeCampaign,
  analyzeTradeInPhoto,
  analyzeInventoryAging,
  optimizePayment,
  analyzeMarketDemand,
  buildCustomerPersona,
  analyzeWarrantyOpportunity,
  checkComplianceDocuments,
  coachSalesSkills,
};
