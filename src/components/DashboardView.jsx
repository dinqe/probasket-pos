import React, { useState, useMemo } from 'react';
import { DollarSign, Flame, BarChart3, AlertTriangle, Calendar, RefreshCcw, Lock } from 'lucide-react';

const DashboardView = ({ 
  products, 
  salesHistory, 
  restockProduct, 
  isAdminUnlocked, 
  promptAdminLogin 
}) => {
  const [filterType, setFilterType] = useState('Week'); // Day, Week, Month, Custom
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  // Set dates helper based on filter type selection
  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (type === 'Day') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (type === 'Week') {
      const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (type === 'Month') {
      const start = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  // Filter sales history based on active date range
  const filteredSales = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return salesHistory.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= start && saleDate <= end;
    });
  }, [salesHistory, startDate, endDate]);

  // Core metrics calculations
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalItems = 0;
    
    filteredSales.forEach(sale => {
      totalRevenue += sale.total;
      totalItems += sale.quantity;
    });

    const averageOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
    
    const lowStockCount = products.filter(p => p.stock <= 5).length;

    return {
      revenue: totalRevenue,
      items: totalItems,
      aov: averageOrderValue,
      lowStock: lowStockCount,
      transactions: filteredSales.length
    };
  }, [filteredSales, products]);

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    // Group sales today to show "Sold Today" in inventory
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = salesHistory.filter(sale => {
      const d = new Date(sale.timestamp);
      return d >= todayStart && d <= todayEnd;
    });

    // Map product IDs to sold quantities today
    const soldCounts = {};
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        soldCounts[item.productId] = (soldCounts[item.productId] || 0) + item.qty;
      });
    });

    return products.map(product => {
      const soldToday = soldCounts[product.id] || 0;
      const currentStock = product.stock;
      // Starting stock is roughly current + sold today
      const startingStock = currentStock + soldToday;

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        startingStock,
        soldToday,
        currentStock,
        image: product.image
      };
    });
  }, [products, salesHistory]);

  // Chart calculation: Group sales by date string (e.g. YYYY-MM-DD)
  const chartData = useMemo(() => {
    const dailyMap = {};
    
    // Initialize dates within the range with $0 sales
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Prevent infinite loop or lockups on bad dates
    let loopDate = new Date(start);
    const maxDays = 95; // Guard rails
    let count = 0;

    while (loopDate <= end && count < maxDays) {
      const dateStr = loopDate.toISOString().split('T')[0];
      dailyMap[dateStr] = 0;
      loopDate.setDate(loopDate.getDate() + 1);
      count++;
    }

    // Populate actual sales
    filteredSales.forEach(sale => {
      const dateStr = sale.timestamp.split('T')[0];
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr] += sale.total;
      }
    });

    // Convert map to sorted array
    return Object.keys(dailyMap).sort().map(dateStr => {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(dateStr);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        dateStr,
        label,
        value: dailyMap[dateStr]
      };
    });
  }, [filteredSales, startDate, endDate]);

  // Generate SVG coordinates for rendering
  const svgParams = useMemo(() => {
    const width = 600;
    const height = 220;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    if (chartData.length === 0) return null;

    const maxVal = Math.max(...chartData.map(d => d.value), 20); // fallback of $20 max Y
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = chartData.map((data, index) => {
      const x = paddingLeft + (index / Math.max(chartData.length - 1, 1)) * chartWidth;
      const y = height - paddingBottom - (data.value / maxVal) * chartHeight;
      return { x, y, label: data.label, value: data.value };
    });

    // Create line path definition
    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        linePath += ` L ${points[i].x} ${points[i].y}`;
      }

      // Close path for area gradient fill
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      points,
      linePath,
      areaPath,
      maxVal,
      chartHeight,
      chartWidth
    };
  }, [chartData]);

  const handleRestockClick = (productId) => {
    if (!isAdminUnlocked) {
      promptAdminLogin(() => {
        restockProduct(productId, 10);
      });
    } else {
      restockProduct(productId, 10);
    }
  };

  return (
    <div className="dashboard-grid fade-in-view">
      {/* Date Filter Bar */}
      <div className="dashboard-filters">
        <div className="filter-btn-group">
          {['Day', 'Week', 'Month'].map(type => (
            <button
              key={type}
              className={`filter-btn ${filterType === type ? 'active' : ''}`}
              onClick={() => handleFilterTypeChange(type)}
            >
              {type === 'Day' ? 'Today' : type === 'Week' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
          <button
            className={`filter-btn ${filterType === 'Custom' ? 'active' : ''}`}
            onClick={() => setFilterType('Custom')}
          >
            Custom Range
          </button>
        </div>

        <div className="custom-range-picker">
          <Calendar size={16} className="text-muted" style={{ marginRight: '4px' }} />
          <input
            type="date"
            className="date-input"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setFilterType('Custom');
            }}
          />
          <span className="text-muted">to</span>
          <input
            type="date"
            className="date-input"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setFilterType('Custom');
            }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">Revenue</span>
            <div className="metric-icon-box revenue">
              <DollarSign size={18} />
            </div>
          </div>
          <span className="metric-value">${metrics.revenue.toFixed(2)}</span>
          <span className="metric-trend trend-up">
            Active Filter Range
          </span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">Drinks Sold</span>
            <div className="metric-icon-box items">
              <Flame size={18} />
            </div>
          </div>
          <span className="metric-value">{metrics.items} qty</span>
          <span className="metric-trend trend-up">
            Across {metrics.transactions} orders
          </span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">Average Order</span>
            <div className="metric-icon-box average">
              <DollarSign size={18} />
            </div>
          </div>
          <span className="metric-value">${metrics.aov.toFixed(2)}</span>
          <span className="metric-trend trend-up">
            Average ticket size
          </span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">Low Stock Alerts</span>
            <div className={`metric-icon-box ${metrics.lowStock > 0 ? 'lowstock' : 'revenue'}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <span className="metric-value">{metrics.lowStock} item(s)</span>
          <span className={`metric-trend ${metrics.lowStock > 0 ? 'trend-down' : 'trend-up'}`}>
            {metrics.lowStock > 0 ? 'Require restocking' : 'All items well stocked'}
          </span>
        </div>
      </div>

      {/* Main Panels: Chart & Inventory */}
      <div className="dashboard-layout-row">
        {/* Sales Chart Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="dashboard-panel-header">
            <h3>Revenue Over Time</h3>
            <span className="live-clock" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {filterType === 'Custom' ? 'Custom Filter' : `${filterType} sales`}
            </span>
          </div>
          <div className="chart-container">
            {chartData.length === 0 || !svgParams ? (
              <div className="chart-empty-state">
                <BarChart3 size={40} style={{ opacity: 0.2 }} />
                <p>No sales recorded in this period</p>
              </div>
            ) : (
              <div className="chart-wrapper">
                {hoveredDataPoint && (
                  <div 
                    className="chart-tooltip"
                    style={{
                      transform: `translate(${hoveredDataPoint.x - 45}px, ${hoveredDataPoint.y - 45}px)`
                    }}
                  >
                    <div>{hoveredDataPoint.label}</div>
                    <div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      ${hoveredDataPoint.value.toFixed(2)}
                    </div>
                  </div>
                )}
                <svg className="svg-chart" viewBox={`0 0 ${svgParams.width} ${svgParams.height}`}>
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45"/>
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = svgParams.paddingTop + ratio * svgParams.chartHeight;
                    return (
                      <line 
                        key={ratio}
                        x1={svgParams.paddingLeft}
                        y1={y}
                        x2={svgParams.width - svgParams.paddingRight}
                        y2={y}
                        className="chart-grid-line"
                      />
                    );
                  })}

                  {/* Area fill */}
                  {svgParams.areaPath && (
                    <path d={svgParams.areaPath} className="chart-area" />
                  )}

                  {/* Line draw */}
                  {svgParams.linePath && (
                    <path d={svgParams.linePath} className="chart-line" />
                  )}

                  {/* Hoverable Points */}
                  {svgParams.points.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={4}
                      className="chart-dot"
                      onMouseEnter={() => setHoveredDataPoint(pt)}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    />
                  ))}

                  {/* Y Axis Labels */}
                  {[0, 0.5, 1].map((ratio) => {
                    const val = (1 - ratio) * svgParams.maxVal;
                    const y = svgParams.paddingTop + ratio * svgParams.chartHeight + 4;
                    return (
                      <text
                        key={ratio}
                        x={svgParams.paddingLeft - 10}
                        y={y}
                        className="chart-axis-text y-axis"
                      >
                        ${val.toFixed(0)}
                      </text>
                    );
                  })}

                  {/* X Axis Labels (Sampled to avoid overcrowding) */}
                  {svgParams.points
                    .filter((_, idx) => {
                      const totalPoints = svgParams.points.length;
                      if (totalPoints <= 7) return true;
                      if (totalPoints <= 15) return idx % 2 === 0;
                      return idx % Math.ceil(totalPoints / 7) === 0 || idx === totalPoints - 1;
                    })
                    .map((pt, i) => (
                      <text
                        key={i}
                        x={pt.x}
                        y={svgParams.height - 10}
                        className="chart-axis-text"
                      >
                        {pt.label}
                      </text>
                    ))}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Tracker Table */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="dashboard-panel-header">
            <h3>Inventory Status</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Stock & sales today
            </span>
          </div>

          <div className="inventory-container">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Drink</th>
                    <th>Today Sold</th>
                    <th>Stock Left</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryStats.map((item) => {
                    let statusClass = 'instock';
                    let statusLabel = 'In Stock';
                    
                    if (item.currentStock === 0) {
                      statusClass = 'out';
                      statusLabel = 'Out of Stock';
                    } else if (item.currentStock <= 5) {
                      statusClass = 'lowstock';
                      statusLabel = 'Low Stock';
                    }

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.25rem' }}>{item.image}</span>
                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 500 }}>
                          {item.soldToday}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          {item.currentStock}
                        </td>
                        <td>
                          <span className={`stock-status-badge ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <button
                            className="quick-action-btn"
                            onClick={() => handleRestockClick(item.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {!isAdminUnlocked && <Lock size={10} style={{ opacity: 0.5 }} />}
                            +10
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
