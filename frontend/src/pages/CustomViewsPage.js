import React from 'react';
import LotInventoryBars   from '../components/customViews/LotInventoryBars';
import SalesFunnelHeatmap from '../components/customViews/SalesFunnelHeatmap';
import DealSheetPDF       from '../components/customViews/DealSheetPDF';
import LeadRoutingRules   from '../components/customViews/LeadRoutingRules';

function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <h2>Sales Views</h2>
        <p style={{ color: '#94a3b8', marginTop: 4 }}>
          Custom dealership sales views — lot inventory bars, sales funnel heatmap,
          deal sheet PDF generator, and lead routing rules editor.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginTop: 16 }}>
        <LotInventoryBars />
        <SalesFunnelHeatmap />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 20,
          }}
        >
          <DealSheetPDF />
          <LeadRoutingRules />
        </div>
      </div>
    </div>
  );
}

export default CustomViewsPage;
