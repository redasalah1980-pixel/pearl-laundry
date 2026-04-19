function renderForecast() {
  var wrap = document.getElementById('forecast-wrap');
  if (!wrap) return;

  // Init selectors
  var yrEl = document.getElementById('fc-year');
  var mEl  = document.getElementById('fc-month');
  var view = document.getElementById('fc-view')?.value || 'month';

  if (yrEl && yrEl.options.length === 0) buildYearOpts(yrEl, CY);
  if (mEl && mEl.options.length === 0) {
    MONTH_NAMES.forEach(function(mn, i) {
      var o = document.createElement('option');
      o.value = i+1; o.textContent = mn;
      if (i+1 === (new Date().getMonth()+1)) o.selected = true;
      mEl.appendChild(o);
    });
  }

  // Show/hide month selector
  var mWrap = document.getElementById('fc-month-wrap');
  if (mWrap) mWrap.style.display = (view === 'year' || view === 'budget') ? 'none' : 'flex';

  var y   = parseInt(yrEl?.value || CY);
  var m   = parseInt(mEl?.value || new Date().getMonth()+1);
  var prevY = y - 1;

  if (view === 'month') wrap.innerHTML = renderMonthForecast(y, m, prevY);
  else if (view === 'next') {
    var nextM = m === 12 ? 1 : m + 1;
    var nextY = m === 12 ? y + 1 : y;
    wrap.innerHTML = renderNextMonthForecast(y, m, nextM, nextY, prevY);
  }
  else if (view === 'budget') { renderAnnualBudget(y); return; }
  else if (view === 'plan')  renderPlanNextYear(y);
  else if (view === 'whatif') renderWhatIf(y, m);
  else wrap.innerHTML = renderYearForecast(y, prevY);
}

// ── Section 1: This Month Forecast ──
function renderMonthForecast(y, m, prevY) {
  var nd = dim(y, m);
  var today = new Date();
  var isCurrentMonth = (y === today.getFullYear() && m === today.getMonth()+1);
  var daysSoFar = isCurrentMonth ? today.getDate() : nd;
  var actualRev = getMonthRevenue(y, m);
  var activeDays = getActiveDays(y, m);
  var avgPerDay = activeDays > 0 ? actualRev / activeDays : 0;
  var daysRemaining = isCurrentMonth ? Math.max(0, nd - today.getDate()) : 0;
  var tgt = loadTarget(y, m);
  var tgtRev = tgt && tgt.revenue ? tgt.revenue : 0;

  // Last year same month
  var lastYearRev = getMonthRevenue(prevY, m);
  var yoyGrowth = lastYearRev > 0 ? ((actualRev - lastYearRev) / lastYearRev * 100) : null;

  // Occupancy data
  var avgOcc = getAvgOccupancy(y, m);
  var revPOR = getRevPOR(y, m);

  // Forecast methods
  var fcPace = activeDays > 0 ? (actualRev / activeDays) * nd : 0; // pace-based
  var fcYoY  = lastYearRev > 0 ? lastYearRev * (1 + (yoyGrowth||0)/100) : 0; // yoy-based

  // Weighted forecast — pace is more reliable if >50% days entered
  var reliability = activeDays / nd;
  var fcFinal;
  if (reliability >= 0.5) {
    fcFinal = fcPace * 0.7 + (fcYoY > 0 ? fcYoY * 0.3 : fcPace * 0.3);
  } else if (fcYoY > 0) {
    fcFinal = fcPace * 0.3 + fcYoY * 0.7;
  } else {
    fcFinal = fcPace;
  }

  var hasOccData = avgOcc > 0;
  var hasLastYear = lastYearRev > 0;
  var conf = getConfidence(activeDays, nd, hasOccData, hasLastYear);

  // Needed per day to hit target
  var neededPerDay = (tgtRev > 0 && daysRemaining > 0) ? Math.max(0, (tgtRev - actualRev) / daysRemaining) : 0;

  var html = '';

  // ── Header banner ──
  html += '<div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:16px;padding:22px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
    '<div>' +
      '<div style="font-size:18px;font-weight:800;color:#c9a84c">' + MONTH_NAMES[m-1] + ' ' + y + ' — Month Forecast</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:4px">' +
        activeDays + ' of ' + nd + ' days entered · ' +
        (isCurrentMonth ? daysRemaining + ' days remaining' : 'Month complete') +
      '</div>' +
    '</div>' +
    '<div style="display:inline-flex;align-items:center;gap:6px;background:' + conf.bg + ';color:' + conf.col + ';padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800">' +
      '🎯 ' + conf.label + ' Confidence' +
    '</div>' +
  '</div>';

  // ── Main forecast number ──
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:20px">';

  // Forecasted close
  var pctOfTgt = tgtRev > 0 ? (fcFinal / tgtRev * 100) : 0;
  var fcCol = pctOfTgt >= 100 ? '#16a34a' : pctOfTgt >= 75 ? '#d97706' : '#dc2626';
  html += '<div style="background:linear-gradient(135deg,' + (pctOfTgt>=100?'#15803d,#16a34a':pctOfTgt>=75?'#b45309,#d97706':'#b91c1c,#dc2626') + ');border-radius:14px;padding:20px;box-shadow:0 6px 20px rgba(0,0,0,.2)">' +
    '<div style="font-size:10px;font-weight:800;color:rgba(255,255,255,.7);letter-spacing:1px;margin-bottom:8px">FORECASTED MONTH CLOSE</div>' +
    '<div style="font-size:26px;font-weight:900;color:#fff">' + fmtMoney(fcFinal) + '</div>' +
    (tgtRev > 0 ? '<div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:6px">' + (pctOfTgt>=100?'🎉 '+((pctOfTgt-100).toFixed(1))+'% above target':'📊 '+pctOfTgt.toFixed(1)+'% of target') + '</div>' : '') +
  '</div>';

  // Actual so far
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px">' +
    '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">ACTUAL SO FAR</div>' +
    '<div style="font-size:24px;font-weight:900;color:#0d1b2e">' + fmtMoney(actualRev) + '</div>' +
    '<div style="font-size:11px;color:#94a3b8;margin-top:4px">' + activeDays + ' active days · ' + fmtMoney(avgPerDay) + '/day avg</div>' +
  '</div>';

  // Last year comparison
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px">' +
    '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">' + MONTH_NAMES[m-1] + ' ' + prevY + ' ACTUAL</div>' +
    '<div style="font-size:24px;font-weight:900;color:#0d1b2e">' + (lastYearRev > 0 ? fmtMoney(lastYearRev) : '—') + '</div>' +
    (yoyGrowth !== null ? '<div style="font-size:12px;font-weight:800;color:' + (yoyGrowth>=0?'#16a34a':'#dc2626') + ';margin-top:4px">' + (yoyGrowth>=0?'↑ +':'↓ ') + yoyGrowth.toFixed(1) + '% YoY</div>' : '<div style="font-size:11px;color:#94a3b8;margin-top:4px">No data for ' + prevY + '</div>') +
  '</div>';

  // Target
  if (tgtRev > 0) {
    html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px">' +
      '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">MONTHLY TARGET</div>' +
      '<div style="font-size:24px;font-weight:900;color:#0d1b2e">' + fmtMoney(tgtRev) + '</div>' +
      (isCurrentMonth && neededPerDay > 0 ? '<div style="font-size:11px;font-weight:700;color:#dc2626;margin-top:4px">Need ' + fmtMoney(neededPerDay) + '/day</div>' : '') +
    '</div>';
  }

  html += '</div>';

  // ── Forecast breakdown ──
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:20px">' +
    '<div style="background:#0d1b2e;padding:14px 20px;font-size:13px;font-weight:800;color:#c9a84c">📐 Forecast Methodology</div>' +
    '<div style="padding:20px">';

  // Method 1: Pace
  var paceConf = Math.min(100, Math.round(reliability * 100));
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">' +
    '<div>' +
      '<div style="font-size:13px;font-weight:700;color:#0d1b2e">📈 Current Pace</div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:2px">Avg ' + fmtMoney(avgPerDay) + '/day × ' + nd + ' days</div>' +
    '</div>' +
    '<div style="text-align:right">' +
      '<div style="font-size:15px;font-weight:800;color:#0369a1">' + (fcPace > 0 ? fmtMoney(fcPace) : '—') + '</div>' +
      '<div style="font-size:10px;color:#94a3b8">' + paceConf + '% data entered · Weight: ' + (reliability>=0.5?'70%':'30%') + '</div>' +
    '</div>' +
  '</div>';

  // Method 2: YoY
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">' +
    '<div>' +
      '<div style="font-size:13px;font-weight:700;color:#0d1b2e">📅 Year-over-Year Trend</div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:2px">' + MONTH_NAMES[m-1] + ' ' + prevY + ' adjusted by ' + (yoyGrowth !== null ? (yoyGrowth>=0?'+':'')+yoyGrowth.toFixed(1)+'%' : 'N/A') + '</div>' +
    '</div>' +
    '<div style="text-align:right">' +
      '<div style="font-size:15px;font-weight:800;color:#7c3aed">' + (fcYoY > 0 ? fmtMoney(fcYoY) : '—') + '</div>' +
      '<div style="font-size:10px;color:#94a3b8">Weight: ' + (reliability>=0.5?'30%':'70%') + '</div>' +
    '</div>' +
  '</div>';

  // Method 3: Occupancy
  if (revPOR > 0 && avgOcc > 0) {
    var settings2 = loadBenchSettings();
    var totalRooms2 = settings2.totalRooms || 0;
    var fcOcc = revPOR * (totalRooms2 * avgOcc / 100) * nd;
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">' +
      '<div>' +
        '<div style="font-size:13px;font-weight:700;color:#0d1b2e">🏨 Occupancy-Based</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:2px">' + fmtMoney(revPOR) + '/room × ' + (totalRooms2*(avgOcc/100)).toFixed(0) + ' avg rooms × ' + nd + ' days</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:15px;font-weight:800;color:#0891b2">' + fmtMoney(fcOcc) + '</div>' +
        '<div style="font-size:10px;color:#94a3b8">Avg occ: ' + avgOcc.toFixed(1) + '%</div>' +
      '</div>' +
    '</div>';
  }

  // Weighted result
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;background:#f8fafc;margin:0 -20px;padding:14px 20px;margin-top:8px;border-radius:0 0 0 0">' +
    '<div>' +
      '<div style="font-size:14px;font-weight:800;color:#0d1b2e">🎯 Weighted Forecast</div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:2px">Combined using available data confidence</div>' +
    '</div>' +
    '<div style="text-align:right">' +
      '<div style="font-size:20px;font-weight:900;color:' + fcCol + '">' + fmtMoney(fcFinal) + '</div>' +
      '<div style="font-size:10px;color:' + conf.col + ';font-weight:700">' + conf.label + ' confidence</div>' +
    '</div>' +
  '</div>';

  html += '</div></div>';

  // ── Day-by-day projection for remaining days ──
  if (isCurrentMonth && daysRemaining > 0 && avgPerDay > 0) {
    html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:20px">' +
      '<div style="background:#0d1b2e;padding:14px 20px;font-size:13px;font-weight:800;color:#c9a84c">📅 Projected Remaining Days (based on current avg)</div>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
      '<thead><tr style="background:#f8fafc">' +
        '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px">DAY</th>' +
        '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">PROJECTED REV</th>' +
        '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">RUNNING TOTAL</th>' +
        '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">% OF TARGET</th>' +
      '</tr></thead><tbody>';

    var running = actualRev;
    var startDay = today.getDate() + 1;
    for (var d = startDay; d <= nd; d++) {
      running += avgPerDay;
      var pct2 = tgtRev > 0 ? (running / tgtRev * 100) : 0;
      var rowCol = pct2 >= 100 ? '#f0fdf4' : d % 2 === 0 ? '#f8fafc' : '#fff';
      html += '<tr style="background:' + rowCol + '">' +
        '<td style="padding:8px 12px;font-weight:700;color:#0d1b2e">' + DAY_NAMES[new Date(y,m-1,d).getDay()].slice(0,3) + ' ' + d + '</td>' +
        '<td style="padding:8px 12px;text-align:right;color:#0369a1;font-weight:600">' + fmtMoney(avgPerDay) + '</td>' +
        '<td style="padding:8px 12px;text-align:right;font-weight:800;color:#0d1b2e">' + fmtMoney(running) + '</td>' +
        '<td style="padding:8px 12px;text-align:right;font-weight:700;color:' + (pct2>=100?'#16a34a':pct2>=75?'#d97706':'#dc2626') + '">' +
          (tgtRev > 0 ? (pct2>=100?'🎉 ':'')+pct2.toFixed(1)+'%' : '—') +
        '</td>' +
      '</tr>';
    }
    html += '</tbody></table></div></div>';
  }

  // ── Department forecast ──
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden">' +
    '<div style="background:#0d1b2e;padding:14px 20px;font-size:13px;font-weight:800;color:#c9a84c">🏢 Department Forecast</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#f8fafc">' +
      '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px">DEPARTMENT</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">ACTUAL SO FAR</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">PROJECTED CLOSE</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">' + MONTH_NAMES[m-1] + ' ' + prevY + '</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">YoY</th>' +
    '</tr></thead><tbody>';

  var deptColors2 = ['#0284c7','#16a34a','#0891b2','#7c3aed','#d97706','#ea580c'];
  DEPT_KEYS.forEach(function(dept, idx) {
    var dActual = monthTotals(y, m).byDept[dept]?.qr || 0;
    var dAct2 = getActiveDays(y, m);
    var dAvg = dAct2 > 0 ? dActual / dAct2 : 0;
    var dFc = dAvg * nd;
    var dLastY = monthTotals(prevY, m).byDept[dept]?.qr || 0;
    var dYoY = dLastY > 0 ? ((dFc - dLastY) / dLastY * 100) : null;
    var col3 = deptColors2[idx % deptColors2.length];
    html += '<tr style="background:' + (idx%2===0?'#fff':'#f8fafc') + '">' +
      '<td style="padding:9px 12px;font-weight:700;color:#0d1b2e"><span style="color:' + col3 + '">' + (DEPT_ICONS[dept]||'') + '</span> ' + dept + '</td>' +
      '<td style="padding:9px 12px;text-align:right;color:#0369a1;font-weight:600">' + (dActual>0?fmtMoney(dActual):'—') + '</td>' +
      '<td style="padding:9px 12px;text-align:right;font-weight:800;color:' + col3 + '">' + (dFc>0?fmtMoney(dFc):'—') + '</td>' +
      '<td style="padding:9px 12px;text-align:right;color:#64748b">' + (dLastY>0?fmtMoney(dLastY):'—') + '</td>' +
      '<td style="padding:9px 12px;text-align:right;font-weight:700;color:' + (dYoY===null?'#94a3b8':dYoY>=0?'#16a34a':'#dc2626') + '">' + (dYoY!==null?(dYoY>=0?'↑ +':'↓ ')+Math.abs(dYoY).toFixed(1)+'%':'—') + '</td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';

  return html;
}

// ── Section 2: Next Month Forecast ──
function renderNextMonthForecast(y, m, nextM, nextY, prevY) {
  var lastYearNextM = getMonthRevenue(prevY, nextM);
  var lastYearThisM = getMonthRevenue(prevY, m);
  var thisYearThisM = getMonthRevenue(y, m);
  var activeDays = getActiveDays(y, m);
  var nd = dim(y, m);

  // Growth rate this year vs last year this month
  var yoyGrowthRate = lastYearThisM > 0 ? ((thisYearThisM / nd * dim(y,m)) - lastYearThisM) / lastYearThisM * 100 : 0;

  // Seasonal factor: next month last year vs this month last year
  var seasonalFactor = (lastYearNextM > 0 && lastYearThisM > 0) ? lastYearNextM / lastYearThisM : 1;

  // Current month pace
  var avgPerDay = activeDays > 0 ? thisYearThisM / activeDays : 0;
  var ndNext = dim(nextY, nextM);

  // Method 1: Seasonal adjustment
  var fcSeasonal = lastYearNextM > 0 ? lastYearNextM * (1 + yoyGrowthRate / 100) : 0;
  // Method 2: Pace + seasonal
  var fcPaceSeasonal = avgPerDay * nd * seasonalFactor;
  // Weighted
  var fcFinal = fcSeasonal > 0 ? (fcSeasonal * 0.6 + fcPaceSeasonal * 0.4) : fcPaceSeasonal;

  var tgtNext = loadTarget(nextY, nextM);
  var tgtRev = tgtNext && tgtNext.revenue ? tgtNext.revenue : 0;
  var pctOfTgt = tgtRev > 0 ? (fcFinal / tgtRev * 100) : 0;
  var fcCol = pctOfTgt >= 100 ? '#16a34a' : pctOfTgt >= 75 ? '#d97706' : '#dc2626';

  var hasLY = lastYearNextM > 0;
  var conf = getConfidence(activeDays, nd, false, hasLY);

  var html = '';

  // Header
  html += '<div style="background:linear-gradient(135deg,#4c1d95,#6d28d9);border-radius:16px;padding:22px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
    '<div>' +
      '<div style="font-size:18px;font-weight:800;color:#fff">' + MONTH_NAMES[nextM-1] + ' ' + nextY + ' — Next Month Forecast</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:4px">Based on ' + MONTH_NAMES[m-1] + ' ' + y + ' performance + seasonal trends</div>' +
    '</div>' +
    '<div style="display:inline-flex;align-items:center;gap:6px;background:' + conf.bg + ';color:' + conf.col + ';padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800">' +
      '🎯 ' + conf.label + ' Confidence' +
    '</div>' +
  '</div>';

  // Main cards
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:20px">';

  html += '<div style="background:linear-gradient(135deg,#4c1d95,#6d28d9);border-radius:14px;padding:20px;box-shadow:0 6px 20px rgba(109,40,217,.25)">' +
    '<div style="font-size:10px;font-weight:800;color:rgba(255,255,255,.7);letter-spacing:1px;margin-bottom:8px">FORECAST ' + MONTH_NAMES[nextM-1].toUpperCase() + ' ' + nextY + '</div>' +
    '<div style="font-size:26px;font-weight:900;color:#fff">' + fmtMoney(fcFinal) + '</div>' +
    (tgtRev > 0 ? '<div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:6px">' + pctOfTgt.toFixed(1) + '% of target</div>' : '') +
  '</div>';

  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px">' +
    '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">' + MONTH_NAMES[nextM-1].toUpperCase() + ' ' + prevY + ' ACTUAL</div>' +
    '<div style="font-size:24px;font-weight:900;color:#0d1b2e">' + (lastYearNextM>0?fmtMoney(lastYearNextM):'—') + '</div>' +
    '<div style="font-size:11px;color:#94a3b8;margin-top:4px">' + (lastYearNextM>0?'Last year reference':'No historical data') + '</div>' +
  '</div>';

  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px">' +
    '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">SEASONAL FACTOR</div>' +
    '<div style="font-size:24px;font-weight:900;color:#0d1b2e">' + (seasonalFactor !== 1 ? (seasonalFactor > 1 ? '↑ ' : '↓ ') + (seasonalFactor*100-100).toFixed(1) + '%' : 'Neutral') + '</div>' +
    '<div style="font-size:11px;color:#94a3b8;margin-top:4px">' + MONTH_NAMES[nextM-1] + ' vs ' + MONTH_NAMES[m-1] + ' (' + prevY + ')</div>' +
  '</div>';

  if (tgtRev > 0) {
    html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px">' +
      '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">TARGET ' + MONTH_NAMES[nextM-1].toUpperCase() + '</div>' +
      '<div style="font-size:24px;font-weight:900;color:' + fcCol + '">' + fmtMoney(tgtRev) + '</div>' +
      '<div style="font-size:11px;color:' + fcCol + ';font-weight:700;margin-top:4px">' + (pctOfTgt>=100?'🎉 On track':'Need ' + fmtMoney(Math.max(0,tgtRev-fcFinal)) + ' more') + '</div>' +
    '</div>';
  }

  html += '</div>';

  // Methodology
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:20px">' +
    '<div style="background:#4c1d95;padding:14px 20px;font-size:13px;font-weight:800;color:#fff">📐 Forecast Methodology</div>' +
    '<div style="padding:20px">';

  html += '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">' +
    '<div><div style="font-size:13px;font-weight:700;color:#0d1b2e">📅 Seasonal + YoY Growth</div>' +
    '<div style="font-size:11px;color:#64748b">' + MONTH_NAMES[nextM-1] + ' ' + prevY + ' × (1 + ' + yoyGrowthRate.toFixed(1) + '% growth)</div></div>' +
    '<div style="text-align:right"><div style="font-size:15px;font-weight:800;color:#7c3aed">' + (fcSeasonal>0?fmtMoney(fcSeasonal):'—') + '</div>' +
    '<div style="font-size:10px;color:#94a3b8">Weight: 60%</div></div></div>';

  html += '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">' +
    '<div><div style="font-size:13px;font-weight:700;color:#0d1b2e">📈 Pace × Seasonal Factor</div>' +
    '<div style="font-size:11px;color:#64748b">' + fmtMoney(avgPerDay) + '/day × ' + nd + ' days × ' + seasonalFactor.toFixed(2) + ' factor</div></div>' +
    '<div style="text-align:right"><div style="font-size:15px;font-weight:800;color:#0369a1">' + fmtMoney(fcPaceSeasonal) + '</div>' +
    '<div style="font-size:10px;color:#94a3b8">Weight: 40%</div></div></div>';

  html += '<div style="display:flex;justify-content:space-between;padding:14px 0;background:#f8fafc;margin:8px -20px 0;padding:14px 20px">' +
    '<div><div style="font-size:14px;font-weight:800;color:#0d1b2e">🎯 Weighted Forecast</div></div>' +
    '<div><div style="font-size:20px;font-weight:900;color:#4c1d95">' + fmtMoney(fcFinal) + '</div></div></div>';

  html += '</div></div>';

  // Suggested daily target
  var suggestedDaily = fcFinal / ndNext;
  html += '<div style="background:#f5f3ff;border:1.5px solid #c4b5fd;border-radius:14px;padding:18px 20px">' +
    '<div style="font-size:13px;font-weight:800;color:#6d28d9;margin-bottom:10px">💡 Planning Insight</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
      '<div style="background:#fff;border-radius:10px;padding:12px">' +
        '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">SUGGESTED DAILY TARGET</div>' +
        '<div style="font-size:18px;font-weight:800;color:#7c3aed">' + fmtMoney(suggestedDaily) + '</div>' +
        '<div style="font-size:11px;color:#94a3b8;margin-top:2px">To reach forecast of ' + fmtMoney(fcFinal) + '</div>' +
      '</div>' +
      (tgtRev > 0 ? '<div style="background:#fff;border-radius:10px;padding:12px">' +
        '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">DAILY NEEDED FOR TARGET</div>' +
        '<div style="font-size:18px;font-weight:800;color:' + (tgtRev/ndNext > suggestedDaily ? '#dc2626' : '#16a34a') + '">' + fmtMoney(tgtRev/ndNext) + '</div>' +
        '<div style="font-size:11px;color:#94a3b8;margin-top:2px">' + (tgtRev/ndNext > suggestedDaily ? '⚠️ Higher than forecast' : '✅ Forecast covers target') + '</div>' +
      '</div>' : '') +
    '</div>' +
  '</div>';

  return html;
}

// ── Section 3: Full Year Forecast ──
// ════════════════════════════════════════════════════════════════
//  ANNUAL BUDGET MANAGER
//  Set full-year budget month by month
//  Auto-syncs to monthly revenue targets everywhere
// ════════════════════════════════════════════════════════════════

function renderAnnualBudget(y) {
  var wrap = document.getElementById('planning-wrap') || document.getElementById('forecast-wrap');
  if (!wrap) return;

  var totalBudget = 0, totalActual = 0;
  var months = [];
  for (var m = 1; m <= 12; m++) {
    var tgt    = loadTarget(y, m);
    var budget = tgt ? (tgt.revenue || 0) : 0;
    var actual = monthTotals(y, m).qr;
    totalBudget += budget;
    totalActual += actual;
    months.push({ m: m, budget: budget, actual: actual });
  }

  var today  = new Date();
  var curM   = today.getMonth() + 1;
  var curY   = today.getFullYear();

  wrap.innerHTML = '';

  // ── Header card ──
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:14px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px';
  var yearPct = totalBudget > 0 ? (totalActual / totalBudget * 100).toFixed(1) : '0.0';
  hdr.innerHTML =
    '<div>' +
      '<div style="font-size:18px;font-weight:900;color:#c9a84c;margin-bottom:4px">💰 Annual Budget — ' + y + '</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.6)">Set monthly targets · auto-syncs to dashboard and reports</div>' +
    '</div>' +
    '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
      '<div style="text-align:right">' +
        '<div style="font-size:22px;font-weight:900;color:#fff">' + fmtMoney(totalBudget) + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,.5);letter-spacing:1px">TOTAL BUDGET</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:22px;font-weight:900;color:#c9a84c">' + fmtMoney(totalActual) + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,.5);letter-spacing:1px">ACTUAL SO FAR</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:22px;font-weight:900;color:' + (parseFloat(yearPct)>=100?'#4ade80':'#fbbf24') + '">' + yearPct + '%</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,.5);letter-spacing:1px">YEAR PROGRESS</div>' +
      '</div>' +
    '</div>';
  wrap.appendChild(hdr);

  // ── Quick fill tools ──
  var tools = document.createElement('div');
  tools.style.cssText = 'background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap';
  tools.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:.8px;flex-shrink:0">QUICK FILL</div>' +
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<input type="number" id="budget-annual-total" placeholder="Annual total (e.g. 900000)" min="0" step="1000"' +
        ' style="padding:7px 12px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:13px;font-weight:600;color:#0d1b2e;width:200px;outline:none">' +
      '<button onclick="budgetFillEvenly()" style="padding:7px 14px;background:#eff6ff;border:1.5px solid #bfdbfe;color:#1d4ed8;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">⚖️ Fill Evenly</button>' +
      '<button onclick="budgetApplyGrowth()" style="padding:7px 14px;background:#f0fdf4;border:1.5px solid #86efac;color:#16a34a;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">📈 Apply Growth</button>' +
      '<input type="number" id="budget-growth-rate" placeholder="Growth %" step="0.5" value="5"' +
        ' style="padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:13px;font-weight:600;color:#0d1b2e;width:90px;outline:none">' +
    '</div>' +
    '<button onclick="budgetSaveAll(' + y + ')" style="margin-left:auto;padding:9px 20px;background:linear-gradient(135deg,#0d1b2e,#1e3a5f);color:#c9a84c;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;flex-shrink:0">💾 Save All Targets</button>';
  wrap.appendChild(tools);

  // ── Month table ──
  var card = document.createElement('div');
  card.style.cssText = 'background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden';

  // Table header
  var thead = document.createElement('div');
  thead.style.cssText = 'display:grid;grid-template-columns:120px 1fr 1fr 1fr 100px;padding:10px 16px;background:#f8fafc;border-bottom:1.5px solid #e2e8f0;gap:0';
  thead.innerHTML =
    '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.8px">MONTH</div>' +
    '<div style="font-size:10px;font-weight:800;color:#1d4ed8;letter-spacing:.8px;text-align:right">BUDGET (QR)</div>' +
    '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.8px;text-align:right">ACTUAL (QR)</div>' +
    '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.8px;text-align:center">PROGRESS</div>' +
    '<div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.8px;text-align:right">STATUS</div>';
  card.appendChild(thead);

  // Month rows
  months.forEach(function(mo) {
    var isPast    = (y < curY) || (y === curY && mo.m < curM);
    var isCurrent = (y === curY && mo.m === curM);
    var isFuture  = (y > curY) || (y === curY && mo.m > curM);
    var pct       = mo.budget > 0 ? Math.min(100, mo.actual / mo.budget * 100) : 0;
    var barCol    = pct >= 100 ? '#16a34a' : pct >= 75 ? '#d97706' : pct > 0 ? '#dc2626' : '#e2e8f0';
    var rowBg     = isCurrent ? '#fffbeb' : (mo.m % 2 === 0 ? '#f8fafc' : '#fff');

    var row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:120px 1fr 1fr 1fr 100px;padding:10px 16px;border-bottom:1px solid #f1f5f9;align-items:center;gap:0;background:' + rowBg;

    // Month name
    var mnDiv = document.createElement('div');
    mnDiv.style.cssText = 'font-size:13px;font-weight:' + (isCurrent?'800':'600') + ';color:#0d1b2e;display:flex;align-items:center;gap:6px';
    mnDiv.innerHTML = MONTH_NAMES[mo.m-1] + (isCurrent?' <span style="font-size:9px;background:#c9a84c;color:#0d1b2e;padding:1px 6px;border-radius:8px;font-weight:700">NOW</span>':'');
    row.appendChild(mnDiv);

    // Budget input
    var budDiv = document.createElement('div');
    budDiv.style.cssText = 'text-align:right';
    var inp = document.createElement('input');
    inp.type = 'number';
    inp.id   = 'budget-inp-' + mo.m;
    inp.min  = '0';
    inp.step = '1000';
    inp.value = mo.budget > 0 ? mo.budget : '';
    inp.placeholder = '0';
    inp.style.cssText = 'width:130px;padding:6px 10px;border:1.5px solid ' + (mo.budget>0?'#c9a84c':'#e2e8f0') + ';border-radius:7px;font-size:14px;font-weight:700;color:#0d1b2e;text-align:right;outline:none;background:' + (mo.budget>0?'#fffbeb':'#fff');
    inp.onfocus = function(){ this.style.borderColor='#c9a84c'; this.style.background='#fffbeb'; };
    inp.onblur  = function(){ if(!this.value){ this.style.borderColor='#e2e8f0'; this.style.background='#fff'; } };
    inp.onkeydown = (function(m_){ return function(e){ if(e.key==='Enter'){ budgetSaveMonth(' + y + ',m_); this.blur(); } }; })(mo.m);
    budDiv.appendChild(inp);
    row.appendChild(budDiv);

    // Actual
    var actDiv = document.createElement('div');
    actDiv.style.cssText = 'text-align:right;font-size:13px;font-weight:' + (mo.actual>0?'700':'400') + ';color:' + (mo.actual>0?'#0d1b2e':'#94a3b8');
    actDiv.textContent = mo.actual > 0 ? fmtMoney(mo.actual) : (isFuture ? '—' : '0.00');
    row.appendChild(actDiv);

    // Progress bar
    var progDiv = document.createElement('div');
    progDiv.style.cssText = 'padding:0 12px';
    if (mo.budget > 0) {
      var barWrap = document.createElement('div');
      barWrap.style.cssText = 'background:#f1f5f9;border-radius:10px;height:8px;overflow:hidden;margin-bottom:3px';
      var fill = document.createElement('div');
      fill.style.cssText = 'background:' + barCol + ';height:100%;width:' + pct.toFixed(1) + '%;border-radius:10px;transition:width .4s';
      barWrap.appendChild(fill);
      var pctLbl = document.createElement('div');
      pctLbl.style.cssText = 'font-size:10px;color:#64748b;text-align:center';
      pctLbl.textContent = mo.actual > 0 ? pct.toFixed(1) + '%' : (isFuture ? '—' : '0%');
      progDiv.appendChild(barWrap);
      progDiv.appendChild(pctLbl);
    } else {
      progDiv.innerHTML = '<div style="font-size:10px;color:#94a3b8;text-align:center">No budget</div>';
    }
    row.appendChild(progDiv);

    // Status badge
    var statDiv = document.createElement('div');
    statDiv.style.cssText = 'text-align:right';
    var badge = '';
    if (!mo.budget) {
      badge = '<span style="font-size:10px;color:#94a3b8">Not set</span>';
    } else if (isFuture) {
      badge = '<span style="font-size:10px;font-weight:700;color:#64748b">Upcoming</span>';
    } else if (isCurrent) {
      badge = '<span style="font-size:10px;font-weight:700;color:#d97706">🔄 In progress</span>';
    } else if (pct >= 100) {
      badge = '<span style="font-size:10px;font-weight:700;color:#16a34a">✅ ' + pct.toFixed(1) + '%</span>';
    } else {
      badge = '<span style="font-size:10px;font-weight:700;color:#dc2626">⚠️ ' + pct.toFixed(1) + '%</span>';
    }
    statDiv.innerHTML = badge;
    row.appendChild(statDiv);

    card.appendChild(row);
  });

  // Total row
  var totalRow = document.createElement('div');
  totalRow.style.cssText = 'display:grid;grid-template-columns:120px 1fr 1fr 1fr 100px;padding:12px 16px;background:#0d1b2e;gap:0;align-items:center';
  var yearActPct = totalBudget > 0 ? (totalActual/totalBudget*100).toFixed(1) : '—';
  totalRow.innerHTML =
    '<div style="font-size:13px;font-weight:800;color:#c9a84c">FULL YEAR</div>' +
    '<div style="text-align:right;font-size:15px;font-weight:900;color:#c9a84c">' + fmtMoney(totalBudget) + '</div>' +
    '<div style="text-align:right;font-size:15px;font-weight:900;color:#fff">' + fmtMoney(totalActual) + '</div>' +
    '<div style="padding:0 12px;font-size:13px;font-weight:800;color:' + (parseFloat(yearActPct)>=100?'#4ade80':'#fbbf24') + ';text-align:center">' + yearActPct + (yearActPct!=='—'?'%':'') + '</div>' +
    '<div style="text-align:right;font-size:11px;color:rgba(255,255,255,.6)">' + (totalBudget>0?'Budget set':'—') + '</div>';
  card.appendChild(totalRow);

  wrap.appendChild(card);

  // Help note
  var note = document.createElement('div');
  note.style.cssText = 'margin-top:12px;padding:10px 16px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:9px;font-size:12px;color:#1d4ed8;font-weight:600';
  note.innerHTML = '💡 <strong>Tip:</strong> Budgets set here automatically become the monthly revenue targets on the Dashboard. No need to set them separately. Changes save to Firebase and sync to all devices.';
  wrap.appendChild(note);
}

// ── Save all 12 months at once ──
function budgetSaveAll(y) {
  var saved = 0;
  for (var m = 1; m <= 12; m++) {
    var inp = document.getElementById('budget-inp-' + m);
    if (!inp) continue;
    var val = parseFloat(inp.value) || 0;
    if (val > 0) {
      saveTarget(y, m, { revenue: val });
      saved++;
    }
  }
  // Refresh dashboard target if on dashboard
  invalidateTabCache('dashboard');
  if (curTab === 'dashboard' && typeof renderTargetBar === 'function') {
    var dashM = parseInt(document.getElementById('dash-month')?.value || new Date().getMonth()+1);
    renderTargetBar(monthTotals(CY, dashM).qr, dashM);
  }
  renderAnnualBudget(y);
  toast('✅ ' + saved + ' monthly targets saved — dashboard updated', 'ok');
}

// ── Save single month ──
function budgetSaveMonth(y, m) {
  var inp = document.getElementById('budget-inp-' + m);
  if (!inp) return;
  var val = parseFloat(inp.value) || 0;
  if (val > 0) {
    saveTarget(y, m, { revenue: val });
    toast('✅ ' + MONTH_NAMES[m-1] + ' target saved: ' + fmtMoney(val), 'ok');
    invalidateTabCache('dashboard');
  }
}

// ── Fill evenly: divide annual total across 12 months ──
function budgetFillEvenly() {
  var totalInp = document.getElementById('budget-annual-total');
  var total = parseFloat(totalInp?.value) || 0;
  if (total <= 0) { toast('⚠️ Enter an annual total first', 'err'); return; }
  var monthly = Math.round(total / 12);
  for (var m = 1; m <= 12; m++) {
    var inp = document.getElementById('budget-inp-' + m);
    if (inp) {
      inp.value = monthly;
      inp.style.borderColor = '#c9a84c';
      inp.style.background  = '#fffbeb';
    }
  }
  toast('✅ ' + fmtMoney(monthly) + '/month filled — click 💾 Save All to confirm', 'ok');
}

// ── Apply growth rate from a base month or evenly ──
function budgetApplyGrowth() {
  var growthInp = document.getElementById('budget-growth-rate');
  var growth = parseFloat(growthInp?.value) || 5;
  var totalInp = document.getElementById('budget-annual-total');
  var base = parseFloat(totalInp?.value) || 0;

  if (base <= 0) {
    // No total entered — apply growth to existing budget values
    var found = false;
    for (var m = 1; m <= 12; m++) {
      var inp = document.getElementById('budget-inp-' + m);
      if (inp && parseFloat(inp.value) > 0) {
        var newVal = Math.round(parseFloat(inp.value) * (1 + growth/100));
        inp.value = newVal;
        inp.style.borderColor = '#16a34a';
        inp.style.background  = '#f0fdf4';
        found = true;
      }
    }
    if (!found) { toast('⚠️ Enter an annual total or existing budget values first', 'err'); return; }
    toast('✅ ' + growth + '% growth applied to existing values — click 💾 Save All to confirm', 'ok');
  } else {
    // Use annual total as base, distribute with seasonal weights
    var weights = [0.078, 0.072, 0.085, 0.082, 0.083, 0.082, 0.088, 0.090, 0.086, 0.085, 0.078, 0.081];
    for (var m2 = 1; m2 <= 12; m2++) {
      var monthBudget = Math.round(base * weights[m2-1]);
      var inp2 = document.getElementById('budget-inp-' + m2);
      if (inp2) {
        inp2.value = monthBudget;
        inp2.style.borderColor = '#16a34a';
        inp2.style.background  = '#f0fdf4';
      }
    }
    toast('✅ ' + fmtMoney(base) + ' distributed with seasonal weights — click 💾 Save All to confirm', 'ok');
  }
}


// ════════════════════════════════════════════════════════════════
//  2025 HISTORICAL DATA IMPORT
//  P&L figures distributed evenly across days per month
// ════════════════════════════════════════════════════════════════

// 2025 P&L Finance figures — official source
var _IMPORT_2025_PL = {
  1:  83076.90,   // January
  2:  73029.02,   // February
  3:  74253.05,   // March
  4:  102806.95,  // April
  5:  96212.90,   // May
  6:  81532.50,   // June
  7:  73347.10,   // July
  8:  68247.70,   // August
  9:  67433.15,   // September
  10: 92603.44,   // October
  11: 97158.70,   // November
  12: 88097.05    // December
};

// 2025 department split percentages (from actual data)
var _IMPORT_2025_DEPT_PCT = {
  'Rooms Linen': 0.4224,
  'F&B':         0.1056,
  'Spa & Pool':  0.1888,
  'Uniform':     0.2673,
  'Others':      0.0124,
  'Dry Cleaning':0.0033
};

// 2025 KG split percentages (from actual KG data)
var _IMPORT_2025_KG_PCT = {
  'Rooms Linen': 0.4435,
  'F&B':         0.0198,
  'Spa & Pool':  0.1624,
  'Uniform':     0.3614,
  'Others':      0.0117,
  'Dry Cleaning':0.0012
};

var MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Render preview table when import panel opens
function renderImportPreview() {
  var rowsEl  = document.getElementById('import-preview-rows');
  var totalEl = document.getElementById('import-total-row');
  if (!rowsEl) return;

  var grandTotal = 0;
  var deptTotals = { 'Rooms Linen':0,'F&B':0,'Spa & Pool':0,'Uniform':0,'Others':0,'Dry Cleaning':0 };
  var html = '';

  for (var m = 1; m <= 12; m++) {
    var monthTotal = _IMPORT_2025_PL[m];
    var bg = m % 2 === 0 ? '#f8fafc' : '#fff';
    var rooms  = monthTotal * _IMPORT_2025_DEPT_PCT['Rooms Linen'];
    var fb     = monthTotal * _IMPORT_2025_DEPT_PCT['F&B'];
    var spa    = monthTotal * _IMPORT_2025_DEPT_PCT['Spa & Pool'];
    var uni    = monthTotal * _IMPORT_2025_DEPT_PCT['Uniform'];
    var oth    = monthTotal * _IMPORT_2025_DEPT_PCT['Others'];
    var dry    = monthTotal * _IMPORT_2025_DEPT_PCT['Dry Cleaning'];
    grandTotal += monthTotal;
    deptTotals['Rooms Linen'] += rooms;
    deptTotals['F&B'] += fb;
    deptTotals['Spa & Pool'] += spa;
    deptTotals['Uniform'] += uni;
    deptTotals['Others'] += oth;
    deptTotals['Dry Cleaning'] += dry;

    html += '<div style="display:grid;grid-template-columns:90px repeat(6,1fr) 110px;padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;background:' + bg + ';gap:4px;align-items:center">' +
      '<div style="font-weight:700;color:#0d1b2e">' + MONTH_NAMES_SHORT[m-1] + '</div>' +
      '<div style="text-align:right;color:#64748b">' + rooms.toFixed(0) + '</div>' +
      '<div style="text-align:right;color:#64748b">' + fb.toFixed(0) + '</div>' +
      '<div style="text-align:right;color:#64748b">' + spa.toFixed(0) + '</div>' +
      '<div style="text-align:right;color:#64748b">' + uni.toFixed(0) + '</div>' +
      '<div style="text-align:right;color:#64748b">' + oth.toFixed(0) + '</div>' +
      '<div style="text-align:right;color:#64748b">' + dry.toFixed(0) + '</div>' +
      '<div style="text-align:right;font-weight:800;color:#0d1b2e">' + monthTotal.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) + '</div>' +
    '</div>';
  }

  rowsEl.innerHTML = html;
  totalEl.innerHTML =
    '<div>TOTAL 2025</div>' +
    '<div style="text-align:right">' + deptTotals['Rooms Linen'].toFixed(0) + '</div>' +
    '<div style="text-align:right">' + deptTotals['F&B'].toFixed(0) + '</div>' +
    '<div style="text-align:right">' + deptTotals['Spa & Pool'].toFixed(0) + '</div>' +
    '<div style="text-align:right">' + deptTotals['Uniform'].toFixed(0) + '</div>' +
    '<div style="text-align:right">' + deptTotals['Others'].toFixed(0) + '</div>' +
    '<div style="text-align:right">' + deptTotals['Dry Cleaning'].toFixed(0) + '</div>' +
    '<div style="text-align:right">' + grandTotal.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) + '</div>';

  checkImportStatus();
}

// Check if 2025 data already exists
function checkImportStatus() {
  var msg = document.getElementById('import-status-msg');
  if (!msg) return;
  // Check for P&L direct import (new method)
  var found = 0;
  var total = 0;
  for (var m = 1; m <= 12; m++) {
    var v = _STORE.getItem(plKey(2025, m));
    if (v !== null) { found++; total += parseFloat(v); }
  }
  if (found > 0) {
    msg.innerHTML = '✅ <strong style="color:#16a34a">2025 P&L data imported</strong> — ' + found + '/12 months · Total QAR ' + total.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) + '. You can re-import to refresh.';
  } else {
    msg.innerHTML = '⚠️ <strong style="color:#d97706">No 2025 data in system</strong> — ready to import.';
  }
}

// Main import function
function runDataImport2025() {
  var btn  = document.getElementById('btn-do-import');
  var prog = document.getElementById('import-progress');
  var res  = document.getElementById('import-result');

  if (!confirm('Import 2025 P&L data as historical baseline?\n\nMonthly totals will match official P&L figures exactly.\n\nContinue?')) return;

  btn.disabled = true;
  btn.style.opacity = '0.5';
  prog.style.display = 'block';
  res.style.display  = 'none';

  setTimeout(function() {
    try {
      var fbPayload = {};

      // Save exact P&L monthly totals — no rounding, no approximation
      for (var m = 1; m <= 12; m++) {
        var monthTotal = _IMPORT_2025_PL[m];
        try { _STORE.setItem(plKey(2025, m), String(monthTotal)); } catch(e2) {}
        fbPayload['pl_' + m] = monthTotal;
      }

      // Save to Firebase
      if (window._fbSaveKey) {
        window._fbSaveKey('pearl/pl_import/2025', fbPayload);
      }

      // Clear all caches
      invalidateMonthTotalsCache();
      invalidateTabCache('analytics');
      invalidateTabCache('forecast');

      btn.disabled = false;
      btn.style.opacity = '1';
      prog.style.display = 'none';
      res.style.display  = 'block';
      res.style.color    = '#16a34a';
      res.innerHTML =
        '✅ <strong>Import complete!</strong> All 12 months saved with exact P&L figures. ' +
        'Total: <strong>QAR 997,798.46</strong>. ' +
        'Go to <strong>Forecast → Full Year</strong> to see YoY comparisons.';
      checkImportStatus();
      toast('✅ 2025 P&L data imported — exact figures', 'ok');

    } catch(e) {
      btn.disabled = false;
      btn.style.opacity = '1';
      prog.style.display = 'none';
      res.style.display  = 'block';
      res.style.color    = '#dc2626';
      res.innerHTML = '❌ Import failed: ' + e.message;
    }
  }, 100);
}


function renderYearForecast(y, prevY) {
  var html = '';

  // Header
  html += '<div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:16px;padding:22px 24px;margin-bottom:20px">' +
    '<div style="font-size:18px;font-weight:800;color:#c9a84c">' + y + ' Full Year Forecast</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:4px">Month-by-month projection based on actual data + YoY trends</div>' +
  '</div>';

  // Summary cards
  var totalActual = 0, totalForecast = 0, monthsWithData = 0;
  var monthData = [];

  for (var m2 = 1; m2 <= 12; m2++) {
    var actual = getMonthRevenue(y, m2);
    var lastY = getMonthRevenue(prevY, m2);
    var activeDays2 = getActiveDays(y, m2);
    var nd2 = dim(y, m2);
    var today2 = new Date();
    var isPast = (y < today2.getFullYear()) || (y === today2.getFullYear() && m2 < today2.getMonth()+1);
    var isCurrent = (y === today2.getFullYear() && m2 === today2.getMonth()+1);
    var avgD = activeDays2 > 0 ? actual / activeDays2 : 0;

    // IMPROVED FORECAST LOGIC:
    // Past months: use actual revenue
    // Current month: project from daily pace × remaining days
    // Future months: use YoY if available, else use current year avg daily pace × days
    var fc;
    if (isPast) {
      fc = actual;
    } else if (isCurrent) {
      fc = avgD > 0 ? avgD * nd2 : 0;
    } else {
      // Future month — prefer YoY, fallback to current pace
      if (lastY > 0) {
        // Apply YoY growth from months we have data for
        var yoyGrowthFactor = (totalActual > 0 && monthsWithData > 0) ? 1.0 : 1.0;
        // Calculate avg growth from completed months
        var completedPairs = 0, growthSum = 0;
        for (var gi = 1; gi < m2; gi++) {
          var gAct = getMonthRevenue(y, gi);
          var gLy  = getMonthRevenue(prevY, gi);
          if (gAct > 0 && gLy > 0) { growthSum += gAct/gLy; completedPairs++; }
        }
        yoyGrowthFactor = completedPairs > 0 ? growthSum/completedPairs : 1.0;
        fc = lastY * yoyGrowthFactor;
      } else {
        // No last year data — use current year daily avg × days in month
        var overallAvgDay = monthsWithData > 0 ? totalActual / (monthsWithData * 30) : 0;
        fc = overallAvgDay * nd2;
      }
    }

    var tgtM = loadTarget(y, m2);
    var tgtV = tgtM && tgtM.revenue ? tgtM.revenue : 0;
    totalActual += actual;
    totalForecast += fc;
    if (actual > 0) monthsWithData++;
    monthData.push({ m: m2, actual: actual, fc: fc, lastY: lastY, tgt: tgtV, isPast: isPast, isCurrent: isCurrent, avgD: avgD, nd: nd2 });
  }

  // Budget total from targets
  var totalBudget = 0;
  for (var bi = 1; bi <= 12; bi++) {
    var bt = loadTarget(y, bi);
    totalBudget += (bt && bt.revenue) ? bt.revenue : 0;
  }

  // Summary cards — 4 clear metrics
  var paceBasedFull = monthsWithData > 0 ? (totalActual / monthsWithData) * 12 : 0;
  var projVsBudget  = totalBudget > 0 ? (totalForecast / totalBudget * 100) : 0;
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:20px">';

  // Card 1: Actual YTD
  html += '<div style="background:linear-gradient(135deg,#0369a1,#0284c7);border-radius:14px;padding:18px;color:#fff">' +
    '<div style="font-size:10px;font-weight:800;opacity:.7;margin-bottom:6px;letter-spacing:.8px">ACTUAL YTD</div>' +
    '<div style="font-size:24px;font-weight:900">' + fmtMoney(totalActual) + '</div>' +
    '<div style="font-size:11px;opacity:.65;margin-top:4px">' + monthsWithData + ' months of data</div>' +
  '</div>';

  // Card 2: Projected Full Year
  var projCol = projVsBudget >= 100 ? '135deg,#15803d,#16a34a' : projVsBudget >= 80 ? '135deg,#b45309,#d97706' : '135deg,#991b1b,#dc2626';
  html += '<div style="background:linear-gradient(' + projCol + ');border-radius:14px;padding:18px;color:#fff">' +
    '<div style="font-size:10px;font-weight:800;opacity:.7;margin-bottom:6px;letter-spacing:.8px">PROJECTED FULL YEAR</div>' +
    '<div style="font-size:24px;font-weight:900">' + fmtMoney(totalForecast) + '</div>' +
    '<div style="font-size:11px;opacity:.75;margin-top:4px">Actual + forecast for remaining months</div>' +
  '</div>';

  // Card 3: Full Year Budget (if set)
  if (totalBudget > 0) {
    var bdgCol = projVsBudget >= 100 ? '135deg,#15803d,#16a34a' : '135deg,#6d28d9,#7c3aed';
    html += '<div style="background:linear-gradient(' + bdgCol + ');border-radius:14px;padding:18px;color:#fff">' +
      '<div style="font-size:10px;font-weight:800;opacity:.7;margin-bottom:6px;letter-spacing:.8px">FULL YEAR BUDGET</div>' +
      '<div style="font-size:24px;font-weight:900">' + fmtMoney(totalBudget) + '</div>' +
      '<div style="font-size:11px;opacity:.75;margin-top:4px">' +
        (projVsBudget > 0 ? 'Projection at ' + projVsBudget.toFixed(1) + '% of budget' : 'Budget set') +
      '</div>' +
    '</div>';
  }

  // Card 4: Daily pace needed to hit budget
  if (totalBudget > 0) {
    var today3     = new Date();
    var daysLeft   = Math.max(0, Math.ceil((new Date(today3.getFullYear(), 11, 31) - today3) / 86400000));
    var remaining  = Math.max(0, totalBudget - totalActual);
    var paceNeeded = daysLeft > 0 ? remaining / daysLeft : 0;
    var paceCol    = paceNeeded < 3000 ? '135deg,#15803d,#16a34a' : paceNeeded < 5000 ? '135deg,#b45309,#d97706' : '135deg,#991b1b,#dc2626';
    html += '<div style="background:linear-gradient(' + paceCol + ');border-radius:14px;padding:18px;color:#fff">' +
      '<div style="font-size:10px;font-weight:800;opacity:.7;margin-bottom:6px;letter-spacing:.8px">DAILY PACE NEEDED</div>' +
      '<div style="font-size:24px;font-weight:900">' + fmtMoney(paceNeeded) + '</div>' +
      '<div style="font-size:11px;opacity:.75;margin-top:4px">' + daysLeft + ' days left · QAR ' + Math.round(remaining).toLocaleString() + ' to budget</div>' +
    '</div>';
  }

  // Card 5: Gap to budget
  if (totalBudget > 0) {
    var gap     = totalForecast - totalBudget;
    var gapPct  = (gap / totalBudget * 100);
    var gapCol  = gap >= 0 ? '135deg,#15803d,#16a34a' : '135deg,#991b1b,#dc2626';
    var gapSign = gap >= 0 ? '+' : '';
    html += '<div style="background:linear-gradient(' + gapCol + ');border-radius:14px;padding:18px;color:#fff">' +
      '<div style="font-size:10px;font-weight:800;opacity:.7;margin-bottom:6px;letter-spacing:.8px">FORECAST VS BUDGET</div>' +
      '<div style="font-size:24px;font-weight:900">' + gapSign + fmtMoney(gap) + '</div>' +
      '<div style="font-size:11px;opacity:.75;margin-top:4px">' + gapSign + gapPct.toFixed(1) + '% vs full year budget</div>' +
    '</div>';
  }

  html += '</div>';

  var lyTotal = 0;
  for (var mi = 1; mi <= 12; mi++) lyTotal += getMonthRevenue(prevY, mi);
  var lyTotal = 0;
  for (var mi = 1; mi <= 12; mi++) lyTotal += getMonthRevenue(prevY, mi);
  if (lyTotal > 0) {
    var yoyFull = ((totalForecast - lyTotal) / lyTotal * 100);
    html += '<div style="background:linear-gradient(135deg,' + (yoyFull>=0?'#15803d,#16a34a':'#b91c1c,#dc2626') + ');border-radius:14px;padding:18px;color:#fff">' +
      '<div style="font-size:10px;font-weight:800;opacity:.7;margin-bottom:6px">VS ' + prevY + ' FULL YEAR</div>' +
      '<div style="font-size:22px;font-weight:900">' + fmtMoney(lyTotal) + '</div>' +
      '<div style="font-size:12px;font-weight:800;margin-top:4px">' + (yoyFull>=0?'↑ +':'↓ ') + yoyFull.toFixed(1) + '% YoY</div>' +
    '</div>';
  }
  html += '</div>';

  // Month-by-month table
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden">' +
    '<div style="background:#0d1b2e;padding:14px 20px;font-size:13px;font-weight:800;color:#c9a84c">📊 Month-by-Month Forecast — ' + y + '</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#f8fafc">' +
      '<th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px">MONTH</th>' +
      '<th style="padding:10px 12px;text-align:right;color:#64748b;font-size:11px">ACTUAL</th>' +
      '<th style="padding:10px 12px;text-align:right;color:#64748b;font-size:11px">FORECAST</th>' +
      '<th style="padding:10px 12px;text-align:right;color:#64748b;font-size:11px">' + prevY + '</th>' +
      '<th style="padding:10px 12px;text-align:right;color:#64748b;font-size:11px">TARGET</th>' +
      '<th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px">STATUS</th>' +
    '</tr></thead><tbody>';

  monthData.forEach(function(row, idx) {
    var status, statusCol;
    var today3 = new Date();
    if (row.isPast) {
      if (row.actual <= 0) { status = '—'; statusCol = '#94a3b8'; }
      else if (row.tgt > 0) {
        var p = row.actual / row.tgt * 100;
        status = p >= 100 ? '✅ Hit' : p >= 75 ? '⚡ Close' : '❌ Missed';
        statusCol = p >= 100 ? '#16a34a' : p >= 75 ? '#d97706' : '#dc2626';
      } else { status = '✓ Complete'; statusCol = '#64748b'; }
    } else if (row.isCurrent) {
      status = '📍 In Progress'; statusCol = '#0369a1';
    } else {
      status = row.fc > 0 ? '🔮 Projected' : '⏳ Upcoming'; statusCol = '#7c3aed';
    }

    var bg = row.isCurrent ? '#eff6ff' : idx%2===0 ? '#fff' : '#f8fafc';
    var fcCol2 = row.tgt > 0 ? (row.fc >= row.tgt ? '#16a34a' : row.fc >= row.tgt*0.75 ? '#d97706' : '#dc2626') : '#0369a1';

    // Progress bar width
    var maxVal = Math.max(row.actual, row.fc, row.lastY, row.tgt, 1);
    var barW = Math.round((row.fc / maxVal) * 100);

    html += '<tr style="background:' + bg + '">' +
      '<td style="padding:10px 12px;font-weight:700;color:#0d1b2e">' + MONTH_NAMES[row.m-1] + '</td>' +
      '<td style="padding:10px 12px;text-align:right;color:#0369a1;font-weight:600">' + (row.actual>0?fmtMoney(row.actual):'—') + '</td>' +
      '<td style="padding:10px 12px;text-align:right">' +
        '<div style="font-weight:800;color:' + fcCol2 + '">' + (row.fc>0?fmtMoney(row.fc):'—') + '</div>' +
        (row.fc>0?'<div style="background:#e2e8f0;border-radius:3px;height:4px;width:80px;margin:3px 0 0 auto;overflow:hidden">' +
          '<div style="background:' + fcCol2 + ';height:100%;width:' + barW + '%"></div>' +
        '</div>':'') +
      '</td>' +
      '<td style="padding:10px 12px;text-align:right;color:#64748b">' + (row.lastY>0?fmtMoney(row.lastY):'—') + '</td>' +
      '<td style="padding:10px 12px;text-align:right;color:#94a3b8">' + (row.tgt>0?fmtMoney(row.tgt):'—') + '</td>' +
      '<td style="padding:10px 12px;font-weight:700;color:' + statusCol + '">' + status + '</td>' +
    '</tr>';
  });

  // Totals row
  html += '<tr style="background:#0d1b2e;color:#c9a84c;font-weight:800">' +
    '<td style="padding:10px 12px">TOTAL</td>' +
    '<td style="padding:10px 12px;text-align:right">' + fmtMoney(totalActual) + '</td>' +
    '<td style="padding:10px 12px;text-align:right">' + fmtMoney(totalForecast) + '</td>' +
    '<td style="padding:10px 12px;text-align:right">' + (lyTotal>0?fmtMoney(lyTotal):'—') + '</td>' +
    '<td style="padding:10px 12px;text-align:right">—</td>' +
    '<td style="padding:10px 12px"></td>' +
  '</tr>';

  html += '</tbody></table></div>';
  return html;
}

// ══════════════════════════════════════════════════════════════
//  PLAN NEXT YEAR — Annual Budget Planning Tool
// ══════════════════════════════════════════════════════════════
var _planData = {}; // { targetYear, baseYear, scenario, months: [{occ, growth, revFc, kgFc}] }

function renderPlanNextYear(baseY) {
  var wrap = document.getElementById('forecast-wrap');
  if (!wrap) return;

  var targetY = baseY + 1;

  // Init _planData if not set or year changed
  if (!_planData.targetYear || _planData.targetYear !== targetY || _planData.baseYear !== baseY) {
    _planData = {
      targetYear: targetY,
      baseYear: baseY,
      scenario: 'moderate',
      months: []
    };
    // Pre-fill from base year data
    for (var m = 1; m <= 12; m++) {
      var baseRev = getMonthRevenue(baseY, m);
      var baseKG  = monthTotals(baseY, m).kg;
      var baseOcc = getAvgOccupancy(baseY, m);
      // Default growth by scenario
      var defGrowth = 5; // moderate default
      _planData.months.push({
        occ:    baseOcc > 0 ? Math.min(100, Math.round(baseOcc + 2)) : 70,
        growth: defGrowth,
        baseRev: baseRev,
        baseKG:  baseKG,
        baseOcc: baseOcc
      });
    }
  }

  wrap.innerHTML = buildPlanHTML(baseY, targetY);
  recalcPlan();
}

function buildPlanHTML(baseY, targetY) {
  var MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var settings = loadBenchSettings();
  var totalRooms = settings.totalRooms || 0;

  var html = '';

  // ── Top Header ──
  html += '<div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:16px;padding:22px 24px;margin-bottom:20px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
      '<div>' +
        '<div style="font-size:20px;font-weight:800;color:#c9a84c">📋 Annual Budget Plan — ' + targetY + '</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:4px">Based on ' + baseY + ' actual data · Adjust growth % and occupancy per month</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button onclick="exportPlanExcel()" style="padding:8px 16px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">⬇️ Export Excel</button>' +
        '<button onclick="savePlanAsTargets()" style="padding:8px 16px;background:#c9a84c;color:#0d1b2e;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">💾 Save as Targets</button>' +
        '<button onclick="printPlanPDF()" style="padding:8px 16px;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">🖨️ Print / PDF</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ── Scenario + Quick Fill Controls ──
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:16px">' +
    '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:16px">' +
      // Scenario
      '<div>' +
        '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:6px;letter-spacing:.8px">SCENARIO</div>' +
        '<div style="display:flex;gap:6px">' +
          '<button id="sc-btn-conservative" onclick="setPlanScenario(\'conservative\')" style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;color:#64748b">🔵 Conservative</button>' +
          '<button id="sc-btn-moderate"     onclick="setPlanScenario(\'moderate\')"     style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid #c9a84c;background:#fefce8;color:#92400e">🟡 Moderate</button>' +
          '<button id="sc-btn-optimistic"   onclick="setPlanScenario(\'optimistic\')"   style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;color:#64748b">🟢 Optimistic</button>' +
        '</div>' +
      '</div>' +
      // Quick fill growth
      '<div>' +
        '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:6px;letter-spacing:.8px">APPLY SAME GROWTH % TO ALL</div>' +
        '<div style="display:flex;gap:6px;align-items:center">' +
          '<input type="number" id="plan-fill-growth" placeholder="e.g. 10" style="width:80px;padding:6px 10px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:13px;font-weight:600;color:#0d1b2e;outline:none">' +
          '<button onclick="fillAllGrowth()" style="padding:6px 12px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">Apply</button>' +
        '</div>' +
      '</div>' +
      // Quick fill occ
      '<div>' +
        '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:6px;letter-spacing:.8px">APPLY SAME OCC % TO ALL</div>' +
        '<div style="display:flex;gap:6px;align-items:center">' +
          '<input type="number" id="plan-fill-occ" placeholder="e.g. 75" style="width:80px;padding:6px 10px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:13px;font-weight:600;color:#0d1b2e;outline:none">' +
          '<button onclick="fillAllOcc()" style="padding:6px 12px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">Apply</button>' +
        '</div>' +
      '</div>' +
      '<div style="background:#f8fafc;border-radius:8px;padding:8px 12px">' +
        '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">HOTEL ROOMS</div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<input type="number" id="plan-total-rooms" value="' + (_TOTAL_ROOMS||totalRooms||161) + '" min="1" max="9999" ' +
            'oninput="_TOTAL_ROOMS=parseInt(this.value)||161;recalcPlan()" ' +
            'style="width:70px;padding:4px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:15px;font-weight:800;color:#0d1b2e;outline:none;text-align:center">' +
          '<span style="font-size:12px;color:#64748b;font-weight:600">rooms</span>' +
          '<button onclick="saveTotalRooms();recalcPlan()" style="padding:4px 8px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:5px;font-size:10px;font-weight:700;cursor:pointer">💾</button>' +
        '</div>' +
        '<div style="font-size:9px;color:#94a3b8;margin-top:2px">Click 💾 to save permanently</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ── Planning Table ──
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:16px">' +
    '<div style="overflow-x:auto">' +
    '<table id="plan-table" style="width:100%;border-collapse:collapse;font-size:12px;min-width:1100px">' +
    '<thead>' +
    // Year header row
    '<tr style="background:#0d1b2e">' +
      '<td style="padding:10px 14px;font-weight:800;color:#c9a84c;width:160px;min-width:160px">' + targetY + '</td>';

  for (var m = 1; m <= 12; m++) {
    html += '<td style="padding:10px 8px;text-align:center;font-weight:800;color:#c9a84c;min-width:90px">' + MONTH_SHORT[m-1] + '-' + String(targetY).slice(2) + '</td>';
  }
  html += '<td style="padding:10px 8px;text-align:center;font-weight:800;color:#16a34a;background:#0a2e0a;min-width:110px">Total Year</td>';
  html += '</tr>' +

  // Sub-header: base year ref
  '<tr style="background:#1e3a5f">' +
    '<td style="padding:6px 14px;font-size:10px;color:rgba(255,255,255,.5);font-weight:600">Base: ' + baseY + ' actual</td>';
  for (var m2 = 1; m2 <= 12; m2++) {
    var bRev = getMonthRevenue(baseY, m2);
    html += '<td style="padding:6px 8px;text-align:center;font-size:10px;color:rgba(255,255,255,.45)">' + (bRev>0?f2(bRev/1000).replace('.00','')+'K':'—') + '</td>';
  }
  var baseTotalRev = 0;
  for (var m3=1;m3<=12;m3++) baseTotalRev += getMonthRevenue(baseY, m3);
  html += '<td style="padding:6px 8px;text-align:center;font-size:10px;color:rgba(22,163,74,.7)">' + f2(baseTotalRev/1000).replace('.00','') + 'K</td>';
  html += '</tr></thead><tbody>';

  // ── ROW 1: Occupancy % (editable) ──
  html += '<tr style="background:#f8fafc">' +
    '<td style="padding:10px 14px;font-weight:700;color:#0d1b2e;border-right:2px solid #e2e8f0">' +
      '<div>Occ %</div>' +
      '<div style="font-size:10px;color:#94a3b8;margin-top:2px">Expected occupancy</div>' +
    '</td>';
  for (var m4 = 1; m4 <= 12; m4++) {
    var baseOcc2 = _planData.months[m4-1].baseOcc;
    html += '<td style="padding:6px 4px;text-align:center">' +
      '<input type="number" id="plan-occ-' + m4 + '" min="0" max="100" step="1" ' +
        'value="' + _planData.months[m4-1].occ + '" ' +
        'onchange="onPlanChange()" ' +
        'style="width:68px;padding:5px 4px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:12px;font-weight:700;text-align:center;color:#0369a1;background:#eff6ff;outline:none">' +
      (baseOcc2 > 0 ? '<div style="font-size:9px;color:#94a3b8;margin-top:2px">' + baseY + ': ' + baseOcc2.toFixed(0) + '%</div>' : '') +
    '</td>';
  }
  html += '<td id="plan-total-occ" style="padding:10px 8px;text-align:center;font-weight:800;color:#0369a1;background:#eff6ff">—</td>';
  html += '</tr>';

  // ── ROW 2: Growth % (editable) ──
  html += '<tr style="background:#fff">' +
    '<td style="padding:10px 14px;font-weight:700;color:#0d1b2e;border-right:2px solid #e2e8f0">' +
      '<div>Growth %</div>' +
      '<div style="font-size:10px;color:#94a3b8;margin-top:2px">vs ' + baseY + ' same month</div>' +
    '</td>';
  for (var m5 = 1; m5 <= 12; m5++) {
    html += '<td style="padding:6px 4px;text-align:center">' +
      '<input type="number" id="plan-growth-' + m5 + '" min="-50" max="200" step="0.5" ' +
        'value="' + _planData.months[m5-1].growth + '" ' +
        'onchange="onPlanChange()" ' +
        'style="width:68px;padding:5px 4px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:12px;font-weight:700;text-align:center;color:#15803d;background:#f0fdf4;outline:none">' +
    '</td>';
  }
  html += '<td id="plan-avg-growth" style="padding:10px 8px;text-align:center;font-weight:800;color:#15803d;background:#f0fdf4">—</td>';
  html += '</tr>';

  // ── ROW 3: Occupied Rooms (calculated) ──
  if (totalRooms > 0) {
    html += '<tr style="background:#f8fafc">' +
      '<td style="padding:10px 14px;font-weight:700;color:#0d1b2e;border-right:2px solid #e2e8f0">' +
        '<div>Occupied Rooms</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:2px">Projected room-nights</div>' +
      '</td>';
    for (var m6 = 1; m6 <= 12; m6++) {
      html += '<td id="plan-rooms-' + m6 + '" style="padding:10px 8px;text-align:center;font-weight:700;color:#64748b">—</td>';
    }
    html += '<td id="plan-total-rooms" style="padding:10px 8px;text-align:center;font-weight:800;color:#64748b;background:#f8fafc">—</td>';
    html += '</tr>';
  }

  // ── ROW 4: Laundry Revenue Forecast ──
  html += '<tr style="background:#fff;border-top:2px solid #c9a84c">' +
    '<td style="padding:12px 14px;font-weight:800;color:#0d1b2e;border-right:2px solid #e2e8f0">' +
      '<div style="color:#0d1b2e">Laundry Revenue</div>' +
      '<div style="font-size:10px;color:#94a3b8;margin-top:2px">Forecast ' + targetY + '</div>' +
    '</td>';
  for (var m7 = 1; m7 <= 12; m7++) {
    html += '<td id="plan-rev-' + m7 + '" style="padding:10px 8px;text-align:center;font-weight:800;font-size:13px;color:#0d1b2e">—</td>';
  }
  html += '<td id="plan-total-rev" style="padding:10px 8px;text-align:center;font-weight:900;font-size:14px;color:#16a34a;background:#f0fdf4">—</td>';
  html += '</tr>';

  // ── ROW 5: vs Base Year ──
  html += '<tr style="background:#f8fafc">' +
    '<td style="padding:8px 14px;font-size:11px;font-weight:700;color:#64748b;border-right:2px solid #e2e8f0">' +
      'vs ' + baseY + ' Revenue' +
    '</td>';
  for (var m8 = 1; m8 <= 12; m8++) {
    html += '<td id="plan-vs-rev-' + m8 + '" style="padding:8px;text-align:center;font-size:11px;font-weight:700">—</td>';
  }
  html += '<td id="plan-total-vs-rev" style="padding:8px;text-align:center;font-size:11px;font-weight:800;background:#f8fafc">—</td>';
  html += '</tr>';

  // ── ROW 6: KG Forecast ──
  html += '<tr style="background:#fff;border-top:2px solid #e2e8f0">' +
    '<td style="padding:12px 14px;font-weight:800;color:#0d1b2e;border-right:2px solid #e2e8f0">' +
      '<div>KG Forecast</div>' +
      '<div style="font-size:10px;color:#94a3b8;margin-top:2px">Total KG washed ' + targetY + '</div>' +
    '</td>';
  for (var m9 = 1; m9 <= 12; m9++) {
    html += '<td id="plan-kg-' + m9 + '" style="padding:10px 8px;text-align:center;font-weight:700;color:#b45309">—</td>';
  }
  html += '<td id="plan-total-kg" style="padding:10px 8px;text-align:center;font-weight:900;color:#b45309;background:#fffbeb">—</td>';
  html += '</tr>';

  // ── ROW 7: vs Base Year KG ──
  html += '<tr style="background:#f8fafc">' +
    '<td style="padding:8px 14px;font-size:11px;font-weight:700;color:#64748b;border-right:2px solid #e2e8f0">' +
      'vs ' + baseY + ' KG' +
    '</td>';
  for (var m10 = 1; m10 <= 12; m10++) {
    html += '<td id="plan-vs-kg-' + m10 + '" style="padding:8px;text-align:center;font-size:11px;font-weight:700">—</td>';
  }
  html += '<td id="plan-total-vs-kg" style="padding:8px;text-align:center;font-size:11px;font-weight:800;background:#f8fafc">—</td>';
  html += '</tr>';

  html += '</tbody></table></div></div>';

  // ── Summary Cards ──
  html += '<div id="plan-summary-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px"></div>';

  // ── Notes box ──
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px">' +
    '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;letter-spacing:.8px">📝 PLANNING NOTES</div>' +
    '<textarea id="plan-notes" placeholder="Add notes for finance team..." style="width:100%;height:70px;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px;font-size:12px;color:#0d1b2e;resize:vertical;outline:none;box-sizing:border-box"></textarea>' +
  '</div>';

  return html;
}

function onPlanChange() {
  // Read inputs
  for (var m = 1; m <= 12; m++) {
    var occEl = document.getElementById('plan-occ-' + m);
    var grEl  = document.getElementById('plan-growth-' + m);
    if (occEl) _planData.months[m-1].occ    = parseFloat(occEl.value) || 0;
    if (grEl)  _planData.months[m-1].growth = parseFloat(grEl.value)  || 0;
  }
  recalcPlan();
}

// Reality check — validates plan values and shows warnings
function runRealityCheck() {
  var wrap = document.getElementById('plan-reality-check');
  if (!wrap) return;
  var warnings = [];

  // Check if any month has unrealistically high growth
  var rows = document.querySelectorAll('[id^="plan-row-"]');
  rows.forEach(function(row) {
    var growthEl = row.querySelector('[id^="plan-growth-"]');
    if (growthEl) {
      var g = parseFloat(growthEl.value) || 0;
      if (g > 50) warnings.push('Growth rate ' + g + '% seems very high for one month');
      if (g < -50) warnings.push('Decline ' + g + '% seems very steep for one month');
    }
  });

  if (warnings.length > 0) {
    wrap.innerHTML = '<div style="background:#fef3c7;border:1.5px solid #f59e0b;border-radius:8px;padding:10px 14px;font-size:12px;color:#92400e;font-weight:600">' +
      '⚠️ ' + warnings.join('<br>⚠️ ') + '</div>';
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
  }
}


function recalcPlan() {
  if (!_planData.months || _planData.months.length === 0) return;
  var baseY = _planData.baseYear;
  var targetY = _planData.targetYear;
  var settings = loadBenchSettings();
  var totalRooms = settings.totalRooms || 0;
  var MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  var totalRevFc = 0, totalKgFc = 0, totalOccRooms = 0;
  var totalBaseRev = 0, totalBaseKg = 0;
  var totalGrowth = 0;
  var totalBaseOcc = 0, occCount = 0;

  for (var m = 1; m <= 12; m++) {
    var md = _planData.months[m-1];
    var baseRev = getMonthRevenue(baseY, m);
    var baseKG  = monthTotals(baseY, m).kg;
    md.baseRev = baseRev;
    md.baseKG  = baseKG;

    // Revenue forecast
    // Blend: growth-based + occupancy-adjusted
    var growthFc = baseRev * (1 + md.growth / 100);

    // Occupancy adjustment factor
    var baseOcc = md.baseOcc || getAvgOccupancy(baseY, m);
    var occFactor = (baseOcc > 0 && md.occ > 0) ? md.occ / baseOcc : 1;
    var occFc = baseRev * occFactor;

    // If both available → blend 60% growth, 40% occupancy
    var revFc = baseOcc > 0 ? (growthFc * 0.6 + occFc * 0.4) : growthFc;
    md.revFc = revFc;

    // KG forecast — same ratio as revenue growth, adjusted by occupancy
    var kgGrowthFc = baseKG * (1 + md.growth / 100);
    var kgOccFc = baseKG * occFactor;
    md.kgFc = baseOcc > 0 ? (kgGrowthFc * 0.6 + kgOccFc * 0.4) : kgGrowthFc;

    // Occupied rooms
    var nd = dim(targetY, m);
    var occRooms = totalRooms > 0 ? Math.round(totalRooms * md.occ / 100) * nd : 0;
    md.occRooms = occRooms;

    totalRevFc    += revFc;
    totalKgFc     += md.kgFc;
    totalOccRooms += occRooms;
    totalBaseRev  += baseRev;
    totalBaseKg   += baseKG;
    totalGrowth   += md.growth;
    if (md.occ > 0) { totalBaseOcc += md.occ; occCount++; }

    // Update cells
    var revEl = document.getElementById('plan-rev-' + m);
    if (revEl) revEl.textContent = revFc > 0 ? fmtMoney(revFc) : '—';

    var vsRevEl = document.getElementById('plan-vs-rev-' + m);
    if (vsRevEl) {
      if (baseRev > 0 && revFc > 0) {
        var vsPct = ((revFc - baseRev) / baseRev * 100);
        vsRevEl.textContent = (vsPct >= 0 ? '↑ +' : '↓ ') + vsPct.toFixed(1) + '%';
        vsRevEl.style.color = vsPct >= 0 ? '#16a34a' : '#dc2626';
      } else { vsRevEl.textContent = '—'; vsRevEl.style.color = '#94a3b8'; }
    }

    var kgEl = document.getElementById('plan-kg-' + m);
    if (kgEl) kgEl.textContent = md.kgFc > 0 ? md.kgFc.toFixed(0) + ' kg' : '—';

    var vsKgEl = document.getElementById('plan-vs-kg-' + m);
    if (vsKgEl) {
      if (baseKG > 0 && md.kgFc > 0) {
        var vsKgPct = ((md.kgFc - baseKG) / baseKG * 100);
        vsKgEl.textContent = (vsKgPct >= 0 ? '↑ +' : '↓ ') + vsKgPct.toFixed(1) + '%';
        vsKgEl.style.color = vsKgPct >= 0 ? '#16a34a' : '#dc2626';
      } else { vsKgEl.textContent = '—'; vsKgEl.style.color = '#94a3b8'; }
    }

    var roomsEl = document.getElementById('plan-rooms-' + m);
    if (roomsEl) roomsEl.textContent = occRooms > 0 ? occRooms.toLocaleString() : '—';
  }

  // Totals
  var totalOccAvg = occCount > 0 ? totalBaseOcc / occCount : 0;
  var totalVsRev = totalBaseRev > 0 ? ((totalRevFc - totalBaseRev) / totalBaseRev * 100) : 0;
  var totalVsKg  = totalBaseKg  > 0 ? ((totalKgFc  - totalBaseKg)  / totalBaseKg  * 100) : 0;

  var el = function(id) { return document.getElementById(id); };
  if (el('plan-total-occ'))    el('plan-total-occ').textContent    = totalOccAvg.toFixed(1) + '% avg';
  if (el('plan-avg-growth'))   el('plan-avg-growth').textContent   = (totalGrowth/12).toFixed(1) + '% avg';
  if (el('plan-total-rooms'))  el('plan-total-rooms').textContent  = totalOccRooms > 0 ? totalOccRooms.toLocaleString() : '—';
  if (el('plan-total-rev'))    el('plan-total-rev').textContent    = totalRevFc > 0 ? fmtMoney(totalRevFc) : '—';
  if (el('plan-total-kg'))     el('plan-total-kg').textContent     = totalKgFc > 0 ? totalKgFc.toFixed(0) + ' kg' : '—';
  if (el('plan-total-vs-rev')) {
    el('plan-total-vs-rev').textContent = (totalVsRev>=0?'↑ +':'↓ ') + totalVsRev.toFixed(1) + '%';
    el('plan-total-vs-rev').style.color = totalVsRev >= 0 ? '#16a34a' : '#dc2626';
  }
  if (el('plan-total-vs-kg')) {
    el('plan-total-vs-kg').textContent = (totalVsKg>=0?'↑ +':'↓ ') + totalVsKg.toFixed(1) + '%';
    el('plan-total-vs-kg').style.color = totalVsKg >= 0 ? '#16a34a' : '#dc2626';
  }
  setTimeout(runRealityCheck, 100);

  // Summary cards
  var cards = document.getElementById('plan-summary-cards');
  if (cards) {
    cards.innerHTML = [
      { label: 'Total Revenue Forecast', val: fmtMoney(totalRevFc), sub: (totalVsRev>=0?'↑ +':'↓ ')+totalVsRev.toFixed(1)+'% vs '+baseY, grad: 'linear-gradient(135deg,#15803d,#16a34a)', shadow: 'rgba(22,163,74,.25)' },
      { label: 'Total KG Forecast', val: totalKgFc.toFixed(0)+' kg', sub: (totalVsKg>=0?'↑ +':'↓ ')+totalVsKg.toFixed(1)+'% vs '+baseY, grad: 'linear-gradient(135deg,#b45309,#d97706)', shadow: 'rgba(217,119,6,.25)' },
      { label: 'Avg Monthly Revenue', val: fmtMoney(totalRevFc/12), sub: 'Per month average', grad: 'linear-gradient(135deg,#0369a1,#0284c7)', shadow: 'rgba(2,132,199,.25)' },
      { label: 'Avg Occupancy', val: totalOccAvg.toFixed(1)+'%', sub: 'Projected '+targetY, grad: 'linear-gradient(135deg,#6d28d9,#7c3aed)', shadow: 'rgba(109,40,217,.25)' },
      ( totalOccRooms > 0 ? { label: 'Total Room-Nights', val: totalOccRooms.toLocaleString(), sub: 'Projected occupied', grad: 'linear-gradient(135deg,#0e7490,#0891b2)', shadow: 'rgba(8,145,178,.25)' } :
        { label: 'Avg Growth Rate', val: (totalGrowth/12).toFixed(1)+'%', sub: 'Applied across all months', grad: 'linear-gradient(135deg,#334155,#475569)', shadow: 'rgba(71,85,105,.25)' } )
    ].map(function(c) {
      return '<div style="background:'+c.grad+';border-radius:14px;padding:16px;box-shadow:0 6px 18px '+c.shadow+'">' +
        '<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.65);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase">'+c.label+'</div>' +
        '<div style="font-size:18px;font-weight:900;color:#fff">'+c.val+'</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:3px">'+c.sub+'</div>' +
      '</div>';
    }).join('');
  }
}

function setPlanScenario(sc) {
  _planData.scenario = sc;
  var rates = { conservative: 3, moderate: 7, optimistic: 12 };
  var occAdj = { conservative: 0, moderate: 2, optimistic: 5 };
  var rate = rates[sc] || 7;
  var adj  = occAdj[sc] || 0;
  for (var m = 1; m <= 12; m++) {
    var grEl  = document.getElementById('plan-growth-' + m);
    var occEl = document.getElementById('plan-occ-'    + m);
    if (grEl) { grEl.value = rate; _planData.months[m-1].growth = rate; }
    if (occEl && _planData.months[m-1].baseOcc > 0) {
      var newOcc = Math.min(100, _planData.months[m-1].baseOcc + adj);
      occEl.value = newOcc.toFixed(0);
      _planData.months[m-1].occ = newOcc;
    }
  }
  // Update button styles
  ['conservative','moderate','optimistic'].forEach(function(s) {
    var btn = document.getElementById('sc-btn-' + s);
    if (!btn) return;
    var isActive = s === sc;
    btn.style.background = isActive ? '#0d1b2e' : '#fff';
    btn.style.color = isActive ? '#c9a84c' : '#64748b';
    btn.style.borderColor = isActive ? '#0d1b2e' : '#e2e8f0';
  });
  recalcPlan();
}

function fillAllGrowth() {
  var val = parseFloat(document.getElementById('plan-fill-growth')?.value) || 0;
  for (var m = 1; m <= 12; m++) {
    var el = document.getElementById('plan-growth-' + m);
    if (el) { el.value = val; _planData.months[m-1].growth = val; }
  }
  recalcPlan();
}

function fillAllOcc() {
  var val = parseFloat(document.getElementById('plan-fill-occ')?.value) || 0;
  for (var m = 1; m <= 12; m++) {
    var el = document.getElementById('plan-occ-' + m);
    if (el) { el.value = val; _planData.months[m-1].occ = val; }
  }
  recalcPlan();
}

function savePlanAsTargets() {
  if (!_planData.months) return;
  var y = _planData.targetYear;
  var saved = 0;
  _planData.months.forEach(function(md, idx) {
    var m = idx + 1;
    if (md.revFc > 0) {
      saveTarget(y, m, { revenue: Math.round(md.revFc) });
      saved++;
    }
  });
  logAudit('PLAN_TARGETS', 'Saved ' + saved + ' monthly targets for ' + y);
  toast('✅ Saved ' + saved + ' monthly targets for ' + y, 'ok');
}

function exportPlanExcel() {
  if (!_planData.months) return;
  var baseY = _planData.baseYear;
  var targetY = _planData.targetYear;
  var MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var wb = XLSX.utils.book_new();

  // Build rows
  var header = [targetY + ' Budget Plan'].concat(MONTH_SHORT.map(function(mn){ return mn+'-'+String(targetY).slice(2); })).concat(['Total Year']);
  var baseRevRow = ['Base (' + baseY + ') Revenue'];
  var occRow = ['Occ %'];
  var growthRow = ['Growth %'];
  var revRow = ['Laundry Revenue'];
  var vsRevRow = ['vs ' + baseY + ' Revenue'];
  var kgRow = ['KG Forecast'];
  var vsKgRow = ['vs ' + baseY + ' KG'];

  var totalRevFc = 0, totalKgFc = 0, totalBaseRev = 0, totalBaseKg = 0;

  _planData.months.forEach(function(md, idx) {
    baseRevRow.push(md.baseRev > 0 ? md.baseRev : 0);
    occRow.push(md.occ);
    growthRow.push(md.growth + '%');
    revRow.push(md.revFc > 0 ? Math.round(md.revFc) : 0);
    var vsRev = md.baseRev > 0 && md.revFc > 0 ? ((md.revFc - md.baseRev)/md.baseRev*100).toFixed(1)+'%' : '—';
    vsRevRow.push(vsRev);
    kgRow.push(md.kgFc > 0 ? Math.round(md.kgFc) : 0);
    var vsKg = md.baseKG > 0 && md.kgFc > 0 ? ((md.kgFc - md.baseKG)/md.baseKG*100).toFixed(1)+'%' : '—';
    vsKgRow.push(vsKg);
    totalRevFc += md.revFc || 0;
    totalKgFc  += md.kgFc  || 0;
    totalBaseRev += md.baseRev || 0;
    totalBaseKg  += md.baseKG  || 0;
  });

  baseRevRow.push(Math.round(totalBaseRev));
  occRow.push('');
  growthRow.push('');
  revRow.push(Math.round(totalRevFc));
  vsRevRow.push(totalBaseRev > 0 ? ((totalRevFc-totalBaseRev)/totalBaseRev*100).toFixed(1)+'%' : '—');
  kgRow.push(Math.round(totalKgFc));
  vsKgRow.push(totalBaseKg > 0 ? ((totalKgFc-totalBaseKg)/totalBaseKg*100).toFixed(1)+'%' : '—');

  var rows = [header, baseRevRow, [], occRow, growthRow, [], revRow, vsRevRow, [], kgRow, vsKgRow];
  var notes = document.getElementById('plan-notes')?.value || '';
  if (notes) rows.push([], ['Notes:', notes]);

  var ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [{ wch: 22 }].concat(Array(12).fill({ wch: 11 })).concat([{ wch: 14 }]);

  XLSX.utils.book_append_sheet(wb, ws, targetY + ' Budget');
  XLSX.writeFile(wb, 'Pearl_Budget_Plan_' + targetY + '.xlsx');
  toast('⬇️ Excel exported — Pearl_Budget_Plan_' + targetY + '.xlsx', 'ok');
}

function printPlanPDF() {
  if (!_planData.months) return;
  var baseY = _planData.baseYear;
  var targetY = _planData.targetYear;
  var MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  var totalRevFc = 0, totalKgFc = 0, totalBaseRev = 0;
  _planData.months.forEach(function(md) { totalRevFc += md.revFc||0; totalKgFc += md.kgFc||0; totalBaseRev += md.baseRev||0; });
  var yoyPct = totalBaseRev > 0 ? ((totalRevFc-totalBaseRev)/totalBaseRev*100).toFixed(1) : '—';

  var win = window.open('', '_blank');
  var css = '<style>body{font-family:Arial,sans-serif;font-size:11px;color:#1a2332;margin:20px}' +
    'h1{font-size:16px;color:#0d1b2e;margin-bottom:4px}' +
    '.sub{font-size:11px;color:#64748b;margin-bottom:16px}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:16px}' +
    'th{background:#0d1b2e;color:#c9a84c;padding:6px 8px;text-align:center;font-size:10px}' +
    'td{padding:5px 8px;text-align:center;border:1px solid #e2e8f0;font-size:10px}' +
    '.row-lbl{text-align:left;font-weight:700;background:#f8fafc}' +
    '.total-col{background:#0d1b2e;color:#c9a84c;font-weight:800}' +
    '.rev-row td{font-weight:800;font-size:11px}' +
    '.footer{font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px;margin-top:20px}' +
    '@media print{body{margin:10px}}</st'+'yle>';

  var tableHTML = '<table><thead><tr>' +
    '<th style="text-align:left;width:130px">' + targetY + '</th>';
  MONTH_SHORT.forEach(function(mn) { tableHTML += '<th>' + mn + '-' + String(targetY).slice(2) + '</th>'; });
  tableHTML += '<th style="background:#1a5e1a">Total Year</th></tr></thead><tbody>';

  // Rows
  var rowDefs = [
    { label: 'Occ %', key: 'occ', fmt: function(v){ return v.toFixed(0)+'%'; }, cls: '' },
    { label: 'Growth %', key: 'growth', fmt: function(v){ return v.toFixed(1)+'%'; }, cls: '' },
    { label: 'Laundry Revenue', key: 'revFc', fmt: function(v){ return v>0?fmtMoney(v):'—'; }, cls: 'rev-row', total: totalRevFc },
    { label: 'KG Forecast', key: 'kgFc', fmt: function(v){ return v>0?v.toFixed(0)+' kg':'—'; }, cls: '', total: totalKgFc }
  ];

  rowDefs.forEach(function(row) {
    tableHTML += '<tr class="' + row.cls + '"><td class="row-lbl">' + row.label + '</td>';
    _planData.months.forEach(function(md) {
      tableHTML += '<td>' + row.fmt(md[row.key]||0) + '</td>';
    });
    tableHTML += '<td class="total-col">' + (row.total !== undefined ? row.fmt(row.total) : '') + '</td></tr>';
  });

  tableHTML += '</tbody></table>';

  var notes = document.getElementById('plan-notes')?.value || '';

  win.document.write('<!DOCTYPE html><html><head><title>Budget Plan ' + targetY + '</title>' + css + '</he'+'ad><body>' +
    '<h1>RS LaundryPro Laundry — Budget Plan ' + targetY + '</h1>' +
    '<div class="sub">Prepared ' + new Date().toLocaleDateString() + ' · Base year: ' + baseY + ' · YoY forecast: ' + (yoyPct !== '—' ? (yoyPct > 0 ? '+' : '') + yoyPct + '%' : '—') + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">' +
      '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px"><div style="font-size:9px;font-weight:700;color:#64748b;margin-bottom:4px">TOTAL REVENUE FORECAST</div><div style="font-size:18px;font-weight:800;color:#15803d">' + fmtMoney(totalRevFc) + '</div></div>' +
      '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px"><div style="font-size:9px;font-weight:700;color:#64748b;margin-bottom:4px">TOTAL KG FORECAST</div><div style="font-size:18px;font-weight:800;color:#b45309">' + totalKgFc.toFixed(0) + ' kg</div></div>' +
      '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px"><div style="font-size:9px;font-weight:700;color:#64748b;margin-bottom:4px">YoY GROWTH</div><div style="font-size:18px;font-weight:800;color:#1d4ed8">' + (yoyPct !== '—' ? (yoyPct > 0 ? '+' : '') + yoyPct + '%' : '—') + '</div></div>' +
    '</div>' +
    tableHTML +
    (notes ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:11px"><strong>Notes:</strong> ' + notes + '</div>' : '') +
    '<div class="footer">© Reda Salah · RS LaundryPro Laundry Management System · All Rights Reserved</div>' +
  '</bo'+'dy></ht'+'ml>');
  win.document.close();
  setTimeout(function() { win.print(); }, 500);
}


// ════════════════════════════════════════════════════════════════
//  LICENCE & SECURITY SYSTEM v2 — Full redesign
//  Every device must activate with a valid key before login.
//  No domain whitelist — key is the ONLY gate.
//  Master key works on any device, never expires.
//  Per-client keys stored in Firebase pearl/licences/{keyClean}
//  Revocation: set active:false in Firebase → blocked on next check
// ════════════════════════════════════════════════════════════════

var _MASTER_KEY       = '5FVE-77LT-8MSV-JY9A';
var _LIC_STORE_KEY    = 'pearl_licence_v2';
var _LIC_SALT         = '0998bd7dd8e67fb76ca66cba2ae37aee';
var _LIC_GRACE_DAYS   = 7;
var _LIC_RECHECK_DAYS = 7;   // re-verify against Firebase every 7 days

// ── Simple checksum to detect localStorage tampering ──
function _licChecksum(obj) {
  var s = _LIC_SALT + JSON.stringify(obj);
  var h = 0;
  for (var i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function getLicenceFromStorage() {
  try {
    var raw = localStorage.getItem(_LIC_STORE_KEY);
    if (!raw) return null;
    var obj = JSON.parse(raw);
    // Verify checksum — detect tampering
    var expected = _licChecksum({
      key: obj.key, holder: obj.holder,
      expires: obj.expires, activatedAt: obj.activatedAt
    });
    if (obj._cs !== expected) {
      console.warn('[Licence] Checksum mismatch — cache cleared');
      localStorage.removeItem(_LIC_STORE_KEY);
      return null;
    }
    return obj;
  } catch(e) {
    localStorage.removeItem(_LIC_STORE_KEY);
    return null;
  }
}

function saveLicenceToStorage(data) {
  try {
    var payload = {
      key:         data.key,
      holder:      data.holder || '',
      expires:     data.expires || null,
      activatedAt: data.activatedAt || new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      valid:       true
    };
    payload._cs = _licChecksum({
      key: payload.key, holder: payload.holder,
      expires: payload.expires, activatedAt: payload.activatedAt
    });
    localStorage.setItem(_LIC_STORE_KEY, JSON.stringify(payload));
  } catch(e) {}
}

function clearLicenceCache() {
  localStorage.removeItem(_LIC_STORE_KEY);
}

// ── Check if cached licence is within offline grace period ──
function _licenceWithinGrace(cached) {
  if (!cached || !cached.lastChecked) return false;
  var daysSince = (Date.now() - new Date(cached.lastChecked)) / 86400000;
  return daysSince <= _LIC_GRACE_DAYS;
}

// ── Check if licence needs re-verification against Firebase ──
function _licenceNeedsRecheck(cached) {
  if (!cached || !cached.lastChecked) return true;
  var daysSince = (Date.now() - new Date(cached.lastChecked)) / 86400000;
  return daysSince >= _LIC_RECHECK_DAYS;
}

// ── Main boot entry point — called 800ms after DOMContentLoaded ──
function bootWithLicenceCheck() {
  var cached = getLicenceFromStorage();

  // No cached licence — must activate
  if (!cached) {
    _showLicenceScreen(null);
    return;
  }

  // Check client-side expiry
  if (cached.expires && new Date(cached.expires) < new Date()) {
    clearLicenceCache();
    _showLicenceScreen('Your licence expired on ' + cached.expires + '. Please contact Reda Salah to renew.');
    return;
  }

  // Valid cache — does it need Firebase re-verification?
  if (_licenceNeedsRecheck(cached)) {
    _reVerifyLicence(cached);
  } else {
    // Cache is fresh — proceed directly to login
    proceedToLogin();
  }
}

// ── Re-verify cached licence against Firebase (silent, background) ──
function _reVerifyLicence(cached) {
  if (!window._fbDB) {
    // Firebase not ready — allow if within grace period
    if (_licenceWithinGrace(cached)) {
      proceedToLogin();
    } else {
      _showLicenceScreen('Cannot verify your licence — Firebase not connected. Please check your internet.');
    }
    return;
  }

  var keyClean = cached.key.replace(/-/g, '');
  window._fbDB.ref('pearl/licences/' + keyClean).once('value').then(function(snap) {
    var data = snap.val();

    // Master key — always valid
    if (cached.key === _MASTER_KEY) {
      _updateLastChecked(cached);
      proceedToLogin();
      return;
    }

    // Key deleted or deactivated
    if (!data || data.active === false) {
      clearLicenceCache();
      _showLicenceScreen('Your licence has been revoked. Please contact Reda Salah.');
      return;
    }

    // Expired server-side
    if (data.expires && new Date(data.expires) < new Date()) {
      clearLicenceCache();
      _showLicenceScreen('Your licence expired on ' + data.expires + '. Please contact Reda Salah to renew.');
      return;
    }

    // All good — update cache with fresh lastChecked
    saveLicenceToStorage({
      key:         cached.key,
      holder:      data.holder || cached.holder,
      expires:     data.expires || null,
      activatedAt: cached.activatedAt
    });
    // Log last seen
    window._fbDB.ref('pearl/licences/' + keyClean + '/lastSeen').set(new Date().toISOString()).catch(function(){});
    proceedToLogin();

  }).catch(function(e) {
    // Firebase error — allow if within grace period
    if (_licenceWithinGrace(cached)) {
      console.warn('[Licence] Firebase check failed, using grace period:', e.message);
      proceedToLogin();
    } else {
      _showLicenceScreen('Cannot verify your licence. Please check your internet connection.');
    }
  });
}

function _updateLastChecked(cached) {
  try {
    var raw = localStorage.getItem(_LIC_STORE_KEY);
    if (raw) {
      var obj = JSON.parse(raw);
      obj.lastChecked = new Date().toISOString();
      // Recompute checksum with updated data
      obj._cs = _licChecksum({
        key: obj.key, holder: obj.holder,
        expires: obj.expires, activatedAt: obj.activatedAt
      });
      localStorage.setItem(_LIC_STORE_KEY, JSON.stringify(obj));
    }
  } catch(e) {}
}

// ── Show the licence activation screen ──
function _showLicenceScreen(errMsg) {
  document.getElementById('pg-licence').style.display = 'flex';
  document.getElementById('pg-login').style.display   = 'none';
  var appEl = document.getElementById('pg-app');
  if (appEl) appEl.style.display = 'none';

  // Reset to activation form
  var actSection = document.getElementById('lic-activate-section');
  var sucSection = document.getElementById('lic-success-section');
  if (actSection) actSection.style.display = 'block';
  if (sucSection) sucSection.style.display = 'none';

  // Show error if provided
  if (errMsg) {
    var errEl = document.getElementById('lic-err');
    if (errEl) {
      errEl.textContent = '⚠️ ' + errMsg;
      errEl.style.display = 'block';
    }
  } else {
    var errEl = document.getElementById('lic-err');
    if (errEl) errEl.style.display = 'none';
  }

  // Clear input
  var inp = document.getElementById('lic-key-input');
  if (inp) inp.value = '';
}

// ── User submits a key on the activation screen ──
function activateLicence() {
  var keyEl = document.getElementById('lic-key-input');
  var errEl = document.getElementById('lic-err');
  var btn   = document.getElementById('lic-btn');
  var key   = (keyEl?.value || '').trim().toUpperCase().replace(/\s/g,'');

  // Auto-format: insert dashes
  if (key.indexOf('-') === -1 && key.length === 16) {
    key = key.slice(0,4)+'-'+key.slice(4,8)+'-'+key.slice(8,12)+'-'+key.slice(12,16);
  }

  if (!key) {
    errEl.textContent = '⚠️ Please enter your licence key.';
    errEl.style.display = 'block';
    return;
  }

  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
    errEl.textContent = '⚠️ Invalid format. Key must be XXXX-XXXX-XXXX-XXXX';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';
  btn.textContent = '⏳ Verifying...';
  btn.disabled = true;

  // ── Master key ──
  if (key === _MASTER_KEY) {
    saveLicenceToStorage({
      key: key, holder: 'RS LaundryPro Admin',
      expires: null, activatedAt: new Date().toISOString()
    });
    _showActivationSuccess('RS LaundryPro Admin');
    return;
  }

  // ── Firebase key lookup ──
  function _doFirebaseLookup() {
    if (!window._fbDB) {
      setTimeout(_doFirebaseLookup, 1500);
      return;
    }
    var keyClean = key.replace(/-/g,'');
    window._fbDB.ref('pearl/licences/' + keyClean).once('value').then(function(snap) {
      var data = snap.val();

      if (!data || data.active === false) {
        btn.textContent = '🔓 ACTIVATE SYSTEM';
        btn.disabled = false;
        errEl.textContent = '❌ Invalid or revoked licence key. Contact Reda Salah.';
        errEl.style.display = 'block';
        return;
      }

      if (data.expires && new Date(data.expires) < new Date()) {
        btn.textContent = '🔓 ACTIVATE SYSTEM';
        btn.disabled = false;
        errEl.textContent = '❌ This licence expired on ' + data.expires + '. Please renew.';
        errEl.style.display = 'block';
        return;
      }

      // Valid — save and proceed
      saveLicenceToStorage({
        key: key, holder: data.holder || '',
        expires: data.expires || null,
        activatedAt: new Date().toISOString()
      });
      // Log activation in Firebase
      window._fbDB.ref('pearl/licences/' + keyClean).update({
        lastUsed: new Date().toISOString(),
        activationCount: (data.activationCount || 0) + 1
      }).catch(function(){});

      _showActivationSuccess(data.holder);

    }).catch(function(e) {
      btn.textContent = '🔓 ACTIVATE SYSTEM';
      btn.disabled = false;
      errEl.textContent = '⚠️ Could not verify key — check your internet. (' + (e.message||'') + ')';
      errEl.style.display = 'block';
    });
  }

  _doFirebaseLookup();
}

function _showActivationSuccess(holder) {
  var actSection = document.getElementById('lic-activate-section');
  var sucSection = document.getElementById('lic-success-section');
  var holderEl   = document.getElementById('lic-success-holder');
  if (actSection) actSection.style.display = 'none';
  if (sucSection) sucSection.style.display = 'block';
  if (holderEl && holder) holderEl.textContent = 'Licensed to: ' + holder;
  setTimeout(function() { proceedToLogin(); }, 1800);
}

function proceedToLogin() {
  document.getElementById('pg-licence').style.display = 'none';
  // Sync credentials from Firebase BEFORE showing login
  // so user always logs in with the latest stored credentials
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/settings/credentials').then(function(v) {
      if (v && v.user && v.pass) {
        try { _STORE.setItem('pearl_credentials', JSON.stringify({user:v.user, pass:v.pass})); } catch(e) {}
      }
    }).catch(function(){}).then(function() {
      document.getElementById('pg-login').style.display = 'flex';
    }, function() {
      document.getElementById('pg-login').style.display = 'flex';
    });
  } else {
    document.getElementById('pg-login').style.display = 'flex';
  }
}

// ── Deprecated stubs (keep for compatibility) ──
function checkDomainAllowed() { return true; }
function showLockedPage()     { _showLicenceScreen(); }
function showLicencePage(m)   { _showLicenceScreen(m); }
function getLicenceFromStorageLegacy() { return getLicenceFromStorage(); }



function toggleMasterKeyDisplay() {
  var el = document.getElementById('lic-master-display');
  if (!el) return;
  var hidden = '••••-••••-••••-••••';
  el.textContent = (el.textContent === _MASTER_KEY) ? hidden : _MASTER_KEY;
}
function loadDeviceLicenceStatus() {
  var el = document.getElementById('lic-device-status');
  if (!el) return;
  var cached = getLicenceFromStorage();
  if (!cached) {
    el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#dc2626;font-weight:600">' +
      '<span style="font-size:16px">❌</span> No licence activated on this device — ' +
      '<a href="#" onclick="openSettings();switchStab(\'licence\');return false" style="color:#0284c7">activate one</a>' +
    '</div>';
    return;
  }
  var isExpired = cached.expires && new Date(cached.expires) < new Date();
  var isMaster  = cached.key === _MASTER_KEY;
  var daysSince = cached.lastChecked ? Math.floor((Date.now()-new Date(cached.lastChecked))/86400000) : '?';
  var col = isExpired ? '#dc2626' : '#16a34a';
  var bg  = isExpired ? '#fee2e2' : '#f0fdf4';
  var bdr = isExpired ? '#fca5a5' : '#86efac';
  el.innerHTML =
    '<div style="padding:10px 14px;background:' + bg + ';border:1.5px solid ' + bdr + ';border-radius:8px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:700;color:' + col + '">' +
            (isExpired ? '⏰ EXPIRED' : isMaster ? '🛡️ MASTER KEY' : '✅ ACTIVE') +
          '</div>' +
          '<div style="font-size:11px;color:#64748b;margin-top:3px">' +
            (cached.holder ? 'Licensed to: <strong>' + cached.holder + '</strong>' : '') +
            (cached.expires ? ' · Expires: ' + cached.expires : isMaster ? ' · Never expires' : ' · No expiry') +
          '</div>' +
          '<div style="font-size:10px;color:#94a3b8;margin-top:2px">' +
            'Key: <span style="font-family:monospace">' + cached.key + '</span> · ' +
            'Last verified: ' + daysSince + ' day(s) ago' +
          '</div>' +
        '</div>' +
        '<button onclick="_confirmClearLicence()" ' +
          'style="padding:6px 12px;background:#fff5f5;border:1.5px solid #fca5a5;color:#dc2626;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">' +
          '🗑 Clear Licence' +
        '</button>' +
      '</div>' +
    '</div>';
}


function _confirmClearLicence() {
  var existing = document.getElementById('_clr_lic');
  if (existing) { existing.remove(); return; }
  var box = document.createElement('div');
  box.id = '_clr_lic';
  box.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:99999;' +
    'background:#fff;border:2px solid #fca5a5;border-radius:12px;' +
    'padding:16px 20px;box-shadow:0 8px 32px rgba(0,0,0,.25);max-width:300px;font-family:inherit';
  var t = document.createElement('div');
  t.style.cssText = 'font-size:13px;font-weight:700;color:#0d1b2e;margin-bottom:4px';
  t.textContent = 'Clear device licence?';
  var s = document.createElement('div');
  s.style.cssText = 'font-size:12px;color:#64748b;margin-bottom:12px';
  s.textContent = 'You will need to enter a key again next time.';
  var row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px';
  var yes = document.createElement('button');
  yes.style.cssText = 'flex:1;padding:8px;background:#dc2626;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer';
  yes.textContent = 'Clear';
  yes.onclick = function() {
    clearLicenceCache();
    loadDeviceLicenceStatus();
    toast('Licence cleared', 'ok');
    box.remove();
  };
  var no = document.createElement('button');
  no.style.cssText = 'flex:1;padding:8px;background:#f1f5f9;color:#64748b;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer';
  no.textContent = 'Cancel';
  no.onclick = function() { box.remove(); };
  row.appendChild(yes);
  row.appendChild(no);
  box.appendChild(t);
  box.appendChild(s);
  box.appendChild(row);
  document.body.appendChild(box);
}


function loadLicencePanel() {
  var listEl = document.getElementById('lic-keys-list');
  if (!listEl) return;
  if (!window._fbDB) {
    listEl.innerHTML = '<div style="color:#dc2626;font-size:12px;padding:12px">Firebase not connected.</div>';
    return;
  }
  listEl.innerHTML = '<div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px">Loading...</div>';
  window._fbDB.ref('pearl/licences').once('value').then(function(snap) {
    var data = snap.val() || {};
    var keys = Object.keys(data);
    if (keys.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px">No keys yet. Generate one above.</div>';
      return;
    }
    var html = '';
    keys.forEach(function(k) {
      var d = data[k];
      var formattedKey = k.match(/.{1,4}/g) ? k.match(/.{1,4}/g).join('-') : k;
      var isActive  = d.active !== false;
      var isExpired = d.expires && new Date(d.expires) < new Date();
      var statusCol = isExpired ? '#dc2626' : isActive ? '#16a34a' : '#94a3b8';
      var statusBg  = isExpired ? '#fee2e2' : isActive ? '#f0fdf4' : '#f8fafc';
      var statusLbl = isExpired ? '⏰ Expired' : isActive ? '✅ Active' : '❌ Revoked';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;' +
        'padding:12px 14px;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;' +
        'margin-bottom:8px;gap:10px;flex-wrap:wrap">' +
        '<div>' +
          '<div style="font-family:monospace;font-size:14px;font-weight:800;color:#0d1b2e;letter-spacing:1.5px">' + formattedKey + '</div>' +
          '<div style="font-size:11px;color:#64748b;margin-top:3px">' +
            '👤 ' + (d.holder||'Unknown') +
            (d.expires ? ' · 📅 Expires: ' + d.expires : ' · No expiry') +
            (d.lastUsed ? ' · Last used: ' + new Date(d.lastUsed).toLocaleDateString() : '') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;' +
            'background:' + statusBg + ';color:' + statusCol + '">' + statusLbl + '</span>' +
          (isActive && !isExpired ?
            '<button onclick="adminRevokeKey(' + JSON.stringify(k) + ')" ' +
              'style="padding:5px 12px;background:#fee2e2;border:1.5px solid #fca5a5;' +
              'color:#dc2626;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">Revoke</button>' : '') +
        '</div>' +
      '</div>';
    });
    listEl.innerHTML = html;
  }).catch(function(e) {
    listEl.innerHTML = '<div style="color:#dc2626;font-size:12px;padding:12px">Error: ' + (e.message||e) + '</div>';
  });
}


// ── Licence admin panel — password visibility toggle ──
function toggleLicPassVis() {
  var inp  = document.getElementById('lic-admin-pass');
  var icon = document.getElementById('lic-eye-icon');
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (icon) icon.textContent = '🙈';
  } else {
    inp.type = 'password';
    if (icon) icon.textContent = '👁';
  }
}

// ── Licence admin panel — verify admin password to unlock key management ──
function verifyLicenceAdmin() {
  var pass  = (document.getElementById('lic-admin-pass')?.value || '').trim();
  var errEl = document.getElementById('lic-auth-err');
  var creds = getCredentials();

  if (!pass) {
    if (errEl) { errEl.style.display = 'block'; errEl.textContent = '❌ Please enter your admin password.'; }
    return;
  }

  if (pass !== creds.pass) {
    if (errEl) { errEl.style.display = 'block'; errEl.textContent = '❌ Wrong password. Try again.'; }
    var inp = document.getElementById('lic-admin-pass');
    if (inp) { inp.value = ''; inp.focus(); }
    return;
  }

  // Correct — hide auth wrap, show content
  var authWrap = document.getElementById('lic-auth-wrap');
  var content  = document.getElementById('lic-locked-content');
  if (authWrap) authWrap.style.display = 'none';
  if (content)  content.style.display  = 'block';
  if (errEl)    errEl.style.display    = 'none';
  loadLicencePanel();
  loadDeviceLicenceStatus();
}

function adminGenerateKey() {
  var holder = document.getElementById('new-lic-holder')?.value?.trim() || 'Unknown';
  var expiry = document.getElementById('new-lic-expiry')?.value || null;
  if (!holder || holder === 'Unknown') { toast('⚠️ Enter a holder name first', 'err'); return; }
  var key = createLicenceKey(holder, expiry);
  var result = document.getElementById('new-lic-result');
  var hint   = document.getElementById('new-lic-copy-hint');
  if (result) {
    result.textContent = key;
    result.style.display = 'block';
    if (hint) hint.style.display = 'block';
  }
  navigator.clipboard?.writeText(key).catch(function(){});
  toast('🔑 Key generated & copied: ' + key, 'ok');
  // Refresh the keys list after a moment
  setTimeout(loadLicencePanel, 1000);
}

function adminRevokeKey(keyClean) {
  if (!confirm('Revoke this licence key? The holder will lose access.')) return;
  revokeLicenceKey(keyClean);
  toast('❌ Licence revoked', 'ok');
  setTimeout(loadLicencePanel, 600);
}

function showGuideSection(idx) {
  // Hide all sections
  document.querySelectorAll('.gs-section').forEach(function(el){ el.classList.remove('active'); });
  // Show selected
  var sec = document.getElementById('gs-' + idx);
  if (sec) sec.classList.add('active');
  // Update nav
  document.querySelectorAll('.guide-nav-item').forEach(function(el){ el.classList.remove('active'); });
  var nav = document.getElementById('gnav-' + idx);
  if (nav) nav.classList.add('active');
  // Scroll content to top
  var area = document.getElementById('guide-content-area');
  if (area) area.scrollTop = 0;
}

// ════════════════════════════════════════════════════════════════
//  CUSTOM ITEMS & DEPARTMENTS — persistent via localStorage
// ════════════════════════════════════════════════════════════════

const CUSTOM_KEY = 'pearl_custom_v1';

function loadCustom() {
  try { return JSON.parse(_STORE.getItem(CUSTOM_KEY) || '{}'); } catch(e) { return {}; }
}
function saveCustom(data) { _STORE.setItem(CUSTOM_KEY, JSON.stringify(data)); }

// Apply saved custom depts/items on boot — called in bootApp
function applyCustomData() {
  var custom = loadCustom();
  // Custom departments
  if (custom.depts) {
    custom.depts.forEach(function(d) {
      if (!MASTER[d.name]) {
        MASTER[d.name] = d.items.map(function(it){ return [it[0], it[1], it[2]]; });
        DEPT_ICONS[d.name] = d.icon || '📁';
        DEPT_COLORS[d.name] = d.color || '#1A2332';
      }
    });
  }
  // Extra items added to existing depts
  if (custom.items) {
    Object.keys(custom.items).forEach(function(dept) {
      if (MASTER[dept]) {
        custom.items[dept].forEach(function(it) {
          // avoid duplicates
          if (!MASTER[dept].find(function(m){ return m[0] === it[0]; })) {
            MASTER[dept].push([it[0], it[1], it[2]]);
          }
        });
      }
    });
  }
  // Apply saved item order (from movePriceItem)
  if (custom.order) {
    Object.keys(custom.order).forEach(function(dept) {
      if (!MASTER[dept]) return;
      var orderedNames = custom.order[dept];
      var itemMap = {};
      MASTER[dept].forEach(function(it){ itemMap[it[0]] = it; });
      var reordered = [];
      orderedNames.forEach(function(name){ if (itemMap[name]) reordered.push(itemMap[name]); });
      MASTER[dept].forEach(function(it){ if (orderedNames.indexOf(it[0]) === -1) reordered.push(it); });
      MASTER[dept].length = 0;
      reordered.forEach(function(it){ MASTER[dept].push(it); });
    });
  }

  // Apply item overrides for built-in depts
  if (custom.overrides) {
    Object.keys(custom.overrides).forEach(function(dept) {
      if (MASTER[dept]) {
        MASTER[dept].length = 0;
        custom.overrides[dept].forEach(function(it){ MASTER[dept].push([it[0], it[1], it[2]]); });
      }
    });
  }

  // Rebuild DEPT_KEYS reference (it's const so we splice in place)
  var newKeys = Object.keys(MASTER);
  DEPT_KEYS.length = 0;
  newKeys.forEach(function(k){ DEPT_KEYS.push(k); });
}

// ── ADD ITEM ──────────────────────────────────────────────────────
function openAddItem() {
  document.getElementById('add-item-dept-label').textContent = 'Adding to: ' + priceDept;
  document.getElementById('add-item-dept-name2').textContent = priceDept;
  document.getElementById('new-item-name').value = '';
  document.getElementById('new-item-price').value = '';
  document.getElementById('new-item-kg').value = '';
  document.getElementById('add-item-modal').classList.remove('hidden');
  setTimeout(function(){ document.getElementById('new-item-name').focus(); }, 100);
}
function closeAddItem() { document.getElementById('add-item-modal').classList.add('hidden'); }

function doAddItem() {
  var name  = document.getElementById('new-item-name').value.trim();
  var price = parseFloat(document.getElementById('new-item-price').value) || 0;
  var kg    = parseFloat(document.getElementById('new-item-kg').value) || 0;
  if (!name) { toast('Please enter an item name', 'err'); return; }
  // Add to MASTER
  MASTER[priceDept].push([name, price, kg]);
  // Persist
  var custom = loadCustom();
  if (!custom.items) custom.items = {};
  if (!custom.items[priceDept]) custom.items[priceDept] = [];
  custom.items[priceDept].push([name, price, kg]);
  saveCustom(custom);
  // Refresh prices page
  renderPriceTable();
  closeAddItem();
  toast('✅ "' + name + '" added to ' + priceDept);
}

// ── ADD DEPARTMENT ────────────────────────────────────────────────
function openAddDept() {
  document.getElementById('new-dept-name').value = '';
  document.getElementById('new-dept-icon').value = '';
  document.getElementById('new-dept-items').value = '';
  document.getElementById('add-dept-modal').classList.remove('hidden');
  setTimeout(function(){ document.getElementById('new-dept-name').focus(); }, 100);
}
function closeAddDept() {
  document.getElementById('add-dept-modal').classList.add('hidden');
  var sd = document.getElementById('new-dept-startdate');
  if (sd) sd.value = '';
}

function doAddDept() {
  var name = document.getElementById('new-dept-name').value.trim();
  var icon = document.getElementById('new-dept-icon').value.trim() || '📁';
  var raw  = document.getElementById('new-dept-items').value.trim();
  if (!name) { toast('Please enter a department name', 'err'); return; }
  if (MASTER[name]) { toast('Department "' + name + '" already exists', 'err'); return; }

  // Start date
  var startDate = (document.getElementById('new-dept-startdate')?.value || '').trim();
  if (!startDate) startDate = new Date().toISOString().slice(0,10); // default: today

  // Parse items — store startDate as 4th element on each item
  var items = [];
  raw.split('\n').forEach(function(line) {
    line = line.trim();
    if (!line) return;
    var parts = line.split(',');
    var iname  = (parts[0] || '').trim();
    var iprice = parseFloat((parts[1] || '0').trim()) || 0;
    var ikg    = parseFloat((parts[2] || '0').trim()) || 0;
    if (iname) items.push([iname, iprice, ikg, startDate]);
  });
  if (items.length === 0) { toast('Please add at least one item', 'err'); return; }

  // Add to MASTER and registries
  MASTER[name] = items;
  DEPT_ICONS[name] = icon;
  DEPT_COLORS[name] = '#1A5276';
  DEPT_KEYS.push(name);

  // Persist — include startDate on dept and items
  var custom = loadCustom();
  if (!custom.depts) custom.depts = [];
  custom.depts.push({ name: name, icon: icon, color: '#1A5276', items: items, startDate: startDate });
  saveCustom(custom);

  // Rebuild all selectors and tabs
  buildSelectors();
  priceDept = name;
  renderPriceTable();
  closeAddDept();
  toast('✅ Department "' + name + '" created with ' + items.length + ' items');
}

// ════════════════════════════════════════════════════════════════
//  SUMMARY EXPORTS — Daily / Monthly / Yearly (Pcs, KG, QR)
// ════════════════════════════════════════════════════════════════

function exportSummary(mode) {
  var m = parseInt(document.getElementById('fin-month').value) || (new Date().getMonth() + 1);

  if (mode === 'daily') {
    // All days in selected month — pcs, kg, qr per department per day
    var nd = dim(CY, m);
    var mName = MONTH_NAMES[m-1];
    var rows = [['Day', 'Date'].concat(DEPT_KEYS.flatMap(function(d){ return [d+' Pcs', d+' QR', d+' KG']; })).concat(['Total Pcs','Total QR','Total KG'])];
    for (var day = 1; day <= nd; day++) {
      var date = new Date(CY, m-1, day);
      var row = [day, fmtDate(date)];
      var totPcs=0, totQR=0, totKG=0;
      DEPT_KEYS.forEach(function(dept) {
        var pcs=0, qr=0, kg=0;
        MASTER[dept].forEach(function(_, i) {
          var v = getVal(CY, m, dept, i, day-1);
          pcs += v; qr += v * getP(dept,i); kg += v * getK(dept,i);
        });
        row.push(pcs, +qr.toFixed(2), +kg.toFixed(3));
        totPcs+=pcs; totQR+=qr; totKG+=kg;
      });
      row.push(totPcs, +totQR.toFixed(2), +totKG.toFixed(3));
      rows.push(row);
    }
    // totals row
    var tot = ['TOTAL', ''];
    var colTots = rows[0].slice(2).map(function(){ return 0; });
    for (var r=1; r<rows.length; r++) rows[r].slice(2).forEach(function(v,ci){ colTots[ci]+=v; });
    rows.push(['TOTAL',''].concat(colTots.map(function(v){ return +v.toFixed(3); })));
    downloadSummaryCSV(rows, 'Daily_Summary_' + mName + '_' + CY + '.csv');
    toast('📊 Daily summary downloaded — ' + mName + ' ' + CY);

  } else if (mode === 'monthly') {
    // All months in current year
    var rows = [['Month'].concat(DEPT_KEYS.flatMap(function(d){ return [d+' Pcs', d+' QR', d+' KG']; })).concat(['Total Pcs','Total QR','Total KG'])];
    for (var mi=1; mi<=12; mi++) {
      var nd = dim(CY, mi);
      var row = [MONTH_NAMES[mi-1]];
      var totPcs=0, totQR=0, totKG=0;
      DEPT_KEYS.forEach(function(dept) {
        var pcs=0, qr=0, kg=0;
        for (var d=1; d<=nd; d++) {
          MASTER[dept].forEach(function(_, i) {
            var v = getVal(CY, mi, dept, i, d-1);
            pcs += v; qr += v * getP(dept,i); kg += v * getK(dept,i);
          });
        }
        row.push(pcs, +qr.toFixed(2), +kg.toFixed(3));
        totPcs+=pcs; totQR+=qr; totKG+=kg;
      });
      row.push(totPcs, +totQR.toFixed(2), +totKG.toFixed(3));
      rows.push(row);
    }
    downloadSummaryCSV(rows, 'Monthly_Summary_' + CY + '.csv');
    toast('📅 Monthly summary downloaded — ' + CY);

  } else if (mode === 'yearly') {
    // All years 2026-2035
    var rows = [['Year'].concat(DEPT_KEYS.flatMap(function(d){ return [d+' Pcs', d+' QR', d+' KG']; })).concat(['Total Pcs','Total QR','Total KG'])];
    for (var yr=2026; yr<=2035; yr++) {
      var row = [yr];
      var totPcs=0, totQR=0, totKG=0;
      DEPT_KEYS.forEach(function(dept) {
        var pcs=0, qr=0, kg=0;
        for (var mi2=1; mi2<=12; mi2++) {
          var nd2 = dim(yr, mi2);
          for (var d2=1; d2<=nd2; d2++) {
            MASTER[dept].forEach(function(_, i) {
              var v = getVal(yr, mi2, dept, i, d2-1);
              pcs += v; qr += v * getP(dept,i); kg += v * getK(dept,i);
            });
          }
        }
        row.push(pcs, +qr.toFixed(2), +kg.toFixed(3));
        totPcs+=pcs; totQR+=qr; totKG+=kg;
      });
      row.push(totPcs, +totQR.toFixed(2), +totKG.toFixed(3));
      rows.push(row);
    }
    downloadSummaryCSV(rows, 'Yearly_Summary_All_Years.csv');
    toast('📆 Yearly summary downloaded');
  }
}

// ── Summary dropdown menus ────────────────────────────
function toggleSummaryMenu(e, id) {
  e.stopPropagation();
  var menus = ['sum-menu-daily','sum-menu-monthly','sum-menu-yearly'];
  menus.forEach(function(mid) {
    var el = document.getElementById(mid);
    if (!el) return;
    el.style.display = (mid === id && el.style.display === 'none') ? 'block' : 'none';
  });
}
function closeSummaryMenus() {
  ['sum-menu-daily','sum-menu-monthly','sum-menu-yearly'].forEach(function(mid) {
    var el = document.getElementById(mid);
    if (el) el.style.display = 'none';
  });
}
document.addEventListener('click', function() { closeSummaryMenus(); });

// ── Build summary rows (shared between Excel & PDF) ──
function buildSummaryRows(mode) {
  var m = parseInt(document.getElementById('fin-month').value) || (new Date().getMonth() + 1);
  var rows = [];
  if (mode === 'daily') {
    var nd = dim(CY, m);
    var mName = MONTH_NAMES[m-1];
    rows.push(['Day','Date'].concat(DEPT_KEYS.flatMap(function(d){ return [d+' Pcs', d+' QR', d+' KG']; })).concat(['Total Pcs','Total QR','Total KG']));
    for (var day=1; day<=nd; day++) {
      var date = new Date(CY, m-1, day);
      var row = [day, fmtDate(date)];
      var totPcs=0,totQR=0,totKG=0;
      DEPT_KEYS.forEach(function(dept) {
        var pcs=0,qr=0,kg=0;
        MASTER[dept].forEach(function(_,i){ var v=getVal(CY,m,dept,i,day-1); pcs+=v; qr+=v*getP(dept,i); kg+=v*getK(dept,i); });
        row.push(pcs,+qr.toFixed(2),+kg.toFixed(3)); totPcs+=pcs; totQR+=qr; totKG+=kg;
      });
      row.push(totPcs,+totQR.toFixed(2),+totKG.toFixed(3));
      rows.push(row);
    }
    var colTots=rows[0].slice(2).map(function(){ return 0; });
    for (var r=1;r<rows.length;r++) rows[r].slice(2).forEach(function(v,ci){ colTots[ci]+=v; });
    rows.push(['TOTAL',''].concat(colTots.map(function(v){ return +v.toFixed(3); })));
    return { rows: rows, title: 'Daily Summary — ' + MONTH_NAMES[m-1] + ' ' + CY, filename: 'Daily_Summary_' + MONTH_NAMES[m-1] + '_' + CY };

  } else if (mode === 'monthly') {
    rows.push(['Month'].concat(DEPT_KEYS.flatMap(function(d){ return [d+' Pcs', d+' QR', d+' KG']; })).concat(['Total Pcs','Total QR','Total KG']));
    for (var mi=1; mi<=12; mi++) {
      var nd2=dim(CY,mi), row=[MONTH_NAMES[mi-1]], totPcs=0,totQR=0,totKG=0;
      DEPT_KEYS.forEach(function(dept) {
        var pcs=0,qr=0,kg=0;
        for (var d=1;d<=nd2;d++) MASTER[dept].forEach(function(_,i){ var v=getVal(CY,mi,dept,i,d-1); pcs+=v; qr+=v*getP(dept,i); kg+=v*getK(dept,i); });
        row.push(pcs,+qr.toFixed(2),+kg.toFixed(3)); totPcs+=pcs; totQR+=qr; totKG+=kg;
      });
      row.push(totPcs,+totQR.toFixed(2),+totKG.toFixed(3));
      rows.push(row);
    }
    var colTots=rows[0].slice(1).map(function(){ return 0; });
    for (var r=1;r<rows.length;r++) rows[r].slice(1).forEach(function(v,ci){ colTots[ci]+=v; });
    rows.push(['TOTAL'].concat(colTots.map(function(v){ return +v.toFixed(3); })));
    return { rows: rows, title: 'Monthly Summary — ' + CY, filename: 'Monthly_Summary_' + CY };

  } else {
    rows.push(['Year'].concat(DEPT_KEYS.flatMap(function(d){ return [d+' Pcs', d+' QR', d+' KG']; })).concat(['Total Pcs','Total QR','Total KG']));
    for (var yr=2026; yr<=2035; yr++) {
      var row=[yr], totPcs=0,totQR=0,totKG=0;
      DEPT_KEYS.forEach(function(dept) {
        var pcs=0,qr=0,kg=0;
        for (var mi2=1;mi2<=12;mi2++) { var nd3=dim(yr,mi2); for (var d3=1;d3<=nd3;d3++) MASTER[dept].forEach(function(_,i){ var v=getVal(yr,mi2,dept,i,d3-1); pcs+=v; qr+=v*getP(dept,i); kg+=v*getK(dept,i); }); }
        row.push(pcs,+qr.toFixed(2),+kg.toFixed(3)); totPcs+=pcs; totQR+=qr; totKG+=kg;
      });
      row.push(totPcs,+totQR.toFixed(2),+totKG.toFixed(3));
      rows.push(row);
    }
    return { rows: rows, title: 'Yearly Summary — All Years', filename: 'Yearly_Summary_All_Years' };
  }
}

// ── Excel export for summaries ────────────────────────
function exportSummaryExcel(mode) {
  var data = buildSummaryRows(mode);
  var rows = data.rows, title = data.title, filename = data.filename;
  var wb = XLSX.utils.book_new();
  // Add title row then data
  var wsData = [[title], []].concat(rows);
  var ws = XLSX.utils.aoa_to_sheet(wsData);
  // Style: merge title, bold header
  var colCount = rows[0].length;
  ws['!merges'] = [{s:{r:0,c:0}, e:{r:0,c:colCount-1}}];
  // Column widths
  ws['!cols'] = rows[0].map(function(h,i){ return {wch: i===0?14:i===1?16:10}; });
  XLSX.utils.book_append_sheet(wb, ws, mode.charAt(0).toUpperCase()+mode.slice(1));
  XLSX.writeFile(wb, filename + '.xlsx');
  toast('⬇ Excel downloaded — ' + filename + '.xlsx');
}

// ── PDF export for summaries ──────────────────────────
function exportSummaryPDF(mode) {
  var data = buildSummaryRows(mode);
  var rows = data.rows, title = data.title;
  var headers = rows[0];
  var dataRows = rows.slice(1);

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title><style>';
  html += 'body{font-family:Arial,sans-serif;font-size:10px;margin:20px;color:#1a2332}';
  html += 'h2{font-size:15px;color:#0d1b2e;margin-bottom:4px}';
  html += 'p.sub{font-size:10px;color:#6b7a8d;margin-bottom:14px}';
  html += 'table{border-collapse:collapse;width:100%}';
  html += 'th{background:#0d1b2e;color:#fff;padding:6px 8px;text-align:center;font-size:9px;letter-spacing:.5px;white-space:nowrap}';
  html += 'th:first-child,th:nth-child(2){text-align:left}';
  html += 'td{padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap}';
  html += 'td:first-child,td:nth-child(2){text-align:left;font-weight:500}';
  html += 'tr:nth-child(even) td{background:#f8fafc}';
  html += 'tr:last-child td{font-weight:700;background:#f0f4ff;border-top:2px solid #0d1b2e}';
  html += '.footer{margin-top:16px;font-size:9px;color:#94a3b8;text-align:center}';
  html += '@media print{body{margin:10px}@page{size:A3 landscape;margin:15mm}}';
  html += '</st'+'yle></he'+'ad><body>';
  html += '<h2>' + title + '</h2>';
  html += '<p class="sub">Generated: ' + new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) + ' &nbsp;|&nbsp; © Reda Salah · Laundry Management System</p>';
  html += '<table><thead><tr>' + headers.map(function(h){ return '<th>'+h+'</th>'; }).join('') + '</tr></thead><tbody>';
  dataRows.forEach(function(row) {
    html += '<tr>' + row.map(function(v,i){ return '<td>'+v+'</td>'; }).join('') + '</tr>';
  });
  html += '</tbody></table>';
  html += '<div class="footer">Reda Salah &nbsp;·&nbsp; Laundry Management System &nbsp;·&nbsp; All Rights Reserved</div>';
  html += '</bo'+'dy></ht'+'ml>';

  var w = window.open('','_blank','width=1200,height=700');
  w.document.write(html);
  w.document.close();
  w.onload = function(){ w.print(); };
  toast('🖨 PDF ready — choose Save as PDF in print dialog');
}

function downloadSummaryCSV(rows, filename) {
  var csv = rows.map(function(r){
    return r.map(function(v){
      var s = String(v);
      return s.includes(',') ? '"'+s+'"' : s;
    }).join(',');
  }).join('\n');
  var blob = new Blob([csv], {type:'text/csv'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ════════════════════════════════════════════════════════════════
//  EXPORT CSV
// ════════════════════════════════════════════════════════════════
function exportCSV() {
  let csv = 'Year,Month,Department,Item,Day,Pieces,KG,QR\n';
  MONTH_NAMES.forEach((mn, mi) => {
    const m = mi + 1; const nd = dim(CY, m);
    DEPT_KEYS.forEach(d => MASTER[d].forEach((_, i) => {
      const nm = getN(d, i), pr = getP(d, i), kg = getK(d, i);
      for (let day = 0; day < nd; day++) {
        const v = getVal(CY, m, d, i, day);
        if (v > 0) csv += `${CY},"${mn}","${d}","${nm}",${day+1},${v},${(v*kg).toFixed(3)},${(v*pr).toFixed(4)}\n`;
      }
    }));
  });
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `Pearl_Laundry_${CY}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); toast('✔ CSV downloaded', 'ok');
}

// ════════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════════
let _tt;
function toast(msg, type = '') {
  const el = document.getElementById('toast'); el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(_tt); _tt = setTimeout(() => el.classList.remove('show'), 2800);
}
// Alias — some older functions call showToast() instead of toast()
function showToast(msg, type) { toast(msg, type || ''); }






// ════════════════════════════════════════════════════════════════
// Auto-login + pre-sync credentials from Firebase before login
(function() {
  const u = _SESSION.getItem('ph_user');
  if (u) { bootApp(u); return; }
  // Pre-sync credentials from Firebase so login works on any device
  function preSyncCreds(callback) {
    if (!window._fbLoadKey) { callback(); return; }
    var done = 0;
    function check() { if (++done === 2 && callback) callback(); }
    window._fbLoadKey('pearl/settings/credentials').then(function(v) {
      if (v && v.user && v.pass) { try { _STORE.setItem(CREDS_KEY, JSON.stringify(v)); } catch(e) {} }
      check();
    }).catch(check);
    window._fbLoadKey('pearl/settings/team_accounts').then(function(v) {
      if (v && Array.isArray(v)) { try { _STORE.setItem('pearl_team_accounts', JSON.stringify(v)); } catch(e) {} }
      check();
    }).catch(check);
  }
  if (window._fbReady) {
    preSyncCreds(function(){});
  } else {
    window.addEventListener('resize', function() {
  var mob = document.getElementById('mob-app');
  var desk = document.getElementById('pg-app');
  if (!mob || !desk) return;
  var mobV = mob.style.display === 'flex';
  var deskV = desk.style.display === 'flex';
  if (!mobV && !deskV) return;
  if (isMobile() && deskV) { desk.style.display='none'; mob.style.display='flex'; initMobileApp(); }
  else if (!isMobile() && mobV) { mob.style.display='none'; desk.style.display='flex'; }
});

window.addEventListener('fb-ready', function() { preSyncCreds(function(){}); });
  }
})();


// ════════════════════════════════════════════════════════════════
//  BACKUP & RESTORE
// ════════════════════════════════════════════════════════════════

function getFullBackupObject() {
  var backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    exportedBy: (_SESSION.getItem('ph_user') || 'Admin'),
    data: {},
    prices: {},
    settings: {}
  };
  // Collect all years of data
  for (var y = 2024; y <= 2035; y++) {
    var d = null;
    try { d = JSON.parse(_STORE.getItem('pearl_laundry_' + y) || 'null'); } catch(e) {}
    if (d && Object.keys(d).length > 0) backup.data[y] = d;
    var p = null;
    try { p = JSON.parse(_STORE.getItem('pearl_prices_' + y) || 'null'); } catch(e) {}
    if (p) backup.prices[y] = p;
  }
  // Price schedule
  backup.priceSchedule = _PRICE_SCHEDULE || [];
  // Monthly price versions
  backup.monthlyPrices = {};
  for (var bmy = 2024; bmy <= 2035; bmy++) {
    for (var bmm = 1; bmm <= 12; bmm++) {
      if (hasMonthlyPrices(bmy, bmm)) {
        backup.monthlyPrices[bmy + '_' + String(bmm).padStart(2,'0')] = loadPRM(bmy, bmm);
      }
    }
  }
  // Settings
  ['pearl_credentials','pearl_team_accounts','pearl_tab_access'].forEach(function(k) {
    try {
      var v = JSON.parse(_STORE.getItem(k) || 'null');
      if (v) backup.settings[k] = v;
    } catch(e) {}
  });
  return backup;
}

// ── Option 1: Export JSON to file ────────────────────────────
function exportBackupJSON() {
  var backup = getFullBackupObject();
  var json = JSON.stringify(backup, null, 2);
  var blob = new Blob([json], {type: 'application/json;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  var dateStr = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = 'Pearl_Backup_' + dateStr + '.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  var years = Object.keys(backup.data);
  var totalKeys = years.reduce(function(s, y){ return s + Object.keys(backup.data[y]).length; }, 0);
  showBackupMsg('backup-file-msg', '✅ Backup downloaded! Contains ' + years.length + ' year(s) · ' + totalKeys + ' data entries.', 'ok');
  toast('💾 Backup file downloaded', 'ok');
  renderBackupTab();
}

// ── Option 1: Import/Restore from JSON file ───────────────────
function importBackupJSON(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var backup = JSON.parse(e.target.result);
      if (!backup || !backup.data) {
        showBackupMsg('backup-file-msg', '❌ Invalid backup file — missing data.', 'err'); return;
      }
      if (!confirm('Restore from backup dated ' + (backup.exportedAt || 'unknown') + '? This will MERGE the backup. No data will be deleted.')) {

        input.value = ''; return;
        input.value = ''; return;
      }
      var restoredYears = 0, restoredKeys = 0;
      // Restore data — MERGE, never overwrite with less
      Object.keys(backup.data).forEach(function(y) {
        var backupYear = backup.data[y];
        var existing = {};
        try { existing = JSON.parse(_STORE.getItem('pearl_laundry_' + y) || '{}'); } catch(ex) {}
        var merged = Object.assign({}, backupYear, existing); // existing wins on conflict
        _STORE.setItem('pearl_laundry_' + y, JSON.stringify(merged));
        _DB[y] = merged;
        if (window._fbSaveKey) window._fbSaveKey('pearl/data/' + y, merged);
        restoredYears++;
        restoredKeys += Object.keys(merged).length;
      });
      // Restore prices
      if (backup.prices) {
        Object.keys(backup.prices).forEach(function(y) {
          var existing = null;
          try { existing = JSON.parse(_STORE.getItem('pearl_prices_' + y) || 'null'); } catch(ex) {}
          if (!existing) {
            _STORE.setItem('pearl_prices_' + y, JSON.stringify(backup.prices[y]));
            if (window._fbSaveKey) window._fbSaveKey('pearl/prices/' + y, backup.prices[y]);
          }
        });
      }
      input.value = '';
      showBackupMsg('backup-file-msg', '✅ Restored ' + restoredYears + ' year(s) · ' + restoredKeys + ' entries merged. Refreshing...', 'ok');
      toast('✅ Backup restored successfully!', 'ok');
      setTimeout(function(){ PRICES = loadPR(CY); renderDash(); renderEntry(); renderBackupTab(); }, 800);
    } catch(err) {
      showBackupMsg('backup-file-msg', '❌ Error reading file: ' + err.message, 'err');
      input.value = '';
    }
  };
  reader.readAsText(file);
}

// ── Option 4: Save Cloud Backup ───────────────────────────────
// ══════════════════════════════════════════════════════════════
//  AUTO-SYNC: Pull ALL occupancy from Firebase on startup
// ══════════════════════════════════════════════════════════════
function autoSyncOccupancyFromFB() {
  if (!window._fbDB) return;
  // Use the correct total rooms — read fresh from storage
  try {
    var _hs2 = JSON.parse(localStorage.getItem('pearl_hotel_settings') || '{}');
    var _bs2 = JSON.parse(localStorage.getItem('pearl_bench_settings') || '{}');
    var _correctRooms = _bs2.totalRooms || _hs2.rooms || _TOTAL_ROOMS || 161;
    if (_correctRooms > 0) _TOTAL_ROOMS = _correctRooms;
  } catch(e) {}
  // Sync current year and previous year occupancy from correct path
  [CY, CY-1].forEach(function(y) {
    window._fbDB.ref('pearl/occupancy/' + y).once('value').then(function(snap) {
      var yearData = snap.val();
      if (!yearData) return;
      Object.keys(yearData).forEach(function(m) {
        var monthData = yearData[m];
        if (!monthData || typeof monthData !== 'object') return;
        Object.keys(monthData).forEach(function(d) {
          var key = 'occ_' + y + '_' + m + '_' + d;
          _STORE.setItem(key, JSON.stringify(monthData[d]));
        });
      });
      console.log('[AutoSync] Occupancy synced for year ' + y);
    }).catch(function(){});
  });
}

// ══════════════════════════════════════════════════════════════
//  DAILY AUTO-BACKUP — silent, no user action needed
// ══════════════════════════════════════════════════════════════
function checkAndRunDailyAutoBackup() {
  var today     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  var lastAuto  = _STORE.getItem('pearl_last_auto_backup') || '';
  if (lastAuto === today) return; // Already done today
  // Wait 10 seconds after login to not slow down startup
  setTimeout(function() {
    runDailyAutoBackup(today);
  }, 10000);
}

function runDailyAutoBackup(dateStr) {
  if (!window._fbSaveKey) return;
  var backup  = getFullBackupObject();
  var user    = (_SESSION ? _SESSION.getItem('ph_user') : null) || 'Auto';
  var ts      = new Date().toISOString();
  var verId   = 'auto_' + dateStr;
  var years   = backup.data ? Object.keys(backup.data).length : 0;

  // Save daily auto-backup (keyed by date — overwrites same day)
  window._fbSaveKey('pearl/backup/daily/' + verId, backup).then(function() {
    _STORE.setItem('pearl_last_auto_backup', dateStr);
    console.log('[AutoBackup] Daily backup saved: ' + verId);

    // Also update latest
    window._fbSaveKey('pearl/backup/latest', backup);

    // Add to index
    var meta = { id: verId, savedAt: ts, savedBy: user + ' (auto)', years: years, auto: true, label: dateStr + ' (daily auto)' };
    (window._fbLoadKey ? window._fbLoadKey('pearl/backup/index') : Promise.resolve(null))
    .then(function(idx) {
      var index = Array.isArray(idx) ? idx : [];
      // Remove old auto entry for same date if exists
      index = index.filter(function(v) { return v.id !== verId; });
      index.unshift(meta);
      // Keep max 30 versions total
      if (index.length > 30) index = index.slice(0, 30);
      window._fbSaveKey('pearl/backup/index', index);
      try { _STORE.setItem('pearl_backup_index', JSON.stringify(index)); } catch(e) {}
    }).catch(function(){});
  }).catch(function(err) {
    console.log('[AutoBackup] Failed: ' + err.message);
  });
}

// ══════════════════════════════════════════════════════════════
//  BACKUP HISTORY SYSTEM — versioned cloud backups
// ══════════════════════════════════════════════════════════════
var _MAX_BACKUP_VERSIONS = 10;

function saveCloudBackup() {
  if (!window._fbSaveKey) {
    showBackupMsg('backup-cloud-msg', '❌ Firebase not connected.', 'err'); return;
  }
  var backup = getFullBackupObject();
  showBackupMsg('backup-cloud-msg', '⏳ Saving to cloud...', 'info');
  // Save latest + create versioned snapshot
  window._fbSaveKey('pearl/backup/latest', backup);

  var ts      = new Date().toISOString();
  var verId   = ts.replace(/[:.]/g, '-');
  var user    = (_SESSION ? _SESSION.getItem('ph_user') : null) || 'Admin';
  var years   = backup.data ? Object.keys(backup.data).length : 0;
  var size    = JSON.stringify(backup).length;
  var verMeta = { id: verId, savedAt: ts, savedBy: user, years: years, size: size };

  // Load index → add new → trim to 10 → save
  (window._fbLoadKey ? window._fbLoadKey('pearl/backup/index') : Promise.resolve(null))
  .then(function(idx) {
    var index = Array.isArray(idx) ? idx : [];
    index.unshift(verMeta);
    if (index.length > _MAX_BACKUP_VERSIONS) {
      var removed = index.splice(_MAX_BACKUP_VERSIONS);
      removed.forEach(function(old) {
        if (window._fbDB) window._fbDB.ref('pearl/backup/versions/' + old.id).remove();
      });
    }
    return Promise.all([
      window._fbSaveKey('pearl/backup/versions/' + verId, backup),
      window._fbSaveKey('pearl/backup/index', index)
    ]).then(function() {
      try { _STORE.setItem('pearl_backup_index', JSON.stringify(index)); } catch(e) {}
      var ts2 = new Date().toLocaleString();
      _STORE.setItem('pearl_last_cloud_backup', ts2);
      showBackupMsg('backup-cloud-msg', '✅ Cloud backup saved at ' + ts2 + ' — version ' + index.length + ' of ' + _MAX_BACKUP_VERSIONS + ' kept', 'ok');
      toast('☁️ Backup saved — version ' + index.length + ' stored', 'ok');
      // Render directly with the new index — no Firebase reload needed
      _renderBackupIndexDirect(index);
    });
  }).catch(function(err) {
    showBackupMsg('backup-cloud-msg', '❌ Cloud save failed: ' + (err.message || err), 'err');
  });
}

function restoreFromVersion(verId) {
  if (!confirm('Restore from this backup version?\n\nBackup data will be restored. Any entries missing locally will be added back.\nContinue?')) return;
  if (!window._fbLoadKey) { toast('❌ Firebase not connected', 'err'); return; }
  toast('⏳ Loading backup...', 'info');
  window._fbLoadKey('pearl/backup/versions/' + verId).then(function(backup) {
    if (!backup || !backup.data) { toast('❌ Backup version not found or empty', 'err'); return; }
    var restoredYears = 0;
    var saves = [];
    Object.keys(backup.data).forEach(function(y) {
      var backupYear = backup.data[y];
      if (!backupYear || typeof backupYear !== 'object') return;
      var existing = {};
      try { existing = JSON.parse(_STORE.getItem('pearl_laundry_' + y) || '{}'); } catch(e) {}
      // Backup wins — existing local fills in anything backup does not have
      var merged = Object.assign({}, existing, backupYear);
      _STORE.setItem('pearl_laundry_' + y, JSON.stringify(merged));
      _DB[y] = merged;
      // Push restored data back to Firebase so live listener does not overwrite it
      if (window._fbSaveKey) saves.push(window._fbSaveKey('pearl/data/' + y, merged));
      restoredYears++;
    });
    Promise.all(saves).then(function() {
      toast('✅ Restored ' + restoredYears + ' year(s) — data saved to cloud', 'ok');
      setTimeout(function() { PRICES = loadPR(CY); renderDash(); renderEntry(); renderBackupTab(); }, 900);
    }).catch(function() {
      toast('⚠️ Restored locally but cloud sync failed — check connection', 'warn');
      setTimeout(function() { PRICES = loadPR(CY); renderDash(); renderEntry(); renderBackupTab(); }, 900);
    });
  }).catch(function(err) { toast('❌ Restore failed: ' + (err.message || err), 'err'); });
}


// ── Restore ONLY prices from a backup version (entry data untouched) ──
function restorePricesFromVersion(verId) {
  var box = document.createElement('div');
  box.id = '_restore_prices_confirm';
  box.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:99999;' +
    'background:#fff;border:2px solid #fde68a;border-radius:12px;' +
    'padding:16px 20px;box-shadow:0 8px 32px rgba(0,0,0,.2);max-width:320px;font-family:inherit';
  var t = document.createElement('div');
  t.style.cssText = 'font-size:13px;font-weight:700;color:#0d1b2e;margin-bottom:4px';
  t.textContent = '💰 Restore prices from this backup?';
  var s = document.createElement('div');
  s.style.cssText = 'font-size:12px;color:#64748b;margin-bottom:12px;line-height:1.5';
  s.textContent = 'This will restore the prices and price schedule saved in this backup. Your entry data will NOT be changed.';
  var row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px';
  var yes = document.createElement('button');
  yes.style.cssText = 'flex:1;padding:8px;background:#92400e;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer';
  yes.textContent = 'Yes — Restore Prices';
  yes.onclick = function() {
    box.remove();
    _doRestorePricesFromVersion(verId);
  };
  var no = document.createElement('button');
  no.style.cssText = 'flex:1;padding:8px;background:#f1f5f9;color:#64748b;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer';
  no.textContent = 'Cancel';
  no.onclick = function() { box.remove(); };
  row.appendChild(yes); row.appendChild(no);
  box.appendChild(t); box.appendChild(s); box.appendChild(row);
  document.body.appendChild(box);
}

function _doRestorePricesFromVersion(verId) {
  if (!window._fbLoadKey) { toast('❌ Firebase not connected', 'err'); return; }
  toast('⏳ Loading backup...', 'info');

  window._fbLoadKey('pearl/backup/versions/' + verId).then(function(backup) {
    if (!backup) { toast('❌ Backup version not found', 'err'); return; }

    var restoredYears = 0;
    var tasks = [];

    // ── Restore prices for each year ──
    if (backup.prices) {
      Object.keys(backup.prices).forEach(function(y) {
        var yr = parseInt(y);
        var prices = backup.prices[y];
        if (!prices || typeof prices !== 'object') return;
        try { _STORE.setItem(prKey(yr), JSON.stringify(prices)); } catch(e) {}
        if (yr === CY) PRICES = prices;
        if (window._fbSaveKey) tasks.push(window._fbSaveKey(fbPricePath(yr), prices));
        restoredYears++;
      });
    } else {
      toast('⚠️ No price data found in this backup version', 'warn');
      return;
    }

    // ── Restore monthly price versions if present ──
    if (backup.monthlyPrices) {
      Object.keys(backup.monthlyPrices).forEach(function(key) {
        var parts = key.split('_');
        var yr = parseInt(parts[0]);
        var mm = parseInt(parts[1]);
        var prices = backup.monthlyPrices[key];
        if (!prices) return;
        try { _STORE.setItem(prKeyM(yr,mm), JSON.stringify(prices)); } catch(e) {}
        if (window._fbSaveKey) tasks.push(window._fbSaveKey(fbPricePathM(yr,mm), prices));
      });
    }

    // ── Restore price schedule ──
    if (backup.priceSchedule !== undefined) {
      _PRICE_SCHEDULE = Array.isArray(backup.priceSchedule) ? backup.priceSchedule : [];
    } else {
      // No schedule in backup — clear the current one (safer than keeping bad one)
      _PRICE_SCHEDULE = [];
    }
    savePriceSchedule();

    Promise.all(tasks).then(function() {
      toast('✅ Prices restored from backup (' + restoredYears + ' year(s)) — schedule reset', 'ok');
      setTimeout(function() {
        try { renderDash(); } catch(e) {}
        try { renderEntry(); } catch(e) {}
        try { renderFinance(); } catch(e) {}
        try { renderPriceScheduleList(); } catch(e) {}
      }, 500);
    }).catch(function() {
      toast('⚠️ Prices restored locally — cloud sync issue', 'warn');
    });

  }).catch(function(e) { toast('❌ Failed: ' + (e.message||e), 'err'); });
}


// ════════════════════════════════════════════════════════════════
//  MONTHLY PRICE VERSION MANAGER
//  Lock past months + create per-month price tables
//  This prevents any future price changes from affecting past data
// ════════════════════════════════════════════════════════════════

// ── Lock all entries in a month: stamp current price on every entry ──
// After locking, that month's revenue is frozen regardless of price changes

// ════════════════════════════════════════════════════════════════
//  APRIL 2026 PRICES — Pre-calculated from 2025 Excel +3.5%
//  Source: Pearl_Price_List_2025.xlsx uploaded by Reda Salah
//  Formula: Excel 2025 base price × 1.035
//  Generated: 2026-04-01
// ════════════════════════════════════════════════════════════════
var _APRIL_2026_PRICES = {"Rooms Linen":[["King Bottom Sheet",1.5525,1.151],["King Top Sheet XL",1.5525,0.961],["King Duvet Cover",1.8112,1.471],["Queen Bottom Sheet",1.3972,1.151],["Queen Top Sheet XL",1.3972,0.961],["Queen Duvet Cover",1.656,1.471],["Full Bottom Sheet",1.5525,0.955],["Full Top Sheet XL",1.5525,0.865],["Full Duvet Cover",1.8112,1.238],["Twin Bottom Sheet",1.3972,0.814],["Twin Top Sheet XL",1.3972,0.7],["Twin Duvet Cover",1.656,1.037],["Pillow Case Plain",0.621,0.175],["Euro-Sham",0.621,0.17],["King Pillow Case",0.621,0.175],["King Pillow Sham",0.621,0.175],["Standard Pillow Sham",0.621,0.133],["Standard Pillow Case",0.621,0.133],["Standard Pillow Protector",0.621,0.133],["Euro Protector",0.621,0.175],["King Pillow Protector",0.621,0.127],["Standard Bathrobe",1.8112,1.268],["Bath Towel",1.035,0.756],["Face Towels",0.3105,0.06],["Hand Towel",0.6727,0.229],["Bath Mat",0.621,0.416],["Bath Rug Big",1.1902,1.849],["Bath Rug Small",1.1902,1.111],["Pillow",3.6225,1.217],["Duvet Insert King",4.6575,2.34],["Duvet Insert Queen",4.6575,2.14],["Duvet Insert Twin",4.6575,2.02],["Duvet Insert Full",4.6575,2.12],["Cushion Cover",0.7762,0.695],["Foot Mat/Turndown Mat",0.621,0.105],["Mattress Protector",1.9665,2.103],["Blanket",4.6575,2.478],["Sheer Curtain",3.105,2.0],["Heavy Curtain",5.175,12.0],["Mattress Topper",31.05,7.0]],"F & B":[["White Napkins",0.414,0.07],["Cocktail Napkins",0.414,0.055],["Curtains",3.105,2.0],["White Brown Stripe Napkins",0.414,0.07],["Black Napkins",0.414,0.07],["Table Cloth",2.07,0.65]],"Spa & Pool":[["Spa Bath Towels",1.035,0.757],["Spa Hand Towels",0.7245,0.217],["Gym Towels",0.5175,0.217],["Spa Bath Mats",0.621,0.383],["Spa Bath Rugs",1.035,1.1],["Spa Bathrobes",1.8112,1.057],["Pool Towels",1.3455,0.755],["Spa Face Cradel",0.621,0.145],["Spa Client Sheet",0.9315,1.28],["Spa Table Bed Sheet",1.1385,1.187],["Relaxation Plaid",0.828,1.47],["Message Bed Sheet",1.1385,1.187],["Sunbed Matress Covers",5.175,2.193],["Sunbed Covers (Terry)",5.175,1.268],["Cabanna Share Curtain",2.07,1.0],["Spa Face Towel",0.2587,0.06]],"Uniform":[["Chef Jacket",1.8112,0.76],["Chef Trouser",1.656,0.433],["Coat",2.8462,1.3],["Dress",3.6225,0.495],["Jacket",2.8462,1.22],["Scarf",0.828,0.35],["Blouse",1.7595,0.35],["Shorts",1.035,0.365],["Skirt",1.7077,0.374],["Shirt",1.5525,0.36],["Trouser",1.656,0.45],["T-Shirt/Tunic",1.1385,0.365],["Waist Coat",1.8112,1.45],["Tie",0.828,0.06],["Handkerchief",0.621,0.05],["Apron",0.9315,0.325],["Chef Hat",0.621,0.05],["Tunic",1.1385,0.365]],"Others":[["Small Cushion Cover",0.7762,0.695],["Big Cushion Cover",3.6225,0.885],["Chair Cover",2.5875,0.66],["Banquet Table Cloth",2.07,1.8],["Black Cocktail",0.414,0.085],["Spa Pillow Case",0.621,0.14],["Table Runner",1.2937,1.75],["Head Band",0.621,0.06],["Sofa Big Cover",22.77,2.4],["Sofa Medium Cover",18.63,1.3],["Sofa Small Cover",16.56,0.88],["Sofa Header",20.7,1.2],["Cushion Covers Pillow Size",10.35,0.24],["Cushion Covers Big Size",15.525,0.45],["Single Mattress Cover",28.98,2.24],["Double Mattress Cover (Cabana)",31.05,4.24],["Side Cover",12.42,0.66],["Spa Blanket",4.6575,2.478],["Eye Mask Cover",0.621,0.09]],"Dry Cleaning":[["Sofa Big Cover (150x150cm)",31.05,2.4],["Sofa Medium Cover (98x75cm)",25.875,1.3],["Sofa Small Cover (72x72cm)",20.7,0.88],["Sofa Header (150x65cm)",25.875,1.2],["Cushion Covers Pillow Size (42x42cm)",15.525,0.24],["Cushion Covers Big Size (55x55cm)",20.7,0.45],["Single Mattress Cover (195x90cm)",34.155,2.24],["Double Mattress Cover Cabana (198x190cm)",39.33,4.24],["Side Cover",15.525,0.66]]};


function _closeAprModal() {
  var els = document.querySelectorAll('div[style*="position:fixed"][style*="z-index:9900"]');
  els.forEach(function(el) { el.remove(); });
}

function applyApril2026Prices() {
  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9900;display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit';

  box.innerHTML =
    '<div style="background:#fff;border-radius:14px;padding:28px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
      '<div style="font-size:16px;font-weight:800;color:#0d1b2e;margin-bottom:8px">📋 Apply April 2026 Prices</div>' +
      '<div style="font-size:12px;color:#64748b;margin-bottom:16px;line-height:1.6">' +
        'This will set the <strong>April 2026 monthly price table</strong> using:<br>' +
        '✅ Your 2025 Excel prices as the base<br>' +
        '✅ +3.5% increase applied to every item<br>' +
        '✅ Jan/Feb/Mar 2026 prices are NOT touched<br>' +
        '✅ Only April onwards uses these prices' +
      '</div>' +
      '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px">' +
        '<div style="font-weight:700;color:#15803d;margin-bottom:6px">Sample prices (April vs Jan/Feb/Mar):</div>' +
        '<div style="display:grid;grid-template-columns:1fr auto auto;gap:4px 12px;font-size:11px">' +
          '<span style="color:#64748b;font-weight:700">Item</span><span style="color:#dc2626;font-weight:700">Before</span><span style="color:#16a34a;font-weight:700">April</span>' +
          '<span>Bath Towel</span><span style="color:#dc2626">1.0500</span><span style="color:#16a34a">1.0350</span>' +
          '<span>King Bottom Sheet</span><span style="color:#dc2626">1.5750</span><span style="color:#16a34a">1.5525</span>' +
          '<span>White Napkins</span><span style="color:#dc2626">0.4200</span><span style="color:#16a34a">0.4140</span>' +
          '<span>Chef Jacket</span><span style="color:#dc2626">1.8375</span><span style="color:#16a34a">1.8112</span>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button id="_apr_yes" style="flex:1;padding:12px;background:linear-gradient(135deg,#0d1b2e,#1e3a5f);color:#c9a84c;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer">✅ Apply April 2026 Prices</button>' +
        '<button onclick="_closeAprModal()" style="padding:12px 16px;background:#f1f5f9;color:#64748b;border:none;border-radius:9px;font-size:13px;cursor:pointer">Cancel</button>' +
      '</div>' +
      '<div id="_apr_msg" style="display:none;margin-top:10px;font-size:12px;text-align:center;font-weight:600"></div>' +
    '</div>';

  document.body.appendChild(box);

  box.querySelector('#_apr_yes').onclick = function() {
    var btn = this;
    btn.textContent = '⏳ Applying...';
    btn.disabled = true;

    // Write April 2026 monthly price table
    try {
      _STORE.setItem(prKeyM(2026, 4), JSON.stringify(_APRIL_2026_PRICES));
      if (typeof invalidatePriceCache === 'function') invalidatePriceCache(2026, 4);
    } catch(e) {
      console.error('Failed to save April prices locally:', e);
    }

    // Save to Firebase
    if (window._fbSaveKey) {
      window._fbSaveKey(fbPricePathM(2026, 4), _APRIL_2026_PRICES).then(function() {
        var msg = box.querySelector('#_apr_msg');
        msg.style.color = '#16a34a';
        msg.textContent = '✅ April 2026 prices saved successfully!';
        msg.style.display = 'block';
        btn.textContent = '✅ Done!';
        setTimeout(function() {
          box.remove();
          try { renderEntry(); } catch(e) {}
          try { renderDash(); } catch(e) {}
          try { renderFinance(); } catch(e) {}
          toast('✅ April 2026 prices applied — 2025 base +3.5%', 'ok');
          openMonthlyPriceManager();
        }, 1500);
      }).catch(function(e) {
        var msg = box.querySelector('#_apr_msg');
        msg.style.color = '#dc2626';
        msg.textContent = '⚠️ Saved locally but Firebase sync failed. Try again.';
        msg.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '✅ Apply April 2026 Prices';
      });
    } else {
      var msg = box.querySelector('#_apr_msg');
      msg.style.color = '#d97706';
      msg.textContent = '⚠️ Firebase not ready — saved locally only. Prices will sync when connected.';
      msg.style.display = 'block';
      setTimeout(function() {
        box.remove();
        try { renderEntry(); } catch(e) {}
        try { renderDash(); } catch(e) {}
        toast('✅ April 2026 prices applied (local)', 'ok');
      }, 2000);
    }
  };
}

function lockMonthPrices(y, m) {
  var db = loadDB(y);
  var nd = dim(y, m);
  var locked = 0;
  var mpr = loadPRM(y, m); // get the month's prices (monthly version or year fallback)

  DEPT_KEYS.forEach(function(dept) {
    MASTER[dept].forEach(function(_, i) {
      for (var day = 0; day < nd; day++) {
        var key = m + '-' + dept + '-' + i + '-' + day;
        if (db[key] && db[key] > 0 && !db[key + '-p']) {
          // Entry exists but not yet locked — lock it now
          var price = mpr[dept] ? (mpr[dept][i] ? mpr[dept][i][1] : MASTER[dept][i][1]) : MASTER[dept][i][1];
          var kg    = mpr[dept] ? (mpr[dept][i] ? mpr[dept][i][2] : MASTER[dept][i][2]) : MASTER[dept][i][2];
          db[key + '-p'] = price;
          db[key + '-k'] = kg;
          locked++;
        }
      }
    });
  });

  if (locked > 0) {
    saveDB(y);
    // Also create a monthly price snapshot so this month always uses its own prices
    if (!hasMonthlyPrices(y, m)) {
      createMonthlyPrices(y, m, mpr);
    }
  }
  return locked;
}

// ── Set up April (or any future month) with new prices ──
// Creates a monthly price version by applying % change to previous month
function createMonthlyPriceVersion(y, m, sourcePct) {
  // Source: previous month's prices (or year prices if no previous month version)
  var prevM = m === 1 ? 12 : m - 1;
  var prevY = m === 1 ? y - 1 : y;
  var sourcePrices = hasMonthlyPrices(prevY, prevM) ? loadPRM(prevY, prevM) : loadPR(y);

  var newPrices = {};
  DEPT_KEYS.forEach(function(d) {
    var src = sourcePrices[d] || MASTER[d];
    newPrices[d] = src.map(function(item) {
      return [
        item[0],
        Math.round(item[1] * (1 + sourcePct/100) * 10000) / 10000,
        item[2]
      ];
    });
  });

  savePRM(y, m, newPrices);
  if (typeof invalidatePriceCache === 'function') invalidatePriceCache(y, m);
  return newPrices;
}

// ── UI: Lock Past Months Panel ──


function _closeCreateMonth() {
  var el = document.getElementById('_create_month_prices');
  if (el) el.remove();
}

function _closeMPM() {
  var el = document.getElementById('_mpm_modal');
  if (el) el.remove();
}

function openMonthlyPriceManager() {
  var existing = document.getElementById('_mpm_modal');
  if (existing) { existing.remove(); return; }

  var modal = document.createElement('div');
  modal.id = '_mpm_modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9800;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';

  var MONTH_NAMES_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var today = new Date();
  var curM  = today.getMonth() + 1;

  // ── Check for unlocked past months and build reminder ──
  var unlocked = [];
  for (var mi = 1; mi < curM; mi++) {
    // Check if this past month has data but no locked entries
    var nd = dim(CY, mi);
    var hasData = false;
    var hasLocked = false;
    var db = loadDB(CY);
    DEPT_KEYS.forEach(function(dept) {
      MASTER[dept].forEach(function(_, i) {
        for (var d = 0; d < nd; d++) {
          var key = mi + '-' + dept + '-' + i + '-' + d;
          if (db[key] && db[key] > 0) {
            hasData = true;
            if (db[key + '-p']) hasLocked = true;
          }
        }
      });
    });
    if (hasData && !hasLocked) unlocked.push(mi);
  }

  // Build month rows
  var rows = '';
  for (var mi = 1; mi <= 12; mi++) {
    var isPast    = mi < curM;
    var isCurrent = mi === curM;
    var isFuture  = mi > curM;
    var hasM      = hasMonthlyPrices(CY, mi);
    var locked    = isPast || isCurrent;

    var statusBg  = hasM ? '#f0fdf4' : (isPast ? '#fff7ed' : '#f8fafc');
    var statusBdr = hasM ? '#86efac' : (isPast ? '#fde68a' : '#e2e8f0');
    var statusTxt = hasM ? '<span style="color:#16a34a;font-weight:700;font-size:11px">✅ Monthly prices set</span>'
                  : isPast ? '<span style="color:#d97706;font-weight:700;font-size:11px">⚠️ Uses year prices</span>'
                  : '<span style="color:#94a3b8;font-size:11px">Future month</span>';

    var btns = '';
    if (isPast || isCurrent) {
      btns += '<button onclick="_lockMonth(' + mi + ')" style="padding:5px 10px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer" title="Stamp locked prices on all entries in this month">🔒 Lock Entries</button> ';
    }
    if (!hasM) {
      btns += '<button onclick="_createMonthPrices(' + mi + ')" style="padding:5px 10px;background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer" title="Create a dedicated price table for this month">📋 Set Prices</button>';
    } else {
      btns += '<button onclick="_editMonthPrices(' + mi + ')" style="padding:5px 10px;background:#f0fdf4;color:#15803d;border:1.5px solid #86efac;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">✏️ Edit Prices</button>';
    }

    rows += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:' + statusBg + ';border:1.5px solid ' + statusBdr + ';border-radius:10px;margin-bottom:8px;flex-wrap:wrap">' +
      '<div style="width:48px;height:36px;background:#0d1b2e;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#c9a84c;flex-shrink:0">' + MONTH_NAMES_S[mi-1] + '</div>' +
      '<div style="flex:1;min-width:0">' + statusTxt + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' + btns + '</div>' +
    '</div>';
  }

  modal.innerHTML =
    '<div style="background:#fff;border-radius:18px;width:580px;max-width:96vw;max-height:88vh;overflow:hidden;display:flex;flex-direction:column">' +
      '<div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);padding:18px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">' +
        '<div>' +
          '<div style="font-size:16px;font-weight:800;color:#c9a84c">📅 Monthly Price Manager — ' + CY + '</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:2px">Set independent prices per month · Lock past entries permanently</div>' +
        '</div>' +
                '<button onclick="_closeMPM()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer">✕</button>' +
      '</div>' +
      // Unlocked months warning banner
      (unlocked.length > 0 ?
        '<div style="padding:14px 20px;background:#fef2f2;border-bottom:2px solid #fca5a5;font-size:12px;color:#dc2626;line-height:1.6">' +
          '<strong>⚠️ Action Required — Lock Past Months Before Changing Prices</strong><br>' +
          'The following months have data but entries are not locked yet: <strong>' +
          unlocked.map(function(m){ return MONTH_NAMES_S[m-1]; }).join(', ') +
          '</strong><br>' +
          '<span style="font-size:11px;color:#7f1d1d">Click 🔒 Lock Entries on each one before setting new prices — this permanently protects their revenue calculations.</span>' +
        '</div>' : '') +
      '<div style="padding:14px 20px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:12px;color:#92400e;line-height:1.6">' +
        '<strong>How it works:</strong> ' +
        '① Lock past months (🔒 Lock Entries) to freeze their prices permanently. ' +
        '② Set prices for the new month (📋 Set Prices or 🚀 Apply April Prices). ' +
        '③ Each month is fully isolated — changing one never affects another.' +
      '</div>' +
      '<div style="padding:12px 20px;background:#f0fdf4;border-bottom:1.5px solid #86efac;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
        '<div style="font-size:12px;color:#15803d;line-height:1.5">' +
          '<strong>April 2026 prices ready:</strong> Pre-calculated from your 2025 Excel price list +3.5%.<br>' +
          '<span style="font-size:11px">Bath Towel: 1.0500 → 1.0350 · King Bottom Sheet: 1.5750 → 1.5525 · Chef Jacket: 1.8375 → 1.8112</span>' +
        '</div>' +
        '<button onclick="applyApril2026Prices()" style="padding:10px 18px;background:linear-gradient(135deg,#c9a84c,#a8861e);color:#0d1b2e;border:none;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0">🚀 Apply April Prices</button>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px 20px" id="_mpm_rows">' + rows + '</div>' +
      '<div style="padding:12px 20px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end">' +
                '<button onclick="_closeMPM()" style="padding:9px 20px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Close</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);
}

function _lockMonth(m) {
  var locked = lockMonthPrices(CY, m);
  var MONTH_NAMES_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (locked > 0) {
    toast('🔒 ' + MONTH_NAMES_S[m-1] + ' locked — ' + locked + ' entries frozen at current prices', 'ok');
  } else {
    toast('ℹ️ ' + MONTH_NAMES_S[m-1] + ' — no new entries to lock (already locked or no data)', 'ok');
  }
  // Refresh the modal
  document.getElementById('_mpm_modal').remove();
  setTimeout(openMonthlyPriceManager, 200);
}

function _createMonthPrices(m) {
  // Create monthly price version for this month
  // Show a quick input for % adjustment vs previous month
  var MONTH_NAMES_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  var box = document.createElement('div');
  box.id = '_create_month_prices';
  box.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9900;display:flex;align-items:center;justify-content:center;padding:20px';

  var prevM = m === 1 ? 12 : m - 1;
  var prevLabel = MONTH_NAMES_S[prevM-1];
  var monthLabel = MONTH_NAMES_S[m-1];

  box.innerHTML =
    '<div style="background:#fff;border-radius:14px;padding:24px;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
      '<div style="font-size:15px;font-weight:800;color:#0d1b2e;margin-bottom:4px">📋 Set ' + monthLabel + ' ' + CY + ' Prices</div>' +
      '<div style="font-size:12px;color:#64748b;margin-bottom:16px;line-height:1.5">Choose how to set prices for ' + monthLabel + '. The previous month (' + prevLabel + ') is used as the base.</div>' +
      '<div style="margin-bottom:12px">' +
        '<div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px">% CHANGE FROM ' + prevLabel.toUpperCase() + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<input id="_mpm_pct" type="number" step="0.01" placeholder="e.g. 3.5 or 0 for same prices" style="flex:1;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-weight:700;color:#0d1b2e;outline:none">' +
          '<span style="font-weight:700;color:#64748b">%</span>' +
        '</div>' +
        '<div style="font-size:11px;color:#94a3b8;margin-top:4px">Enter 0 to copy ' + prevLabel + ' prices exactly · Enter 3.5 for +3.5% increase</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px">' +
        '<button id="_mpm_apply_btn" style="flex:1;padding:11px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">✅ Create ' + monthLabel + ' Prices</button>' +
                '<button onclick="_closeCreateMonth()" style="padding:11px 16px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-size:13px;cursor:pointer">Cancel</button>' +
      '</div>' +
      '<div id="_mpm_create_msg" style="display:none;margin-top:10px;font-size:12px;text-align:center;font-weight:600"></div>' +
    '</div>';

  document.body.appendChild(box);

  document.getElementById('_mpm_apply_btn').onclick = function() {
    var pct = parseFloat(document.getElementById('_mpm_pct').value) || 0;
    var newPrices = createMonthlyPriceVersion(CY, m, pct);
    var deptCount = Object.keys(newPrices).length;
    var itemCount = Object.values(newPrices).reduce(function(s,d){ return s+d.length; }, 0);
    var msgEl = document.getElementById('_mpm_create_msg');
    msgEl.style.color = '#16a34a';
    msgEl.textContent = '✅ ' + MONTH_NAMES_S[m-1] + ' prices created — ' + itemCount + ' items across ' + deptCount + ' departments' + (pct !== 0 ? ' (' + (pct>0?'+':'') + pct + '%)' : ' (same as ' + prevLabel + ')');
    msgEl.style.display = 'block';
    setTimeout(function() {
      box.remove();
      document.getElementById('_mpm_modal').remove();
      setTimeout(openMonthlyPriceManager, 200);
      try { renderEntry(); } catch(e) {}
      try { renderDash(); } catch(e) {}
    }, 1500);
    toast('📋 ' + MONTH_NAMES_S[m-1] + ' ' + CY + ' price table created', 'ok');
  };
}

function _editMonthPrices(m) {
  // For now, redirect to Prices tab with month pre-selected
  // Full edit UI can be added later
  document.getElementById('_mpm_modal').remove();
  showTab('prices');
  toast('ℹ️ Go to Price List tab to edit monthly prices', 'ok');
}

function deleteBackupVersion(verId) {
  // Use toast-style confirm instead of browser confirm() which can be blocked
  _confirmDelete(verId);
}

function _confirmDelete(verId) {
  // Remove any existing confirm
  var existing = document.getElementById('_del_confirm');
  if (existing) existing.remove();

  var box = document.createElement('div');
  box.id = '_del_confirm';
  box.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:99999;' +
    'background:#fff;border:2px solid #fca5a5;border-radius:12px;' +
    'padding:16px 20px;box-shadow:0 8px 32px rgba(0,0,0,.2);max-width:300px';
  box.innerHTML =
    '<div style="font-size:13px;font-weight:700;color:#0d1b2e;margin-bottom:4px">Delete this backup?</div>' +
    '<div style="font-size:12px;color:#64748b;margin-bottom:12px">This cannot be undone.</div>' +
    '<div style="display:flex;gap:8px">' +
      '<button id="_del_yes" style="flex:1;padding:8px;background:#dc2626;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">🗑 Delete</button>' +
      '<button id="_del_no" style="flex:1;padding:8px;background:#f1f5f9;color:#64748b;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">Cancel</button>' +
    '</div>';
  document.body.appendChild(box);

  document.getElementById('_del_no').onclick = function() { box.remove(); };
  document.getElementById('_del_yes').onclick = function() {
    box.remove();
    _doDeleteBackup(verId);
  };
}

function _doDeleteBackup(verId) {
  // Load index from BOTH localStorage and Firebase to get the most complete list
  var stored = [];
  try { stored = JSON.parse(_STORE.getItem('pearl_backup_index') || '[]'); } catch(e) {}

  // Filter out the deleted version
  var newIndex = stored.filter(function(v) { return v.id !== verId; });

  // 1. Save updated index locally immediately
  try { _STORE.setItem('pearl_backup_index', JSON.stringify(newIndex)); } catch(e) {}

  toast('⏳ Deleting...', 'info');

  // 2. Remove version data from Firebase
  var deletePromises = [];
  if (window._fbDB) {
    deletePromises.push(
      window._fbDB.ref('pearl/backup/versions/' + verId).remove()
        .catch(function(e) { console.warn('[Backup] Failed to remove version data:', e); })
    );
  }

  // 3. Save updated index to Firebase
  if (window._fbSaveKey) {
    deletePromises.push(
      window._fbSaveKey('pearl/backup/index', newIndex)
        .catch(function(e) { console.warn('[Backup] Failed to update index:', e); })
    );
  }

  // 4. After ALL operations complete, re-render directly with newIndex
  // (don't reload from Firebase — it might still have stale data)
  Promise.all(deletePromises).then(function() {
    toast('✅ Backup version deleted', 'ok');
    _renderBackupIndexDirect(newIndex);
  }).catch(function() {
    toast('⚠️ Deleted locally — cloud sync issue', 'warn');
    _renderBackupIndexDirect(newIndex);
  });
}


function renderBackupHistory() {
  var wrap = document.getElementById('backup-history-wrap');
  if (!wrap) return;

  // Show cached version INSTANTLY — no loading spinner
  var cached = null;
  try { cached = JSON.parse(_STORE.getItem('pearl_backup_index') || 'null'); } catch(e) {}
  if (cached && cached.length > 0) {
    cached.sort(function(a,b){ return (b.savedAt||'').localeCompare(a.savedAt||''); });
    _renderBackupIndexDirect(cached);
  } else {
    wrap.innerHTML = '<div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px">⏳ Loading...</div>';
  }

  // Then silently sync from Firebase in background
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/backup/index').then(function(idx) {
      var result = [];
      if (Array.isArray(idx)) result = idx;
      else if (idx && typeof idx === 'object') result = Object.values(idx);
      if (!result.length) return;
      result.sort(function(a,b){ return (b.savedAt||'').localeCompare(a.savedAt||''); });
      try { _STORE.setItem('pearl_backup_index', JSON.stringify(result)); } catch(e) {}
      // Only re-render if different from what's shown
      var cachedStr = JSON.stringify(cached || []);
      if (JSON.stringify(result) !== cachedStr) {
        _renderBackupIndexDirect(result);
      }
    }).catch(function(){});
  }
}

// Re-render backup history from a known-good index (no Firebase reload needed)
function _renderBackupIndexDirect(index) {
  // Always sort newest first before rendering
  if (Array.isArray(index)) {
    index = index.slice().sort(function(a,b){ return (b.savedAt||'').localeCompare(a.savedAt||''); });
  }
  var wrap = document.getElementById('backup-history-wrap');
  if (!wrap) { renderBackupHistory(); return; }

  try { _STORE.setItem('pearl_backup_index', JSON.stringify(index || [])); } catch(e) {}

  if (!index || index.length === 0) {
    wrap.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px">No backup versions yet.<br>Click <strong>☁️ Save Cloud Backup Now</strong> to create your first version.</div>';
    return;
  }

  var container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:8px';

  index.forEach(function(v, idx) {
    var date     = new Date(v.savedAt);
    var dateStr  = date.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
    var timeStr  = date.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
    var sizeKB   = v.size ? Math.round(v.size/1024) + ' KB' : '—';
    var isLatest = idx === 0;
    var num      = index.length - idx;

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 14px;' +
      'background:' + (isLatest ? '#f0fdf4' : '#fff') + ';' +
      'border:1.5px solid ' + (isLatest ? '#86efac' : '#e2e8f0') + ';' +
      'border-radius:12px;flex-wrap:wrap';

    // Badge
    var badge = document.createElement('div');
    badge.style.cssText = 'width:34px;height:34px;border-radius:50%;background:' + (isLatest ? '#16a34a' : '#64748b') + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;flex-shrink:0';
    badge.textContent = num;
    row.appendChild(badge);

    // Info
    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0';
    info.innerHTML = '<div style="font-size:13px;font-weight:800;color:#0d1b2e">' + dateStr + ' · ' + timeStr +
      (isLatest ? ' <span style="background:#f0fdf4;color:#16a34a;border:1px solid #86efac;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:700">● LATEST</span>' : '') + '</div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:2px">👤 ' + (v.savedBy||'Admin') + ' · 📅 ' + (v.years||'?') + ' year(s) · 💾 ' + sizeKB + '</div>';
    row.appendChild(info);

    // Buttons
    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:6px;flex-shrink:0';

    var btnData = document.createElement('button');
    btnData.textContent = '🔄 Data';
    btnData.title = 'Restore all entry data from this backup';
    btnData.style.cssText = 'padding:6px 10px;background:#eff6ff;border:1.5px solid #bfdbfe;color:#1d4ed8;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer';
    btnData.onclick = (function(vid){ return function(){ restoreFromVersion(vid); }; })(v.id);
    btns.appendChild(btnData);

    var btnPrice = document.createElement('button');
    btnPrice.textContent = '💰 Prices';
    btnPrice.title = 'Restore ONLY prices — entry data untouched';
    btnPrice.style.cssText = 'padding:6px 10px;background:#fefce8;border:1.5px solid #fde68a;color:#92400e;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer';
    btnPrice.onclick = (function(vid){ return function(){ restorePricesFromVersion(vid); }; })(v.id);
    btns.appendChild(btnPrice);

    if (!isLatest) {
      var btnDel = document.createElement('button');
      btnDel.textContent = '🗑 Delete';
      btnDel.title = 'Delete this backup version';
      btnDel.style.cssText = 'padding:6px 12px;background:#fff5f5;border:1.5px solid #fca5a5;color:#dc2626;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer';
      btnDel.onmouseover = function(){ this.style.background='#fee2e2'; };
      btnDel.onmouseout  = function(){ this.style.background='#fff5f5'; };
      btnDel.onclick = (function(vid){ return function(){ deleteBackupVersion(vid); }; })(v.id);
      btns.appendChild(btnDel);
    }

    row.appendChild(btns);
    container.appendChild(row);
  });

  wrap.innerHTML = '';
  wrap.appendChild(container);
}

// ── Option 4: Restore from Cloud Backup ──────────────────────
function restoreCloudBackup() {
  if (!window._fbLoadKey) {
    showBackupMsg('backup-cloud-msg', '❌ Firebase not connected. Check internet.', 'err'); return;
  }
  if (!confirm('Restore from cloud backup?\n\nThis MERGES backup data — nothing deleted.\nContinue?')) return;

  showBackupMsg('backup-cloud-msg', '⏳ Loading from Firebase...', 'info');

  // Try latest backup first, then direct data restore
  window._fbLoadKey('pearl/backup/latest').then(function(backup) {
    if (!backup || !backup.data) {
      // No backup — restore directly from pearl/data
      showBackupMsg('backup-cloud-msg', '⏳ No backup found — restoring directly from database...', 'info');
      return window._fbLoadKey('pearl/data').then(function(fbData) {
        if (!fbData) throw new Error('No data found in Firebase at all');
        return { data: fbData, direct: true };
      });
    }
    return backup;
  }).then(function(source) {
    var dataToRestore = source.data;
    var restoredYears = 0, restoredKeys = 0;

    Object.keys(dataToRestore).forEach(function(y) {
      var backupYear = dataToRestore[y];
      if (!backupYear || typeof backupYear !== 'object') return;
      var existing = {};
      try { existing = JSON.parse(_STORE.getItem('pearl_laundry_' + y) || '{}'); } catch(ex) {}
      // Firebase backup wins over empty local — local wins over backup if has data
      var merged = Object.keys(existing).length > 0
        ? Object.assign({}, backupYear, existing)
        : backupYear;
      _STORE.setItem('pearl_laundry_' + y, JSON.stringify(merged));
      _DB[y] = merged;
      restoredYears++;
      restoredKeys += Object.keys(merged).length;
    });

    // Also restore occupancy
    autoSyncOccupancyFromFB();

    showBackupMsg('backup-cloud-msg', '✅ Restored ' + restoredYears + ' year(s) · ' + restoredKeys + ' entries. Refreshing...', 'ok');
    toast('✅ Data restored successfully!', 'ok');
    setTimeout(function() {
      PRICES = loadPR(CY);
      renderDash();
      renderEntry();
      renderBackupTab();
    }, 1000);
  }).catch(function(err) {
    showBackupMsg('backup-cloud-msg', '❌ Restore failed: ' + err.message, 'err');
    toast('❌ Restore failed: ' + err.message, 'err');
  });
}

// ── Render backup tab ─────────────────────────────────────────
function renderBackupTab() {
  // Force fresh load from Firebase every time
  setTimeout(function() {
    renderBackupHistory();
    var ind = document.getElementById('auto-backup-indicator');
    var lastAuto = _STORE.getItem('pearl_last_auto_backup') || '';
    var today = new Date().toISOString().slice(0,10);
    if (ind && lastAuto === today) { ind.style.display = 'inline'; }
  }, 200);
  // Data summary cards
  var summary = document.getElementById('backup-data-summary');
  if (summary) {
    var html = '';
    var hasAny = false;
    for (var y = 2024; y <= 2035; y++) {
      var d = null;
      try { d = JSON.parse(_STORE.getItem('pearl_laundry_' + y) || 'null'); } catch(e) {}
      if (d && Object.keys(d).length > 0) {
        hasAny = true;
        var keys = Object.keys(d).length;
        var isCurrentYear = (y == CY);
        html += '<div style="padding:14px 16px;background:' + (isCurrentYear ? '#eff6ff' : '#f8fafc') + ';border:1.5px solid ' + (isCurrentYear ? '#bfdbfe' : '#e2e8f0') + ';border-radius:10px">' +
          '<div style="font-size:22px;font-weight:800;color:#0d1b2e">' + y + (isCurrentYear ? ' <span style="font-size:10px;background:#3b82f6;color:#fff;padding:2px 7px;border-radius:10px">Current</span>' : '') + '</div>' +
          '<div style="font-size:12px;color:#64748b;margin-top:4px">' + keys.toLocaleString() + ' data entries</div>' +
          '</div>';
      }
    }
    if (!hasAny) html = '<div style="color:#94a3b8;font-size:13px;padding:10px">No data found in any year.</div>';
    summary.innerHTML = html;
  }

  // Cloud backup status
  var statusEl = document.getElementById('backup-cloud-status');
  if (statusEl) {
    var lastLocal = _STORE.getItem('pearl_last_cloud_backup');
    if (window._fbLoadKey) {
      window._fbLoadKey('pearl/backup/latest').then(function(bk) {
        if (bk && bk.exportedAt) {
          var d = new Date(bk.exportedAt);
          statusEl.innerHTML = '✅ Last cloud backup: <strong>' + d.toLocaleString() + '</strong> · Exported by: ' + (bk.exportedBy || 'Admin') +
            ' · ' + Object.keys(bk.data || {}).length + ' year(s) backed up';
          statusEl.style.background = '#f0fdf4';
          statusEl.style.borderColor = '#86efac';
          statusEl.style.color = '#15803d';
        } else {
          statusEl.innerHTML = '⚠️ No cloud backup found yet. Click <strong>Save Cloud Backup Now</strong> to create one.';
          statusEl.style.background = '#fffbeb';
          statusEl.style.borderColor = '#fde68a';
          statusEl.style.color = '#92400e';
        }
      }).catch(function() {
        statusEl.innerHTML = '🔴 Cannot reach Firebase. Check internet connection.';
        statusEl.style.color = '#dc2626';
      });
    } else {
      statusEl.innerHTML = lastLocal ? '✅ Last backup: ' + lastLocal : '⚠️ Firebase not connected.';
    }
  }
}

function showBackupMsg(id, msg, type) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = type === 'ok' ? '#f0fdf4' : type === 'err' ? '#fff5f5' : '#eff6ff';
  el.style.color = type === 'ok' ? '#15803d' : type === 'err' ? '#dc2626' : '#1d4ed8';
  el.style.border = '1.5px solid ' + (type === 'ok' ? '#86efac' : type === 'err' ? '#fca5a5' : '#bfdbfe');
}

// Auto cloud backup every time data is saved
var _lastAutoBackup = 0;
var _MAX_BACKUP_VERSIONS = 20; // Maximum cloud backup versions to keep

function autoCloudBackup() {
  if (!window._fbSaveKey) return;
  var now = Date.now();
  if (now - _lastAutoBackup < 300000) return; // max once per 5 min
  _lastAutoBackup = now;
  var backup = getFullBackupObject();
  window._fbSaveKey('pearl/backup/latest', backup);
  _STORE.setItem('pearl_last_cloud_backup', new Date().toLocaleString());
}


// ════════════════════════════════════════════════════════════════
//  END-OF-MONTH CHECKLIST
//  Shows last 3 days of month + first 3 days of next month
//  5 items: Days entered, Depts locked, Prices locked, Finance posted, Backup saved
// ════════════════════════════════════════════════════════════════

var _EOM_KEY_PREFIX = 'pearl_eom_checklist_';

// ── Check if checklist should show (last 3 days OR first 3 days next month) ──
function shouldShowEomChecklist() {
  var today = new Date();
  var d  = today.getDate();
  var m  = today.getMonth() + 1;
  var y  = today.getFullYear();
  var nd = dim(y, m);
  if (d >= nd - 2) return { show: true, y: y, m: m };
  if (d <= 3) {
    var pm = m === 1 ? 12 : m - 1;
    var py = m === 1 ? y - 1 : y;
    return { show: true, y: py, m: pm };
  }
  return { show: false };
}

function saveEomChecklist(y, m, data) {
  try { _STORE.setItem(eomKey(y,m), JSON.stringify(data)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/eom_' + y + '_' + m, data);
}

// ── Login reminder banner for end-of-month ──
function checkEomReminder() {
  var info = shouldShowEomChecklist();
  if (!info.show) return;
  var status  = getEomStatus(info.y, info.m);
  var keys    = ['allDaysEntered','pricesLocked','monthlyPricesSet','financePosted','backupSaved'];
  var pending = keys.filter(function(k){ return !status[k].done; }).length;
  if (pending === 0) return;
  var todayKey = 'pearl_eom_reminder_' + new Date().toISOString().slice(0,10);
  if (_STORE.getItem(todayKey)) return;
  try { _STORE.setItem(todayKey, '1'); } catch(e) {}
  var MNF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var mName    = MNF[info.m - 1];
  var today2   = new Date();
  var nd2      = dim(info.y, info.m);
  var daysLeft = nd2 - today2.getDate();
  var isAfter  = today2.getDate() <= 3 && today2.getMonth()+1 !== info.m;

  var banner = document.createElement('div');
  banner.id  = '_eom_reminder';
  banner.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:8200;background:#fff;' +
    'border:2px solid #c9a84c;border-radius:12px;padding:14px 16px;max-width:340px;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.15);font-family:inherit';

  var title = isAfter
    ? mName + ' Checklist Not Complete'
    : daysLeft + ' day' + (daysLeft===1?'':'s') + ' left in ' + mName;

  var inner = document.createElement('div');
  inner.style.cssText = 'display:flex;gap:10px;align-items:flex-start';
  inner.innerHTML =
    '<span style="font-size:22px;flex-shrink:0">📋</span>' +
    '<div style="flex:1">' +
      '<div style="font-size:13px;font-weight:800;color:#0d1b2e;margin-bottom:3px">' + title + '</div>' +
      '<div style="font-size:11px;color:#64748b;margin-bottom:10px">' + pending + ' item' + (pending===1?'':'s') + ' still pending before closing the month.</div>' +
      '<div style="display:flex;gap:6px">' +
        '<button id="_eom_go_btn" style="flex:1;padding:8px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">📋 View Checklist</button>' +
        '<button id="_eom_later_btn" style="padding:8px 12px;background:#f1f5f9;color:#64748b;border:none;border-radius:7px;font-size:11px;cursor:pointer">Later</button>' +
      '</div>' +
    '</div>';
  banner.appendChild(inner);
  document.body.appendChild(banner);

  banner.querySelector('#_eom_go_btn').onclick    = _goToEomChecklist;
  banner.querySelector('#_eom_later_btn').onclick = _dismissEomReminder;

  setTimeout(function(){
    var el = document.getElementById('_eom_reminder');
    if (el){ el.style.opacity='0'; el.style.transition='opacity .5s';
      setTimeout(function(){ if(el.parentNode) el.remove(); }, 500); }
  }, 25000);
}


function eomKey(y, m) {
  return _EOM_KEY_PREFIX + y + '_' + String(m).padStart(2,'0');
}

function loadEomChecklist(y, m) {
  var key   = eomKey(y, m);
  var fbPath = 'pearl/settings/eom_' + y + '_' + m;
  var defaults = { financePosted: false, reportExported: false };
  var local = defaults;
  try {
    var stored = JSON.parse(_STORE.getItem(key) || 'null');
    if (stored) local = stored;
  } catch(e) {}

  // Background sync from Firebase — updates localStorage for next read
  if (window._fbLoadKey) {
    window._fbLoadKey(fbPath).then(function(fbData) {
      if (fbData && typeof fbData === 'object') {
        // Firebase is authoritative for manual ticks
        try { _STORE.setItem(key, JSON.stringify(fbData)); } catch(e) {}
        // If Finance Posted changed, re-render year health if visible
        if (fbData.financePosted !== local.financePosted) {
          var hp = document.getElementById('year-health-panel');
          if (hp && hp.style.display !== 'none' && typeof renderYearHealth === 'function') {
            renderYearHealth();
          }
        }
      } else if (local.financePosted) {
        // Push local to Firebase if Firebase is empty
        if (window._fbSaveKey) window._fbSaveKey(fbPath, local);
      }
    }).catch(function(){});
  }
  return local;
}

function saveEomChecklist(y, m, data) {
  try { _STORE.setItem(eomKey(y,m), JSON.stringify(data)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/eom_' + y + '_' + m, data);
}


function _eomTick(y, m, key) {
  toggleEomItem(parseInt(y), parseInt(m), String(key));
}

function toggleEomItem(y, m, key) {
  var data = loadEomChecklist(y, m);
  data[key] = !data[key];
  saveEomChecklist(y, m, data);
  renderEomChecklist(y, m);
}

// Auto-detect checklist items
function getEomStatus(y, m) {
  var nd     = dim(y, m);
  var db     = loadDB(y);
  var manual = loadEomChecklist(y, m);
  var today  = new Date();
  var curY   = today.getFullYear();
  var curM   = today.getMonth() + 1;
  var isPast = (y < curY) || (y === curY && m < curM);

  // 1. All days entered — smart check (ignores rest days, dry cleaning, acknowledged)
  var required    = getRequiredDepts();
  // For current month: only check days up to yesterday (today might not be entered yet)
  var today2  = new Date();
  var checkTo = (y === today2.getFullYear() && m === today2.getMonth()+1)
    ? today2.getDate() - 1   // only check up to yesterday for current month
    : nd;                     // full month for past months
  var smartMissing   = checkTo > 0 ? getSmartMissingDays(y, m, checkTo) : [];
  var allDaysEntered = smartMissing.length === 0 && checkTo >= nd - 1; // past months: full check

  // 2. Prices locked
  var hasLocked = false, hasAnyData = false;
  outerLoop:
  for (var d2 = 0; d2 < nd; d2++) {
    for (var di = 0; di < DEPT_KEYS.length; di++) {
      var dept2 = DEPT_KEYS[di];
      for (var ii = 0; ii < MASTER[dept2].length; ii++) {
        var key = m + '-' + dept2 + '-' + ii + '-' + d2;
        if (db[key] > 0) {
          hasAnyData = true;
          if (db[key + '-p']) { hasLocked = true; break outerLoop; }
        }
      }
    }
  }
  var pricesLocked = !hasAnyData || hasLocked;

  // 3. Monthly prices set — for past months, treat as N/A (always pass)
  // If the month used year prices at entry time, that was correct then — don't penalise
  var monthlyPricesSet = isPast ? true : hasMonthlyPrices(y, m);

  // 4. Finance posted (manual tick)
  var financePosted = manual.financePosted || false;

  // 5. Backup saved — for past months: any backup EVER is fine (can't re-do past backups)
  //                   for current month: needs a backup saved THIS month
  var backupSaved = false;
  try {
    var idx2 = JSON.parse(_STORE.getItem('pearl_backup_index') || '[]');
    if (Array.isArray(idx2) && idx2.length > 0) {
      if (isPast) {
        // Past month: any backup that existed AFTER that month is fine
        var monthEndDate = new Date(y, m, 0); // last day of month
        backupSaved = idx2.some(function(v) {
          return v.savedAt && new Date(v.savedAt) >= monthEndDate;
        });
        // Also pass if there's any backup at all — data was protected at some point
        if (!backupSaved && idx2.length > 0) backupSaved = true;
      } else {
        // Current month: needs backup this month
        var latestBackup = new Date(idx2[0].savedAt);
        backupSaved = latestBackup.getFullYear() === y && latestBackup.getMonth()+1 === m;
      }
    }
  } catch(e) {}

  // For past months: backup label reflects the relaxed check
  var backupDetail = backupSaved
    ? (isPast ? 'Data was backed up' : 'Backup saved this month')
    : (isPast ? 'No backup found — save one now to protect data' : 'No backup saved this month');

  // Pre-compute detail message — smart, shows exact dept + days
  var _allDaysDetail = (function() {
    if (allDaysEntered) return 'No missing data';
    // Group by dept
    var byDept = {};
    smartMissing.forEach(function(item) {
      if (!byDept[item.dept]) byDept[item.dept] = [];
      byDept[item.dept].push(item.day);
    });
    return Object.keys(byDept).map(function(dept) {
      var days = byDept[dept];
      return dept + ': day' + (days.length > 1 ? 's ' : ' ') + days.join(', ');
    }).join(' | ');
  })();

  // Build action with Mark OK buttons for each missing dept
  var _missingDepts = (function() {
    var d = {};
    smartMissing.forEach(function(item) { d[item.dept] = true; });
    return Object.keys(d);
  })();

  return {
    allDaysEntered:   { done: allDaysEntered, label: 'All days entered', detail: _allDaysDetail, missingDepts: _missingDepts, ackFn: function(dept){ ackMissingDay(y,m,dept); }, action: function(){ showTab('entry'); setTimeout(function(){ var sel=document.getElementById('ent-month'); if(sel){sel.value=String(m);renderEntry();} },300); } },
    pricesLocked:     { done: pricesLocked,       label: 'Prices locked',        detail: pricesLocked ? 'All entries frozen' : 'Some entries not locked — lock before changing prices', action: function(){ showTab('prices'); setTimeout(openMonthlyPriceManager, 300); } },
    monthlyPricesSet: { done: monthlyPricesSet,   label: isPast ? 'Prices (historical)' : 'Monthly prices set', detail: isPast ? 'Historical month — prices recorded at entry time' : (monthlyPricesSet ? 'Price table exists' : 'Using year prices'), action: isPast ? null : function(){ showTab('prices'); setTimeout(openMonthlyPriceManager, 300); } },
    financePosted:    { done: financePosted,       label: 'Finance posted',       detail: financePosted ? 'Marked as done' : 'Tick when posted to finance system', manual: true },
    backupSaved:      { done: backupSaved,         label: 'Cloud backup',         detail: backupDetail, action: backupSaved ? null : function(){ showTab('backup'); } }
  };
}

function renderEomChecklist(y, m) {
  var wrap = document.getElementById('eom-checklist-wrap');
  if (!wrap) return;

  var status = getEomStatus(y, m);
  var keys   = ['allDaysEntered','pricesLocked','monthlyPricesSet','financePosted','backupSaved'];
  var doneCount = keys.filter(function(k){ return status[k].done; }).length;
  var allDone   = doneCount === keys.length;
  var MNS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  var headerBg  = allDone ? '#f0fdf4' : (doneCount >= 3 ? '#fffbeb' : '#fef2f2');
  var headerBdr = allDone ? '#86efac' : (doneCount >= 3 ? '#fde68a' : '#fca5a5');
  var headerIcon = allDone ? '🎉' : (doneCount >= 3 ? '⏳' : '⚠️');

  // Build using DOM — no innerHTML quote issues
  wrap.innerHTML = '';
  var card = document.createElement('div');
  card.style.cssText = 'background:' + headerBg + ';border:2px solid ' + headerBdr + ';border-radius:14px;overflow:hidden';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'padding:12px 16px;border-bottom:1px solid ' + headerBdr + ';display:flex;align-items:center;justify-content:space-between';
  hdr.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:18px">' + headerIcon + '</span>' +
      '<div>' +
        '<div style="font-size:13px;font-weight:800;color:#0d1b2e">End-of-Month Checklist — ' + MNS[m-1] + ' ' + y + '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:1px">' + doneCount + ' of ' + keys.length + ' completed' + (allDone ? ' — Month complete! ✅' : '') + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="background:#0d1b2e;color:#c9a84c;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:800">' + doneCount + '/' + keys.length + '</div>';
  card.appendChild(hdr);

  // Items
  var body = document.createElement('div');
  body.style.cssText = 'padding:10px 14px;display:flex;flex-direction:column;gap:6px';

  keys.forEach(function(k) {
    var item     = status[k];
    var rowBg    = item.done ? '#f0fdf4' : '#fff';
    var rowBdr   = item.done ? '#86efac' : '#e2e8f0';
    var checkBg  = item.done ? '#16a34a' : '#e2e8f0';
    var checkClr = item.done ? '#fff'    : '#94a3b8';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 12px;background:' + rowBg + ';border:1.5px solid ' + rowBdr + ';border-radius:9px';

    // Checkbox
    if (item.manual) {
      var cb = document.createElement('button');
      cb.style.cssText = 'width:24px;height:24px;border-radius:6px;border:2px solid ' + (item.done?'#16a34a':'#d1d5db') + ';background:' + checkBg + ';cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;color:' + checkClr;
      cb.innerHTML = item.done ? '✓' : '';
      cb.onclick = (function(ky){ return function(){ _eomTick(y, m, ky); }; })(k);
      row.appendChild(cb);
    } else {
      var dot = document.createElement('div');
      dot.style.cssText = 'width:24px;height:24px;border-radius:6px;background:' + checkBg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;color:' + checkClr;
      dot.textContent = item.done ? '✓' : '○';
      row.appendChild(dot);
    }

    // Label + detail
    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0';
    info.innerHTML =
      '<div style="font-size:12px;font-weight:700;color:#0d1b2e' + (item.done?';text-decoration:line-through;opacity:.6':'') + '">' + item.label + '</div>' +
      '<div style="font-size:10px;color:#94a3b8;margin-top:1px">' + item.detail + '</div>';
    row.appendChild(info);

    // Fix button + Mark OK for missing days (dashboard version)
    if (!item.done) {
      var bw = document.createElement('div');
      bw.style.cssText = 'display:flex;flex-direction:column;gap:5px;flex-shrink:0;align-items:flex-end';
      if (item.action) {
        var fb = document.createElement('button');
        fb.textContent = 'Fix →';
        fb.style.cssText = 'padding:5px 10px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer';
        fb.onclick = item.action;
        bw.appendChild(fb);
      }
      if (item.missingDepts && item.missingDepts.length > 0) {
        item.missingDepts.forEach(function(dept) {
          var ab = document.createElement('button');
          ab.textContent = '✓ OK: ' + dept.split(' ')[0];
          ab.title = 'Acknowledge — intentional or posted next day';
          ab.style.cssText = 'padding:4px 8px;background:#f0fdf4;color:#16a34a;border:1.5px solid #86efac;border-radius:6px;font-size:9px;font-weight:700;cursor:pointer';
          ab.onclick = (function(d){ return function(){ item.ackFn(d); }; })(dept);
          bw.appendChild(ab);
        });
      }
      if (bw.children.length > 0) row.appendChild(bw);
    }

    body.appendChild(row);
  });

  card.appendChild(body);
  wrap.appendChild(card);
}


function _goToEomChecklist() {
  _dismissEomReminder();
  // Scroll dashboard into view and open checklist
  showTab('dashboard');
  setTimeout(function(){
    var wrap = document.getElementById('eom-checklist-wrap');
    if (wrap) wrap.scrollIntoView({ behavior:'smooth', block:'center' });
  }, 300);
}

function _dismissEomReminder() {
  var el = document.getElementById('_eom_reminder');
  if (el) el.remove();
}


// Departments that are irregular by nature — never flag as missing
var _IRREGULAR_DEPTS = ['Dry Cleaning'];

// Key for acknowledged missing days: pearl_ack_YYYY_MM
function _ackKey(y, m) { return 'pearl_ack_' + y + '_' + m; }
function loadAckDays(y, m) {
  try { return JSON.parse(_STORE.getItem(_ackKey(y,m)) || '{}'); } catch(e) { return {}; }
}
function ackMissingDay(y, m, dept) {
  var ack = loadAckDays(y, m);
  if (!ack[dept]) ack[dept] = [];
  // Acknowledge all currently missing days for this dept
  var missing = getSmartMissingDays(y, m, dim(y,m));
  missing.forEach(function(item) {
    if (item.dept === dept && ack[dept].indexOf(item.day) === -1) ack[dept].push(item.day);
  });
  try { _STORE.setItem(_ackKey(y,m), JSON.stringify(ack)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/ack_' + y + '_' + m, ack);

  // Re-render immediately — no logout needed
  var modal = document.getElementById('_month_checklist_modal');
  if (modal) {
    // Refresh the modal in place with updated status
    modal.remove();
    openMonthChecklist(m); // openMonthChecklist uses current year internally
  }
  // Always refresh year health panels (desktop + mobile)
  if (typeof renderYearHealth === 'function') renderYearHealth();
  if (typeof mobRenderYearHealth === 'function') mobRenderYearHealth();
  // Refresh dashboard checklist if showing
  var eomInfo = shouldShowEomChecklist();
  if (eomInfo.show && document.getElementById('eom-checklist-container')) {
    renderEomChecklist(eomInfo.y, eomInfo.m);
  }
  // Show toast confirmation
  toast('✓ Marked OK — ' + dept, 'ok');
}

// Smart missing days: only flag if the day was active for other depts
function getSmartMissingDays(y, m, upToDay) {
  var required = getRequiredDepts().filter(function(d) { return _IRREGULAR_DEPTS.indexOf(d) === -1; });
  var ack      = loadAckDays(y, m);
  var today    = new Date();
  var nd       = dim(y, m);
  var missing  = [];
  var dows     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Don't check last 2 days of current month (might not be entered yet)
  var curY = today.getFullYear(), curM = today.getMonth()+1, curD = today.getDate();
  var isCurrentMonth = (y === curY && m === curM);
  var checkLimit = isCurrentMonth ? Math.min(upToDay, nd - 2) : upToDay;

  for (var day = 1; day <= checkLimit; day++) {
    // Count how many required depts have data this day
    var deptsWithData = required.filter(function(d) { return deptHasData(y, m, d, day); });
    var totalActive   = deptsWithData.length;

    // Skip day if NO departments had data — genuine rest day
    if (totalActive === 0) continue;

    // Skip day if only 1 dept active AND it's Uniform — could be weekly batch entry
    if (totalActive === 1 && deptsWithData[0] === 'Uniform') continue;

    // Now check for missing depts
    required.forEach(function(dept) {
      if (deptHasData(y, m, dept, day)) return; // has data, fine
      if (ack[dept] && ack[dept].indexOf(day) !== -1) return; // acknowledged

      var dt = new Date(y, m-1, day);
      missing.push({ dept: dept, day: day, label: dows[dt.getDay()] + ' ' + day });
    });
  }
  return missing;
}

// Legacy wrapper used by runMissingDeptCheck
function getMissingDeptDays(y, m, upToDay) {
  return getSmartMissingDays(y, m, upToDay);
}

// ── Main check: run on boot (morning) and at 8pm ──
function runMissingDeptCheck() {
  var today  = new Date();
  var todayY = today.getFullYear();
  var todayM = today.getMonth() + 1;
  var todayD = today.getDate();
  var hour   = today.getHours();

  var checkUpTo = (hour >= 20) ? todayD : todayD - 1;
  if (checkUpTo < 1) return;
  if (CY !== todayY) return;

  var missing = getMissingDeptDays(todayY, todayM, checkUpTo);
  if (missing.length === 0) {
    _dismissMissingAlert();
    return;
  }

  // Don't re-show if already dismissed today by clicking X
  var dismissedAt = parseInt(_STORE.getItem('_dept_alert_dismissed') || '0');
  var todayStart  = new Date(); todayStart.setHours(0,0,0,0);
  if (dismissedAt >= todayStart.getTime()) return;

  // Already visible — no need to re-create (prevents flash on re-render)
  if (document.getElementById('_dept_alert')) return;

  _showMissingDeptAlert(missing, todayM);
}

function _showMissingDeptAlert(missing, m) {
  // If already showing — don't re-create (prevents flash)
  if (document.getElementById('_dept_alert')) return;

  // Group by dept for compact display
  var byDept = {};
  missing.forEach(function(item) {
    if (!byDept[item.dept]) byDept[item.dept] = [];
    byDept[item.dept].push(item.day);
  });
  var depts = Object.keys(byDept);

  var banner = document.createElement('div');
  banner.id  = '_dept_alert';
  banner.style.cssText =
    'position:fixed;top:60px;left:50%;z-index:8000;' +
    'background:#fff;border:2px solid #fca5a5;border-radius:14px;' +
    'box-shadow:0 8px 32px rgba(220,38,38,.15);max-width:560px;width:calc(100vw - 32px);' +
    'animation:slideDown .4s cubic-bezier(.22,1,.36,1) forwards';

  // Build content
  var deptRows = depts.map(function(dept) {
    var days = byDept[dept];
    var dayStr = days.length <= 4
      ? days.join(', ')
      : days.slice(0,3).join(', ') + ' +' + (days.length - 3) + ' more';
    return '<div style="display:flex;align-items:center;justify-content:space-between;' +
      'padding:6px 0;border-bottom:1px solid #f1f5f9">' +
      '<span style="font-size:12px;font-weight:700;color:#0d1b2e">' + dept + '</span>' +
      '<span style="font-size:11px;color:#dc2626;font-weight:600">Days: ' + dayStr + '</span>' +
      '</div>';
  }).join('');

  banner.innerHTML =
    // Header
    '<div style="display:flex;align-items:center;justify-content:space-between;' +
      'padding:12px 16px;background:#fef2f2;border-radius:12px 12px 0 0;border-bottom:1px solid #fecaca">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:18px">⚠️</span>' +
        '<div>' +
          '<div style="font-size:13px;font-weight:800;color:#dc2626">Missing Department Data</div>' +
          '<div style="font-size:11px;color:#94a3b8;margin-top:1px">' + missing.length + ' dept/day combination(s) with no entries</div>' +
        '</div>' +
      '</div>' +
            '<button onclick="_dismissMissingAlert();_STORE.setItem(\'_dept_alert_dismissed\',Date.now())" ' +
        'style="background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8;padding:4px">✕</button>' +
    '</div>' +
    // Dept rows
    '<div style="padding:10px 16px">' + deptRows + '</div>' +
    // Action buttons
    '<div style="padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap">' +
            '<button onclick="_goToEntryFromAlert()" ' +
        'style="flex:1;padding:9px 14px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">✏️ Go to Entry</button>' +
      '<button onclick="openMissingDeptSettings()" ' +
        'style="padding:9px 14px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">⚙️ Configure</button>' +
    '</div>';

  // Add slide-down animation
  if (!document.getElementById('_dept_anim')) {
    var s = document.createElement('style');
    s.id = '_dept_anim';
    s.textContent = '@keyframes slideDown{from{opacity:0;transform:translate(-50%,-20px)}to{opacity:1;transform:translate(-50%,0)}}';
    document.head.appendChild(s);
  }

  document.body.appendChild(banner);

  // Auto-dismiss after 30 seconds
  setTimeout(function() {
    var el = document.getElementById('_dept_alert');
    if (el) { el.style.opacity='0'; el.style.transition='opacity .5s'; setTimeout(function(){ if(el.parentNode) el.remove(); }, 500); }
  }, 30000);
}



function _closeDeptSettings() {
  var el = document.getElementById('_dept_settings');
  if (el) el.remove();
}

function _goToEntryFromAlert() {
  _dismissMissingAlert();
  showTab('entry');
}

function _dismissMissingAlert() {
  var el = document.getElementById('_dept_alert');
  if (el) el.remove();
}

// ── Settings popup to configure required depts ──
function openMissingDeptSettings() {
  var existing = document.getElementById('_dept_settings');
  if (existing) { existing.remove(); return; }

  var required = getRequiredDepts();
  var box = document.createElement('div');
  box.id = '_dept_settings';
  box.style.cssText =
    'position:fixed;bottom:80px;right:24px;z-index:99999;background:#fff;' +
    'border:2px solid #e2e8f0;border-radius:14px;padding:18px 20px;' +
    'box-shadow:0 8px 32px rgba(0,0,0,.18);max-width:300px;font-family:inherit';

  var rows = DEPT_KEYS.map(function(dept) {
    var checked = required.indexOf(dept) !== -1;
    return '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;' +
      'border-bottom:1px solid #f1f5f9;cursor:pointer">' +
      '<input type="checkbox" data-dept="' + dept + '" ' + (checked ? 'checked' : '') + ' ' +
        'style="width:16px;height:16px;accent-color:#0d1b2e;cursor:pointer">' +
      '<span style="font-size:13px;font-weight:600;color:#0d1b2e">' + dept + '</span>' +
      '</label>';
  }).join('');

  box.innerHTML =
    '<div style="font-size:13px;font-weight:800;color:#0d1b2e;margin-bottom:4px">⚙️ Required Departments</div>' +
    '<div style="font-size:11px;color:#64748b;margin-bottom:12px">Tick departments that must have data every day</div>' +
    '<div>' + rows + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:14px">' +
      '<button id="_dept_save_btn" style="flex:1;padding:9px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">💾 Save</button>' +
            '<button onclick="_closeDeptSettings()" style="padding:9px 14px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Cancel</button>' +
    '</div>';

  document.body.appendChild(box);

  document.getElementById('_dept_save_btn').onclick = function() {
    var checked = [];
    box.querySelectorAll('input[type=checkbox]:checked').forEach(function(inp) {
      checked.push(inp.dataset.dept);
    });
    saveRequiredDepts(checked);
    box.remove();
    toast('✅ Required departments saved', 'ok');
    runMissingDeptCheck(); // re-run immediately
  };
}

// ── Schedule the 8pm check ──
function scheduleMissingDeptCheck() {
  var now  = new Date();
  var eight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
  var msUntil8pm = eight - now;
  if (msUntil8pm < 0) msUntil8pm += 86400000; // already past 8pm — schedule for tomorrow
  setTimeout(function() {
    runMissingDeptCheck();
    // Then check every 24h
    setInterval(runMissingDeptCheck, 86400000);
  }, msUntil8pm);
}


// ════════════════════════════════════════════════════════════════
//  NEW MONTH LOCK REMINDER
//  Fires once on the 1st of each month if previous month has
//  unlocked data — reminds user to lock before entering new data
// ════════════════════════════════════════════════════════════════

function checkNewMonthLockReminder() {
  var today  = new Date();
  var day    = today.getDate();
  var curM   = today.getMonth() + 1;  // 1-based
  var curY   = today.getFullYear();
  var prevM  = curM === 1 ? 12 : curM - 1;
  var prevY  = curM === 1 ? curY - 1 : curY;

  // Only run on days 1–7 of the month (grace window)
  if (day > 7) return;

  // Don't show more than once per month
  var shownKey = 'pearl_lock_reminder_' + curY + '_' + String(curM).padStart(2,'0');
  if (_STORE.getItem(shownKey)) return;

  // Check if previous month has any data that is NOT locked
  var db   = loadDB(prevY);
  var nd   = dim(prevY, prevM);
  var hasUnlocked = false;

  outer:
  for (var i_d = 0; i_d < nd; i_d++) {
    for (var di = 0; di < DEPT_KEYS.length; di++) {
      var dept = DEPT_KEYS[di];
      for (var ii = 0; ii < MASTER[dept].length; ii++) {
        var key = prevM + '-' + dept + '-' + ii + '-' + i_d;
        if (db[key] && db[key] > 0 && !db[key + '-p']) {
          hasUnlocked = true;
          break outer;
        }
      }
    }
  }

  if (!hasUnlocked) return; // previous month already locked or has no data

  // Mark as shown for this month
  try { _STORE.setItem(shownKey, '1'); } catch(e) {}

  // Show the banner
  _showLockReminderBanner(prevM, prevY, curM);
}

var MONTH_NAMES_FULL = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];


function _dismissLockReminder() {
  var el = document.getElementById('_lock_reminder');
  if (el) el.remove();
}

function _showLockReminderBanner(prevM, prevY, curM) {
  var existing = document.getElementById('_lock_reminder');
  if (existing) existing.remove();

  var banner = document.createElement('div');
  banner.id  = '_lock_reminder';
  banner.style.cssText =
    'position:fixed;top:62px;left:50%;z-index:8100;' +
    'background:#fff;border:2px solid #c9a84c;border-radius:14px;' +
    'box-shadow:0 8px 32px rgba(201,168,76,.25);max-width:520px;width:calc(100vw - 32px);' +
    'animation:slideDown .4s cubic-bezier(.22,1,.36,1);font-family:inherit';

  var prevName = MONTH_NAMES_FULL[prevM - 1];
  var curName  = MONTH_NAMES_FULL[curM  - 1];

  banner.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;' +
      'padding:12px 16px;background:linear-gradient(135deg,#0d1b2e,#1e3a5f);' +
      'border-radius:12px 12px 0 0">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:22px">🔒</span>' +
        '<div>' +
          '<div style="font-size:13px;font-weight:800;color:#c9a84c">New Month — Lock ' + prevName + ' Before Entering ' + curName + ' Data</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:1px">' + prevName + ' has unsaved entries — lock them now to protect the revenue calculations</div>' +
        '</div>' +
      '</div>' +
      '<button onclick="_dismissLockReminder()" ' +
        'style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);' +
        'color:#fff;border-radius:7px;padding:5px 12px;font-size:12px;cursor:pointer">✕</button>' +
    '</div>' +
    '<div style="padding:14px 16px">' +
      '<div style="font-size:12px;color:#64748b;margin-bottom:12px;line-height:1.6">' +
        'Locking ' + prevName + ' permanently freezes its revenue calculations. ' +
        'You can then set new prices for ' + curName + ' without affecting past data.' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button onclick="_goToLockMonth(' + prevM + ')" ' +
          'style="flex:1;padding:10px 16px;background:linear-gradient(135deg,#0d1b2e,#1e3a5f);' +
          'color:#c9a84c;border:none;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer">' +
          '🔒 Lock ' + prevName + ' Now</button>' +
        '<button onclick="_dismissLockReminder()" ' +
          'style="padding:10px 16px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;' +
          'border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Remind Me Later</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(banner);

  // Auto dismiss after 45 seconds
  setTimeout(function() {
    var el = document.getElementById('_lock_reminder');
    if (el) { el.style.opacity='0'; el.style.transition='opacity .5s'; setTimeout(function(){ if(el.parentNode) el.remove(); },500); }
  }, 45000);
}

function _goToLockMonth(m) {
  var el = document.getElementById('_lock_reminder');
  if (el) el.remove();
  showTab('prices');
  setTimeout(openMonthlyPriceManager, 400);
}


// ════════════════════════════════════════════════════════════════
//  EXCHANGE RATE SYSTEM
//  Stores QAR-based rates for multiple currencies
//  Reminder to update rates on a schedule
//  Quick converter + "View in USD" anywhere
// ════════════════════════════════════════════════════════════════

var _FX_STORE_KEY  = 'pearl_fx_rates';
var _FX_FB_PATH    = 'pearl/settings/fx_rates';

// Default rates (QAR to each currency — how many QAR = 1 unit)
var _FX_DEFAULT = {
  USD: { name:'US Dollar',       symbol:'$',   position:'before', rate: 3.64,  decimals:2 },
  EUR: { name:'Euro',            symbol:'€',   position:'before', rate: 3.99,  decimals:2 },
  GBP: { name:'British Pound',   symbol:'£',   position:'before', rate: 4.60,  decimals:2 },
  SAR: { name:'Saudi Riyal',     symbol:'SAR', position:'after',  rate: 0.97,  decimals:2 },
  AED: { name:'UAE Dirham',      symbol:'AED', position:'after',  rate: 0.99,  decimals:2 },
  KWD: { name:'Kuwaiti Dinar',   symbol:'KWD', position:'after',  rate:11.84,  decimals:3 },
  EGP: { name:'Egyptian Pound',  symbol:'EGP', position:'after',  rate: 0.075, decimals:2 },
  INR: { name:'Indian Rupee',    symbol:'₹',   position:'before', rate: 0.044, decimals:2 }
};

var _FX_RATES = null; // will be set by loadFxRates()
var _FX_REMINDER_DAYS = 14;
var _FX_LAST_UPDATED  = null;

function loadFxRates() {
  // Always start with defaults — overwrite if stored data exists
  _FX_RATES = JSON.parse(JSON.stringify(_FX_DEFAULT));
  try {
    var stored = JSON.parse(_STORE.getItem(_FX_STORE_KEY) || 'null');
    if (stored && stored.rates && Object.keys(stored.rates).length > 0) {
      _FX_RATES         = stored.rates;
      _FX_REMINDER_DAYS = stored.reminderDays  !== undefined ? stored.reminderDays : 14;
      _FX_LAST_UPDATED  = stored.lastUpdated   || null;
    }
  } catch(e) {
    _FX_RATES = JSON.parse(JSON.stringify(_FX_DEFAULT));
  }
  if (window._fbLoadKey) {
    window._fbLoadKey(_FX_FB_PATH).then(function(fb) {
      if (fb && fb.rates) {
        _FX_RATES         = fb.rates;
        _FX_REMINDER_DAYS = fb.reminderDays !== undefined ? fb.reminderDays : _FX_REMINDER_DAYS;
        _FX_LAST_UPDATED  = fb.lastUpdated  || _FX_LAST_UPDATED;
        try { _STORE.setItem(_FX_STORE_KEY, JSON.stringify({rates:_FX_RATES, reminderDays:_FX_REMINDER_DAYS, lastUpdated:_FX_LAST_UPDATED})); } catch(e) {}
      }
    }).catch(function(){});
  }
}

function saveFxRates() {
  // Read reminder setting
  var remSel = document.getElementById('fx-reminder-days');
  if (remSel) _FX_REMINDER_DAYS = parseInt(remSel.value) || 0;

  // Read rate inputs
  Object.keys(_FX_RATES).forEach(function(code) {
    var inp = document.getElementById('fx-rate-' + code);
    if (inp) {
      var val = parseFloat(inp.value);
      if (!isNaN(val) && val > 0) _FX_RATES[code].rate = val;
    }
  });

  _FX_LAST_UPDATED = new Date().toISOString();

  var payload = { rates: _FX_RATES, reminderDays: _FX_REMINDER_DAYS, lastUpdated: _FX_LAST_UPDATED };
  try { _STORE.setItem(_FX_STORE_KEY, JSON.stringify(payload)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey(_FX_FB_PATH, payload);

  // Update last-updated display
  var el = document.getElementById('fx-last-updated');
  if (el) el.textContent = 'Updated: ' + new Date().toLocaleDateString();

  var msg = document.getElementById('fx-save-msg');
  if (msg) { msg.textContent = '✅ Rates saved successfully'; setTimeout(function(){ msg.textContent=''; },3000); }

  toast('✅ Exchange rates saved', 'ok');
  renderFxRateInputs();
  renderFxConvert();
}

// Convert QAR amount to a target currency
function convertFromQAR(qarAmount, currencyCode) {
  // Ensure rates are loaded
  if (!_FX_RATES || Object.keys(_FX_RATES).length === 0) {
    _FX_RATES = JSON.parse(JSON.stringify(_FX_DEFAULT));
  }
  var fx = _FX_RATES[currencyCode];
  if (!fx || !fx.rate || fx.rate <= 0) return null;
  return qarAmount / fx.rate;
}

// Format a converted amount with the currency's symbol
function fmtFX(amount, currencyCode) {
  var fx = _FX_RATES[currencyCode];
  if (!fx) return '';
  var dec = fx.decimals || 2;
  var parts = amount.toFixed(dec).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  var num = parts.join('.');
  if (fx.position === 'before') return fx.symbol + ' ' + num;
  return num + ' ' + fx.symbol;
}

// Render rate input rows in settings
function renderFxRateInputs() {
  var wrap = document.getElementById('fx-rates-wrap');
  if (!wrap) return;

  var lastUpdatedEl = document.getElementById('fx-last-updated');
  if (lastUpdatedEl && _FX_LAST_UPDATED) {
    lastUpdatedEl.textContent = 'Updated ' + new Date(_FX_LAST_UPDATED).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }

  var remSel = document.getElementById('fx-reminder-days');
  if (remSel) remSel.value = String(_FX_REMINDER_DAYS);

  var html = '';
  if (!_FX_RATES || Object.keys(_FX_RATES).length === 0) { _FX_RATES = JSON.parse(JSON.stringify(_FX_DEFAULT)); }
  Object.keys(_FX_RATES).forEach(function(code) {
    var fx = _FX_RATES[code];
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px">' +
      '<div style="width:40px;height:36px;background:#0d1b2e;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#c9a84c;flex-shrink:0">' + code + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:12px;font-weight:700;color:#0d1b2e">' + fx.name + '</div>' +
        '<div style="font-size:10px;color:#94a3b8">1 ' + code + ' = ? QAR</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px">' +
        '<input type="number" id="fx-rate-' + code + '" value="' + fx.rate + '" step="0.0001" min="0.0001"' +
          ' style="width:90px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:13px;font-weight:700;color:#0d1b2e;text-align:right;outline:none"' +
          ' oninput="renderFxConvert()">' +
        '<span style="font-size:11px;color:#64748b;font-weight:700">QAR</span>' +
      '</div>' +
    '</div>';
  });
  wrap.innerHTML = html;
}

// Render quick converter results
function renderFxConvert() {
  var wrap = document.getElementById('fx-convert-results');
  if (!wrap) return;
  var amtEl = document.getElementById('fx-input-amount');
  var qar = amtEl ? (parseFloat(amtEl.value) || 0) : 0;
  if (qar <= 0) { wrap.innerHTML = '<div style="text-align:center;color:#94a3b8;font-size:12px;padding:8px">Enter an amount above to see conversions</div>'; return; }

  var html = '';
  if (!_FX_RATES || Object.keys(_FX_RATES).length === 0) { _FX_RATES = JSON.parse(JSON.stringify(_FX_DEFAULT)); }
  Object.keys(_FX_RATES).forEach(function(code) {
    var converted = convertFromQAR(qar, code);
    if (converted === null) return;
    var fx = _FX_RATES[code];
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<div style="width:36px;height:30px;background:#0d1b2e;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#c9a84c">' + code + '</div>' +
        '<span style="font-size:12px;color:#64748b">' + fx.name + '</span>' +
      '</div>' +
      '<div style="font-size:15px;font-weight:800;color:#0d1b2e">' + fmtFX(converted, code) + '</div>' +
    '</div>';
  });
  wrap.innerHTML = html;
}

// Open the currency converter modal from anywhere (e.g. dashboard, reports)



function _goToFxFromReminder() {
  var el = document.getElementById('_fx_reminder');
  if (el) el.remove();
  openSettings();
  setTimeout(function(){ switchStab('currency'); }, 300);
}

function _closeFxReminder() {
  var el = document.getElementById('_fx_reminder');
  if (el) el.remove();
  // Mark dismissed for today so it won't reappear
  try {
    var todayKey = 'pearl_fx_reminder_' + new Date().toISOString().slice(0,10);
    _STORE.setItem(todayKey, '1');
  } catch(e) {}
}

function _goToFxSettings() {
  _closeFxModal();
  openSettings();
  setTimeout(function(){ switchStab('currency'); }, 300);
}

function _closeFxModal() {
  var el = document.getElementById('_fx_modal');
  if (el) el.remove();
}

function openFxConverter(qarAmount) {
  var existing = document.getElementById('_fx_modal');
  if (existing) { existing.remove(); return; }

  // Always ensure rates are populated before building modal
  if (!_FX_RATES || typeof _FX_RATES !== 'object' || Object.keys(_FX_RATES).length === 0) {
    _FX_RATES = JSON.parse(JSON.stringify(_FX_DEFAULT));
  }

  var modal = document.createElement('div');
  modal.id = '_fx_modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9800;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';

  var rates = _FX_RATES;
  var rows = '';
  Object.keys(rates).forEach(function(code) {
    var converted = convertFromQAR(qarAmount, code);
    if (converted === null) return;
    var fx = _FX_RATES[code];
    rows += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<div style="width:38px;height:32px;background:#0d1b2e;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#c9a84c">' + code + '</div>' +
        '<div><div style="font-size:12px;font-weight:700;color:#0d1b2e">' + fx.name + '</div><div style="font-size:10px;color:#94a3b8">1 ' + code + ' = ' + fx.rate + ' QAR</div></div>' +
      '</div>' +
      '<div style="font-size:16px;font-weight:800;color:#0d1b2e">' + fmtFX(converted, code) + '</div>' +
    '</div>';
  });

  modal.innerHTML =
    '<div style="background:#fff;border-radius:16px;width:480px;max-width:96vw;max-height:88vh;overflow:hidden;display:flex;flex-direction:column">' +
      '<div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
          '<div style="font-size:15px;font-weight:800;color:#c9a84c">💱 Currency Converter</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:2px">' + fmtMoney(qarAmount) + ' converted to all currencies</div>' +
        '</div>' +
        '<button onclick="_closeFxModal()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer">✕</button>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px">' + rows + '</div>' +
      '<div style="padding:12px 16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">' +
        '<div style="font-size:10px;color:#94a3b8">Rates set in Settings → Currency</div>' +
        '<button onclick="_goToFxSettings()" style="padding:7px 14px;background:#f1f5f9;color:#64748b;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">⚙️ Update Rates</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);
}

// ── Rate update reminder (runs on login) ──────────────────────
function checkFxRateReminder() {
  // Delay check to allow Firebase async load to complete
  setTimeout(function() { _doCheckFxRateReminder(); }, 2000);
}

function _doCheckFxRateReminder() {
  if (!_FX_REMINDER_DAYS || _FX_REMINDER_DAYS <= 0) return;

  // Don't show more than once per day — check this FIRST
  var todayKey = 'pearl_fx_reminder_' + new Date().toISOString().slice(0,10);
  if (_STORE.getItem(todayKey)) return;

  if (!_FX_LAST_UPDATED) {
    // Never updated — show first-time nudge after 3 days of use
    var installKey = 'pearl_fx_install_date';
    var installed  = _STORE.getItem(installKey);
    if (!installed) { try { _STORE.setItem(installKey, new Date().toISOString()); } catch(e) {} return; }
    var daysSince = (Date.now() - new Date(installed)) / 86400000;
    if (daysSince < 3) return;
  } else {
    var daysSince2 = (Date.now() - new Date(_FX_LAST_UPDATED)) / 86400000;
    if (daysSince2 < _FX_REMINDER_DAYS) return;
  }

  try { _STORE.setItem(todayKey, '1'); } catch(e) {}

  // Show toast with action button
  var banner = document.createElement('div');
  banner.id = '_fx_reminder';
  banner.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:8200;background:#fff;' +
    'border:2px solid #fde68a;border-radius:12px;padding:14px 16px;max-width:320px;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.15);font-family:inherit;animation:slideUp .4s ease';

  var daysTxt = _FX_LAST_UPDATED
    ? Math.round((Date.now() - new Date(_FX_LAST_UPDATED)) / 86400000) + ' days ago'
    : 'never';

  banner.innerHTML =
    '<div style="display:flex;gap:10px;align-items:flex-start">' +
      '<span style="font-size:20px;flex-shrink:0">💱</span>' +
      '<div style="flex:1">' +
        '<div style="font-size:13px;font-weight:800;color:#0d1b2e;margin-bottom:3px">Exchange Rates Need Update</div>' +
        '<div style="font-size:11px;color:#64748b;margin-bottom:10px">Rates were last updated <strong>' + daysTxt + '</strong>. Check they\'re still accurate.</div>' +
        '<div style="display:flex;gap:6px">' +
          '<button onclick="_goToFxFromReminder()" ' +
            'style="flex:1;padding:8px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">⚙️ Update Now</button>' +
          '<button onclick="_closeFxReminder()" ' +
            'style="padding:8px 12px;background:#f1f5f9;color:#64748b;border:none;border-radius:7px;font-size:11px;cursor:pointer">Later</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  if (!document.getElementById('_slideUp_style')) {
    var ss = document.createElement('style');
    ss.id = '_slideUp_style';
    ss.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(ss);
  }
  document.body.appendChild(banner);
  setTimeout(function() {
    var el = document.getElementById('_fx_reminder');
    if (el) { el.style.opacity='0'; el.style.transition='opacity .5s'; setTimeout(function(){ if(el.parentNode)el.remove(); },500); }
  }, 20000);
}



// ════════════════════════════════════════════════════════════════
//  YEAR HEALTH PANEL
//  Shows all 12 months with completion status on dashboard
//  Click any month to see full checklist details
// ════════════════════════════════════════════════════════════════


function toggleYearHealth() {
  var panel = document.getElementById('year-health-panel');
  var btn   = document.getElementById('btn-year-health');
  if (!panel) return;
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (btn) {
    btn.style.background = isOpen ? '#fff' : '#f0fdf4';
    btn.style.borderColor = isOpen ? '#e2e8f0' : '#86efac';
    btn.style.color = isOpen ? '#64748b' : '#16a34a';
  }
  if (!isOpen) renderYearHealth();
}

function renderYearHealth() {
  var wrap = document.getElementById('year-health-wrap');
  if (!wrap) return;

  var today = new Date();
  var curM  = today.getMonth() + 1;
  var curY  = today.getFullYear();
  var MNS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var keys  = ['allDaysEntered','pricesLocked','monthlyPricesSet','financePosted','backupSaved'];

  // Build month cards
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
    '<div style="font-size:13px;font-weight:800;color:#0d1b2e">📋 ' + curY + ' Month Health</div>' +
    '<button onclick="openYearHealthDetail()" style="padding:5px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#64748b;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">View All →</button>' +
  '</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">';

  for (var mi = 1; mi <= 12; mi++) {
    var isFuture  = mi > curM;
    var isCurrent = mi === curM;

    if (isFuture) {
      html += '<div style="padding:8px 6px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;text-align:center;opacity:.5">' +
        '<div style="font-size:12px;font-weight:700;color:#94a3b8">' + MNS[mi-1] + '</div>' +
        '<div style="font-size:16px;margin:3px 0">—</div>' +
        '<div style="font-size:9px;color:#94a3b8">Future</div>' +
      '</div>';
      continue;
    }

    var status    = getEomStatus(curY, mi);
    var doneCount = keys.filter(function(k){ return status[k].done; }).length;
    var total     = keys.length;

    var bg, bdr, icon, statusTxt;

    if (isCurrent) {
      // Current month — never green, always "in progress"
      // Show how many items done so far, with a clock icon
      bg = '#eff6ff'; bdr = '#c9a84c'; icon = '🔄'; statusTxt = doneCount + '/5';
    } else if (doneCount === total) {
      // Past month fully complete
      bg = '#f0fdf4'; bdr = '#86efac'; icon = '✅'; statusTxt = '5/5';
    } else if (doneCount >= 3) {
      bg = '#fffbeb'; bdr = '#fde68a'; icon = '⚠️'; statusTxt = doneCount + '/5';
    } else {
      bg = '#fef2f2'; bdr = '#fca5a5'; icon = '🔴'; statusTxt = doneCount + '/5';
    }

    html += '<div onclick="openMonthChecklist(' + mi + ')" ' +
      'style="padding:8px 6px;background:' + bg + ';border:2px solid ' + bdr + ';border-radius:9px;text-align:center;cursor:pointer;transition:all .15s" ' +
      'onmouseover="this.style.opacity=.8" onmouseout="this.style.opacity=1">' +
      '<div style="font-size:12px;font-weight:800;color:#0d1b2e">' + MNS[mi-1] + (isCurrent?' ◀':'') + '</div>' +
      '<div style="font-size:18px;margin:3px 0">' + icon + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b">' + statusTxt + '</div>' +
    '</div>';
  }

  html += '</div>';
  wrap.innerHTML = html;
}

function openMonthChecklist(m) {
  var existing = document.getElementById('_month_checklist_modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = '_month_checklist_modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9800;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';

  var curY    = new Date().getFullYear();
  var curMon  = new Date().getMonth() + 1;
  var isCurMon = (m === curMon);
  var MNF  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var keys = ['allDaysEntered','pricesLocked','monthlyPricesSet','financePosted','backupSaved'];
  var status = getEomStatus(curY, m);
  var doneCount = keys.filter(function(k){ return status[k].done; }).length;
  var allDone   = doneCount === keys.length && !isCurMon;

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#fff;border-radius:16px;width:460px;max-width:96vw;overflow:hidden';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:linear-gradient(135deg,#0d1b2e,#1e3a5f);padding:16px 20px;display:flex;align-items:center;justify-content:space-between';
  hdr.innerHTML =
    '<div>' +
      '<div style="font-size:15px;font-weight:800;color:#c9a84c">' + (isCurMon?'🔄':'📋') + ' ' + MNF[m-1] + ' ' + curY + ' Checklist' + (isCurMon?' — In Progress':'') + '</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:2px">' + (isCurMon ? 'Month still ongoing — items update automatically' : doneCount + ' of ' + keys.length + ' items complete') + '</div>' +
    '</div>' +
    '<div style="background:' + (allDone?'#16a34a':'#c9a84c') + ';color:' + (allDone?'#fff':'#0d1b2e') + ';border-radius:20px;padding:4px 12px;font-size:13px;font-weight:800">' + doneCount + '/' + keys.length + '</div>';
  inner.appendChild(hdr);

  // Items
  var body = document.createElement('div');
  body.style.cssText = 'padding:14px 16px;display:flex;flex-direction:column;gap:8px';

  keys.forEach(function(k) {
    var item     = status[k];
    var rowBg    = item.done ? '#f0fdf4' : '#fff';
    var rowBdr   = item.done ? '#86efac' : '#e2e8f0';
    var checkBg  = item.done ? '#16a34a' : '#e2e8f0';
    var checkClr = item.done ? '#fff'    : '#94a3b8';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:' + rowBg + ';border:1.5px solid ' + rowBdr + ';border-radius:9px';

    // Tick / checkbox
    if (item.manual) {
      var cb = document.createElement('button');
      cb.style.cssText = 'width:26px;height:26px;border-radius:7px;border:2px solid ' + (item.done?'#16a34a':'#d1d5db') + ';background:' + checkBg + ';cursor:pointer;flex-shrink:0;font-size:14px;color:' + checkClr + ';display:flex;align-items:center;justify-content:center';
      cb.textContent = item.done ? '✓' : '';
      cb.onclick = (function(ky, mi){ return function(){ _eomTick(curY, mi, ky); setTimeout(function(){ openMonthChecklist(mi); }, 100); }; })(k, m);
      row.appendChild(cb);
    } else {
      var dot = document.createElement('div');
      dot.style.cssText = 'width:26px;height:26px;border-radius:7px;background:' + checkBg + ';flex-shrink:0;font-size:14px;color:' + checkClr + ';display:flex;align-items:center;justify-content:center';
      dot.textContent = item.done ? '✓' : '○';
      row.appendChild(dot);
    }

    // Label
    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0';
    info.innerHTML =
      '<div style="font-size:13px;font-weight:700;color:#0d1b2e' + (item.done?';text-decoration:line-through;opacity:.6':'') + '">' + item.label + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:1px">' + item.detail + '</div>';
    row.appendChild(info);

    // Fix + Mark OK buttons
    if (!item.done) {
      var btnWrap = document.createElement('div');
      btnWrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;flex-shrink:0;align-items:flex-end';
      if (item.action) {
        var fixBtn = document.createElement('button');
        fixBtn.textContent = 'Fix →';
        fixBtn.style.cssText = 'padding:6px 10px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer';
        fixBtn.onclick = (function(fn){ return function(){ modal.remove(); fn(); }; })(item.action);
        btnWrap.appendChild(fixBtn);
      }
      if (item.missingDepts && item.missingDepts.length > 0) {
        item.missingDepts.forEach(function(dept) {
          var ackBtn = document.createElement('button');
          ackBtn.textContent = '✓ Mark OK: ' + dept.split(' ')[0];
          ackBtn.title = 'Intentional zero or posted next day';
          ackBtn.style.cssText = 'padding:5px 8px;background:#f0fdf4;color:#16a34a;border:1.5px solid #86efac;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';
          ackBtn.onclick = (function(d, fn){ return function(){ fn(d); }; })(dept, item.ackFn);
          btnWrap.appendChild(ackBtn);
        });
      }
      if (btnWrap.children.length > 0) row.appendChild(btnWrap);
    }

    body.appendChild(row);
  });

  inner.appendChild(body);

  // Footer
  var footer = document.createElement('div');
  footer.style.cssText = 'padding:12px 16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center';
  footer.innerHTML =
    '<div style="font-size:10px;color:#94a3b8">Auto-items update automatically · Finance posted requires manual tick</div>';
  var closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = 'padding:8px 18px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer';
  closeBtn.onclick = function(){ modal.remove(); };
  footer.appendChild(closeBtn);
  inner.appendChild(footer);

  modal.appendChild(inner);
  modal.onclick = function(e){ if(e.target===modal) modal.remove(); };
  document.body.appendChild(modal);

  // Refresh year health when modal closes
  modal.addEventListener('click', function(e){
    if (e.target === modal) renderYearHealth();
  });
}

function openYearHealthDetail() {
  // Open checklist for current month by default
  openMonthChecklist(new Date().getMonth() + 1);
}


// ════════════════════════════════════════════════════════════════
//  ITEMS MANAGEMENT TAB
//  Full CRUD for departments and items
//  All changes persisted via saveCustom() + Firebase sync
// ════════════════════════════════════════════════════════════════

var _itemsEditDept = null;
var _itemsEdits    = {}; // {dept: [[name,price,kg], ...]} — in-progress edits

var ICON_OPTIONS = ['🛏️','🍽️','🏊','👔','📦','🧺','🏨','💆','🎯','🧴','👗','🧹','🍷','🎪','🛒','📋','⚙️','🏋️','🎨','💼'];


function renderItemsDeptList() {
  var wrap = document.getElementById('items-dept-list');
  if (!wrap) return;
  wrap.innerHTML = '';

  // Action bar
  var actionBar = document.createElement('div');
  actionBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px';
  actionBar.innerHTML = '<div style="font-size:13px;color:#64748b">' + DEPT_KEYS.length + ' departments · click a card to edit items</div>';
  var addBtn = document.createElement('button');
  addBtn.textContent = '🏢 Add New Department';
  addBtn.style.cssText = 'padding:9px 18px;background:linear-gradient(135deg,#7e22ce,#a855f7);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer';
  addBtn.onclick = showAddDeptForm;
  actionBar.appendChild(addBtn);
  wrap.appendChild(actionBar);

  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px';

  DEPT_KEYS.forEach(function(dept) {
    var builtin = !isCustomDept(dept);
    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;border:1.5px solid #e2e8f0;border-radius:13px;overflow:hidden;cursor:pointer;transition:all .15s';
    card.onmouseover = function(){ this.style.borderColor='#c9a84c'; this.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'; };
    card.onmouseout  = function(){ this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'; };

    var col  = DEPT_COLORS[dept] || '#0d1b2e';
    var icon = DEPT_ICONS[dept]  || '📦';
    var cnt  = MASTER[dept] ? MASTER[dept].length : 0;

    // Header
    var hdr = document.createElement('div');
    hdr.style.cssText = 'background:' + col + ';padding:14px 16px;display:flex;align-items:center;justify-content:space-between';

    var left = document.createElement('div');
    left.style.cssText = 'display:flex;align-items:center;gap:10px';
    left.innerHTML = '<span style="font-size:26px">' + icon + '</span>' +
      '<div><div style="font-size:15px;font-weight:800;color:#fff">' + dept + '</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,.6)">' + cnt + ' items</div></div>';
    hdr.appendChild(left);

    var right = document.createElement('div');
    right.style.cssText = 'display:flex;gap:6px;align-items:center';
    if (builtin) {
      right.innerHTML = '<span style="padding:3px 8px;background:rgba(255,255,255,.1);border-radius:6px;font-size:9px;color:rgba(255,255,255,.5);font-weight:700">BUILT-IN</span>';
    } else {
      var ren = document.createElement('button');
      ren.textContent = '✏️ Rename';
      ren.style.cssText = 'padding:5px 10px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:6px;font-size:10px;cursor:pointer';
      ren.onclick = (function(d){ return function(e){ e.stopPropagation(); renameDept(d); }; })(dept);

      var del = document.createElement('button');
      del.textContent = '🗑';
      del.style.cssText = 'padding:5px 8px;background:rgba(220,38,38,.2);border:1px solid rgba(220,38,38,.4);color:#fca5a5;border-radius:6px;font-size:11px;cursor:pointer';
      del.onclick = (function(d){ return function(e){ e.stopPropagation(); deleteDept(d); }; })(dept);

      right.appendChild(ren);
      right.appendChild(del);
    }
    hdr.appendChild(right);
    card.appendChild(hdr);

    // Footer
    var ftr = document.createElement('div');
    ftr.style.cssText = 'padding:12px 16px;display:flex;align-items:center;justify-content:space-between';
    ftr.innerHTML = '<div style="font-size:11px;color:#64748b">' + cnt + ' items · click to edit</div>';

    var editBtn = document.createElement('button');
    editBtn.textContent = 'Edit Items →';
    editBtn.style.cssText = 'padding:7px 16px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer';
    editBtn.onclick = (function(d){ return function(e){ e.stopPropagation(); openItemsEditor(d); }; })(dept);
    ftr.appendChild(editBtn);
    card.appendChild(ftr);

    card.onclick = function(){ openItemsEditor(dept); };
    grid.appendChild(card);
  });

  wrap.appendChild(grid);
}

var DEPT_COLORS_LIST = ['#0d1b2e','#1B4F72','#145A32','#4A235A','#784212','#6E2F1A','#1A5276','#7B241C','#1F618D','#117A65','#6C3483','#1A252F'];
var ICON_LIST = ['\uD83D\uDECF\uFE0F','\uD83C\uDF7D\uFE0F','\uD83C\uDFCA','\uD83D\uDC54','\uD83D\uDCE6','\uD83E\uDDFA','\uD83C\uDFE8','\uD83D\uDC86','\uD83C\uDFAF','\uD83E\uDDF4','\uD83D\uDC57','\uD83E\uDDF9','\uD83C\uDF77','\uD83C\uDFAA','\uD83D\uDED2','\uD83D\uDCCB','\u2699\uFE0F','\uD83C\uDFCB\uFE0F','\uD83C\uDFA8','\uD83D\uDCBC'];

function initItemsTab() {
  // Build icon picker
  var iconWrap = document.getElementById('icon-picker-wrap');
  if (iconWrap && !iconWrap.dataset.built) {
    iconWrap.dataset.built = '1';
    var hidden = document.getElementById('new-dept-icon-full');
    var icons = ['🛏️','🍽️','🏊','👔','📦','🧺','🏨','💆','🎯','🧴','👗','🧹','🍷','🎪','🛒','📋','⚙️','🏋️','🎨','💼','🧼','🧽','🪣','🌿','💎','🔑','🎀','👒','🎭','🏅'];
    icons.forEach(function(ico) {
      var btn = document.createElement('button');
      btn.textContent = ico;
      btn.type = 'button';
      btn.style.cssText = 'width:34px;height:34px;border:2px solid transparent;border-radius:7px;font-size:18px;cursor:pointer;background:transparent;transition:all .1s';
      btn.onclick = function() {
        iconWrap.querySelectorAll('button').forEach(function(b){ b.style.borderColor='transparent'; b.style.background='transparent'; });
        this.style.borderColor='#c9a84c'; this.style.background='#fffbeb';
        if (hidden) hidden.value = ico;
      };
      if (ico === '📦') { btn.style.borderColor='#c9a84c'; btn.style.background='#fffbeb'; }
      iconWrap.appendChild(btn);
    });
  }
  // Build color picker
  var colorWrap = document.getElementById('color-picker-wrap');
  if (colorWrap && !colorWrap.dataset.built) {
    colorWrap.dataset.built = '1';
    var hiddenCol = document.getElementById('new-dept-color-full');
    var cols = ['#0d1b2e','#1B4F72','#145A32','#4A235A','#784212','#6E2F1A','#1A5276','#7B241C','#1F618D','#117A65','#6C3483','#922B21'];
    cols.forEach(function(col, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = 'width:30px;height:30px;border-radius:50%;background:' + col + ';border:3px solid ' + (idx===0?'#c9a84c':'transparent') + ';cursor:pointer';
      btn.onclick = function() {
        colorWrap.querySelectorAll('button').forEach(function(b){ b.style.borderColor='transparent'; });
        this.style.borderColor='#c9a84c';
        if (hiddenCol) hiddenCol.value = col;
      };
      colorWrap.appendChild(btn);
    });
  }
}

function showAddDeptForm() {
  setTimeout(deptInitRows, 50);
  initItemsTab();
  var f = document.getElementById('items-add-dept-form');
  if (f) { f.style.display='block'; f.scrollIntoView({behavior:'smooth',block:'start'}); }
  setTimeout(function(){ var n=document.getElementById('new-dept-name-full'); if(n)n.focus(); },300);
}

function showAddItemForm() {
  if (!_itemsEditDept) return;
  var f = document.getElementById('items-add-item-form');
  var t = document.getElementById('items-add-item-title');
  if (t) t.textContent = '\u2795 Add Item to ' + _itemsEditDept;
  if (f) {
    f.style.display='block';
    ['new-item-name-full','new-item-price-full','new-item-kg-full'].forEach(function(id){ var el=document.getElementById(id); if(el)el.value=''; });
    f.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(function(){ var n=document.getElementById('new-item-name-full'); if(n)n.focus(); },300);
  }
}

// ── Dept Items Row Table ──────────────────────────────────────
var _deptRowCount = 0;

function deptInitRows() {
  _deptRowCount = 0;
  var container = document.getElementById('dept-items-rows');
  if (!container) return;
  container.innerHTML = '';
  // Start with 3 empty rows
  deptAddRow(); deptAddRow(); deptAddRow();
}

function deptAddRow(name, price, kg) {
  var container = document.getElementById('dept-items-rows');
  if (!container) return;
  _deptRowCount++;
  var id = _deptRowCount;
  var bg = id % 2 === 0 ? '#f8fafc' : '#fff';
  var row = document.createElement('div');
  row.id = 'dept-row-' + id;
  row.style.cssText = 'display:grid;grid-template-columns:1fr 90px 90px 32px;gap:6px;padding:6px 8px;background:' + bg + ';border-bottom:1px solid #f1f5f9;align-items:center';
  var nameInp  = document.createElement('input');
  nameInp.type = 'text'; nameInp.id = 'dri-name-'+id;
  nameInp.placeholder = 'e.g. Bath Towel'; nameInp.value = name||'';
  nameInp.style.cssText = 'width:100%;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-weight:600;color:#0d1b2e;outline:none;box-sizing:border-box';
  nameInp.onfocus = function(){ this.style.borderColor='#c9a84c'; };
  nameInp.onblur  = function(){ this.style.borderColor='#e2e8f0'; };

  var priceInp = document.createElement('input');
  priceInp.type = 'number'; priceInp.id = 'dri-price-'+id;
  priceInp.placeholder = '0.00'; priceInp.step = '0.0001'; priceInp.min = '0';
  priceInp.value = price||'';
  priceInp.style.cssText = 'width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-weight:600;color:#1d4ed8;outline:none;box-sizing:border-box;text-align:right';
  priceInp.onfocus = function(){ this.style.borderColor='#3b82f6'; };
  priceInp.onblur  = function(){ this.style.borderColor='#e2e8f0'; };

  var kgInp = document.createElement('input');
  kgInp.type = 'number'; kgInp.id = 'dri-kg-'+id;
  kgInp.placeholder = '0.000'; kgInp.step = '0.001'; kgInp.min = '0';
  kgInp.value = kg||'';
  kgInp.style.cssText = 'width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-weight:600;color:#16a34a;outline:none;box-sizing:border-box;text-align:right';
  kgInp.onfocus = function(){ this.style.borderColor='#16a34a'; };
  kgInp.onblur  = function(){ this.style.borderColor='#e2e8f0'; };

  var delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.style.cssText = 'width:28px;height:28px;background:#fee2e2;border:none;border-radius:6px;color:#dc2626;font-size:14px;cursor:pointer;font-weight:700';
  delBtn.textContent = '✕';
  delBtn.onclick = function(){ deptRemoveRow(id); };

  row.appendChild(nameInp); row.appendChild(priceInp); row.appendChild(kgInp); row.appendChild(delBtn);
  container.appendChild(row);
}

function deptRemoveRow(id) {
  var row = document.getElementById('dept-row-' + id);
  if (row) row.remove();
}

function deptGetItems() {
  var items = [];
  var container = document.getElementById('dept-items-rows');
  if (!container) return items;
  container.querySelectorAll('[id^="dept-row-"]').forEach(function(row) {
    var rid = row.id.replace('dept-row-', '');
    var name  = (document.getElementById('dri-name-'  + rid)?.value || '').trim();
    var price = parseFloat(document.getElementById('dri-price-' + rid)?.value || 0) || 0;
    var kg    = parseFloat(document.getElementById('dri-kg-'    + rid)?.value || 0) || 0;
    if (name) items.push({ name: name, price: price, kg: kg });
  });
  return items;
}


function doAddDeptFull() {
  var name      = (document.getElementById('new-dept-name-full').value||'').trim();
  var icon      = document.getElementById('new-dept-icon-full').value||'📦';
  var color     = document.getElementById('new-dept-color-full').value||'#1A5276';
  var startDate = (document.getElementById('new-dept-startdate-full')?.value||'').trim();
  if (!startDate) startDate = new Date().toISOString().slice(0,10);
  if (!name) { toast('⚠️ Enter a department name','err'); return; }
  if (MASTER[name]) { toast('Department "'+name+'" already exists','err'); return; }
  // Read items from row table
  var rowItems = deptGetItems();
  if (!rowItems.length) { toast('⚠️ Add at least one item','err'); return; }
  var items = rowItems.map(function(it){ return [it.name, it.price, it.kg, startDate]; });
  MASTER[name]=items; DEPT_ICONS[name]=icon; DEPT_COLORS[name]=color; DEPT_KEYS.push(name);
  var custom = loadCustom();
  if (!custom.depts) custom.depts=[];
  custom.depts.push({name:name, icon:icon, color:color, items:items, startDate:startDate});
  saveCustom(custom);
  if (window._fbSaveKey) window._fbSaveKey('pearl/custom',custom);
  buildSelectors();
  // Reset form including start date
  document.getElementById('items-add-dept-form').style.display='none';
  var sd = document.getElementById('new-dept-startdate-full');
  if (sd) sd.value = '';
  deptInitRows();
  renderItemsDeptList();
  toast('✅ "'+name+'" created · starts '+startDate,'ok');
}

// Get start date for an item (stored in MASTER[dept][i][3])
function getItemStartDate(dept, i) {
  var item = MASTER[dept] && MASTER[dept][i];
  if (!item || !item[3]) return null;
  return item[3]; // 'YYYY-MM-DD' string
}

// Check if item should be visible for a given year/month/day
function itemVisibleForDate(dept, i, y, m, day) {
  // Check item-level start date
  var startDate = getItemStartDate(dept, i);
  // Also check dept-level start date from custom storage
  if (!startDate) {
    try {
      var custom = loadCustom();
      var cd = custom.depts && custom.depts.find(function(d){ return d.name === dept; });
      if (cd && cd.startDate) startDate = cd.startDate;
    } catch(e) {}
  }
  if (!startDate) return true; // no restriction
  var itemStart = new Date(startDate);
  var checkDate = new Date(y, m-1, day || 1);
  return checkDate >= itemStart;
}

// Check if entire department is visible for a given month
function deptVisibleForMonth(dept, y, m) {
  try {
    var custom = loadCustom();
    var cd = custom.depts && custom.depts.find(function(d){ return d.name === dept; });
    if (cd && cd.startDate) {
      var deptStart = new Date(cd.startDate);
      var monthEnd  = new Date(y, m, 0); // last day of month
      return monthEnd >= deptStart;
    }
  } catch(e) {}
  return true; // built-in depts always visible
}


function doAddItemFull() {
  if (!_itemsEditDept) return;
  var name      = (document.getElementById('new-item-name-full').value||'').trim();
  var price     = parseFloat(document.getElementById('new-item-price-full').value)||0;
  var kg        = parseFloat(document.getElementById('new-item-kg-full').value)||0;
  var startDate = (document.getElementById('new-item-startdate')?.value||'').trim();
  if (!name) { toast('⚠️ Enter an item name','err'); return; }
  if (!_itemsEdits[_itemsEditDept]) _itemsEdits[_itemsEditDept]=MASTER[_itemsEditDept].map(function(it){return [it[0],it[1],it[2],it[3]||''];});
  // Store as [name, price, kg, startDate]
  if (!startDate) startDate = new Date().toISOString().slice(0,10); // default: today
  _itemsEdits[_itemsEditDept].push([name, price, kg, startDate]);
  document.getElementById('items-add-item-form').style.display='none';
  // Reset fields including date
  ['new-item-name-full','new-item-price-full','new-item-kg-full'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value='';
  });
  var sd = document.getElementById('new-item-startdate');
  if (sd) sd.value = '';
  renderItemsEditorRows();
  toast('+  "'+name+'" added' + (startDate ? ' · starts '+startDate : '') + ' — click 💾 Save to confirm','ok');
}


function isCustomDept(dept) {
  var custom = loadCustom();
  if (!custom.depts) return false;
  return custom.depts.some(function(d){ return d.name === dept; });
}

function openItemsEditor(dept) {
  _itemsEditDept = dept;
  // Deep copy current items for editing
  _itemsEdits[dept] = MASTER[dept].map(function(it){ return [it[0], it[1], it[2]]; });

  var panel = document.getElementById('items-editor-panel');
  var title = document.getElementById('items-editor-title');
  if (panel) panel.style.display = 'block';
  if (title) title.textContent = (DEPT_ICONS[dept]||'📦') + '  ' + dept;
  panel.scrollIntoView({ behavior:'smooth', block:'start' });
  renderItemsEditorRows();
}

function closeItemsEditor() {
  _itemsEditDept = null;
  var panel = document.getElementById('items-editor-panel');
  if (panel) panel.style.display = 'none';
}

function renderItemsEditorRows() {
  var wrap = document.getElementById('items-editor-rows');
  var countEl = document.getElementById('items-editor-count');
  if (!wrap || !_itemsEditDept) return;
  var items = _itemsEdits[_itemsEditDept] || [];
  if (countEl) countEl.textContent = items.length + ' items';

  wrap.innerHTML = '';
  items.forEach(function(item, idx) {
    var row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:40px 1fr 110px 90px 60px;gap:0;padding:8px 16px;border-bottom:1px solid #f8fafc;align-items:center;' + (idx%2===0?'background:#fff;':'background:#f8fafc;');

    // Index
    var numDiv = document.createElement('div');
    numDiv.style.cssText = 'font-size:11px;color:#94a3b8;font-weight:600';
    numDiv.textContent = idx + 1;
    row.appendChild(numDiv);

    // Name input
    var nameInp = document.createElement('input');
    nameInp.type = 'text';
    nameInp.value = item[0];
    nameInp.style.cssText = 'width:100%;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;color:#0d1b2e;outline:none;background:transparent';
    nameInp.onfocus = function(){ this.style.borderColor='#c9a84c'; this.style.background='#fffbeb'; };
    nameInp.onblur  = function(){ this.style.borderColor='#e2e8f0'; this.style.background='transparent'; };
    nameInp.oninput = (function(i){ return function(){ _itemsEdits[_itemsEditDept][i][0] = this.value; }; })(idx);
    row.appendChild(nameInp);

    // Price input
    var priceInp = document.createElement('input');
    priceInp.type = 'number';
    priceInp.value = item[1];
    priceInp.step = '0.0001';
    priceInp.min  = '0';
    priceInp.style.cssText = 'width:100%;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;color:#1d4ed8;outline:none;text-align:right;background:transparent';
    priceInp.onfocus = function(){ this.style.borderColor='#3b82f6'; this.style.background='#eff6ff'; };
    priceInp.onblur  = function(){ this.style.borderColor='#e2e8f0'; this.style.background='transparent'; };
    priceInp.oninput = (function(i){ return function(){ _itemsEdits[_itemsEditDept][i][1] = parseFloat(this.value)||0; }; })(idx);
    row.appendChild(priceInp);

    // Weight input
    var kgInp = document.createElement('input');
    kgInp.type = 'number';
    kgInp.value = item[2];
    kgInp.step  = '0.001';
    kgInp.min   = '0';
    kgInp.style.cssText = 'width:100%;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;color:#16a34a;outline:none;text-align:right;background:transparent';
    kgInp.onfocus = function(){ this.style.borderColor='#16a34a'; this.style.background='#f0fdf4'; };
    kgInp.onblur  = function(){ this.style.borderColor='#e2e8f0'; this.style.background='transparent'; };
    kgInp.oninput = (function(i){ return function(){ _itemsEdits[_itemsEditDept][i][2] = parseFloat(this.value)||0; }; })(idx);
    row.appendChild(kgInp);

    // Delete button
    var delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.title = 'Delete this item';
    delBtn.style.cssText = 'width:32px;height:32px;background:#fff5f5;border:1.5px solid #fca5a5;color:#dc2626;border-radius:7px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;margin:auto';
    delBtn.onclick = (function(i){ return function(){ deleteItemFromEditor(i); }; })(idx);
    row.appendChild(delBtn);

    wrap.appendChild(row);
  });
}

function deleteItemFromEditor(idx) {
  if (!_itemsEditDept) return;
  var items = _itemsEdits[_itemsEditDept];
  var name = items[idx][0];
  if (!confirm('Delete "' + name + '" from ' + _itemsEditDept + '?\n\nThis removes it from future entries. Historical data is not affected.')) return;
  items.splice(idx, 1);
  renderItemsEditorRows();
  toast('🗑 "' + name + '" removed', 'ok');
}

function openAddItemFull() { showAddItemForm(); }

function saveItemsEdits() {
  if (!_itemsEditDept) return;
  var dept  = _itemsEditDept;
  var items = _itemsEdits[dept];

  // Validate
  var invalid = items.filter(function(it){ return !it[0] || !it[0].trim(); });
  if (invalid.length > 0) { toast('⚠️ Some items have no name — please fill in or delete them', 'err'); return; }

  // Update MASTER
  MASTER[dept].length = 0;
  items.forEach(function(it){ MASTER[dept].push([it[0], it[1], it[2], it[3]||'']); });

  // Persist to custom storage
  var custom = loadCustom();

  if (isCustomDept(dept)) {
    // Update custom dept
    var cd = custom.depts.find(function(d){ return d.name === dept; });
    if (cd) cd.items = items.map(function(it){ return [it[0], it[1], it[2]]; });
  } else {
    // Store overrides for built-in dept
    if (!custom.overrides) custom.overrides = {};
    custom.overrides[dept] = items.map(function(it){ return [it[0], it[1], it[2]]; });
  }

  saveCustom(custom);
  if (window._fbSaveKey) window._fbSaveKey('pearl/custom', custom);

  // Also update PRICES cache
  PRICES[dept] = items.map(function(it){ return [it[0], it[1], it[2]]; });

  renderItemsDeptList();
  buildSelectors();
  toast('✅ ' + dept + ' saved — ' + items.length + ' items', 'ok');
  closeItemsEditor();
}

// ── Add Department (full version) ──────────────────────────────
function openAddDeptFull() { showAddDeptForm(); }

// ── Rename Department ──────────────────────────────────────────
function renameDept(dept) {
  var newName = prompt('Rename "' + dept + '" to:', dept);
  if (!newName || !newName.trim() || newName.trim() === dept) return;
  newName = newName.trim();
  if (MASTER[newName]) { toast('Department "' + newName + '" already exists', 'err'); return; }

  // Rename in MASTER
  MASTER[newName] = MASTER[dept];
  delete MASTER[dept];
  DEPT_ICONS[newName]  = DEPT_ICONS[dept];
  DEPT_COLORS[newName] = DEPT_COLORS[dept];
  delete DEPT_ICONS[dept];
  delete DEPT_COLORS[dept];

  // Update DEPT_KEYS
  var idx = DEPT_KEYS.indexOf(dept);
  if (idx !== -1) DEPT_KEYS[idx] = newName;

  // Update custom storage
  var custom = loadCustom();
  if (custom.depts) {
    var cd = custom.depts.find(function(d){ return d.name === dept; });
    if (cd) cd.name = newName;
  }
  saveCustom(custom);
  if (window._fbSaveKey) window._fbSaveKey('pearl/custom', custom);

  buildSelectors();
  renderItemsDeptList();
  toast('✅ Renamed to "' + newName + '"', 'ok');
}

// ── Delete Department ──────────────────────────────────────────
function deleteDept(dept) {
  var cnt = MASTER[dept] ? MASTER[dept].length : 0;
  if (!confirm('Delete department "' + dept + '"?\n\n' + cnt + ' items will be removed.\nHistorical data for this department will still be in your backups.\n\nThis cannot be undone.')) return;

  delete MASTER[dept];
  delete DEPT_ICONS[dept];
  delete DEPT_COLORS[dept];
  var idx = DEPT_KEYS.indexOf(dept);
  if (idx !== -1) DEPT_KEYS.splice(idx, 1);

  // Remove from custom storage
  var custom = loadCustom();
  if (custom.depts) {
    custom.depts = custom.depts.filter(function(d){ return d.name !== dept; });
  }
  saveCustom(custom);
  if (window._fbSaveKey) window._fbSaveKey('pearl/custom', custom);

  buildSelectors();
  renderItemsDeptList();
  closeItemsEditor();
  toast('🗑 "' + dept + '" deleted', 'ok');
}

// Wire renderItemsDeptList into showTab
