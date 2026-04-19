function renderTrends() {
  var months = parseInt(document.getElementById('trend-months')?.value || 6);
  var wrap = document.getElementById('trend-wrap');
  if (!wrap) return;
  var data = [];
  var now = new Date();
  for (var i = months-1; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    var y = d.getFullYear(), m = d.getMonth()+1;
    var tot = monthTotals(y, m);
    data.push({ label: MONTH_NAMES[m-1].slice(0,3)+' '+y, qr: tot.qr, kg: tot.kg, pcs: tot.pcs });
  }
  // Calculate rolling avg and best/worst
  var avgRev = data.reduce(function(a,b){ return a+b.qr; },0) / data.filter(function(d){ return d.qr>0; }).length || 0;
  var best = data.reduce(function(a,b){ return b.qr>a.qr?b:a; }, data[0]);
  var worst = data.filter(function(d){ return d.qr>0; }).reduce(function(a,b){ return b.qr<a.qr?b:a; }, data.find(function(d){ return d.qr>0; }) || data[0]);

  var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">';
  html += '<div style="background:linear-gradient(135deg,#0369a1,#0284c7);border-radius:12px;padding:16px;color:#fff">' +
    '<div style="font-size:10px;font-weight:700;opacity:.7;margin-bottom:6px">AVG MONTHLY REVENUE</div>' +
    '<div style="font-size:22px;font-weight:800">' + f2(avgRev) + ' QR</div>' +
    '<div style="font-size:11px;opacity:.7">Over ' + months + ' months</div></div>';
  html += '<div style="background:linear-gradient(135deg,#15803d,#16a34a);border-radius:12px;padding:16px;color:#fff">' +
    '<div style="font-size:10px;font-weight:700;opacity:.7;margin-bottom:6px">BEST MONTH</div>' +
    '<div style="font-size:20px;font-weight:800">' + (best?best.label:'—') + '</div>' +
    '<div style="font-size:13px;font-weight:700">' + (best&&best.qr>0?fmtMoney(best.qr):'No data') + '</div></div>';
  html += '<div style="background:linear-gradient(135deg,#b45309,#d97706);border-radius:12px;padding:16px;color:#fff">' +
    '<div style="font-size:10px;font-weight:700;opacity:.7;margin-bottom:6px">LOWEST MONTH</div>' +
    '<div style="font-size:20px;font-weight:800">' + (worst?worst.label:'—') + '</div>' +
    '<div style="font-size:13px;font-weight:700">' + (worst&&worst.qr>0?fmtMoney(worst.qr):'No data') + '</div></div>';
  html += '</div>';

  // Trend table
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden">' +
    '<div style="background:#0d1b2e;padding:12px 16px;font-size:12px;font-weight:800;color:#c9a84c">📊 ' + months + '-Month Revenue Trend</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#f8fafc">' +
      '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px">MONTH</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">REVENUE (QR)</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">KG</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#64748b;font-size:11px">vs AVG</th>' +
      '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px">TREND</th>' +
    '</tr></thead><tbody>';
  data.forEach(function(row, idx) {
    var diff3 = row.qr - avgRev; var pct3 = avgRev > 0 ? (diff3/avgRev*100) : 0;
    var col3 = row.qr >= avgRev ? '#16a34a' : '#dc2626';
    var barW = row.qr > 0 ? Math.min(120, (row.qr/best.qr*120)) : 0;
    var bg3 = idx%2===0?'#fff':'#f8fafc';
    var isBest = best && row.label===best.label && row.qr>0;
    html += '<tr style="background:' + (isBest?'#f0fdf4':bg3) + '">' +
      '<td style="padding:8px 12px;font-weight:700;color:#0d1b2e">' + row.label + (isBest?' 🏆':'') + '</td>' +
      '<td style="padding:8px 12px;text-align:right;font-weight:700;color:#0369a1">' + (row.qr>0?f2(row.qr):'—') + '</td>' +
      '<td style="padding:8px 12px;text-align:right;color:#d97706">' + (row.kg>0?Math.ceil(row.kg)+'kg':'—') + '</td>' +
      '<td style="padding:8px 12px;text-align:right;font-weight:700;color:' + col3 + '">' + (row.qr>0?(diff3>=0?'+':'')+pct3.toFixed(1)+'%':'—') + '</td>' +
      '<td style="padding:8px 12px">' +
        '<div style="background:#e2e8f0;border-radius:4px;height:8px;width:120px">' +
          '<div style="background:' + col3 + ';height:100%;width:' + barW + 'px;border-radius:4px"></div>' +
        '</div>' +
      '</td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}

function renderAnalytics() {
  var m = parseInt(document.getElementById('ana-month')?.value || new Date().getMonth() + 1);
  var mName = MONTH_NAMES[m-1];
  var nd = dim(CY, m);

  // Gather dept data
  var deptQR = {}, deptKG = {}, deptPcs = {};
  var totalQR = 0, totalKG = 0;
  DEPT_KEYS.forEach(function(dept) {
    var qr = 0, kg = 0, pcs = 0;
    MASTER[dept].forEach(function(_, i) {
      for (var d = 0; d < nd; d++) {
        var v = getVal(CY, m, dept, i, d);
        qr  += v * getP(dept, i);
        kg  += v * getK(dept, i);
        pcs += v;
      }
    });
    deptQR[dept]  = qr;
    deptKG[dept]  = kg;
    deptPcs[dept] = pcs;
    totalQR += qr;
    totalKG += kg;
  });

  // Daily totals for trend
  var dailyQR = [], dailyKG = [];
  for (var d = 1; d <= nd; d++) {
    var dt = dayTotals(CY, m, d);
    dailyQR.push(dt.qr);
    dailyKG.push(dt.kg);
  }

  var maxQR = Math.max.apply(null, DEPT_KEYS.map(function(d){ return deptQR[d]; }));
  var maxKG = Math.max.apply(null, DEPT_KEYS.map(function(d){ return deptKG[d]; }));

  // ── Revenue 3D bar chart ─────────────────────────────────
  var revBars = DEPT_KEYS.map(function(dept) {
    var pct = totalQR > 0 ? (deptQR[dept]/totalQR*100).toFixed(1) : '0.0';
    var shortLbl = dept.replace(' & ', '&').replace(' Linen','').replace(' Cleaning','');
    return build3DBar(dept, deptQR[dept], maxQR, shortLbl, pct, false);
  }).join('');

  // ── KG 3D bar chart ──────────────────────────────────────
  var kgBars = DEPT_KEYS.map(function(dept) {
    var pct = totalKG > 0 ? (deptKG[dept]/totalKG*100).toFixed(1) : '0.0';
    var shortLbl = dept.replace(' & ', '&').replace(' Linen','').replace(' Cleaning','');
    return build3DBar(dept, deptKG[dept], maxKG, shortLbl, pct, false);
  }).join('');

  // ── Donut — revenue % ────────────────────────────────────
  var donutData = DEPT_KEYS.map(function(dept) {
    return {label: dept, value: deptQR[dept], color: anaColor(dept, 'main')};
  }).filter(function(d){ return d.value > 0; });

  // ── Summary table ────────────────────────────────────────
  var summRows = DEPT_KEYS.map(function(dept) {
    var pct = totalQR > 0 ? (deptQR[dept]/totalQR*100).toFixed(1) : '0.0';
    return '<tr>' +
      '<td style="font-weight:600">' + DEPT_ICONS[dept] + ' ' + dept + '</td>' +
      '<td style="color:var(--blue);font-family:monospace;text-align:right">' + f2(deptQR[dept]) + '</td>' +
      '<td style="color:#16a34a;font-family:monospace;text-align:right">' + deptKG[dept].toFixed(1) + '</td>' +
      '<td style="color:var(--grey);text-align:right">' + deptPcs[dept].toLocaleString() + '</td>' +
      '<td style="text-align:right"><strong>' + pct + '%</strong></td>' +
    '</tr>';
  }).join('');
  summRows += '<tr style="background:#f8fafc;font-weight:700">' +
    '<td>🏆 TOTAL</td>' +
    '<td style="color:var(--blue);font-family:monospace;text-align:right">' + f2(totalQR) + '</td>' +
    '<td style="color:#16a34a;font-family:monospace;text-align:right">' + totalKG.toFixed(1) + '</td>' +
    '<td style="font-family:monospace;text-align:right">' +
      DEPT_KEYS.reduce(function(s,d){ return s+deptPcs[d]; },0).toLocaleString() + '</td>' +
    '<td style="text-align:right">100%</td>' +
  '</tr>';

  document.getElementById('analytics-wrap').innerHTML =
    // ── Row 1: Revenue bar + KG bar
    '<div class="ana-grid">' +
      '<div class="ana-card">' +
        '<div class="ana-title">📊 Revenue by Department — ' + mName + ' (QR)</div>' +
        '<div class="bar3d-wrap">' + revBars + '</div>' +
      '</div>' +
      '<div class="ana-card">' +
        '<div class="ana-title">⚖️ KG Washed by Department — ' + mName + '</div>' +
        '<div class="bar3d-wrap">' + kgBars + '</div>' +
      '</div>' +
    '</div>' +
    // ── Row 2: Revenue % donut + Summary table
    '<div class="ana-grid">' +
      '<div class="ana-card">' +
        '<div class="ana-title">🍩 Revenue Share % — ' + mName + '</div>' +
        buildDonut(donutData) +
      '</div>' +
      '<div class="ana-card">' +
        '<div class="ana-title">📋 Department Summary</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12.5px">' +
          '<thead><tr style="border-bottom:2px solid var(--navy)">' +
            '<th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--grey)">DEPT</th>' +
            '<th style="text-align:right;padding:6px 8px;font-size:11px;color:var(--grey)">REVENUE</th>' +
            '<th style="text-align:right;padding:6px 8px;font-size:11px;color:var(--grey)">KG</th>' +
            '<th style="text-align:right;padding:6px 8px;font-size:11px;color:var(--grey)">PCS</th>' +
            '<th style="text-align:right;padding:6px 8px;font-size:11px;color:var(--grey)">%</th>' +
          '</tr></thead>' +
          '<tbody>' + summRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
    // ── Row 3: Daily revenue trend (full width)
    '<div class="ana-grid">' +
      '<div class="ana-card full">' +
        '<div class="ana-title">📈 Daily Revenue Trend — ' + mName + ' ' + CY + ' (QR)</div>' +
        buildLineChart(nd, dailyQR, '#3b82f6') +
      '</div>' +
    '</div>' +
    // ── Row 4: Daily KG trend (full width)
    '<div class="ana-grid">' +
      '<div class="ana-card full">' +
        '<div class="ana-title">📈 Daily KG Trend — ' + mName + ' ' + CY + '</div>' +
        buildLineChart(nd, dailyKG, '#10b981') +
      '</div>' +
    '</div>';

  // ── KPI cards + Risk Indicators ──
  renderKPIs(m);
  setTimeout(function(){ renderRiskIndicators(null); }, 60);
}

// ── Dashboard mini charts (called from renderDash) ─────────
function formatTargetInputDisplay(inp) {
  if (!inp) return;
  var raw = parseFloat(String(inp.value).replace(/,/g,'')) || 0;
  if (raw > 0) {
    inp.value = f2(raw); // f2 now adds commas
  } else {
    inp.value = '';
  }
}

function saveDashTarget() {
  var m = parseInt(document.getElementById('dash-month')?.value || new Date().getMonth()+1);
  var rawVal = String(document.getElementById('dash-target')?.value || '').replace(/,/g,'');
  var val = parseFloat(rawVal) || 0;
  saveTarget(CY, m, { revenue: val });
  // Re-format display immediately
  var inp = document.getElementById('dash-target');
  if (inp) inp.value = val > 0 ? f2(val) : '';
  toast('✅ Target saved — ' + fmtMoney(val) + ' for ' + MONTH_NAMES[m-1], 'ok');
  renderDash();
}

function stepTarget(delta) {
  var m   = parseInt(document.getElementById('dash-month')?.value || new Date().getMonth()+1);
  var inp = document.getElementById('dash-target');
  if (!inp) return;
  var raw = parseFloat(String(inp.value).replace(/,/g,'')) || 0;
  var newVal = Math.max(0, raw + delta);
  inp.value = f2(newVal);
  // Auto-save immediately
  saveTarget(CY, m, { revenue: newVal });
  renderDash();
  // Visual feedback on the input briefly
  inp.style.borderColor = '#16a34a';
  setTimeout(function(){ inp.style.borderColor = '#c9a84c'; }, 600);
}

// ── Insight badge (stub — full system pending restore) ──────
function generateInsights(m) {
  var insights = [];
  var nd  = dim(CY, m);
  var qr  = monthTotals(CY, m).qr;
  var tgt = loadTarget(CY, m);

  // Below 50% of target warning — click goes to Forecast tab
  if (tgt && tgt.revenue > 0) {
    var pct = qr / tgt.revenue * 100;
    if (pct < 50) {
      var today = new Date();
      var daysLeft = (today.getMonth()+1 === m && today.getFullYear() === CY) ? nd - today.getDate() + 1 : 0;
      if (daysLeft > 5) {
        insights.push({
          level:'warning', icon:'⚠️',
          msg:'Revenue below 50% of target',
          detail: qr.toFixed(0) + ' QR of ' + tgt.revenue.toFixed(0) + ' QR target (' + pct.toFixed(1) + '%)',
          actionLabel: '→ View Forecast',
          action: function(){ showTab('forecast'); }
        });
      }
    }
    // Above target — positive
    if (pct >= 100) {
      insights.push({
        level:'positive', icon:'🎉',
        msg:'Target reached! ' + pct.toFixed(1) + '% of target',
        detail: fmtMoney(qr) + ' vs target ' + fmtMoney(tgt.revenue),
        actionLabel: '→ View Report',
        action: function(){ showTab('report'); }
      });
    }
  }

  // Missing days warning — click goes to Entry tab on first missing day
  var today2 = new Date();
  if (today2.getFullYear() === CY && today2.getMonth()+1 === m) {
    var missingDays2 = [];
    for (var d = 1; d < today2.getDate(); d++) {
      if (dayTotals(CY, m, d).qr === 0) missingDays2.push(d);
    }
    if (missingDays2.length > 0) {
      var firstMissing = missingDays2[0];
      var _m2 = m;
      insights.push({
        level:'warning', icon:'📅',
        msg: missingDays2.length + ' day' + (missingDays2.length>1?'s':'') + ' missing data',
        detail: 'Days: ' + missingDays2.slice(0,5).join(', ') + (missingDays2.length>5?' ...':''),
        actionLabel: '→ Go to Entry',
        action: (function(fm, m_){ return function(){
          showTab('entry');
          setTimeout(function(){
            var ms = document.getElementById('ent-month');
            var ds = document.getElementById('ent-day');
            if (ms) ms.value = m_;
            if (ds) ds.value = fm;
            renderEntry();
          }, 300);
        }; })(firstMissing, _m2)
      });
    }
  }

  return insights;
}

function renderInsightBadge(m) {
  var el = document.getElementById('dash-insight-badge');
  if (!el) return;
  var insights = generateInsights(m);
  if (!insights.length) { el.innerHTML = ''; return; }
  var warnings  = insights.filter(function(i){ return i.level === 'warning'; }).length;
  var positives = insights.filter(function(i){ return i.level === 'positive'; }).length;
  var col = warnings > 0 ? '#dc2626' : positives > 0 ? '#16a34a' : '#0284c7';
  var bg  = warnings > 0 ? '#fee2e2' : positives > 0 ? '#f0fdf4' : '#eff6ff';
  var bdr = warnings > 0 ? '#fca5a5' : positives > 0 ? '#86efac' : '#bfdbfe';

  var badge = document.createElement('div');
  badge.style.cssText = 'position:relative;cursor:pointer';
  badge.innerHTML = '<div style="padding:5px 12px;background:' + bg + ';border:1.5px solid ' + bdr + ';border-radius:20px;font-size:11px;font-weight:700;color:' + col + '">' +
    insights.length + ' insight' + (insights.length>1?'s':'') + ' this month</div>';
  badge.onclick = function(){
    var popup = document.getElementById('_insight_popup');
    if (popup) { popup.remove(); return; }
    var p = document.createElement('div');
    p.id = '_insight_popup';
    p.style.cssText = 'position:absolute;top:calc(100% + 8px);right:0;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.15);z-index:600;min-width:280px;max-width:380px;overflow:hidden';
    var rows = insights.map(function(ins, idx2) {
      var lc = ins.level==='warning'?'#dc2626':'#16a34a';
      var bg2 = ins.level==='warning'?'#fff5f5':'#f0fdf4';
      return '<div id="_ins_row_' + idx2 + '" style="padding:12px 14px;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;align-items:flex-start;cursor:' + (ins.action?'pointer':'default') + ';background:#fff;transition:background .15s"' +
        (ins.action ? ' onmouseover="this.style.background=\'' + bg2 + '\'" onmouseout="this.style.background=\'#fff\'" onclick="_insightAction(' + idx2 + ')"' : '') + '>' +
        '<span style="font-size:18px">' + ins.icon + '</span>' +
        '<div style="flex:1"><div style="font-size:12px;font-weight:700;color:' + lc + '">' + ins.msg + '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:2px">' + ins.detail + '</div></div>' +
        (ins.actionLabel ? '<div style="font-size:10px;font-weight:700;color:' + lc + ';white-space:nowrap;align-self:center">' + ins.actionLabel + '</div>' : '') +
        '</div>';
    }).join('');
    p.innerHTML = '<div style="background:#0d1b2e;padding:10px 14px;font-size:11px;font-weight:800;color:#c9a84c">🧠 Insights — ' + MONTH_NAMES[m-1] + ' ' + CY + '</div>' + rows;
    badge.appendChild(p);
    setTimeout(function(){
      document.addEventListener('click', function h(e){ if(!badge.contains(e.target)){p.remove();document.removeEventListener('click',h);} });
    }, 10);
  };
  el.innerHTML = '';
  el.appendChild(badge);
  // Store actions for click handler
  window._currentInsights = insights;
}

function _insightAction(idx) {
  var ins = window._currentInsights && window._currentInsights[idx];
  if (!ins || !ins.action) return;
  // Close popup
  var popup = document.getElementById('_insight_popup');
  if (popup) popup.remove();
  // Execute action
  ins.action();
}


function renderTargetBar(totalRev, m) {
  var target = loadTarget(CY, m);
  var bar    = document.getElementById('dash-target-bar');
  if (!bar) return;

  var tgt = target ? target.revenue : 0;
  var pct = tgt > 0 ? Math.min(100, totalRev / tgt * 100) : 0;
  var col = pct >= 100 ? '#16a34a' : pct >= 75 ? '#d97706' : '#dc2626';
  var bg  = pct >= 100 ? '#f0fdf4' : pct >= 75 ? '#fffbeb' : '#fff5f5';
  var bdr = pct >= 100 ? '#86efac' : pct >= 75 ? '#fde68a' : '#fecaca';
  var lbl = pct >= 100 ? 'Target reached!' : pct >= 75 ? 'On track' : pct > 0 ? 'Below target' : '';

  var today        = new Date();
  var daysLeft     = (today.getMonth()+1 === m && today.getFullYear() === CY) ? dim(CY,m) - today.getDate() + 1 : dim(CY,m);
  var remaining    = tgt > 0 ? Math.max(0, tgt - totalRev) : 0;
  var neededPerDay = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0;
  var urgency      = daysLeft <= 5 ? '#dc2626' : daysLeft <= 10 ? '#d97706' : '#64748b';

  bar.innerHTML = '';
  var card = document.createElement('div');
  card.style.cssText = 'background:#fff;border:1.5px solid ' + (tgt>0?bdr:'#e2e8f0') + ';border-radius:14px;padding:16px 20px';

  // Header row
  var topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:12px';

  var titleWrap = document.createElement('div');
  titleWrap.style.cssText = 'display:flex;align-items:center;gap:10px';
  titleWrap.innerHTML =
    '<div style="width:36px;height:36px;background:' + (tgt>0?bg:'#f8fafc') + ';border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px">' + String.fromCodePoint(0x1F3AF) + '</div>' +
    '<div><div style="font-size:13px;font-weight:800;color:#0d1b2e">Revenue Target \u2014 ' + MONTH_NAMES[m-1] + ' ' + CY + '</div>' +
    '<div style="font-size:11px;color:#64748b;margin-top:1px">Monthly budget progress</div></div>';
  topRow.appendChild(titleWrap);

  var numWrap = document.createElement('div');
  numWrap.style.cssText = 'display:flex;align-items:center;gap:14px;flex-wrap:wrap';

  // Actual
  var actualDiv = document.createElement('div');
  actualDiv.style.cssText = 'text-align:right';
  actualDiv.innerHTML = '<div style="font-size:20px;font-weight:900;color:#0d1b2e">' + fmtMoney(totalRev) + '</div><div style="font-size:9px;color:#64748b;font-weight:700;letter-spacing:.8px">ACTUAL</div>';
  numWrap.appendChild(actualDiv);

  var divEl = document.createElement('div');
  divEl.style.cssText = 'font-size:20px;color:#e2e8f0;font-weight:300';
  divEl.textContent = '/';
  numWrap.appendChild(divEl);

  // Target input
  var tgtDiv = document.createElement('div');
  tgtDiv.style.cssText = 'text-align:right';
  var tgtInp = document.createElement('input');
  tgtInp.type = 'text';
  tgtInp.id   = 'dash-target';
  tgtInp.inputMode = 'numeric';
  tgtInp.placeholder = 'Set target';
  tgtInp.value = tgt > 0 ? tgt.toLocaleString() : '';
  tgtInp.style.cssText = 'width:130px;padding:4px 8px;border:1.5px solid ' + (tgt>0?'#c9a84c':'#e2e8f0') + ';border-radius:8px;font-size:18px;font-weight:900;color:' + (tgt>0?'#0d1b2e':'#94a3b8') + ';text-align:right;background:' + (tgt>0?'#fffbeb':'#f8fafc') + ';outline:none;cursor:pointer';
  tgtInp.addEventListener('focus', function(){ this.value = this.value.replace(/,/g,''); this.select(); this.style.borderColor='#c9a84c'; this.style.background='#fffbeb'; });
  tgtInp.addEventListener('blur',  function(){ formatTargetInputDisplay(this); saveDashTarget(); });
  tgtInp.addEventListener('keydown', function(e){ if(e.key==='Enter') this.blur(); });
  var tgtLbl = document.createElement('div');
  tgtLbl.style.cssText = 'font-size:9px;color:#94a3b8;font-weight:700;letter-spacing:.8px;margin-top:2px;text-align:right';
  tgtLbl.textContent = 'TARGET \u2014 click to edit';
  tgtDiv.appendChild(tgtInp);
  tgtDiv.appendChild(tgtLbl);
  numWrap.appendChild(tgtDiv);

  if (tgt > 0) {
    var badge = document.createElement('div');
    badge.style.cssText = 'padding:6px 14px;background:' + bg + ';border:1.5px solid ' + bdr + ';border-radius:10px;text-align:center';
    badge.innerHTML = '<div style="font-size:22px;font-weight:900;color:' + col + '">' + pct.toFixed(1) + '%</div><div style="font-size:9px;color:' + col + ';font-weight:700">' + lbl + '</div>';
    numWrap.appendChild(badge);
  }

  topRow.appendChild(numWrap);
  card.appendChild(topRow);

  if (tgt > 0) {
    // Progress bar
    var barWrap = document.createElement('div');
    barWrap.style.cssText = 'background:#f1f5f9;border-radius:20px;height:14px;overflow:hidden;margin-bottom:10px;position:relative';
    var fill = document.createElement('div');
    fill.style.cssText = 'background:linear-gradient(90deg,' + col + ',' + (pct>=100?'#22c55e':pct>=75?'#f59e0b':'#ef4444') + ');height:100%;width:' + pct + '%;border-radius:20px;transition:width .6s cubic-bezier(.22,1,.36,1)';
    barWrap.appendChild(fill);
    if (pct < 100) {
      var pctLbl = document.createElement('div');
      pctLbl.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:9px;color:#94a3b8;font-weight:700';
      pctLbl.textContent = (100-pct).toFixed(1) + '% to go';
      barWrap.appendChild(pctLbl);
    }
    card.appendChild(barWrap);

    // Footer: step buttons + remaining info
    var footer = document.createElement('div');
    footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px';

    var stepBtns = document.createElement('div');
    stepBtns.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap';
    [[-5000,'-5k','#f1f5f9','#64748b','#e2e8f0'],[-1000,'-1k','#f1f5f9','#64748b','#e2e8f0'],[1000,'+1k','#f0fdf4','#16a34a','#86efac'],[5000,'+5k','#f0fdf4','#16a34a','#86efac'],[10000,'+10k','#eff6ff','#1d4ed8','#bfdbfe']].forEach(function(s) {
      var b = document.createElement('button');
      b.textContent = s[1];
      b.style.cssText = 'padding:5px 9px;background:' + s[2] + ';color:' + s[3] + ';border:1px solid ' + s[4] + ';border-radius:6px;font-size:10px;font-weight:700;cursor:pointer';
      b.onclick = (function(v){ return function(){ stepTarget(v); }; })(s[0]);
      stepBtns.appendChild(b);
    });
    footer.appendChild(stepBtns);

    if (pct < 100) {
      var info = document.createElement('div');
      info.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap';
      info.innerHTML =
        '<span style="font-size:13px;font-weight:800;color:#dc2626">' + String.fromCodePoint(0x1F4C9) + ' ' + fmtMoney(remaining) + ' remaining</span>' +
        '<span style="color:#e2e8f0">\xb7</span>' +
        '<span style="font-size:12px;font-weight:700;color:' + urgency + '">' + daysLeft + ' days left</span>' +
        '<span style="color:#e2e8f0">\xb7</span>' +
        '<span style="font-size:12px;font-weight:800;color:' + urgency + '">need ' + fmtMoney(neededPerDay) + '/day</span>';
      footer.appendChild(info);
    } else {
      var exc = document.createElement('div');
      exc.style.cssText = 'display:flex;align-items:center;gap:6px';
      exc.innerHTML = '<span style="font-size:14px">' + String.fromCodePoint(0x1F389) + '</span><span style="font-size:13px;font-weight:800;color:#16a34a">Exceeded by ' + fmtMoney(totalRev - tgt) + '</span>';
      footer.appendChild(exc);
    }
    card.appendChild(footer);
  } else {
    var prompt = document.createElement('div');
    prompt.style.cssText = 'text-align:center;font-size:12px;color:#94a3b8;padding:4px 0';
    prompt.textContent = 'Click the target field above to set a monthly revenue goal';
    card.appendChild(prompt);
  }

  bar.appendChild(card);
}


function renderDashOccQuick(m) {
  var el = document.getElementById('dash-occ-quick');
  if (!el) return;
  var today       = new Date();
  var todayD      = today.getDate();
  var todayM      = today.getMonth() + 1;
  var todayY      = today.getFullYear();
  var totalRooms  = _TOTAL_ROOMS || 161;
  var isCurrentM  = (CY === todayY && m === todayM);
  var selDay      = parseInt(document.getElementById('occ-day-sel')?.value || 0);
  var displayDay  = selDay > 0 ? selDay : (isCurrentM ? todayD : dim(CY, m));
  var occ         = loadDayOcc(CY, m, displayDay);
  var rooms       = occ ? occ.rooms : null;
  var pct         = rooms !== null ? (rooms / totalRooms * 100).toFixed(1) : null;
  var dayName     = DAY_NAMES[new Date(CY, m-1, displayDay).getDay()];
  var dayLabel    = dayName + ' ' + displayDay + ' ' + MONTH_NAMES[m-1];

  // Color based on occupancy
  var occCol = pct !== null ? (pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626') : '#94a3b8';
  var occBg  = pct !== null ? (pct >= 80 ? '#f0fdf4' : pct >= 60 ? '#fffbeb' : '#fff5f5') : '#f8fafc';

  el.innerHTML = '';
  var row = document.createElement('div');
  row.style.cssText = 'background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap';

  // Icon + label
  var left = document.createElement('div');
  left.style.cssText = 'display:flex;align-items:center;gap:8px';
  left.innerHTML =
    '<div style="width:32px;height:32px;background:#f0f4ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px">🏨</div>' +
    '<div>' +
      '<div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:.5px">OCCUPANCY · ' + dayLabel.toUpperCase() + '</div>' +
      (pct !== null
        ? '<div style="font-size:15px;font-weight:800;color:' + occCol + '">' + rooms + ' / ' + totalRooms + ' rooms &nbsp;·&nbsp; ' + pct + '%</div>'
        : '<div style="font-size:13px;color:#94a3b8;font-style:italic">Not entered yet</div>'
      ) +
    '</div>';
  row.appendChild(left);

  // Spacer
  var spacer = document.createElement('div');
  spacer.style.cssText = 'flex:1';
  row.appendChild(spacer);

  // Mini progress bar
  if (pct !== null) {
    var miniBar = document.createElement('div');
    miniBar.style.cssText = 'width:100px;background:#f1f5f9;border-radius:10px;height:8px;overflow:hidden';
    var miniFill = document.createElement('div');
    miniFill.style.cssText = 'background:' + occCol + ';height:100%;width:' + pct + '%;border-radius:10px';
    miniBar.appendChild(miniFill);
    row.appendChild(miniBar);
  }

  // Edit button — opens inline form
  var editBtn = document.createElement('button');
  editBtn.textContent = pct !== null ? '✏️ Edit' : '+ Enter';
  editBtn.style.cssText = 'padding:7px 14px;background:' + occBg + ';border:1.5px solid ' + (pct!==null?occCol:'#e2e8f0') + ';color:' + occCol + ';border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap';
  editBtn.onclick = function(){ toggleOccEdit(m, displayDay, totalRooms); };
  row.appendChild(editBtn);

  el.appendChild(row);

  // Inline edit form (hidden by default)
  var form = document.createElement('div');
  form.id = 'occ-edit-form';
  form.style.cssText = 'display:none;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-top:8px';
  form.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
    '<div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.5px">EDIT OCCUPANCY</div>' +
    '<select id="occ-day-sel" onchange="renderDashOccQuick(' + m + ')" style="padding:5px 8px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12px;font-weight:700;color:#0d1b2e;background:#fff;cursor:pointer">' +
    (function(){ var opts=''; for(var _d=1;_d<=dim(CY,m);_d++){ var _dn=DAY_NAMES[new Date(CY,m-1,_d).getDay()]; opts+='<option value="'+_d+'" '+(_d===displayDay?'selected':'')+'>'+_dn+' '+_d+'</option>'; } return opts; })() +
    '</select>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:5px;letter-spacing:.5px">ROOMS OCCUPIED</div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<input type="number" id="occ-rooms-inp" min="0" max="' + totalRooms + '" value="' + (rooms||'') + '" placeholder="e.g. 89"' +
            ' style="flex:1;padding:10px 12px;border:1.5px solid #c9a84c;border-radius:8px;font-size:18px;font-weight:800;color:#0d1b2e;outline:none;text-align:center;background:#fffbeb"' +
            ' oninput="_occRoomsChange(this.value,' + totalRooms + ')">' +
          '<span style="font-size:13px;color:#94a3b8;font-weight:600">/ ' + totalRooms + '</span>' +
        '</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:4px">Enter number of occupied rooms</div>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:5px;letter-spacing:.5px">OCCUPANCY %</div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<input type="number" id="occ-pct-inp" min="0" max="100" step="0.1" value="' + (pct||'') + '" placeholder="e.g. 55.3"' +
            ' style="flex:1;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:18px;font-weight:800;color:#0d1b2e;outline:none;text-align:center"' +
            ' oninput="_occPctChange(this.value,' + totalRooms + ')">' +
          '<span style="font-size:13px;color:#94a3b8;font-weight:600">%</span>' +
        '</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:4px">Or enter % directly</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      '<button onclick="saveOccFromCompact(' + m + ',' + displayDay + ',' + totalRooms + ')" style="flex:1;padding:11px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">💾 Save Occupancy</button>' +
      '<button onclick="_closeOccEdit()" style="padding:11px 16px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-size:13px;cursor:pointer">Cancel</button>' +
    '</div>';
  el.appendChild(form);
}



function _closeOccEdit() {
  var f = document.getElementById('occ-edit-form');
  if (f) f.style.display = 'none';
}

function _occRoomsChange(val, totalRooms) {
  var rooms = parseFloat(val) || 0;
  var pct   = totalRooms > 0 ? (rooms / totalRooms * 100).toFixed(1) : 0;
  var pctInp = document.getElementById('occ-pct-inp');
  if (pctInp) { pctInp.value = pct; pctInp.style.borderColor = '#c9a84c'; }
}

function _occPctChange(val, totalRooms) {
  var pct   = parseFloat(val) || 0;
  var rooms = Math.round(pct / 100 * totalRooms);
  var roomsInp = document.getElementById('occ-rooms-inp');
  if (roomsInp) { roomsInp.value = rooms || ''; roomsInp.style.borderColor = '#c9a84c'; }
}

// Legacy alias
function _occInputChange(rooms, totalRooms) { _occRoomsChange(rooms, totalRooms); }

function toggleOccEdit(m, day, totalRooms) {
  var form = document.getElementById('occ-edit-form');
  if (!form) return;
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'block') {
    setTimeout(function(){ var inp = document.getElementById('occ-rooms-inp'); if(inp){ inp.focus(); inp.select(); } }, 100);
  }
}

function saveOccFromCompact(m, day, totalRooms) {
  var roomsInp = document.getElementById('occ-rooms-inp');
  var pctInp   = document.getElementById('occ-pct-inp');
  var rooms, pct;

  // Prefer whichever was last edited — use pct if rooms is empty
  if (roomsInp && roomsInp.value !== '') {
    rooms = parseInt(roomsInp.value) || 0;
    pct   = totalRooms > 0 ? parseFloat((rooms / totalRooms * 100).toFixed(2)) : 0;
  } else if (pctInp && pctInp.value !== '') {
    pct   = parseFloat(pctInp.value) || 0;
    rooms = Math.round(pct / 100 * totalRooms);
  } else {
    toast('⚠️ Enter rooms or occupancy % first', 'warn');
    return;
  }

  if (rooms < 0 || rooms > totalRooms) {
    toast('⚠️ Rooms must be between 0 and ' + totalRooms, 'warn');
    return;
  }

  saveDayOcc(CY, m, day, rooms, pct);
  _closeOccEdit();
  invalidateTabCache('benchmark'); // So benchmark shows updated occ
  renderDash();
  toast('🏨 Saved: ' + rooms + ' rooms · ' + pct.toFixed(1) + '%', 'ok');
}


function renderOccStrip(m) {
  // Removed from dashboard — occupancy strip now shown in Benchmark tab only
  var el = document.getElementById('dash-occ-strip');
  if (el) el.innerHTML = '';
}


// ── Show missing days popup ───────────────────────────────────
function showMissingDaysPopup(m, missingDays) {
  // Remove any existing popup
  var existing = document.getElementById('_missing_days_popup');
  if (existing) { existing.remove(); return null; }

  var popup = document.createElement('div');
  popup.id = '_missing_days_popup';
  popup.style.cssText = 'position:absolute;top:110%;left:0;z-index:500;background:#fff;' +
    'border:1.5px solid #fca5a5;border-radius:12px;padding:14px 16px;min-width:220px;' +
    'box-shadow:0 8px 24px rgba(220,38,38,.15);font-family:inherit';

  var daysHtml = missingDays.map(function(d) {
    var dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(new Date().getFullYear(), m-1, d).getDay()];
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #fee2e2">' +
      '<span style="font-size:12px;font-weight:700;color:#dc2626">' + dn + ' ' + d + ' ' + MONTH_NAMES[m-1] + '</span>' +
      '<button onclick="goToMissingDay(' + m + ',' + d + ')" ' +
        'style="padding:3px 10px;background:#dc2626;color:#fff;border:none;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer">Enter</button>' +
    '</div>';
  }).join('');

  popup.innerHTML =
    '<div style="font-size:12px;font-weight:800;color:#dc2626;margin-bottom:8px">⚠️ ' + missingDays.length + ' Missing Day' + (missingDays.length > 1 ? 's' : '') + '</div>' +
    daysHtml +
    '<button onclick="closeMissingDaysPopup()" style="margin-top:10px;width:100%;padding:6px;background:#f1f5f9;border:none;border-radius:7px;font-size:11px;color:#64748b;cursor:pointer;font-weight:600">Close</button>';

  // Close when clicking outside
  setTimeout(function() {
    document.addEventListener('click', function handler(e) {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 100);

  return popup;
}

function closeMissingDaysPopup() {
  var p = document.getElementById('_missing_days_popup');
  if (p) p.remove();
}

function goToMissingDay(m, d) {
  var pop = document.getElementById('_missing_days_popup');
  if (pop) pop.remove();
  showTab('entry');
  setTimeout(function() {
    var ms = document.getElementById('ent-month');
    var ds = document.getElementById('ent-day');
    if (ms) ms.value = m;
    if (ds) ds.value = d;
    renderEntry();
  }, 300);
}


function renderNotifications(m, totalRev, nd) {
  var el = document.getElementById('dash-notif');
  if (!el) return;
  var alerts = [];
  var missingList = [];
  // Check missing days
  var today = new Date(); var todayDay = today.getDate();
  var todayM = today.getMonth()+1; var todayY = today.getFullYear();
  if (CY === todayY && m === todayM) {
    for (var d = 1; d < todayDay; d++) {
      var dt = dayTotals(CY, m, d);
      if (dt.qr === 0) missingList.push(d);
    }
    if (missingList.length > 0) alerts.push({
      icon: '⚠️',
      msg: missingList.length + (missingList.length === 1 ? ' day missing data' : ' days missing data'),
      col: '#dc2626', bg: '#fee2e2',
      clickable: true,
      missingList: missingList
    });
  }
  // Revenue vs target
  var target = loadTarget(CY, m);
  if (target && target.revenue && totalRev > 0) {
    var pct = totalRev / target.revenue * 100;
    if (pct >= 100) alerts.push({ icon: '🎉', msg: 'Target reached!', col: '#16a34a', bg: '#f0fdf4' });
    else if (pct < 50 && todayM === m && todayY === CY) alerts.push({ icon: '📉', msg: 'Revenue below 50% of target', col: '#d97706', bg: '#fffbeb' });
  }
  if (alerts.length === 0) { el.innerHTML = ''; return; }
  el.style.position = 'relative';
  el.innerHTML = alerts.map(function(a) {
    var clickAttr = a.clickable
      ? 'onclick="var p=showMissingDaysPopup(' + m + ',[' + a.missingList.join(',') + ']);if(p)this.parentNode.appendChild(p);" style="cursor:pointer;" title="Click to see missing days"'
      : '';
    // Missing days → solid red vivid badge. Others → styled per color
    var bg2    = a.clickable ? '#dc2626' : a.bg;
    var col2   = a.clickable ? '#fff' : a.col;
    var shadow = a.clickable ? ';box-shadow:0 4px 18px rgba(220,38,38,.5);animation:pulse-red 1.2s infinite' : (a.col==='#d97706'?';box-shadow:0 3px 10px rgba(217,119,6,.3)':'');
    var pad    = a.clickable ? '9px 18px' : '6px 14px';
    var fsize  = a.clickable ? '13px' : '12px';
    return '<span ' + clickAttr + ' style="display:inline-flex;align-items:center;gap:7px;background:' + bg2 + ';color:' + col2 + ';padding:' + pad + ';border-radius:24px;font-size:' + fsize + ';font-weight:800;margin-left:8px;letter-spacing:.2px' + shadow + '">' +
      '<span style="font-size:15px">' + a.icon + '</span>' +
      '<strong>' + a.msg + '</strong>' +
      (a.clickable ? '<span style="font-size:10px;opacity:.85"> ▾ Click</span>' : '') +
    '</span>';
  }).join('');
}

function renderDashCharts(m) {
  var nd = dim(CY, m);
  var deptQR = {}, deptKG = {}, totalQR = 0, totalKG = 0;
  DEPT_KEYS.forEach(function(dept) {
    var qr = 0, kg = 0;
    MASTER[dept].forEach(function(_, i) {
      for (var d = 0; d < nd; d++) {
        var v = getVal(CY, m, dept, i, d);
        qr += v * getP(dept, i);
        kg += v * getK(dept, i);
      }
    });
    deptQR[dept] = qr; deptKG[dept] = kg;
    totalQR += qr; totalKG += kg;
  });
  var maxQR = Math.max.apply(null, DEPT_KEYS.map(function(d){ return deptQR[d]; }));
  var maxKG = Math.max.apply(null, DEPT_KEYS.map(function(d){ return deptKG[d]; }));

  // Daily trend for mini line
  var dailyQR = [];
  for (var d2 = 1; d2 <= nd; d2++) { dailyQR.push(dayTotals(CY, m, d2).qr); }

  var revBars = DEPT_KEYS.map(function(dept) {
    var shortLbl = dept.replace(' & ','&').replace(' Linen','').replace(' Cleaning','');
    return build3DBar(dept, deptQR[dept], maxQR, shortLbl, '', true);
  }).join('');
  var kgBars = DEPT_KEYS.map(function(dept) {
    var shortLbl = dept.replace(' & ','&').replace(' Linen','').replace(' Cleaning','');
    return build3DBar(dept, deptKG[dept], maxKG, shortLbl, '', true);
  }).join('');

  var el = document.getElementById('dash-charts-wrap');
  if (!el) return;
  el.innerHTML =
    '<div class="dash-chart-card bar3d-mini">' +
      '<div class="dash-chart-title">📊 Revenue by Dept (QR)</div>' +
      '<div class="bar3d-wrap">' + revBars + '</div>' +
    '</div>' +
    '<div class="dash-chart-card bar3d-mini">' +
      '<div class="dash-chart-title">⚖️ KG by Department</div>' +
      '<div class="bar3d-wrap">' + kgBars + '</div>' +
    '</div>' +
    '<div class="dash-chart-card" style="grid-column:1/-1">' +
      '<div class="dash-chart-title">📈 Daily Revenue Trend — ' + MONTH_NAMES[m-1] + ' ' + CY + '</div>' +
      buildLineChart(nd, dailyQR, '#3b82f6') +
    '</div>';
}


// ════════════════════════════════════════════════════════════════
//  GUIDE
// ════════════════════════════════════════════════════════════════

function _loadGuideScript() {
  if (window._guideLoaded) { _runGuide(); return; }
  var tpl = document.getElementById('guide-script-template');
  if (!tpl) return;
  window._guideLoaded = true;
  var s = document.createElement('script');
  s.textContent = tpl.textContent;
  document.head.appendChild(s);
  setTimeout(_runGuide, 10);
}

function _runGuide() {
  if (typeof _renderGuideContent === 'function') _renderGuideContent();
}

// renderGuide loaded on demand
function renderGuide() {
  _loadGuideScript();
}

function isMobile() { return window.innerWidth <= 768; }

// Handle screen rotation / resize — switch between mobile and desktop layout
(function() {
  var _lastMobile = null;
  function _checkLayout() {
    var nowMobile = isMobile();
    if (nowMobile === _lastMobile) return; // no change
    _lastMobile = nowMobile;
    var mob  = document.getElementById('mob-app');
    var desk = document.getElementById('pg-app');
    if (!mob || !desk) return;
    if (nowMobile) {
      desk.style.display = 'none';
      mob.style.display  = 'flex';
      // Re-render current mobile tab
      if (typeof mobRenderDash === 'function') {
        var tab = window._mobTab || 'dashboard';
        if (tab === 'dashboard') mobRenderDash();
        else if (tab === 'entry') mobRenderEntry();
        else if (tab === 'checklist') mobRenderChecklist();
        else if (tab === 'fx') mobRenderFx();
      }
    } else {
      mob.style.display  = 'none';
      desk.style.display = 'flex';
      // Re-render desktop dashboard
      if (typeof renderDash === 'function') renderDash();
    }
  }
  // Listen for both resize and orientation change
  window.addEventListener('resize', function() {
    clearTimeout(window._layoutTimer);
    window._layoutTimer = setTimeout(_checkLayout, 150);
  });
  window.addEventListener('orientationchange', function() {
    // Give browser time to update dimensions after rotation
    setTimeout(_checkLayout, 300);
  });
})();

// Store mobile app HTML on first load so we can restore after loading screen
(function() {
  // ══════════════════════════════════════════════════════════════
//  QUICK CALCULATOR
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  NAV DROPDOWNS — Reports ▾ and More ▾
// ══════════════════════════════════════════════════════════════
var _reportsMenuOpen = false;
var _moreMenuOpen    = false;
var _reportsActive   = false;
var _moreActive      = false;
var _reportsTabs     = ['monthly','report','finance'];
var _moreTabIds      = ['backup','guide'];

function toggleReportsMenu() { _reportsMenuOpen ? closeReportsMenu() : openReportsMenu(); }
function openReportsMenu() {
  closeMoreMenu();
  var menu = document.getElementById('nav-reports-menu');
  var btn  = document.getElementById('nav-reports-btn');
  if (!menu || !btn) return;
  _reportsMenuOpen = true;
  menu.style.display = 'block';
  btn.style.color = '#c9a84c';
  var rect = btn.getBoundingClientRect();
  menu.style.left = Math.max(0, rect.left) + 'px';
}
function closeReportsMenu() {
  var menu = document.getElementById('nav-reports-menu');
  var btn  = document.getElementById('nav-reports-btn');
  if (!menu || !btn) return;
  _reportsMenuOpen = false;
  menu.style.display = 'none';
  btn.style.color = _reportsActive ? '#c9a84c' : 'rgba(255,255,255,.6)';
  btn.style.borderBottom = _reportsActive ? '2px solid #c9a84c' : '2px solid transparent';
}

function toggleMoreMenu() { _moreMenuOpen ? closeMoreMenu() : openMoreMenu(); }
function openMoreMenu() {
  closeReportsMenu();
  var menu = document.getElementById('nav-more-menu');
  var btn  = document.getElementById('nav-more-btn');
  if (!menu || !btn) return;
  _moreMenuOpen = true;
  menu.style.display = 'block';
  btn.style.color = '#c9a84c';
  var rect = btn.getBoundingClientRect();
  menu.style.left = Math.max(0, rect.left) + 'px';
}
function closeMoreMenu() {
  var menu = document.getElementById('nav-more-menu');
  var btn  = document.getElementById('nav-more-btn');
  if (!menu || !btn) return;
  _moreMenuOpen = false;
  menu.style.display = 'none';
  btn.style.color = _moreActive ? '#c9a84c' : 'rgba(255,255,255,.6)';
  btn.style.borderBottom = _moreActive ? '2px solid #c9a84c' : '2px solid transparent';
}

document.addEventListener('click', function(e) {
  if (_reportsMenuOpen) {
    var w = document.getElementById('nav-reports-wrap');
    if (w && !w.contains(e.target)) closeReportsMenu();
  }
  if (_moreMenuOpen) {
    var w2 = document.getElementById('nav-more-wrap');
    if (w2 && !w2.contains(e.target)) closeMoreMenu();
  }
}, true);

function updateMoreBtnState(name) {
  _reportsActive = _reportsTabs.indexOf(name) !== -1;
  var rBtn = document.getElementById('nav-reports-btn');
  if (rBtn) {
    rBtn.style.color = _reportsActive ? '#c9a84c' : 'rgba(255,255,255,.6)';
    rBtn.style.borderBottom = _reportsActive ? '2px solid #c9a84c' : '2px solid transparent';
  }
  _reportsTabs.forEach(function(t) {
    var item = document.getElementById('nav-' + t);
    if (item) {
      item.style.background = (t === name) ? 'rgba(201,168,76,.12)' : '';
      item.style.color = (t === name) ? '#c9a84c' : 'rgba(255,255,255,.8)';
      item.style.fontWeight = (t === name) ? '800' : '600';
    }
  });

  _moreActive = _moreTabIds.indexOf(name) !== -1;
  var mBtn = document.getElementById('nav-more-btn');
  if (mBtn) {
    mBtn.style.color = _moreActive ? '#c9a84c' : 'rgba(255,255,255,.6)';
    mBtn.style.borderBottom = _moreActive ? '2px solid #c9a84c' : '2px solid transparent';
  }
  _moreTabIds.forEach(function(t) {
    var item = document.getElementById('nav-' + t);
    if (item) {
      item.style.background = (t === name) ? 'rgba(201,168,76,.12)' : '';
      item.style.color = (t === name) ? '#c9a84c' : (t === 'backup' ? '#c9a84c' : 'rgba(255,255,255,.8)');
      item.style.fontWeight = (t === name) ? '800' : '600';
    }
  });
}

function openCalc() {
  var m = document.getElementById('calc-modal');
  if (m) {
    var isOpen = m.style.display === 'flex';
    m.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen) {
      switchCalcTab('calc');
      // Focus keyboard support
      setTimeout(function() { document.getElementById('calc-disp') && calcKeyboardInit(); }, 100);
    }
  }
}
function closeCalc() {
  var m = document.getElementById('calc-modal');
  if (m) m.style.display = 'none';
}

function switchCalcTab(name) {
  ['calc','pct','rev','rev2','gen'].forEach(function(t) {
    var panel = document.getElementById('ctab-' + t + '-panel');
    var btn   = document.getElementById('ctab-' + t);
    if (panel) panel.style.display = t === name ? 'block' : 'none';
    if (btn) {
      btn.style.borderBottomColor = t === name ? '#0d1b2e' : 'transparent';
      btn.style.color  = t === name ? '#0d1b2e' : '#64748b';
      btn.style.fontWeight = t === name ? '700' : '600';
    }
  });
}

function setCalcPct(val) {
  var inp = document.getElementById('c-pct');
  if (inp) { inp.value = val; calcPct(); }
}

function calcPct() {
  var base = parseFloat(document.getElementById('c-base')?.value);
  var pct  = parseFloat(document.getElementById('c-pct')?.value);
  var res  = document.getElementById('c-pct-result');
  var newEl = document.getElementById('c-pct-new');
  var diffEl = document.getElementById('c-pct-diff');
  var checkEl = document.getElementById('c-pct-check');
  if (isNaN(base) || isNaN(pct) || !res) return;

  var newPrice = base * (1 + pct/100);
  var diff = newPrice - base;
  var isUp = pct >= 0;

  res.style.display = 'block';
  newEl.textContent = newPrice.toFixed(4) + ' QR';
  newEl.style.color = isUp ? '#c9a84c' : '#fca5a5';
  diffEl.textContent = (isUp ? '▲ +' : '▼ ') + diff.toFixed(4) + ' QR (' + (isUp?'+':'') + pct + '%)';

  // Show revenue impact per 100 items
  var impact100 = diff * 100;
  checkEl.textContent = 'Impact per 100 items: ' + (isUp?'+':'') + impact100.toFixed(2) + ' QR/day';

  // Verification line
  var verifyPct = base > 0 ? ((newPrice - base)/base*100) : 0;
  checkEl.textContent += ' · Verify: ' + verifyPct.toFixed(4) + '% change applied';
}

function calcTarget() {
  var actual = parseFloat(document.getElementById('c-actual')?.value);
  var target = parseFloat(document.getElementById('c-target')?.value);
  var res    = document.getElementById('c-target-result');
  if (isNaN(actual) || isNaN(target) || target === 0 || !res) return;

  var pct = actual/target*100;
  var gap = target - actual;
  res.style.display = 'block';

  var pctEl = document.getElementById('c-target-pct');
  var gapEl = document.getElementById('c-target-gap');
  var needEl = document.getElementById('c-target-needed');

  pctEl.textContent = pct.toFixed(1) + '%';
  pctEl.style.color = pct >= 100 ? '#86efac' : pct >= 75 ? '#c9a84c' : '#fca5a5';

  if (gap > 0) {
    gapEl.textContent = 'Gap: ' + gap.toFixed(2) + ' QR remaining';
    needEl.textContent = 'Need ' + (gap/10).toFixed(2) + ' QR/day for 10 days to close gap';
  } else {
    gapEl.textContent = '✅ Target exceeded by ' + Math.abs(gap).toFixed(2) + ' QR';
    needEl.textContent = '';
  }
}

function calcReverse() {
  var oldP = parseFloat(document.getElementById('c-old')?.value);
  var newP = parseFloat(document.getElementById('c-new')?.value);
  var res  = document.getElementById('c-rev-result');
  if (isNaN(oldP) || isNaN(newP) || oldP === 0 || !res) return;

  var pct = (newP - oldP)/oldP*100;
  var diff = newP - oldP;
  res.style.display = 'block';

  var pctEl = document.getElementById('c-rev-pct');
  var diffEl = document.getElementById('c-rev-diff');

  pctEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(4) + '%';
  pctEl.style.color = pct >= 0 ? '#c9a84c' : '#fca5a5';
  diffEl.textContent = 'Difference: ' + (diff>=0?'+':'') + diff.toFixed(4) + ' QR';
}

function calcGeneral() {
  var a  = parseFloat(document.getElementById('c-ga')?.value);
  var b  = parseFloat(document.getElementById('c-gb')?.value);
  var op = document.getElementById('c-op')?.value;
  var res = document.getElementById('c-gen-result');
  var lblB = document.getElementById('c-gb-label');
  if (!res) return;

  // Update label B based on operation
  var labels = { pct_of:'VALUE B', pct_val:'% (X)', add_pct:'% (X)', sub_pct:'% (X)', diff:'VALUE B' };
  if (lblB) lblB.textContent = labels[op] || 'VALUE B';

  if (isNaN(a) || isNaN(b)) return;

  var result, desc;
  if (op === 'pct_of')  { result = (a/b*100).toFixed(4) + '%';   desc = a + ' is ' + (a/b*100).toFixed(2) + '% of ' + b; }
  if (op === 'pct_val') { result = (a*b/100).toFixed(4);          desc = b + '% of ' + a + ' = ' + (a*b/100).toFixed(4); }
  if (op === 'add_pct') { result = (a*(1+b/100)).toFixed(4);      desc = a + ' + ' + b + '% = ' + (a*(1+b/100)).toFixed(4); }
  if (op === 'sub_pct') { result = (a*(1-b/100)).toFixed(4);      desc = a + ' − ' + b + '% = ' + (a*(1-b/100)).toFixed(4); }
  if (op === 'diff')    { result = ((b-a)/a*100).toFixed(4) + '%'; desc = 'Change from ' + a + ' to ' + b + ' = ' + ((b-a)/a*100).toFixed(2) + '%'; }

  if (!result) return;
  res.style.display = 'block';
  document.getElementById('c-gen-val').textContent = result;
  document.getElementById('c-gen-desc').textContent = desc;
}

// Close calc when clicking outside
document.addEventListener('click', function(e) {
  var modal = document.getElementById('calc-modal');
  var btn   = e.target.closest('[onclick="openCalc()"]');
  if (!modal || btn) return;
  if (!modal.contains(e.target) && modal.style.display === 'flex') closeCalc();
});

window.addEventListener('DOMContentLoaded', function() {
    var mob = document.getElementById('mob-app');
    if (mob) _MOB_APP_HTML = mob.innerHTML;
  });
})();

function initMobileApp() {
  try {
    if (!isMobile()) return;
    // Hide desktop, show mobile
    var desk = document.getElementById('pg-app');
    var mob = document.getElementById('mob-app');
    if (!desk || !mob) return;
    desk.style.display = 'none';
    mob.style.display = 'flex';
    // Restore HTML if loading screen replaced it
    if (_MOB_APP_HTML && !document.getElementById('mob-tab-dashboard')) {
      mob.innerHTML = _MOB_APP_HTML;
    }
    // Populate year selector
    var ys = document.getElementById('mob-year-sel');
    if (ys) {
      ys.innerHTML = '';
      for (var y=2025;y<=2035;y++) {
        var o=document.createElement('option');
        o.value=y; o.textContent=y;
        if(y===CY) o.selected=true;
        ys.appendChild(o);
      }
    }
    // Populate month selectors
    var curM = new Date().getMonth()+1;
    mobPopulateMonths('mob-dash-month', curM);
    mobPopulateMonths('mob-ent-month', curM);
    mobPopulateMonths('mob-fin-month', curM);
    // Set default dept
    if (DEPT_KEYS && DEPT_KEYS.length > 0) _mobEntDept = DEPT_KEYS[0];
    // Build entry day selector
    mobBuildDays();
    // Render
    try { mobRenderDash(); } catch(e) { console.warn('mobRenderDash error:', e); }
    try { mobRenderEntry(); } catch(e) { console.warn('mobRenderEntry error:', e); }
    // Update live status
    mobUpdateLiveStatus();
  } catch(e) {
    console.error('initMobileApp error:', e);
    // Fallback — show desktop if mobile init fails
    var desk2 = document.getElementById('pg-app');
    var mob2 = document.getElementById('mob-app');
    if (desk2) desk2.style.display = 'flex';
    if (mob2) mob2.style.display = 'none';
  }
}

function mobUpdateLiveStatus() {
  var el = document.getElementById('mob-live-status');
  if (!el) return;
  var fbLabel = document.getElementById('fb-label');
  if (fbLabel && fbLabel.textContent === 'LIVE') { el.textContent = '● LIVE'; el.style.color = '#86efac'; }
  else { el.textContent = '● OFFLINE'; el.style.color = '#fca5a5'; }
}

function mobPopulateMonths(id, selected) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  MONTH_NAMES.forEach(function(mn, i) {
    var o = document.createElement('option');
    o.value = i+1; o.textContent = mn + ' ' + CY;
    if (i+1 === selected) o.selected = true;
    el.appendChild(o);
  });
}

function mobChangeYear(y) {
  CY = parseInt(y);
  PRICES = loadPR(CY);
  _DB[CY] = null;
  attachFbListener(CY);
  mobPopulateMonths('mob-dash-month', parseInt(document.getElementById('mob-dash-month')?.value||1));
  mobPopulateMonths('mob-ent-month', parseInt(document.getElementById('mob-ent-month')?.value||1));
  mobPopulateMonths('mob-fin-month', parseInt(document.getElementById('mob-fin-month')?.value||1));
  mobRenderDash(); mobRenderEntry();
}

function mobShowTab(name) {
  _mobTab = name;
  // Hide more overlay
  var overlay = document.getElementById('mob-more-overlay');
  if (overlay && name !== 'more') overlay.style.display = 'none';

  document.querySelectorAll('.mob-pg').forEach(function(el){ el.style.display = 'none'; });
  var pg = document.getElementById('mob-tab-' + name);
  if (pg) pg.style.display = 'block';

  // Update bottom nav
  ['dashboard','entry','checklist','fx','more'].forEach(function(t) {
    var btn = document.getElementById('mbn-' + t);
    if (!btn) return;
    var isActive = t === name;
    if (isActive) btn.classList.add('active'); else btn.classList.remove('active');
  });

  if (name === 'dashboard')  mobRenderDash();
  if (name === 'entry')      mobRenderEntry();
  if (name === 'checklist')  mobRenderChecklist();
  if (name === 'fx')         mobRenderFx();
  if (name === 'more') {
    var ov = document.getElementById('mob-more-overlay');
    if (ov) ov.style.display = ov.style.display === 'none' ? 'block' : 'none';
    // Don't hide current page
    if (pg) pg.style.display = 'none';
    var cur = document.getElementById('mob-tab-' + (_mobPrevTab || 'dashboard'));
    if (cur) cur.style.display = 'block';
    _mobTab = _mobPrevTab || 'dashboard';
    return;
  }
  _mobPrevTab = name;
}

var _mobPrevTab = 'dashboard';

function mobGoto(tabName) {
  // Switch to desktop tab (for tabs not in mobile layout)
  if (isMobile()) {
    // Show desktop app temporarily for these tabs
    document.getElementById('mob-app').style.display = 'none';
    document.getElementById('pg-app').style.display = 'flex';
    showTab(tabName);
    // Add a back button
    var backBtn = document.getElementById('mob-back-btn');
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.id = 'mob-back-btn';
      backBtn.innerHTML = '← Back to App';
      backBtn.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;padding:10px 24px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3)';
      backBtn.onclick = function() {
        document.getElementById('pg-app').style.display = 'none';
        document.getElementById('mob-app').style.display = 'flex';
        backBtn.remove();
      };
      document.body.appendChild(backBtn);
    }
  }
}


// ── Mobile Checklist Tab ──────────────────────────────────────
function mobRenderChecklist() {
  var wrap = document.getElementById('mob-checklist-wrap');
  var yearEl = document.getElementById('mob-checklist-year');
  if (!wrap) return;
  var curY = new Date().getFullYear();
  if (yearEl) yearEl.textContent = curY;

  var MNS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var keys = ['allDaysEntered','pricesLocked','monthlyPricesSet','financePosted','backupSaved'];
  var curM = new Date().getMonth() + 1;

  wrap.innerHTML = '';
  for (var mi = 1; mi <= 12; mi++) {
    var isFuture = mi > curM;
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border-radius:11px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,.06);cursor:pointer';

    if (isFuture) {
      row.innerHTML = '<div style="font-size:13px;font-weight:700;color:#94a3b8">' + MNS[mi-1] + '</div><div style="font-size:11px;color:#94a3b8">Future</div>';
    } else {
      var status    = getEomStatus(curY, mi);
      var doneCount = keys.filter(function(k){ return status[k].done; }).length;
      var icon = doneCount === keys.length ? '✅' : (doneCount >= 3 ? '⚠️' : '🔴');
      var pct  = Math.round(doneCount / keys.length * 100);
      var isCur = mi === curM;

      row.style.borderLeft = '4px solid ' + (doneCount===keys.length ? '#16a34a' : doneCount>=3 ? '#f59e0b' : '#dc2626');
      row.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<div style="font-size:13px;font-weight:800;color:#0d1b2e">' + MNS[mi-1] + (isCur ? ' ◀' : '') + '</div>' +
          '<span style="font-size:16px">' + icon + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<div style="font-size:12px;font-weight:700;color:#64748b">' + doneCount + '/' + keys.length + '</div>' +
          '<div style="font-size:11px;color:#94a3b8">›</div>' +
        '</div>';

      row.onclick = (function(m){ return function(){ openMonthChecklist(m); }; })(mi);
    }
    wrap.appendChild(row);
  }
}

// ── Mobile FX Tab ─────────────────────────────────────────────
function mobRenderFx() {
  var amtEl = document.getElementById('mob-fx-amount');
  var wrap  = document.getElementById('mob-fx-results');
  if (!wrap) return;
  var qar = amtEl ? (parseFloat(amtEl.value) || 0) : 0;
  if (qar <= 0) {
    wrap.innerHTML = '<div style="text-align:center;color:#94a3b8;font-size:13px;padding:20px">Enter an amount or use a quick button above</div>';
    return;
  }
  if (!_FX_RATES || Object.keys(_FX_RATES).length === 0) {
    _FX_RATES = JSON.parse(JSON.stringify(_FX_DEFAULT));
  }
  wrap.innerHTML = '';
  Object.keys(_FX_RATES).forEach(function(code) {
    var converted = convertFromQAR(qar, code);
    if (converted === null) return;
    var fx  = _FX_RATES[code];
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;border-radius:11px;box-shadow:0 1px 4px rgba(0,0,0,.06)';
    row.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<div style="width:42px;height:34px;background:#0d1b2e;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#c9a84c">' + code + '</div>' +
        '<span style="font-size:12px;color:#64748b">' + fx.name + '</span>' +
      '</div>' +
      '<div style="font-size:17px;font-weight:800;color:#0d1b2e">' + fmtFX(converted, code) + '</div>';
    wrap.appendChild(row);
  });
}

function mobFxSetMonth() {
  var m   = parseInt(document.getElementById('mob-dash-month')?.value || new Date().getMonth()+1);
  var qar = monthTotals(CY, m).qr;
  var inp = document.getElementById('mob-fx-amount');
  if (inp) { inp.value = qar.toFixed(2); mobRenderFx(); }
}

function mobFxSetYear() {
  var total = 0;
  for (var mi = 1; mi <= 12; mi++) total += monthTotals(CY, mi).qr;
  var inp = document.getElementById('mob-fx-amount');
  if (inp) { inp.value = total.toFixed(2); mobRenderFx(); }
}

function mobOpenFxConverter() {
  var m   = parseInt(document.getElementById('mob-dash-month')?.value || new Date().getMonth()+1);
  var qar = monthTotals(CY, m).qr;
  mobShowTab('fx');
  setTimeout(function(){
    var inp = document.getElementById('mob-fx-amount');
    if (inp) { inp.value = qar.toFixed(2); mobRenderFx(); }
  }, 100);
}

// ── Mobile Year Health (compact) ─────────────────────────────

function _mobGoChecklist() { mobShowTab('checklist'); }
function _mobGoEntry()     { mobShowTab('entry'); }

function mobRenderYearHealth() {
  var wrap = document.getElementById('mob-year-health-wrap');
  if (!wrap) return;
  var curY = new Date().getFullYear();
  var curM = new Date().getMonth() + 1;
  var MNS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var keys = ['allDaysEntered','pricesLocked','monthlyPricesSet','financePosted','backupSaved'];

  wrap.innerHTML = '';

  // Header row
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px';
  var title = document.createElement('div');
  title.style.cssText = 'font-size:12px;font-weight:800;color:#0d1b2e';
  title.textContent = String.fromCodePoint(0x1F4CB) + ' ' + curY + ' Month Health';
  var allBtn = document.createElement('button');
  allBtn.textContent = 'All >';
  allBtn.style.cssText = 'padding:4px 10px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#64748b;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer';
  allBtn.onclick = function(){ mobShowTab('checklist'); };
  hdr.appendChild(title);
  hdr.appendChild(allBtn);
  wrap.appendChild(hdr);

  // Grid
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px';

  for (var mi = 1; mi <= Math.min(curM, 8); mi++) {
    var status    = getEomStatus(curY, mi);
    var doneCount = keys.filter(function(k){ return status[k].done; }).length;
    var icon  = doneCount === keys.length ? '\u2705' : (doneCount >= 3 ? '\u26a0\ufe0f' : '\ud83d\udd34');
    var isCur = mi === curM;
    var bg    = doneCount === keys.length ? '#f0fdf4' : (doneCount >= 3 ? '#fffbeb' : '#fef2f2');
    var bdr   = isCur ? '#c9a84c' : (doneCount === keys.length ? '#86efac' : (doneCount >= 3 ? '#fde68a' : '#fca5a5'));

    var card = document.createElement('div');
    card.style.cssText = 'padding:8px 4px;background:' + bg + ';border:1.5px solid ' + bdr + ';border-radius:8px;text-align:center;cursor:pointer';
    card.innerHTML = '<div style="font-size:10px;font-weight:800;color:#0d1b2e">' + MNS[mi-1] + '</div>' +
      '<div style="font-size:14px;margin:2px 0">' + icon + '</div>' +
      '<div style="font-size:9px;color:#64748b">' + doneCount + '/5</div>';
    card.onclick = (function(m){ return function(){ openMonthChecklist(m); }; })(mi);
    grid.appendChild(card);
  }
  wrap.appendChild(grid);
}


function mobRenderDash() {
  try {
  var m = parseInt(document.getElementById('mob-dash-month')?.value || new Date().getMonth()+1);
  mobRenderYearHealth();
  // Update target month label
  var tML = document.getElementById('mob-target-month-label');
  if (tML) tML.textContent = MONTH_NAMES[m-1] + ' ' + CY;
  var tot = monthTotals(CY, m);
  var nd = dim(CY, m);
  var act = 0;
  for (var d=1;d<=nd;d++) { if(dayTotals(CY,m,d).qr>0) act++; }
  var avgQR = act>0 ? tot.qr/act : 0;
  var avgKG = act>0 ? tot.kg/act : 0;

  // Cards
  var cards = document.getElementById('mob-dash-cards');
  if (cards) {
    var cardData = [
      { label:'Monthly Revenue', val:fmtMoney(tot.qr), sub:MONTH_NAMES[m-1], grad:'linear-gradient(135deg,#0369a1,#0284c7)', shadow:'rgba(2,132,199,.25)' },
      { label:'Total KG', val:Math.ceil(tot.kg)+' kg', sub:'All depts', grad:'linear-gradient(135deg,#b45309,#d97706)', shadow:'rgba(217,119,6,.25)' },
      { label:'Avg Daily Rev', val:fmtMoney(avgQR), sub:act+' active days', grad:'linear-gradient(135deg,#15803d,#16a34a)', shadow:'rgba(22,163,74,.25)' },
      { label:'Avg Daily KG', val:Math.ceil(avgKG)+' kg', sub:'Per working day', grad:'linear-gradient(135deg,#334155,#475569)', shadow:'rgba(71,85,105,.25)' }
    ];
    cards.innerHTML = cardData.map(function(c) {
      return '<div style="background:'+c.grad+';border-radius:14px;padding:14px 12px;box-shadow:0 6px 18px '+c.shadow+'">' +
        '<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.65);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase">'+c.label+'</div>' +
        '<div style="font-size:19px;font-weight:900;color:#fff;line-height:1.1">'+c.val+'</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,.55);margin-top:3px">'+c.sub+'</div>' +
      '</div>';
    }).join('');
  }

  // Target bar
  var tgt = loadTarget(CY, m);
  var tgtInp = document.getElementById('mob-dash-target');
  if (tgtInp) tgtInp.value = (tgt && tgt.revenue) ? f2(tgt.revenue) : '';
  var tbar = document.getElementById('mob-target-bar');
  if (tbar) {
    if (tgt && tgt.revenue) {
      var pct = Math.min(100, (tot.qr/tgt.revenue*100));
      var col = pct>=100?'#16a34a':pct>=75?'#d97706':'#dc2626';
      var lbl = pct>=100?'🎉 Target reached!':pct>=75?'⚡ On track':'⚠️ Below target';
      tbar.innerHTML = '<div style="background:#fff;border-radius:12px;padding:12px;box-shadow:0 1px 6px rgba(0,0,0,.06)">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px">' +
          '<div style="font-size:11px;font-weight:700;color:#64748b">Monthly Target</div>' +
          '<div style="font-size:11px;font-weight:800;color:'+col+'">'+lbl+'</div>' +
        '</div>' +
        '<div style="background:#f1f5f9;border-radius:20px;height:8px;overflow:hidden;margin-bottom:5px">' +
          '<div style="background:'+col+';height:100%;width:'+pct+'%;border-radius:20px"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b">' +
          '<span>'+fmtMoney(tot.qr)+'</span><span style="font-weight:800;color:'+col+'">'+pct.toFixed(1)+'%</span><span>'+f2(tgt.revenue)+' QR</span>' +
        '</div></div>';
    } else { tbar.innerHTML = ''; }
  }

  // Notifications
  var notif = document.getElementById('mob-dash-notif');
  if (notif) {
    var today = new Date(); var miss = 0;
    if (CY===today.getFullYear() && m===today.getMonth()+1) {
      for (var dd=1;dd<today.getDate();dd++) { if(dayTotals(CY,m,dd).qr===0) miss++; }
    }
    notif.textContent = miss>0 ? '⚠️' : (tgt&&tgt.revenue&&tot.qr>=tgt.revenue ? '🎉' : '');
    notif.title = miss>0 ? miss+' days missing data' : '';
  }

  // Dept table
  var dtbl = document.getElementById('mob-dept-table');
  if (dtbl) {
    var deptColors = {'Rooms Linen':'#0284c7','F & B':'#16a34a','Spa & Pool':'#0891b2','Uniform':'#7c3aed','Others':'#d97706','Dry Cleaning':'#ea580c'};
    var html = '';
    DEPT_KEYS.forEach(function(dept) {
      var dRev = tot.byDept[dept]?.qr || 0;
      var pct2 = tot.qr>0 ? (dRev/tot.qr*100) : 0;
      var col2 = deptColors[dept] || '#64748b';
      html += '<div style="display:flex;align-items:center;padding:11px 14px;border-bottom:1px solid #f1f5f9">' +
        '<div style="width:32px;height:32px;border-radius:8px;background:'+col2+'22;display:flex;align-items:center;justify-content:center;font-size:15px;margin-right:10px;flex-shrink:0">'+(DEPT_ICONS[dept]||'📦')+'</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:12px;font-weight:700;color:#0d1b2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+dept+'</div>' +
          '<div style="background:#f1f5f9;border-radius:4px;height:4px;margin-top:4px;overflow:hidden">' +
            '<div style="background:'+col2+';height:100%;width:'+Math.min(100,pct2)+'%"></div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;margin-left:10px;flex-shrink:0">' +
          '<div style="font-size:13px;font-weight:800;color:'+col2+'">'+(dRev>0?f2(dRev):'—')+'</div>' +
          '<div style="font-size:10px;color:#94a3b8">'+pct2.toFixed(1)+'%</div>' +
        '</div>' +
      '</div>';
    });
    dtbl.innerHTML = html || '<div style="padding:16px;text-align:center;color:#94a3b8;font-size:13px">No data for this month</div>';
  }
  } catch(e) { console.warn('mobRenderDash error:', e); }
}

function mobSaveTarget() {
  var m = parseInt(document.getElementById('mob-dash-month')?.value || new Date().getMonth()+1);
  var rawVal = String(document.getElementById('mob-dash-target')?.value || '').replace(/,/g,'');
  var val = parseFloat(rawVal) || 0;
  saveTarget(CY, m, {revenue:val});
  // Also sync desktop target
  var dtInp = document.getElementById('dash-target');
  if (dtInp) dtInp.value = val;
  toast('✅ Target saved — '+fmtMoney(val), 'ok');
  mobRenderDash();
}

// ── Mobile Entry ──────────────────────────────────────────────
function mobBuildDays() {
  var m = parseInt(document.getElementById('mob-ent-month')?.value || new Date().getMonth()+1);
  var nd = dim(CY, m);
  var sel = document.getElementById('mob-ent-day');
  if (!sel) return;
  var today = new Date();
  var todayD = (today.getMonth()+1===m && today.getFullYear()===CY) ? today.getDate() : 1;
  sel.innerHTML = '';
  for (var d=1;d<=nd;d++) {
    var o = document.createElement('option');
    o.value = d;
    o.textContent = d + ' — ' + DAY_NAMES[new Date(CY,m-1,d).getDay()];
    if (d===todayD) o.selected = true;
    sel.appendChild(o);
  }
}

function mobOnMonthChange() {
  mobBuildDays(); mobRenderEntry();
}

function mobRenderEntry() {
  var m = parseInt(document.getElementById('mob-ent-month')?.value || new Date().getMonth()+1);
  var day = parseInt(document.getElementById('mob-ent-day')?.value || 1);
  if (!_mobEntDept) _mobEntDept = DEPT_KEYS[0];

  // Dept tabs
  var tabsEl = document.getElementById('mob-dept-tabs');
  if (tabsEl) {
    tabsEl.innerHTML = '';
    DEPT_KEYS.forEach(function(d) {
      var isActive = d === _mobEntDept;
      var btn = document.createElement('div');
      btn.style.cssText = 'padding:7px 12px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;' + (isActive?'background:#0d1b2e;color:#c9a84c;':'background:#f1f5f9;color:#64748b;');
      btn.textContent = (DEPT_ICONS[d]||'') + ' ' + d;
      btn.onclick = (function(dept){ return function(){ mobSetDept(dept); }; })(d);
      tabsEl.appendChild(btn);
    });
  }

  // Header
  var hdr = document.getElementById('mob-ent-dept-label');
  var datelbl = document.getElementById('mob-ent-date-label');
  if (hdr) hdr.textContent = (DEPT_ICONS[_mobEntDept]||'') + ' ' + _mobEntDept;
  if (datelbl) datelbl.textContent = DAY_NAMES[new Date(CY,m-1,day).getDay()] + ' ' + day + ' ' + MONTH_NAMES[m-1] + ' ' + CY;

  // Entry table — active items first, rest collapsed (Option B)
  var tbl = document.getElementById('mob-ent-table');
  var moreWrap = document.getElementById('mob-ent-more-wrap');
  if (tbl && MASTER[_mobEntDept]) {
    var mpr = hasMonthlyPrices(CY, m) ? loadPRM(CY, m) : PRICES;
    var items   = MASTER[_mobEntDept];
    var active  = [];  // items with qty > 0
    var inactive = []; // items with qty = 0
    items.forEach(function(item, i) {
      var v = getVal(CY, m, _mobEntDept, i, day-1);
      if (v > 0) active.push(i); else inactive.push(i);
    });

    // Show active items + first 5 inactive; rest hidden unless expanded
    var showAll  = tbl.dataset.showAll === '1';
    var visible  = active.concat(showAll ? inactive : inactive.slice(0, 5));
    var hasMore  = !showAll && inactive.length > 5;

    tbl.innerHTML = '';
    visible.forEach(function(i) {
      var item = items[i];
      var v    = getVal(CY, m, _mobEntDept, i, day-1);
      var pr   = mpr[_mobEntDept]?.[i]?.[1] ?? MASTER[_mobEntDept][i][1];
      var cost = v > 0 ? (v * pr).toFixed(4) : '';

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;padding:12px 14px;border-bottom:1px solid #f8fafc;' + (v>0?'background:#f0fdf4;':'');

      // Item name + price
      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;margin-right:10px';
      info.innerHTML =
        '<div style="font-size:13px;font-weight:' + (v>0?'700':'600') + ';color:#0d1b2e">' + item[0] + '</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:1px">' + pr.toFixed(4) + ' QR' + (cost?' · ' + cost + ' QR':'') + '</div>';
      row.appendChild(info);

      // − button
      var btnMinus = document.createElement('button');
      btnMinus.textContent = '−';
      btnMinus.style.cssText = 'width:36px;height:36px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;font-size:20px;font-weight:300;cursor:pointer;color:#64748b;flex-shrink:0;display:flex;align-items:center;justify-content:center;line-height:1';
      btnMinus.onclick = (function(idx){ return function(){ mobStepQty(idx, -1, m, day); }; })(i);
      row.appendChild(btnMinus);

      // Input
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.id   = 'mob-qi-' + i;
      inp.value = v || '';
      inp.min   = '0';
      inp.placeholder = '0';
      inp.style.cssText = 'width:56px;padding:8px 4px;border:1.5px solid ' + (v>0?'#86efac':'#e2e8f0') + ';border-radius:9px;font-size:17px;font-weight:800;text-align:center;color:#0d1b2e;background:#fff;outline:none;margin:0 6px;flex-shrink:0';
      inp.addEventListener('input', function(){ mobUpdateStats(m, day); });
      inp.addEventListener('focus', function(){ this.select(); });
      row.appendChild(inp);

      // + button
      var btnPlus = document.createElement('button');
      btnPlus.textContent = '+';
      btnPlus.style.cssText = 'width:36px;height:36px;border-radius:9px;border:none;background:#0d1b2e;font-size:20px;font-weight:700;cursor:pointer;color:#c9a84c;flex-shrink:0;display:flex;align-items:center;justify-content:center;line-height:1';
      btnPlus.onclick = (function(idx){ return function(){ mobStepQty(idx, 1, m, day); }; })(i);
      row.appendChild(btnPlus);

      tbl.appendChild(row);
    });

    if (moreWrap) moreWrap.style.display = hasMore ? 'block' : 'none';
  }

  try { mobUpdateStats(m, day); } catch(e) {}
}


function mobStepQty(i, delta, m, day) {
  var inp = document.getElementById('mob-qi-' + i);
  if (!inp) return;
  var v = Math.max(0, (parseInt(inp.value) || 0) + delta);
  inp.value = v || '';
  inp.style.borderColor = v > 0 ? '#86efac' : '#e2e8f0';
  inp.style.fontWeight  = v > 0 ? '800' : '400';
  // Update row background
  var row = inp.closest('div[style*="border-bottom"]');
  if (row) row.style.background = v > 0 ? '#f0fdf4' : '';
  mobUpdateStats(m, day);
}

function mobShowAllItems() {
  var tbl = document.getElementById('mob-ent-table');
  if (tbl) { tbl.dataset.showAll = '1'; mobRenderEntry(); }
}

function mobSetDept(dept) {
  _mobEntDept = dept;
  mobRenderEntry();
}

function mobUpdateStats(m, day) {
  var dQR=0, dKG=0, depQR=0, depKG=0, depPCS=0;
  DEPT_KEYS.forEach(function(d) {
    MASTER[d].forEach(function(_, i) {
      var v;
      if (d===_mobEntDept) { var inp=document.getElementById('mob-qi-'+i); v=inp?(parseInt(inp.value)||0):getVal(CY,m,d,i,day-1); }
      else { v=getVal(CY,m,d,i,day-1); }
      var pr=PRICES[d]?.[i]?.[1]??MASTER[d][i][1];
      var kg=PRICES[d]?.[i]?.[2]??MASTER[d][i][2];
      dQR+=v*pr; dKG+=v*kg;
      if(d===_mobEntDept){depQR+=v*pr;depKG+=v*kg;depPCS+=v;}
    });
  });
  var statsEl = document.getElementById('mob-ent-stats');
  if (statsEl) {
    var dn = DAY_NAMES[new Date(CY,m-1,day).getDay()];
    statsEl.innerHTML = [
      {label:'Day Total',val:fmtMoney(dQR),sub:'All depts · '+dn+' '+day,col:'#0284c7',bg:'#eff6ff'},
      {label:'Day KG',val:Math.ceil(dKG)+' kg',sub:'All departments',col:'#16a34a',bg:'#f0fdf4'},
      {label:_mobEntDept+' Rev',val:fmtMoney(depQR),sub:Math.ceil(depKG)+' kg',col:'#d97706',bg:'#fffbeb'},
      {label:_mobEntDept+' Pcs',val:depPCS+'',sub:'Total pieces',col:'#7c3aed',bg:'#f5f3ff'}
    ].map(function(c) {
      return '<div style="background:'+c.bg+';border-radius:12px;padding:11px 12px;border-left:3px solid '+c.col+'">' +
        '<div style="font-size:9px;font-weight:800;color:'+c.col+';letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px">'+c.label+'</div>' +
        '<div style="font-size:17px;font-weight:800;color:#0d1b2e">'+c.val+'</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:2px">'+c.sub+'</div>' +
      '</div>';
    }).join('');
  }
}

function mobSaveDay() {
  var m = parseInt(document.getElementById('mob-ent-month')?.value || 1);
  var day = parseInt(document.getElementById('mob-ent-day')?.value || 1);
  // Check price conflict
  var hasDiff = false; var sItem='', sOld=0, sNew=0;
  MASTER[_mobEntDept].forEach(function(_,i) {
    var locked=getLockedPrice(CY,m,_mobEntDept,i,day-1);
    if(locked===null) return;
    var cur=getPriceForDate(_mobEntDept,i,CY,m,day);
    if(Math.abs(locked-cur)>0.0001 && !hasDiff){hasDiff=true;sItem=getN(_mobEntDept,i);sOld=locked;sNew=cur;}
  });
  if (hasDiff) { showPriceConflictWarning(m,day,sItem,sOld,sNew); return; }
  mobSaveDayConfirmed(m, day, true);
}

function mobSaveDayConfirmed(m, day, updatePrices) {
  MASTER[_mobEntDept].forEach(function(_,i) {
    var inp=document.getElementById('mob-qi-'+i);
    if(inp) setVal(CY,m,_mobEntDept,i,day-1,Math.max(0,parseInt(inp.value)||0));
  });
  if (updatePrices) { MASTER[_mobEntDept].forEach(function(_,i){lockPriceAtSave(CY,m,_mobEntDept,i,day-1);}); }
  stampTimestamps(CY,m,_mobEntDept,day);
  commitSave(CY);
  logAudit('SAVE_DAY',_mobEntDept+' · Day '+day+' '+MONTH_NAMES[m-1]+' '+CY+' [mobile]');
  toast('✔ Saved — '+_mobEntDept+' day '+day,'ok');
  mobUpdateStats(m,day);
  setTimeout(autoCloudBackup,2000);
}

function mobCopyDay() {
  var m=parseInt(document.getElementById('mob-ent-month')?.value||1);
  var day=parseInt(document.getElementById('mob-ent-day')?.value||1);
  var values=[];
  MASTER[_mobEntDept].forEach(function(_,i){var inp=document.getElementById('mob-qi-'+i);values.push(inp?parseInt(inp.value)||0:getVal(CY,m,_mobEntDept,i,day-1));});
  _mobDayClip={dept:_mobEntDept,month:m,day:day,values:values};
  var btn=document.getElementById('mob-btn-paste');
  if(btn){btn.style.background='#eff6ff';btn.style.color='#1d4ed8';btn.style.borderColor='#93c5fd';btn.textContent='📌 Paste Ready';}
  toast('📋 Copied '+_mobEntDept+' Day '+day,'ok');
}

function mobPasteDay() {
  if(!_mobDayClip){toast('Nothing copied yet','err');return;}
  var m=parseInt(document.getElementById('mob-ent-month')?.value||1);
  var day=parseInt(document.getElementById('mob-ent-day')?.value||1);
  var dept=_mobDayClip.dept;
  _mobDayClip.values.forEach(function(v,i){
    var inp=document.getElementById('mob-qi-'+i);
    if(inp && MASTER[dept] && MASTER[dept][i]) inp.value=v||'';
  });
  mobUpdateStats(m,day);
  toast('📌 Pasted '+dept+' → Day '+day,'ok');
}

function mobClearDay() {
  if(!confirm('Clear all quantities for '+_mobEntDept+' on this day?')) return;
  var m=parseInt(document.getElementById('mob-ent-month')?.value||1);
  var day=parseInt(document.getElementById('mob-ent-day')?.value||1);
  MASTER[_mobEntDept].forEach(function(_,i){setVal(CY,m,_mobEntDept,i,day-1,0);});
  commitSave(CY);
  mobRenderEntry();
  toast('🗑 Cleared','ok');
}

// ── Mobile Finance ────────────────────────────────────────────
function mobRenderFinance() {
  try {
  var m = parseInt(document.getElementById('mob-fin-month')?.value || new Date().getMonth()+1);
  var nd = dim(CY, m);
  // Carry from prev month
  var prevM=m===1?12:m-1, prevY=m===1?CY-1:CY;
  var prevNd=dim(prevY,prevM);
  var prevCarry=0;
  var prevPR=loadPR(prevY);
  DEPT_KEYS.forEach(function(dept){MASTER[dept].forEach(function(_,i){prevCarry+=getVal(prevY,prevM,dept,i,prevNd-1)*(prevPR[dept]?.[i]?.[1]??MASTER[dept][i][1]);});});
  var daysPosted=0;
  for(var dd=1;dd<=nd-1;dd++){daysPosted+=dayTotals(CY,m,dd).qr;}
  var finTotal=prevCarry+daysPosted;
  var tot=monthTotals(CY,m);
  // Cards
  var cards=document.getElementById('mob-fin-cards');
  if(cards){
    cards.innerHTML=[
      {label:'Finance Posted',val:fmtMoney(finTotal),sub:'Carry + Days 1–'+(nd-1),grad:'linear-gradient(135deg,#0e7490,#0891b2)',shadow:'rgba(8,145,178,.25)'},
      {label:'Monthly Revenue',val:fmtMoney(tot.qr),sub:MONTH_NAMES[m-1]+' received',grad:'linear-gradient(135deg,#15803d,#16a34a)',shadow:'rgba(22,163,74,.25)'},
      {label:'Carry from '+MONTH_NAMES[prevM-1],val:fmtMoney(prevCarry),sub:'Last day carry-in',grad:'linear-gradient(135deg,#6d28d9,#7c3aed)',shadow:'rgba(124,58,237,.25)'},
      {label:'Days Entered',val:String(nd-1),sub:'Days 1–'+(nd-1)+' posted',grad:'linear-gradient(135deg,#334155,#475569)',shadow:'rgba(51,65,85,.25)'}
    ].map(function(c){
      return '<div style="background:'+c.grad+';border-radius:14px;padding:14px 12px;box-shadow:0 6px 18px '+c.shadow+'">' +
        '<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.65);letter-spacing:1px;margin-bottom:4px;text-transform:uppercase">'+c.label+'</div>' +
        '<div style="font-size:18px;font-weight:900;color:#fff;line-height:1.1">'+c.val+'</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,.55);margin-top:2px">'+c.sub+'</div>' +
      '</div>';
    }).join('');
  }
  // Table
  var tbl=document.getElementById('mob-fin-table');
  if(tbl){
    var html='<table style="width:100%;border-collapse:collapse;font-size:12px">' +
      '<thead><tr style="background:#f8fafc">' +
      '<th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;border-bottom:1.5px solid #e2e8f0">DAY</th>' +
      '<th style="padding:8px 10px;text-align:right;color:#64748b;font-size:10px;border-bottom:1.5px solid #e2e8f0">REVENUE</th>' +
      '<th style="padding:8px 10px;text-align:right;color:#64748b;font-size:10px;border-bottom:1.5px solid #e2e8f0">KG</th>' +
      '</tr></thead><tbody>';
    for(var d=1;d<=nd;d++){
      var dt=dayTotals(CY,m,d);
      var bg=d%2===0?'#fff':'#f8fafc';
      var isToday=new Date().getDate()===d&&new Date().getMonth()+1===m&&new Date().getFullYear()===CY;
      html+='<tr style="background:'+(isToday?'#eff6ff':bg)+'">' +
        '<td style="padding:8px 10px;font-weight:700;color:#0d1b2e">'+DAY_NAMES[new Date(CY,m-1,d).getDay()].slice(0,3)+' '+d+(isToday?' •':'')+' </td>' +
        '<td style="padding:8px 10px;text-align:right;color:#15803d;font-weight:600">'+(dt.qr>0?f2(dt.qr):'—')+'</td>' +
        '<td style="padding:8px 10px;text-align:right;color:#b45309">'+(dt.kg>0?Math.ceil(dt.kg):'—')+'</td>' +
      '</tr>';
    }
    html+='<tr style="background:#0d1b2e;color:#c9a84c;font-weight:800">' +
      '<td style="padding:9px 10px">TOTAL</td>' +
      '<td style="padding:9px 10px;text-align:right">'+f2(tot.qr)+'</td>' +
      '<td style="padding:9px 10px;text-align:right">'+Math.ceil(tot.kg)+'</td>' +
    '</tr></tbody></table>';
    tbl.innerHTML=html;
  }
  } catch(e) { console.warn('mobRenderFinance error:', e); }
}

// Hook into doLogin to init mobile
var _origDoLogin = null;

// ══════════════════════════════════════════════════════════════
//  FULL MONTH IMPORT
// ══════════════════════════════════════════════════════════════
var _fmiData = null; // parsed sheet data

function openFullMonthImport() {
  var modal = document.getElementById('fmi-modal');
  if (!modal) return;
  // Populate year
  var yrEl = document.getElementById('fmi-year');
  if (yrEl && yrEl.options.length === 0) buildYearOpts(yrEl, CY);
  // Populate month
  var mEl = document.getElementById('fmi-month');
  if (mEl && mEl.options.length === 0) {
    MONTH_NAMES.forEach(function(mn, i) {
      var o = document.createElement('option');
      o.value = i+1; o.textContent = mn;
      if (i+1 === (parseInt(document.getElementById('ent-month')?.value) || new Date().getMonth()+1)) o.selected = true;
      mEl.appendChild(o);
    });
  }
  // Reset
  _fmiData = null;
  document.getElementById('fmi-preview').style.display = 'none';
  document.getElementById('fmi-apply-btn').style.display = 'none';
  document.getElementById('fmi-filename').textContent = '';
  document.getElementById('fmi-msg').textContent = '';
  var fileEl = document.getElementById('fmi-file');
  if (fileEl) fileEl.value = '';
  modal.classList.remove('hidden');
}

function closeFMI() {
  document.getElementById('fmi-modal')?.classList.add('hidden');
}

function downloadFullMonthTemplate() {
  var y = parseInt(document.getElementById('fmi-year')?.value || CY);
  var m = parseInt(document.getElementById('fmi-month')?.value || 1);
  var nd = dim(y, m);
  var wb = XLSX.utils.book_new();

  DEPT_KEYS.forEach(function(dept) {
    var items = MASTER[dept];
    // Header row: Day | Item1 | Item2 | ...
    var header = ['Day'].concat(items.map(function(it){ return it[0]; }));
    var rows = [header];
    // Data rows: one per day
    for (var d = 1; d <= nd; d++) {
      var row = [d];
      items.forEach(function() { row.push(''); });
      rows.push(row);
    }
    var ws = XLSX.utils.aoa_to_sheet(rows);
    // Style header row width
    var colWidths = [{ wch: 6 }].concat(items.map(function(it){ return { wch: Math.max(12, it[0].length + 2) }; }));
    ws['!cols'] = colWidths;
    // Sheet name = dept name (max 31 chars)
    var sheetName = dept.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, 'Pearl_Full_Month_Template_' + MONTH_NAMES[m-1] + '_' + y + '.xlsx');
}

function previewFMI(input) {
  var file = input.files[0];
  if (!file) return;
  document.getElementById('fmi-filename').textContent = '📄 ' + file.name;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var wb = XLSX.read(e.target.result, { type: 'array' });
      _fmiData = {};
      var summary = [];

      wb.SheetNames.forEach(function(sheetName) {
        // Match sheet name to department
        var matchDept = DEPT_KEYS.find(function(d) {
          return d.toLowerCase().replace(/[^a-z]/g,'') === sheetName.toLowerCase().replace(/[^a-z]/g,'') ||
                 d.toLowerCase().includes(sheetName.toLowerCase()) ||
                 sheetName.toLowerCase().includes(d.toLowerCase().split(' ')[0]);
        });
        if (!matchDept) return;

        var ws = wb.Sheets[sheetName];
        var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (rows.length < 2) return;

        var headerRow = rows[0];
        var deptData = {};
        var entriesFound = 0;

        rows.slice(1).forEach(function(row) {
          var day = parseInt(row[0]);
          if (!day || day < 1 || day > 31) return;
          headerRow.slice(1).forEach(function(itemName, colIdx) {
            if (!itemName) return;
            var val = parseInt(row[colIdx + 1]) || 0;
            if (val > 0) {
              if (!deptData[day]) deptData[day] = {};
              deptData[day][String(itemName).trim()] = val;
              entriesFound++;
            }
          });
        });

        if (entriesFound > 0) {
          _fmiData[matchDept] = deptData;
          summary.push({ dept: matchDept, entries: entriesFound, days: Object.keys(deptData).length });
        }
      });

      // Show preview
      var prevEl = document.getElementById('fmi-preview');
      if (Object.keys(_fmiData).length === 0) {
        prevEl.innerHTML = '<div style="padding:16px;text-align:center;color:#dc2626;font-weight:700">⚠️ No matching departments found. Make sure sheet names match department names.</div>';
        prevEl.style.display = 'block';
        return;
      }

      var html = '<div style="padding:12px 16px;background:#f5f3ff;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:800;color:#6d28d9">📋 IMPORT PREVIEW</div>';
      summary.forEach(function(s) {
        var col = s.entries > 0 ? '#16a34a' : '#94a3b8';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #f1f5f9">' +
          '<div style="font-size:13px;font-weight:700;color:#0d1b2e">' + (DEPT_ICONS[s.dept]||'') + ' ' + s.dept + '</div>' +
          '<div style="font-size:12px;color:' + col + ';font-weight:700">' + s.entries + ' entries across ' + s.days + ' days</div>' +
        '</div>';
      });
      var totalEntries = summary.reduce(function(a,b){ return a+b.entries; }, 0);
      html += '<div style="padding:10px 16px;background:#f0fdf4;font-size:12px;font-weight:800;color:#15803d">✅ Ready to import: ' + Object.keys(_fmiData).length + ' departments · ' + totalEntries + ' total entries</div>';
      prevEl.innerHTML = html;
      prevEl.style.display = 'block';
      document.getElementById('fmi-apply-btn').style.display = 'block';
    } catch(err) {
      document.getElementById('fmi-preview').innerHTML = '<div style="padding:16px;color:#dc2626;font-weight:700">❌ Error reading file: ' + err.message + '</div>';
      document.getElementById('fmi-preview').style.display = 'block';
      console.error('FMI parse error:', err);
    }
  };
  reader.readAsArrayBuffer(file);
}

function applyFMI() {
  if (!_fmiData) return;
  var y = parseInt(document.getElementById('fmi-year')?.value || CY);
  var m = parseInt(document.getElementById('fmi-month')?.value || 1);
  var totalSaved = 0;

  Object.keys(_fmiData).forEach(function(dept) {
    var deptData = _fmiData[dept];
    Object.keys(deptData).forEach(function(dayStr) {
      var day = parseInt(dayStr);
      var dayItems = deptData[dayStr];
      MASTER[dept].forEach(function(item, i) {
        var itemName = item[0].trim();
        if (dayItems[itemName] !== undefined) {
          setVal(y, m, dept, i, day - 1, dayItems[itemName]);
          lockPriceAtSave(y, m, dept, i, day - 1);
          totalSaved++;
        }
      });
      stampTimestamps(y, m, dept, day);
    });
  });

  commitSave(y);
  if (y === CY) {
    try { renderDash(); } catch(e) {}
    try { renderEntry(); } catch(e) {}
  }
  logAudit('IMPORT_FULL_MONTH', MONTH_NAMES[m-1] + ' ' + y + ' — ' + totalSaved + ' entries');
  var msg = document.getElementById('fmi-msg');
  if (msg) msg.textContent = '✅ Imported ' + totalSaved + ' entries for ' + MONTH_NAMES[m-1] + ' ' + y;
  document.getElementById('fmi-apply-btn').style.display = 'none';
  toast('✅ Full month imported — ' + totalSaved + ' entries saved', 'ok');
  setTimeout(autoCloudBackup, 2000);
}

// ══════════════════════════════════════════════════════════════
//  FORECAST ENGINE
// ══════════════════════════════════════════════════════════════

// Get full month revenue — uses locked prices
function getMonthRevenue(y, m) {
  // Check for directly imported P&L data first (100% accurate)
  try {
    var pl = _STORE.getItem(plKey(y, m));
    if (pl !== null) return parseFloat(pl);
  } catch(e) {}
  return monthTotals(y, m).qr;
}

// Get days with data in a month
var _activeDaysCache = {};

function getActiveDays(y, m) {
  var ck = y + '_' + m;
  if (_activeDaysCache[ck] !== undefined) return _activeDaysCache[ck];
  var nd = dim(y, m), count = 0;
  for (var d = 1; d <= nd; d++) { if (dayTotals(y, m, d).qr > 0) count++; }
  _activeDaysCache[ck] = count;
  return count;
}

// Get avg occupancy for a month from benchmark data
function getAvgOccupancy(y, m) {
  var occ = loadBenchOcc(y, m);
  var total = 0, count = 0;
  for (var d = 1; d <= dim(y, m); d++) {
    if (occ[d] > 0) { total += occ[d]; count++; }
  }
  return count > 0 ? total / count : 0;
}

// Get RevPOR for a month
function getRevPOR(y, m) {
  var settings = loadBenchSettings();
  var totalRooms = settings.totalRooms || 0;
  if (!totalRooms) return 0;
  var occ = loadBenchOcc(y, m);
  var nd = dim(y, m);
  var totalRevPOR = 0, porCount = 0;
  for (var d = 1; d <= nd; d++) {
    if (!occ[d]) continue;
    var occRooms = Math.round(totalRooms * occ[d] / 100);
    if (occRooms <= 0) continue;
    var dayRev = dayTotals(y, m, d).qr;
    if (dayRev > 0) { totalRevPOR += dayRev / occRooms; porCount++; }
  }
  return porCount > 0 ? totalRevPOR / porCount : 0;
}

// Calculate YoY growth rate between two years for a month
function getGrowthRate(y1, y2, m) {
  var r1 = getMonthRevenue(y1, m);
  var r2 = getMonthRevenue(y2, m);
  if (r1 <= 0 || r2 <= 0) return null;
  return ((r2 - r1) / r1 * 100);
}

// Forecast confidence level
function getConfidence(activeDays, nd, hasOccData, hasLastYear) {
  var score = 0;
  var ratio = activeDays / nd;
  if (ratio >= 0.7) score += 40;
  else if (ratio >= 0.4) score += 20;
  else score += 10;
  if (hasLastYear) score += 35;
  if (hasOccData) score += 25;
  if (score >= 85) return { label: 'High', col: '#16a34a', bg: '#f0fdf4' };
  if (score >= 60) return { label: 'Medium', col: '#d97706', bg: '#fffbeb' };
  return { label: 'Low', col: '#dc2626', bg: '#fee2e2' };
}

// ══════════════════════════════════════════════════════════════
//  WHAT-IF SIMULATION ENGINE
// ══════════════════════════════════════════════════════════════
var _wiState = { occ:75, growth:5, revPOR:20, totalRooms:161, month:0, baseYear:0 };

function renderWhatIf(baseY, m) {
  var wrap = document.getElementById('forecast-wrap');
  if (!wrap) return;
  var totalRoomsNow = _TOTAL_ROOMS || 161;
  var nd       = dim(baseY+1, m);
  var baseRev  = getMonthRevenue(baseY, m);
  var baseKG   = monthTotals(baseY, m).kg;
  var baseOcc  = getAvgOccupancy(baseY, m) || 70;
  var avgRevPOR = (baseOcc>0 && totalRoomsNow>0 && nd>0)
    ? baseRev / (totalRoomsNow * baseOcc/100 * nd) : 20;

  _wiState = { occ: Math.min(95,Math.round(baseOcc+2)), growth:5, revPOR: parseFloat(avgRevPOR.toFixed(2)), totalRooms: totalRoomsNow, month:m, baseYear:baseY };

  wrap.innerHTML =
    '<div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:16px;padding:22px 24px;margin-bottom:20px">' +
      '<div style="font-size:20px;font-weight:800;color:#c9a84c">🎮 What-If Simulation</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:4px">' + MONTH_NAMES[m-1] + ' ' + (baseY+1) + ' — adjust sliders and results update instantly</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +

    // Controls
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:22px">' +
      '<div style="font-size:13px;font-weight:800;color:#0d1b2e;margin-bottom:16px">🎛️ Adjust Variables</div>' +
      buildSlider('wi-occ',   'wi-occ-val',    '🏨 Occupancy %', 10, 100, 1,   _wiState.occ,      'Historical: '+baseOcc.toFixed(0)+'%',   '#0d1b2e') +
      buildSlider('wi-growth','wi-growth-val', '📈 Growth %',    -20, 50, 1,   _wiState.growth,   '0% = same as last year',                '#16a34a') +
      buildSlider('wi-revpor','wi-revpor-val', '💰 RevPOR (QR)', 5, 200, 0.5, _wiState.revPOR,   'Hist: '+(avgRevPOR>0?avgRevPOR.toFixed(2):'N/A'), '#7c3aed') +
      '<div style="margin-top:14px"><div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px">🏨 Total Rooms</div>' +
      '<input type="number" id="wi-rooms" value="' + totalRoomsNow + '" min="1" max="9999" oninput="wiUpdate()" ' +
        'style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-weight:700;color:#0d1b2e;outline:none;box-sizing:border-box"></div>' +
    '</div>' +

    // Results
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:22px">' +
      '<div style="font-size:13px;font-weight:800;color:#0d1b2e;margin-bottom:16px">📊 Projected — ' + MONTH_NAMES[m-1] + ' ' + (baseY+1) + '</div>' +
      '<div id="wi-results"></div>' +
    '</div>' +
    '</div>' +
    '<div id="wi-recommendations"></div>';

  wiUpdate();
}

function buildSlider(id, valId, label, min, max, step, val, hint, color) {
  return '<div style="margin-bottom:18px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">' +
      '<label style="font-size:11px;font-weight:700;color:#64748b">' + label + '</label>' +
      '<span id="' + valId + '" style="font-size:17px;font-weight:900;color:#0d1b2e">' + val + '</span>' +
    '</div>' +
    '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" oninput="wiUpdate()" style="width:100%;accent-color:' + color + '">' +
    '<div style="font-size:10px;color:#94a3b8;margin-top:2px">' + hint + '</div>' +
  '</div>';
}

function wiUpdate() {
  var occ    = parseFloat(document.getElementById('wi-occ')?.value    || 75);
  var growth = parseFloat(document.getElementById('wi-growth')?.value || 5);
  var revPOR = parseFloat(document.getElementById('wi-revpor')?.value || 20);
  var rooms  = parseInt(document.getElementById('wi-rooms')?.value    || 161);
  var m      = _wiState.month;
  var baseY  = _wiState.baseYear;
  var nd     = dim(baseY+1, m);
  var baseRev = getMonthRevenue(baseY, m);
  var baseKG  = monthTotals(baseY, m).kg;

  // Update labels
  var ov = document.getElementById('wi-occ-val');   if(ov) ov.textContent = occ + '%';
  var gv = document.getElementById('wi-growth-val');if(gv){ gv.textContent = (growth>=0?'+':'')+growth+'%'; gv.style.color = growth>=0?'#16a34a':'#dc2626'; }
  var rv = document.getElementById('wi-revpor-val');if(rv) rv.textContent = parseFloat(revPOR).toFixed(2);

  var occRooms    = Math.round(rooms * occ / 100);
  var occRevFc    = revPOR * occRooms * nd;
  var growthRevFc = baseRev * (1 + growth/100);
  var blendedFc   = baseRev > 0 ? (occRevFc*0.5 + growthRevFc*0.5) : occRevFc;
  var kgFc        = baseKG > 0 ? baseKG * (1+growth/100) * (occ / (getAvgOccupancy(baseY,m)||occ)) : 0;
  var vsBase      = baseRev > 0 ? (blendedFc-baseRev)/baseRev*100 : 0;
  var target      = loadTarget(CY,m)?.revenue || 0;
  var vsTgt       = target > 0 ? blendedFc/target*100 : 0;

  function pc(v){ return v>=0?'#16a34a':'#dc2626'; }
  function pb(v){ return v>=0?'#f0fdf4':'#fee2e2'; }

  var res = document.getElementById('wi-results');
  if (res) res.innerHTML =
    '<div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);border-radius:12px;padding:18px;margin-bottom:12px">' +
      '<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.6);margin-bottom:4px">PROJECTED REVENUE</div>' +
      '<div style="font-size:26px;font-weight:900;color:#fff">' + fmtMoney(blendedFc) + '</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,.55);margin-top:3px">50% growth + 50% occupancy blend</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">' +
      metricCard('Occ-Based', fmtMoney(occRevFc), occRooms+' rooms × '+parseFloat(revPOR).toFixed(2)+' × '+nd+'d', '#f8fafc') +
      metricCard('Growth-Based', fmtMoney(growthRevFc), 'Base '+fmtMoney(baseRev)+' × '+(growth>=0?'+':'')+growth+'%', '#f8fafc') +
      metricCard('vs '+baseY, (vsBase>=0?'↑ +':'↓ ')+vsBase.toFixed(1)+'%', vsBase>=0?'Growth':'Decline', pb(vsBase), pc(vsBase)) +
      (target>0 ? metricCard('vs Target', vsTgt.toFixed(0)+'%', 'of '+fmtMoney(target), pb(vsTgt-100), pc(vsTgt-100)) :
       metricCard('KG Forecast', kgFc>0?kgFc.toFixed(0)+' kg':'—', 'Estimated', '#f8fafc')) +
    '</div>' +
    '<div style="background:#0d1b2e;border-radius:10px;padding:11px 14px;display:flex;gap:14px;flex-wrap:wrap">' +
      miniStat('OCC%', occ+'%') + miniStat('ROOMS', occRooms) + miniStat('TOTAL', rooms) +
      miniStat('REVPOR', parseFloat(revPOR).toFixed(2)+' QR') + miniStat('DAYS', nd) +
    '</div>';

  renderWhatIfRecommendations(blendedFc, baseRev, occ, growth, revPOR, rooms, m, baseY, target);
}

function metricCard(label, val, sub, bg, col) {
  return '<div style="background:'+(bg||'#f8fafc')+';border-radius:10px;padding:11px">' +
    '<div style="font-size:9px;font-weight:700;color:#94a3b8;margin-bottom:3px">' + label + '</div>' +
    '<div style="font-size:14px;font-weight:800;color:'+(col||'#0d1b2e')+'">' + val + '</div>' +
    '<div style="font-size:10px;color:#64748b;margin-top:2px">' + sub + '</div>' +
  '</div>';
}

function miniStat(label, val) {
  return '<div style="text-align:center">' +
    '<div style="font-size:8px;color:rgba(255,255,255,.45)">' + label + '</div>' +
    '<div style="font-size:14px;font-weight:800;color:#c9a84c">' + val + '</div>' +
  '</div>';
}

function renderWhatIfRecommendations(fc, baseRev, occ, growth, revPOR, rooms, m, baseY, target) {
  var el = document.getElementById('wi-recommendations');
  if (!el) return;
  var recs = [];
  var nd = dim(baseY+1, m);
  var gap = target > 0 ? target - fc : 0;

  if (target > 0 && gap > 0) {
    var needRP  = target / (Math.round(rooms*occ/100) * nd);
    var needOcc = Math.min(100, target / (revPOR * nd * rooms) * 100);
    recs.push({ icon:'🎯', title:'Gap to Target: '+fmtMoney(gap), items:[
      'Increase RevPOR to '+needRP.toFixed(2)+' QR/room (current: '+parseFloat(revPOR).toFixed(2)+')',
      'Or increase occupancy to '+needOcc.toFixed(0)+'% (current: '+occ+'%)',
      'Or combine both adjustments'
    ], level:'warning' });
  } else if (target > 0 && fc >= target) {
    recs.push({ icon:'✅', title:'Target achievable', items:['Projected '+fmtMoney(fc)+' ≥ target '+fmtMoney(target)], level:'positive' });
  }

  var histRevPOR = (baseRev > 0 && rooms > 0)
    ? baseRev / (rooms * (getAvgOccupancy(baseY,m)||occ)/100 * dim(baseY,m)) : 0;
  if (histRevPOR > 0) {
    var rpDiff = (revPOR - histRevPOR)/histRevPOR*100;
    if (rpDiff > 20) recs.push({ icon:'⚠️', title:'RevPOR '+rpDiff.toFixed(0)+'% above historical', items:['Historical: '+histRevPOR.toFixed(2)+' QR/room','Validate pricing strategy'], level:'watch' });
    else if (rpDiff < -10) recs.push({ icon:'💡', title:'RevPOR below historical — pricing opportunity', items:['Historical: '+histRevPOR.toFixed(2)+' QR/room','Potential gain: '+fmtMoney((histRevPOR-revPOR)*Math.round(rooms*occ/100)*nd)], level:'info' });
  }

  if (occ > 92) recs.push({ icon:'🏨', title:'Occ >92% — review feasibility', items:['Hotels rarely sustain >92%','88-90% more realistic max'], level:'watch' });
  if (growth > 20) recs.push({ icon:'📊', title:'Growth '+growth+'% is aggressive', items:['Validate with operational capacity'], level:'warning' });
  if (growth < 0)  recs.push({ icon:'📉', title:'Negative growth planned: '+growth+'%', items:['Review cost structure to maintain profitability'], level:'warning' });
  if (!recs.length) recs.push({ icon:'✅', title:'Settings look balanced', items:['All inputs within realistic ranges'], level:'positive' });

  var cfgs = { warning:{bg:'#fee2e2',br:'#fca5a5',col:'#b91c1c'}, watch:{bg:'#fffbeb',br:'#fde68a',col:'#92400e'}, positive:{bg:'#f0fdf4',br:'#86efac',col:'#15803d'}, info:{bg:'#eff6ff',br:'#bfdbfe',col:'#1d4ed8'} };
  var html = '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden">' +
    '<div style="background:#0d1b2e;padding:14px 18px"><div style="font-size:14px;font-weight:800;color:#c9a84c">💡 Recommendations</div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px">Based on current simulation settings</div></div>' +
    '<div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">';
  recs.forEach(function(r){
    var c = cfgs[r.level]||cfgs.info;
    html += '<div style="background:'+c.bg+';border:1px solid '+c.br+';border-radius:10px;padding:12px">' +
      '<div style="font-size:12px;font-weight:800;color:'+c.col+';margin-bottom:6px">'+r.icon+' '+r.title+'</div>' +
      r.items.map(function(it){return '<div style="font-size:11px;color:#475569;padding:2px 0">→ '+it+'</div>';}).join('') +
    '</div>';
  });
  html += '</div></div>';
  el.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
//  RISK INDICATORS — monthly stability analysis
// ══════════════════════════════════════════════════════════════
function renderRiskIndicators(filterMonth) {
  var wrap = document.getElementById('ana-risk-wrap');
  if (!wrap) return;

  var risks = [];
  var months = [];
  // Only show months that have data
  for (var mo = 1; mo <= 12; mo++) {
    var hasDat = false;
    for (var d = 1; d <= dim(CY, mo); d++) {
      if (dayTotals(CY, mo, d).qr > 0) { hasDat = true; break; }
    }
    if (hasDat) months.push(mo);
  }

  if (months.length === 0) {
    wrap.innerHTML = '';
    return;
  }

  months.forEach(function(mo) {
    var nd = dim(CY, mo);
    var dailyRevs = [], actDays = 0, totalRev = 0;
    for (var d = 1; d <= nd; d++) {
      var dt = dayTotals(CY, mo, d);
      dailyRevs.push(dt.qr);
      if (dt.qr > 0) { actDays++; totalRev += dt.qr; }
    }
    if (actDays < 2) return;

    var avgRev  = totalRev / actDays;
    var target  = loadTarget(CY, mo)?.revenue || 0;
    var lyRev   = getMonthRevenue(CY-1, mo);
    var issues  = [], score = 0;

    // Risk 1: High variance
    var diffs = dailyRevs.filter(function(r){return r>0;});
    if (diffs.length > 1) {
      var mean = diffs.reduce(function(a,b){return a+b;},0)/diffs.length;
      var variance = diffs.reduce(function(s,r){return s+Math.pow(r-mean,2);},0)/diffs.length;
      var cv = mean > 0 ? Math.sqrt(variance)/mean : 0;
      if (cv > 0.6)      { score += 3; issues.push('High revenue volatility — daily performance very inconsistent (CV: '+Math.round(cv*100)+'%)'); }
      else if (cv > 0.35){ score += 1; issues.push('Moderate variance in daily revenue'); }
    }

    // Risk 2: Below target
    if (target > 0) {
      var tPct = totalRev / target * 100;
      if (tPct < 60)       { score += 3; issues.push('Significantly below target — only '+tPct.toFixed(0)+'% achieved of '+fmtMoney(target)); }
      else if (tPct < 80)  { score += 2; issues.push('Below target — '+tPct.toFixed(0)+'% of '+fmtMoney(target)); }
      else if (tPct >= 100){ score -= 1; }
    }

    // Risk 3: YoY decline
    if (lyRev > 0 && totalRev > 0) {
      var yoy = (totalRev - lyRev)/lyRev*100;
      if (yoy < -15)      { score += 3; issues.push('Major YoY decline: '+yoy.toFixed(1)+'% vs '+(CY-1)); }
      else if (yoy < -5)  { score += 1; issues.push('YoY decline: '+yoy.toFixed(1)+'% vs '+(CY-1)); }
      else if (yoy > 10)  { score -= 1; }
    }

    // Risk 4: Missing days
    var today = new Date();
    var maxDay = (CY===today.getFullYear() && mo===today.getMonth()+1) ? today.getDate()-1 : nd;
    var missing = 0;
    for (var d2=1;d2<=maxDay;d2++){ if(dailyRevs[d2-1]===0) missing++; }
    if (missing > 5)     { score += 2; issues.push(missing+' days with no data — check for gaps'); }
    else if (missing > 2){ score += 1; issues.push(missing+' missing days'); }

    var level = score<=0?'low':score<=2?'medium':score<=4?'high':'critical';
    risks.push({ month:mo, level:level, score:score, issues:issues, totalRev:totalRev, avgRev:avgRev });
  });

  if (risks.length === 0) { wrap.innerHTML = ''; return; }

  var cfgs = {
    low:      { col:'#16a34a', bg:'#f0fdf4', br:'#86efac', icon:'🟢', lbl:'Low Risk' },
    medium:   { col:'#d97706', bg:'#fffbeb', br:'#fde68a', icon:'🟡', lbl:'Medium Risk' },
    high:     { col:'#dc2626', bg:'#fee2e2', br:'#fca5a5', icon:'🔴', lbl:'High Risk' },
    critical: { col:'#7c3aed', bg:'#f5f3ff', br:'#c4b5fd', icon:'🚨', lbl:'Critical' }
  };

  var html = '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:16px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">' +
      '<div>' +
        '<div style="font-size:15px;font-weight:800;color:#0d1b2e">🔴 Risk Indicators — ' + CY + '</div>' +
        '<div style="font-size:11px;color:#94a3b8;margin-top:2px">Monthly stability analysis · variance, target performance and YoY trends</div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        ['low','medium','high','critical'].map(function(l){
          var c=cfgs[l];
          return '<div style="display:flex;align-items:center;gap:4px"><span>'+c.icon+'</span><span style="font-size:10px;color:#64748b">'+c.lbl+'</span></div>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">';

  risks.forEach(function(r) {
    var cfg = cfgs[r.level];
    html += '<div style="background:'+cfg.bg+';border:1.5px solid '+cfg.br+';border-radius:12px;padding:14px 16px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<div style="font-size:13px;font-weight:800;color:#0d1b2e">'+MONTH_NAMES[r.month-1]+' '+CY+'</div>' +
        '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+cfg.br+';color:'+cfg.col+'">'+cfg.icon+' '+cfg.lbl+'</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#64748b;margin-bottom:8px">'+fmtMoney(r.totalRev)+' total · '+fmtMoney(r.avgRev)+'/day avg</div>' +
      (r.issues.length ?
        '<div style="display:flex;flex-direction:column;gap:4px">'+
          r.issues.map(function(iss){
            return '<div style="font-size:11px;color:'+cfg.col+';padding:4px 8px;background:rgba(255,255,255,.6);border-radius:6px">• '+iss+'</div>';
          }).join('')+
        '</div>'
      : '<div style="font-size:11px;color:'+cfg.col+'">✅ No risk factors detected</div>') +
    '</div>';
  });

  html += '</div></div>';
  wrap.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════
//  PLANNING TAB — Annual Budget, Plan Next Year, What-If
// ════════════════════════════════════════════════════════════════
function renderPlanning() {
  var wrap = document.getElementById('planning-wrap');
  if (!wrap) return;

  var yrEl = document.getElementById('pl-year');
  var view = document.getElementById('pl-view')?.value || 'budget';

  if (yrEl && yrEl.options.length === 0) buildYearOpts(yrEl, CY);
  var y = parseInt(yrEl?.value || CY);
  var prevY = y - 1;

  if (view === 'budget') { renderAnnualBudget(y); return; }
  else if (view === 'plan') { renderPlanNextYear(y); return; }
  else if (view === 'whatif') { wrap.innerHTML = renderWhatIfHTML(y, new Date().getMonth()+1); return; }
}

function renderWhatIfHTML(y, m) {
  // Delegate to existing renderWhatIf
  var wrap = document.getElementById('planning-wrap');
  if (wrap) renderWhatIf(y, m);
}
