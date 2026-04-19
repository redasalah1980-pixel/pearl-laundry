// ── Login page canvas background animation ── DEEP SPACE ──
(function() {
  function initLoginCanvas() {
    var canvas = document.getElementById('login-canvas');
    if (!canvas) return;
    var ctx  = canvas.getContext('2d');
    var W, H, raf = null;
    var t = 0;
    var stars = [], shooters = [], shootTimer = 0, burstTimer = 0;
    var running = true;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      stars = [];
      // 20 twinkling stars — white/blue with gold-tinted ones
      for (var i = 0; i < 20; i++) {
        var isGold = Math.random() > 0.65;
        stars.push({
          x:    rand(0.05, 0.95) * W,
          y:    rand(0.05, 0.90) * H,
          r:    rand(1.2, 2.8),
          baseA: rand(0.55, 0.9),
          tw:   rand(0, Math.PI * 2),
          tws:  rand(0.012, 0.030),        // pulse speed
          vx:   rand(-0.08, 0.08),         // gentle drift
          vy:   rand(-0.04, 0.04),
          gold: isGold,
          // 4-point sparkle arms
          arms: rand(2.5, 5.0)
        });
      }
      // Extra 200 tiny background stars — no drift, just twinkle
      for (var j = 0; j < 200; j++) {
        stars.push({
          x: rand(0, W), y: rand(0, H),
          r: rand(0.15, 0.7),
          baseA: rand(0.15, 0.45),
          tw: rand(0, Math.PI*2),
          tws: rand(0.004, 0.012),
          vx: 0, vy: 0,
          gold: Math.random() > 0.82,
          arms: 0
        });
      }
    }

    function spawnShooter(cluster) {
      // Start from top or top-right edges, travel diagonally down-right
      var sx = rand(0.05, 0.75) * W;
      var sy = rand(0, 0.15) * H;
      var angle = rand(0.18, 0.42); // radians — diagonal
      var isGold = Math.random() > 0.45;
      shooters.push({
        x: sx, y: sy,
        angle: angle,
        speed: rand(8, 15),
        len:   rand(100, 200),
        life:  1.0,
        decay: rand(0.010, 0.018),
        gold:  isGold,
        width: rand(1.2, 2.2)
      });
    }

    function drawBG() {
      var bg = ctx.createRadialGradient(W*0.5, H*0.38, 0, W*0.5, H*0.38, Math.max(W,H)*0.95);
      bg.addColorStop(0,   '#0b1729');
      bg.addColorStop(0.45,'#070f1c');
      bg.addColorStop(0.8, '#040b14');
      bg.addColorStop(1,   '#020810');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStars() {
      stars.forEach(function(s) {
        // Drift
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
        // Pulse brightness
        s.tw += s.tws;
        var pulse = 0.45 + 0.55 * Math.sin(s.tw);
        var a = s.baseA * pulse;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.gold ? '#d4aa55' : (s.r > 0.8 ? '#ddeeff' : '#c0d4f0');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        // Sparkle cross on bright foreground stars when pulsing bright
        if (s.arms > 0 && pulse > 0.70) {
          ctx.globalAlpha = a * 0.35;
          ctx.strokeStyle = s.gold ? '#c9a84c' : '#cce0ff';
          ctx.lineWidth = 0.7;
          var sp = s.arms * pulse;
          ctx.beginPath();
          ctx.moveTo(s.x - sp, s.y); ctx.lineTo(s.x + sp, s.y);
          ctx.moveTo(s.x, s.y - sp); ctx.lineTo(s.x, s.y + sp);
          ctx.stroke();
          // Diagonal shorter arms
          ctx.globalAlpha = a * 0.12;
          var sp2 = sp * 0.6;
          ctx.beginPath();
          ctx.moveTo(s.x - sp2, s.y - sp2); ctx.lineTo(s.x + sp2, s.y + sp2);
          ctx.moveTo(s.x + sp2, s.y - sp2); ctx.lineTo(s.x - sp2, s.y + sp2);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    }

    function drawShooters() {
      // Regular shooter every ~3s (180 frames at 60fps)
      shootTimer++;
      if (shootTimer > 180 && shooters.length < 4) {
        shootTimer = 0;
        spawnShooter(false);
        // Occasional burst of 2-3 close together
        if (Math.random() > 0.65) {
          setTimeout(function(){ if(running) spawnShooter(true); }, 120);
          if (Math.random() > 0.5) {
            setTimeout(function(){ if(running) spawnShooter(true); }, 260);
          }
        }
      }

      shooters = shooters.filter(function(s) {
        s.life -= s.decay;
        if (s.life <= 0) return false;

        var tx = s.x + Math.cos(s.angle) * s.len;
        var ty = s.y + Math.sin(s.angle) * s.len;

        // Trail gradient: transparent tail → bright body → white-gold tip
        var grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
        if (s.gold) {
          grad.addColorStop(0,    'rgba(180,130,30,0)');
          grad.addColorStop(0.35, 'rgba(201,168,76,' + (s.life * 0.85) + ')');
          grad.addColorStop(0.78, 'rgba(230,195,100,' + (s.life * 0.95) + ')');
          grad.addColorStop(1,    'rgba(255,240,200,' + (s.life * 0.9)  + ')');
        } else {
          grad.addColorStop(0,    'rgba(180,210,255,0)');
          grad.addColorStop(0.35, 'rgba(200,225,255,' + (s.life * 0.7)  + ')');
          grad.addColorStop(0.78, 'rgba(220,238,255,' + (s.life * 0.9)  + ')');
          grad.addColorStop(1,    'rgba(255,255,255,' + (s.life * 0.95) + ')');
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth   = s.width * s.life;
        ctx.lineCap     = 'round';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Gold tip glow
        if (s.gold) {
          var tipGlow = ctx.createRadialGradient(tx, ty, 0, tx, ty, 6);
          tipGlow.addColorStop(0, 'rgba(255,240,160,' + (s.life * 0.6) + ')');
          tipGlow.addColorStop(1, 'rgba(201,168,76,0)');
          ctx.fillStyle = tipGlow;
          ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();
        }

        // Advance position
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        return true;
      });
    }

    function drawVignette() {
      var v = ctx.createRadialGradient(W*0.5, H*0.5, H*0.05, W*0.5, H*0.5, H*0.82);
      v.addColorStop(0,    'rgba(0,0,0,0)');
      v.addColorStop(0.6,  'rgba(0,0,0,0.06)');
      v.addColorStop(1,    'rgba(2,6,16,0.55)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }

    var _lastStarFrame = 0;
    function draw(ts) {
      if (!running) return;
      // Run at 30fps — good enough for stars, saves 50% CPU
      if (ts && ts - _lastStarFrame < 33) { raf = requestAnimationFrame(draw); return; }
      _lastStarFrame = ts || 0;
      t++;
      ctx.clearRect(0, 0, W, H);
      drawBG();
      drawStars();
      drawShooters();
      drawVignette();
      raf = requestAnimationFrame(draw);
    }

    // Stop animation once logged in (save CPU)
    window._stopLoginCanvas = function() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  // Init when login page is visible
  document.addEventListener('DOMContentLoaded', function() {
    initLoginCanvas();
  });
})();


// ════════════════════════════════════════════════════════════════
//  SYSTEM DIAGNOSTICS — Read-only health check
// ════════════════════════════════════════════════════════════════
function runDiagnostics() {
  var btn       = document.getElementById('diag-run-btn');
  var resultsEl = document.getElementById('diag-results');
  var bannerEl  = document.getElementById('diag-banner');
  var tsEl      = document.getElementById('diag-timestamp');
  if (!resultsEl) return;

  // ── Show progress bar, hide old results ──
  btn.innerHTML = '⏳ Running...';
  btn.disabled  = true;
  bannerEl.style.display = 'none';

  // Show the persistent progress bar
  var progressWrap = document.getElementById('diag-progress-wrap');
  if (progressWrap) progressWrap.style.display = 'block';

  // Reset progress bar
  var _diagTotal = 18;
  var _checkCount = 0;
  updateProgress(0, 'Starting diagnostics...');

  // Clear previous results and show running indicator
  resultsEl.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;gap:14px;padding:28px;color:#94a3b8">' +
      '<div style="display:flex;gap:5px">' +
        '<div style="width:7px;height:7px;border-radius:50%;background:#0d1b2e;animation:diagPulse 1.2s ease-in-out infinite"></div>' +
        '<div style="width:7px;height:7px;border-radius:50%;background:#c9a84c;animation:diagPulse 1.2s ease-in-out .4s infinite"></div>' +
        '<div style="width:7px;height:7px;border-radius:50%;background:#0d1b2e;animation:diagPulse 1.2s ease-in-out .8s infinite"></div>' +
      '</div>' +
      '<span style="font-size:13px;font-weight:600">Running all checks...</span>' +
    '</div>';

  // Inject animation keyframes once
  if (!document.getElementById('diag-style')) {
    var s = document.createElement('style');
    s.id = 'diag-style';
    s.textContent = '@keyframes diagPulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}';
    document.head.appendChild(s);
  }

  function updateProgress(step, label) {
    var pct = Math.min(95, Math.round((step / _diagTotal) * 100));
    var fill = document.getElementById('diag-progress-fill');
    var pctEl = document.getElementById('diag-progress-pct');
    var lblEl = document.getElementById('diag-step-label');
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (lblEl && label) lblEl.textContent = label;
  }

  var checks  = [];
  var pending = 0;

  function addCheck(label, status, detail, group) {
    checks.push({ label: label, status: status, detail: detail, group: group || 'General' });
    _checkCount++;
    updateProgress(_checkCount, null);
  }

  function addCheck(label, status, detail, group) {
    checks.push({ label: label, status: status, detail: detail, group: group || 'General' });
  }

  function finalise() {
    var fails  = checks.filter(function(c){ return c.status === 'fail'; }).length;
    var warns  = checks.filter(function(c){ return c.status === 'warn'; }).length;
    var passes = checks.filter(function(c){ return c.status === 'ok';   }).length;

    // Complete progress bar to 100%
    updateProgress(18, 'All checks complete ✓');
    var fill = document.getElementById('diag-progress-fill');
    var pctEl = document.getElementById('diag-progress-pct');
    if (fill) fill.style.width = '100%';
    if (pctEl) pctEl.textContent = '100%';

    // Banner
    bannerEl.style.display = 'flex';
    if (fails > 0) {
      bannerEl.style.background = '#fef2f2';
      bannerEl.style.border     = '1.5px solid #fecaca';
      bannerEl.style.color      = '#dc2626';
      bannerEl.innerHTML        = '🔴 ' + fails + ' issue(s) found that need attention · ' + warns + ' warning(s) · ' + passes + ' passed';
    } else if (warns > 0) {
      bannerEl.style.background = '#fffbeb';
      bannerEl.style.border     = '1.5px solid #fde68a';
      bannerEl.style.color      = '#92400e';
      bannerEl.innerHTML        = '🟡 ' + warns + ' warning(s) to review · ' + passes + ' passed';
    } else {
      bannerEl.style.background = '#f0fdf4';
      bannerEl.style.border     = '1.5px solid #86efac';
      bannerEl.style.color      = '#15803d';
      bannerEl.innerHTML        = '✅ All ' + passes + ' checks passed — system is healthy';
    }

    // Group checks
    var groups = {};
    checks.forEach(function(c) {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });

    var html = '';
    Object.keys(groups).forEach(function(g) {
      html += '<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;padding:8px 2px 6px">' + g + '</div>';
      html += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">';
      groups[g].forEach(function(c) {
        var bg    = c.status==='ok'   ? '#f0fdf4' : c.status==='warn' ? '#fffbeb' : '#fef2f2';
        var bdr   = c.status==='ok'   ? '#86efac' : c.status==='warn' ? '#fde68a' : '#fecaca';
        var col   = c.status==='ok'   ? '#15803d' : c.status==='warn' ? '#92400e' : '#dc2626';
        var icon  = c.status==='ok'   ? '✅' : c.status==='warn' ? '⚠️' : '❌';
        html += '<div class="diag-check" style="display:flex;align-items:flex-start;gap:10px;padding:11px 13px;background:' + bg + ';border:1.5px solid ' + bdr + ';border-radius:10px;box-sizing:border-box;width:100%;overflow:hidden">' +
          '<span style="font-size:15px;flex-shrink:0;margin-top:1px">' + icon + '</span>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:12.5px;font-weight:700;color:#0d1b2e;word-break:break-word;overflow-wrap:break-word">' + c.label + '</div>' +
            '<div style="font-size:11.5px;color:' + col + ';margin-top:2px;word-break:break-word;overflow-wrap:break-word;line-height:1.5">' + c.detail + '</div>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
    });
    resultsEl.innerHTML = html;
    tsEl.textContent = 'Last run: ' + new Date().toLocaleString('en-GB');
    btn.innerHTML = '▶ Run Diagnostics';
    btn.disabled  = false;
    // Hide progress bar after completion
    setTimeout(function() {
      var pw = document.getElementById('diag-progress-wrap');
      if (pw) pw.style.display = 'none';
    }, 1200); // leave visible briefly so user sees 100%
    // Refresh the error log section below results
    if (typeof renderDiagErrorLog === 'function') renderDiagErrorLog();
  }

  // ── GROUP 1: Connectivity ──────────────────────────────────────
  updateProgress(1, 'Checking Firebase connection...');
  if (window._fbDB) {
    addCheck('Firebase Connection', 'ok', 'Connected to pearl-management-system database', 'Connectivity');
  } else {
    addCheck('Firebase Connection', 'fail', 'Firebase is not connected — cloud sync and backup will not work. Check your internet connection.', 'Connectivity');
  }

  if (window._fbLoadKey && window._fbSaveKey) {
    addCheck('Firebase Read/Write API', 'ok', 'Read and write helpers are available', 'Connectivity');
  } else {
    addCheck('Firebase Read/Write API', 'fail', 'Firebase helpers missing — data cannot be saved to or loaded from cloud', 'Connectivity');
  }

  // ── GROUP 2: Local Storage ─────────────────────────────────────
  updateProgress(3, 'Checking local storage...');
  var storeOk = true;
  try {
    _STORE.setItem('__diag_test__', '1');
    var v = _STORE.getItem('__diag_test__');
    _STORE.removeItem('__diag_test__');
    if (v !== '1') storeOk = false;
  } catch(e) { storeOk = false; }
  addCheck('Local Storage', storeOk ? 'ok' : 'fail',
    storeOk ? 'Read/write working correctly' : 'Local storage is blocked or broken — data will not persist between sessions',
    'Local Storage');

  // Check each year's data
  var yearsFound = [];
  var totalEntries = 0;
  for (var y = 2024; y <= 2028; y++) {
    try {
      var d = JSON.parse(_STORE.getItem('pearl_laundry_' + y) || 'null');
      if (d && typeof d === 'object') {
        var cnt = Object.keys(d).length;
        yearsFound.push(y + ' (' + cnt + ' entries)');
        totalEntries += cnt;
      }
    } catch(e) {}
  }
  if (yearsFound.length > 0) {
    addCheck('Laundry Data', 'ok', 'Found data for: ' + yearsFound.join(', ') + ' · Total: ' + totalEntries + ' entries', 'Local Storage');
  } else {
    addCheck('Laundry Data', 'warn', 'No laundry data found in local storage — data may not have loaded yet or this is a new device', 'Local Storage');
  }

  // Credentials stored
  var credsOk = false;
  try {
    var creds = JSON.parse(_STORE.getItem('pearl_credentials') || 'null');
    credsOk = !!(creds && creds.user && creds.pass);
  } catch(e) {}
  addCheck('Credentials Stored', credsOk ? 'ok' : 'warn',
    credsOk ? 'Admin credentials found in local storage' : 'No credentials cached locally — login requires internet on first use',
    'Local Storage');

  // ── GROUP 3: Backup ────────────────────────────────────────────
  updateProgress(6, 'Checking backup status...');
  var backupIndex = null;
  try { backupIndex = JSON.parse(_STORE.getItem('pearl_backup_index') || 'null'); } catch(e) {}
  if (backupIndex && Array.isArray(backupIndex) && backupIndex.length > 0) {
    var latest = backupIndex[0];
    var latestDate = latest.savedAt ? new Date(latest.savedAt).toLocaleDateString('en-GB') : 'unknown date';
    var daysSince = latest.savedAt ? Math.floor((Date.now() - new Date(latest.savedAt)) / 86400000) : 999;
    var backupStatus = daysSince <= 7 ? 'ok' : daysSince <= 14 ? 'warn' : 'fail';
    addCheck('Cloud Backup', backupStatus,
      backupIndex.length + ' version(s) stored · Latest: ' + latestDate + ' (' + daysSince + ' days ago)' +
      (daysSince > 7 ? ' — consider saving a backup soon' : ''),
      'Backup');
  } else {
    addCheck('Cloud Backup', 'warn', 'No backup index found locally — run a cloud backup from the Backup tab', 'Backup');
  }

  var lastAuto = _STORE.getItem('pearl_last_auto_backup') || '';
  var today = new Date().toISOString().slice(0,10);
  addCheck('Auto-Backup Today', lastAuto === today ? 'ok' : 'warn',
    lastAuto === today ? 'Daily auto-backup already ran today (' + lastAuto + ')' : 'Daily auto-backup has not run yet today (last: ' + (lastAuto || 'never') + ')',
    'Backup');

  // ── GROUP 4: Occupancy ─────────────────────────────────────────
  updateProgress(9, 'Counting occupancy data...');
  var occCount = 0;
  var curM = new Date().getMonth() + 1;
  for (var dd = 1; dd <= 31; dd++) {
    try {
      var occKey = 'occ_' + CY + '_' + curM + '_' + dd;
      if (_STORE.getItem(occKey)) occCount++;
    } catch(e) {}
  }
  addCheck('Occupancy Data (' + CY + '/' + curM + ')',
    occCount > 0 ? 'ok' : 'warn',
    occCount > 0 ? occCount + ' day(s) of occupancy saved for this month' : 'No occupancy data for current month — enter it from the Dashboard',
    'Occupancy');

  // ── GROUP 5: Settings ──────────────────────────────────────────
  updateProgress(11, 'Verifying system settings...');
  try {
    var curr = JSON.parse(_STORE.getItem('pearl_currency') || 'null');
    addCheck('Currency Settings', curr ? 'ok' : 'warn',
      curr ? 'Currency: ' + curr.symbol + ' · Decimals: ' + curr.decimals : 'No currency settings found — defaults will be used',
      'Settings');
  } catch(e) {
    addCheck('Currency Settings', 'warn', 'Could not read currency settings', 'Settings');
  }

  var totalRoomsOk = typeof _TOTAL_ROOMS !== 'undefined' && _TOTAL_ROOMS > 0;
  addCheck('Hotel Rooms', totalRoomsOk ? 'ok' : 'warn',
    totalRoomsOk ? 'Total rooms set to ' + _TOTAL_ROOMS : 'Total rooms not configured — occupancy % calculations may be wrong',
    'Settings');

  var hotelName = _STORE.getItem('pearl_hotel_name') || '';
  addCheck('Hotel Name', hotelName ? 'ok' : 'warn',
    hotelName ? 'Hotel name: ' + hotelName : 'Hotel name not set — configure in Settings → Hotel',
    'Settings');

  // ── GROUP 6: System Functions ──────────────────────────────────
  updateProgress(13, 'Validating 18 critical functions...');
  var criticalFns = [
    ['doLogin',        'Login'],
    ['saveDB',         'Save Data'],
    ['renderDash',     'Dashboard'],
    ['renderEntry',    'Entry'],
    ['toast',          'Notifications'],
    ['showToast',      'Notifications (alias)'],
    ['switchStab',     'Settings'],
    ['runDiagnostics', 'Diagnostics'],
    ['restoreFromVersion', 'Backup Restore'],
    ['deleteBackupVersion','Backup Delete'],
    ['autoSyncOccupancyFromFB', 'Occupancy Sync'],
    ['loadDayOcc',     'Occupancy Load'],
    ['saveDayOcc',     'Occupancy Save'],
    ['fmtMoney',       'Currency Format'],
    ['exportMonthlyExcel', 'Excel Export'],
    ['renderForecast', 'Forecast'],
    ['renderWhatIf',   'What-If'],
    ['renderRiskIndicators', 'Risk Indicators']
  ];
  var missingFns = [];
  criticalFns.forEach(function(pair) {
    if (typeof window[pair[0]] !== 'function') missingFns.push(pair[1] + ' (' + pair[0] + ')');
  });
  if (missingFns.length === 0) {
    addCheck('Critical Functions (' + criticalFns.length + ' checked)', 'ok', 'All critical functions are defined and available', 'System Functions');
  } else {
    addCheck('Critical Functions', 'fail', 'Missing: ' + missingFns.join(', '), 'System Functions');
  }

  // ── GROUP 7: Firebase live check (async) ───────────────────────
  updateProgress(15, 'Running live Firebase read test...');
  if (window._fbLoadKey) {
    pending++;
    var fbCheckTimeout = setTimeout(function() {
      addCheck('Firebase Read Test', 'fail', 'Firebase read timed out after 5 seconds — database may be unreachable', 'Connectivity');
      pending--;
      if (pending === 0) finalise();
    }, 5000);

    window._fbLoadKey('pearl/settings/currency').then(function(val) {
      clearTimeout(fbCheckTimeout);
      addCheck('Firebase Read Test', 'ok', 'Successfully read from Firebase in real-time · Currency setting: ' + (val ? JSON.stringify(val).slice(0,60) : 'not set'), 'Connectivity');
      pending--;
      if (pending === 0) finalise();
    }).catch(function(e) {
      clearTimeout(fbCheckTimeout);
      addCheck('Firebase Read Test', 'fail', 'Firebase read failed: ' + (e.message || e), 'Connectivity');
      pending--;
      if (pending === 0) finalise();
    });

    // Check backup index integrity vs Firebase
    updateProgress(16, 'Comparing backup indexes...');
    pending++;
    window._fbLoadKey('pearl/backup/index').then(function(fbIdx) {
      var localIdx = null;
      try { localIdx = JSON.parse(_STORE.getItem('pearl_backup_index') || 'null'); } catch(e) {}
      var fbCount    = fbIdx ? (Array.isArray(fbIdx) ? fbIdx.length : Object.keys(fbIdx).length) : 0;
      var localCount = localIdx ? localIdx.length : 0;
      if (fbCount === localCount) {
        addCheck('Backup Index Sync', 'ok', 'Local and Firebase backup index match (' + fbCount + ' versions)', 'Backup');
      } else {
        addCheck('Backup Index Sync', 'warn', 'Mismatch: Firebase has ' + fbCount + ' versions, local cache has ' + localCount + ' — click Refresh in Backup History to sync', 'Backup');
      }
      pending--;
      if (pending === 0) finalise();
    }).catch(function() {
      addCheck('Backup Index Sync', 'warn', 'Could not compare backup indexes — Firebase unreachable', 'Backup');
      pending--;
      if (pending === 0) finalise();
    });

  } else {
    addCheck('Firebase Read Test', 'fail', 'Firebase not available — cannot perform live read test', 'Connectivity');
  }

  // Finalise sync checks — only if no async tasks are pending
  // (If Firebase is available, finalise() is called inside the .then() handlers)
  if (pending === 0) {
    // No async tasks — finalise immediately
    finalise();
  }
  // else: finalise() will be triggered when last pending-- reaches 0
}


// ════════════════════════════════════════════════════════════════
//  GLOBAL ERROR CAPTURE — catches silent JS failures
// ════════════════════════════════════════════════════════════════
var _errorLog = [];          // in-memory ring buffer — max 50
var _MAX_ERRORS = 50;

function _logError(type, msg, source, line, col, err) {
  // Skip noise: Firebase internal errors, browser extension errors, cancelled fetches
  var skip = ['extension', 'chrome-extension', 'moz-extension', 'ResizeObserver',
               'Non-Error promise', 'Load failed', 'Script error'];
  for (var i = 0; i < skip.length; i++) {
    if (msg && msg.indexOf(skip[i]) !== -1) return;
    if (source && source.indexOf(skip[i]) !== -1) return;
  }

  var entry = {
    type    : type,
    msg     : msg || 'Unknown error',
    source  : source || '',
    line    : line || 0,
    col     : col  || 0,
    stack   : err && err.stack ? err.stack.split('\n').slice(0,4).join(' | ') : '',
    ts      : new Date().toLocaleTimeString('en-GB')
  };
  _errorLog.unshift(entry);
  if (_errorLog.length > _MAX_ERRORS) _errorLog.pop();
  _updateErrBadge();
}


function clearDiagErrorLog() {
  _errorLog = [];
  _updateErrBadge();
  // Render in whichever container exists
  var el = document.getElementById('diag-errlog');
  if (el) {
    el.innerHTML = '<div style="padding:12px 14px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;font-size:12px;color:#15803d;font-weight:600">✅ Log cleared — no errors recorded</div>';
  }
  toast('🗑 Error log cleared', 'ok');
}
function _updateErrBadge() {
  var badge = document.getElementById('err-badge');
  var text  = document.getElementById('err-badge-text');
  if (!badge || !text) return;
  if (_errorLog.length === 0) { badge.style.display = 'none'; return; }
  // Only show badge when user is logged into the app
  var appEl = document.getElementById('pg-app');
  var isLoggedIn = appEl && appEl.style.display !== 'none';
  if (!isLoggedIn) { badge.style.display = 'none'; return; }
  var cnt = _errorLog.length;
  text.textContent = cnt + ' error' + (cnt > 1 ? 's' : '') + ' caught';
  badge.style.display = 'flex';
}

function showErrorLog() {
  // SECURITY: only open settings if user is logged in
  var appEl = document.getElementById('pg-app');
  var isLoggedIn = appEl && appEl.style.display !== 'none';
  if (!isLoggedIn) { console.warn('[Security] showErrorLog blocked — not logged in'); return; }
  openSettings();
  switchStab('diag');
  // Render error log at bottom of diag panel
  var res = document.getElementById('diag-results');
  if (!res) return;
  var html = '<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;padding:8px 2px 6px">Runtime Error Log (' + _errorLog.length + ')</div>';
  html += '<div style="display:flex;flex-direction:column;gap:6px">';
  _errorLog.forEach(function(e) {
    html += '<div style="padding:10px 14px;background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;font-size:12px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">' +
        '<span style="font-weight:700;color:#dc2626">❌ ' + e.type + '</span>' +
        '<span style="color:#94a3b8;font-size:11px">' + e.ts + '</span>' +
      '</div>' +
      '<div style="color:#1e293b;font-weight:600;margin-bottom:3px">' + (e.msg||'').slice(0,120) + '</div>' +
      (e.source ? '<div style="color:#64748b;font-size:11px">' + e.source.split('/').pop() + (e.line ? ':' + e.line : '') + '</div>' : '') +
      (e.stack  ? '<div style="color:#94a3b8;font-size:10px;margin-top:4px;font-family:monospace;word-break:break-all">' + e.stack.slice(0,200) + '</div>' : '') +
    '</div>';
  });
  html += '</div>';
  html += '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
    '<button onclick="clearDiagErrorLog()" style="padding:8px 14px;background:#fff5f5;border:1.5px solid #fca5a5;color:#dc2626;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">🗑 Clear Log</button>' +
    '<button onclick="runDiagnostics()" style="padding:8px 14px;background:#0d1b2e;color:#c9a84c;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">🩺 Run Full Diagnostics</button>' +
    '<button onclick="reportIssue()" style="padding:8px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#64748b;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">📋 Copy Issue Report</button>' +
  '</div>';
  res.innerHTML = html;
}

// ── Wire up global handlers ──
window.onerror = function(msg, src, line, col, err) {
  _logError('JS Error', msg, src, line, col, err);
  return false; // don't suppress default console output
};
window.addEventListener('unhandledrejection', function(e) {
  var msg = e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled promise rejection';
  _logError('Promise Rejection', msg, '', 0, 0, e.reason);
});


// ════════════════════════════════════════════════════════════════
//  STARTUP VALIDATION — silent mini-check on every login
//  Runs 3 seconds after bootApp() — never blocks the UI
// ════════════════════════════════════════════════════════════════
function runStartupValidation() {
  var issues = [];

  // 1. Critical functions present?
  var critFns = ['saveDB','renderDash','renderEntry','toast','doLogin',
                 'restoreFromVersion','deleteBackupVersion','autoSyncOccupancyFromFB'];
  critFns.forEach(function(fn) {
    if (typeof window[fn] !== 'function') issues.push('Missing function: ' + fn + '()');
  });

  // 2. Local storage writable?
  try {
    _STORE.setItem('__sv__','1'); _STORE.removeItem('__sv__');
  } catch(e) {
    issues.push('Local storage not writable — data will not persist');
  }

  // 3. Current year data present? If not, auto-trigger sync
  var localDataMissing = false;
  try {
    var d = JSON.parse(_STORE.getItem('pearl_laundry_' + CY) || 'null');
    if (!d || Object.keys(d).length === 0) {
      localDataMissing = true;
      issues.push('No ' + CY + ' data in local storage — triggering auto-sync from Firebase...');
    }
  } catch(e) {
    localDataMissing = true;
    issues.push('Could not read ' + CY + ' data from storage');
  }

  // Auto-sync if data missing and Firebase available
  if (localDataMissing && window._fbLoadKey) {
    setTimeout(function() {
      _autoRecoverData();
    }, 500);
  }

  // 4. Firebase connected?
  if (!window._fbDB) {
    issues.push('Firebase not connected — cloud features unavailable');
  }

  // 5. Last backup age warning — check local index, then Firebase
  try {
    var idx = null;
    try { idx = JSON.parse(_STORE.getItem('pearl_backup_index') || 'null'); } catch(e) {}
    if (!idx || idx.length === 0) {
      // Local index missing — check Firebase before warning
      if (window._fbLoadKey) {
        window._fbLoadKey('pearl/backup/index').then(function(fbIdx) {
          if (fbIdx && Array.isArray(fbIdx) && fbIdx.length > 0) {
            // Firebase has backups — restore local index silently, no warning
            try { _STORE.setItem('pearl_backup_index', JSON.stringify(fbIdx)); } catch(e) {}
          } else {
            // Genuinely no backups anywhere
            _logError('Startup Warning', 'No cloud backup found — save a backup from the Backup tab', 'startup-validation', 0, 0, null);
          }
        }).catch(function() {
          _logError('Startup Warning', 'No cloud backup found — save a backup from the Backup tab', 'startup-validation', 0, 0, null);
        });
        // Don't add to issues[] since we're checking async
      } else {
        issues.push('No cloud backup found — save a backup from the Backup tab');
      }
    } else {
      var daysSince = Math.floor((Date.now() - new Date(idx[0].savedAt)) / 86400000);
      if (daysSince > 14) issues.push('Last backup was ' + daysSince + ' days ago — consider saving a new one');
    }
  } catch(e) {}

  // Log any issues to the error log for visibility — deduplicate
  issues.forEach(function(msg) {
    // Don't add duplicate startup warnings
    var alreadyLogged = _errorLog.some(function(e) {
      return e.msg === msg && e.source === 'startup-validation';
    });
    if (!alreadyLogged) {
      _logError('Startup Warning', msg, 'startup-validation', 0, 0, null);
    }
  });

  // Only notify user if there are serious issues (not just warnings)
  var serious = issues.filter(function(m) {
    return m.indexOf('Missing function') !== -1 || m.indexOf('not writable') !== -1;
  });
  if (serious.length > 0) {
    toast('⚠️ ' + serious.length + ' startup issue(s) detected — check Diagnostics', 'warn');
  }

  console.log('[Startup Validation] ' + (issues.length === 0 ? 'All clear ✅' : issues.length + ' issue(s): ' + issues.join(' | ')));
}


function renderDiagErrorLog() {
  var el = document.getElementById('diag-errlog');
  if (!el) return;
  if (!_errorLog || _errorLog.length === 0) {
    el.innerHTML = '<div style="padding:12px 14px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;font-size:12px;color:#15803d;font-weight:600">✅ No runtime errors recorded in this session</div>';
    return;
  }
  var html = '<div style="display:flex;flex-direction:column;gap:6px">';
  _errorLog.forEach(function(e) {
    html += '<div style="padding:10px 14px;background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">' +
        '<span style="font-size:12px;font-weight:700;color:#dc2626">❌ ' + e.type + '</span>' +
        '<span style="font-size:10px;color:#94a3b8">' + e.ts + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:#1e293b;font-weight:600;margin-bottom:2px">' + (e.msg||'').slice(0,140) + '</div>' +
      (e.source ? '<div style="font-size:11px;color:#64748b">' + e.source.split('/').pop() + (e.line ? ' · line ' + e.line : '') + '</div>' : '') +
      (e.stack  ? '<div style="font-size:10px;color:#94a3b8;margin-top:4px;font-family:monospace;word-break:break-all;line-height:1.5">' + e.stack.slice(0,180) + '</div>' : '') +
    '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}


// ════════════════════════════════════════════════════════════════
//  SELF-HEALING — auto-recover + force re-sync + report issue
// ════════════════════════════════════════════════════════════════

// ── Auto-recover: called when local data is found empty at startup ──
function _autoRecoverData() {
  if (!window._fbLoadKey) return;
  console.log('[AutoRecover] Local data missing — attempting Firebase sync...');

  window._fbLoadKey('pearl/data').then(function(fbData) {
    if (!fbData || Object.keys(fbData).length === 0) {
      // No data in firebase/data — try latest backup
      window._fbLoadKey('pearl/backup/latest').then(function(bk) {
        if (bk && bk.data && Object.keys(bk.data).length > 0) {
          _applyRestoredData(bk.data, 'latest cloud backup');
        } else {
          // Show self-healing restore prompt — last resort
          _showRestorePrompt();
        }
      }).catch(function() { _showRestorePrompt(); });
      return;
    }
    _applyRestoredData(fbData, 'Firebase database');
  }).catch(function(e) {
    console.warn('[AutoRecover] Firebase sync failed:', e.message);
    _logError('AutoRecover', 'Could not auto-recover data: ' + e.message, 'autoRecover', 0, 0, e);
  });
}

// ── Apply recovered data to localStorage + memory ──
function _applyRestoredData(dataObj, source) {
  var years = 0, entries = 0;
  Object.keys(dataObj).forEach(function(y) {
    var yearData = dataObj[y];
    if (!yearData || typeof yearData !== 'object') return;
    _STORE.setItem('pearl_laundry_' + y, JSON.stringify(yearData));
    _DB[y] = yearData;
    entries += Object.keys(yearData).length;
    years++;
  });
  if (years > 0) {
    toast('✅ Auto-recovered ' + years + ' year(s) · ' + entries + ' entries from ' + source, 'ok');
    console.log('[AutoRecover] Restored ' + years + ' year(s) from ' + source);
    setTimeout(function() {
      try { PRICES = loadPR(CY); } catch(e) {}
      try { renderDash(); } catch(e) {}
      try { renderEntry(); } catch(e) {}
    }, 600);
  }
}

// ── Self-healing restore prompt — shown when all auto-attempts fail ──
function _showRestorePrompt() {
  // Don't show if user already has data (race condition guard)
  try {
    var d = JSON.parse(_STORE.getItem('pearl_laundry_' + CY) || 'null');
    if (d && Object.keys(d).length > 0) return;
  } catch(e) {}

  var prompt = document.createElement('div');
  prompt.id = 'restore-prompt';
  prompt.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;' +
    'background:#0d1b2e;border:2px solid #c9a84c;border-radius:16px;padding:20px 24px;' +
    'box-shadow:0 16px 60px rgba(0,0,0,.6);max-width:420px;width:90vw;text-align:center;' +
    'animation:rise .4s cubic-bezier(.22,1,.36,1)';
  prompt.innerHTML =
    '<div style="font-size:28px;margin-bottom:8px">⚠️</div>' +
    '<div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:6px">Data Not Found Locally</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,.55);margin-bottom:18px;line-height:1.6">' +
      'Your ' + CY + ' data was not found in this browser.<br>This usually means a new device or cleared storage.' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<button onclick="restoreCloudBackup();document.getElementById(\'restore-prompt\').remove()" ' +
        'style="padding:12px;background:#c9a84c;color:#0d1b2e;border:none;border-radius:10px;' +
        'font-size:13px;font-weight:800;cursor:pointer">☁️ Restore from Cloud Backup</button>' +
      '<button onclick="showTab(\'backup\');document.getElementById(\'restore-prompt\').remove()" ' +
        'style="padding:10px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);' +
        'border:1px solid rgba(255,255,255,.15);border-radius:10px;font-size:12px;font-weight:600;cursor:pointer">' +
        '📁 Open Backup Tab to Restore Manually</button>' +
      '<button onclick="document.getElementById(\'restore-prompt\').remove()" ' +
        'style="padding:8px;background:none;color:rgba(255,255,255,.3);border:none;' +
        'font-size:11px;cursor:pointer">Dismiss &#8212; I\'ll handle it later</button>' +
    '</div>';
  document.body.appendChild(prompt);
}

// ── Force Re-Sync: pull everything fresh from Firebase into localStorage ──
function forceReSyncFromFirebase() {
  if (!window._fbLoadKey) {
    toast('❌ Firebase not connected', 'err'); return;
  }
  var btn = document.getElementById('diag-resync-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Syncing...'; }
  toast('⏳ Syncing all data from Firebase...', 'info');

  var tasks = [
    // Entry data
    window._fbLoadKey('pearl/data').then(function(d) {
      if (!d) return '⚠️ No entry data in Firebase';
      var y = 0, e = 0;
      Object.keys(d).forEach(function(yr) {
        if (!d[yr] || typeof d[yr] !== 'object') return;
        _STORE.setItem('pearl_laundry_' + yr, JSON.stringify(d[yr]));
        _DB[yr] = d[yr];
        e += Object.keys(d[yr]).length;
        y++;
      });
      return '✅ Entry data: ' + y + ' year(s), ' + e + ' entries';
    }),
    // Prices
    window._fbLoadKey('pearl/prices').then(function(d) {
      if (!d) return '⚠️ No price data in Firebase';
      Object.keys(d).forEach(function(yr) {
        _STORE.setItem('pearl_prices_' + yr, JSON.stringify(d[yr]));
      });
      return '✅ Prices: ' + Object.keys(d).length + ' year(s)';
    }).catch(function() { return '⚠️ Price sync skipped'; }),
    // Settings
    window._fbLoadKey('pearl/settings').then(function(d) {
      if (!d) return '⚠️ No settings in Firebase';
      if (d.credentials) _STORE.setItem('pearl_credentials', JSON.stringify(d.credentials));
      if (d.team_accounts) _STORE.setItem('pearl_team_accounts', JSON.stringify(d.team_accounts));
      if (d.tabaccess) _STORE.setItem('pearl_tab_access', JSON.stringify(d.tabaccess));
      if (d.currency) { _STORE.setItem('pearl_currency', JSON.stringify(d.currency)); _CURRENCY = d.currency; }
      return '✅ Settings synced';
    }).catch(function() { return '⚠️ Settings sync skipped'; }),
    // Occupancy
    autoSyncOccupancyFromFB() || Promise.resolve('✅ Occupancy sync triggered')
  ];

  Promise.all(tasks.map(function(t) {
    return (t && typeof t.then === 'function') ? t.catch(function(e) { return '❌ ' + e.message; }) : Promise.resolve(t);
  })).then(function(results) {
    var summary = results.filter(Boolean).join(' · ');
    toast('✅ Sync complete — refreshing...', 'ok');
    console.log('[ForceReSync]', summary);
    // Re-render everything
    setTimeout(function() {
      try { PRICES = loadPR(CY); } catch(e) {}
      try { renderDash(); } catch(e) {}
      try { renderEntry(); } catch(e) {}
      if (btn) { btn.disabled = false; btn.textContent = '🔃 Force Re-Sync from Firebase'; }
      // Update diag results with sync summary
      var ts = document.getElementById('diag-timestamp');
      if (ts) ts.textContent = 'Last sync: ' + new Date().toLocaleString('en-GB') + ' — ' + summary;
    }, 800);
  });
}

// ── Download Raw Firebase JSON ──
function downloadRawFirebaseJSON() {
  if (!window._fbLoadKey) {
    toast('❌ Firebase not connected', 'err'); return;
  }
  toast('⏳ Fetching all data from Firebase...', 'info');
  window._fbLoadKey('pearl').then(function(d) {
    if (!d) { toast('❌ No data found in Firebase', 'err'); return; }
    var json = JSON.stringify(d, null, 2);
    var blob = new Blob([json], {type: 'application/json;charset=utf-8'});
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url;
    a.download = 'Pearl_Firebase_Raw_' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
    var kb = (json.length / 1024).toFixed(1);
    toast('✅ Downloaded ' + kb + ' KB of raw Firebase data', 'ok');
    showBackupMsg('backup-raw-msg', '✅ Downloaded ' + kb + ' KB — file: ' + a.download, 'ok');
  }).catch(function(e) {
    toast('❌ Download failed: ' + e.message, 'err');
    showBackupMsg('backup-raw-msg', '❌ Failed: ' + e.message + ' — check Firebase rules allow read', 'err');
  });
}

// ── Report Issue: format error details for sharing ──
function reportIssue() {
  var lines = ['RS LaundryPro — Issue Report'];
  lines.push('Generated: ' + new Date().toLocaleString('en-GB'));
  lines.push('URL: ' + window.location.href.split('?')[0]);
  lines.push('Browser: ' + navigator.userAgent.split(') ')[0].split(' (').pop());
  lines.push('Firebase: ' + (window._fbDB ? 'Connected' : 'Not connected'));
  lines.push('');
  lines.push('--- ERRORS (' + (_errorLog ? _errorLog.length : 0) + ') ---');
  if (_errorLog && _errorLog.length > 0) {
    _errorLog.slice(0, 10).forEach(function(e, i) {
      lines.push((i+1) + '. [' + e.ts + '] ' + e.type + ': ' + e.msg);
      if (e.source) lines.push('   at ' + e.source.split('/').pop() + (e.line ? ':' + e.line : ''));
      if (e.stack) lines.push('   ' + e.stack.slice(0, 120));
    });
  } else {
    lines.push('No errors recorded in this session.');
  }
  lines.push('');
  lines.push('--- LOCAL DATA ---');
  for (var y = 2024; y <= 2028; y++) {
    try {
      var d = JSON.parse(_STORE.getItem('pearl_laundry_' + y) || 'null');
      if (d) lines.push('Year ' + y + ': ' + Object.keys(d).length + ' entries');
    } catch(e) {}
  }

  var text = lines.join('\n');
  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      toast('📋 Issue report copied to clipboard — paste it to share', 'ok');
    }).catch(function() { _fallbackCopyReport(text); });
  } else {
    _fallbackCopyReport(text);
  }
}

function _fallbackCopyReport(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-999px;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast('📋 Report copied to clipboard', 'ok'); } catch(e) { toast('⚠️ Could not copy — see console', 'warn'); console.log(text); }
  document.body.removeChild(ta);
}


// ════════════════════════════════════════════════════════════════
//  GENERAL CALCULATOR ENGINE
// ════════════════════════════════════════════════════════════════
var _calcExpr  = '';   // full expression string e.g. "123 + 45 ×"
var _calcVal   = '0';  // current display value
var _calcOp    = '';   // pending operator
var _calcPrev  = null; // previous operand
var _calcFresh = true; // next digit starts fresh

function _calcRound(n) {
  // Round to max 10 significant digits to avoid floating point display noise
  return parseFloat(n.toPrecision(10));
}

function calcBtn(key) {
  var disp    = document.getElementById('calc-disp');
  var exprEl  = document.getElementById('calc-expr');
  var histEl  = document.getElementById('calc-history');
  if (!disp) return;

  if (key === 'C') {
    _calcExpr = ''; _calcVal = '0'; _calcOp = ''; _calcPrev = null; _calcFresh = true;
    if (histEl) histEl.textContent = '';

  } else if (key === '⌫') {
    if (_calcFresh) return;
    _calcVal = _calcVal.length > 1 ? _calcVal.slice(0, -1) : '0';
    if (_calcVal === '-') _calcVal = '0';

  } else if (key === '%') {
    var n = parseFloat(_calcVal);
    if (!isNaN(n)) {
      // If there's a pending operation, % means percent of previous operand
      if (_calcPrev !== null && _calcOp) {
        _calcVal = String(_calcRound((_calcPrev * n) / 100));
      } else {
        _calcVal = String(_calcRound(n / 100));
      }
      _calcFresh = true;
    }

  } else if (['+','−','×','÷'].indexOf(key) !== -1) {
    var cur = parseFloat(_calcVal);
    if (_calcPrev !== null && !_calcFresh && _calcOp) {
      cur = _calcApplyOp(_calcPrev, parseFloat(_calcVal), _calcOp);
      _calcVal = String(_calcRound(cur));
    }
    _calcPrev  = parseFloat(_calcVal);
    _calcOp    = key;
    _calcExpr  = _calcVal + ' ' + key;
    _calcFresh = true;

  } else if (key === '=') {
    if (_calcPrev === null || !_calcOp) return;
    var result = _calcApplyOp(_calcPrev, parseFloat(_calcVal), _calcOp);
    if (result === null) {
      disp.textContent = 'Error';
      if (histEl) histEl.textContent = 'Cannot divide by zero';
      _calcExpr = ''; _calcPrev = null; _calcOp = ''; _calcFresh = true;
      if (exprEl) exprEl.textContent = '';
      return;
    }
    var rounded = _calcRound(result);
    if (histEl) histEl.textContent = (_calcExpr + ' ' + _calcVal + ' = ' + rounded).slice(-60);
    _calcExpr  = '';
    _calcVal   = String(rounded);
    _calcPrev  = null;
    _calcOp    = '';
    _calcFresh = true;

  } else if (key === '.') {
    if (_calcFresh) { _calcVal = '0.'; _calcFresh = false; return; }
    if (_calcVal.indexOf('.') === -1) _calcVal += '.';

  } else {
    // Digit 0-9
    if (_calcFresh) { _calcVal = key; _calcFresh = false; }
    else { _calcVal = _calcVal === '0' ? key : _calcVal + key; }
    if (_calcExpr && _calcOp) _calcExpr = _calcExpr; // keep expr
  }

  // Update display
  disp.textContent = _calcVal;
  if (exprEl) exprEl.textContent = _calcExpr;
}

function _calcApplyOp(a, b, op) {
  if (isNaN(a) || isNaN(b)) return null;
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') { if (b === 0) return null; return a / b; }
  return null;
}

// Keyboard support for the calculator
var _calcKbdBound = false;
function calcKeyboardInit() {
  if (_calcKbdBound) return;
  _calcKbdBound = true;
  document.addEventListener('keydown', function(e) {
    // Only active when calc modal is open and on calc tab
    var modal = document.getElementById('calc-modal');
    var panel = document.getElementById('ctab-calc-panel');
    if (!modal || modal.style.display !== 'flex') return;
    if (!panel || panel.style.display === 'none') return;

    var key = e.key;
    if (key >= '0' && key <= '9') { calcBtn(key); e.preventDefault(); }
    else if (key === '+') { calcBtn('+'); e.preventDefault(); }
    else if (key === '-') { calcBtn('−'); e.preventDefault(); }
    else if (key === '*') { calcBtn('×'); e.preventDefault(); }
    else if (key === '/') { calcBtn('÷'); e.preventDefault(); }
    else if (key === '%') { calcBtn('%'); e.preventDefault(); }
    else if (key === '.') { calcBtn('.'); e.preventDefault(); }
    else if (key === 'Enter' || key === '=') { calcBtn('='); e.preventDefault(); }
    else if (key === 'Backspace') { calcBtn('⌫'); e.preventDefault(); }
    else if (key === 'Escape') { calcBtn('C'); e.preventDefault(); }
  });
}


// ════════════════════════════════════════════════════════════════
//  MISSING DEPARTMENT ALERT SYSTEM
//  Checks yesterday (morning) + today at 8pm
//  Only alerts on "required" departments — not Others/Dry Cleaning
// ════════════════════════════════════════════════════════════════

var _REQUIRED_DEPTS_KEY = 'pearl_required_depts';
var _REQUIRED_DEPTS_DEFAULT = ['Rooms Linen', 'F & B', 'Spa & Pool', 'Uniform'];

function getRequiredDepts() {
  try {
    var stored = JSON.parse(_STORE.getItem(_REQUIRED_DEPTS_KEY) || 'null');
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch(e) {}
  return _REQUIRED_DEPTS_DEFAULT.slice();
}

function saveRequiredDepts(arr) {
  try { _STORE.setItem(_REQUIRED_DEPTS_KEY, JSON.stringify(arr)); } catch(e) {}
}

// Check if a specific dept has ANY data for a given day
function deptHasData(y, m, dept, day) {
  var items = MASTER[dept];
  if (!items) return false;
  for (var i = 0; i < items.length; i++) {
    if (getVal(y, m, dept, i, day - 1) > 0) return true;
  }
  return false;
}

// Returns array of {dept, day, label} for missing required dept/day combos

// ── Service Worker for offline support ──
if ('serviceWorker' in navigator) {
  var swCode = `
    const CACHE = 'rs-laundrypro-v1';
    const URLS = ['./', './index.html'];
    self.addEventListener('install', function(e) {
      e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(URLS); }));
      self.skipWaiting();
    });
    self.addEventListener('activate', function(e) {
      e.waitUntil(caches.keys().then(function(keys){
        return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
      }));
      self.clients.claim();
    });
    self.addEventListener('fetch', function(e) {
      if (e.request.method !== 'GET') return;
      e.respondWith(
        fetch(e.request).then(function(r){
          var clone = r.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          return r;
        }).catch(function(){
          return caches.match(e.request);
        })
      );
    });
  `;
  var blob = new Blob([swCode], {type:'application/javascript'});
  var swUrl = URL.createObjectURL(blob);
  navigator.serviceWorker.register(swUrl).catch(function(e){ console.log('SW reg failed:', e); });
}
