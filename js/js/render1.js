function renderDash() {
  // Invalidate caches for current month only when needed
  var _dm = parseInt(document.getElementById('dash-month')?.value || new Date().getMonth()+1);
  // Only clear if data might have changed (not on cached tab re-renders)
  invalidateMonthTotalsCache(CY, _dm);
  // Show/hide end-of-month checklist
  var _eomInfo = shouldShowEomChecklist();
  var _eomContainer = document.getElementById('eom-checklist-container');
  if (_eomContainer) {
    if (_eomInfo.show) {
      _eomContainer.style.display = 'block';
      renderEomChecklist(_eomInfo.y, _eomInfo.m);
    } else {
      _eomContainer.style.display = 'none';
    }
  }
  // Always render year health panel
  renderYearHealth();

  const m = parseInt(document.getElementById('dash-month')?.value || new Date().getMonth() + 1);
  var _range = getDashRange(m);
  var _fromDay = _range.fromDay, _toDay = _range.toDay;
  // Use range totals if date filter is active
  var _rt = rangeTotals(CY, m, _fromDay, _toDay);
  const qr = _rt.qr, kg = _rt.kg, pcs = _rt.pcs;
  let act = _rt.activeDays;
  const nd = dim(CY, m);
  const byDept = (function() {
    var bd = {};
    DEPT_KEYS.forEach(function(d) {
      var dqr=0,dkg=0,dpcs=0;
      MASTER[d].forEach(function(_,i){
        for(var day=_fromDay;day<=_toDay;day++){
          var v=getVal(CY,m,d,i,day-1);
          if(v>0){dqr+=v*(loadPRM(CY,m)[d]?.[i]?.[1]??MASTER[d][i][1]);dkg+=v*(MASTER[d][i][2]||0);dpcs+=v;}
        }
      });
      bd[d]={qr:dqr,kg:dkg,pcs:dpcs};
    });
    return bd;
  })();

  // Finance Posted Total = prev month last day carry + days 1..(nd-1) of this month
  // Read directly from previous year/month actual last-day data
  var prevCarry = 0;
  var prevM2 = m === 1 ? 12 : m - 1;
  var prevY2 = m === 1 ? CY - 1 : CY;
  var prevNd3 = dim(prevY2, prevM2);
  var prevPR2 = loadPR(prevY2);
  DEPT_KEYS.forEach(function(dept) {
    MASTER[dept].forEach(function(_, i) {
      var p2 = prevPR2[dept]?.[i]?.[1] ?? MASTER[dept][i][1];
      prevCarry += getVal(prevY2, prevM2, dept, i, prevNd3 - 1) * p2;
    });
  });
  // Sum days 1 to nd-1 only (exclude last day of month)
  var daysPostedQR = 0;
  var nd2 = dim(CY, m);
  for (var dd = 1; dd <= nd2 - 1; dd++) { daysPostedQR += dayTotals(CY, m, dd).qr; }
  var financeTotal = prevCarry + daysPostedQR;
  var prevMName = MONTH_NAMES[m === 1 ? 11 : m - 2];

  const avgQR = act > 0 ? qr / act : 0, avgKG = act > 0 ? kg / act : 0;
  document.getElementById('dash-stats').innerHTML =
    '<div class="sc blue">' +
      '<div class="sc-lbl">Monthly Revenue</div>' +
      '<div class="sc-val">' + fmtMoney(qr) + '</div>' +
      (function(){
        var tD = loadTarget(CY, m);
        if (!tD || !tD.revenue) return '<div class="sc-sub">' + MONTH_NAMES[m-1] + ' ' + CY + ' received</div>';
        var p = (qr / tD.revenue * 100);
        var c = p >= 100 ? '#16a34a' : p >= 75 ? '#d97706' : '#dc2626';
        var lbl = p >= 100 ? '🎉 ' + (p-100).toFixed(1) + '% above target' : p.toFixed(1) + '% of target';
        return '<div class="sc-sub">' + MONTH_NAMES[m-1] + ' · <span style="color:' + c + ';font-weight:800">' + lbl + '</span></div>';
      })() +
    '</div>' +
    '<div class="sc teal">' +
      '<div class="sc-lbl">Finance Posted Total</div>' +
      '<div class="sc-val">' + fmtMoney(financeTotal) + '</div>' +
      '<div class="sc-sub">Carry ' + f2(prevCarry) + ' + Days 1–' + (nd2-1) + ' (excl. last day)</div>' +
    '</div>' +
    '<div class="sc green"><div class="sc-lbl">Total KG Washed</div><div class="sc-val">' + Math.ceil(kg) + '<span>kg</span></div><div class="sc-sub">All departments</div></div>' +
    (function(){
      // Projection calculation
      var tgtData = loadTarget(CY, m);
      var tgtRev = tgtData && tgtData.revenue ? tgtData.revenue : 0;
      var estClose = avgQR * nd; // avg × total days in month
      var projLine = '';
      if (avgQR > 0) {
        if (tgtRev > 0) {
          var estPct = (estClose / tgtRev * 100);
          if (estPct >= 100) {
            var overBy = estPct - 100;
            projLine = '<div style="font-size:10px;color:#16a34a;font-weight:700;margin-top:3px">📈 Est. ' + fmtMoney(estClose) + ' · 🎉 +' + overBy.toFixed(1) + '% above target</div>';
          } else {
            var col2 = estPct >= 75 ? '#d97706' : '#dc2626';
            projLine = '<div style="font-size:10px;color:' + col2 + ';font-weight:700;margin-top:3px">📊 Est. ' + fmtMoney(estClose) + ' · ' + estPct.toFixed(1) + '% of target</div>';
          }
        } else {
          projLine = '<div style="font-size:10px;color:#94a3b8;margin-top:3px">📊 Est. month close: ' + fmtMoney(estClose) + '</div>';
        }
      }
      return '<div class="sc orange"><div class="sc-lbl">Avg Daily Revenue</div><div class="sc-val">' + fmtMoney(avgQR) + '</div><div class="sc-sub">' + act + ' active days</div>' + projLine + '</div>';
    })() +
    '<div class="sc dark"><div class="sc-lbl">Avg Daily KG</div><div class="sc-val">' + Math.ceil(avgKG) + '<span>kg</span></div><div class="sc-sub">Per working day</div></div>';
  renderCal(m); renderDeptTable(m, qr, byDept); renderDashCharts(m);
  // Update target input and label for this month
  var tgt2 = loadTarget(CY, m);
  var tgtInp2 = document.getElementById('dash-target');
  if (tgtInp2) tgtInp2.value = (tgt2 && tgt2.revenue) ? f2(tgt2.revenue) : '';
  var tgtLbl2 = document.getElementById('dash-target-month-lbl');
  if (tgtLbl2) tgtLbl2.textContent = MONTH_NAMES[m-1] + ' ' + CY;
  // Render target progress bar
  window._lastDashQR = qr;
  renderTargetBar(qr, m);
  renderNotifications(m, qr, nd);
  renderInsightBadge(m);
  renderDashOccQuick(m);
  renderOccStrip(m);
}

function renderCal(m) {
  const nd = dim(CY, m);
  const today = new Date(), td = (today.getMonth() + 1 === m && today.getFullYear() === CY) ? today.getDate() : -1;
  const isPost = (_calMode === 'post');
  const calTitle = MONTH_NAMES[m-1] + ' ' + CY + (isPost ? ' — 📤 Posting View (+1 day shift)' : '');
  document.getElementById('cal-label').textContent = calTitle;
  document.getElementById('dept-lbl').textContent = MONTH_NAMES[m-1] + ' ' + CY;
  const dows = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

  if (isPost) {
    const fd = (new Date(CY, m-1, 1).getDay() + 6) % 7;
    var postMap = {};
    // Prev month last day → posts on day 1
    var prevM = m === 1 ? 12 : m - 1;
    var prevY = m === 1 ? CY - 1 : CY;
    var prevNd2 = dim(prevY, prevM);
    var prevQR = 0, prevKG = 0;
    // Always read from actual previous year/month last day data
    DEPT_KEYS.forEach(function(dep) {
      MASTER[dep].forEach(function(_, i) {
        var v = getVal(prevY, prevM, dep, i, prevNd2 - 1);
        prevQR += v * getP(dep, i); prevKG += v * getK(dep, i);
      });
    });
    postMap[1] = { qr: prevQR, kg: prevKG, isCarry: true, carryLabel: prevNd2 + ' ' + MONTH_NAMES[prevM-1].substring(0,3) + ' carry' };
    // Days 1..nd-1 → post on 2..nd
    for (var d2 = 1; d2 <= nd - 1; d2++) {
      var dt = dayTotals(CY, m, d2);
      var ex = postMap[d2+1] || {qr:0,kg:0};
      postMap[d2+1] = {qr: ex.qr + dt.qr, kg: ex.kg + dt.kg};
    }
    var lastDT = dayTotals(CY, m, nd);
    let h = dows.map((dow, i) => `<div class="cal-dow${i>=5?' wknd':''}">${dow}</div>`).join('');
    for (let i = 0; i < fd; i++) h += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= nd; d++) {
      const dw = new Date(CY, m-1, d).getDay();
      const wk = (dw === 5 || dw === 6);
      const pd = postMap[d];
      const hd = pd && pd.qr > 0;
      const carryBadge = (pd && pd.isCarry) ? `<div style="font-size:9px;color:#0e7490;font-weight:700;margin-bottom:1px">${pd.carryLabel}</div>` : '';
      const overflowNote = (d === nd && lastDT.qr > 0)
        ? `<div style="font-size:9px;color:#6b7a8d;font-style:italic;margin-top:2px">↪ posts ${MONTH_NAMES[m % 12]} 1</div>` : '';
      h += `<div class="cal-day${hd?' has-data':''}${d===td?' today':''}${wk?' wknd-day':''}" style="border-color:${hd?'#d97706':''};" onclick="goToDay(${m},${d})">
        <div class="cdn${wk?' wknd':''}">${DAY_SHORT[dw]}</div>
        <div class="cdnum">${d}</div>
        ${hd ? carryBadge + `<div class="cdv">${fmtMoney(pd.qr)}</div><div class="cdd">${Math.ceil(pd.kg)} kg</div>` : ''}
        ${overflowNote}
      </div>`;
    }
    document.getElementById('cal-grid').innerHTML = h;
  } else {
    const fd = (new Date(CY, m-1, 1).getDay() + 6) % 7;
    let h = dows.map((d, i) => `<div class="cal-dow${i>=5?' wknd':''}">${d}</div>`).join('');
    for (let i = 0; i < fd; i++) h += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= nd; d++) {
      const dw = new Date(CY, m-1, d).getDay();
      const wk = (dw === 5 || dw === 6);
      const {qr, kg} = dayTotals(CY, m, d); const hd = qr > 0;
      h += `<div class="cal-day${hd?' has-data':''}${d===td?' today':''}${wk?' wknd-day':''}" onclick="goToDay(${m},${d})">
        <div class="cdn${wk?' wknd':''}">${DAY_SHORT[dw]}</div>
        <div class="cdnum">${d}</div>
        ${hd ? `<div class="cdv">${fmtMoney(qr)}</div><div class="cdd">${Math.ceil(kg)} kg</div>` : ''}
      </div>`;
    }
    document.getElementById('cal-grid').innerHTML = h;
  }
  if (!_calShowAmounts) document.querySelectorAll('.cdv').forEach(el => el.style.display = 'none');
  if (!_calShowKG) document.querySelectorAll('.cdd').forEach(el => el.style.display = 'none');
}

var _calShowAmounts = true;
var _calShowKG = true;
var _calMode = 'recv';

function setCalMode(mode) {
  _calMode = mode;
  var rb = document.getElementById('cal-toggle-recv');
  var pb = document.getElementById('cal-toggle-post');
  if (rb) { rb.style.fontWeight = mode==='recv'?'800':'600'; rb.style.background = mode==='recv'?'#0284c7':'#e0f2fe'; rb.style.color = mode==='recv'?'#fff':'#0369a1'; }
  if (pb) { pb.style.fontWeight = mode==='post'?'800':'600'; pb.style.background = mode==='post'?'#d97706':'#fff7ed'; pb.style.color = mode==='post'?'#fff':'#92400e'; }
  var m = parseInt(document.getElementById('dash-month')?.value || new Date().getMonth() + 1);
  renderCal(m);
}

function toggleCalAmounts() {
  _calShowAmounts = !_calShowAmounts;
  var btn = document.getElementById('cal-toggle-amt');
  if (btn) btn.textContent = _calShowAmounts ? '💰 Hide Amounts' : '💰 Show Amounts';
  document.querySelectorAll('.cdv').forEach(function(el){ el.style.display = _calShowAmounts ? '' : 'none'; });
}
function toggleCalKG() {
  _calShowKG = !_calShowKG;
  var btn = document.getElementById('cal-toggle-kg');
  if (btn) btn.textContent = _calShowKG ? '⚖️ Hide KG' : '⚖️ Show KG';
  document.querySelectorAll('.cdd').forEach(function(el){ el.style.display = _calShowKG ? '' : 'none'; });
}

function renderDeptTable(m, totalQR, byDept) {
  // Filter out custom depts that haven't started yet for this month
  var visibleDepts = DEPT_KEYS.filter(function(d) {
    return deptVisibleForMonth(d, CY, m);
  });
  document.getElementById('dept-tbody').innerHTML = visibleDepts.map(d => {
    const {qr, kg} = byDept[d] || {qr: 0, kg: 0};
    const pct = totalQR > 0 ? (qr / totalQR * 100) : 0;
    return `<tr onclick="goDept('${d}')" title="Click to view ${d}">
      <td><div class="dept-name">${DEPT_ICONS[d]} ${d}</div></td>
      <td style="color:var(--blue);font-family:'Courier New',Courier,monospace;font-weight:600">${fmtMoney(qr)}</td>
      <td style="color:#16a34a;font-family:'Courier New',Courier,monospace">${Math.ceil(kg)}</td>
      <td><span style="font-size:11.5px;color:var(--grey)">${pct.toFixed(1)}%</span>
        <span class="pct-bar-wrap"><span class="pct-bar" style="width:${Math.min(100,pct)}%"></span></span></td>
    </tr>`;
  }).join('');
}

function goToDay(m, d) {
  if (isMobile()) {
    // Mobile — switch to mobile entry tab and set the day
    var mMonth = document.getElementById('mob-ent-month');
    var mDay   = document.getElementById('mob-ent-day');
    if (mMonth) { mMonth.value = m; mobBuildDays(); }
    setTimeout(function() {
      if (mDay) mDay.value = d;
      mobRenderEntry();
    }, 30);
    mobShowTab('entry');
    // Scroll to top of entry page
    var pages = document.getElementById('mob-pages');
    if (pages) pages.scrollTop = 0;
  } else {
    // Desktop
    document.getElementById('ent-month').value = m; buildDaySel(m);
    setTimeout(() => { document.getElementById('ent-day').value = d; renderEntry(); }, 10);
    showTab('entry');
  }
}
function goDept(d) {
  entDept = d;
  buildTabs('dept-tabs', dep => { entDept = dep; document.getElementById('ent-dept').value = dep; renderEntryTable(); }, d);
  document.getElementById('ent-dept').value = d;
  showTab('entry'); setTimeout(() => renderEntry(), 10);
}

// ════════════════════════════════════════════════════════════════
//  DAILY ENTRY
// ════════════════════════════════════════════════════════════════
function onEntMonthChange() {
  const m = parseInt(document.getElementById('ent-month').value);
  buildDaySel(m); renderEntry();
}
function onEntDeptChange() {
  entDept = document.getElementById('ent-dept').value;
  buildTabs('dept-tabs', d => { entDept = d; document.getElementById('ent-dept').value = d; renderEntryTable(); updateEntStats(parseInt(document.getElementById('ent-month')?.value||1), parseInt(document.getElementById('ent-day')?.value||1)); }, entDept);
  renderEntryTable();
  const m = parseInt(document.getElementById('ent-month')?.value || 1);
  const day = parseInt(document.getElementById('ent-day')?.value || 1);
  updateEntStats(m, day);
}

function renderDailyDeptSummary(m, day) {
  var wrap = document.getElementById('daily-dept-summary');
  if (!wrap) return;

  var _pr  = hasMonthlyPrices(CY, m) ? loadPRM(CY, m) : PRICES;
  var dn   = DAY_NAMES[new Date(CY, m-1, day).getDay()];
  var totQR = 0, totKG = 0, totPCS = 0;

  // Build dept data
  var deptData = DEPT_KEYS.map(function(dept) {
    var dQR = 0, dKG = 0, dPCS = 0;
    MASTER[dept].forEach(function(_, i) {
      // Use live DOM values for active dept, saved for others
      var v;
      if (dept === entDept) {
        var inp = document.getElementById('qi_' + i);
        v = (inp && inp.closest('#entry-wrap')) ? (Math.max(0, parseInt(inp.value) || 0)) : getVal(CY, m, dept, i, day-1);
      } else {
        v = getVal(CY, m, dept, i, day-1);
      }
      var pr = getPriceForCalc(dept, i, CY, m, day);
      var kg = getKgForCalc(dept, i, CY, m, day);
      dQR  += v * pr;
      dKG  += v * kg;
      dPCS += v;
    });
    totQR  += dQR;
    totKG  += dKG;
    totPCS += dPCS;
    return { dept: dept, qr: dQR, kg: dKG, pcs: dPCS };
  });

  // Don't render if no data at all
  if (totQR === 0 && totPCS === 0) {
    wrap.innerHTML = '';
    return;
  }

  wrap.innerHTML = '';
  var card = document.createElement('div');
  card.style.cssText = 'background:#fff;border:1.5px solid #e2e8f0;border-radius:13px;overflow:hidden';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:#0d1b2e;padding:11px 16px;display:flex;align-items:center;justify-content:space-between';
  hdr.innerHTML =
    '<div style="font-size:12px;font-weight:800;color:#c9a84c">📊 ' + dn + ' ' + day + ' ' + MONTH_NAMES[m-1] + ' — All Departments</div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,.5)">' + fmtMoney(totQR) + ' · ' + Math.ceil(totKG) + ' kg</div>';
  card.appendChild(hdr);

  // Dept rows
  var table = document.createElement('div');
  deptData.forEach(function(d, idx) {
    var isActive = d.dept === entDept;
    var pct      = totQR > 0 ? (d.qr / totQR * 100) : 0;
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid #f1f5f9;cursor:pointer;' +
      (isActive ? 'background:#fffbeb;' : (idx%2===0?'background:#fff;':'background:#f8fafc;'));
    row.onclick = (function(dept){ return function(){ mobSetEntDept ? mobSetEntDept(dept) : setEntDept(dept); }; })(d.dept);

    // Icon + name
    var nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'width:160px;min-width:120px;display:flex;align-items:center;gap:6px';
    nameDiv.innerHTML =
      '<span style="font-size:14px">' + (DEPT_ICONS[d.dept]||'📦') + '</span>' +
      '<span style="font-size:12px;font-weight:' + (isActive?'800':'600') + ';color:#0d1b2e">' + d.dept + '</span>' +
      (isActive ? '<span style="font-size:9px;background:#c9a84c;color:#0d1b2e;padding:1px 6px;border-radius:8px;font-weight:700">ACTIVE</span>' : '');
    row.appendChild(nameDiv);

    // Progress bar
    var barWrap = document.createElement('div');
    barWrap.style.cssText = 'flex:1;background:#f1f5f9;border-radius:4px;height:6px;overflow:hidden';
    var fill = document.createElement('div');
    fill.style.cssText = 'background:' + (isActive?'#c9a84c':'#0d1b2e') + ';height:100%;width:' + pct.toFixed(1) + '%;border-radius:4px;transition:width .3s';
    barWrap.appendChild(fill);
    row.appendChild(barWrap);

    // Revenue
    var revDiv = document.createElement('div');
    revDiv.style.cssText = 'width:120px;text-align:right;font-size:13px;font-weight:' + (d.qr>0?'800':'400') + ';color:' + (d.qr>0?'#0d1b2e':'#94a3b8');
    revDiv.textContent = d.qr > 0 ? fmtMoney(d.qr) : '—';
    row.appendChild(revDiv);

    // KG
    var kgDiv = document.createElement('div');
    kgDiv.style.cssText = 'width:80px;text-align:right;font-size:11px;color:#64748b';
    kgDiv.textContent = d.kg > 0 ? Math.ceil(d.kg) + ' kg' : '';
    row.appendChild(kgDiv);

    // Pcs
    var pcsDiv = document.createElement('div');
    pcsDiv.style.cssText = 'width:60px;text-align:right;font-size:11px;color:#94a3b8';
    pcsDiv.textContent = d.pcs > 0 ? d.pcs + ' pcs' : '';
    row.appendChild(pcsDiv);

    table.appendChild(row);
  });

  // Total row
  var totRow = document.createElement('div');
  totRow.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 16px;background:#0d1b2e';
  totRow.innerHTML =
    '<div style="width:160px;min-width:120px;font-size:12px;font-weight:800;color:#c9a84c">TOTAL</div>' +
    '<div style="flex:1"></div>' +
    '<div style="width:120px;text-align:right;font-size:14px;font-weight:900;color:#c9a84c">' + fmtMoney(totQR) + '</div>' +
    '<div style="width:80px;text-align:right;font-size:11px;color:rgba(255,255,255,.6)">' + Math.ceil(totKG) + ' kg</div>' +
    '<div style="width:60px;text-align:right;font-size:11px;color:rgba(255,255,255,.5)">' + totPCS + ' pcs</div>';
  table.appendChild(totRow);

  card.appendChild(table);
  wrap.appendChild(card);
}

// Helper to switch dept from summary panel click
function setEntDept(dept) {
  var sel = document.getElementById('ent-dept');
  if (sel) { sel.value = dept; onEntDeptChange(); }
}


function renderEntry() {
  const m = parseInt(document.getElementById('ent-month')?.value || 1);
  const day = parseInt(document.getElementById('ent-day')?.value || 1);
  entDept = document.getElementById('ent-dept')?.value || DEPT_KEYS[0];
  renderEntryTable();
  updateEntStats(m, day);
  updateEntryPriceStatus(m);
}

function updateEntStats(m, day) {
  let dQR = 0, dKG = 0, depQR = 0, depKG = 0, depPCS = 0;
  const _statPR = hasMonthlyPrices(CY, m) ? loadPRM(CY, m) : PRICES;
  DEPT_KEYS.forEach(d => MASTER[d].forEach((_, i) => {
    // For the active department, read live input values from DOM (not saved cache)
    let v;
    if (d === entDept) {
      const inp = document.getElementById('qi_' + i);
      // Only use DOM input if it exists AND has a value — otherwise use saved data
      v = (inp && inp.closest('#entry-wrap')) ? (Math.max(0, parseInt(inp.value) || 0)) : getVal(CY, m, d, i, day - 1);
    } else {
      v = getVal(CY, m, d, i, day - 1);
    }
    const _ep = getPriceForCalc(d, i, CY, m, day);
    const _ek = getKgForCalc(d, i, CY, m, day);
    dQR += v * _ep; dKG += v * _ek;
    if (d === entDept) { depQR += v * _ep; depKG += v * _ek; depPCS += v; }
  }));
  const dn = DAY_NAMES[new Date(CY, m-1, day).getDay()];
  document.getElementById('ent-stats').innerHTML = `
    <div class="sc blue"><div class="sc-lbl">Day Total</div><div class="sc-val">${fmtMoney(dQR)}</div><div class="sc-sub">All depts — ${dn} ${day}</div></div>
    <div class="sc green"><div class="sc-lbl">Day KG</div><div class="sc-val">${Math.ceil(dKG)}<span>kg</span></div><div class="sc-sub">All departments</div></div>
    <div class="sc orange"><div class="sc-lbl">${DEPT_ICONS[entDept]} ${entDept} Revenue</div><div class="sc-val">${fmtMoney(depQR)}</div><div class="sc-sub">${Math.ceil(depKG)} kg</div></div>
    <div class="sc purple"><div class="sc-lbl">${DEPT_ICONS[entDept]} ${entDept} Pieces</div><div class="sc-val">${depPCS.toLocaleString()}<span>pcs</span></div><div class="sc-sub">Total items counted</div></div>`;
  // Render daily department summary
  renderDailyDeptSummary(m, day);
}

// ════════════════════════════════════════════════════════════════
//  PRICE INTEGRITY SYSTEM
//  Ensures monthly prices always come from Firebase (authoritative)
//  localStorage is only a fast-access cache, never the master
// ════════════════════════════════════════════════════════════════

var _verifiedPrices = {}; // { 'YYYY_MM': prices } — Firebase-verified this session
var _priceVerifyPending = {}; // { 'YYYY_MM': true } — fetch in progress

// Get prices for a month — Firebase is master, localStorage is cache
function getVerifiedPrices(y, m, callback) {
  var key = y + '_' + String(m).padStart(2,'0');
  var localKey = prKeyM(y, m);

  // Already verified this session — use immediately
  if (_verifiedPrices[key]) { callback(_verifiedPrices[key]); return; }

  // Try localStorage first for instant render
  var local = null;
  try {
    var s = JSON.parse(_STORE.getItem(localKey) || 'null');
    if (s && typeof s === 'object' && Object.keys(s).length > 0) local = s;
  } catch(e) {}

  // If we have local, render immediately AND verify in background
  if (local) { callback(local); }

  // Always fetch from Firebase to verify (unless already fetching)
  if (_priceVerifyPending[key]) return;
  _priceVerifyPending[key] = true;

  if (!window._fbLoadKey) {
    if (local) { _verifiedPrices[key] = local; }
    _priceVerifyPending[key] = false;
    if (!local) callback(loadPR(y));
    return;
  }

  window._fbLoadKey(fbPricePathM(y, m)).then(function(fbPrices) {
    _priceVerifyPending[key] = false;
    if (fbPrices && typeof fbPrices === 'object' && Object.keys(fbPrices).length > 0) {
      // Firebase has prices — this is the master copy
      try { _STORE.setItem(localKey, JSON.stringify(fbPrices)); } catch(e) {}
      _verifiedPrices[key] = fbPrices;
      // If prices differ from what we showed, re-render silently
      if (!local || JSON.stringify(local) !== JSON.stringify(fbPrices)) {
        var entM = parseInt(document.getElementById('ent-month')?.value || 0);
        if (entM === m) {
          setTimeout(function() {
            if (typeof renderEntryTable === 'function') renderEntryTable();
            if (typeof updateEntStats === 'function') {
              var day = parseInt(document.getElementById('ent-day')?.value || 1);
              updateEntStats(m, day);
            }
          }, 200);
        }
        // Update dashboard target bar too
        var dashM = parseInt(document.getElementById('dash-month')?.value || 0);
        if (dashM === m && typeof renderDash === 'function') {
          setTimeout(renderDash, 300);
        }
      }
    } else {
      // Firebase has no monthly prices — use local if available
      if (local) { _verifiedPrices[key] = local; }
      else {
        // No prices anywhere — use year prices and warn
        _verifiedPrices[key] = null;
        showPriceWarningBanner(m);
      }
    }
  }).catch(function() {
    _priceVerifyPending[key] = false;
    if (local) _verifiedPrices[key] = local;
  });
}

// Show a persistent warning banner if prices can't be verified
function showPriceWarningBanner(m) {
  if (document.getElementById('_price-warn-banner')) return;
  var banner = document.createElement('div');
  banner.id = '_price-warn-banner';
  banner.style.cssText = 'position:fixed;top:54px;left:0;right:0;z-index:8000;background:#dc2626;color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.3)';
  banner.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="font-size:18px">⚠️</span>' +
      '<span>Monthly prices for ' + MONTH_NAMES[m-1] + ' could not be verified — showing base year prices. Go to <strong>Prices → Monthly Price Manager</strong> and re-apply.</span>' +
    '</div>' +
    '<button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-weight:700">✕</button>';
  document.body.appendChild(banner);
}

// Invalidate price cache for a month (call after applying new prices)
function invalidatePriceCache(y, m) {
  var key = y + '_' + String(m).padStart(2,'0');
  delete _verifiedPrices[key];
  delete _priceVerifyPending[key];
  // Also clear fast-access caches
  clearPRMCache(y, m);
  delete _hasMonthlyCache[y + '_' + m];
}

// Boot: pre-load prices for current month into verified cache
// Storage key for imported P&L monthly totals
function plKey(y, m) { return 'pearl_pl_' + y + '_' + m; }

// Load imported P&L monthly totals from Firebase on boot
function loadPLImportFromFB(y) {
  if (!window._fbLoadKey) return;
  window._fbLoadKey('pearl/pl_import/' + y).then(function(fb) {
    if (!fb) return;
    for (var m = 1; m <= 12; m++) {
      if (fb['pl_' + m]) {
        try { _STORE.setItem(plKey(y, m), String(fb['pl_' + m])); } catch(e) {}
      }
    }
    invalidateMonthTotalsCache();
  }).catch(function(){});
}

function preloadCurrentMonthPrices() {
  var today = new Date();
  var cm = today.getMonth() + 1;
  var pm = cm === 1 ? 12 : cm - 1;
  var py = cm === 1 ? CY - 1 : CY;
  getVerifiedPrices(CY, cm, function(){});
  getVerifiedPrices(py, pm, function(){});
  // Sync targets for current year
  if (typeof syncTargetsFromFB === 'function') syncTargetsFromFB(CY);
  // Sync EOM checklist for current + last 3 months so Year Health is accurate
  (function() {
    for (var i = 0; i < 4; i++) {
      var mo = cm - i;
      var yr = CY;
      if (mo <= 0) { mo += 12; yr--; }
      loadEomChecklist(yr, mo); // triggers Firebase sync in background
    }
  })();
  // Sync backup index for accurate backup status
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/backup/index').then(function(fbIdx) {
      if (fbIdx && Array.isArray(fbIdx) && fbIdx.length > 0) {
        try { _STORE.setItem('pearl_backup_index', JSON.stringify(fbIdx)); } catch(e) {}
      }
    }).catch(function(){});
  }
}


// Force sync prices from Firebase and re-render entry table
function forcePriceSync() {
  var m = parseInt(document.getElementById('ent-month')?.value || new Date().getMonth()+1);
  var statusEl = document.getElementById('entry-price-status-text');
  if (statusEl) statusEl.textContent = '🔄 Syncing from Firebase...';

  // Clear cache for this month
  if (typeof invalidatePriceCache === 'function') invalidatePriceCache(CY, m);

  // Force reload from Firebase
  if (!window._fbLoadKey) {
    toast('⚠️ No Firebase connection', 'err');
    return;
  }

  window._fbLoadKey(fbPricePathM(CY, m)).then(function(fbPrices) {
    if (fbPrices && typeof fbPrices === 'object' && Object.keys(fbPrices).length > 0) {
      try { _STORE.setItem(prKeyM(CY, m), JSON.stringify(fbPrices)); } catch(e) {}
      _verifiedPrices[CY + '_' + String(m).padStart(2,'0')] = fbPrices;
      renderEntryTable();
      updateEntryPriceStatus(m);
      toast('✅ Prices synced from Firebase — ' + MONTH_NAMES[m-1] + ' prices now active', 'ok');
    } else {
      toast('⚠️ No monthly prices in Firebase for ' + MONTH_NAMES[m-1] + ' — go to Prices tab to apply them', 'warn');
      if (statusEl) statusEl.textContent = '⚠️ No monthly prices set for ' + MONTH_NAMES[m-1];
    }
  }).catch(function(e) {
    toast('❌ Firebase sync failed: ' + e.message, 'err');
  });
}

// Update price status banner in entry tab
function updateEntryPriceStatus(m) {
  var banner = document.getElementById('entry-price-status');
  var textEl = document.getElementById('entry-price-status-text');
  if (!banner || !textEl) return;
  var key      = CY + '_' + String(m).padStart(2,'0');
  var verified = _verifiedPrices[key];

  if (!hasMonthlyPrices(CY, m) && !verified) {
    // No monthly prices at all — show warning
    banner.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 16px;background:#fef2f2;border-bottom:1.5px solid #fca5a5;font-size:11px;font-weight:700;color:#dc2626';
    textEl.textContent = '⚠️ ' + MONTH_NAMES[m-1] + ' prices not set — showing base year prices. Click Sync Now or go to Prices tab.';
  } else if (verified) {
    // Verified — show green briefly then hide
    banner.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 16px;background:#f0fdf4;border-bottom:1.5px solid #86efac;font-size:11px;font-weight:700;color:#15803d';
    textEl.textContent = '✅ ' + MONTH_NAMES[m-1] + ' prices verified';
    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(function(){ banner.style.display='none'; }, 3000);
  } else {
    // Hide — have local prices, verification happens in background silently
    banner.style.display = 'none';
  }
}


function renderEntryTable() {
  const m = parseInt(document.getElementById('ent-month')?.value || 1);
  const day = parseInt(document.getElementById('ent-day')?.value || 1);
  entDept = document.getElementById('ent-dept')?.value || DEPT_KEYS[0];
  document.querySelectorAll('#dept-tabs .dtab').forEach(t => t.classList.toggle('on', t.textContent.trim().includes(entDept)));
  const items = MASTER[entDept];
  const dateStr = `${DAY_NAMES[new Date(CY,m-1,day).getDay()]} ${day} ${MONTH_NAMES[m-1]} ${CY}`;
  let rows = '';
  // Get prices — monthly version if available, year prices as fallback
  var _entPR = hasMonthlyPrices(CY, m) ? loadPRM(CY, m) : PRICES;
  items.forEach((_, i) => {
    // Skip items not yet active for this date
    if (!itemVisibleForDate(entDept, i, CY, m, day)) return;
    const nm = getN(entDept, i);
    const pr = _entPR[entDept]?.[i]?.[1] ?? MASTER[entDept][i][1];
    const kg = _entPR[entDept]?.[i]?.[2] ?? MASTER[entDept][i][2];
    const v = getVal(CY, m, entDept, i, day - 1);
    const cost = v > 0 ? (v * pr).toFixed(4) : '';
    const weight = v > 0 ? (v * kg).toFixed(3) : '';
    rows += `<tr class="${v>0?'hq':''}">
      <td>${i+1}</td><td>${nm}</td>
      <td class="ptd">${pr.toFixed(4)}</td>
      <td class="ktd">${kg.toFixed(3)}</td>
      <td style="text-align:center"><input type="number" min="0" class="qi" id="qi_${i}" value="${v}"
        oninput="onQI(${i},${m},${day})"></td>
      <td class="ctd" id="ct_${i}">${cost}</td>
      <td class="ktd" id="kt_${i}">${weight}</td>
    </tr>`;
  });
  document.getElementById('entry-wrap').innerHTML = `
    <div class="entry-card">
      <div class="ech"><div class="ech-left"><span style="font-size:18px">${DEPT_ICONS[entDept]}</span>
        <span class="ech-title">${entDept}</span></div>
        <div class="ech-date">${dateStr}</div></div>
      ${CY === 2025 ? '<div style="padding:10px 16px;background:#fffbeb;border-bottom:1.5px solid #f59e0b;font-size:12.5px;color:#92400e;font-weight:600">📥 2025 — December only. Enter Dec 31 quantities here. This data will carry into January 2026 Finance Posting automatically.</div>' : ''}
      <div class="tscroll"><table class="et">
        <thead><tr><th>#</th><th style="text-align:left;min-width:200px">Item</th>
          <th>Price (QR)</th><th>Weight (KG)</th><th class="qh">QTY</th>
          <th>Cost (QR)</th><th>KG</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function onQI(i, m, day) {
  const inp = document.getElementById('qi_' + i);
  const v = Math.max(0, parseInt(inp.value) || 0); inp.value = v;
  const _mqPR = hasMonthlyPrices(CY, m) ? loadPRM(CY, m) : PRICES;
  const pr = _mqPR[entDept]?.[i]?.[1] ?? MASTER[entDept][i][1];
  const kg = _mqPR[entDept]?.[i]?.[2] ?? MASTER[entDept][i][2];
  const ct = document.getElementById('ct_' + i); if (ct) ct.textContent = v > 0 ? (v * pr).toFixed(4) : '';
  const kt = document.getElementById('kt_' + i); if (kt) kt.textContent = v > 0 ? (v * kg).toFixed(3) : '';
  inp.closest('tr')?.classList.toggle('hq', v > 0);
  updateEntStats(m, day);
}

// ── Dec 31 carry storage ──────────────────────────────
var DEC31_KEY = 'pearl_dec31_carry_' + new Date().getFullYear();
function loadDec31Carry() {
  try { return JSON.parse(_STORE.getItem(DEC31_KEY) || '{}'); } catch(e) { return {}; }
}
function saveDec31Carry(data) {
  try { _STORE.setItem(DEC31_KEY, JSON.stringify(data)); } catch(e) {}
}

// FIX: saveDay now writes all inputs to cache then commits once to localStorage
function saveDay() {
  const m = parseInt(document.getElementById('ent-month').value);
  const day = parseInt(document.getElementById('ent-day').value);

  // Check if any item already has a locked price that differs from current price
  var hasPriceDiff = false;
  var sampleItem = '', sampleOld = 0, sampleNew = 0;
  MASTER[entDept].forEach(function(_, i) {
    var locked = getLockedPrice(CY, m, entDept, i, day - 1);
    if (locked === null) return; // not yet locked — no conflict
    var current = getPriceForDate(entDept, i, CY, m, day);
    if (Math.abs(locked - current) > 0.0001) {
      hasPriceDiff = true;
      if (!sampleItem) { sampleItem = getN(entDept, i); sampleOld = locked; sampleNew = current; }
    }
  });

  if (hasPriceDiff) {
    // Show warning modal
    showPriceConflictWarning(m, day, sampleItem, sampleOld, sampleNew);
    return;
  }

  // No conflict — save normally
  saveDayConfirmed(m, day, true);
}

function closePCModal() {
  var el = document.getElementById('price-conflict-modal');
  if (el) el.remove();
}

function showPriceConflictWarning(m, day, sampleItem, sampleOld, sampleNew) {
  var existing = document.getElementById('price-conflict-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'price-conflict-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:16px;padding:28px 28px 24px;max-width:460px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
        '<div style="width:40px;height:40px;background:#fef3c7;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">⚠️</div>' +
        '<div>' +
          '<div style="font-size:15px;font-weight:800;color:#0d1b2e">Price Change Detected</div>' +
          '<div style="font-size:12px;color:#64748b;margin-top:2px">' + entDept + ' · ' + DAY_NAMES[new Date(CY,m-1,day).getDay()] + ' ' + day + ' ' + MONTH_NAMES[m-1] + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:18px;font-size:12.5px;color:#92400e">' +
        'This day was previously saved with <strong>' + sampleItem + '</strong> at <strong>' + sampleOld.toFixed(4) + ' QR</strong>.<br>' +
        'Current price is <strong>' + sampleNew.toFixed(4) + ' QR</strong>.<br><br>' +
        'What would you like to do?' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<button onclick="saveDayConfirmed(' + m + ',' + day + ',false);closePCModal()" ' +
          'style="padding:12px 20px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;text-align:left">' +
          '🔒 Keep Old Prices — save quantities, keep ' + sampleOld.toFixed(4) + ' QR locked' +
        '</button>' +
        '<button onclick="saveDayConfirmed(' + m + ',' + day + ',true);closePCModal()" ' +
          'style="padding:12px 20px;background:#dc2626;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;text-align:left">' +
          '🔄 Update Prices — save quantities with new ' + sampleNew.toFixed(4) + ' QR' +
        '</button>' +
        '<button onclick="closePCModal()" ' +
          'style="padding:10px 20px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">' +
          'Cancel — do not save' +
        '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
}

function saveDayConfirmed(m, day, updatePrices) {
  MASTER[entDept].forEach(function(_, i) {
    var inp = document.getElementById('qi_' + i);
    if (inp) setVal(CY, m, entDept, i, day - 1, Math.max(0, parseInt(inp.value) || 0));
  });
  if (updatePrices) {
    // Lock new prices
    MASTER[entDept].forEach(function(_, i) { lockPriceAtSave(CY, m, entDept, i, day - 1); });
  } else {
    // Keep old locked prices — only update timestamps
    // Don't call lockPriceAtSave — existing -p and -k keys stay untouched
  }
  stampTimestamps(CY, m, entDept, day);
  commitSave(CY);
  logAudit('SAVE_DAY', entDept + ' · Day ' + day + ' ' + MONTH_NAMES[m-1] + ' ' + CY + (updatePrices ? '' : ' · prices kept'));
  invalidateTabCache('dashboard');
  toast('✔ Saved — ' + entDept + ' day ' + day + ' ' + MONTH_NAMES[m-1] + (updatePrices ? '' : ' · old prices kept'), 'ok');
  setTimeout(autoCloudBackup, 2000);
}

// ════════════════════════════════════════════════════════════════
//  COPY / PASTE DAY — clipboard for department quantities
// ════════════════════════════════════════════════════════════════
var _dayClipboard = null; // { dept, month, day, values: [] }

function copyDay() {
  var m   = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('ent-day').value);
  var values = [];
  // Read from live inputs first (unsaved changes included)
  MASTER[entDept].forEach(function(_, i) {
    var inp = document.getElementById('qi_' + i);
    values.push(inp ? (parseInt(inp.value) || 0) : getVal(CY, m, entDept, i, day - 1));
  });
  var total = values.reduce(function(a,b){ return a+b; }, 0);
  _dayClipboard = { dept: entDept, month: m, day: day, year: CY, values: values };
  // Enable paste button
  var pb = document.getElementById('btn-paste-day');
  if (pb) { pb.classList.add('active'); pb.removeAttribute('style'); }
  // Show X clear button
  var xb = document.getElementById('btn-clear-clipboard');
  if (xb) xb.style.display = 'flex';
  // Show badge
  var badge = document.getElementById('copy-day-badge');
  var badgeText = document.getElementById('copy-day-badge-text');
  if (badge && badgeText) {
    badgeText.textContent = 'Clipboard: ' + entDept + ' · ' + DAY_NAMES[new Date(CY,m-1,day).getDay()] + ' ' + day + ' ' + MONTH_NAMES[m-1] + ' · ' + values.length + ' items · ' + total + ' pcs — ready to paste';
    badge.style.display = 'flex';
  }
  toast('📋 Copied — ' + entDept + ' day ' + day + ' (' + total + ' pcs)', 'ok');
}

function pasteDay() {
  if (!_dayClipboard) { toast('Nothing copied yet — click Copy Day first', 'err'); return; }
  var m   = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('ent-day').value);
  var items = MASTER[entDept];
  var pasted = 0;
  items.forEach(function(_, i) {
    var inp = document.getElementById('qi_' + i);
    if (!inp) return;
    var val = i < _dayClipboard.values.length ? _dayClipboard.values[i] : 0;
    inp.value = val;
    // Trigger live update (cost/kg columns)
    inp.dispatchEvent(new Event('input'));
    pasted++;
  });
  updateEntStats(m, day);
  var fromLabel = _dayClipboard.dept + ' · ' + _dayClipboard.day + ' ' + MONTH_NAMES[_dayClipboard.month-1];
  toast('📌 Pasted ' + pasted + ' items from ' + fromLabel + ' — click 💾 Save Day to confirm', 'ok');
}

function clearDayClipboard() {
  _dayClipboard = null;
  var pb = document.getElementById('btn-paste-day');
  if (pb) { pb.classList.remove('active'); pb.removeAttribute('style'); }
  var xb = document.getElementById('btn-clear-clipboard');
  if (xb) xb.style.display = 'none';
  var badge = document.getElementById('copy-day-badge');
  if (badge) badge.style.display = 'none';
}

// ════════════════════════════════════════════════════════════════
//  RECEIVING LOG — multiple batches per day/department
// ════════════════════════════════════════════════════════════════
var _recvLog = {}; // key: "YYYY_M_D_dept" → [{qty:[...]}, ...]
var _recvLogKey = 'pearl_recv_log';

function _rlKey(m, d, dept) { return CY + '_' + m + '_' + d + '_' + dept; }

function loadRecvLog() {
  try { return JSON.parse(_STORE.getItem(_recvLogKey) || '{}'); } catch(e) { return {}; }
}
function saveRecvLog() {
  try { _STORE.setItem(_recvLogKey, JSON.stringify(_recvLog)); } catch(e) {}
}

function openRecvLog() {
  _recvLog = loadRecvLog();
  var drawer = document.getElementById('recv-drawer');
  var overlay = document.getElementById('recv-overlay');
  drawer.style.display = 'flex';
  overlay.style.display = 'block';
  // Sync selectors to current entry context
  var m = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('ent-day').value) || 1;
  var dept = entDept;
  // Build day selector
  var dayEl = document.getElementById('recv-day');
  var nd = dim(CY, m);
  dayEl.innerHTML = Array.from({length: nd}, function(_, i) {
    var d = i + 1, dn = DAY_SHORT[new Date(CY, m-1, d).getDay()];
    return '<option value="' + d + '"' + (d === day ? ' selected' : '') + '>' + d + ' — ' + dn + '</option>';
  }).join('');
  // Build dept selector
  var deptEl = document.getElementById('recv-dept');
  deptEl.innerHTML = DEPT_KEYS.map(function(dk) {
    return '<option value="' + dk + '"' + (dk === dept ? ' selected' : '') + '>' + DEPT_ICONS[dk] + ' ' + dk + '</option>';
  }).join('');
  renderRecvDrawer();
}

function closeRecvLog() {
  document.getElementById('recv-drawer').style.display = 'none';
  document.getElementById('recv-overlay').style.display = 'none';
}

function onRecvContextChange() { renderRecvDrawer(); }

function renderRecvDrawer() {
  var m = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('recv-day').value);
  var dept = document.getElementById('recv-dept').value;
  var key = _rlKey(m, day, dept);
  var batches = _recvLog[key] || [];

  // Update subtitle
  document.getElementById('recv-drawer-sub').textContent =
    MONTH_NAMES[m-1] + ' ' + CY + ' · Day ' + day + ' · ' + dept + ' · ' + batches.length + ' batch' + (batches.length !== 1 ? 'es' : '');

  // Update toolbar badge
  updateRecvBadge(m, day, dept);

  var items = MASTER[dept];
  var list = document.getElementById('recv-batch-list');

  if (batches.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#94a3b8"><div style="font-size:36px;margin-bottom:12px">📦</div><div style="font-size:13px;font-weight:600">No batches yet</div><div style="font-size:12px;margin-top:4px">Click + Add Batch to log your first delivery</div></div>';
    return;
  }

  list.innerHTML = batches.map(function(batch, bi) {
    var batchTotal = batch.qty.reduce(function(a, b) { return a + b; }, 0);
    var rows = items.map(function(_, ii) {
      var v = batch.qty[ii] || 0;
      return '<tr style="' + (v > 0 ? 'background:#f0f9ff;' : '') + '">' +
        '<td style="padding:6px 8px;font-size:12.5px;color:#1a2332;font-weight:' + (v > 0 ? '600' : '400') + '">' + getN(dept, ii) + '</td>' +
        '<td style="padding:6px 8px;text-align:center"><input type="number" min="0" value="' + v + '" ' +
          'style="width:64px;padding:4px 6px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-weight:600;text-align:center;color:#1a2332" ' +
          'oninput="onRecvInput(' + bi + ',' + ii + ',this.value)" ' +
          'onfocus="this.style.borderColor=\'#0284c7\'" onblur="this.style.borderColor=\'#e2e8f0\'"></td>' +
      '</tr>';
    }).join('');

    return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden">' +
      '<div style="background:#f8fafc;padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #e2e8f0">' +
        '<span style="font-size:13px;font-weight:800;color:#0369a1;background:#e0f2fe;padding:3px 10px;border-radius:99px">Batch ' + (bi + 1) + '</span>' +
        '<span style="font-size:12px;color:#64748b;font-weight:600">' + batchTotal + ' pcs total</span>' +
        '<div style="margin-left:auto;display:flex;gap:6px">' +
          '<button onclick="copyRecvBatch(' + bi + ')" title="Copy this batch" style="padding:4px 10px;border:1.5px solid var(--gold3);border-radius:6px;background:#fef9ee;color:#b45309;font-size:12px;font-weight:700;cursor:pointer" onmouseover="this.style.background=\'#fde68a\'" onmouseout="this.style.background=\'#fef9ee\'">📋 Copy</button>' +
          '<button onclick="deleteRecvBatch(' + bi + ')" title="Delete this batch" style="padding:4px 10px;border:1.5px solid #fecaca;border-radius:6px;background:#fff5f5;color:#dc2626;font-size:12px;font-weight:700;cursor:pointer" onmouseover="this.style.background=\'#fee2e2\'" onmouseout="this.style.background=\'#fff5f5\'">🗑</button>' +
        '</div>' +
      '</div>' +
      '<div style="max-height:240px;overflow-y:auto"><table style="width:100%;border-collapse:collapse">' +
        '<thead><tr style="background:#f1f5f9"><th style="padding:6px 8px;font-size:10px;font-weight:700;letter-spacing:1px;color:#64748b;text-align:left;text-transform:uppercase">Item</th>' +
        '<th style="padding:6px 8px;font-size:10px;font-weight:700;letter-spacing:1px;color:#64748b;text-align:center;text-transform:uppercase">QTY</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
    '</div>';
  }).join('');
}

function onRecvInput(bi, ii, val) {
  var m = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('recv-day').value);
  var dept = document.getElementById('recv-dept').value;
  var key = _rlKey(m, day, dept);
  if (!_recvLog[key]) return;
  _recvLog[key][bi].qty[ii] = Math.max(0, parseInt(val) || 0);
  saveRecvLog();
  // Update batch total label live
  var batchTotal = _recvLog[key][bi].qty.reduce(function(a,b){return a+b;},0);
  var badges = document.getElementById('recv-batch-list').querySelectorAll('[style*="pcs total"]');
  if (badges[bi]) badges[bi].textContent = batchTotal + ' pcs total';
  updateRecvBadge(m, day, dept);
}

function addRecvBatch() {
  var m = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('recv-day').value);
  var dept = document.getElementById('recv-dept').value;
  var key = _rlKey(m, day, dept);
  if (!_recvLog[key]) _recvLog[key] = [];
  var itemCount = MASTER[dept].length;
  _recvLog[key].push({ qty: Array(itemCount).fill(0) });
  saveRecvLog();
  renderRecvDrawer();
  // Scroll to bottom
  setTimeout(function() {
    var list = document.getElementById('recv-batch-list');
    list.scrollTop = list.scrollHeight;
  }, 50);
}

var _recvClipboard = null;

function copyRecvBatch(bi) {
  var m = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('recv-day').value);
  var dept = document.getElementById('recv-dept').value;
  var key = _rlKey(m, day, dept);
  var batch = _recvLog[key] && _recvLog[key][bi];
  if (!batch) return;
  _recvClipboard = { qty: batch.qty.slice(), dept: dept };
  // Add a new batch with copied values
  if (!_recvLog[key]) _recvLog[key] = [];
  _recvLog[key].push({ qty: batch.qty.slice() });
  saveRecvLog();
  renderRecvDrawer();
  toast('📋 Batch ' + (bi + 1) + ' copied as new batch — edit quantities as needed', 'ok');
}

function deleteRecvBatch(bi) {
  var m = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('recv-day').value);
  var dept = document.getElementById('recv-dept').value;
  var key = _rlKey(m, day, dept);
  if (!_recvLog[key]) return;
  _recvLog[key].splice(bi, 1);
  if (_recvLog[key].length === 0) delete _recvLog[key];
  saveRecvLog();
  renderRecvDrawer();
}

function applyRecvLog() {
  var m = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('recv-day').value);
  var dept = document.getElementById('recv-dept').value;
  var key = _rlKey(m, day, dept);
  var batches = _recvLog[key] || [];
  if (batches.length === 0) { toast('No batches to apply — add at least one batch first', 'err'); return; }

  // Sum all batches per item
  var items = MASTER[dept];
  var totals = Array(items.length).fill(0);
  batches.forEach(function(batch) {
    batch.qty.forEach(function(v, i) { totals[i] += (v || 0); });
  });

  // Switch main entry to the matching day/dept
  document.getElementById('ent-month').value = m;
  buildDaySel(m);
  setTimeout(function() {
    document.getElementById('ent-day').value = day;
    entDept = dept;
    document.getElementById('ent-dept').value = dept;
    buildTabs('dept-tabs', function(d) { entDept = d; document.getElementById('ent-dept').value = d; renderEntryTable(); }, dept);
    renderEntryTable();
    // Fill inputs with totals
    setTimeout(function() {
      totals.forEach(function(v, i) {
        var inp = document.getElementById('qi_' + i);
        if (inp) { inp.value = v; inp.dispatchEvent(new Event('input')); }
      });
      updateEntStats(m, day);
      // Clear the log for this key
      delete _recvLog[key];
      saveRecvLog();
      updateRecvBadge(m, day, dept);
      renderRecvDrawer();
      var grandTotal = totals.reduce(function(a,b){return a+b;},0);
      toast('✅ Applied ' + batches.length + ' batch' + (batches.length>1?'es':'') + ' → ' + grandTotal + ' pcs total — click 💾 Save Day to confirm', 'ok');
    }, 50);
  }, 30);
}

function updateRecvBadge(m, day, dept) {
  // Count total batches across all keys for the current day (any dept)
  var total = 0;
  DEPT_KEYS.forEach(function(dk) {
    var k = _rlKey(m, day, dk);
    if (_recvLog[k]) total += _recvLog[k].length;
  });
  var badge = document.getElementById('recv-log-badge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'block' : 'none';
  }
}

// ════════════════════════════════════════════════════════════════
//  CLEAR DATA — DAY / RANGE / MONTH
// ════════════════════════════════════════════════════════════════

function toggleClearMenu(e) {
  e.stopPropagation();
  var menu = document.getElementById('clear-menu');
  var isOpen = menu.style.display === 'block';
  // close all other dropdowns first
  document.querySelectorAll('#clear-menu').forEach(function(m){ m.style.display='none'; });
  menu.style.display = isOpen ? 'none' : 'block';
}
// close menu when clicking elsewhere
document.addEventListener('click', function() {
  var m = document.getElementById('clear-menu');
  if (m) m.style.display = 'none';
});

function openClear(mode) {
  // close dropdown
  document.getElementById('clear-menu').style.display = 'none';

  var curM = parseInt(document.getElementById('ent-month').value) || (new Date().getMonth()+1);
  var curDay = parseInt(document.getElementById('ent-day').value) || 1;

  // populate month selects if empty
  ['clr-month','clr-rng-month','clr-mn-month'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el.innerHTML) {
      el.innerHTML = MONTH_NAMES.map(function(n,i){ return '<option value="'+(i+1)+'">'+n+'</option>'; }).join('');
    }
    el.value = curM;
  });

  // populate department selects
  ['clr-dept-day','clr-dept-rng'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el.innerHTML) {
      el.innerHTML = DEPT_KEYS.map(function(d){ return '<option value="'+d+'">'+DEPT_ICONS[d]+' '+d+'</option>'; }).join('');
    }
    el.value = entDept;
  });
  var deptMon = document.getElementById('clr-dept-month');
  if (deptMon.options.length === 1) {
    DEPT_KEYS.forEach(function(d){ var o=document.createElement('option'); o.value=d; o.textContent=DEPT_ICONS[d]+' '+d; deptMon.appendChild(o); });
  }

  // build day selects
  buildClrDays(curM, 'clr-day', curDay, curDay);
  buildClrRngDays();

  // show correct panel
  document.getElementById('clr-day-panel').style.display   = mode==='day'   ? '' : 'none';
  document.getElementById('clr-range-panel').style.display = mode==='range' ? '' : 'none';
  document.getElementById('clr-month-panel').style.display = mode==='month' ? '' : 'none';
  document.getElementById('clr-month-confirm').style.display = 'none';

  // header titles
  var titles = {day:'📅 Clear This Day', range:'📆 Clear Date Range', month:'🗑 Clear Entire Month'};
  var subs   = {day:'Remove data for one department on one day', range:'Remove data across a range of days', month:'Remove all data for an entire month'};
  document.getElementById('clear-modal-title').textContent = titles[mode];
  document.getElementById('clear-modal-sub').textContent   = subs[mode];

  document.getElementById('clear-modal').classList.remove('hidden');
}

function buildClrDays(m, selId, defVal, defVal2) {
  var nd = dim(CY, m);
  var el = document.getElementById(selId);
  el.innerHTML = '';
  for (var d=1; d<=nd; d++) { var o=document.createElement('option'); o.value=d; o.textContent='Day '+d; el.appendChild(o); }
  el.value = defVal <= nd ? defVal : 1;
}

function buildClrRngDays() {
  var m = parseInt(document.getElementById('clr-rng-month').value) || (new Date().getMonth()+1);
  var curDay = parseInt(document.getElementById('ent-day').value) || 1;
  buildClrDays(m, 'clr-rng-from', 1, 1);
  buildClrDays(m, 'clr-rng-to', dim(CY,m), dim(CY,m));
}

function closeClr() {
  document.getElementById('clear-modal').classList.add('hidden');
}

function doClrDay() {
  var m   = parseInt(document.getElementById('clr-month').value);
  var day = parseInt(document.getElementById('clr-day').value);
  var dept= document.getElementById('clr-dept-day').value;
  clearDeptDay(dept, m, day);
  commitSave(CY);
  // refresh view if same day/dept is showing
  var curM   = parseInt(document.getElementById('ent-month').value);
  var curDay = parseInt(document.getElementById('ent-day').value);
  if (dept === entDept && m === curM && day === curDay) {
    renderEntry(); updateEntStats(m, day);
  }
  closeClr();
  toast('✅ Cleared ' + dept + ' — ' + MONTH_NAMES[m-1] + ' Day ' + day);
}

function doClrRange() {
  var m    = parseInt(document.getElementById('clr-rng-month').value);
  var from = parseInt(document.getElementById('clr-rng-from').value);
  var to   = parseInt(document.getElementById('clr-rng-to').value);
  var dept = document.getElementById('clr-dept-rng').value;
  if (from > to) { toast('Day From must be ≤ Day To', 'err'); return; }
  for (var d = from; d <= to; d++) clearDeptDay(dept, m, d);
  commitSave(CY);
  var curM   = parseInt(document.getElementById('ent-month').value);
  var curDay = parseInt(document.getElementById('ent-day').value);
  if (dept === entDept && m === curM && curDay >= from && curDay <= to) {
    renderEntry(); updateEntStats(m, curDay);
  }
  closeClr();
  toast('✅ Cleared ' + dept + ' — ' + MONTH_NAMES[m-1] + ' Days ' + from + '–' + to);
}

function doClrMonth() {
  var confirmBox = document.getElementById('clr-month-confirm');
  // Two-click confirm for destructive action
  if (confirmBox.style.display === 'none') {
    confirmBox.style.display = 'block';
    document.getElementById('clr-month-btn').textContent = '⚠️ Yes, Delete Everything';
    return;
  }
  var m    = parseInt(document.getElementById('clr-mn-month').value);
  var dept = document.getElementById('clr-dept-month').value;
  var nd   = dim(CY, m);
  if (dept === 'ALL') {
    DEPT_KEYS.forEach(function(dk) {
      for (var d=1; d<=nd; d++) clearDeptDay(dk, m, d);
    });
  } else {
    for (var d=1; d<=nd; d++) clearDeptDay(dept, m, d);
  }
  commitSave(CY);
  var curM   = parseInt(document.getElementById('ent-month').value);
  if (m === curM) { renderEntry(); updateEntStats(m, parseInt(document.getElementById('ent-day').value)); }
  closeClr();
  var label = dept === 'ALL' ? 'ALL departments' : dept;
  toast('✅ Entire month cleared — ' + MONTH_NAMES[m-1] + ' / ' + label);
}

// Helper: clear one dept on one day (no commitSave — caller does it)
function clearDeptDay(dept, m, day) {
  MASTER[dept].forEach(function(_, i) {
    setVal(CY, m, dept, i, day - 1, 0);
  });
}

// Legacy kept for any other callers
function clearDay() {
  var m   = parseInt(document.getElementById('ent-month').value);
  var day = parseInt(document.getElementById('ent-day').value);
  clearDeptDay(entDept, m, day);
  commitSave(CY);
  renderEntry(); updateEntStats(m, day);
  toast('Cleared — ' + entDept + ' day ' + day);
}

// ════════════════════════════════════════════════════════════════
//  BULK PASTE — REBUILT FROM SCRATCH
//  FIX: Column detection is now smart — handles any Excel format
//  FIX: Day-to-column mapping corrected
//  FIX: Paste preview shows actual QR revenue correctly
// ════════════════════════════════════════════════════════════════
var bulkRows = [];

function openBulk() {
  // Reset file input to prevent accidental file picker trigger
  var fi = document.getElementById('xl-file-input');
  if (fi) { fi.value = ''; fi.blur(); }

  var bm = document.getElementById('bk-month');
  var by = document.getElementById('bk-year');
  var bf = document.getElementById('bk-day-from');
  var bt = document.getElementById('bk-day-to');
  var bd = document.getElementById('bk-dept');
  // Always rebuild to reflect current year/dept
  bm.innerHTML = MONTH_NAMES.map(function(n, i) { return '<option value="' + (i+1) + '">' + n + '</option>'; }).join('');
  by.innerHTML = '';
  for (var y = 2025; y <= 2035; y++) { var o = document.createElement('option'); o.value = y; o.textContent = y; by.appendChild(o); }
  bd.innerHTML = '<option value="ALL">All Departments</option>';
  DEPT_KEYS.forEach(function(d) { var o = document.createElement('option'); o.value = d; o.textContent = DEPT_ICONS[d] + ' ' + d; bd.appendChild(o); });
  var curM = CY === 2025 ? 12 : parseInt(document.getElementById('ent-month').value || new Date().getMonth() + 1);
  bm.value = curM; by.value = CY; bd.value = entDept;
  buildBkDays();
  document.getElementById('bk-text').value = '';
  document.getElementById('bk-preview').style.display = 'none';
  document.getElementById('bk-info').style.display = 'none';
  document.getElementById('bk-apply-btn').style.background = '#94a3b8';
  bulkRows = [];
  document.getElementById('bulk-modal').classList.remove('hidden');
  // Double rAF is safer than setTimeout - won't bleed into pending browser events
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var ta = document.getElementById('bk-text');
      if (ta) ta.focus();
    });
  });
}

function buildBkDays() {
  var m = parseInt(document.getElementById('bk-month').value);
  var y = parseInt(document.getElementById('bk-year').value);
  var nd = dim(y, m);
  var bf = document.getElementById('bk-day-from');
  var bt = document.getElementById('bk-day-to');
  var pf = parseInt(bf.value) || 1; var pt = parseInt(bt.value) || nd;
  bf.innerHTML = ''; bt.innerHTML = '';
  for (var d = 1; d <= nd; d++) {
    var a = document.createElement('option'); a.value = d; a.textContent = d; bf.appendChild(a);
    var b = document.createElement('option'); b.value = d; b.textContent = d; bt.appendChild(b);
  }
  bf.value = Math.min(pf, nd); bt.value = Math.min(pt, nd);
}

function closeBulk() { document.getElementById('bulk-modal').classList.add('hidden'); }

function fuzzyScore(a, b) {
  a = a.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  b = b.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.9;
  var wa = a.split(/\s+/); var wb = b.split(/\s+/);
  var common = 0;
  wa.forEach(function(w) {
    if (w.length < 2) return;
    if (wb.indexOf(w) >= 0 || wb.some(function(bw) { return bw.includes(w) || w.includes(bw); })) common++;
  });
  return common / Math.max(wa.length, wb.length);
}

// FIX: Smart column detection — finds where numeric day data starts
// Handles formats: [Name, Day1, Day2...] or [#, Name, Price, KG, Day1...] etc.
function detectDataStartCol(rows, sampleLines) {
  // Find the first row with mostly numeric data after column 0
  for (var ri = 0; ri < Math.min(sampleLines.length, 5); ri++) {
    var cols = sampleLines[ri].split('\t');
    if (cols.length < 2) continue;
    // Try each column from 1 onward — find first col where 50%+ of values in that position are numeric across rows
    for (var ci = 1; ci < Math.min(cols.length, 6); ci++) {
      var numCount = 0, total = 0;
      sampleLines.forEach(function(line) {
        var c = line.split('\t');
        if (c[ci] !== undefined) {
          total++;
          var v = c[ci].replace(/,/g, '').trim();
          if (v !== '' && !isNaN(parseFloat(v))) numCount++;
        }
      });
      if (total > 0 && numCount / total > 0.5) return ci;
    }
  }
  return 1; // default: data starts at column 1
}

function previewBulk() {
  var raw = document.getElementById('bk-text').value;
  if (!raw.trim()) {
    document.getElementById('bk-preview').style.display = 'none';
    document.getElementById('bk-info').style.display = 'none';
    document.getElementById('bk-apply-btn').style.background = '#94a3b8';
    return;
  }
  var bm = parseInt(document.getElementById('bk-month').value);
  var by2 = parseInt(document.getElementById('bk-year').value);
  var dayFrom = parseInt(document.getElementById('bk-day-from').value);
  var dayTo = parseInt(document.getElementById('bk-day-to').value);
  var deptFilter = document.getElementById('bk-dept').value;
  var rangeLen = dayTo - dayFrom + 1;

  // Build item lookup
  var allItems = [];
  DEPT_KEYS.forEach(function(dept) {
    if (deptFilter !== 'ALL' && dept !== deptFilter) return;
    MASTER[dept].forEach(function(item, idx) { allItems.push({dept: dept, idx: idx, name: item[0]}); });
  });

  var lines = raw.split('\n').filter(function(l) { return l.trim(); });

  // Detect where numeric day data starts in the columns
  var dataStartCol = detectDataStartCol([], lines);

  // ── POSITION-BASED matching (reliable): when a specific dept is chosen,
  //    map each non-skipped row to the next item in MASTER[dept] in order.
  //    Name matching is used ONLY for confirmation label, not for index.
  //    When ALL depts selected, fall back to name matching.
  var usePositionMatch = (deptFilter !== 'ALL');
  var posItemList = []; // ordered list of items for position matching
  if (usePositionMatch) {
    MASTER[deptFilter] && MASTER[deptFilter].forEach(function(item, idx) {
      posItemList.push({dept: deptFilter, idx: idx, name: item[0]});
    });
  }
  var posIdx = 0; // pointer into posItemList

  bulkRows = []; var matched = 0, unmatched = 0, skipped = 0;
  lines.forEach(function(line) {
    var cols = line.split('\t');
    var firstName = cols[0].trim();

    // Skip blank, header, total rows
    if (!firstName || /^[\d\s#]+$/.test(firstName) ||
        firstName.toLowerCase() === 'item' || firstName.toLowerCase() === 'items' ||
        firstName.toLowerCase().indexOf('total') >= 0 ||
        firstName.toLowerCase().indexOf('subtotal') >= 0 ||
        firstName.toLowerCase().indexOf('dept') >= 0 ||
        firstName.toLowerCase().indexOf('department') >= 0 ||
        firstName.toLowerCase().indexOf('description') >= 0) {
      bulkRows.push({type: 'skip', name: firstName || '(blank)'}); skipped++; return;
    }

    var bestMatch = null, bestScore = 0;

    if (usePositionMatch) {
      // ── POSITION MODE: assign next item in dept order ──────────
      if (posIdx < posItemList.length) {
        bestMatch = posItemList[posIdx];
        posIdx++;
        // Use name similarity just for confidence colouring
        bestScore = fuzzyScore(firstName, bestMatch.name);
        if (bestScore < 0.1) bestScore = 0.5; // override — position is authoritative
      } else {
        // More rows than items — skip extras
        bulkRows.push({type: 'skip', name: firstName + ' (no more items in dept)'}); skipped++; return;
      }
    } else {
      // ── NAME MATCH MODE (ALL depts) ────────────────────────────
      allItems.forEach(function(item) {
        var s = fuzzyScore(firstName, item.name);
        if (s > bestScore) { bestScore = s; bestMatch = item; }
      });
      if (!bestMatch || bestScore < 0.25) {
        bulkRows.push({type: 'nomatch', name: firstName, score: bestScore}); unmatched++; return;
      }
    }

    // Extract day values — find first column with numeric data (skip name/label cols)
    var vals = [];
    for (var ci = 0; ci < rangeLen; ci++) {
      var colIdx = dataStartCol + ci;
      var cell = (cols[colIdx] || '').trim().replace(/,/g, '');
      vals.push(cell === '' || cell === '-' || cell === '/' ? 0 : Math.max(0, parseInt(cell) || 0));
    }
    while (vals.length < rangeLen) vals.push(0);

    var total = vals.reduce(function(a, b) { return a + b; }, 0);
    var revenue = total * getP(bestMatch.dept, bestMatch.idx);

    bulkRows.push({
      type: 'match', name: firstName, matchName: bestMatch.name,
      dept: bestMatch.dept, idx: bestMatch.idx, score: bestScore,
      vals: vals, dayFrom: dayFrom, rangeLen: rangeLen, total: total, revenue: revenue
    }); matched++;
  });

  // Build preview table
  var ph = '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  ph += '<thead><tr style="background:#0d1b2e;color:#fff">';
  ph += '<th style="padding:7px 10px;text-align:left">Pasted Name</th>';
  ph += '<th style="padding:7px 10px;text-align:left">Matched Item</th>';
  ph += '<th style="padding:7px 10px;text-align:left">Dept</th>';
  ph += '<th style="padding:7px 10px;text-align:center">Days ' + dayFrom + '–' + dayTo + '</th>';
  ph += '<th style="padding:7px 10px;text-align:right">Total Pcs</th>';
  ph += '<th style="padding:7px 10px;text-align:right">Revenue (QR)</th>';
  ph += '<th style="padding:7px 10px;text-align:center">Status</th></tr></thead><tbody>';

  bulkRows.forEach(function(r) {
    if (r.type === 'skip') {
      ph += '<tr style="background:#f8fafc"><td style="padding:6px 10px;color:#94a3b8;font-style:italic">' + r.name + '</td>';
      ph += '<td colspan="5" style="padding:6px 10px;color:#94a3b8;font-size:11px">Header / blank — skipped</td>';
      ph += '<td style="padding:6px 10px;text-align:center"><span style="background:#e2e8f0;color:#64748b;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700">SKIP</span></td></tr>';
    } else if (r.type === 'nomatch') {
      ph += '<tr style="background:#fff8f0"><td style="padding:6px 10px;color:#92400e;font-weight:500">' + r.name + '</td>';
      ph += '<td colspan="5" style="padding:6px 10px;color:#d97706;font-size:11px">No matching item found</td>';
      ph += '<td style="padding:6px 10px;text-align:center"><span style="background:#fef3c7;color:#d97706;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700">NO MATCH</span></td></tr>';
    } else {
      var nz = r.vals.filter(function(v) { return v > 0; }).length;
      var conf = r.score >= 0.9 ? '#dcfce7' : r.score >= 0.6 ? '#eff6ff' : '#fefce8';
      ph += '<tr style="background:' + conf + '">';
      ph += '<td style="padding:6px 10px;font-weight:500">' + r.name + '</td>';
      ph += '<td style="padding:6px 10px;color:#1d4ed8;font-weight:600">' + r.matchName + '</td>';
      ph += '<td style="padding:6px 10px;color:#6b7a8d;font-size:11px">' + DEPT_ICONS[r.dept] + ' ' + r.dept + '</td>';
      ph += '<td style="padding:6px 10px;text-align:center;color:#6b7a8d">' + nz + '/' + rangeLen + ' days</td>';
      ph += '<td style="padding:6px 10px;text-align:right;font-family:monospace;font-weight:700">' + r.total.toLocaleString() + '</td>';
      ph += '<td style="padding:6px 10px;text-align:right;font-family:monospace;color:#1d4ed8;font-weight:600">' + fmtMoney(r.revenue) + '</td>';
      ph += '<td style="padding:6px 10px;text-align:center"><span style="background:#dbeafe;color:#1d4ed8;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700">✓ MATCH</span></td></tr>';
    }
  });
  ph += '</tbody></table>';

  document.getElementById('bk-preview').innerHTML = ph;
  document.getElementById('bk-preview').style.display = 'block';

  // Summary totals
  var totalPcs = bulkRows.filter(r => r.type==='match').reduce(function(a,r){return a+r.total;},0);
  var totalRev = bulkRows.filter(r => r.type==='match').reduce(function(a,r){return a+r.revenue;},0);
  document.getElementById('bk-info').innerHTML =
    '<strong>' + matched + '</strong> matched &nbsp;|&nbsp; ' +
    '<strong>' + unmatched + '</strong> no match &nbsp;|&nbsp; ' +
    '<strong>' + skipped + '</strong> skipped &nbsp;|&nbsp; ' +
    'Days ' + dayFrom + '–' + dayTo + ' → ' + MONTH_NAMES[bm-1] + ' ' + by2 +
    (matched > 0 ? ' &nbsp;|&nbsp; Total: <strong>' + totalPcs.toLocaleString() + '</strong> pcs, <strong>' + fmtMoney(totalRev) + '</strong>' : '');
  document.getElementById('bk-info').style.display = 'block';
  document.getElementById('bk-apply-btn').style.background = matched > 0 ? '#0d1b2e' : '#94a3b8';
}

// FIX: applyBulk now saves correctly with commitSave
function applyBulk() {
  var bm = parseInt(document.getElementById('bk-month').value);
  var by2 = parseInt(document.getElementById('bk-year').value);
  var good = bulkRows.filter(function(r) { return r.type === 'match'; });
  if (!good.length) { toast('No matched rows to apply', 'err'); return; }
  var count = 0, pcs = 0;
  good.forEach(function(r) {
    // FIX: day index = dayFrom-1 + col offset (0-based)
    r.vals.forEach(function(v, i) {
      setVal(by2, bm, r.dept, r.idx, r.dayFrom - 1 + i, v);
      pcs += v;
    });
    count++;
  });
  commitSave(by2);
  _DB[by2] = null; loadDB(by2);
  // Switch to the year that was just pasted so user sees results
  if (by2 !== CY) {
    CY = by2;
    PRICES = loadPR(CY);
    var ys = document.getElementById('year-sel'); if (ys) ys.value = CY;
  }
  // Rebuild selectors, then force month + day to pasted range
  var bdf = parseInt(document.getElementById('bk-day-from').value);
  buildSelectors();
  var em = document.getElementById('ent-month'); if (em) em.value = bm;
  buildDaySel(bm);
  var ed = document.getElementById('ent-day'); if (ed) ed.value = bdf;
  closeBulk(); renderEntry();
  toast('✔ Applied ' + count + ' items · ' + pcs.toLocaleString() + ' pcs → ' + MONTH_NAMES[bm-1] + ' ' + by2, 'ok');
}

// ════════════════════════════════════════════════════════════════
//  EXCEL DIRECT IMPORT
// ════════════════════════════════════════════════════════════════
var xlData = null;
var XL_DAY_COL = {'Rooms Linen': 2, 'F & B': 4, 'Spa & Pool': 4, 'Uniform': 4, 'Others': 4, 'Dry Cleaning': 4};
var XL_HDR_ROW = {'Rooms Linen': 2, 'F & B': 2, 'Spa & Pool': 3, 'Uniform': 2, 'Others': 2, 'Dry Cleaning': 2};

function openXL() {
  var xy = document.getElementById('xl-year');
  var xm = document.getElementById('xl-month');
  var xd = document.getElementById('xl-dept');
  xy.innerHTML = '';
  for (var y = 2025; y <= 2035; y++) { var o = document.createElement('option'); o.value = y; o.textContent = y; xy.appendChild(o); }
  xm.innerHTML = MONTH_NAMES.map(function(n, i) { return '<option value="' + (i+1) + '">' + n + '</option>'; }).join('');
  xd.innerHTML = '<option value="ALL">All Sheets</option>';
  DEPT_KEYS.forEach(function(d) { var o = document.createElement('option'); o.value = d; o.textContent = DEPT_ICONS[d] + ' ' + d; xd.appendChild(o); });
  xy.value = CY;
  xm.value = CY === 2025 ? 12 : parseInt(document.getElementById('ent-month').value || new Date().getMonth() + 1);
  xd.value = 'ALL';
  buildXLDays(); // populate Day From / Day To for current month
  xlData = null;
  document.getElementById('xl-preview').style.display = 'none';
  document.getElementById('xl-summary').style.display = 'none';
  document.getElementById('xl-import-btn').style.background = '#94a3b8';
  document.getElementById('xl-modal').classList.remove('hidden');
}

function buildXLDays() {
  var m = parseInt(document.getElementById('xl-month').value) || (new Date().getMonth() + 1);
  var y = parseInt(document.getElementById('xl-year').value) || CY;
  var nd = dim(y, m);
  var df = document.getElementById('xl-day-from');
  var dt = document.getElementById('xl-day-to');
  var prevFrom = df.value ? parseInt(df.value) : 1;
  var prevTo   = dt.value ? parseInt(dt.value) : nd;
  df.innerHTML = '';
  dt.innerHTML = '';
  for (var d = 1; d <= nd; d++) {
    var o1 = document.createElement('option'); o1.value = d; o1.textContent = 'Day ' + d; df.appendChild(o1);
    var o2 = document.createElement('option'); o2.value = d; o2.textContent = 'Day ' + d; dt.appendChild(o2);
  }
  df.value = prevFrom <= nd ? prevFrom : 1;
  dt.value = prevTo   <= nd ? prevTo   : nd;
}

function closeXL() { document.getElementById('xl-modal').classList.add('hidden'); }

function triggerXLFile() {
  // This is the ONLY function allowed to trigger the file picker.
  // Open the XL modal first, then after it's rendered, open the file dialog.
  openXL();
  // Use a deliberate delay so the modal is fully visible before the file dialog opens.
  // This prevents any event from the Bulk Paste button bleeding into this.
  setTimeout(function() {
    var fi = document.getElementById('xl-file-input');
    if (fi) {
      fi.value = ''; // reset so same file can be re-selected
      fi.click();
    }
  }, 350);
}

function handleXLFile(input) {
  var file = input.files[0]; if (!file) return;
  // Do NOT reset input.value here — we need to read the file first
  if (typeof XLSX === 'undefined') { toast('SheetJS not loaded — need internet once to load library', 'err'); input.value = ''; return; }
  // Ensure XL modal is open (may already be open from triggerXLFile)
  var xlModal = document.getElementById('xl-modal');
  if (xlModal && xlModal.classList.contains('hidden')) openXL();
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var wb = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
      parseXLWorkbook(wb);
    } catch(err) { toast('Error reading file: ' + err.message, 'err'); }
    input.value = ''; // reset after reading
  };
  reader.onerror = function() { toast('Could not read file', 'err'); input.value = ''; };
  reader.readAsArrayBuffer(file);
}

function parseXLWorkbook(wb) {
  var deptFilter = document.getElementById('xl-dept').value;
  xlData = {};
  var totalItems = 0, totalPcs = 0;
  var ph = '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  ph += '<thead><tr style="background:#1b5e20;color:#fff">';
  ph += '<th style="padding:7px 10px;text-align:left">Sheet</th><th style="padding:7px 10px;text-align:left">Excel Item</th>';
  ph += '<th style="padding:7px 10px;text-align:center">System Row</th><th style="padding:7px 10px;text-align:right">Total Pcs</th>';
  ph += '<th style="padding:7px 10px;text-align:center">Days w/ Data</th></tr></thead><tbody>';

  wb.SheetNames.forEach(function(sname) {
    if (!MASTER[sname]) return;
    if (deptFilter !== 'ALL' && sname !== deptFilter) return;
    var ws = wb.Sheets[sname];
    var rows = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});
    var hdrRow = XL_HDR_ROW[sname] || 2;
    var dayCol = XL_DAY_COL[sname] || 4;
    xlData[sname] = [];
    var sysIdx = 0;
    for (var ri = hdrRow + 1; ri < rows.length; ri++) {
      var row = rows[ri];
      var itemName = row[1];
      if (!itemName || typeof itemName !== 'string' || !itemName.trim()) continue;
      if (sysIdx >= MASTER[sname].length) break;
      var xlFrom = parseInt(document.getElementById('xl-day-from').value) || 1;
      var xlTo   = parseInt(document.getElementById('xl-day-to').value)   || 31;
      if (xlFrom > xlTo) xlTo = xlFrom;
      var rangeLen = xlTo - xlFrom + 1;
      var vals = [];
      for (var ci = dayCol; ci < dayCol + rangeLen; ci++) {
        var cell = row[ci];
        var v = (cell === null || cell === undefined || cell === '') ? 0 : Math.max(0, parseInt(cell) || 0);
        vals.push(v);
      }
      var total = vals.reduce(function(a, b) { return a + b; }, 0);
      var nz = vals.filter(function(v) { return v > 0; }).length;
      xlData[sname].push({sysIdx: sysIdx, excelName: itemName.trim(), sysName: MASTER[sname][sysIdx][0], vals: vals, dayFrom: xlFrom, rangeLen: rangeLen, total: total});
      totalItems++; totalPcs += total;
      ph += '<tr style="background:' + (ri % 2 === 0 ? '#f9fafb' : '#fff') + '">';
      ph += '<td style="padding:5px 10px;color:#1b5e20;font-weight:600;font-size:11px">' + sname + '</td>';
      ph += '<td style="padding:5px 10px;font-weight:500">' + itemName.trim() + '</td>';
      ph += '<td style="padding:5px 10px;text-align:center;color:#6b7a8d;font-size:11px">' + MASTER[sname][sysIdx][0] + '</td>';
      ph += '<td style="padding:5px 10px;text-align:right;font-family:monospace;font-weight:700">' + total.toLocaleString() + '</td>';
      ph += '<td style="padding:5px 10px;text-align:center;color:#6b7a8d">' + nz + '/' + rangeLen + '</td></tr>';
      sysIdx++;
    }
  });
  ph += '</tbody></table>';
  document.getElementById('xl-preview').innerHTML = ph;
  document.getElementById('xl-preview').style.display = 'block';
  document.getElementById('xl-summary').innerHTML = '<strong>Ready to import:</strong> ' + totalItems + ' items, ' + totalPcs.toLocaleString() + ' total pieces across all sheets.';
  document.getElementById('xl-summary').style.display = 'block';
  document.getElementById('xl-import-btn').style.background = totalItems > 0 ? '#1b5e20' : '#94a3b8';
}

// FIX: doXLImport uses commitSave for single localStorage write
function doXLImport() {
  if (!xlData) { toast('Please select a file first', 'err'); return; }
  var xm = parseInt(document.getElementById('xl-month').value);
  var xy2 = parseInt(document.getElementById('xl-year').value);
  var nd = dim(xy2, xm);
  var count = 0, pcs = 0;
  Object.keys(xlData).forEach(function(sname) {
    xlData[sname].forEach(function(item) {
      var dayFrom = item.dayFrom || 1;
      for (var i = 0; i < item.vals.length; i++) {
        var dayIdx = dayFrom - 1 + i; // 0-based day index in the month
        if (dayIdx >= nd) break;
        setVal(xy2, xm, sname, item.sysIdx, dayIdx, item.vals[i]);
        pcs += item.vals[i];
      }
      count++;
    });
  });
  commitSave(xy2);
  if (xy2 === CY) { _DB[CY] = null; loadDB(CY); }
  closeXL(); renderEntry(); renderDash();
  toast('Imported ' + count + ' items, ' + pcs.toLocaleString() + ' pcs into ' + MONTH_NAMES[xm-1] + ' ' + xy2, 'ok');
}

// ════════════════════════════════════════════════════════════════
//  FINANCE EXPORT
// ════════════════════════════════════════════════════════════════
function financeExportExcel() {
  var m = parseInt(document.getElementById('fin-month').value || new Date().getMonth() + 1);
  var nd = dim(CY, m); var mName = MONTH_NAMES[m-1];
  var rows = [];
  var hdr = ['Day', 'Receiving Day', 'Receiving Date'];
  DEPT_KEYS.forEach(function(d) { hdr.push(d + ' (QR)'); });
  hdr.push('Daily Total (QR)', 'Posting Day', 'Posting Date', 'Posted QR');
  rows.push(hdr.join(','));
  var mTot = 0; var dTots = DEPT_KEYS.map(function() { return 0; });
  for (var d = 1; d <= nd; d++) {
    var recvD = new Date(CY, m-1, d); var postD = new Date(CY, m-1, d+1);
    var dTot = 0;
    var dQRs = DEPT_KEYS.map(function(dept, di) {
      var v = 0; MASTER[dept].forEach(function(_, i) { v += getVal(CY, m, dept, i, d-1) * getPriceForCalc(dept, i, CY, m, d); });
      dTot += v; dTots[di] += v; return v;
    });
    mTot += dTot;
    var row = [d, DAY_NAMES[recvD.getDay()], fmtDate(recvD)];
    dQRs.forEach(function(v) { row.push(v > 0 ? f2(v) : ''); });
    row.push(dTot > 0 ? f2(dTot) : '', DAY_NAMES[postD.getDay()], fmtDate(postD), dTot > 0 ? f2(dTot) : '');
    rows.push(row.join(','));
  }
  var totRow = ['TOTAL', '', '']; dTots.forEach(function(v) { totRow.push(f2(v)); });
  totRow.push(f2(mTot), '', '', f2(mTot)); rows.push(totRow.join(','));
  var csv = 'Reda Salah · Laundry Management System\nFinance Posting - ' + mName + ' ' + CY + '\n';
  csv += 'Generated: ' + fmtDate(new Date()) + '\n';
  csv += '© Reda Salah · Laundry Management System · All Rights Reserved\n\n';
  csv += rows.join('\n');
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'Finance_Posting_' + mName + '_' + CY + '.csv';
  a.click(); toast('Finance Excel downloaded', 'ok');
}

function financeExportPDF() {
  var origTitle = document.title;
  document.title = 'Finance Posting - ' + MONTH_NAMES[parseInt(document.getElementById('fin-month').value)-1] + ' ' + CY + ' - Reda Salah';
  document.body.classList.add('print-finance');
  window.print();
  document.body.classList.remove('print-finance');
  document.title = origTitle;
  toast('Finance PDF sent to printer', 'ok');
}

// ════════════════════════════════════════════════════════════════
//  MONTHLY
// ════════════════════════════════════════════════════════════════
function renderMonthly() {
  var m    = parseInt(document.getElementById('mon-month')?.value || new Date().getMonth() + 1);
  var dsel = document.getElementById('mon-dept')?.value || 'ALL';
  var nd   = dim(CY, m);
  var fromDay = parseInt(document.getElementById('mon-from-day')?.value) || 1;
  var toDay   = parseInt(document.getElementById('mon-to-day')?.value)   || nd;
  fromDay = Math.max(1, Math.min(fromDay, nd));
  toDay   = Math.max(fromDay, Math.min(toDay, nd));
  var days = Array.from({length: toDay - fromDay + 1}, function(_, i) { return fromDay + i; });

  // Use monthly prices if available
  var mpr = hasMonthlyPrices(CY, m) ? loadPRM(CY, m) : PRICES;

  // Calculate totals using correct prices
  var totalQR = 0, totalKG = 0, totalPCS = 0;
  var deptTotals = {};
  DEPT_KEYS.forEach(function(dept) {
    var dQR = 0, dKG = 0, dPCS = 0;
    MASTER[dept].forEach(function(_, i) {
      var pr = mpr[dept]?.[i]?.[1] ?? MASTER[dept][i][1];
      var kg = mpr[dept]?.[i]?.[2] ?? MASTER[dept][i][2];
      for (var d = 0; d < nd; d++) {
        var v = getVal(CY, m, dept, i, d);
        dQR += v * pr; dKG += v * kg; dPCS += v;
      }
    });
    deptTotals[dept] = {qr: dQR, kg: dKG, pcs: dPCS};
    totalQR += dQR; totalKG += dKG; totalPCS += dPCS;
  });

  // Stats bar
  document.getElementById('mon-stats').innerHTML =
    '<div class="sc blue"><div class="sc-lbl">Total Revenue</div><div class="sc-val">' + fmtMoney(totalQR) + '</div><div class="sc-sub">' + MONTH_NAMES[m-1] + ' ' + CY + '</div></div>' +
    '<div class="sc green"><div class="sc-lbl">Total KG</div><div class="sc-val">' + Math.ceil(totalKG) + '<span>kg</span></div><div class="sc-sub">All departments</div></div>' +
    '<div class="sc dark"><div class="sc-lbl">Total Pieces</div><div class="sc-val">' + totalPCS.toLocaleString() + '</div><div class="sc-sub">All items</div></div>' +
    '<div class="sc orange"><div class="sc-lbl">Avg Daily Rev</div><div class="sc-val">' + fmtMoney(totalQR / nd) + '</div><div class="sc-sub">Per day this month</div></div>';

  // Dept summary cards
  var deptCards = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:24px">';
  DEPT_KEYS.forEach(function(dept) {
    var t = deptTotals[dept];
    var col = DEPT_COLORS[dept] || '#0d1b2e';
    deptCards += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden">' +
      '<div style="background:' + col + ';padding:8px 12px;font-size:11px;font-weight:800;color:#fff">' + DEPT_ICONS[dept] + ' ' + dept + '</div>' +
      '<div style="padding:10px 12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:11px">' +
        '<div><div style="color:#94a3b8;font-size:10px">Revenue</div><div style="font-weight:700;color:#0d1b2e">' + fmtMoney(t.qr) + '</div></div>' +
        '<div><div style="color:#94a3b8;font-size:10px">KG</div><div style="font-weight:700;color:#0d1b2e">' + t.kg.toFixed(1) + '</div></div>' +
        '<div><div style="color:#94a3b8;font-size:10px">Pieces</div><div style="font-weight:700;color:#0d1b2e">' + t.pcs.toLocaleString() + '</div></div>' +
      '</div></div>';
  });
  deptCards += '</div>';

  // Item tables per dept
  var depts = dsel === 'ALL' ? DEPT_KEYS : [dsel];
  var h = dsel === 'ALL' ? deptCards : '';

  depts.forEach(function(dept) {
    var col = DEPT_COLORS[dept] || '#0d1b2e';
    var items = MASTER[dept];
    var h2 = '<div class="mon-dept-section">' +
      '<div class="mon-dept-hd" style="background:' + col + '">' + DEPT_ICONS[dept] + ' ' + dept + '</div>' +
      '<div class="tscroll"><table class="mon">' +
      '<thead><tr><th>Item</th><th>Price</th><th>KG/pc</th>' +
      days.map(function(d) { return '<th>' + d + '</th>'; }).join('') +
      '<th>Pcs</th><th>Revenue</th><th>KG</th></tr></thead><tbody>';
    var dSubDay = Array(nd).fill(0), dSubPcs = 0, dSubQR = 0, dSubKG = 0;
    items.forEach(function(_, i) {
      var nm = getN(dept, i);
      var pr = mpr[dept]?.[i]?.[1] ?? MASTER[dept][i][1];
      var kg = mpr[dept]?.[i]?.[2] ?? MASTER[dept][i][2];
      var rTotal = 0, rKG = 0;
      var cells = days.map(function(d, di) {
        var v = getVal(CY, m, dept, i, di);
        rTotal += v; dSubDay[di] += v;
        return v > 0 ? '<td class="nz">' + v + '</td>' : '<td></td>';
      }).join('');
      rKG = rTotal * kg;
      dSubPcs += rTotal; dSubQR += rTotal * pr; dSubKG += rKG;
      h2 += '<tr>' +
        '<td>' + nm + '</td>' +
        '<td style="font-size:10px;color:#64748b">' + pr.toFixed(4) + '</td>' +
        '<td style="font-size:10px;color:#64748b">' + kg.toFixed(3) + '</td>' +
        cells +
        '<td class="' + (rTotal>0?'nz':'') + '">' + (rTotal||'') + '</td>' +
        '<td class="' + (rTotal>0?'nz':'') + '">' + (rTotal > 0 ? f2(rTotal * pr) : '') + '</td>' +
        '<td style="font-size:11px;color:#64748b">' + (rKG > 0 ? rKG.toFixed(2) : '') + '</td>' +
        '</tr>';
    });
    h2 += '<tr class="sub-r"><td colspan="3">Subtotal — ' + dept + '</td>' +
      dSubDay.map(function(v) { return '<td>' + (v||'') + '</td>'; }).join('') +
      '<td>' + dSubPcs + '</td><td>' + f2(dSubQR) + '</td><td>' + dSubKG.toFixed(2) + '</td></tr>';
    h2 += '</tbody></table></div></div>';
    h += h2;
  });

  document.getElementById('mon-wrap').innerHTML = h;
}

// ════════════════════════════════════════════════════════════════
//  REPORT
// ════════════════════════════════════════════════════════════════
function renderReport() {
  var ry  = parseInt(document.getElementById('rep-year')?.value || CY);
  var wrap = document.getElementById('report-wrap');
  if (!wrap) return;

  // ── Collect full year data ──────────────────────────────────
  var yearData = {};   // month -> {qr, kg, pcs, byDept}
  var yrQR = 0, yrKG = 0, yrPCS = 0;
  var deptYear = {};   // dept -> {qr, kg, pcs}
  var itemYear = {};   // dept+i -> {name, dept, qr, kg, pcs}

  DEPT_KEYS.forEach(function(dept) {
    deptYear[dept] = {qr:0, kg:0, pcs:0};
  });

  for (var mi = 1; mi <= 12; mi++) {
    var nd = dim(ry, mi);
    var mpr = hasMonthlyPrices(ry, mi) ? loadPRM(ry, mi) : loadPR(ry);
    var mQR = 0, mKG = 0, mPCS = 0;
    var mByDept = {};
    DEPT_KEYS.forEach(function(dept) {
      var dQR = 0, dKG = 0, dPCS = 0;
      MASTER[dept].forEach(function(_, i) {
        var pr = mpr[dept]?.[i]?.[1] ?? MASTER[dept][i][1];
        var kg = mpr[dept]?.[i]?.[2] ?? MASTER[dept][i][2];
        var nm = MASTER[dept][i][0];
        var key = dept + '::' + i;
        if (!itemYear[key]) itemYear[key] = {name:nm, dept:dept, qr:0, kg:0, pcs:0};
        for (var d = 0; d < nd; d++) {
          var v = getVal(ry, mi, dept, i, d);
          if (v > 0) {
            dQR += v*pr; dKG += v*kg; dPCS += v;
            itemYear[key].qr  += v*pr;
            itemYear[key].kg  += v*kg;
            itemYear[key].pcs += v;
          }
        }
      });
      mByDept[dept] = {qr:dQR, kg:dKG, pcs:dPCS};
      deptYear[dept].qr  += dQR;
      deptYear[dept].kg  += dKG;
      deptYear[dept].pcs += dPCS;
      mQR += dQR; mKG += dKG; mPCS += dPCS;
    });
    yearData[mi] = {qr:mQR, kg:mKG, pcs:mPCS, byDept:mByDept};
    yrQR += mQR; yrKG += mKG; yrPCS += mPCS;
  }

  // How many months have data
  var monthsWithData = Object.keys(yearData).filter(function(mi) { return yearData[mi].qr > 0; }).length;
  var avgMonthlyRev  = monthsWithData > 0 ? yrQR / monthsWithData : 0;

  // Top items by revenue
  var itemList = Object.values(itemYear).filter(function(x) { return x.pcs > 0; });
  var topByRev = itemList.slice().sort(function(a,b) { return b.qr - a.qr; }).slice(0, 10);
  var topByVol = itemList.slice().sort(function(a,b) { return b.pcs - a.pcs; }).slice(0, 10);
  var topByKG  = itemList.slice().sort(function(a,b) { return b.kg - a.kg; }).slice(0, 10);

  // ── Build HTML ───────────────────────────────────────────────
  var html = '';

  // ── SECTION 1: Year at a glance ──────────────────────────────
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:28px">' +
    _rCard('Total Revenue ' + ry, fmtMoney(yrQR), 'All departments', '#1d4ed8', '#eff6ff') +
    _rCard('Total KG', Math.ceil(yrKG) + ' kg', 'All departments', '#15803d', '#f0fdf4') +
    _rCard('Total Pieces', yrPCS.toLocaleString(), 'Items processed', '#92400e', '#fffbeb') +
    _rCard('Avg Monthly Rev', fmtMoney(avgMonthlyRev), monthsWithData + ' months with data', '#7e22ce', '#fdf4ff') +
    _rCard('Avg Daily KG', Math.ceil(yrKG / Math.max(monthsWithData * 30, 1)) + ' kg', 'Estimated daily avg', '#0e7490', '#ecfeff') +
    _rCard('Months Active', monthsWithData + ' / 12', 'Months with entries', '#be185d', '#fdf2f8') +
  '</div>';

  // ── SECTION 2: Monthly breakdown table ───────────────────────
  html += _rSection('📅 Monthly Breakdown — ' + ry,
    '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#0d1b2e;color:#c9a84c">' +
    '<th style="padding:10px 12px;text-align:left;font-weight:700">Month</th>' +
    '<th style="padding:10px 12px;text-align:right">Revenue (QR)</th>' +
    '<th style="padding:10px 12px;text-align:right">KG</th>' +
    '<th style="padding:10px 12px;text-align:right">Pieces</th>' +
    '<th style="padding:10px 12px;text-align:right">Avg Daily Rev</th>' +
    '<th style="padding:10px 12px;text-align:right">Avg Daily KG</th>' +
    DEPT_KEYS.map(function(d) { return '<th style="padding:10px 8px;text-align:right;font-size:10px">' + DEPT_ICONS[d] + '</th>'; }).join('') +
    '</tr></thead><tbody>' +
    (function() {
      var rows = '';
      for (var mi = 1; mi <= 12; mi++) {
        var md = yearData[mi];
        var nd = dim(ry, mi);
        var isCur = (ry === CY && mi === new Date().getMonth()+1);
        var hasD = md.qr > 0;
        var bg = isCur ? '#e0f2fe' : (mi % 2 === 0 ? '#f8fafc' : '#fff');
        rows += '<tr style="background:' + bg + ';' + (isCur ? 'font-weight:700' : '') + '">' +
          '<td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;font-weight:600">' +
            MONTH_NAMES[mi-1] + (isCur ? ' ◀ Current' : '') + '</td>' +
          '<td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:' + (hasD?'#0d1b2e':'#94a3b8') + '">' + (hasD ? fmtMoney(md.qr) : '—') + '</td>' +
          '<td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:' + (hasD?'#0d1b2e':'#94a3b8') + '">' + (hasD ? (md.kg > 0 ? Math.ceil(md.kg) : '—') : '—') + '</td>' +
          '<td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:' + (hasD?'#0d1b2e':'#94a3b8') + '">' + (hasD ? md.pcs.toLocaleString() : '—') + '</td>' +
          '<td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;color:#64748b">' + (hasD ? fmtMoney(md.qr/nd) : '—') + '</td>' +
          '<td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;color:#64748b">' + (hasD ? Math.ceil(md.kg/nd) : '—') + '</td>' +
          DEPT_KEYS.map(function(dept) {
            var dv = md.byDept[dept];
            return '<td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;color:#64748b">' +
              (dv && dv.qr > 0 ? fmtMoney(dv.qr) : '—') + '</td>';
          }).join('') +
          '</tr>';
      }
      // Totals row
      rows += '<tr style="background:#0d1b2e;color:#c9a84c;font-weight:800">' +
        '<td style="padding:10px 12px">🏆 YEAR TOTAL</td>' +
        '<td style="padding:10px 12px;text-align:right">' + fmtMoney(yrQR) + '</td>' +
        '<td style="padding:10px 12px;text-align:right">' + yrKG.toFixed(1) + '</td>' +
        '<td style="padding:10px 12px;text-align:right">' + yrPCS.toLocaleString() + '</td>' +
        '<td style="padding:10px 12px;text-align:right;font-size:11px">' + fmtMoney(avgMonthlyRev) + '/mo</td>' +
        '<td style="padding:10px 12px;text-align:right;font-size:11px">' + (yrKG/Math.max(monthsWithData*30,1)).toFixed(1) + '/day</td>' +
        DEPT_KEYS.map(function(dept) {
          return '<td style="padding:10px 8px;text-align:right;font-size:11px">' + fmtMoney(deptYear[dept].qr) + '</td>';
        }).join('') +
        '</tr>';
      return rows;
    })() +
    '</tbody></table>');

  // ── SECTION 3: Revenue bar chart (simple CSS bars) ────────────
  var maxRev = Math.max.apply(null, Object.values(yearData).map(function(d){ return d.qr; }));
  html += _rSection('📊 Revenue Trend — ' + ry,
    '<div style="display:flex;align-items:flex-end;gap:6px;height:140px;padding:0 4px">' +
    (function() {
      var bars = '';
      for (var mi = 1; mi <= 12; mi++) {
        var md = yearData[mi];
        var pct = maxRev > 0 ? (md.qr / maxRev * 100) : 0;
        var isCur = (ry === CY && mi === new Date().getMonth()+1);
        bars += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">' +
          '<div style="font-size:9px;color:#64748b;font-weight:700">' + (md.qr > 0 ? fmtMoney(md.qr/1000).replace('QR ','') + 'k' : '') + '</div>' +
          '<div style="width:100%;background:' + (isCur ? '#c9a84c' : (md.qr > 0 ? '#0d1b2e' : '#e2e8f0')) + ';' +
            'height:' + Math.max(pct, md.qr > 0 ? 4 : 0) + '%;border-radius:4px 4px 0 0;min-height:' + (md.qr>0?'4px':'0') + ';transition:all .3s"></div>' +
          '<div style="font-size:9px;color:#64748b;writing-mode:vertical-rl;transform:rotate(180deg);height:28px">' + MONTH_NAMES[mi-1].slice(0,3) + '</div>' +
          '</div>';
      }
      return bars;
    })() +
    '</div>');

  // ── SECTION 4: Department breakdown ──────────────────────────
  html += _rSection('🏨 Department Performance — ' + ry,
    '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#0d1b2e;color:#c9a84c">' +
    '<th style="padding:10px 14px;text-align:left">Department</th>' +
    '<th style="padding:10px 14px;text-align:right">Revenue (QR)</th>' +
    '<th style="padding:10px 14px;text-align:right">% of Total</th>' +
    '<th style="padding:10px 14px;text-align:right">Total KG</th>' +
    '<th style="padding:10px 14px;text-align:right">Total Pieces</th>' +
    '<th style="padding:10px 14px;text-align:right">Avg per Piece</th>' +
    '<th style="padding:10px 14px;text-align:right">KG per Piece</th>' +
    '</tr></thead><tbody>' +
    DEPT_KEYS.map(function(dept, di) {
      var d = deptYear[dept];
      var pct = yrQR > 0 ? (d.qr / yrQR * 100) : 0;
      var col = DEPT_COLORS[dept] || '#0d1b2e';
      return '<tr style="background:' + (di%2===0?'#fff':'#f8fafc') + '">' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0">' +
          '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + col + ';margin-right:8px"></span>' +
          '<strong>' + DEPT_ICONS[dept] + ' ' + dept + '</strong></td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700">' + (d.qr>0?fmtMoney(d.qr):'—') + '</td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right">' +
          '<div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">' +
          '<div style="width:60px;background:#e2e8f0;border-radius:4px;height:6px">' +
            '<div style="width:' + pct.toFixed(1) + '%;background:' + col + ';height:100%;border-radius:4px"></div></div>' +
          pct.toFixed(1) + '%</div></td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right">' + (d.kg > 0 ? Math.ceil(d.kg) : '—') + '</td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right">' + (d.pcs>0?d.pcs.toLocaleString():'—') + '</td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;color:#64748b">' + (d.pcs>0?fmtMoney(d.qr/d.pcs):'—') + '</td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:11px;color:#64748b">' + (d.pcs>0?(d.kg/d.pcs).toFixed(3):'—') + '</td>' +
        '</tr>';
    }).join('') +
    '<tr style="background:#0d1b2e;color:#c9a84c;font-weight:800">' +
    '<td style="padding:10px 14px">🏆 TOTAL</td>' +
    '<td style="padding:10px 14px;text-align:right">' + fmtMoney(yrQR) + '</td>' +
    '<td style="padding:10px 14px;text-align:right">100%</td>' +
    '<td style="padding:10px 14px;text-align:right">' + yrKG.toFixed(1) + '</td>' +
    '<td style="padding:10px 14px;text-align:right">' + yrPCS.toLocaleString() + '</td>' +
    '<td style="padding:10px 14px;text-align:right">' + (yrPCS>0?fmtMoney(yrQR/yrPCS):'—') + '</td>' +
    '<td style="padding:10px 14px;text-align:right">' + (yrPCS>0?(yrKG/yrPCS).toFixed(3):'—') + '</td>' +
    '</tr></tbody></table></div>');

  // ── SECTION 4b: Department × Month Matrix ───────────────────
  html += _rSection('🔀 Department × Month Comparison — ' + ry,
    (function() {
      var headerCols = '<th style="padding:9px 12px;text-align:left;font-weight:700;color:#64748b;background:#f8fafc">Month</th>';
      DEPT_KEYS.forEach(function(dept) {
        headerCols += '<th style="padding:9px 10px;text-align:right;font-weight:700;color:#64748b;font-size:11px;background:#f8fafc">' +
          DEPT_ICONS[dept] + ' ' + dept.split(' ')[0] + '</th>';
      });
      headerCols += '<th style="padding:9px 12px;text-align:right;font-weight:700;color:#64748b;background:#f8fafc">Total</th>';

      // Find max per dept for highlighting
      var deptMaxes = {};
      var deptMins  = {};
      DEPT_KEYS.forEach(function(dept) {
        var vals = [];
        for (var mi2 = 1; mi2 <= 12; mi2++) {
          var v = yearData[mi2] && yearData[mi2].byDept[dept] ? yearData[mi2].byDept[dept].qr : 0;
          if (v > 0) vals.push(v);
        }
        deptMaxes[dept] = vals.length > 0 ? Math.max.apply(null, vals) : 0;
        deptMins[dept]  = vals.length > 1 ? Math.min.apply(null, vals) : 0;
      });

      var rows = '';
      for (var mi = 1; mi <= 12; mi++) {
        var md   = yearData[mi];
        var isCur = (ry === CY && mi === new Date().getMonth()+1);
        var hasD  = md && md.qr > 0;
        var rowBg = isCur ? '#e0f2fe' : (mi%2===0?'#f8fafc':'#fff');
        rows += '<tr style="background:' + rowBg + (isCur?';font-weight:700':'') + '">';
        rows += '<td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;white-space:nowrap">' +
          MONTH_NAMES[mi-1] + (isCur?' ◀':'') + '</td>';
        DEPT_KEYS.forEach(function(dept) {
          var dv  = md && md.byDept[dept] ? md.byDept[dept].qr : 0;
          var isMax = dv > 0 && dv === deptMaxes[dept];
          var isMin = dv > 0 && dv === deptMins[dept] && deptMins[dept] !== deptMaxes[dept];
          var bg  = isMax ? 'background:#f0fdf4;color:#16a34a;font-weight:800' :
                    isMin ? 'background:#fef2f2;color:#dc2626' : 'color:#0d1b2e';
          rows += '<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:11px;' + bg + '">' +
            (dv > 0 ? fmtMoney(dv) : '<span style="color:#e2e8f0">—</span>') + '</td>';
        });
        rows += '<td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#0d1b2e">' +
          (hasD ? fmtMoney(md.qr) : '—') + '</td>';
        rows += '</tr>';
      }
      // Totals row
      rows += '<tr style="background:#0d1b2e;color:#c9a84c;font-weight:800">';
      rows += '<td style="padding:9px 12px">TOTAL</td>';
      DEPT_KEYS.forEach(function(dept) {
        rows += '<td style="padding:9px 10px;text-align:right;font-size:11px">' + fmtMoney(deptYear[dept].qr) + '</td>';
      });
      rows += '<td style="padding:9px 12px;text-align:right">' + fmtMoney(yrQR) + '</td>';
      rows += '</tr>';

      return '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
        '<thead><tr>' + headerCols + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div style="margin-top:8px;font-size:10px;color:#64748b">🟢 Best month per department &nbsp; 🔴 Lowest month per department</div>';
    })());

  // ── SECTION 5: Top 10 by Revenue ─────────────────────────────
  html += _rSection('💰 Top 10 Items by Revenue — ' + ry, _rTopTable(topByRev, 'qr', yrQR));

  // ── SECTION 6: Top 10 by Volume ──────────────────────────────
  html += _rSection('📦 Top 10 Items by Volume (Pieces) — ' + ry, _rTopTable(topByVol, 'pcs', yrPCS));

  // ── SECTION 7: Top 10 by KG ──────────────────────────────────
  html += _rSection('⚖️ Top 10 Items by Weight (KG) — ' + ry, _rTopTable(topByKG, 'kg', yrKG));

  wrap.innerHTML = html;
}

// ── Report helper: card ──────────────────────────────────────
function _rCard(label, value, sub, color, bg) {
  return '<div style="background:' + bg + ';border:1.5px solid ' + color + '33;border-radius:12px;padding:14px 16px">' +
    '<div style="font-size:10px;font-weight:700;color:' + color + ';letter-spacing:.8px;margin-bottom:4px">' + label.toUpperCase() + '</div>' +
    '<div style="font-size:20px;font-weight:800;color:' + color + ';line-height:1.2">' + value + '</div>' +
    '<div style="font-size:11px;color:#94a3b8;margin-top:3px">' + sub + '</div>' +
    '</div>';
}

// ── Report helper: section wrapper ───────────────────────────
function _rSection(title, innerHtml) {
  return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:20px">' +
    '<div style="background:#0d1b2e;padding:12px 18px;font-size:13px;font-weight:800;color:#c9a84c">' + title + '</div>' +
    '<div style="padding:16px;overflow-x:auto">' + innerHtml + '</div>' +
    '</div>';
}

// ── Report helper: top items table ────────────────────────────
function _rTopTable(items, metric, total) {
  var labels = {qr:'Revenue (QR)', pcs:'Pieces', kg:'KG'};
  var fmtVal = function(item) {
    if (metric === 'qr')  return fmtMoney(item.qr);
    if (metric === 'pcs') return item.pcs.toLocaleString() + ' pcs';
    if (metric === 'kg')  return Math.ceil(item.kg) + ' kg';
    return '';
  };
  var html = '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#f8fafc">' +
    '<th style="padding:8px 12px;text-align:left;font-weight:700;color:#64748b">#</th>' +
    '<th style="padding:8px 12px;text-align:left;font-weight:700;color:#64748b">Item</th>' +
    '<th style="padding:8px 12px;text-align:left;font-weight:700;color:#64748b">Dept</th>' +
    '<th style="padding:8px 12px;text-align:right;font-weight:700;color:#64748b">' + labels[metric] + '</th>' +
    '<th style="padding:8px 12px;text-align:right;font-weight:700;color:#64748b">% of Total</th>' +
    '<th style="padding:8px 40px 8px 12px;text-align:left;font-weight:700;color:#64748b">Share</th>' +
    '</tr></thead><tbody>';
  items.forEach(function(item, idx) {
    var val = metric === 'qr' ? item.qr : metric === 'pcs' ? item.pcs : item.kg;
    var pct = total > 0 ? (val / total * 100) : 0;
    var col = DEPT_COLORS[item.dept] || '#0d1b2e';
    html += '<tr style="border-bottom:1px solid #f1f5f9">' +
      '<td style="padding:9px 12px;color:#94a3b8;font-weight:700">' + (idx+1) + '</td>' +
      '<td style="padding:9px 12px;font-weight:600;color:#0d1b2e">' + item.name + '</td>' +
      '<td style="padding:9px 12px"><span style="font-size:10px;background:' + col + '22;color:' + col + ';padding:2px 7px;border-radius:10px;font-weight:700">' + item.dept + '</span></td>' +
      '<td style="padding:9px 12px;text-align:right;font-weight:700;color:#0d1b2e">' + fmtVal(item) + '</td>' +
      '<td style="padding:9px 12px;text-align:right;color:#64748b">' + pct.toFixed(1) + '%</td>' +
      '<td style="padding:9px 12px">' +
        '<div style="width:120px;background:#e2e8f0;border-radius:4px;height:6px">' +
          '<div style="width:' + Math.min(pct*4,100).toFixed(0) + '%;background:' + col + ';height:100%;border-radius:4px"></div></div></td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  return html;
}


// ════════════════════════════════════════════════════════════════
//  FINANCE
// ════════════════════════════════════════════════════════════════
function renderFinance() {
  const m = parseInt(document.getElementById('fin-month')?.value || new Date().getMonth() + 1);
  const nd = dim(CY, m); const mName = MONTH_NAMES[m-1];
  // Prev month last day received → posted on day 1 of this month
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? CY - 1 : CY;
  const prevNd = dim(prevY, prevM);
  const prevRecvD = new Date(prevY, prevM - 1, prevNd);
  const firstPostD = new Date(CY, m - 1, 1);
  const lastRecvD  = new Date(CY, m - 1, nd);
  const lastPostD  = new Date(CY, m, 1); // next month day 1

  let rows = '';
  let mPostedTot = 0;
  const dTots = DEPT_KEYS.map(() => 0);

  // ── Row 0: prev month last day received → posted on day 1 of this month ──
  // Read directly from previous year/month actual data
  // Use previous year's prices for the carry-in row (not current year)
  const prevPRICES = loadPR(prevY);
  function getPrevP(d, i) { return prevPRICES[d]?.[i]?.[1] ?? MASTER[d][i][1]; }
  const prevDQRs = DEPT_KEYS.map(function(dept) {
    var v = 0;
    MASTER[dept].forEach(function(_, i) { v += getVal(prevY, prevM, dept, i, prevNd - 1) * getPrevP(dept, i); });
    return v;
  });
  const prevDTot = prevDQRs.reduce(function(a,b){ return a+b; }, 0);
  if (prevDTot > 0 || true) { // always show this row for clarity
    rows += '<tr style="background:#fffbeb">' +
      '<td style="text-align:left;color:#92400e;font-weight:600">↩ ' + prevNd + ' ' + MONTH_NAMES[prevM-1].substring(0,3) + '</td>' +
      '<td class="rc" style="color:#92400e">' + DAY_NAMES[prevRecvD.getDay()] + '</td>' +
      '<td class="rc" style="color:#92400e">' + fmtDate(prevRecvD) + ' <span style="font-size:10px;opacity:.6">(prev month)</span></td>' +
      prevDQRs.map(function(v){ return '<td>' + (v > 0 ? f2(v) : '') + '</td>'; }).join('') +
      '<td class="tc">' + (prevDTot > 0 ? f2(prevDTot) : '—') + '</td>' +
      '<td class="pc" style="color:#166534;font-weight:700">' + DAY_NAMES[firstPostD.getDay()] + '</td>' +
      '<td class="pc" style="color:#166534;font-weight:700">' + fmtDate(firstPostD) + '</td>' +
      '<td class="pc" style="color:#166534;font-weight:700">' + (prevDTot > 0 ? f2(prevDTot) : '—') + '</td>' +
      '</tr>';
    mPostedTot += prevDTot;
    prevDQRs.forEach(function(v, di){ dTots[di] += v; });
  }

  // ── Rows day 1..(nd-1): received day d → posted day d+1 (still this month) ──
  for (var d = 1; d <= nd - 1; d++) {
    const recvD = new Date(CY, m - 1, d);
    const postD = new Date(CY, m - 1, d + 1);
    let dTot = 0;
    const dQRs = DEPT_KEYS.map(function(dept, di) {
      let v = 0;
      MASTER[dept].forEach(function(_, i) { v += getVal(CY, m, dept, i, d - 1) * getPriceForCalc(dept, i, CY, m, d); });
      dTot += v; dTots[di] += v; return v;
    });
    mPostedTot += dTot;
    rows += '<tr>' +
      '<td style="text-align:left">' + d + '</td>' +
      '<td class="rc">' + DAY_NAMES[recvD.getDay()] + '</td><td class="rc">' + fmtDate(recvD) + '</td>' +
      dQRs.map(function(v){ return '<td>' + (v > 0 ? f2(v) : '') + '</td>'; }).join('') +
      '<td class="tc">' + (dTot > 0 ? f2(dTot) : '') + '</td>' +
      '<td class="pc">' + DAY_NAMES[postD.getDay()] + '</td><td class="pc">' + fmtDate(postD) + '</td>' +
      '<td class="pc">' + (dTot > 0 ? f2(dTot) : '') + '</td>' +
      '</tr>';
  }

  // ── Last row: day nd received → posts NEXT MONTH day 1 (greyed out / note) ──
  {
    const recvD = new Date(CY, m - 1, nd);
    let dTot = 0;
    const dQRs = DEPT_KEYS.map(function(dept) {
      let v = 0;
      MASTER[dept].forEach(function(_, i) { v += getVal(CY, m, dept, i, nd - 1) * getPriceForCalc(dept, i, CY, m, nd); });
      dTot += v; return v;
    });
    rows += '<tr style="opacity:.55;font-style:italic">' +
      '<td style="text-align:left">' + nd + ' ↪</td>' +
      '<td class="rc">' + DAY_NAMES[recvD.getDay()] + '</td><td class="rc">' + fmtDate(recvD) + '</td>' +
      dQRs.map(function(v){ return '<td>' + (v > 0 ? f2(v) : '') + '</td>'; }).join('') +
      '<td class="tc">' + (dTot > 0 ? f2(dTot) : '') + '</td>' +
      '<td class="pc">' + DAY_NAMES[lastPostD.getDay()] + '</td><td class="pc">' + fmtDate(lastPostD) + ' <span style="font-size:10px">(next month)</span></td>' +
      '<td class="pc" style="color:#6b7a8d">→ next month</td>' +
      '</tr>';
    // Save this month last-day data so next month picks it up
    var lastDayData = {};
    DEPT_KEYS.forEach(function(dept, di) { lastDayData[dept] = dQRs[di]; });
    try { _STORE.setItem('pearl_prevday_' + CY + '_' + (m === 12 ? 1 : m + 1), JSON.stringify(lastDayData)); } catch(e) {}
  }

  document.getElementById('finance-wrap').innerHTML =
    '<div class="fin-warn">⚠️ Items <strong>received</strong> on one date are <strong>posted to finance</strong> on the next calendar day. ' +
    'The <span style="background:#fffbeb;padding:1px 5px;border-radius:4px;color:#92400e">highlighted row</span> shows the last day of the previous month posted on ' + fmtDate(firstPostD) + '. ' +
    'Day ' + nd + ' <em>(' + fmtDate(lastRecvD) + ')</em> posts on <strong>' + fmtDate(lastPostD) + '</strong> (next month).</div>' +
    '<div class="card"><div class="tscroll"><table class="fin">' +
    '<thead><tr><th>Recv Day</th><th>Receiving Day</th><th>Receiving Date</th>' +
    DEPT_KEYS.map(function(d){ return '<th>' + d + '</th>'; }).join('') +
    '<th>Daily Total</th><th>Posting Day</th><th>Posting Date</th><th>Posted QR</th>' +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '<tfoot><tr><td colspan="3">POSTED THIS MONTH TOTAL</td>' +
    dTots.map(function(v){ return '<td>' + f2(v) + '</td>'; }).join('') +
    '<td>' + f2(mPostedTot) + '</td><td colspan="2"></td><td>' + f2(mPostedTot) + '</td>' +
    '</tr></tfoot>' +
    '</table></div></div>';
}

// ════════════════════════════════════════════════════════════════
//  PRICES
// ════════════════════════════════════════════════════════════════
// ── Bulk Price Adjustment ─────────────────────────────────────
// ── Price Change Manager ─────────────────────────────────────
function pcmUpdateUI() {
  var mode = document.getElementById('pcm-mode')?.value;
  var sw = document.getElementById('pcm-source-wrap');
  if (sw) sw.style.display = mode === 'copy' ? 'block' : 'none';
}

function pcmSyncDates() {
  var yr = parseInt(document.getElementById('pcm-target-year')?.value) || CY;
  var fm = document.getElementById('pcm-from-month')?.value;
  var tm = document.getElementById('pcm-to-month')?.value;
  if (fm) {
    var mm = String(fm).padStart(2,'0');
    document.getElementById('pcm-from-date').value = yr + '-' + mm + '-01';
  }
  if (tm) {
    var tmm = String(tm).padStart(2,'0');
    var lastDay = new Date(yr, parseInt(tm), 0).getDate();
    document.getElementById('pcm-to-date').value = yr + '-' + tmm + '-' + String(lastDay).padStart(2,'0');
  }
  pcmPreview();
}

function pcmGetNewPrices() {
  var mode     = document.getElementById('pcm-mode')?.value || 'adjust';
  var sourceYr = parseInt(document.getElementById('pcm-source-year')?.value) || CY;
  var targetYr = parseInt(document.getElementById('pcm-target-year')?.value) || CY;
  var dept     = document.getElementById('pcm-dept')?.value || 'ALL';
  var pct      = parseFloat(document.getElementById('pcm-pct')?.value) || 0;
  var factor   = 1 + pct / 100;
  var depts    = dept === 'ALL' ? DEPT_KEYS : [dept];
  // Get base prices
  var basePR = mode === 'copy' ? loadPR(sourceYr) : loadPR(targetYr);
  var newPrices = {};
  depts.forEach(function(d) {
    var base = basePR[d] || MASTER[d];
    newPrices[d] = base.map(function(item) {
      var newP = pct !== 0 ? Math.round(item[1] * factor * 10000) / 10000 : item[1];
      return [item[0], newP, item[2]];
    });
  });
  return { newPrices: newPrices, depts: depts, targetYr: targetYr, dept: dept, pct: pct, mode: mode };
}

function pcmPreview() {
  var fromDate = document.getElementById('pcm-from-date')?.value;
  var toDate   = document.getElementById('pcm-to-date')?.value;
  var wrap = document.getElementById('pcm-preview-wrap');
  var content2 = document.getElementById('pcm-preview-content');
  if (!fromDate) { if (wrap) wrap.style.display = 'none'; return; }
  var res = pcmGetNewPrices();
  if (!res) return;
  // Show period summary
  var periodStr = fromDate + (toDate ? ' → ' + toDate : ' → end of year');
  var html = '<div style="margin-bottom:10px;font-size:12px;color:#0d1b2e"><strong>Effective period:</strong> ' + periodStr + '</div>';
  // Show sample prices per dept (first 3 items)
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">';
  res.depts.forEach(function(d) {
    var targetPR = loadPR(res.targetYr);
    html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px">';
    html += '<div style="font-size:11px;font-weight:800;color:#0d1b2e;margin-bottom:8px">' + (DEPT_ICONS[d]||'') + ' ' + d + '</div>';
    html += '<table style="width:100%;border-collapse:collapse;font-size:11px">';
    html += '<tr style="background:#f8fafc"><td style="padding:4px 8px;font-weight:700;color:#64748b">ITEM</td><td style="padding:4px 8px;text-align:right;font-weight:700;color:#64748b">BEFORE</td><td style="padding:4px 8px;text-align:right;font-weight:700;color:#64748b">AFTER</td></tr>';
    var items = res.newPrices[d] || [];
    items.slice(0,4).forEach(function(item, i) {
      var oldP = (targetPR[d] && targetPR[d][i]) ? targetPR[d][i][1] : MASTER[d][i][1];
      var newP = item[1];
      var changed = Math.abs(newP - oldP) > 0.0001;
      html += '<tr><td style="padding:4px 8px;color:#1a2332">' + item[0] + '</td>';
      html += '<td style="padding:4px 8px;text-align:right;color:#64748b">' + oldP.toFixed(4) + '</td>';
      html += '<td style="padding:4px 8px;text-align:right;font-weight:700;color:' + (changed ? (newP > oldP ? '#16a34a' : '#dc2626') : '#64748b') + '">' + newP.toFixed(4) + '</td></tr>';
    });
    if (items.length > 4) html += '<tr><td colspan="3" style="padding:4px 8px;color:#94a3b8;font-style:italic">+ ' + (items.length - 4) + ' more items</td></tr>';
    html += '</table></div>';
  });
  html += '</div>';
  if (res.pct !== 0) {
    var dir = res.pct > 0 ? '+' : '';
    html += '<div style="margin-top:10px;padding:8px 12px;background:#f0fdf4;border-radius:7px;font-size:12px;color:#15803d;font-weight:600">✅ ' + dir + res.pct + '% adjustment · ' + res.depts.length + ' department(s) · Schedule will be saved from ' + fromDate + (toDate ? ' to ' + toDate : ' onwards') + '</div>';
  }
  content2.innerHTML = html;
  wrap.style.display = 'block';
}

function pcmApply() {
  var fromDate = document.getElementById('pcm-from-date')?.value;
  var toDate   = document.getElementById('pcm-to-date')?.value;
  var msg      = document.getElementById('pcm-msg');
  if (!fromDate) { msg.style.color='#dc2626'; msg.textContent='⚠️ Set an effective From Date first'; return; }
  var res = pcmGetNewPrices();
  if (!res) return;

  // ── CRITICAL FIX: Never overwrite the base year price table ──
  // The base prices (pearl_prices_YYYY) are the fallback for dates with NO schedule.
  // Overwriting them would change all past months that have no schedule entry.
  // Instead: ONLY save a schedule entry for the from-date.
  // The schedule entry is what controls prices from that date forwards.
  // Dates before from-date have no schedule → they keep using base prices → untouched.

  // Snapshot current base prices to use as the "restore" entry if to-date is set
  var currentPR = loadPR(res.targetYr);

  // Save new prices ONLY as a schedule entry — DO NOT touch base year prices
  _PRICE_SCHEDULE = _PRICE_SCHEDULE.filter(function(e) {
    return !(e.effectiveDate === fromDate && e.year === res.targetYr && e.dept === res.dept);
  });
  _PRICE_SCHEDULE.push({
    effectiveDate: fromDate,
    year: res.targetYr,
    dept: res.dept,
    prices: res.newPrices,
    savedAt: new Date().toISOString(),
    pct: res.pct
  });

  // If to-date set, restore OLD base prices after the range ends
  if (toDate) {
    var nextDay = new Date(toDate);
    nextDay.setDate(nextDay.getDate() + 1);
    var nextDateStr = nextDay.toISOString().slice(0,10);
    var prevSnap = {};
    res.depts.forEach(function(d) {
      prevSnap[d] = (currentPR[d] || MASTER[d]).map(function(item){ return [...item]; });
    });
    _PRICE_SCHEDULE = _PRICE_SCHEDULE.filter(function(e) {
      return !(e.effectiveDate === nextDateStr && e.year === res.targetYr && e.dept === res.dept);
    });
    _PRICE_SCHEDULE.push({
      effectiveDate: nextDateStr,
      year: res.targetYr,
      dept: res.dept,
      prices: prevSnap,
      savedAt: new Date().toISOString(),
      note: 'Auto-restored after range end'
    });
  }

  _PRICE_SCHEDULE.sort(function(a,b){ return a.effectiveDate.localeCompare(b.effectiveDate); });
  savePriceSchedule();

  var dir = res.pct > 0 ? '+' : '';
  msg.style.color = '#16a34a';
  msg.textContent = '✅ Done! ' + (res.pct !== 0 ? dir + res.pct + '% · ' : '') + 'Schedule saved from ' + fromDate + (toDate ? ' to ' + toDate : ' onwards');
  setTimeout(function(){ msg.textContent = ''; }, 6000);
  renderPriceScheduleList();
  try { renderDash(); } catch(e) {}
  try { renderEntry(); } catch(e) {}
  try { renderFinance(); } catch(e) {}
}


// ── Delete a specific schedule entry by date+year ──
function deleteScheduleEntry(effectiveDate, year) {
  var before = _PRICE_SCHEDULE.length;
  _PRICE_SCHEDULE = _PRICE_SCHEDULE.filter(function(e) {
    return !(e.effectiveDate === effectiveDate && e.year === year);
  });
  savePriceSchedule();
  var after = _PRICE_SCHEDULE.length;
  toast('🗑 Schedule entry deleted (' + (before-after) + ' removed)', 'ok');
  renderPriceScheduleList();
  try { renderDash(); } catch(e) {}
  try { renderEntry(); } catch(e) {}
  try { renderFinance(); } catch(e) {}
}

// ── Emergency: restore 2026 base prices from cloud backup ──

// ── Restore ONLY prices from a specific backup version ──
function restorePricesFromBackup(verId) {
  if (!window._fbLoadKey) { toast('❌ Firebase not connected', 'err'); return; }
  toast('⏳ Loading backup prices...', 'info');
  window._fbLoadKey('pearl/backup/versions/' + verId).then(function(backup) {
    if (!backup) { toast('❌ Backup not found', 'err'); return; }

    // Prices may be stored in backup.prices or backup.settings.prices
    var priceData = null;
    if (backup.prices) {
      priceData = backup.prices;
    } else if (backup.settings && backup.settings.prices) {
      priceData = backup.settings.prices;
    }

    // Try reading from Firebase pearl/prices path directly if not in backup
    if (!priceData) {
      // Fall back: read directly from pearl/prices in Firebase
      window._fbLoadKey('pearl/prices').then(function(fbPrices) {
        if (!fbPrices) { toast('❌ No price data found in backup or Firebase', 'err'); return; }
        _applyRestoredPrices(fbPrices);
      });
      return;
    }

    _applyRestoredPrices(priceData);
  }).catch(function(e) { toast('❌ Failed: ' + e.message, 'err'); });
}

// ── Restore prices directly from Firebase pearl/prices path ──
function restorePricesFromFirebase() {
  if (!window._fbLoadKey) { toast('❌ Firebase not connected', 'err'); return; }
  toast('⏳ Reading prices from Firebase...', 'info');

  // Try pearl/prices/2026 first
  window._fbLoadKey('pearl/prices/2026').then(function(prices2026) {
    if (prices2026 && typeof prices2026 === 'object' && Object.keys(prices2026).length > 0) {
      // Check it has dept keys
      var hasDepts = DEPT_KEYS.some(function(d) { return prices2026[d]; });
      if (hasDepts) {
        _applyRestoredPrices({'2026': prices2026});
        return;
      }
    }
    // Try flat pearl/prices
    return window._fbLoadKey('pearl/prices').then(function(allPrices) {
      if (!allPrices) { toast('❌ No prices found in Firebase', 'err'); return; }
      _applyRestoredPrices(allPrices);
    });
  }).catch(function(e) {
    toast('❌ Failed to load prices: ' + (e.message||e), 'err');
  });
}

function _applyRestoredPrices(priceData) {
  var restored = 0;
  // priceData may be {2025: {...}, 2026: {...}} or just {dept: [...]}
  // Detect format
  var years = Object.keys(priceData).filter(function(k) { return /^\d{4}$/.test(k); });
  if (years.length > 0) {
    // Year-keyed format
    years.forEach(function(y) {
      var yr = parseInt(y);
      var prices = priceData[y];
      if (!prices || typeof prices !== 'object') return;
      try { _STORE.setItem(prKey(yr), JSON.stringify(prices)); } catch(e) {}
      if (window._fbSaveKey) window._fbSaveKey('pearl/prices/' + yr, prices);
      if (yr === CY) PRICES = prices;
      restored++;
    });
  } else {
    // Direct dept format — assume current year
    try { _STORE.setItem(prKey(CY), JSON.stringify(priceData)); } catch(e) {}
    if (window._fbSaveKey) window._fbSaveKey('pearl/prices/' + CY, priceData);
    PRICES = priceData;
    restored = 1;
  }

  if (restored === 0) { toast('⚠️ No price data could be restored', 'warn'); return; }

  // Clear bad schedule entries
  _PRICE_SCHEDULE = [];
  savePriceSchedule();

  toast('✅ Prices restored for ' + restored + ' year(s) — schedule cleared', 'ok');
  setTimeout(function() {
    try { renderDash(); } catch(e) {}
    try { renderEntry(); } catch(e) {}
    try { renderFinance(); } catch(e) {}
    try { renderPriceScheduleList(); } catch(e) {}
  }, 500);
}

function emergencyRestoreBasePrices(year) {
  if (!window._fbLoadKey) { toast('Firebase not connected', 'err'); return; }
  var fbPath = 'pearl/prices/' + year;
  toast('⏳ Restoring base prices from Firebase...', 'info');
  window._fbLoadKey(fbPath).then(function(fbPrices) {
    if (!fbPrices) {
      // Try alternate path
      return window._fbLoadKey('pearl/settings/prices_' + year);
    }
    return fbPrices;
  }).then(function(fbPrices) {
    if (!fbPrices) {
      toast('⚠️ No backup prices found in Firebase for ' + year, 'err');
      return;
    }
    // Restore to localStorage
    try { _STORE.setItem(prKey(year), JSON.stringify(fbPrices)); } catch(e) {}
    if (year === CY) PRICES = fbPrices;
    toast('✅ Base prices for ' + year + ' restored from Firebase', 'ok');
    try { renderDash(); } catch(e) {}
    try { renderEntry(); } catch(e) {}
    try { renderFinance(); } catch(e) {}
  }).catch(function(e) {
    toast('❌ Restore failed: ' + e.message, 'err');
  });
}

function previewPadj() {
  var pct = parseFloat(document.getElementById('padj-pct').value);
  var dept = document.getElementById('padj-dept').value;
  var yr = parseInt(document.getElementById('padj-year').value);
  var prev = document.getElementById('padj-preview');
  if (isNaN(pct) || pct === 0) { prev.textContent = 'Enter % to preview'; prev.style.color = '#64748b'; return; }
  var pr = loadPR(yr);
  var depts = dept === 'ALL' ? DEPT_KEYS : [dept];
  var count = 0, sampleOld = 0, sampleNew = 0;
  depts.forEach(function(d) {
    (pr[d] || MASTER[d]).forEach(function(item, i) {
      var oldP = pr[d] ? pr[d][i][1] : MASTER[d][i][1];
      var newP = Math.round(oldP * (1 + pct / 100) * 10000) / 10000;
      count++;
      if (count === 1) { sampleOld = oldP; sampleNew = newP; }
    });
  });
  var dir = pct > 0 ? '↑ +' : '↓ ';
  prev.style.color = pct > 0 ? '#16a34a' : '#dc2626';
  prev.textContent = dir + Math.abs(pct) + '% · ' + count + ' items · e.g. ' + sampleOld.toFixed(4) + ' → ' + sampleNew.toFixed(4) + ' QR';
}

function applyPadj() {
  var pct = parseFloat(document.getElementById('padj-pct').value);
  var dept = document.getElementById('padj-dept').value;
  var yr = parseInt(document.getElementById('padj-year').value);
  if (isNaN(pct) || pct === 0) { toast('Enter a % value first (e.g. -5 or +10)', 'err'); return; }
  var pr = loadPR(yr);
  var depts = dept === 'ALL' ? DEPT_KEYS : [dept];
  var count = 0;
  depts.forEach(function(d) {
    if (!pr[d]) pr[d] = MASTER[d].map(function(item) { return [...item]; });
    pr[d].forEach(function(item, i) {
      var oldP = item[1];
      item[1] = Math.round(oldP * (1 + pct / 100) * 10000) / 10000;
      count++;
    });
  });
  savePR(yr, pr);
  // If adjusting current year, reload PRICES
  if (yr === CY) { PRICES = pr; }
  var dir = pct > 0 ? '+' : '';
  toast('✅ ' + dir + pct + '% applied to ' + count + ' items · Year ' + yr + ' · ' + (dept === 'ALL' ? 'All Depts' : dept), 'ok');
  document.getElementById('padj-pct').value = '';
  document.getElementById('padj-preview').textContent = 'Enter % to preview';
  document.getElementById('padj-preview').style.color = '#64748b';
  renderPriceTable();
}

function buildYearOpts(el, selectedY) {
  el.innerHTML = '';
  for (var y = 2025; y <= 2035; y++) { var o = document.createElement('option'); o.value = y; o.textContent = y; if (y === selectedY) o.selected = true; el.appendChild(o); }
}
function buildDeptOpts(el, selectedD, includeAll) {
  el.innerHTML = includeAll ? '<option value="ALL">All Departments</option>' : '';
  DEPT_KEYS.forEach(function(d) { var o = document.createElement('option'); o.value = d; o.textContent = DEPT_ICONS[d] + ' ' + d; if (d === selectedD) o.selected = true; el.appendChild(o); });
}

function showPriceSubTab(name) {
  ['history','list','tools','schedules'].forEach(function(t) {
    var el = document.getElementById('ptab-' + t);
    var btn = document.getElementById('ptab-btn-' + t);
    if (el) el.style.display = t === name ? 'block' : 'none';
    if (btn) {
      btn.style.borderBottomColor = t === name ? '#0d1b2e' : 'transparent';
      btn.style.color = t === name ? '#0d1b2e' : '#64748b';
      btn.style.fontWeight = t === name ? '700' : '600';
    }
  });
  if (name === 'schedules') renderPriceScheduleList();
  if (name === 'history')   renderRateHistory();
}

function pschQuickMonth(m) {
  if (!m) return;
  var yr = parseInt(document.getElementById('psch-year').value) || new Date().getFullYear();
  var mm = String(m).padStart(2,'0');
  document.getElementById('psch-date').value = yr + '-' + mm + '-01';
  // Reset dropdown back to placeholder
  document.getElementById('psch-month-quick').value = '';
}

function scheduleCurrentPrices() {
  var dateVal = document.getElementById('psch-date').value;
  var year    = parseInt(document.getElementById('psch-year').value);
  var dept    = document.getElementById('psch-dept').value;
  var msg     = document.getElementById('psch-msg');
  if (!dateVal) { msg.style.color='#dc2626'; msg.textContent='⚠️ Please select an effective date'; return; }
  var snapshot = {};
  var depts = dept === 'ALL' ? DEPT_KEYS : [dept];
  depts.forEach(function(d) {
    snapshot[d] = (PRICES[d] || MASTER[d]).map(function(item) { return [item[0], item[1], item[2]]; });
  });
  _PRICE_SCHEDULE = _PRICE_SCHEDULE.filter(function(e) {
    return !(e.effectiveDate === dateVal && e.year === year && e.dept === dept);
  });
  _PRICE_SCHEDULE.push({ effectiveDate: dateVal, year: year, dept: dept, prices: snapshot, savedAt: new Date().toISOString() });
  _PRICE_SCHEDULE.sort(function(a,b) { return a.effectiveDate.localeCompare(b.effectiveDate); });
  savePriceSchedule();
  msg.style.color='#16a34a';
  msg.textContent='✅ Scheduled! Prices from ' + dateVal + ' saved.';
  setTimeout(function(){ msg.textContent=''; }, 4000);
  renderPriceScheduleList();
}

function fixScheduleReverse() {
  var dateEl = document.getElementById('psch-fix-date');
  var pctEl  = document.getElementById('psch-fix-pct');
  var msgEl  = document.getElementById('psch-fix-msg');
  if (!dateEl.value) { msgEl.style.color='#dc2626'; msgEl.textContent='⚠️ Select a schedule date'; return; }
  var pct = parseFloat(pctEl.value);
  if (isNaN(pct) || pct === 0) { msgEl.style.color='#dc2626'; msgEl.textContent='⚠️ Enter the % that was applied'; return; }
  var factor = 1 + pct / 100; // e.g. 1.035 for +3.5%
  // Find the schedule entry
  var idx = _PRICE_SCHEDULE.findIndex(function(e) { return e.effectiveDate === dateEl.value; });
  if (idx === -1) { msgEl.style.color='#dc2626'; msgEl.textContent='⚠️ Schedule entry not found'; return; }
  var entry = _PRICE_SCHEDULE[idx];
  // Reverse the % on every price in that snapshot
  var fixedPrices = {};
  Object.keys(entry.prices).forEach(function(dept) {
    fixedPrices[dept] = entry.prices[dept].map(function(item) {
      return [item[0], parseFloat((item[1] / factor).toFixed(4)), item[2]];
    });
  });
  _PRICE_SCHEDULE[idx] = Object.assign({}, entry, { prices: fixedPrices, savedAt: new Date().toISOString() });
  savePriceSchedule();
  msgEl.style.color = '#16a34a';
  msgEl.textContent = '✅ Fixed! Schedule ' + dateEl.value + ' prices reversed by -' + pct + '%';
  setTimeout(function(){ msgEl.textContent=''; }, 5000);
  renderPriceScheduleList();
  try { renderDash(); } catch(e){}
  try { renderEntry(); } catch(e){}
}

function deletePriceSchedule(idx) {
  if (!confirm('Delete this price schedule entry?')) return;
  _PRICE_SCHEDULE.splice(idx, 1);
  savePriceSchedule();
  renderPriceScheduleList();
}

function renderPriceScheduleList() {
  var el = document.getElementById('psch-list');
  if (!el) return;
  // Populate fix-tool date selector
  var fixSel = document.getElementById('psch-fix-date');
  if (fixSel) {
    fixSel.innerHTML = '<option value="">— Select schedule —</option>';
    _PRICE_SCHEDULE.forEach(function(e) {
      var o = document.createElement('option'); o.value = e.effectiveDate; o.textContent = e.effectiveDate; fixSel.appendChild(o);
    });
  }
  if (_PRICE_SCHEDULE.length === 0) {
    el.innerHTML = '<div style="color:#94a3b8;font-style:italic;padding:8px 0">No scheduled price changes. Current prices apply to all dates.</div>';
    return;
  }
  var html = '<div style="display:flex;flex-direction:column;gap:8px">';
  _PRICE_SCHEDULE.forEach(function(entry, idx) {
    var deptLabel = entry.dept === 'ALL' ? 'All Departments' : entry.dept;
    var deptCount = entry.prices ? Object.keys(entry.prices).length : 0;
    var today = new Date().toISOString().slice(0,10);
    var isFuture = entry.effectiveDate > today;
    var isToday  = entry.effectiveDate === today;
    var badge = isFuture ? '<span style="background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:6px">UPCOMING</span>'
              : isToday  ? '<span style="background:#d1fae5;color:#065f46;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:6px">TODAY</span>'
              : '<span style="background:#f1f5f9;color:#64748b;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:6px">ACTIVE</span>';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px">';
    html += '<div style="display:flex;align-items:center;gap:10px">';
    html += '<span style="font-size:16px">📅</span><div>';
    html += '<div style="font-weight:700;color:#0d1b2e;font-size:13px">' + entry.effectiveDate + badge + '</div>';
    html += '<div style="color:#64748b;font-size:11px;margin-top:2px">Year: ' + (entry.year||'all') + ' · Dept: ' + deptLabel + ' · ' + deptCount + ' dept(s) captured</div>';
    html += '</div></div>';
    html += '<button onclick="deleteScheduleEntry(' + JSON.stringify(entry.effectiveDate) + ',' + (entry.year||0) + ')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer">🗑 Delete</button>';
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

// ── Import Prices from Excel ─────────────────────────────────
var _pxlData = null; // parsed preview data {dept: [{name, price, kg}]}

function downloadPriceTemplate() {
  // Build a minimal CSV-based download hint — actual template is separate file
  // Just open the template URL if hosted, or show instruction
  alert('Please download the Pearl_Price_Upload_Template.xlsx file provided separately. Fill in the yellow (price) and blue (weight) columns and upload here.');
}

function previewPriceXL(input) {
  var file = input.files[0];
  if (!file) return;
  document.getElementById('pxl-filename').textContent = '📄 ' + file.name;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      var wb = XLSX.read(data, { type: 'array' });
      _pxlData = {};
      var mode = document.getElementById('pxl-mode').value;
      var DEPT_SHEET_MAP = {
        'Rooms Linen': 'Rooms Linen',
        'F & B': 'F & B',
        'Spa & Pool': 'Spa & Pool',
        'Uniform': 'Uniform',
        'Others': 'Others',
        'Dry Cleaning': 'Dry Cleaning'
      };
      var found = 0;
      DEPT_KEYS.forEach(function(dept) {
        var sheetName = DEPT_SHEET_MAP[dept];
        if (!sheetName || wb.SheetNames.indexOf(sheetName) === -1) return;
        var ws = wb.Sheets[sheetName];
        var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        // Row 0 = title, Row 1 = headers, Row 2+ = data
        _pxlData[dept] = [];
        for (var r = 2; r < rows.length; r++) {
          var row = rows[r];
          if (!row || row.length < 2) continue;
          var name = row[1] || '';
          var price = (row[2] !== '' && row[2] !== null && row[2] !== undefined) ? parseFloat(row[2]) : null;
          var kg    = (row[3] !== '' && row[3] !== null && row[3] !== undefined) ? parseFloat(row[3]) : null;
          if (name) _pxlData[dept].push({ name: name, price: price, kg: kg });
        }
        if (_pxlData[dept].length > 0) found++;
      });
      renderPriceXLPreview(mode, found);
    } catch(err) {
      document.getElementById('pxl-msg').style.color = '#dc2626';
      document.getElementById('pxl-msg').textContent = '❌ Error reading file: ' + err.message;
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderPriceXLPreview(mode, found) {
  var el = document.getElementById('pxl-preview');
  var btn = document.getElementById('pxl-apply-btn');
  if (!_pxlData || found === 0) {
    el.style.display = 'block';
    el.innerHTML = '<div style="color:#dc2626;font-size:12px;font-weight:600">⚠️ No matching department sheets found. Check sheet names match exactly.</div>';
    btn.style.display = 'none';
    return;
  }
  var html = '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px">PREVIEW — ' + found + ' department(s) found</div>';
  html += '<div style="display:flex;flex-direction:column;gap:8px">';
  Object.keys(_pxlData).forEach(function(dept) {
    var items = _pxlData[dept];
    var priceCount = items.filter(function(x){ return x.price !== null && !isNaN(x.price); }).length;
    var kgCount    = items.filter(function(x){ return x.kg    !== null && !isNaN(x.kg);    }).length;
    if (priceCount === 0 && kgCount === 0) return;
    html += '<div style="padding:10px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px">';
    html += '<div style="font-weight:700;color:#0d1b2e;font-size:12px;margin-bottom:6px">' + dept + '</div>';
    html += '<div style="font-size:11px;color:#64748b">';
    html += priceCount + ' prices to update';
    if (mode === 'both') html += ' · ' + kgCount + ' weights to update';
    html += '</div>';
    // Show first 3 items as sample
    var samples = items.filter(function(x){ return x.price !== null && !isNaN(x.price); }).slice(0,3);
    if (samples.length > 0) {
      html += '<div style="margin-top:6px;font-size:11px;color:#475569">';
      samples.forEach(function(s){ html += '<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:10px;margin-right:4px;margin-bottom:3px;display:inline-block">' + s.name + ': ' + s.price.toFixed(4) + ' QR</span>'; });
      if (items.filter(function(x){ return x.price !== null; }).length > 3) html += '<span style="color:#94a3b8">+ more</span>';
      html += '</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  el.style.display = 'block';
  el.innerHTML = html;
  btn.style.display = 'inline-block';
}

function applyPriceXL() {
  if (!_pxlData) return;
  var year = parseInt(document.getElementById('pxl-year').value);
  var mode = document.getElementById('pxl-mode').value;
  var msg  = document.getElementById('pxl-msg');
  var pr = loadPR(year);
  var updated = 0;
  Object.keys(_pxlData).forEach(function(dept) {
    var items = _pxlData[dept];
    if (!pr[dept]) pr[dept] = MASTER[dept].map(function(i){ return [i[0], i[1], i[2]]; });
    items.forEach(function(xlItem, idx) {
      if (idx >= pr[dept].length) return;
      if (xlItem.price !== null && !isNaN(xlItem.price)) {
        pr[dept][idx][1] = xlItem.price;
        updated++;
      }
      if (mode === 'both' && xlItem.kg !== null && !isNaN(xlItem.kg)) {
        pr[dept][idx][2] = xlItem.kg;
      }
    });
  });
  savePR(year, pr);
  if (year === CY) { PRICES = pr; }
  msg.style.color = '#16a34a';
  msg.textContent = '✅ ' + updated + ' prices updated for ' + year + '!';
  setTimeout(function(){ msg.textContent = ''; }, 5000);
  document.getElementById('pxl-preview').style.display = 'none';
  document.getElementById('pxl-apply-btn').style.display = 'none';
  document.getElementById('pxl-file').value = '';
  document.getElementById('pxl-filename').textContent = '';
  _pxlData = null;
  renderPriceTable();
}

function applyCopyPrices() {
  var fromY = parseInt(document.getElementById('pcopy-from').value);
  var toY   = parseInt(document.getElementById('pcopy-to').value);
  var dept  = document.getElementById('pcopy-dept').value;
  var msg   = document.getElementById('pcopy-msg');
  if (fromY === toY) { msg.style.color='#dc2626'; msg.textContent = '⚠️ From and To year must be different.'; return; }
  var fromPR = loadPR(fromY);
  var toPR   = loadPR(toY);
  var depts  = dept === 'ALL' ? DEPT_KEYS : [dept];
  var count  = 0;
  depts.forEach(function(d) {
    // Deep copy each item's price + kg from source year
    toPR[d] = (fromPR[d] || MASTER[d]).map(function(item) { return [item[0], item[1], item[2]]; });
    count += toPR[d].length;
  });
  savePR(toY, toPR);
  if (toY === CY) { PRICES = toPR; }
  msg.style.color = '#16a34a';
  msg.textContent = '✅ Copied ' + count + ' items from ' + fromY + ' → ' + toY + ' (' + (dept==='ALL'?'All Depts':dept) + ')';
  setTimeout(function(){ msg.textContent = ''; }, 4000);
  renderPriceTable();
}

// ══════════════════════════════════════════════════════════════
//  RATE VERSIONING ENGINE
//  Prices versioned by year + optional month override
//  Weights versioned by year only
//  Historical data NEVER affected — locked prices/weights stored per entry
// ══════════════════════════════════════════════════════════════

// ── Storage keys ──
function rvKey(y, m)   { return 'pearl_rates_' + y + (m ? '_' + m : '_base'); }
function rvWKey(y)     { return 'pearl_weights_' + y; }
function rvHistKey()   { return 'pearl_rate_history'; }

// ── Load rate version for a year+month ──
// Returns prices object {dept: [[name,price,kg],...]} or null
function loadRateVersion(y, m) {
  // Month override first
  if (m) {
    try {
      var mo = JSON.parse(_STORE.getItem(rvKey(y, m)) || 'null');
      if (mo) return mo;
    } catch(e) {}
  }
  // Year base
  try {
    var yb = JSON.parse(_STORE.getItem(rvKey(y, null)) || 'null');
    if (yb) return yb;
  } catch(e) {}
  return null;
}

// ── Save rate version ──
function saveRateVersion(y, m, prices, note, applyPrice, applyWeight) {
  var key = rvKey(y, m);
  // Build merged version: start from existing or MASTER
  var existing = loadRateVersion(y, null) || buildMasterCopy();
  var merged = JSON.parse(JSON.stringify(existing));

  // Apply new prices/weights
  DEPT_KEYS.forEach(function(dept) {
    if (!merged[dept]) merged[dept] = MASTER[dept].map(function(r){ return [...r]; });
    MASTER[dept].forEach(function(_, i) {
      if (prices && prices[dept] && prices[dept][i]) {
        if (applyPrice  !== false) merged[dept][i][1] = prices[dept][i][1];
        if (applyWeight !== false) merged[dept][i][2] = prices[dept][i][2];
      }
    });
  });

  try { _STORE.setItem(key, JSON.stringify(merged)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/rate_versions/' + y + '/' + (m || 'base'), merged);

  // Log to history
  addRateHistoryEntry({
    year: y,
    month: m || null,
    label: y + (m ? '-' + String(m).padStart(2,'0') : ' (full year)'),
    note: note || '',
    applyPrice:  applyPrice  !== false,
    applyWeight: applyWeight !== false,
    savedAt: new Date().toISOString(),
    savedBy: (_SESSION.getItem('ph_user') || 'Admin')
  });

  // Update PRICES global if this is current year base
  if (y === CY && !m) {
    PRICES = merged;
    savePR(y, merged);
  }
}

function buildMasterCopy() {
  var p = {};
  DEPT_KEYS.forEach(function(d) { p[d] = MASTER[d].map(function(r){ return [...r]; }); });
  return p;
}

// ── Get price for calculation (versioned) ──
// Priority: 1. Locked price in entry, 2. Month override, 3. Year base, 4. Previous year, 5. MASTER
function getVersionedPrice(dept, i, y, m) {
  // Month override
  try {
    var mo = JSON.parse(_STORE.getItem(rvKey(y, m)) || 'null');
    if (mo && mo[dept] && mo[dept][i]) return mo[dept][i][1];
  } catch(e) {}
  // Year base
  try {
    var yb = JSON.parse(_STORE.getItem(rvKey(y, null)) || 'null');
    if (yb && yb[dept] && yb[dept][i]) return yb[dept][i][1];
  } catch(e) {}
  // Fallback: loadPR (existing system — preserves old data)
  var pr = (y === CY) ? PRICES : loadPR(y);
  return pr[dept]?.[i]?.[1] ?? MASTER[dept][i][1];
}

function getVersionedWeight(dept, i, y) {
  // Year base weight
  try {
    var wb = JSON.parse(_STORE.getItem(rvWKey(y)) || 'null');
    if (wb && wb[dept] && wb[dept][i] !== undefined) return wb[dept][i];
  } catch(e) {}
  // Fallback: existing system
  var pr = (y === CY) ? PRICES : loadPR(y);
  return pr[dept]?.[i]?.[2] ?? MASTER[dept][i][2];
}

// ── Rate history log ──
var _RATE_HISTORY = [];
function loadRateHistory() {
  try { _RATE_HISTORY = JSON.parse(_STORE.getItem(rvHistKey()) || '[]'); } catch(e) { _RATE_HISTORY = []; }
}
function addRateHistoryEntry(entry) {
  loadRateHistory();
  _RATE_HISTORY.unshift(entry); // newest first
  if (_RATE_HISTORY.length > 200) _RATE_HISTORY = _RATE_HISTORY.slice(0, 200);
  try { _STORE.setItem(rvHistKey(), JSON.stringify(_RATE_HISTORY)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/rate_history', _RATE_HISTORY);
}

// ── Render Rate History sub-tab ──
function renderRateHistory() {
  var wrap = document.getElementById('rh-wrap');
  if (!wrap) return;

  // Populate year selector
  var rhYear = document.getElementById('rh-year');
  if (rhYear && rhYear.options.length === 0) {
    for (var y = CY - 3; y <= CY + 2; y++) {
      var o = document.createElement('option');
      o.value = y; o.textContent = y;
      if (y === CY) o.selected = true;
      rhYear.appendChild(o);
    }
  }

  // Populate dept selector
  var rhDept = document.getElementById('rh-dept');
  if (rhDept && rhDept.options.length === 1) {
    DEPT_KEYS.forEach(function(d) {
      var o = document.createElement('option'); o.value = d; o.textContent = d;
      rhDept.appendChild(o);
    });
  }

  var selYear = parseInt(rhYear?.value || CY);
  var selDept = document.getElementById('rh-dept')?.value || 'ALL';
  var selType = document.getElementById('rh-type')?.value || 'both';

  // Load rate version for selected year
  var rates = loadRateVersion(selYear, null);
  var isPast = selYear < CY;
  var isFuture = selYear > CY;

  // Year status badge
  var statusBadge = isPast
    ? '<span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">🔒 LOCKED — Historical</span>'
    : isFuture
    ? '<span style="background:#eff6ff;color:#1d4ed8;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">📅 FUTURE — Scheduled</span>'
    : '<span style="background:#f0fdf4;color:#16a34a;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">● ACTIVE — Current Year</span>';

  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">' +
    '<div style="display:flex;align-items:center;gap:10px">' +
      '<div style="font-size:15px;font-weight:800;color:#0d1b2e">' + selYear + ' Rate Card</div>' +
      statusBadge +
    '</div>';

  if (!isPast) {
    html += '<button onclick="openNewVersionModal(' + selYear + ')" style="padding:8px 16px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">➕ Add/Edit Rates</button>';
  } else {
    html += '<div style="font-size:11px;color:#94a3b8">Past year — read only. Historical data uses these locked values.</div>';
  }
  html += '</div>';

  if (!rates) {
    html += '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:13px">No rate version saved for ' + selYear + '.<br>' +
      (isPast ? 'Historical data uses the prices that were active at entry time.' : '<button onclick="openNewVersionModal(' + selYear + ')" style="margin-top:10px;padding:9px 18px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">➕ Create Rate Card for ' + selYear + '</button>') +
      '</div>';
    wrap.innerHTML = html;
    return;
  }

  // Show month override status
  var monthOverrides = [];
  for (var m2 = 1; m2 <= 12; m2++) {
    try {
      var mo = JSON.parse(_STORE.getItem(rvKey(selYear, m2)) || 'null');
      if (mo) monthOverrides.push(m2);
    } catch(e) {}
  }

  if (monthOverrides.length > 0) {
    html += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#92400e">' +
      '📅 Month overrides active for: <strong>' + monthOverrides.map(function(m){ return MONTH_NAMES[m-1]; }).join(', ') + '</strong>' +
    '</div>';
  }

  // Rate table
  var depts = selDept === 'ALL' ? DEPT_KEYS : [selDept];
  html += '<div style="overflow-x:auto">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  html += '<tr style="background:#0d1b2e">' +
    '<th style="padding:10px 14px;text-align:left;color:#c9a84c;font-weight:700;letter-spacing:.5px">DEPARTMENT</th>' +
    '<th style="padding:10px 14px;text-align:left;color:#c9a84c;font-weight:700">ITEM</th>' +
    (selType !== 'weight' ? '<th style="padding:10px 14px;text-align:right;color:#c9a84c;font-weight:700">PRICE (QR)</th>' : '') +
    (selType !== 'price'  ? '<th style="padding:10px 14px;text-align:right;color:#c9a84c;font-weight:700">WEIGHT (KG)</th>' : '') +
    (isPast ? '' : '<th style="padding:10px 14px;text-align:center;color:#c9a84c;font-weight:700">MONTH OVERRIDE</th>') +
    '</tr>';

  var rowNum = 0;
  depts.forEach(function(dept) {
    if (!rates[dept]) return;
    rates[dept].forEach(function(item, i) {
      var bg = rowNum % 2 === 0 ? '#fff' : '#f8fafc';
      // Check if month override exists for this item
      var hasOverride = monthOverrides.length > 0;
      html += '<tr style="background:' + bg + ';border-bottom:1px solid #f1f5f9">' +
        '<td style="padding:9px 14px;font-size:11px;color:#64748b">' + (i === 0 ? dept : '') + '</td>' +
        '<td style="padding:9px 14px;font-weight:600;color:#0d1b2e">' + (item[0] || 'Item ' + (i+1)) + '</td>' +
        (selType !== 'weight' ? '<td style="padding:9px 14px;text-align:right;font-weight:700;color:#0d1b2e;font-family:monospace">' + (item[1]||0).toFixed(2) + '</td>' : '') +
        (selType !== 'price'  ? '<td style="padding:9px 14px;text-align:right;font-weight:700;color:#16a34a;font-family:monospace">' + (item[2]||0).toFixed(3) + ' kg</td>' : '') +
        (isPast ? '' : '<td style="padding:9px 14px;text-align:center">' + (hasOverride ? '<span style="font-size:10px;color:#d97706;font-weight:700">⚡ Has overrides</span>' : '<span style="font-size:10px;color:#94a3b8">—</span>') + '</td>') +
        '</tr>';
      rowNum++;
    });
  });
  html += '</table></div>';

  // History log
  loadRateHistory();
  var relevant = _RATE_HISTORY.filter(function(h){ return h.year === selYear; });
  if (relevant.length > 0) {
    html += '<div style="margin-top:20px"><div style="font-size:13px;font-weight:800;color:#0d1b2e;margin-bottom:10px">📋 Change Log — ' + selYear + '</div>';
    relevant.forEach(function(h) {
      html += '<div style="display:flex;gap:12px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;flex-wrap:wrap">' +
        '<div style="font-size:12px;font-weight:700;color:#0d1b2e">' + h.label + '</div>' +
        '<div style="font-size:11px;color:#64748b">' + (h.note || 'No note') + '</div>' +
        '<div style="margin-left:auto;font-size:10px;color:#94a3b8">' + (h.savedBy||'') + ' · ' + (h.savedAt ? new Date(h.savedAt).toLocaleDateString() : '') + '</div>' +
      '</div>';
    });
    html += '</div>';
  }

  wrap.innerHTML = html;
}

// ── Open new version modal ──
function updateNvSourceHint() {
  var src  = document.getElementById('nv-source')?.value;
  var hint = document.getElementById('nv-source-hint');
  var wrap = document.getElementById('nv-reverse-wrap');
  if (!hint || !wrap) return;
  if (src === 'current') {
    hint.textContent = 'Uses current 2026 prices as base';
    wrap.style.display = 'none';
  } else if (src === 'reverse_5') {
    hint.textContent = '✅ Derives 2025 base by dividing current prices ÷ 1.05 (reverses the +5% increase)';
    hint.style.color = '#16a34a';
    wrap.style.display = 'none';
  } else if (src === 'reverse_custom') {
    hint.textContent = 'Derives original base by reversing your specified previous increase';
    hint.style.color = '#d97706';
    wrap.style.display = 'block';
  }
}

function openNewVersionModal(presetYear) {
  var modal = document.getElementById('rh-new-modal');
  if (!modal) return;

  // Populate year select
  var nvYear = document.getElementById('nv-year');
  if (nvYear) {
    nvYear.innerHTML = '';
    for (var y = CY - 1; y <= CY + 3; y++) {
      var o = document.createElement('option');
      o.value = y; o.textContent = y;
      if (y === (presetYear || CY)) o.selected = true;
      nvYear.appendChild(o);
    }
  }

  // Populate month select
  var nvMonth = document.getElementById('nv-month');
  if (nvMonth && nvMonth.options.length === 1) {
    MONTH_NAMES.forEach(function(mn, i) {
      var o = document.createElement('option'); o.value = i+1; o.textContent = mn;
      nvMonth.appendChild(o);
    });
  }

  // Populate dept
  var nvDept = document.getElementById('nv-dept');
  if (nvDept && nvDept.options.length === 1) {
    DEPT_KEYS.forEach(function(d) {
      var o = document.createElement('option'); o.value = d; o.textContent = d;
      nvDept.appendChild(o);
    });
  }

  // Populate source year
  var nvSrc = document.getElementById('nv-source');
  if (nvSrc) {
    nvSrc.innerHTML = '<option value="current">Current Active Prices (' + CY + ')</option>';
    for (var sy = CY - 1; sy >= CY - 3; sy--) {
      var so = document.createElement('option'); so.value = sy; so.textContent = sy + ' prices';
      nvSrc.appendChild(so);
    }
  }

  // Clear preview
  var preview = document.getElementById('nv-preview');
  if (preview) preview.style.display = 'none';
  var note = document.getElementById('nv-note');
  if (note) note.value = '';
  var pct = document.getElementById('nv-pct');
  if (pct) pct.value = '0';

  modal.style.display = 'flex';
}

function previewNewVersion() {
  var y    = parseInt(document.getElementById('nv-year')?.value || CY);
  var m    = parseInt(document.getElementById('nv-month')?.value) || null;
  var dept = document.getElementById('nv-dept')?.value || 'ALL';
  var src  = document.getElementById('nv-source')?.value || 'current';
  var pct  = parseFloat(document.getElementById('nv-pct')?.value) || 0;
  var applyP = document.getElementById('nv-apply-price')?.checked !== false;
  var applyW = document.getElementById('nv-apply-weight')?.checked;

  // Load source prices
  var reversePct = parseFloat(document.getElementById('nv-reverse-pct')?.value) || 5;
  var srcPrices;
  if (src === 'current') {
    srcPrices = PRICES;
  } else if (src === 'reverse_5' || src === 'reverse_custom') {
    // Derive 2025 base by reversing previous % increase
    var rev = src === 'reverse_5' ? 5 : reversePct;
    var cur = JSON.parse(JSON.stringify(PRICES));
    DEPT_KEYS.forEach(function(d) {
      if (!cur[d]) return;
      cur[d].forEach(function(item) { item[1] = parseFloat((item[1] / (1 + rev/100)).toFixed(4)); });
    });
    srcPrices = cur;
  } else {
    srcPrices = loadPR(parseInt(src));
  }
  if (!srcPrices) srcPrices = buildMasterCopy();

  var depts = dept === 'ALL' ? DEPT_KEYS : [dept];
  var factor = 1 + pct / 100;

  var html = '<div style="font-size:11px;font-weight:800;color:#0d1b2e;margin-bottom:8px">Preview: ' + y + (m ? '-' + MONTH_NAMES[m-1] : ' (full year)') + ' · ' + (pct >= 0 ? '+' : '') + pct + '%</div>';
  html += '<table style="width:100%;font-size:11px;border-collapse:collapse">';
  html += '<tr style="background:#f8fafc"><th style="padding:6px 8px;text-align:left">Item</th>' +
    (applyP ? '<th style="padding:6px 8px;text-align:right">Old QR</th><th style="padding:6px 8px;text-align:right">New QR</th>' : '') +
    (applyW ? '<th style="padding:6px 8px;text-align:right">Old KG</th><th style="padding:6px 8px;text-align:right">New KG</th>' : '') +
    '</tr>';

  depts.forEach(function(d) {
    if (!srcPrices[d]) return;
    srcPrices[d].forEach(function(item, i) {
      var newP = applyP ? (item[1] * factor) : item[1];
      var newK = applyW ? (item[2] * factor) : item[2];
      var changed = (applyP && Math.abs(newP - item[1]) > 0.001) || (applyW && Math.abs(newK - item[2]) > 0.0001);
      html += '<tr style="background:' + (changed ? '#fffbeb' : '#fff') + ';border-bottom:1px solid #f1f5f9">' +
        '<td style="padding:5px 8px;color:#0d1b2e">' + (item[0]||'Item '+(i+1)) + '</td>' +
        (applyP ? '<td style="padding:5px 8px;text-align:right;color:#64748b">' + item[1].toFixed(2) + '</td><td style="padding:5px 8px;text-align:right;font-weight:700;color:' + (newP>item[1]?'#16a34a':'#dc2626') + '">' + newP.toFixed(2) + '</td>' : '') +
        (applyW ? '<td style="padding:5px 8px;text-align:right;color:#64748b">' + item[2].toFixed(3) + '</td><td style="padding:5px 8px;text-align:right;font-weight:700;color:' + (newK>item[2]?'#16a34a':'#dc2626') + '">' + newK.toFixed(3) + '</td>' : '') +
        '</tr>';
    });
  });
  html += '</table>';

  var preview = document.getElementById('nv-preview');
  if (preview) { preview.innerHTML = html; preview.style.display = 'block'; }
}

function saveNewVersion() {
  var y    = parseInt(document.getElementById('nv-year')?.value || CY);
  var m    = parseInt(document.getElementById('nv-month')?.value) || null;
  var dept = document.getElementById('nv-dept')?.value || 'ALL';
  var src  = document.getElementById('nv-source')?.value || 'current';
  var pct  = parseFloat(document.getElementById('nv-pct')?.value) || 0;
  var note = document.getElementById('nv-note')?.value?.trim() || '';
  var applyP = document.getElementById('nv-apply-price')?.checked !== false;
  var applyW = document.getElementById('nv-apply-weight')?.checked;

  if (!applyP && !applyW) { toast('⚠️ Select at least one: Prices or Weights', 'err'); return; }

  // Confirm if past year
  if (y < CY) {
    if (!confirm('⚠️ You are creating a rate version for ' + y + ' (past year). This does NOT affect already-saved entry data — only future recalculations. Continue?')) return;
  }

  // Load source
  var reversePct2 = parseFloat(document.getElementById('nv-reverse-pct')?.value) || 5;
  var srcPrices;
  if (src === 'current') {
    srcPrices = PRICES;
  } else if (src === 'reverse_5' || src === 'reverse_custom') {
    var rev2 = src === 'reverse_5' ? 5 : reversePct2;
    var cur2 = JSON.parse(JSON.stringify(PRICES));
    DEPT_KEYS.forEach(function(d) {
      if (!cur2[d]) return;
      cur2[d].forEach(function(item) { item[1] = parseFloat((item[1] / (1 + rev2/100)).toFixed(4)); });
    });
    srcPrices = cur2;
  } else {
    srcPrices = loadPR(parseInt(src));
  }
  if (!srcPrices) srcPrices = buildMasterCopy();

  // Apply % adjustment
  var factor = 1 + pct / 100;
  var newPrices = {};
  var depts = dept === 'ALL' ? DEPT_KEYS : [dept];

  // Start from existing version for this year or master copy
  var existing = loadRateVersion(y, null) || buildMasterCopy();
  newPrices = JSON.parse(JSON.stringify(existing));

  depts.forEach(function(d) {
    if (!newPrices[d]) newPrices[d] = MASTER[d].map(function(r){ return [...r]; });
    if (!srcPrices[d]) return;
    srcPrices[d].forEach(function(item, i) {
      if (newPrices[d][i]) {
        if (applyP) newPrices[d][i][1] = parseFloat((item[1] * factor).toFixed(4));
        if (applyW) newPrices[d][i][2] = parseFloat((item[2] * factor).toFixed(4));
      }
    });
  });

  // Save
  var storKey = m ? rvKey(y, m) : rvKey(y, null);
  try { _STORE.setItem(storKey, JSON.stringify(newPrices)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/rate_versions/' + y + '/' + (m || 'base'), newPrices);

  // If this is current year base — update PRICES global + savePR
  if (y === CY && !m) {
    PRICES = newPrices;
    savePR(y, newPrices);
  }

  // Log
  addRateHistoryEntry({
    year: y,
    month: m || null,
    label: y + (m ? '-' + MONTH_NAMES[m-1] : ' (full year)'),
    note: note || (pct !== 0 ? (pct > 0 ? '+' : '') + pct + '% from ' + src : 'Manual update'),
    applyPrice: applyP,
    applyWeight: applyW,
    savedAt: new Date().toISOString(),
    savedBy: (_SESSION.getItem('ph_user') || 'Admin')
  });

  toast('✅ Rate version saved for ' + y + (m ? '-' + MONTH_NAMES[m-1] : ''), 'ok');
  document.getElementById('rh-new-modal').style.display = 'none';
  renderRateHistory();
}

function openBulkPctModal() {
  var pct = prompt('Apply % change to ALL items in current year (' + CY + ')\nEnter percentage (e.g. 5 for +5%, -3 for -3%):');
  if (pct === null) return;
  var val = parseFloat(pct);
  if (isNaN(val)) { toast('⚠️ Invalid percentage', 'err'); return; }
  if (!confirm('Apply ' + (val>=0?'+':'') + val + '% to ALL prices for ' + CY + '? This will NOT affect already-saved entries.')) return;

  var factor = 1 + val / 100;
  var current = loadRateVersion(CY, null) || buildMasterCopy();
  var updated = JSON.parse(JSON.stringify(current));
  DEPT_KEYS.forEach(function(d) {
    if (!updated[d]) return;
    updated[d].forEach(function(item) { item[1] = parseFloat((item[1] * factor).toFixed(4)); });
  });

  _STORE.setItem(rvKey(CY, null), JSON.stringify(updated));
  if (window._fbSaveKey) window._fbSaveKey('pearl/rate_versions/' + CY + '/base', updated);
  PRICES = updated;
  savePR(CY, updated);

  addRateHistoryEntry({
    year: CY, month: null, label: CY + ' (full year)',
    note: 'Bulk ' + (val>=0?'+':'') + val + '% price adjustment',
    applyPrice: true, applyWeight: false,
    savedAt: new Date().toISOString(),
    savedBy: (_SESSION.getItem('ph_user') || 'Admin')
  });

  toast('✅ ' + (val>=0?'+':'') + val + '% applied to all ' + CY + ' prices', 'ok');
  renderRateHistory();
}

function renderPriceTable() {
  // Ensure correct sub-tab shown on first load
  if (document.getElementById('ptab-history') && document.getElementById('ptab-history').style.display === '') {
    showPriceSubTab('history');
  }
  // Always rebuild all price tool selectors fresh
  var py   = document.getElementById('padj-year');
  var pd   = document.getElementById('padj-dept');
  var pfy  = document.getElementById('pcopy-from');
  var pty  = document.getElementById('pcopy-to');
  var pcd  = document.getElementById('pcopy-dept');
  if (py)  buildYearOpts(py,  CY);
  if (pfy) buildYearOpts(pfy, CY);
  if (pty) buildYearOpts(pty, CY);
  if (pd)  buildDeptOpts(pd,  priceDept, true);
  if (pcd) buildDeptOpts(pcd, priceDept, true);

  // Populate price schedule selects
  var pschYear = document.getElementById('psch-year');
  var pschDept = document.getElementById('psch-dept');
  if (pschYear) buildYearOpts(pschYear, CY);
  if (pschDept) {
    pschDept.innerHTML = '<option value="ALL">All Departments</option>';
    DEPT_KEYS.forEach(function(d) { var o = document.createElement('option'); o.value = d; o.textContent = d; pschDept.appendChild(o); });
  }
  var pschDate = document.getElementById('psch-date');
  if (pschDate && !pschDate.value) { pschDate.value = new Date().toISOString().slice(0,10); }
  renderPriceScheduleList();

  // Populate import-prices year select
  var pxlYear = document.getElementById('pxl-year');
  if (pxlYear) buildYearOpts(pxlYear, CY);

  // Populate Price Change Manager selects
  var pcmSY = document.getElementById('pcm-source-year');
  var pcmTY = document.getElementById('pcm-target-year');
  var pcmD  = document.getElementById('pcm-dept');
  if (pcmSY) buildYearOpts(pcmSY, CY);
  if (pcmTY) buildYearOpts(pcmTY, CY);
  if (pcmD && pcmD.options.length === 1) {
    DEPT_KEYS.forEach(function(d){ var o=document.createElement('option'); o.value=d; o.textContent=d; pcmD.appendChild(o); });
  }
  // Set default from-date to today
  var pcmFD = document.getElementById('pcm-from-date');
  if (pcmFD && !pcmFD.value) pcmFD.value = new Date().toISOString().slice(0,10);
  pcmUpdateUI();

  // Build price-tabs with ALL tab first
  var ptEl = document.getElementById('price-tabs');
  if (ptEl) {
    var allTab = '<div class="dtab' + (priceDept === 'ALL' ? ' on' : '') + '" onclick="selectPriceDept(\'ALL\',this)" style="' + (priceDept === 'ALL' ? '' : '') + '">🗂 All Items</div>';
    var deptTabs = DEPT_KEYS.map(function(d) {
      return '<div class="dtab' + (priceDept === d ? ' on' : '') + '" onclick="selectPriceDept(\'' + d + '\',this)">' + DEPT_ICONS[d] + ' ' + d + '</div>';
    }).join('');
    ptEl.innerHTML = allTab + deptTabs;
  }

  // Render table — ALL shows every dept with a header row
  var rows = '';
  var depts = priceDept === 'ALL' ? DEPT_KEYS : [priceDept];
  var globalIdx = 0;

  if (priceDept === 'ALL') {
    // Read-only view across all departments
    depts.forEach(function(dept) {
      var items = MASTER[dept];
      rows += '<tr><td colspan="5" style="background:#0d1b2e;color:#c9a84c;font-weight:800;font-size:12px;letter-spacing:1px;padding:8px 14px">' + DEPT_ICONS[dept] + ' ' + dept.toUpperCase() + '</td></tr>';
      items.forEach(function(_, i) {
        globalIdx++;
        rows += '<tr style="background:' + (globalIdx % 2 === 0 ? '#f8fafc' : '#fff') + '">' +
          '<td style="color:var(--grey);font-weight:600;width:40px;text-align:center">' + (i+1) + '</td>' +
          '<td style="font-weight:500;color:#1a2332">' + getN(dept, i) + '</td>' +
          '<td><input type="number" step="0.0001" min="0" class="pi" id="pp_' + dept.replace(/\s/g,'_') + '_' + i + '" value="' + getP(dept, i).toFixed(4) + '" onchange="saveAllPriceField(\'' + dept + '\',' + i + ',\'p\',this.value)" style="background:#fffde7"></td>' +
          '<td><input type="number" step="0.001" min="0" class="pi" id="pk_' + dept.replace(/\s/g,'_') + '_' + i + '" value="' + getK(dept, i).toFixed(3) + '" onchange="saveAllPriceField(\'' + dept + '\',' + i + ',\'k\',this.value)" style="background:#eff6ff"></td>' +
          '<td style="text-align:center;color:#94a3b8;font-size:11px">—</td>' +
        '</tr>';
      });
    });
    document.getElementById('price-wrap').innerHTML =
      '<div class="card"><div style="font-size:11px;color:#6b7a8d;padding:8px 14px;background:#fffbeb;border-bottom:1px solid #fde68a;display:flex;align-items:center;gap:12px">📝 All departments — changes save instantly when you click away from a field &nbsp;·&nbsp; <span style="color:#92400e">🟡 Yellow = Price (QR)</span> &nbsp;·&nbsp; <span style="color:#1e40af">🔵 Blue = Weight (KG)</span></div>' +
      '<div class="tscroll"><table class="price-t">' +
      '<thead><tr><th style="width:40px;text-align:center">#</th><th>Item</th>' +
      '<th style="background:#fffde7;color:#92400e">💰 Unit Price (QR)</th><th style="background:#dbeafe;color:#1e40af">⚖️ Weight (KG / Piece)</th><th style="width:40px"></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>';
  } else {
    // Per-dept editable view with move buttons
    var items = MASTER[priceDept];
    var n = items.length;
    items.forEach(function(_, i) {
      var upDisabled   = i === 0     ? 'opacity:.3;pointer-events:none' : '';
      var downDisabled = i === n - 1 ? 'opacity:.3;pointer-events:none' : '';
      rows += '<tr id="ptr_' + i + '">' +
        '<td style="color:var(--grey);font-weight:600;width:40px;text-align:center">' + (i+1) + '</td>' +
        '<td style="font-weight:500;color:#1a2332">' + getN(priceDept, i) + '</td>' +
        '<td><input type="number" step="0.0001" min="0" class="pi" id="pp_' + i + '" value="' + getP(priceDept, i).toFixed(4) + '" style="background:#fffde7"></td>' +
        '<td><input type="number" step="0.001" min="0" class="pi" id="pk_' + i + '" value="' + getK(priceDept, i).toFixed(3) + '" style="background:#eff6ff"></td>' +
        '<td style="white-space:nowrap;text-align:center;width:72px">' +
          '<button onclick="movePriceItem(' + i + ',-1)" title="Move Up" style="' + upDisabled + 'background:#f0f4f8;border:1px solid #d1d5db;border-radius:5px;padding:3px 8px;font-size:13px;cursor:pointer;margin-right:3px">▲</button>' +
          '<button onclick="movePriceItem(' + i + ',+1)" title="Move Down" style="' + downDisabled + 'background:#f0f4f8;border:1px solid #d1d5db;border-radius:5px;padding:3px 8px;font-size:13px;cursor:pointer">▼</button>' +
        '</td></tr>';
    });
    document.getElementById('price-wrap').innerHTML =
      '<div class="card"><div class="tscroll"><table class="price-t">' +
      '<thead><tr><th style="width:40px;text-align:center">#</th><th>Item</th>' +
      '<th style="background:#fffde7;color:#92400e">💰 Unit Price (QR)<div style="font-size:9px;font-weight:400;opacity:.7;margin-top:2px">Used to calculate revenue</div></th>' +
      '<th style="background:#dbeafe;color:#1e40af">⚖️ Weight (KG / Piece)<div style="font-size:9px;font-weight:400;opacity:.7;margin-top:2px">Used to calculate total KG</div></th>' +
      '<th style="width:72px;text-align:center">Order</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>';
  }
}

function selectPriceDept(d, el) {
  priceDept = d;
  renderPriceTable();
}

function saveAllPriceField(dept, i, type, val) {
  if (!PRICES[dept]) PRICES[dept] = MASTER[dept].map(function(item) { return [item[0], item[1], item[2]]; });
  var v = parseFloat(val) || 0;
  if (type === 'p') PRICES[dept][i][1] = v;
  else PRICES[dept][i][2] = v;
  savePR(CY, PRICES);
}

function movePriceItem(idx, dir) {
  const dept = priceDept;
  const items = MASTER[dept];
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= items.length) return;

  // Swap in MASTER
  const tmp = items[idx]; items[idx] = items[newIdx]; items[newIdx] = tmp;

  // Swap in PRICES if exists
  if (PRICES[dept] && PRICES[dept].length === items.length) {
    const tp = PRICES[dept][idx]; PRICES[dept][idx] = PRICES[dept][newIdx]; PRICES[dept][newIdx] = tp;
  }

  // Swap data in all months/years so existing quantities stay aligned
  // We scan all loaded DB data for this dept and swap index positions
  swapItemDataAllMonths(dept, idx, newIdx);

  // Save custom order
  saveItemOrder(dept);
  savePR(CY, PRICES);

  renderPriceTable();
  toast('✔ Item moved — ' + getN(dept, idx + dir > idx ? newIdx : newIdx) + '', 'ok');
}

function swapItemDataAllMonths(dept, idxA, idxB) {
  // Iterate all years we might have in memory
  var years = [CY];
  for (var y = 2026; y <= 2035; y++) { if (y !== CY && _DB[y]) years.push(y); }
  years.forEach(function(y) {
    var db = loadDB(y);
    if (!db) return;
    Object.keys(db).forEach(function(mk) {
      if (mk.indexOf(dept + '|') !== 0) return;
      var arr = db[mk]; // 31-element array
      if (!arr) return;
      // arr[day] contains qty for each item index as a flat array — not used
      // Actually data is stored per-item using key prefix; let's just swap via setVal/getVal
    });
  });
  // More direct: use getVal/setVal across all months for all days
  for (var yr = 2026; yr <= 2035; yr++) {
    for (var mo = 1; mo <= 12; mo++) {
      var nd = dim(yr, mo);
      for (var d = 0; d < nd; d++) {
        var va = getVal(yr, mo, dept, idxA, d);
        var vb = getVal(yr, mo, dept, idxB, d);
        if (va !== vb) {
          setVal(yr, mo, dept, idxA, d, vb);
          setVal(yr, mo, dept, idxB, d, va);
        }
      }
    }
  }
  commitSave(CY);
}

function saveItemOrder(dept) {
  // Persist order changes into custom storage so they survive reload
  var custom = loadCustom();
  if (!custom.order) custom.order = {};
  custom.order[dept] = MASTER[dept].map(function(it){ return it[0]; });
  saveCustom(custom);
}

function exportPricesExcel(mode) {
  var yr   = parseInt(document.getElementById('padj-year').value) || CY;
  var dept = document.getElementById('padj-dept').value || 'ALL';
  var pr   = loadPR(yr);
  var depts = dept === 'ALL' ? DEPT_KEYS : [dept];

  // Build CSV rows
  var header = mode === 'both'
    ? ['#', 'Department', 'Item', 'Unit Price (QR)', 'Weight (KG/pc)']
    : ['#', 'Department', 'Item', 'Unit Price (QR)'];
  var rows = [header];
  depts.forEach(function(d) {
    var items = pr[d] || MASTER[d];
    items.forEach(function(item, i) {
      rows.push(mode === 'both'
        ? [i + 1, d, item[0], item[1], item[2]]
        : [i + 1, d, item[0], item[1]]);
    });
    rows.push([]); // blank spacer between depts
  });

  var csv = rows.map(function(r) {
    return r.map(function(cell) {
      var s = String(cell === null || cell === undefined ? '' : cell);
      return s.indexOf(',') >= 0 || s.indexOf('"') >= 0 ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',');
  }).join('\r\n');

  var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  var deptLabel = dept === 'ALL' ? 'All_Depts' : dept.replace(/\s/g, '_').replace(/&/g, 'and');
  var suffix = mode === 'both' ? '_with_KG' : '_PriceOnly';
  a.href     = url;
  a.download = 'Pearl_Prices_' + yr + '_' + deptLabel + suffix + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('📥 Exported ' + (mode === 'both' ? 'Prices & KG' : 'Prices only') + ' — ' + yr + ' · ' + (dept === 'ALL' ? 'All Departments' : dept), 'ok');
}

function importPricesFromCSV(input) {
  var file = input.files[0];
  if (!file) return;
  var yr = parseInt(document.getElementById('padj-year').value) || CY;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var lines = e.target.result.split(/\r?\n/).filter(function(l) { return l.trim(); });
      var pr = loadPR(yr);
      var updated = 0, skipped = 0, notFound = 0;

      lines.forEach(function(line) {
        // Skip header row
        if (/^#|^"#/.test(line.trim())) return;
        var cols = line.split(',').map(function(c) { return c.replace(/^"|"$/g,'').trim(); });
        // Expected: #, Department, Item, Price, [KG]
        if (cols.length < 4) { skipped++; return; }
        var dept  = cols[1];
        var name  = cols[2];
        var price = parseFloat(cols[3]);
        var kg    = cols[4] !== undefined && cols[4] !== '' ? parseFloat(cols[4]) : null;

        if (!dept || !name || isNaN(price)) { skipped++; return; }
        if (!MASTER[dept]) { notFound++; return; }

        // Find matching item by name (fuzzy)
        var bestIdx = -1, bestScore = 0;
        MASTER[dept].forEach(function(item, i) {
          var s = fuzzyScore(name, item[0]);
          if (s > bestScore) { bestScore = s; bestIdx = i; }
        });

        if (bestIdx === -1 || bestScore < 0.5) { notFound++; return; }

        if (!pr[dept]) pr[dept] = MASTER[dept].map(function(item) { return [item[0], item[1], item[2]]; });
        pr[dept][bestIdx][1] = Math.round(price * 10000) / 10000;
        if (kg !== null && !isNaN(kg)) pr[dept][bestIdx][2] = Math.round(kg * 10000) / 10000;
        updated++;
      });

      savePR(yr, pr);
      if (yr === CY) { PRICES = pr; }
      input.value = ''; // reset file input
      renderPriceTable();
      toast('✅ Imported ' + updated + ' prices into ' + yr +
        (skipped  > 0 ? ' · ' + skipped  + ' skipped'   : '') +
        (notFound > 0 ? ' · ' + notFound + ' not found' : ''), 'ok');
    } catch(err) {
      toast('❌ Import failed — ' + err.message, 'err');
      input.value = '';
    }
  };
  reader.readAsText(file, 'UTF-8');
}

function togglePricePDFMenu(e) {
  e.stopPropagation();
  var m = document.getElementById('price-pdf-menu');
  if (!m) return;
  var open = m.style.display !== 'none';
  document.querySelectorAll('[id$="-menu"]').forEach(function(el){ el.style.display='none'; });
  m.style.display = open ? 'none' : 'block';
  if (!open) {
    var close = function(){ m.style.display='none'; document.removeEventListener('click',close); };
    setTimeout(function(){ document.addEventListener('click', close); }, 10);
  }
}
function closePricePDFMenu() {
  var m = document.getElementById('price-pdf-menu');
  if (m) m.style.display = 'none';
}

function printPricesPDF(mode) {
  mode = mode || 'both'; // 'both' | 'price' | 'kg'
  var showPrice = mode === 'both' || mode === 'price';
  var showKg    = mode === 'both' || mode === 'kg';
  var modeLabel = mode === 'both' ? 'Prices & Weights' : mode === 'price' ? 'Prices Only (QR)' : 'Weight Only (KG)';

  var printWin = window.open('', '_blank', 'width=900,height=700');
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'});

  var deptSections = '';
  DEPT_KEYS.forEach(function(dept) {
    var items = MASTER[dept];
    var rows = items.map(function(_, i) {
      var name  = getN(dept, i);
      var price = getP(dept, i);
      var kg    = getK(dept, i);
      return '<tr>' +
        '<td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:12px">' + (i+1) + '</td>' +
        '<td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:500">' + name + '</td>' +
        (showPrice ? '<td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;color:#1d4ed8;font-family:monospace">' + price.toFixed(4) + '</td>' : '') +
        (showKg    ? '<td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;color:#166534;font-family:monospace">' + kg.toFixed(3) + '</td>' : '') +
      '</tr>';
    }).join('');

    deptSections +=
      '<div style="margin-bottom:24px;break-inside:avoid">' +
        '<div style="background:#1a2332;color:#fff;padding:9px 14px;border-radius:8px 8px 0 0;font-size:13px;font-weight:700;letter-spacing:.5px">' +
          (DEPT_ICONS[dept] || '🏢') + '  ' + dept +
          '<span style="float:right;font-size:11px;opacity:.7;font-weight:400">' + items.length + ' items</span>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden">' +
          '<thead><tr style="background:#f8fafc">' +
            '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7a8d;font-weight:700;border-bottom:2px solid #e2e8f0;width:40px">#</th>' +
            '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7a8d;font-weight:700;border-bottom:2px solid #e2e8f0">ITEM NAME</th>' +
            (showPrice ? '<th style="padding:8px 12px;text-align:right;font-size:11px;color:#1d4ed8;font-weight:700;border-bottom:2px solid #e2e8f0;width:120px">PRICE (QR)</th>' : '') +
            (showKg    ? '<th style="padding:8px 12px;text-align:right;font-size:11px;color:#166534;font-weight:700;border-bottom:2px solid #e2e8f0;width:120px">WEIGHT (KG)</th>' : '') +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  });

  var html2 = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<title>Reda Salah · Laundry Management System — ' + modeLabel + '</title>' +
    '<style>' +
      'body{margin:0;padding:28px 32px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f8fafc;color:#1a2332}' +
      '.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #1a2332}' +
      '.header-left h1{margin:0;font-size:20px;font-weight:800;color:#1a2332}' +
      '.header-left p{margin:4px 0 0;font-size:12px;color:#6b7a8d}' +
      '.header-right{text-align:right;font-size:11px;color:#6b7a8d;line-height:1.7}' +
      '@media print{body{background:#fff;padding:16px 20px}@page{size:A4;margin:12mm}}' +
    '</st'+'yle></he'+'ad><body>' +
    '<div class="header">' +
      '<div class="header-left">' +
        '<h1>⚙️ Laundry Management System — ' + modeLabel + '</h1>' +
        '<p>' + (mode==='both'?'Complete price list and KG weights':mode==='price'?'Unit prices (QR) for all departments':'KG weights for all departments') + ' · Year ' + CY + '</p>' +
      '</div>' +
      '<div class="header-right">' +
        '<strong>Reda Salah</strong><br>' +
        'Prepared by: Reda Salah<br>' +
        'Date: ' + dateStr + '<br>' +
        '© Reda Salah · Laundry Management System · All Rights Reserved' +
      '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">' +
      deptSections +
    '</div>' +
    '<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;font-size:10.5px;color:#94a3b8">' +
      '© Reda Salah · Laundry Management System · All Rights Reserved' +
    '</div>' +
    '<scr'+'ipt>window.onload=function(){window.print();}</scr'+'ipt>' +
    '</bo'+'dy></ht'+'ml>';

  printWin.document.write(html2);
  printWin.document.close();
}

function savePrices() {
  if (!PRICES[priceDept]) PRICES[priceDept] = MASTER[priceDept].map(i => [...i]);
  MASTER[priceDept].forEach((_, i) => {
    const p = parseFloat(document.getElementById('pp_' + i)?.value || 0);
    const k = parseFloat(document.getElementById('pk_' + i)?.value || 0);
    PRICES[priceDept][i] = [MASTER[priceDept][i][0], p, k];
  });
  savePR(CY, PRICES); toast('✔ Prices saved — ' + priceDept, 'ok');
}

function resetPrices() {
  if (!confirm('Reset ' + priceDept + ' prices to default?')) return;
  PRICES[priceDept] = MASTER[priceDept].map(i => [...i]);
  savePR(CY, PRICES); renderPriceTable(); toast('Prices reset to default');
}

var ANA_COLORS = {
  'Rooms Linen': {main:'#3b82f6', side:'#1d4ed8', top:'#93c5fd'},
  'F & B':       {main:'#f59e0b', side:'#b45309', top:'#fcd34d'},
  'Spa & Pool':  {main:'#10b981', side:'#047857', top:'#6ee7b7'},
  'Uniform':     {main:'#8b5cf6', side:'#6d28d9', top:'#c4b5fd'},
  'Others':      {main:'#ef4444', side:'#b91c1c', top:'#fca5a5'},
  'Dry Cleaning':{main:'#06b6d4', side:'#0e7490', top:'#67e8f9'}
};
function anaColor(dept, part) {
  var c = ANA_COLORS[dept] || {main:'#64748b',side:'#334155',top:'#94a3b8'};
  return c[part] || c.main;
}

function build3DBar(dept, val, maxVal, label, pct, mini) {
  var h = maxVal > 0 ? Math.max(8, Math.round((val / maxVal) * (mini ? 90 : 160))) : 8;
  var mc = anaColor(dept, 'main'), sc = anaColor(dept, 'side'), tc = anaColor(dept, 'top');
  var fmtVal = val >= 1000 ? (val/1000).toFixed(1)+'K' : val.toFixed(0);
  var badge = '';
  if (!mini && val > 0) {
    badge = '<div class="bar3d-badge">' + (pct ? pct+'% · ' : '') + fmtVal + '</div>';
  } else if (mini && val > 0) {
    badge = '<div class="bar3d-badge" style="font-size:8.5px;padding:1px 5px;top:-28px">' + fmtVal + '</div>';
  }
  return '<div class="bar3d-col">' +
    '<div class="bar3d-body" style="height:' + h + 'px;background:linear-gradient(180deg,' + mc + ',color-mix(in srgb,' + mc + ' 70%,#000));' +
      'box-shadow:2px 2px 8px rgba(0,0,0,.25)">' +
      badge +
      '<span style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.18) 0%,transparent 60%)"></span>' +
    '</div>' +
    '<div style="position:relative;width:100%;height:7px;background:linear-gradient(180deg,' + tc + ',' + mc + ');' +
      'transform:skewX(-20deg);margin-left:4px;margin-top:-1px;opacity:.8"></div>' +
    '<div style="width:calc(100% + 4px);margin-left:-2px;height:7px;background:linear-gradient(90deg,' + sc + ',color-mix(in srgb,' + sc + ' 70%,#000));' +
      'position:relative;top:-7px;transform:skewY(-2deg);opacity:.9"></div>' +
    '<div class="bar3d-base"></div>' +
    '<div class="bar3d-lbl">' + label + '</div>' +
  '</div>';
}

function buildDonut(data) {
  // data = [{label, value, color}]
  var total = data.reduce(function(s,d){ return s+d.value; }, 0);
  if (total === 0) return '<p style="color:var(--grey);padding:20px">No data</p>';
  var r = 70, cx = 80, cy = 80, circ = 2 * Math.PI * r;
  var offset = 0, paths = '';
  data.forEach(function(d) {
    var pct = d.value / total;
    var dash = pct * circ;
    var gap  = circ - dash;
    paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none"' +
      ' stroke="' + d.color + '" stroke-width="28"' +
      ' stroke-dasharray="' + dash.toFixed(2) + ' ' + gap.toFixed(2) + '"' +
      ' stroke-dashoffset="' + (-offset).toFixed(2) + '"' +
      ' transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
    offset += dash;
  });
  var legend = data.map(function(d) {
    var pct = total > 0 ? (d.value/total*100).toFixed(1) : '0.0';
    return '<div class="donut-leg-item"><div class="donut-leg-dot" style="background:' + d.color + '"></div>' +
      '<span><strong>' + d.label + '</strong> ' + pct + '%</span></div>';
  }).join('');
  return '<div class="donut-wrap">' +
    '<svg class="donut-svg" width="160" height="160" viewBox="0 0 160 160">' +
      '<circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" stroke-width="28"/>' +
      paths +
      '<text x="80" y="75" text-anchor="middle" font-size="11" fill="#64748b" font-weight="600">Total</text>' +
      '<text x="80" y="92" text-anchor="middle" font-size="13" fill="#1a2332" font-weight="700">' +
        (total >= 1000 ? (total/1000).toFixed(1)+'K' : total.toFixed(0)) +
      '</text>' +
    '</svg>' +
    '<div class="donut-legend">' + legend + '</div>' +
  '</div>';
}

function buildLineChart(days, values, color) {
  if (!values.some(function(v){ return v>0; })) return '<p style="color:var(--grey);padding:20px">No data</p>';
  var maxV = Math.max.apply(null, values);
  var w = 600, h = 150, pad = {l:40,r:10,t:10,b:25};
  var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  var pts = values.map(function(v, i) {
    var x = pad.l + (i / (days-1)) * iw;
    var y = pad.t + ih - (maxV>0 ? (v/maxV)*ih : 0);
    return x.toFixed(1)+','+y.toFixed(1);
  });
  // Area fill
  var areaPath = 'M'+pad.l+','+(pad.t+ih)+' L'+pts.join(' L')+' L'+(pad.l+iw)+','+(pad.t+ih)+' Z';
  // Line
  var linePath = 'M' + pts.join(' L');
  // X axis labels (every 5 days)
  var xLabels = '';
  for (var i=0; i<days; i++) {
    if ((i+1) === 1 || (i+1) % 5 === 0 || (i+1) === days) {
      var x2 = pad.l + (i/(days-1))*iw;
      xLabels += '<text x="'+x2.toFixed(1)+'" y="'+(h-5)+'" text-anchor="middle" font-size="9" fill="#94a3b8">'+(i+1)+'</text>';
    }
  }
  // Y axis labels
  var yLabels = '';
  for (var j=0;j<=3;j++) {
    var yv = maxV * j/3;
    var yp = pad.t + ih - (j/3)*ih;
    var yvStr = yv >= 1000 ? (yv/1000).toFixed(1)+'K' : yv.toFixed(0);
    yLabels += '<text x="'+(pad.l-4)+'" y="'+(yp+3).toFixed(1)+'" text-anchor="end" font-size="9" fill="#94a3b8">'+yvStr+'</text>';
    yLabels += '<line x1="'+pad.l+'" y1="'+yp.toFixed(1)+'" x2="'+(pad.l+iw)+'" y2="'+yp.toFixed(1)+'" stroke="#f1f5f9" stroke-width="1"/>';
  }
  return '<div class="linechart-wrap">' +
    '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">' +
      '<defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="'+color+'" stop-opacity=".35"/>' +
        '<stop offset="100%" stop-color="'+color+'" stop-opacity=".02"/>' +
      '</linearGradient></defs>' +
      yLabels + xLabels +
      '<path d="'+areaPath+'" fill="url(#lg1)"/>' +
      '<path d="'+linePath+'" fill="none" stroke="'+color+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      // Dots on data points
      values.map(function(v,i) {
        if (v === 0) return '';
        var x3 = pad.l + (i/(days-1))*iw;
        var y3 = pad.t + ih - (maxV>0 ? (v/maxV)*ih : 0);
        return '<circle cx="'+x3.toFixed(1)+'" cy="'+y3.toFixed(1)+'" r="3" fill="'+color+'" stroke="#fff" stroke-width="1.5"/>';
      }).join('') +
    '</svg>' +
  '</div>';
}


// ════════════════════════════════════════════════════════════════
//  BENCHMARK TAB
// ════════════════════════════════════════════════════════════════

var _benchChartRev = null, _benchChartKg = null;

function benchKey(y, m) { return 'pearl_bench_' + y + '_' + m; }
function benchSettingsKey() { return 'pearl_bench_settings'; }

function loadBenchOcc(y, m) {
  // Always return localStorage immediately (fast, no flicker)
  var local = {};
  try { local = JSON.parse(_STORE.getItem(benchKey(y, m)) || '{}'); } catch(e) {}
  // Background sync from Firebase — LOCAL WINS (most recent edit is always local)
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/benchmark/' + y + '/' + m).then(function(fb) {
      if (fb && Object.keys(fb).length > 0) {
        // Re-read local (may have changed since async started)
        var freshLocal = {};
        try { freshLocal = JSON.parse(_STORE.getItem(benchKey(y, m)) || '{}'); } catch(e) {}
        // Local wins — only fill in days that don't exist locally
        var merged = Object.assign({}, fb, freshLocal);
        var changed = JSON.stringify(merged) !== JSON.stringify(freshLocal);
        if (changed) {
          try { _STORE.setItem(benchKey(y, m), JSON.stringify(merged)); } catch(e) {}
          // Do NOT re-render — silent update only, prevents flicker
        }
      } else if (Object.keys(local).length > 0 && window._fbSaveKey) {
        // Push local to Firebase if Firebase is empty
        window._fbSaveKey('pearl/benchmark/' + y + '/' + m, local);
      }
    }).catch(function(){});
  }
  return local;
}

function loadBenchOccFromFB(y, m, callback) {
  // Force load from Firebase — used on tab open
  if (!window._fbLoadKey) { callback(loadBenchOcc(y, m)); return; }
  window._fbLoadKey('pearl/benchmark/' + y + '/' + m).then(function(fb) {
    var local = {};
    try { local = JSON.parse(_STORE.getItem(benchKey(y, m)) || '{}'); } catch(e) {}
    var merged = Object.assign({}, local, fb || {});
    if (Object.keys(merged).length > 0) {
      try { _STORE.setItem(benchKey(y, m), JSON.stringify(merged)); } catch(e) {}
    }
    callback(merged);
  }).catch(function() { callback(loadBenchOcc(y, m)); });
}

function saveBenchOccData(y, m, data) {
  // Save to benchmark storage
  try { _STORE.setItem(benchKey(y, m), JSON.stringify(data)); } catch(e) {}
  if (window._fbSaveKey) {
    window._fbSaveKey('pearl/benchmark/' + y + '/' + m, data).catch(function(err) {
      setTimeout(function() {
        if (window._fbSaveKey) window._fbSaveKey('pearl/benchmark/' + y + '/' + m, data);
      }, 2000);
    });
  }
  // ── BRIDGE: also save each day to individual occ keys so dashboard can read them ──
  // Always read fresh totalRooms to avoid stale 161 value
  var totalRooms = (function() {
    try {
      var _bs = JSON.parse(localStorage.getItem('pearl_bench_settings') || '{}');
      var _hs = JSON.parse(localStorage.getItem('pearl_hotel_settings') || '{}');
      return _bs.totalRooms || _hs.rooms || _TOTAL_ROOMS || 161;
    } catch(e) { return _TOTAL_ROOMS || 161; }
  })();
  if (totalRooms > 0) _TOTAL_ROOMS = totalRooms; // keep global in sync
  Object.keys(data).forEach(function(d) {
    var pct   = parseFloat(data[d]) || 0;
    var rooms = Math.round(pct / 100 * totalRooms);
    var dayKey = 'occ_' + y + '_' + m + '_' + d;
    var dayData = { rooms: rooms, pct: pct };
    try { _STORE.setItem(dayKey, JSON.stringify(dayData)); } catch(e) {}
    // Also sync to Firebase individual day path
    if (window._fbDB) {
      window._fbDB.ref('pearl/occupancy/' + y + '/' + m + '/' + d).set(dayData);
    }
  });
  // Invalidate dashboard cache so it re-renders with new occupancy
  invalidateTabCache('dashboard');
}
function loadBenchSettings() {
  try { return JSON.parse(_STORE.getItem(benchSettingsKey()) || '{}'); } catch(e) { return {}; }
}
function saveBenchSettings() {
  var tr = parseInt(document.getElementById('bench-total-rooms')?.value) || 0;
  if (tr < 1) return;
  var s = { totalRooms: tr };
  try { _STORE.setItem(benchSettingsKey(), JSON.stringify(s)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/benchmark/settings', s);
  _TOTAL_ROOMS = tr;
  try {
    var hotel = JSON.parse(_STORE.getItem('pearl_hotel_settings') || '{}');
    hotel.rooms = tr;
    _STORE.setItem('pearl_hotel_settings', JSON.stringify(hotel));
    if (window._fbSaveKey) window._fbSaveKey('pearl/settings/hotel', hotel);
  } catch(e) {}
  invalidateTabCache('dashboard');
}

// Save rooms and immediately update dashboard display
function saveBenchRooms() {
  var inp = document.getElementById('bench-total-rooms');
  var tr  = parseInt(inp?.value) || 0;
  if (tr < 1 || tr > 9999) {
    toast('⚠️ Enter a valid room count (1–9999)', 'err');
    return;
  }
  // Highlight input to confirm
  if (inp) { inp.style.borderColor = '#16a34a'; setTimeout(function(){ inp.style.borderColor = '#e2e8f0'; }, 1500); }
  saveBenchSettings();
  renderBenchmark();
  // If dashboard is currently visible, re-render it too
  if (curTab === 'dashboard') {
    renderDashOccQuick(parseInt(document.getElementById('dash-month')?.value || new Date().getMonth()+1));
  }
  toast('✅ Total rooms saved: ' + tr + ' rooms — dashboard updated', 'ok');
}

function renderBenchmark() {
  var m   = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
  var days = dim(CY, m);
  var occ  = loadBenchOcc(CY, m);
  var settings = loadBenchSettings();
  // Priority: user input in field > saved settings > global > default
  var inputVal = parseInt(document.getElementById('bench-total-rooms')?.value) || 0;
  var totalRooms = inputVal || settings.totalRooms || _TOTAL_ROOMS || 161;
  // Update global to stay in sync
  if (totalRooms !== _TOTAL_ROOMS) _TOTAL_ROOMS = totalRooms;
  var tri2 = document.getElementById('bench-total-rooms');
  if (tri2 && !inputVal) tri2.value = totalRooms; // only set if field is empty

  // Build occupancy entry grid — dual input (rooms + %)
  var totalRoomsNow = _TOTAL_ROOMS || totalRooms || 161;
  var grid = document.getElementById('bench-occ-grid');
  if (grid) {
    // Update total rooms from global setting
    var tri = document.getElementById('bench-total-rooms');
    if (tri && !tri.value && totalRoomsNow) tri.value = totalRoomsNow;

    var html = '';
    var DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (var d = 1; d <= days; d++) {
      var savedPct   = occ[d] !== undefined ? occ[d] : '';
      var savedRooms = savedPct !== '' && totalRoomsNow > 0 ? Math.round(totalRoomsNow * savedPct / 100) : '';
      var dn = DAY_SHORT[new Date(CY, m-1, d).getDay()];
      // Color code by occupancy level
      var occVal = parseFloat(savedPct) || 0;
      var dotCol = occVal >= 80 ? '#16a34a' : occVal >= 60 ? '#d97706' : occVal > 0 ? '#dc2626' : '#e2e8f0';
      html +=
        '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;transition:border-color .15s" ' +
        'id="occ-cell-' + d + '">' +
        '<div style="display:flex;align-items:center;gap:4px">' +
          '<div style="width:6px;height:6px;border-radius:50%;background:' + dotCol + ';flex-shrink:0" id="occ-dot-' + d + '"></div>' +
          '<div style="font-size:9px;font-weight:700;color:#64748b">' + dn + ' ' + d + '</div>' +
        '</div>' +
        // Rooms input
        '<div style="width:100%;text-align:center">' +
          '<div style="font-size:8px;color:#94a3b8;margin-bottom:1px">Rooms</div>' +
          '<input type="number" min="0" max="' + totalRoomsNow + '" id="bocc_rooms_' + d + '" value="' + savedRooms + '" ' +
          'style="width:52px;padding:3px 2px;border:1px solid #e2e8f0;border-radius:5px;font-size:12px;font-weight:700;color:#0d1b2e;text-align:center;outline:none;background:#fff"' +
          ' oninput="occRoomsChanged(' + d + ')">' +
        '</div>' +
        // Pct input
        '<div style="width:100%;text-align:center">' +
          '<div style="font-size:8px;color:#94a3b8;margin-bottom:1px">Occ %</div>' +
          '<input type="number" min="0" max="100" step="0.1" id="bocc_' + d + '" value="' + savedPct + '" ' +
          'style="width:52px;padding:3px 2px;border:1px solid #e2e8f0;border-radius:5px;font-size:12px;font-weight:700;color:#0d1b2e;text-align:center;outline:none;background:#fff"' +
          ' oninput="occPctChanged(' + d + ')">' +
        '</div>' +
        '</div>';
    }
    grid.innerHTML = html;
    grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(72px,1fr))';
    grid.dataset.month = m;
    grid.dataset.year = CY;
  }

  // Collect live data
  var dayData = [];
  var totalOccRooms = 0, totalRev = 0, totalKg = 0, totalRevPOR = 0, totalKgPOR = 0, porCount = 0;
  for (var d3 = 1; d3 <= days; d3++) {
    var occPct = parseFloat(document.getElementById('bocc_' + d3)?.value) || occ[d3] || 0;
    var occRooms = totalRooms > 0 ? Math.round(totalRooms * occPct / 100) : null;
    var dt = dayTotals(CY, m, d3);
    var rev = dt.qr, kg = dt.kg;
    // Per-dept revenue
    var deptRevs = {};
    DEPT_KEYS.forEach(function(dept) {
      var dqr = 0;
      MASTER[dept].forEach(function(_, i) {
        var v = getVal(CY, m, dept, i, d3 - 1);
        if (v > 0) dqr += v * getPriceForDate(dept, i, CY, m, d3);
      });
      deptRevs[dept] = dqr;
    });
    var revPOR = (occRooms && occRooms > 0 && rev > 0) ? rev / occRooms : null;
    var kgPOR  = (occRooms && occRooms > 0 && kg > 0)  ? kg  / occRooms : null;
    dayData.push({ d: d3, occPct: occPct, occRooms: occRooms, rev: rev, kg: kg, revPOR: revPOR, kgPOR: kgPOR, deptRevs: deptRevs });
    if (rev > 0) { totalRev += rev; totalKg += kg; }
    if (occPct > 0) totalOccRooms++;
    if (revPOR !== null) { totalRevPOR += revPOR; porCount++; }
    if (kgPOR  !== null) totalKgPOR  += kgPOR;
  }

  var avgOcc    = dayData.filter(function(x){ return x.occPct > 0; }).reduce(function(a,b){ return a + b.occPct; }, 0) / Math.max(1, dayData.filter(function(x){ return x.occPct > 0; }).length);
  var avgRevPOR = porCount > 0 ? totalRevPOR / porCount : 0;
  var avgKgPOR  = porCount > 0 ? totalKgPOR  / porCount : 0;

  // Summary cards — vivid gradient design
  var cards = document.getElementById('bench-summary-cards');
  if (cards) {
    var cardData = [
      { icon: '📊', label: 'Avg Occupancy', val: avgOcc.toFixed(1) + '%', sub: 'Days with data', grad: 'linear-gradient(135deg,#0369a1,#0284c7)', shadow: 'rgba(2,132,199,.3)' },
      { icon: '💰', label: 'Total Revenue', val: fmtMoney(totalRev), sub: MONTH_NAMES[m-1] + ' ' + CY, grad: 'linear-gradient(135deg,#15803d,#16a34a)', shadow: 'rgba(22,163,74,.3)' },
      { icon: '⚖️', label: 'Total KG', val: Math.ceil(totalKg) + ' kg', sub: MONTH_NAMES[m-1] + ' ' + CY, grad: 'linear-gradient(135deg,#b45309,#d97706)', shadow: 'rgba(217,119,6,.3)' },
      { icon: '🛏️', label: 'Revenue / Room', val: avgRevPOR > 0 ? fmtMoney(avgRevPOR) : '—', sub: 'Avg per occupied room', grad: 'linear-gradient(135deg,#6d28d9,#7c3aed)', shadow: 'rgba(124,58,237,.3)' },
      { icon: '📦', label: 'KG / Room', val: avgKgPOR > 0 ? avgKgPOR.toFixed(3) + ' kg' : '—', sub: 'Avg per occupied room', grad: 'linear-gradient(135deg,#0e7490,#0891b2)', shadow: 'rgba(8,145,178,.3)' },
      { icon: '📅', label: 'Days Tracked', val: dayData.filter(function(x){ return x.occPct > 0; }).length + ' / ' + days, sub: 'Occupancy entered', grad: 'linear-gradient(135deg,#334155,#475569)', shadow: 'rgba(71,85,105,.3)' },
      (function(){
        var bestDay = dayData.filter(function(x){ return x.rev > 0; }).reduce(function(a,b){ return b.rev > a.rev ? b : a; }, {rev:0,d:0});
        return { icon: '🏆', label: 'Best Day', val: bestDay.d > 0 ? (DAY_NAMES[new Date(CY,m-1,bestDay.d).getDay()].slice(0,3)+' '+bestDay.d) : '—', sub: bestDay.d > 0 ? fmtMoney(bestDay.rev) : 'No data', grad: 'linear-gradient(135deg,#b45309,#c9a84c)', shadow: 'rgba(201,168,76,.3)' };
      })(),
      (function(){
        var totalOccRooms = dayData.filter(function(x){ return x.occRooms > 0; }).reduce(function(a,b){ return a + b.occRooms; }, 0);
        return { icon: '🏨', label: 'Total Occ. Rooms', val: totalRooms > 0 ? totalOccRooms.toLocaleString() : '—', sub: totalRooms > 0 ? 'Set total rooms above' : 'Enter hotel rooms count', grad: 'linear-gradient(135deg,#0e7490,#0891b2)', shadow: 'rgba(8,145,178,.3)' };
      })()
    ];
    cards.innerHTML = cardData.map(function(c) {
      return '<div style="background:' + c.grad + ';border-radius:16px;padding:20px 18px;box-shadow:0 8px 24px ' + c.shadow + ';position:relative;overflow:hidden">' +
        '<div style="position:absolute;top:-10px;right:-10px;font-size:52px;opacity:.15">' + c.icon + '</div>' +
        '<div style="font-size:22px;margin-bottom:8px">' + c.icon + '</div>' +
        '<div style="font-size:10px;font-weight:800;color:rgba(255,255,255,.7);letter-spacing:1.2px;margin-bottom:6px;text-transform:uppercase">' + c.label + '</div>' +
        '<div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-.5px">' + c.val + '</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:4px">' + c.sub + '</div></div>';
    }).join('');
  }

  // Charts
  var labels = dayData.map(function(x){ return x.d; });
  var occData = dayData.map(function(x){ return x.occPct || null; });
  var revData  = dayData.map(function(x){ return x.rev > 0 ? parseFloat(x.rev.toFixed(2)) : null; });
  var kgData   = dayData.map(function(x){ return x.kg  > 0 ? parseFloat(Math.ceil(x.kg))  : null; });

  function buildChart(canvasId, chartRef, label1, data1, color1, label2, data2, color2, yLabel1, yLabel2, gradStart, gradEnd) {
    var ctx = document.getElementById(canvasId);
    if (!ctx) return chartRef;
    if (chartRef) { try { chartRef.destroy(); } catch(e){} }
    // Create gradient fill for bars
    var canvas = ctx;
    var chartCtx = canvas.getContext('2d');
    var gradFill = chartCtx.createLinearGradient(0, 0, 0, 300);
    gradFill.addColorStop(0, gradStart || color1);
    gradFill.addColorStop(1, (gradEnd || color1) + '55');
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { type: 'bar', label: label1, data: data1,
            backgroundColor: gradFill, borderColor: color1,
            borderWidth: 0, yAxisID: 'y1',
            borderRadius: 6, borderSkipped: false },
          { type: 'line', label: label2, data: data2,
            borderColor: color2, backgroundColor: color2 + '25',
            borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#fff',
            pointBorderColor: color2, pointBorderWidth: 2,
            yAxisID: 'y2', tension: 0.4, fill: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11, weight: '600' }, boxWidth: 12, padding: 16, usePointStyle: true } },
          tooltip: {
            backgroundColor: '#0d1b2e', titleColor: '#c9a84c', bodyColor: '#fff',
            padding: 10, cornerRadius: 8,
            callbacks: {
              label: function(ctx2) {
                var v = ctx2.raw;
                if (v === null) return null;
                if (ctx2.dataset.yAxisID === 'y2') return ' ' + ctx2.dataset.label + ': ' + v + '%';
                return ' ' + ctx2.dataset.label + ': ' + (yLabel1 === 'KG' ? v + ' kg' : fmtMoney(v));
              }
            }
          }
        },
        scales: {
          y1: { type: 'linear', position: 'left',
            title: { display: true, text: yLabel1, font: { size: 10, weight: '600' }, color: '#64748b' },
            grid: { color: '#f1f5f9', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 10 } } },
          y2: { type: 'linear', position: 'right',
            title: { display: true, text: 'Occupancy %', font: { size: 10, weight: '600' }, color: '#f59e0b' },
            grid: { drawOnChartArea: false },
            ticks: { callback: function(v){ return v + '%'; }, color: '#f59e0b', font: { size: 10 } },
            min: 0, max: 100 },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { display: false } }
        }
      }
    });
  }

  _benchChartRev = buildChart('bench-chart-rev', _benchChartRev, 'Revenue (QR)', revData, '#0284c7', 'Occupancy %', occData, '#f59e0b', 'Revenue (QR)', 'Occupancy %', '#0369a1', '#bfdbfe');
  _benchChartKg  = buildChart('bench-chart-kg',  _benchChartKg,  'KG Washed',   kgData,  '#059669', 'Occupancy %', occData, '#f59e0b', 'KG', 'Occupancy %', '#047857', '#a7f3d0');

  // Day-by-day table — color coded
  var tw = document.getElementById('bench-table-wrap');
  if (tw) {
    var totalRL = dayData.reduce(function(a,b){ return a + (b.deptRevs['Rooms Linen']||0); }, 0);
    var totalOther = totalRev - totalRL;
    var th = '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
      '<thead><tr style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f)">' +
      '<th style="padding:10px 10px;text-align:center;color:#c9a84c;font-size:11px;letter-spacing:.5px">DAY</th>' +
      '<th style="padding:10px 10px;text-align:center;color:#c9a84c;font-size:11px;letter-spacing:.5px">OCC %</th>' +
      (totalRooms > 0 ? '<th style="padding:10px 10px;text-align:center;color:#c9a84c;font-size:11px;letter-spacing:.5px">ROOMS</th>' : '') +
      '<th style="padding:10px 10px;text-align:right;color:#86efac;font-size:11px;letter-spacing:.5px">TOTAL REV (QR)</th>' +
      '<th style="padding:10px 10px;text-align:right;color:#fcd34d;font-size:11px;letter-spacing:.5px">TOTAL KG</th>' +
      '<th style="padding:10px 10px;text-align:right;color:#c4b5fd;font-size:11px;letter-spacing:.5px">REV/ROOM (QR)</th>' +
      '<th style="padding:10px 10px;text-align:right;color:#67e8f9;font-size:11px;letter-spacing:.5px">KG/ROOM</th>' +
      '<th style="padding:10px 10px;text-align:right;color:#93c5fd;font-size:11px;letter-spacing:.5px">ROOMS LINEN</th>' +
      '<th style="padding:10px 10px;text-align:right;color:#d1d5db;font-size:11px;letter-spacing:.5px">OTHER DEPTS</th>' +
      '</tr></thead><tbody>';
    dayData.forEach(function(row, idx) {
      var rlRev = row.deptRevs['Rooms Linen'] || 0;
      var otherRev = row.rev - rlRev;
      var isEmpty = row.rev === 0 && row.occPct === 0;
      var bg = isEmpty ? '#fafafa' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');
      // Occupancy badge color
      var occBadge = '—';
      if (row.occPct > 0) {
        var bc = row.occPct >= 70 ? '#dcfce7' : row.occPct >= 50 ? '#fef9c3' : '#fee2e2';
        var tc = row.occPct >= 70 ? '#15803d' : row.occPct >= 50 ? '#92400e' : '#dc2626';
        occBadge = '<span style="background:' + bc + ';color:' + tc + ';padding:3px 10px;border-radius:20px;font-weight:800;font-size:11px">' + row.occPct.toFixed(1) + '%</span>';
      }
      // Row highlight for high revenue days
      var rowStyle = 'background:' + bg + (isEmpty ? ';opacity:.4' : '') + (row.rev > 2500 ? ';border-left:3px solid #16a34a' : '');
      th += '<tr style="' + rowStyle + '">' +
        '<td style="padding:8px 10px;text-align:center;font-weight:700;color:#0d1b2e">' + DAY_NAMES[new Date(CY,m-1,row.d).getDay()].slice(0,3) + ' <span style="font-size:13px">' + row.d + '</span></td>' +
        '<td style="padding:8px 10px;text-align:center">' + occBadge + '</td>' +
        (totalRooms > 0 ? '<td style="padding:8px 10px;text-align:center;color:#0369a1;font-weight:700">' + (row.occRooms !== null ? row.occRooms : '—') + '</td>' : '') +
        '<td style="padding:8px 10px;text-align:right;font-weight:700;color:#15803d;font-size:12.5px">' + (row.rev > 0 ? f2(row.rev) : '—') + '</td>' +
        '<td style="padding:8px 10px;text-align:right;color:#b45309;font-weight:600">' + (row.kg > 0 ? row.kg.toFixed(2) : '—') + '</td>' +
        '<td style="padding:8px 10px;text-align:right;font-weight:800;color:#7c3aed;font-size:12.5px">' + (row.revPOR !== null ? f2(row.revPOR) : '—') + '</td>' +
        '<td style="padding:8px 10px;text-align:right;color:#0891b2;font-weight:600">' + (row.kgPOR !== null ? row.kgPOR.toFixed(3) : '—') + '</td>' +
        '<td style="padding:8px 10px;text-align:right;color:#1d4ed8">' + (rlRev > 0 ? f2(rlRev) : '—') + '</td>' +
        '<td style="padding:8px 10px;text-align:right;color:#64748b">' + (otherRev > 0 ? f2(otherRev) : '—') + '</td>' +
        '</tr>';
    });
    th += '<tr style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);color:#c9a84c;font-weight:800">' +
      '<td style="padding:10px 10px;text-align:center;letter-spacing:.5px;font-size:11px">TOTAL</td>' +
      '<td style="padding:10px 10px;text-align:center">' + avgOcc.toFixed(1) + '%</td>' +
      (totalRooms > 0 ? '<td style="padding:10px 10px;text-align:center">—</td>' : '') +
      '<td style="padding:10px 10px;text-align:right;color:#86efac">' + f2(totalRev) + '</td>' +
      '<td style="padding:10px 10px;text-align:right;color:#fcd34d">' + totalKg.toFixed(2) + '</td>' +
      '<td style="padding:10px 10px;text-align:right;color:#c4b5fd">' + (avgRevPOR > 0 ? f2(avgRevPOR) : '—') + '</td>' +
      '<td style="padding:10px 10px;text-align:right;color:#67e8f9">' + (avgKgPOR > 0 ? avgKgPOR.toFixed(3) : '—') + '</td>' +
      '<td style="padding:10px 10px;text-align:right;color:#93c5fd">' + (totalRL > 0 ? f2(totalRL) : '—') + '</td>' +
      '<td style="padding:10px 10px;text-align:right;color:#d1d5db">' + (totalOther > 0 ? f2(totalOther) : '—') + '</td>' +
      '</tr></tbody></table>';
    tw.innerHTML = th;
  }

  // Dept breakdown — per-dept colors
  var dw = document.getElementById('bench-dept-wrap');
  if (dw) {
    var deptColors = ['#0284c7','#16a34a','#0891b2','#7c3aed','#d97706','#ea580c'];
    var deptTotals2 = {};
    DEPT_KEYS.forEach(function(dept) { deptTotals2[dept] = 0; });
    dayData.forEach(function(row) {
      DEPT_KEYS.forEach(function(dept) { deptTotals2[dept] += (row.deptRevs[dept] || 0); });
    });
    var deptHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">';
    DEPT_KEYS.forEach(function(dept, idx) {
      var dRev = deptTotals2[dept];
      var pct  = totalRev > 0 ? (dRev / totalRev * 100) : 0;
      var rpr  = (porCount > 0 && dRev > 0 && totalRooms > 0) ? (dRev / porCount / (totalRooms * avgOcc / 100)) : null;
      var col  = deptColors[idx % deptColors.length];
      var col2 = col + '18';
      deptHtml += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">' +
        '<div style="background:' + col + ';padding:12px 16px;display:flex;align-items:center;justify-content:space-between">' +
          '<div style="font-size:13px;font-weight:800;color:#fff">' + (DEPT_ICONS[dept]||'') + ' ' + dept + '</div>' +
          '<div style="background:rgba(255,255,255,.2);color:#fff;font-size:12px;font-weight:800;padding:3px 10px;border-radius:20px">' + pct.toFixed(1) + '%</div>' +
        '</div>' +
        '<div style="padding:14px 16px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:10px">' +
            '<div><div style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:.8px">TOTAL REVENUE</div>' +
            '<div style="font-size:18px;font-weight:800;color:' + col + '">' + (dRev > 0 ? fmtMoney(dRev) : '—') + '</div></div>' +
            '<div style="text-align:right"><div style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:.8px">REV/ROOM/DAY</div>' +
            '<div style="font-size:18px;font-weight:800;color:#7c3aed">' + (rpr !== null ? fmtMoney(rpr) : '—') + '</div></div>' +
          '</div>' +
          '<div style="background:#f8fafc;border-radius:6px;overflow:hidden;height:8px">' +
            '<div style="background:' + col + ';height:100%;width:' + Math.min(100,pct) + '%;border-radius:6px;transition:width .5s ease"></div>' +
          '</div>' +
        '</div></div>';
    });
    deptHtml += '</div>';
    dw.innerHTML = deptHtml;
  }
}

function downloadBenchTemplate() {
  var m   = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
  var mName = MONTH_NAMES[m-1];
  var yr  = CY || new Date().getFullYear();
  var totalRoomsNow = _TOTAL_ROOMS || 161;
  var nd  = dim(yr, m);
  var DAY_NAMES_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  var wb = XLSX.utils.book_new();

  // ── SHEET 1: INSTRUCTIONS ──────────────────────────────────
  var infoData = [
    ["RS PEARL LAUNDRY MANAGEMENT SYSTEM"],
    ["Daily Hotel Occupancy Input Template"],
    [""],
    ["WHAT IS THIS FILE?"],
    ["This template lets you enter hotel occupancy data for any month."],
    ["After filling it in, import it into RS LaundryPro → Benchmark tab → Import Excel."],
    [""],
    ["HOW TO USE — STEP BY STEP"],
    ["Step 1", "Go to the 'Occupancy Data' tab (click the tab at the bottom)"],
    ["Step 2", "Verify the MONTH and YEAR shown at the top of that sheet"],
    ["Step 3", "For each day, enter Occupied Rooms in column D (blue)"],
    ["Step 4", "Optionally enter Occupancy % in column E (green) — or leave it"],
    ["Step 5", "Leave days completely BLANK if no data — do NOT enter 0"],
    ["Step 6", "Save the file as .xlsx format"],
    ["Step 7", "In RS LaundryPro → Benchmark → click Import Excel → select this file"],
    [""],
    ["IMPORTANT RULES"],
    ["DO", "Enter Occupied Rooms (col D) or Occupancy % (col E) — or both"],
    ["DO", "Leave blank for days with no data"],
    ["DO", "Save as .xlsx — do not change the file format"],
    ["DO NOT", "Delete or rename any columns"],
    ["DO NOT", "Enter 0 for missing days — leave completely blank"],
    ["DO NOT", "Change the row structure — data must start from row 9"],
    [""],
    ["COLOR GUIDE (in the Occupancy Data sheet)"],
    ["Blue cells (col D)", "Occupied Rooms — type the number of occupied rooms"],
    ["Green cells (col E)", "Occupancy % — type the percentage e.g. 74.5"],
    ["Weekend rows", "Friday, Saturday, Sunday rows are lightly shaded"],
    [""],
    ["ROOM COUNT REFERENCE"],
    ["Total Rooms", totalRoomsNow + " rooms (your hotel setting)"],
    ["Formula", "Occupancy % = Occupied Rooms divided by Total Rooms x 100"],
    ["Example", "120 rooms occupied / " + totalRoomsNow + " total x 100 = " + (120/totalRoomsNow*100).toFixed(1) + "%"],
    [""],
    ["© Reda Salah · RS LaundryPro Laundry Management System · All Rights Reserved"]
  ];

  var wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  wsInfo['!cols'] = [{wch:20},{wch:70}];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Instructions");

  // ── SHEET 2: OCCUPANCY DATA ────────────────────────────────
  var rows = [];

  // Header rows
  rows.push(["RS PEARL LAUNDRY — DAILY OCCUPANCY TEMPLATE", "", "", "", "", ""]);
  rows.push([mName + " " + yr, "", "", "", "", ""]);
  rows.push(["Total Rooms: " + totalRoomsNow, "", "", "BLUE = Occupied Rooms", "GREEN = Occ %", ""]);
  rows.push(["", "", "", "", "", ""]);

  // Column headers
  rows.push(["DAY", "DATE", "DAY OF WEEK", "OCCUPIED ROOMS", "OCCUPANCY %", "NOTES"]);
  rows.push(["#", "dd mmm yyyy", "auto", "Enter number e.g. 120", "Enter % e.g. 74.5", "Optional"]);

  // Empty separator
  rows.push(["", "", "", "", "", ""]);

  // Day rows
  for (var d = 1; d <= 31; d++) {
    if (d <= nd) {
      var dt   = new Date(yr, m-1, d);
      var dow  = DAY_NAMES_FULL[dt.getDay()];
      var mon  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1];
      var dateStr = String(d).padStart(2,'0') + '-' + mon + '-' + yr;
      rows.push([d, dateStr, dow, "", "", ""]);
    } else {
      rows.push([d, "(not in " + mName + ")", "-", "N/A", "N/A", ""]);
    }
  }

  // Summary
  rows.push(["", "", "", "", "", ""]);
  rows.push(["SUMMARY", "", "", "", "", ""]);
  rows.push(["Days with data",  "=COUNTA(E9:E39)",              "", "", "", ""]);
  rows.push(["Average Occ %",   "=IFERROR(AVERAGE(E9:E39),0)", "", "", "", ""]);
  rows.push(["Highest Occ %",   "=IFERROR(MAX(E9:E39),0)",     "", "", "", ""]);
  rows.push(["Lowest Occ %",    "=IFERROR(MIN(E9:E39),0)",     "", "", "", ""]);
  rows.push(["Total Occ Rooms", "=IFERROR(SUM(D9:D39),0)",     "", "", "", ""]);
  rows.push(["", "", "", "", "", ""]);
  rows.push(["NOTE: Only edit cells in columns D and E (Occupied Rooms and Occupancy %)", "", "", "", "", ""]);
  rows.push(["© Reda Salah · RS LaundryPro Laundry Management System", "", "", "", "", ""]);

  var wsData = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  wsData['!cols'] = [
    {wch:6},   // A: Day
    {wch:15},  // B: Date
    {wch:13},  // C: Day of week
    {wch:18},  // D: Occupied Rooms
    {wch:16},  // E: Occ %
    {wch:25}   // F: Notes
  ];

  // Freeze top rows so headers stay visible when scrolling
  wsData['!freeze'] = {xSplit:0, ySplit:8};

  XLSX.utils.book_append_sheet(wb, wsData, "Occupancy Data");

  // Download with month-specific filename
  var filename = 'RS_Pearl_Occupancy_' + mName + '_' + yr + '.xlsx';
  XLSX.writeFile(wb, filename);
  toast('✅ Template downloaded: ' + filename, 'ok');
}

function importBenchExcel(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      var wb = XLSX.read(data, { type: 'array' });
      var ws = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      // Find data rows — look for rows where col A is a number 1-31
      var m = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
      var days = dim(CY, m);
      var imported = 0;
      rows.forEach(function(row) {
        var dayNum = parseInt(row[0]);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return;
        var occVal = parseFloat(row[2]);
        if (isNaN(occVal)) return;
        var inp = document.getElementById('bocc_' + dayNum);
        if (inp && dayNum <= days) { inp.value = occVal; imported++; }
      });
      input.value = '';
      if (imported > 0) {
        toast('✅ Imported ' + imported + ' occupancy values from Excel', 'ok');
      } else {
        toast('⚠️ No valid occupancy values found — check template format', 'err');
      }
    } catch(err) {
      toast('❌ Error reading file: ' + err.message, 'err');
    }
  };
  reader.readAsArrayBuffer(file);
}

function occRoomsChanged(d) {
  var totalRoomsNow = _TOTAL_ROOMS || parseInt(document.getElementById('bench-total-rooms')?.value) || 161;
  var rInp = document.getElementById('bocc_rooms_' + d);
  var pInp = document.getElementById('bocc_' + d);
  if (!rInp || !pInp) return;
  var rooms = parseFloat(rInp.value);
  if (!isNaN(rooms) && totalRoomsNow > 0) {
    var pct = (rooms / totalRoomsNow * 100);
    pInp.value = Math.min(100, pct).toFixed(1);
  }
  updateOccDot(d);
}

function occPctChanged(d) {
  var totalRoomsNow = _TOTAL_ROOMS || parseInt(document.getElementById('bench-total-rooms')?.value) || 161;
  var rInp = document.getElementById('bocc_rooms_' + d);
  var pInp = document.getElementById('bocc_' + d);
  if (!rInp || !pInp) return;
  var pct = parseFloat(pInp.value);
  if (!isNaN(pct) && totalRoomsNow > 0) {
    rInp.value = Math.round(totalRoomsNow * Math.min(100, pct) / 100);
  }
  updateOccDot(d);
}

function updateOccDot(d) {
  var pInp = document.getElementById('bocc_' + d);
  var dot  = document.getElementById('occ-dot-' + d);
  var cell = document.getElementById('occ-cell-' + d);
  if (!pInp || !dot) return;
  var pct = parseFloat(pInp.value) || 0;
  var col = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : pct > 0 ? '#dc2626' : '#e2e8f0';
  dot.style.background = col;
  if (cell) cell.style.borderColor = pct > 0 ? col : '#e2e8f0';
}

function saveBenchOcc() {
  var m = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
  var days = dim(CY, m);
  var data = {};
  for (var d = 1; d <= days; d++) {
    var inp = document.getElementById('bocc_' + d);
    if (inp && inp.value !== '') {
      var v = parseFloat(inp.value);
      if (!isNaN(v) && v >= 0 && v <= 100) data[d] = v;
    }
  }
  saveBenchOccData(CY, m, data);
  toast('✔ Occupancy saved for ' + MONTH_NAMES[m-1] + ' ' + CY, 'ok');
  renderBenchmark();
}

function fillBenchOcc() {
  var totalRoomsNow = _TOTAL_ROOMS || parseInt(document.getElementById('bench-total-rooms')?.value) || 161;
  var pct = prompt('Enter occupancy % to fill for all days (e.g. 85):');
  if (!pct || isNaN(parseFloat(pct))) return;
  var m = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
  var days = dim(CY, m);
  for (var d = 1; d <= days; d++) {
    var inp = document.getElementById('bocc_' + d);
    if (inp) inp.value = parseFloat(pct);
  }
  renderBenchmark();
}

function clearBenchOcc() {
  if (!confirm('Clear all occupancy data for this month?')) return;
  var m = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
  saveBenchOccData(CY, m, {});
  renderBenchmark();
}

function printBenchmarkPDF() {
  var m = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
  var settings = loadBenchSettings();
  var totalRooms = parseInt(document.getElementById('bench-total-rooms')?.value) || settings.totalRooms || 0;
  var printWin = window.open('', '_blank', 'width=1000,height=750');
  var dateStr = new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'});

  // Grab current rendered content
  var cardsHTML  = document.getElementById('bench-summary-cards')?.innerHTML || '';
  var tableHTML  = document.getElementById('bench-table-wrap')?.innerHTML || '';
  var deptHTML   = document.getElementById('bench-dept-wrap')?.innerHTML || '';

  // Convert charts to images
  var revImg = '', kgImg = '';
  try { revImg = document.getElementById('bench-chart-rev')?.toDataURL('image/png') || ''; } catch(e){}
  try { kgImg  = document.getElementById('bench-chart-kg')?.toDataURL('image/png')  || ''; } catch(e){}

  var html2 = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<title>Pearl Benchmark — ' + MONTH_NAMES[m-1] + ' ' + CY + '</title>' +
    '<style>' +
      'body{margin:0;padding:24px 28px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f8fafc;color:#1a2332}' +
      '.header{background:linear-gradient(135deg,#0d1b2e,#1e3a5f);color:#fff;padding:20px 24px;border-radius:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}' +
      '.header h1{margin:0;font-size:20px;font-weight:800;color:#c9a84c}' +
      '.header p{margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)}' +
      '.header-right{text-align:right;font-size:11px;color:rgba(255,255,255,.7);line-height:1.8}' +
      '.cards{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px}' +
      '.charts{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}' +
      '.chart-box{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}' +
      '.chart-hdr{padding:10px 14px;font-size:12px;font-weight:800;color:#fff}' +
      '.chart-hdr.rev{background:linear-gradient(135deg,#0369a1,#0284c7)}' +
      '.chart-hdr.kg{background:linear-gradient(135deg,#047857,#059669)}' +
      'img{width:100%;display:block}' +
      '.section{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:16px}' +
      '.section-hdr{padding:10px 14px;font-size:12px;font-weight:800;color:#fff}' +
      '.section-hdr.table{background:linear-gradient(135deg,#0d1b2e,#1e3a5f);color:#c9a84c}' +
      '.section-hdr.dept{background:linear-gradient(135deg,#4c1d95,#6d28d9)}' +
      '.section-body{padding:0;overflow-x:auto}' +
      'table{width:100%;border-collapse:collapse;font-size:11px}' +
      'th,td{padding:7px 9px}' +
      '.footer{text-align:center;font-size:10px;color:#94a3b8;margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0}' +
      '@media print{body{background:#fff;padding:12px 16px}@page{size:A4 landscape;margin:8mm}.cards{grid-template-columns:repeat(6,1fr)}}' +
    '</st'+'yle></he'+'ad><body>' +
    '<div class="header">' +
      '<div><div class="header h1">🎯 Benchmark Report — ' + MONTH_NAMES[m-1] + ' ' + CY + '</div>' +
      '<p>RS LaundryPro Laundry Management System' + (totalRooms > 0 ? ' · ' + totalRooms + ' total rooms' : '') + '</p></div>' +
      '<div class="header-right">Prepared by: Reda Salah<br>Date: ' + dateStr + '<br>© Reda Salah · <span class="footer-system-name">RS LaundryPro</span> · All Rights Reserved</div>' +
    '</div>' +
    '<div class="cards">' + cardsHTML + '</div>' +
    '<div class="charts">' +
      '<div class="chart-box"><div class="chart-hdr rev">📈 Daily Revenue vs Occupancy %</div>' + (revImg ? '<img src="' + revImg + '">' : '') + '</div>' +
      '<div class="chart-box"><div class="chart-hdr kg">⚖️ Daily KG vs Occupancy %</div>' + (kgImg ? '<img src="' + kgImg + '">' : '') + '</div>' +
    '</div>' +
    '<div class="section"><div class="section-hdr table">📊 Day-by-Day Benchmark Table</div><div class="section-body">' + tableHTML + '</div></div>' +
    '<div class="section"><div class="section-hdr dept">🏢 Department Breakdown</div><div class="section-body" style="padding:14px">' + deptHTML + '</div></div>' +
    '<div class="footer">© ' + CY + ' Reda Salah · RS LaundryPro Laundry Management System · All Rights Reserved</div>' +
    '<scr'+'ipt>window.onload=function(){window.print();}</scr'+'ipt>' +
    '</bo'+'dy></ht'+'ml>';

  printWin.document.write(html2);
  printWin.document.close();
}

function exportBenchmarkExcel() {
  var m = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
  var days = dim(CY, m);
  var occ = loadBenchOcc(CY, m);
  var settings = loadBenchSettings();
  var totalRooms = parseInt(document.getElementById('bench-total-rooms')?.value) || settings.totalRooms || 0;
  var rows = [['Day','Date','Occ %','Occ Rooms','Total Rev (QR)','Total KG','Rev/Room (QR)','KG/Room','Rooms Linen Rev','Other Depts Rev']];
  for (var d = 1; d <= days; d++) {
    var occPct = parseFloat(document.getElementById('bocc_' + d)?.value) || occ[d] || 0;
    var occRooms = totalRooms > 0 ? Math.round(totalRooms * occPct / 100) : '';
    var dt2 = dayTotals(CY, m, d);
    var rlRev2 = 0;
    MASTER['Rooms Linen'].forEach(function(_, i) { rlRev2 += getVal(CY, m, 'Rooms Linen', i, d-1) * getPriceForDate('Rooms Linen', i, CY, m, d); });
    var revPOR2 = (occRooms && occRooms > 0 && dt2.qr > 0) ? (dt2.qr / occRooms).toFixed(2) : '';
    var kgPOR2  = (occRooms && occRooms > 0 && dt2.kg > 0)  ? (dt2.kg  / occRooms).toFixed(3) : '';
    var dateStr2 = DAY_NAMES[new Date(CY,m-1,d).getDay()] + ' ' + d + ' ' + MONTH_NAMES[m-1];
    rows.push([d, dateStr2, occPct||'', occRooms, dt2.qr > 0 ? dt2.qr.toFixed(2) : '', dt2.kg > 0 ? dt2.kg.toFixed(2) : '', revPOR2, kgPOR2, rlRev2 > 0 ? rlRev2.toFixed(2) : '', dt2.qr - rlRev2 > 0 ? (dt2.qr - rlRev2).toFixed(2) : '']);
  }
  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = rows[0].map(function(){ return { wch: 16 }; });
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Benchmark');
  XLSX.writeFile(wb, 'Pearl_Benchmark_' + MONTH_NAMES[m-1] + '_' + CY + '.xlsx');
}

function initBenchmark() {
  var bm = document.getElementById('bench-month');
  if (bm && bm.options.length === 0) {
    MONTH_NAMES.forEach(function(mn, i) {
      var o = document.createElement('option');
      o.value = i + 1; o.textContent = mn;
      bm.appendChild(o);
    });
    bm.value = new Date().getMonth() + 1;
  }
  // Load saved total rooms
  var settings = loadBenchSettings();
  if (settings.totalRooms) {
    var tr2 = document.getElementById('bench-total-rooms');
    if (tr2 && !tr2.value) tr2.value = settings.totalRooms;
  }
  // Load occupancy from Firebase
  var curM = parseInt(document.getElementById('bench-month')?.value || new Date().getMonth() + 1);
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/benchmark/' + CY + '/' + curM).then(function(fb) {
      if (fb && typeof fb === 'object') {
        try { _STORE.setItem(benchKey(CY, curM), JSON.stringify(fb)); } catch(e) {}
      }
      renderBenchmark();
    });
    window._fbLoadKey('pearl/benchmark/settings').then(function(fb) {
      if (fb && fb.totalRooms) {
        try { _STORE.setItem(benchSettingsKey(), JSON.stringify(fb)); } catch(e) {}
        var tr3 = document.getElementById('bench-total-rooms');
        if (tr3 && !tr3.value) { tr3.value = fb.totalRooms; }
      }
    });
  } else {
    renderBenchmark();
  }
}

var _anaTab = 'charts';

function renderKPIs(m) {
  var wrap = document.getElementById('ana-kpi-wrap');
  if (!wrap) return;

  var today  = new Date();
  var todayD = (today.getMonth()+1 === m && today.getFullYear() === CY) ? today.getDate() : dim(CY, m);
  var prevM  = m === 1 ? 12 : m - 1;
  var prevY  = m === 1 ? CY - 1 : CY;

  // ── Gather current month ──
  var curQR = 0, curKG = 0, actDays = 0;
  for (var d = 1; d <= dim(CY,m); d++) {
    var dt = dayTotals(CY, m, d);
    curQR += dt.qr; curKG += dt.kg;
    if (dt.qr > 0) actDays++;
  }
  var curAvgQR = actDays > 0 ? curQR / actDays : 0;
  var curAvgKG = actDays > 0 ? curKG / actDays : 0;

  // ── Gather previous month ──
  var prevQR = 0, prevKG = 0, prevActs = 0;
  for (var d3 = 1; d3 <= dim(prevY,prevM); d3++) {
    var pd = dayTotals(prevY, prevM, d3);
    prevQR += pd.qr; prevKG += pd.kg;
    if (pd.qr > 0) prevActs++;
  }
  var prevAvgQR = prevActs > 0 ? prevQR / prevActs : 0;
  var prevAvgKG = prevActs > 0 ? prevKG / prevActs : 0;

  // ── Same month last year ──
  var lyQR = 0, lyKG = 0;
  for (var d4 = 1; d4 <= dim(CY-1,m); d4++) {
    var ld = dayTotals(CY-1, m, d4);
    lyQR += ld.qr; lyKG += ld.kg;
  }

  // ── Today vs yesterday ──
  var todayRev = dayTotals(CY, m, todayD).qr;
  var todayKG  = dayTotals(CY, m, todayD).kg;
  var yRev = todayD > 1 ? dayTotals(CY, m, todayD-1).qr : 0;
  var yKG  = todayD > 1 ? dayTotals(CY, m, todayD-1).kg : 0;

  // ── Helpers ──
  function pct(cur, prev) {
    if (!prev || prev === 0) return null;
    return (cur - prev) / prev * 100;
  }

  function badge(val) {
    if (val === null) return '<span style="font-size:10px;color:rgba(255,255,255,.3)">— N/A</span>';
    var up  = val >= 0;
    var col = up ? '#86efac' : '#fca5a5';
    var bg  = up ? 'rgba(22,163,74,.3)' : 'rgba(220,38,38,.3)';
    return '<span style="background:' + bg + ';color:' + col + ';padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800">' +
      (up ? '▲' : '▼') + ' ' + Math.abs(val).toFixed(1) + '%</span>';
  }

  function fmtCardVal(val, unit, nd) {
    if (unit === 'kg') return f2(val);
    if (unit && unit.indexOf('/') === 0) return Math.round(val).toString();
    return fmtMoney(val);
  }
  function card(label, val, unit, r1val, r1lbl, r2val, r2lbl, icon, grad) {
    return '<div style="background:' + grad + ';border-radius:14px;padding:18px 20px;position:relative;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.15)">' +
      '<div style="position:absolute;top:-6px;right:-6px;font-size:48px;opacity:.08">' + icon + '</div>' +
      '<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:5px">' + label + '</div>' +
      '<div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:10px;line-height:1.1">' +
        fmtCardVal(val, unit) +
        (unit ? ' <span style="font-size:12px;opacity:.6">' + unit + '</span>' : '') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:5px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:4px">' +
          '<span style="font-size:10px;color:rgba(255,255,255,.4);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + r1lbl + '</span>' +
          badge(r1val) +
        '</div>' +
        (r2lbl ? '<div style="display:flex;align-items:center;justify-content:space-between;gap:4px">' +
          '<span style="font-size:10px;color:rgba(255,255,255,.4);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + r2lbl + '</span>' +
          badge(r2val) +
        '</div>' : '') +
      '</div>' +
    '</div>';
  }

  var prevLbl = MONTH_NAMES[prevM-1] + (prevY !== CY ? ' ' + prevY : '');

  var cards = [
    card('Monthly Revenue', curQR, '',
      pct(curQR, prevQR), 'vs ' + prevLbl,
      pct(curQR, lyQR),   'vs ' + MONTH_NAMES[m-1] + ' ' + (CY-1),
      '💰', 'linear-gradient(135deg,#1d4ed8,#2563eb)'),

    card('Avg Daily Revenue', curAvgQR, '',
      pct(curAvgQR, prevAvgQR), 'vs ' + prevLbl + ' avg',
      pct(todayRev, yRev),      'today vs yesterday',
      '📈', 'linear-gradient(135deg,#b45309,#d97706)'),

    card('Total KG Washed', curKG, 'kg',
      pct(curKG, prevKG), 'vs ' + prevLbl,
      pct(curKG, lyKG),   'vs ' + MONTH_NAMES[m-1] + ' ' + (CY-1),
      '⚖️', 'linear-gradient(135deg,#15803d,#16a34a)'),

    card('Avg Daily KG', curAvgKG, 'kg',
      pct(curAvgKG, prevAvgKG), 'vs ' + prevLbl + ' avg',
      pct(todayKG, yKG),        'today vs yesterday',
      '📦', 'linear-gradient(135deg,#0e7490,#0891b2)'),

    card('Active Days', actDays, '/ ' + dim(CY,m),
      pct(actDays, prevActs), 'vs ' + prevLbl,
      null, null,
      '📅', 'linear-gradient(135deg,#334155,#475569)'),
  ];

  wrap.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
      '<div>' +
        '<div style="font-size:15px;font-weight:800;color:#0d1b2e">📊 KPI Summary — ' + MONTH_NAMES[m-1] + ' ' + CY + '</div>' +
        '<div style="font-size:11px;color:#94a3b8;margin-top:2px">Comparing vs previous month & same month last year</div>' +
      '</div>' +
      '<div style="display:flex;gap:14px">' +
        '<div style="display:flex;align-items:center;gap:5px"><span style="color:#16a34a;font-weight:900;font-size:13px">▲</span><span style="font-size:11px;color:#64748b">Increase</span></div>' +
        '<div style="display:flex;align-items:center;gap:5px"><span style="color:#dc2626;font-weight:900;font-size:13px">▼</span><span style="font-size:11px;color:#64748b">Decrease</span></div>' +
      '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:12px">' +
      cards.join('') +
    '</div>' +
    // ── Insights + Top/Bottom rendered below KPI cards ──
    renderInsightsPanel(m) +
    renderTopBottomPanel(m);
}

function renderInsightsPanel(m) {
  var insights = generateInsights(m);
  if (!insights.length) return '';

  var levelCfg = {
    warning:  { bg:'#fee2e2', border:'#fca5a5', col:'#b91c1c', label:'Warning' },
    watch:    { bg:'#fffbeb', border:'#fde68a', col:'#92400e', label:'Watch' },
    positive: { bg:'#f0fdf4', border:'#86efac', col:'#15803d', label:'Positive' },
    info:     { bg:'#eff6ff', border:'#bfdbfe', col:'#1d4ed8', label:'Info' }
  };

  var rows = insights.map(function(ins, idx) {
    var cfg = levelCfg[ins.level] || levelCfg.info;
    return '<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 14px;background:' + cfg.bg + ';border:1px solid ' + cfg.border + ';border-radius:10px">' +
      '<span style="font-size:20px;flex-shrink:0;line-height:1.3">' + ins.icon + '</span>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:13px;font-weight:700;color:' + cfg.col + '">' + ins.msg + '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:2px">' + ins.detail + '</div>' +
      '</div>' +
      '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + cfg.border + ';color:' + cfg.col + ';white-space:nowrap;flex-shrink:0;align-self:center">' + cfg.label + '</span>' +
    '</div>';
  }).join('');

  return '<div style="margin-top:20px">' +
    '<div style="font-size:15px;font-weight:800;color:#0d1b2e;margin-bottom:10px">🧠 Auto Insights — ' + MONTH_NAMES[m-1] + ' ' + CY + '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:8px">' + rows + '</div>' +
  '</div>';
}

function getTopBottomItems(m) {
  // Build a flat list of all items with their monthly revenue
  var allItems = [];
  var totalQR = 0;

  DEPT_KEYS.forEach(function(dept) {
    MASTER[dept].forEach(function(_, i) {
      var qr = 0;
      var nd = dim(CY, m);
      for (var d = 1; d <= nd; d++) {
        var v  = getVal(CY, m, dept, i, d - 1);
        var pr = getPriceForCalc(dept, i, CY, m, d);
        qr += v * pr;
      }
      if (qr > 0) {
        allItems.push({
          name: getN(dept, i),
          dept: dept,
          qr:   qr,
          pct:  0  // filled below
        });
        totalQR += qr;
      }
    });
  });

  // Calculate percentages
  allItems.forEach(function(item) {
    item.pct = totalQR > 0 ? (item.qr / totalQR * 100) : 0;
  });

  // Sort by revenue descending
  allItems.sort(function(a, b) { return b.qr - a.qr; });

  return { items: allItems, totalQR: totalQR };
}


function renderTopBottomPanel(m) {
  var data = getTopBottomItems(m);
  var items = data.items;
  if (!items.length) return '';

  var medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  var DEPT_COLORS2 = ['#2563eb','#16a34a','#0891b2','#7c3aed','#d97706','#db2777'];

  function itemRow(item, rank, isTop) {
    var barW = Math.max(4, Math.round(item.pct * 1.8));
    var medal = isTop ? (medals[rank] || (rank+1)) : '';
    var rankNum = isTop ? '' : '<span style="font-size:11px;font-weight:700;color:#94a3b8;width:20px;text-align:center;flex-shrink:0">' + (items.length - rank) + '</span>';
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1f5f9">' +
      (isTop ? '<span style="font-size:16px;width:24px;text-align:center;flex-shrink:0">' + medal + '</span>' : rankNum) +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:12px;font-weight:700;color:#0d1b2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + item.name + '</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:1px">' + item.dept + '</div>' +
        '<div style="margin-top:4px;height:4px;background:#f1f5f9;border-radius:2px;overflow:hidden">' +
          '<div style="height:100%;width:' + barW + '%;background:' + (isTop?'#2563eb':'#dc2626') + ';border-radius:2px"></div>' +
        '</div>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0">' +
        '<div style="font-size:12px;font-weight:800;color:#0d1b2e">' + fmtMoney(item.qr) + '</div>' +
        '<div style="font-size:10px;color:#94a3b8">' + item.pct.toFixed(1) + '%</div>' +
      '</div>' +
    '</div>';
  }

  var top5 = items.slice(0, 5);
  var bot5 = items.slice(-5).reverse();

  var topHTML = top5.map(function(it,i){ return itemRow(it,i,true); }).join('');
  var botHTML = bot5.map(function(it,i){ return itemRow(it,i,false); }).join('');

  return '<div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px">' +
      '<div style="font-size:13px;font-weight:800;color:#0d1b2e;margin-bottom:4px">🏆 Top 5 Items</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:12px">Highest revenue items · ' + MONTH_NAMES[m-1] + ' ' + CY + '</div>' +
      topHTML +
    '</div>' +
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px">' +
      '<div style="font-size:13px;font-weight:800;color:#0d1b2e;margin-bottom:4px">📉 Bottom 5 Items</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:12px">Lowest revenue (excl. zero) · ' + MONTH_NAMES[m-1] + ' ' + CY + '</div>' +
      botHTML +
    '</div>' +
  '</div>';
}

function showAnalyticsTab(name) {
  _anaTab = name;
  ['charts','yoy','trend'].forEach(function(t) {
    var el = document.getElementById('atab-' + t);
    var btn = document.getElementById('atab-btn-' + t);
    if (el) el.style.display = t === name ? 'block' : 'none';
    if (btn) {
      btn.style.borderBottomColor = t === name ? '#0d1b2e' : 'transparent';
      btn.style.color = t === name ? '#0d1b2e' : '#64748b';
      btn.style.fontWeight = t === name ? '700' : '600';
    }
  });
  if (name === 'yoy') renderYoY();
  if (name === 'trend') renderTrends();
}

function renderYoY() {
  var m   = parseInt(document.getElementById('yoy-month')?.value || new Date().getMonth()+1);
  var y1  = parseInt(document.getElementById('yoy-y1')?.value || CY);
  var y2  = parseInt(document.getElementById('yoy-y2')?.value || (CY-1));
  var wrap = document.getElementById('yoy-wrap');
  if (!wrap) return;

  // Populate selects if empty
  ['yoy-month','yoy-y1','yoy-y2'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (id === 'yoy-month' && el.options.length === 0) {
      MONTH_NAMES.forEach(function(mn,i){ var o=document.createElement('option'); o.value=i+1; o.textContent=mn; if(i+1===m) o.selected=true; el.appendChild(o); });
    } else if (id !== 'yoy-month' && el.options.length === 0) {
      buildYearOpts(el, id==='yoy-y1'?CY:CY-1);
    }
  });

  var data1 = monthTotals(y1, m);
  var data2 = monthTotals(y2, m);

  var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">';
  function yoyCard(label, v1, v2, fmt) {
    var diff = v1 - v2; var pct = v2 > 0 ? (diff/v2*100) : 0;
    var col = diff >= 0 ? '#16a34a' : '#dc2626';
    var arrow = diff >= 0 ? '↑' : '↓';
    return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px">' +
      '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:10px;letter-spacing:.8px">' + label.toUpperCase() + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">' +
        '<div style="background:#eff6ff;border-radius:8px;padding:10px;text-align:center">' +
          '<div style="font-size:10px;color:#0369a1;font-weight:700;margin-bottom:4px">' + y1 + '</div>' +
          '<div style="font-size:18px;font-weight:800;color:#0d1b2e">' + fmt(v1) + '</div>' +
        '</div>' +
        '<div style="background:#f0fdf4;border-radius:8px;padding:10px;text-align:center">' +
          '<div style="font-size:10px;color:#15803d;font-weight:700;margin-bottom:4px">' + y2 + '</div>' +
          '<div style="font-size:18px;font-weight:800;color:#0d1b2e">' + fmt(v2) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="text-align:center;font-size:13px;font-weight:800;color:' + col + '">' +
        arrow + ' ' + Math.abs(pct).toFixed(1) + '% (' + (diff>=0?'+':'') + fmt(diff) + ')' +
      '</div></div>';
  }
  html += yoyCard('Revenue (QR)', data1.qr, data2.qr, function(v){ return fmtMoney(Math.abs(v)); });
  html += yoyCard('KG Washed', data1.kg, data2.kg, function(v){ return Math.ceil(Math.abs(v))+'kg'; });
  html += yoyCard('Total Pieces', data1.pcs, data2.pcs, function(v){ return Math.abs(v).toLocaleString()+'pcs'; });
  html += '</div>';

  // Dept comparison table
  html += '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden">' +
    '<div style="background:#0d1b2e;padding:12px 16px;font-size:12px;font-weight:800;color:#c9a84c">' +
      '🏢 Department Comparison — ' + MONTH_NAMES[m-1] + ' ' + y1 + ' vs ' + y2 +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#f8fafc">' +
      '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px">DEPT</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#0369a1;font-size:11px">' + y1 + ' QR</th>' +
      '<th style="padding:9px 12px;text-align:right;color:#15803d;font-size:11px">' + y2 + ' QR</th>' +
      '<th style="padding:9px 12px;text-align:right;font-size:11px">CHANGE</th>' +
    '</tr></thead><tbody>';
  DEPT_KEYS.forEach(function(dept, idx) {
    var d1 = data1.byDept[dept]?.qr || 0;
    var d2 = data2.byDept[dept]?.qr || 0;
    var diff2 = d1 - d2; var pct2 = d2 > 0 ? (diff2/d2*100) : 0;
    var col2 = diff2 >= 0 ? '#16a34a' : '#dc2626';
    var bg2 = idx%2===0?'#fff':'#f8fafc';
    html += '<tr style="background:' + bg2 + '">' +
      '<td style="padding:8px 12px;font-weight:600;color:#0d1b2e">' + (DEPT_ICONS[dept]||'') + ' ' + dept + '</td>' +
      '<td style="padding:8px 12px;text-align:right;color:#0369a1;font-weight:600">' + (d1>0?f2(d1):'—') + '</td>' +
      '<td style="padding:8px 12px;text-align:right;color:#15803d;font-weight:600">' + (d2>0?f2(d2):'—') + '</td>' +
      '<td style="padding:8px 12px;text-align:right;font-weight:700;color:' + col2 + '">' + (d1>0||d2>0 ? (diff2>=0?'+':'') + pct2.toFixed(1)+'%' : '—') + '</td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}
