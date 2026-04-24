import React from 'react';

function AIResultDisplay({ result, loading, error, type }) {
  if (loading) {
    return (
      <div className="ai-result-container">
        <div className="ai-loading">
          <div className="spinner"></div>
          <p>AI is analyzing... This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-result-container">
        <div className="ai-result-body">
          <div className="ai-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const renderScoreBar = (score, max = 100) => {
    const pct = Math.min((score / max) * 100, 100);
    const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171';
    return (
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    );
  };

  const renderFactors = (factors) => {
    if (!factors || !Array.isArray(factors)) return null;
    return factors.map((f, i) => (
      <div key={i} className="ai-factor">
        <div className={`ai-factor-icon ${f.impact || f.severity?.toLowerCase() || 'neutral'}`}>
          {f.impact === 'positive' || f.severity === 'Low' ? '↑' : f.impact === 'negative' || f.severity === 'High' ? '↓' : '→'}
        </div>
        <div className="ai-factor-content">
          <h5>{f.factor || f.area || f.risk || f.metric || f.opportunity || f.item}</h5>
          <p>{f.detail || f.notes || f.reasoning || f.mitigation || f.recommendation || f.insight || f.action_required}</p>
        </div>
      </div>
    ));
  };

  const renderValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') {
      if (val >= 1000) return `$${val.toLocaleString()}`;
      return val.toString();
    }
    return val.toString();
  };

  return (
    <div className="ai-result-container">
      <div className="ai-result-header">
        <span>✨</span>
        <h4>AI Analysis Results</h4>
      </div>
      <div className="ai-result-body">
        {/* Summary always first */}
        {result.summary && (
          <div className="ai-section">
            <div className="ai-summary">
              <p>{result.summary}</p>
            </div>
          </div>
        )}

        {/* Pricing specific */}
        {result.recommended_price && (
          <div className="ai-section">
            <div className="ai-section-title">Pricing Recommendation</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Recommended Price</span>
              <span className="ai-metric-value" style={{ color: '#4ade80' }}>
                ${result.recommended_price.toLocaleString()}
              </span>
            </div>
            {result.price_range && (
              <div className="ai-metric">
                <span className="ai-metric-label">Price Range</span>
                <span className="ai-metric-value">
                  ${result.price_range.low?.toLocaleString()} - ${result.price_range.high?.toLocaleString()}
                </span>
              </div>
            )}
            {result.market_position && (
              <div className="ai-metric">
                <span className="ai-metric-label">Market Position</span>
                <span className="ai-metric-value">{result.market_position.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
            )}
            {result.confidence_score && (
              <>
                <div className="ai-metric">
                  <span className="ai-metric-label">Confidence Score</span>
                  <span className="ai-metric-value">{result.confidence_score}%</span>
                </div>
                {renderScoreBar(result.confidence_score)}
              </>
            )}
            {result.days_to_sell_estimate && (
              <div className="ai-metric">
                <span className="ai-metric-label">Est. Days to Sell</span>
                <span className="ai-metric-value">{result.days_to_sell_estimate} days</span>
              </div>
            )}
          </div>
        )}

        {/* Valuation specific */}
        {result.estimated_value && (
          <div className="ai-section">
            <div className="ai-section-title">Valuation Details</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Estimated Value</span>
              <span className="ai-metric-value" style={{ color: '#4ade80' }}>
                ${result.estimated_value.toLocaleString()}
              </span>
            </div>
            {result.value_range && (
              <div className="ai-metric">
                <span className="ai-metric-label">Value Range</span>
                <span className="ai-metric-value">
                  ${result.value_range.low?.toLocaleString()} - ${result.value_range.high?.toLocaleString()}
                </span>
              </div>
            )}
            {result.wholesale_value && (
              <div className="ai-metric">
                <span className="ai-metric-label">Wholesale Value</span>
                <span className="ai-metric-value">${result.wholesale_value.toLocaleString()}</span>
              </div>
            )}
            {result.retail_value && (
              <div className="ai-metric">
                <span className="ai-metric-label">Retail Value</span>
                <span className="ai-metric-value">${result.retail_value.toLocaleString()}</span>
              </div>
            )}
            {result.reconditioning_estimate && (
              <div className="ai-metric">
                <span className="ai-metric-label">Reconditioning Est.</span>
                <span className="ai-metric-value">${result.reconditioning_estimate.toLocaleString()}</span>
              </div>
            )}
            {result.condition_grade && (
              <div className="ai-metric">
                <span className="ai-metric-label">Condition Grade</span>
                <span className="ai-metric-value">{result.condition_grade}</span>
              </div>
            )}
            {result.market_demand && (
              <div className="ai-metric">
                <span className="ai-metric-label">Market Demand</span>
                <span className="ai-metric-value">{result.market_demand}</span>
              </div>
            )}
          </div>
        )}

        {/* Lead scoring specific */}
        {result.score !== undefined && result.grade && (
          <div className="ai-section">
            <div className="ai-section-title">Lead Score</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Score</span>
              <span className="ai-metric-value" style={{ color: result.score >= 70 ? '#4ade80' : result.score >= 40 ? '#fbbf24' : '#f87171' }}>
                {result.score}/100
              </span>
            </div>
            {renderScoreBar(result.score)}
            <div className="ai-metric" style={{ marginTop: 6 }}>
              <span className="ai-metric-label">Grade</span>
              <span className="ai-metric-value">{result.grade}</span>
            </div>
            {result.urgency && (
              <div className="ai-metric">
                <span className="ai-metric-label">Urgency</span>
                <span className="ai-metric-value">{result.urgency}</span>
              </div>
            )}
            {result.buy_probability !== undefined && (
              <div className="ai-metric">
                <span className="ai-metric-label">Buy Probability</span>
                <span className="ai-metric-value">{result.buy_probability}%</span>
              </div>
            )}
          </div>
        )}

        {/* Deal rating specific */}
        {result.deal_rating && (
          <div className="ai-section">
            <div className="ai-section-title">Deal Analysis</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Deal Rating</span>
              <span className="ai-metric-value" style={{
                color: result.deal_rating === 'Excellent' ? '#4ade80' : result.deal_rating === 'Good' ? '#60a5fa' : '#fbbf24'
              }}>{result.deal_rating}</span>
            </div>
            {result.profit_analysis && (
              <>
                <div className="ai-metric">
                  <span className="ai-metric-label">Gross Profit</span>
                  <span className="ai-metric-value">${(result.profit_analysis.gross_profit || 0).toLocaleString()}</span>
                </div>
                <div className="ai-metric">
                  <span className="ai-metric-label">Margin</span>
                  <span className="ai-metric-value">{result.profit_analysis.margin_percentage || 0}%</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Overall health (analytics) */}
        {result.overall_health && (
          <div className="ai-section">
            <div className="ai-section-title">Overall Health</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Dealership Health</span>
              <span className="ai-metric-value" style={{
                color: result.overall_health === 'Excellent' ? '#4ade80' : result.overall_health === 'Good' ? '#60a5fa' : '#fbbf24'
              }}>{result.overall_health}</span>
            </div>
          </div>
        )}

        {/* Customer matching */}
        {result.top_matches && result.top_matches.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Top Vehicle Matches</div>
            {result.top_matches.slice(0, 5).map((match, i) => (
              <div key={i} className="ai-match-card">
                <h5>{match.vehicle_name || `Vehicle #${match.vehicle_id}`}</h5>
                <span className={`ai-match-score ${match.match_score >= 80 ? 'score-high' : match.match_score >= 50 ? 'score-medium' : 'score-low'}`}>
                  {match.match_score}% Match
                </span>
                {match.reasons && (
                  <div className="ai-tags">
                    {match.reasons.map((r, j) => <span key={j} className="ai-tag">{r}</span>)}
                  </div>
                )}
                {match.selling_points && (
                  <div className="ai-tags" style={{ marginTop: 4 }}>
                    {match.selling_points.map((s, j) => <span key={j} className="ai-tag" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>{s}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* F&I Recommendations */}
        {result.recommended_products && result.recommended_products.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Recommended Products</div>
            {result.recommended_products.map((p, i) => (
              <div key={i} className="ai-action-card">
                <span className={`ai-priority priority-${p.priority?.toLowerCase()}`}>{p.priority}</span>
                <div>
                  <h5 style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 4 }}>{p.product_name}</h5>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{p.customer_benefit}</p>
                  {p.estimated_profit && (
                    <p style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>Est. Profit: ${p.estimated_profit.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
            {result.total_potential_revenue && (
              <div className="ai-metric" style={{ marginTop: 10 }}>
                <span className="ai-metric-label">Total Potential Revenue</span>
                <span className="ai-metric-value" style={{ color: '#4ade80' }}>
                  ${result.total_potential_revenue.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Factors / Conditions */}
        {result.factors && result.factors.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Key Factors</div>
            {renderFactors(result.factors)}
          </div>
        )}

        {result.condition_factors && result.condition_factors.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Condition Assessment</div>
            {renderFactors(result.condition_factors)}
          </div>
        )}

        {result.scoring_factors && result.scoring_factors.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Scoring Breakdown</div>
            {result.scoring_factors.map((f, i) => (
              <div key={i} className="ai-factor">
                <div className="ai-factor-content" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h5>{f.factor}</h5>
                    <span style={{ color: '#c084fc', fontSize: 13 }}>{f.score}</span>
                  </div>
                  <p>{f.reasoning}</p>
                  {renderScoreBar(f.score)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Actions */}
        {result.recommended_actions && result.recommended_actions.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Recommended Actions</div>
            {result.recommended_actions.map((a, i) => (
              <div key={i} className="ai-action-card">
                <span className={`ai-priority priority-${a.priority?.toLowerCase().replace(' ', '-')}`}>{a.priority}</span>
                <div>
                  <p style={{ fontSize: 13, color: '#e2e8f0' }}>{a.action}</p>
                  {a.channel && <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>via {a.channel}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action items (analytics) */}
        {result.action_items && result.action_items.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Action Items</div>
            {result.action_items.map((a, i) => (
              <div key={i} className="ai-action-card">
                <span className={`ai-priority priority-${a.priority?.toLowerCase()}`}>{a.priority}</span>
                <div>
                  <p style={{ fontSize: 13, color: '#e2e8f0' }}>{a.item}</p>
                  {a.owner && <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Owner: {a.owner}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Optimization suggestions */}
        {result.optimization_suggestions && result.optimization_suggestions.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Optimization Suggestions</div>
            {result.optimization_suggestions.map((s, i) => (
              <div key={i} className="ai-action-card">
                <span className={`ai-priority priority-${s.difficulty?.toLowerCase()}`}>{s.difficulty}</span>
                <div>
                  <p style={{ fontSize: 13, color: '#e2e8f0' }}>{s.suggestion}</p>
                  {s.potential_impact && <p style={{ fontSize: 12, color: '#4ade80', marginTop: 2 }}>Impact: +${s.potential_impact.toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Opportunities */}
        {result.opportunities && result.opportunities.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Opportunities</div>
            {renderFactors(result.opportunities)}
          </div>
        )}

        {/* Risks */}
        {result.risks && result.risks.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Risks</div>
            {renderFactors(result.risks)}
          </div>
        )}

        {/* Risk Factors */}
        {result.risk_factors && result.risk_factors.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Risk Factors</div>
            {renderFactors(result.risk_factors)}
          </div>
        )}

        {/* Key metrics analysis */}
        {result.key_metrics_analysis && result.key_metrics_analysis.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Key Metrics</div>
            {result.key_metrics_analysis.map((m, i) => (
              <div key={i} className="ai-metric">
                <span className="ai-metric-label">{m.metric}</span>
                <span className="ai-metric-value">
                  {m.value} {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 30 day forecast */}
        {result['30_day_forecast'] && (
          <div className="ai-section">
            <div className="ai-section-title">30-Day Forecast</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Projected Sales</span>
              <span className="ai-metric-value">{result['30_day_forecast'].projected_sales}</span>
            </div>
            <div className="ai-metric">
              <span className="ai-metric-label">Projected Revenue</span>
              <span className="ai-metric-value">{result['30_day_forecast'].projected_revenue}</span>
            </div>
            <div className="ai-metric">
              <span className="ai-metric-label">Confidence</span>
              <span className="ai-metric-value">{result['30_day_forecast'].confidence}%</span>
            </div>
          </div>
        )}

        {/* Pricing strategy / approach strategy */}
        {result.pricing_strategy && (
          <div className="ai-section">
            <div className="ai-section-title">Strategy</div>
            <div className="ai-summary"><p>{result.pricing_strategy}</p></div>
          </div>
        )}
        {result.approach_strategy && (
          <div className="ai-section">
            <div className="ai-section-title">Approach Strategy</div>
            <div className="ai-summary"><p>{result.approach_strategy}</p></div>
          </div>
        )}

        {/* Customer insights */}
        {result.customer_insights && (
          <div className="ai-section">
            <div className="ai-section-title">Customer Insights</div>
            {result.customer_insights.buyer_type && (
              <div className="ai-metric">
                <span className="ai-metric-label">Buyer Type</span>
                <span className="ai-metric-value">{result.customer_insights.buyer_type}</span>
              </div>
            )}
            {result.customer_insights.key_motivators && (
              <div className="ai-tags" style={{ marginTop: 8 }}>
                {result.customer_insights.key_motivators.map((m, i) => (
                  <span key={i} className="ai-tag">{m}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Negotiation insights */}
        {result.negotiation_insights && (
          <div className="ai-section">
            <div className="ai-section-title">Negotiation Insights</div>
            {result.negotiation_insights.sweet_spot_price && (
              <div className="ai-metric">
                <span className="ai-metric-label">Sweet Spot Price</span>
                <span className="ai-metric-value" style={{ color: '#4ade80' }}>
                  ${result.negotiation_insights.sweet_spot_price.toLocaleString()}
                </span>
              </div>
            )}
            {result.negotiation_insights.customer_leverage && (
              <div className="ai-metric">
                <span className="ai-metric-label">Customer Leverage</span>
                <span className="ai-metric-value">{result.negotiation_insights.customer_leverage}</span>
              </div>
            )}
            {result.negotiation_insights.dealer_leverage && (
              <div className="ai-metric">
                <span className="ai-metric-label">Dealer Leverage</span>
                <span className="ai-metric-value">{result.negotiation_insights.dealer_leverage}</span>
              </div>
            )}
          </div>
        )}

        {/* Financing recommendations */}
        {result.financing_recommendations && (
          <div className="ai-section">
            <div className="ai-section-title">Financing Recommendations</div>
            {result.financing_recommendations.suggested_term && (
              <div className="ai-metric">
                <span className="ai-metric-label">Suggested Term</span>
                <span className="ai-metric-value">{result.financing_recommendations.suggested_term} months</span>
              </div>
            )}
            {result.financing_recommendations.suggested_rate_range && (
              <div className="ai-metric">
                <span className="ai-metric-label">Rate Range</span>
                <span className="ai-metric-value">{result.financing_recommendations.suggested_rate_range}</span>
              </div>
            )}
          </div>
        )}

        {/* Objection predictions */}
        {result.objection_predictions && result.objection_predictions.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Predicted Objections</div>
            {result.objection_predictions.map((o, i) => (
              <div key={i} className="ai-factor">
                <div className="ai-factor-icon negative">!</div>
                <div className="ai-factor-content">
                  <p>{o}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Competitor comparison */}
        {result.competitor_comparison && (
          <div className="ai-section">
            <div className="ai-section-title">Competitor Comparison</div>
            <div className="ai-summary"><p>{result.competitor_comparison}</p></div>
          </div>
        )}

        {/* Customer risk profile */}
        {result.customer_risk_profile && (
          <div className="ai-section">
            <div className="ai-section-title">Customer Risk Profile</div>
            <div className="ai-summary"><p>{result.customer_risk_profile}</p></div>
          </div>
        )}

        {/* Compliance notes */}
        {result.compliance_notes && result.compliance_notes.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Compliance Notes</div>
            {result.compliance_notes.map((n, i) => (
              <div key={i} className="ai-factor">
                <div className="ai-factor-icon neutral">i</div>
                <div className="ai-factor-content"><p>{n}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Best contact time / timeline */}
        {result.best_contact_time && (
          <div className="ai-metric">
            <span className="ai-metric-label">Best Contact Time</span>
            <span className="ai-metric-value">{result.best_contact_time}</span>
          </div>
        )}
        {result.estimated_timeline && (
          <div className="ai-metric">
            <span className="ai-metric-label">Estimated Timeline</span>
            <span className="ai-metric-value">{result.estimated_timeline}</span>
          </div>
        )}

        {/* Service: recommended services */}
        {result.recommended_services && result.recommended_services.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Recommended Services</div>
            {result.recommended_services.map((s, i) => (
              <div key={i} className="ai-action-card">
                <span className={`ai-priority priority-${s.urgency === 'Immediate' ? 'high' : s.urgency === 'Soon' ? 'medium' : 'low'}`}>{s.urgency}</span>
                <div>
                  <h5 style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 4 }}>{s.service}</h5>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{s.reason}</p>
                  {s.estimated_cost > 0 && <p style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>Est. Cost: ${s.estimated_cost.toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service: upsell opportunities */}
        {result.upsell_opportunities && result.upsell_opportunities.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Upsell Opportunities</div>
            {result.upsell_opportunities.map((u, i) => (
              <div key={i} className="ai-match-card">
                <h5>{u.service}</h5>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{u.pitch}</p>
                {u.estimated_profit > 0 && <p style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>Profit: ${u.estimated_profit.toLocaleString()}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Service: maintenance forecast */}
        {result.maintenance_forecast && result.maintenance_forecast.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Maintenance Forecast</div>
            {result.maintenance_forecast.map((m, i) => (
              <div key={i} className="ai-metric">
                <span className="ai-metric-label">{m.service}</span>
                <span className="ai-metric-value">{m.estimated_mileage ? `${m.estimated_mileage.toLocaleString()} mi` : m.estimated_date}</span>
              </div>
            ))}
          </div>
        )}

        {/* Service: customer communication */}
        {result.customer_communication && (
          <div className="ai-section">
            <div className="ai-section-title">Customer Communication</div>
            <div className="ai-summary"><p>{result.customer_communication}</p></div>
          </div>
        )}

        {/* Inspection: safety flags */}
        {result.safety_flags && result.safety_flags.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Safety Flags</div>
            {result.safety_flags.map((f, i) => (
              <div key={i} className="ai-factor">
                <div className={`ai-factor-icon ${f.severity === 'Critical' ? 'negative' : f.severity === 'Moderate' ? 'neutral' : 'positive'}`}>
                  {f.severity === 'Critical' ? '!' : f.severity === 'Moderate' ? '⚠' : 'i'}
                </div>
                <div className="ai-factor-content">
                  <h5>{f.area}</h5>
                  <p>{f.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inspection: reconditioning plan */}
        {result.reconditioning_plan && result.reconditioning_plan.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Reconditioning Plan</div>
            {result.reconditioning_plan.map((r, i) => (
              <div key={i} className="ai-action-card">
                <span className={`ai-priority priority-${r.priority === 'Must Do' ? 'high' : r.priority === 'Recommended' ? 'medium' : 'low'}`}>{r.priority}</span>
                <div>
                  <h5 style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 4 }}>{r.item}</h5>
                  <p style={{ fontSize: 12, color: '#4ade80' }}>Cost: ${(r.estimated_cost || 0).toLocaleString()}</p>
                  {r.roi_estimate && <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>ROI: {r.roi_estimate}</p>}
                </div>
              </div>
            ))}
            {result.total_reconditioning_cost > 0 && (
              <div className="ai-metric" style={{ marginTop: 8 }}>
                <span className="ai-metric-label">Total Reconditioning</span>
                <span className="ai-metric-value">${result.total_reconditioning_cost.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Inspection: pricing impact */}
        {result.pricing_impact && (
          <div className="ai-section">
            <div className="ai-section-title">Pricing Impact</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Price Adjustment</span>
              <span className="ai-metric-value" style={{ color: result.pricing_impact.adjustment >= 0 ? '#4ade80' : '#f87171' }}>
                {result.pricing_impact.adjustment >= 0 ? '+' : ''}${(result.pricing_impact.adjustment || 0).toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{result.pricing_impact.reasoning}</p>
          </div>
        )}

        {/* Inspection: certification eligible */}
        {result.certification_eligible !== undefined && (
          <div className="ai-metric">
            <span className="ai-metric-label">CPO Eligible</span>
            <span className="ai-metric-value" style={{ color: result.certification_eligible ? '#4ade80' : '#f87171' }}>
              {result.certification_eligible ? 'Yes' : 'No'}
            </span>
          </div>
        )}

        {/* Inspection: customer disclosure */}
        {result.customer_disclosure && result.customer_disclosure.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Customer Disclosures</div>
            {result.customer_disclosure.map((d, i) => (
              <div key={i} className="ai-factor">
                <div className="ai-factor-icon neutral">i</div>
                <div className="ai-factor-content"><p>{d}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Test drive: purchase probability */}
        {result.purchase_probability !== undefined && result.interest_trend && (
          <div className="ai-section">
            <div className="ai-section-title">Purchase Analysis</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Purchase Probability</span>
              <span className="ai-metric-value" style={{ color: result.purchase_probability >= 70 ? '#4ade80' : result.purchase_probability >= 40 ? '#fbbf24' : '#f87171' }}>
                {result.purchase_probability}%
              </span>
            </div>
            {renderScoreBar(result.purchase_probability)}
            <div className="ai-metric" style={{ marginTop: 6 }}>
              <span className="ai-metric-label">Interest Trend</span>
              <span className="ai-metric-value" style={{ color: result.interest_trend === 'Increased' ? '#4ade80' : result.interest_trend === 'Decreased' ? '#f87171' : '#fbbf24' }}>
                {result.interest_trend}
              </span>
            </div>
          </div>
        )}

        {/* Test drive: follow-up strategy */}
        {result.follow_up_strategy && (
          <div className="ai-section">
            <div className="ai-section-title">Follow-Up Strategy</div>
            {result.follow_up_strategy.timing && <div className="ai-metric"><span className="ai-metric-label">Timing</span><span className="ai-metric-value">{result.follow_up_strategy.timing}</span></div>}
            {result.follow_up_strategy.channel && <div className="ai-metric"><span className="ai-metric-label">Channel</span><span className="ai-metric-value">{result.follow_up_strategy.channel}</span></div>}
            {result.follow_up_strategy.message_tone && <div className="ai-metric"><span className="ai-metric-label">Tone</span><span className="ai-metric-value">{result.follow_up_strategy.message_tone}</span></div>}
            {result.follow_up_strategy.key_points && (
              <div className="ai-tags" style={{ marginTop: 8 }}>
                {result.follow_up_strategy.key_points.map((p, i) => <span key={i} className="ai-tag">{p}</span>)}
              </div>
            )}
          </div>
        )}

        {/* Test drive / follow-up: alternative vehicles */}
        {result.alternative_vehicles && result.alternative_vehicles.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Alternative Vehicles</div>
            {result.alternative_vehicles.map((v, i) => (
              <div key={i} className="ai-match-card">
                <h5>{v.vehicle}</h5>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{v.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Test drive: objection handling */}
        {result.objection_handling && result.objection_handling.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Objection Handling</div>
            {result.objection_handling.map((o, i) => (
              <div key={i} className="ai-match-card">
                <h5 style={{ color: '#fbbf24' }}>{o.likely_objection}</h5>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{o.recommended_response}</p>
              </div>
            ))}
          </div>
        )}

        {/* Follow-up: engagement score */}
        {result.engagement_score !== undefined && result.sentiment_analysis && (
          <div className="ai-section">
            <div className="ai-section-title">Engagement Analysis</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Engagement Score</span>
              <span className="ai-metric-value" style={{ color: result.engagement_score >= 70 ? '#4ade80' : result.engagement_score >= 40 ? '#fbbf24' : '#f87171' }}>
                {result.engagement_score}/100
              </span>
            </div>
            {renderScoreBar(result.engagement_score)}
            <div className="ai-metric" style={{ marginTop: 6 }}>
              <span className="ai-metric-label">Sentiment</span>
              <span className="ai-metric-value">{result.sentiment_analysis.current}</span>
            </div>
            <div className="ai-metric">
              <span className="ai-metric-label">Trend</span>
              <span className="ai-metric-value" style={{ color: result.sentiment_analysis.trend === 'Improving' ? '#4ade80' : result.sentiment_analysis.trend === 'Declining' ? '#f87171' : '#fbbf24' }}>
                {result.sentiment_analysis.trend}
              </span>
            </div>
            {result.sentiment_analysis.risk_level && (
              <div className="ai-metric">
                <span className="ai-metric-label">Risk Level</span>
                <span className="ai-metric-value">{result.sentiment_analysis.risk_level}</span>
              </div>
            )}
          </div>
        )}

        {/* Follow-up: message draft */}
        {result.message_draft && (
          <div className="ai-section">
            <div className="ai-section-title">Message Draft</div>
            {result.message_draft.subject && <div className="ai-metric"><span className="ai-metric-label">Subject</span><span className="ai-metric-value">{result.message_draft.subject}</span></div>}
            {result.message_draft.tone && <div className="ai-metric"><span className="ai-metric-label">Tone</span><span className="ai-metric-value">{result.message_draft.tone}</span></div>}
            {result.message_draft.body && (
              <div className="ai-summary" style={{ marginTop: 8 }}><p>{result.message_draft.body}</p></div>
            )}
          </div>
        )}

        {/* Follow-up: conversation starters */}
        {result.conversation_starters && result.conversation_starters.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Conversation Starters</div>
            {result.conversation_starters.map((s, i) => (
              <div key={i} className="ai-factor">
                <div className="ai-factor-icon positive">💬</div>
                <div className="ai-factor-content"><p>{s}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Follow-up: escalation */}
        {result.escalation_needed && (
          <div className="ai-section">
            <div className="ai-section-title" style={{ color: '#f87171' }}>Escalation Required</div>
            <div className="ai-summary" style={{ borderLeftColor: '#f87171' }}><p>{result.escalation_reason}</p></div>
          </div>
        )}

        {/* Follow-up: win back strategy */}
        {result.win_back_strategy && (
          <div className="ai-section">
            <div className="ai-section-title">Win-Back Strategy</div>
            <div className="ai-summary"><p>{result.win_back_strategy}</p></div>
          </div>
        )}

        {/* Campaign: ROI analysis */}
        {result.roi_analysis && (
          <div className="ai-section">
            <div className="ai-section-title">ROI Analysis</div>
            <div className="ai-metric"><span className="ai-metric-label">Current ROI</span><span className="ai-metric-value">{result.roi_analysis.current_roi}%</span></div>
            <div className="ai-metric"><span className="ai-metric-label">Industry Benchmark</span><span className="ai-metric-value">{result.roi_analysis.industry_benchmark}%</span></div>
            <div className="ai-metric"><span className="ai-metric-label">Cost per Lead</span><span className="ai-metric-value">${result.roi_analysis.cost_per_lead}</span></div>
            <div className="ai-metric"><span className="ai-metric-label">Cost per Acquisition</span><span className="ai-metric-value">${result.roi_analysis.cost_per_acquisition}</span></div>
          </div>
        )}

        {/* Campaign: performance rating */}
        {result.performance_rating && !result.deal_rating && (
          <div className="ai-section">
            <div className="ai-section-title">Performance Rating</div>
            <div className="ai-metric">
              <span className="ai-metric-label">Rating</span>
              <span className="ai-metric-value" style={{ color: result.performance_rating === 'Excellent' ? '#4ade80' : result.performance_rating === 'Good' ? '#60a5fa' : result.performance_rating === 'Average' ? '#fbbf24' : '#f87171' }}>
                {result.performance_rating}
              </span>
            </div>
          </div>
        )}

        {/* Campaign: audience insights */}
        {result.audience_insights && (
          <div className="ai-section">
            <div className="ai-section-title">Audience Insights</div>
            {result.audience_insights.best_performing_segment && <div className="ai-metric"><span className="ai-metric-label">Best Segment</span><span className="ai-metric-value" style={{ color: '#4ade80' }}>{result.audience_insights.best_performing_segment}</span></div>}
            {result.audience_insights.underperforming_segment && <div className="ai-metric"><span className="ai-metric-label">Underperforming</span><span className="ai-metric-value" style={{ color: '#f87171' }}>{result.audience_insights.underperforming_segment}</span></div>}
            {result.audience_insights.new_segment_suggestion && <div className="ai-metric"><span className="ai-metric-label">New Segment</span><span className="ai-metric-value" style={{ color: '#60a5fa' }}>{result.audience_insights.new_segment_suggestion}</span></div>}
          </div>
        )}

        {/* Campaign: budget recommendations */}
        {result.budget_recommendations && (
          <div className="ai-section">
            <div className="ai-section-title">Budget Recommendations</div>
            {result.budget_recommendations.current_allocation && <div className="ai-metric"><span className="ai-metric-label">Current</span><span className="ai-metric-value">{result.budget_recommendations.current_allocation}</span></div>}
            {result.budget_recommendations.recommended_allocation && <div className="ai-metric"><span className="ai-metric-label">Recommended</span><span className="ai-metric-value">{result.budget_recommendations.recommended_allocation}</span></div>}
            {result.budget_recommendations.potential_savings > 0 && <div className="ai-metric"><span className="ai-metric-label">Potential Savings</span><span className="ai-metric-value" style={{ color: '#4ade80' }}>${result.budget_recommendations.potential_savings.toLocaleString()}</span></div>}
          </div>
        )}

        {/* Campaign: messaging suggestions */}
        {result.messaging_suggestions && result.messaging_suggestions.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-title">Messaging Suggestions</div>
            {result.messaging_suggestions.map((m, i) => (
              <div key={i} className="ai-match-card">
                <h5>{m.channel}</h5>
                <p style={{ fontSize: 13, color: '#c084fc', marginTop: 4 }}>{m.headline}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{m.key_message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Campaign: forecast */}
        {result.forecast && (
          <div className="ai-section">
            <div className="ai-section-title">Campaign Forecast</div>
            {result.forecast.projected_leads && <div className="ai-metric"><span className="ai-metric-label">Projected Leads</span><span className="ai-metric-value">{result.forecast.projected_leads}</span></div>}
            {result.forecast.projected_revenue && <div className="ai-metric"><span className="ai-metric-label">Projected Revenue</span><span className="ai-metric-value">${result.forecast.projected_revenue.toLocaleString()}</span></div>}
            {result.forecast.confidence && <div className="ai-metric"><span className="ai-metric-label">Confidence</span><span className="ai-metric-value">{result.forecast.confidence}%</span></div>}
          </div>
        )}

        {/* Cost savings (service) */}
        {result.cost_savings_preventive > 0 && (
          <div className="ai-metric">
            <span className="ai-metric-label">Preventive Savings</span>
            <span className="ai-metric-value" style={{ color: '#4ade80' }}>${result.cost_savings_preventive.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIResultDisplay;
