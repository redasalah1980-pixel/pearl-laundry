// ── Safe storage wrappers ──────────────────────────────────────────
// Falls back to in-memory when browser blocks file:// storage (Edge/Chrome local files)
(function() {
  // SESSION storage
  var _smem = {};
  var _ss;
  try { sessionStorage.setItem('__t__','1'); sessionStorage.removeItem('__t__'); _ss = sessionStorage; }
  catch(e) { _ss = { getItem:function(k){return _smem[k]!==undefined?_smem[k]:null;}, setItem:function(k,v){_smem[k]=String(v);}, removeItem:function(k){delete _smem[k];} }; }
  window._SESSION = _ss;

  // LOCAL storage
  var _lmem = {};
  var _ls;
  try { localStorage.setItem('__t__','1'); localStorage.removeItem('__t__'); _ls = localStorage; }
  catch(e) {
    _ls = {
      _blocked: true,
      getItem:function(k){return _lmem[k]!==undefined?_lmem[k]:null;},
      setItem:function(k,v){_lmem[k]=String(v);},
      removeItem:function(k){delete _lmem[k];}
    };
    console.warn('localStorage blocked — using in-memory store (Edge local file mode).');
  }
  window._STORE = _ls;
})();

// ════════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════════
const MONTH_NAMES=['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT=['SUN','MON','TUE','WED','THU','FRI','SAT'];
const DEPT_ICONS={'Rooms Linen':'🛏️','F & B':'🍽️','Spa & Pool':'🏊','Uniform':'👔','Others':'📦','Dry Cleaning':'🧺'};
const DEPT_COLORS={'Rooms Linen':'#1B4F72','F & B':'#145A32','Spa & Pool':'#4A235A','Uniform':'#784212','Others':'#1A5276','Dry Cleaning':'#6E2F1A'};

const MASTER={
  'Rooms Linen':[
    ['King Bottom Sheet',1.575,1.151],['King Top Sheet XL',1.575,0.961],['King Duvet Cover',1.8375,1.471],
    ['Queen Bottom Sheet',1.4175,1.151],['Queen Top Sheet XL',1.4175,0.961],['Queen Duvet Cover',1.68,1.471],
    ['Full Bottom Sheet',1.575,0.955],['Full Top Sheet XL',1.575,0.865],['Full Duvet Cover',1.8375,1.238],
    ['Twin Bottom Sheet',1.4175,0.814],['Twin Top Sheet XL',1.4175,0.700],['Twin Duvet Cover',1.68,1.037],
    ['Pillow Case Plain',0.63,0.175],['Euro-Sham',0.63,0.170],['King Pillow Case',0.63,0.175],
    ['King Pillow Sham',0.63,0.175],['Standard Pillow Sham',0.63,0.133],['Standard Pillow Case',0.63,0.140],
    ['Standard Pillow Protector',0.63,0.140],['Euro Protector',0.63,0.175],['King Pillow Protector',0.63,0.127],
    ['Standard Bathrobe',1.8375,1.268],['Bath Towel',1.05,0.756],['Face Towels',0.315,0.060],
    ['Hand Towel',0.6825,0.229],['Bath Mat',0.63,0.416],['Bath Rug Big',1.2075,1.849],
    ['Bath Rug Small',1.2075,1.111],['Pillow',3.675,1.217],['Duvet Insert King',4.725,2.340],
    ['Duvet Insert Queen',4.725,2.140],['Duvet Insert Twin',4.725,2.020],['Duvet Insert Full',4.725,2.120],
    ['Cushion Cover',0.7875,0.695],['Foot Mat/Turndown Mat',0.63,0.105],['Mattress Protector',1.995,2.103],
    ['Blanket',4.725,2.478],['Sheer Curtain',3.15,2.000],['Heavy Curtain',5.25,2.000],['Mattress Topper',31.5,7.000]
  ],
  'F & B':[
    ['White Napkins',0.42,0.070],['Cocktail Napkins',0.42,0.055],['Curtains',3.15,2.000],
    ['White Brown Stripe Napkins',0.42,0.070],['Black Napkins',0.42,0.070],['Table Cloth',2.10,0.650]
  ],
  'Spa & Pool':[
    ['Spa Bath Towels',1.05,0.757],['Spa Hand Towels',0.735,0.217],['Gym Towels',0.525,0.217],
    ['Spa Bath Mats',0.63,0.383],['Spa Bath Rugs',1.05,1.100],['Spa Bathrobes',1.8375,1.057],
    ['Pool Towels',1.365,0.755],['Spa Face Cradel',0.63,0.145],['Spa Client Sheet',0.945,1.280],
    ['Spa Table Bed Sheet',1.155,1.187],['Relaxation Plaid',0.84,1.470],['Message Bed Sheet',1.155,1.187],
    ['Sunbed Matress Covers',5.25,2.193],['Sunbed Covers (Terry)',5.25,1.268],
    ['Cabanna Share Curtain',2.10,0.000],['Spa Face Towel',0.2625,0.060]
  ],
  'Uniform':[
    ['Chef Jacket',1.8375,0.760],['Chef Trouser',1.68,0.433],['Coat',2.8875,1.300],
    ['Dress',3.675,0.495],['Jacket',2.8875,1.220],['Scarf',0.84,0.350],['Blouse',1.785,0.350],
    ['Shorts',1.05,0.365],['Skirt',1.7325,0.374],['Shirt',1.575,0.360],['Trouser',1.68,0.450],
    ['T-Shirt/Tunic',1.155,0.365],['Waist Coat',1.8375,1.450],['Tie',0.84,0.060],
    ['Handkerchief',0.63,0.050],['Apron',0.945,0.325],['Chef Hat',0.63,0.050],['Tunic',1.155,0.365]
  ],
  'Others':[
    ['Small Cushion Cover',0.7875,0.695],['Big Cushion Cover',3.675,0.885],['Chair Cover',2.625,0.660],
    ['Banquet Table Cloth',2.10,1.800],['Black Cocktail',0.42,0.085],['Spa Pillow Case',0.63,0.140],
    ['Table Runner',1.3125,1.750],['Head Band',0.63,0.060],['Sofa Big Cover',23.10,2.400],
    ['Sofa Medium Cover',18.90,1.300],['Sofa Small Cover',16.80,0.880],['Sofa Header',21.00,1.200],
    ['Cushion Covers Pillow Size',10.50,0.240],['Cushion Covers Big Size',15.75,0.450],
    ['Single Mattress Cover',29.40,2.240],['Double Mattress Cover (Cabana)',31.50,4.240],
    ['Side Cover',12.60,0.660],['Spa Blanket',4.725,2.478],['Eye Mask Cover',0.60,0.090]
  ],
  'Dry Cleaning':[
    ['Sofa Big Cover (150x150cm)',31.50,2.400],['Sofa Medium Cover (98x75cm)',26.25,1.300],
    ['Sofa Small Cover (72x72cm)',21.00,0.880],['Sofa Header (150x65cm)',26.25,1.200],
    ['Cushion Covers Pillow Size (42x42cm)',15.75,0.240],['Cushion Covers Big Size (55x55cm)',21.00,0.450],
    ['Single Mattress Cover (195x90cm)',34.65,2.240],
    ['Double Mattress Cover Cabana (198x190cm)',39.90,4.240],['Side Cover',15.75,0.660]
  ]
};
var DEPT_KEYS=Object.keys(MASTER); // var so applyCustomData can push new depts
const LOGO_B64='';

// ════════════════════════════════════════════════════════════════
//  STORAGE — In-memory cache + Firebase Realtime Database sync
// ════════════════════════════════════════════════════════════════
let CY = 2026;
let _DB = {};  // In-memory cache keyed by year
let _dirty = false;

function lsKey(y) { return 'pearl_laundry_' + y; }
function prKey(y)    { return 'pearl_prices_' + y; }
function prKeyM(y,m) { return 'pearl_prices_' + y + '_' + String(m).padStart(2,'0'); }
function fbPricePathM(y,m) { return 'pearl/prices/' + y + '_' + String(m).padStart(2,'0'); }

// Load prices for a specific month — falls back to year prices then MASTER
// In-memory price cache — avoids repeated localStorage reads in tight loops
var _prmCache = {}; // { 'YYYY_MM': pricesObj }

function loadPRM(y, m) {
  var cacheKey = y + '_' + m;

  // 1. In-memory cache hit — fastest path (no localStorage read)
  if (_prmCache[cacheKey]) return _prmCache[cacheKey];

  // 2. Read from localStorage
  var localKey = prKeyM(y, m);
  try {
    var s = JSON.parse(_STORE.getItem(localKey) || 'null');
    if (s && typeof s === 'object' && Object.keys(s).length > 0) {
      _prmCache[cacheKey] = s; // cache it
      // Background Firebase sync (non-blocking)
      if (window._fbLoadKey) {
        window._fbLoadKey(fbPricePathM(y, m)).then(function(fbPrices) {
          if (fbPrices && typeof fbPrices === 'object' && Object.keys(fbPrices).length > 0) {
            try { _STORE.setItem(localKey, JSON.stringify(fbPrices)); } catch(e) {}
            _prmCache[cacheKey] = fbPrices; // update cache with Firebase version
          }
        }).catch(function(){});
      }
      return s;
    }
  } catch(e) {}

  // 3. Not in localStorage — fetch from Firebase async, use year prices now
  if (window._fbLoadKey) {
    window._fbLoadKey(fbPricePathM(y, m)).then(function(fbPrices) {
      if (fbPrices && typeof fbPrices === 'object' && Object.keys(fbPrices).length > 0) {
        try { _STORE.setItem(localKey, JSON.stringify(fbPrices)); } catch(e) {}
        _prmCache[cacheKey] = fbPrices;
        // Re-render entry if this is active month
        var today = new Date();
        if (y === today.getFullYear() && m === today.getMonth()+1) {
          if (typeof renderEntryTable === 'function') setTimeout(renderEntryTable, 100);
        }
      }
    }).catch(function(){});
  }

  // 4. Fall back to year prices
  var yr = loadPR(y);
  _prmCache[cacheKey] = yr;
  return yr;
}

// Clear price cache (call after applying new prices)
function clearPRMCache(y, m) {
  if (y && m) { delete _prmCache[y + '_' + m]; }
  else { _prmCache = {}; }
}

// Force-load monthly prices from Firebase for a given month
function syncMonthlyPricesFromFB(y, m) {
  if (!window._fbLoadKey) return;
  var localKey = prKeyM(y, m);
  return window._fbLoadKey(fbPricePathM(y, m)).then(function(fbPrices) {
    if (fbPrices && typeof fbPrices === 'object' && Object.keys(fbPrices).length > 0) {
      try { _STORE.setItem(localKey, JSON.stringify(fbPrices)); } catch(e) {}
      return fbPrices;
    }
    return null;
  }).catch(function(){ return null; });
}

// Save prices for a specific month
function savePRM(y, m, p) {
  try { _STORE.setItem(prKeyM(y,m), JSON.stringify(p)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey(fbPricePathM(y,m), p);
  // Clear caches so new prices take effect immediately
  clearPRMCache(y, m);
  delete _hasMonthlyCache[y + '_' + m];
}

// Check if a month has its own price version
var _hasMonthlyCache = {}; // { 'YYYY_MM': bool }
function hasMonthlyPrices(y, m) {
  var k = y + '_' + m;
  if (_hasMonthlyCache[k] !== undefined) return _hasMonthlyCache[k];
  try {
    var s = JSON.parse(_STORE.getItem(prKeyM(y,m)) || 'null');
    var result = !!(s && typeof s === 'object' && Object.keys(s).length > 0);
    _hasMonthlyCache[k] = result;
    return result;
  } catch(e) { _hasMonthlyCache[k] = false; return false; }
}

// Copy year prices to a month (create monthly version from year base)
function createMonthlyPrices(y, m, sourcePrices) {
  var src = sourcePrices || loadPR(y);
  var copy = {};
  DEPT_KEYS.forEach(function(d) {
    copy[d] = (src[d] || MASTER[d]).map(function(item) { return [...item]; });
  });
  savePRM(y, m, copy);
  return copy;
}
function fbDataPath(y) { return 'pearl/data/' + y; }
function fbPricePath(y) { return 'pearl/prices/' + y; }

function loadDB(y) {
  if (!_DB[y]) {
    // Try localStorage first (fast, offline fallback)
    try { _DB[y] = JSON.parse(_STORE.getItem(lsKey(y)) || '{}'); }
    catch(e) { _DB[y] = {}; }
    // Then sync from Firebase in background using timestamp-safe merge
    if (window._fbLoadKey) {
      window._fbLoadKey(fbDataPath(y)).then(function(fbData) {
        if (fbData && typeof fbData === 'object' && Object.keys(fbData).length > 0) {
          var localNow = _DB[y] || {};
          var merged2 = mergeDataSafe(localNow, fbData);
          _DB[y] = merged2;
          try { _STORE.setItem(lsKey(y), JSON.stringify(merged2)); } catch(e) {}
          // If local had newer data, push merged back to Firebase
          var needsPush = Object.keys(merged2).some(function(k) {
            return !fbData[k] || (localNow[k] !== undefined && localNow['_ts_' + k] > (fbData['_ts_' + k] || 0));
          });
          if (needsPush && window._fbSaveKey) window._fbSaveKey(fbDataPath(y), merged2);
          if (y == CY) { try { renderDash(); } catch(e){} try { renderEntry(); } catch(e){} }
        } else if (!fbData) {
          var localNow2 = _DB[y] || {};
          if (Object.keys(localNow2).length > 0 && window._fbSaveKey) {
            window._fbSaveKey(fbDataPath(y), localNow2);
          }
        }
      });
    }
  }
  return _DB[y];
}

// ── Timestamp-safe merge: for each data key, the version with the newer timestamp wins ──
// ── Monthly Targets ───────────────────────────────────────────
function targetKey(y, m) { return 'pearl_target_' + y + '_' + m; }
var _targetCache = {}; // in-memory cache for targets

function loadTarget(y, m) {
  var ck = y + '_' + m;
  // Return from memory cache first — fastest
  if (_targetCache[ck] !== undefined) return _targetCache[ck];

  var key = targetKey(y, m);
  var fbPath = 'pearl/targets/' + y + '/' + m;
  try {
    var local = JSON.parse(_STORE.getItem(key) || 'null');
    _targetCache[ck] = local; // cache it
    // Background sync from Firebase — only once per session
    if (window._fbLoadKey) {
      window._fbLoadKey(fbPath).then(function(fbVal) {
        if (fbVal && fbVal.revenue > 0) {
          try { _STORE.setItem(key, JSON.stringify(fbVal)); } catch(e) {}
          _targetCache[ck] = fbVal; // update cache
          var dashM = parseInt(document.getElementById('dash-month')?.value || 0);
          if (dashM === m) {
            var inp = document.getElementById('dash-target');
            if (inp && (!local || !local.revenue)) {
              inp.value = fbVal.revenue.toLocaleString();
              if (typeof renderTargetBar === 'function') renderTargetBar(window._lastDashQR || 0, m);
            }
          }
        }
      }).catch(function(){});
    }
    return local;
  } catch(e) { _targetCache[ck] = null; return null; }
}

function invalidateTargetCache(y, m) {
  if (y && m) delete _targetCache[y + '_' + m];
  else _targetCache = {};
}

// Force sync all targets for current year from Firebase
function syncTargetsFromFB(y) {
  if (!window._fbLoadKey) return;
  for (var mo = 1; mo <= 12; mo++) {
    (function(m) {
      var key = targetKey(y, m);
      window._fbLoadKey('pearl/targets/' + y + '/' + m).then(function(fbVal) {
        if (fbVal && fbVal.revenue > 0) {
          try { _STORE.setItem(key, JSON.stringify(fbVal)); } catch(e) {}
        }
      }).catch(function(){});
    })(mo);
  }
}
function saveTarget(y, m, data) {
  try { _STORE.setItem(targetKey(y, m), JSON.stringify(data)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/targets/' + y + '/' + m, data);
  invalidateTargetCache(y, m); // clear cache so next read gets fresh value
}
function loadTargetFB(y, m) {
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/targets/' + y + '/' + m).then(function(fb) {
      if (fb) { try { _STORE.setItem(targetKey(y, m), JSON.stringify(fb)); } catch(e) {} }
    });
  }
}

// ── Audit Log ─────────────────────────────────────────────────
var _auditLog = [];
function logAudit(action, detail) {
  var user = _SESSION.getItem('ph_user') || 'Unknown';
  var entry = { ts: new Date().toISOString(), user: user, action: action, detail: detail };
  _auditLog.unshift(entry);
  if (_auditLog.length > 200) _auditLog = _auditLog.slice(0, 200);
  try { _STORE.setItem('pearl_audit_log', JSON.stringify(_auditLog)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/audit/' + entry.ts.replace(/[:.]/g,'-'), entry);
}
function loadAuditLog() {
  try { _auditLog = JSON.parse(_STORE.getItem('pearl_audit_log') || '[]'); } catch(e) { _auditLog = []; }
}

function mergeDataSafe(local, remote) {
  var merged = {};
  // Collect all non-timestamp keys from both
  var allKeys = {};
  Object.keys(local).forEach(function(k)  { if (!k.startsWith('_ts_')) allKeys[k] = 1; });
  Object.keys(remote).forEach(function(k) { if (!k.startsWith('_ts_')) allKeys[k] = 1; });
  Object.keys(allKeys).forEach(function(k) {
    var localTs  = local['_ts_' + k]  || 0;
    var remoteTs = remote['_ts_' + k] || 0;
    var hasLocal  = local[k]  !== undefined;
    var hasRemote = remote[k] !== undefined;
    if (hasLocal && hasRemote) {
      // Both have it — newer timestamp wins
      if (localTs >= remoteTs) {
        merged[k] = local[k];
        merged['_ts_' + k] = localTs;
      } else {
        merged[k] = remote[k];
        merged['_ts_' + k] = remoteTs;
      }
    } else if (hasLocal) {
      merged[k] = local[k];
      if (localTs) merged['_ts_' + k] = localTs;
    } else {
      merged[k] = remote[k];
      if (remoteTs) merged['_ts_' + k] = remoteTs;
    }
  });
  return merged;
}

function saveDB(y) {
  // Save to localStorage instantly — never fails silently
  try { _STORE.setItem(lsKey(y), JSON.stringify(_DB[y] || {})); } catch(e) {
    _logError('SaveDB', 'localStorage write failed for year ' + y, 'saveDB', 0, 0, e);
  }
  // Save to Firebase with auto-retry (3 attempts, exponential backoff)
  if (window._fbSaveKey) {
    _fbSaveWithRetry(fbDataPath(y), _DB[y] || {}, 0);
  }
}

function _fbSaveWithRetry(path, data, attempt) {
  var MAX_ATTEMPTS = 3;
  var DELAYS = [0, 2000, 5000]; // immediate, 2s, 5s
  setTimeout(function() {
    window._fbSaveKey(path, data).then(function(ok) {
      if (!ok && attempt < MAX_ATTEMPTS - 1) {
        console.warn('[SaveRetry] Attempt ' + (attempt+1) + ' failed for ' + path + ' — retrying...');
        _fbSaveWithRetry(path, data, attempt + 1);
      } else if (!ok) {
        toast('⚠️ Cloud sync failed after ' + MAX_ATTEMPTS + ' tries — data saved locally', 'warn');
        _logError('CloudSync', 'Firebase save failed after ' + MAX_ATTEMPTS + ' attempts: ' + path, 'saveDB', 0, 0, null);
      }
    }).catch(function(e) {
      if (attempt < MAX_ATTEMPTS - 1) {
        console.warn('[SaveRetry] Attempt ' + (attempt+1) + ' error: ' + e.message);
        _fbSaveWithRetry(path, data, attempt + 1);
      } else {
        toast('⚠️ Cloud sync failed — data saved locally only', 'warn');
        _logError('CloudSync', 'Firebase save error: ' + (e.message||e), 'saveDB', 0, 0, e);
      }
    });
  }, DELAYS[attempt] || 5000);
}

// ── Stamp a save timestamp on all keys being written ──
function stampTimestamps(y, m, dept, day) {
  var db = _DB[y] || {};
  var now = Date.now();
  var prefix = m + '-' + dept + '-';
  var dayKey = day - 1;
  // Stamp timestamp for every item in this dept/day save
  if (MASTER[dept]) {
    MASTER[dept].forEach(function(_, i) {
      var key = m + '-' + dept + '-' + i + '-' + dayKey;
      db['_ts_' + key] = now;
    });
  }
  _DB[y] = db;
}

function loadPR(y) {
  try {
    const s = JSON.parse(_STORE.getItem(prKey(y)) || 'null');
    if (s) {
      // Background sync — only update PRICES global for current year, never for other years
      if (window._fbLoadKey) {
        window._fbLoadKey(fbPricePath(y)).then(function(fbPrices) {
          if (fbPrices) {
            try { _STORE.setItem(prKey(y), JSON.stringify(fbPrices)); } catch(e) {}
            if (y === CY) PRICES = fbPrices; // ONLY update global if current year
            // Never assign to PRICES for a different year
          } else {
            if (window._fbSaveKey) window._fbSaveKey(fbPricePath(y), s);
          }
        });
      }
      return s;
    }
  } catch(e) {}
  // No local prices for this year
  // For non-current years return MASTER copy — do NOT fall back to CY prices
  const p = {};
  DEPT_KEYS.forEach(d => { p[d] = MASTER[d].map(i => [...i]); });
  // Try loading from Firebase for next render
  if (window._fbLoadKey) {
    window._fbLoadKey(fbPricePath(y)).then(function(fbPrices) {
      if (fbPrices) { try { _STORE.setItem(prKey(y), JSON.stringify(fbPrices)); } catch(e) {} }
    });
  }
  return p;
}

function savePR(y, p) {
  _STORE.setItem(prKey(y), JSON.stringify(p));
  if (window._fbSaveKey) {
    window._fbSaveKey(fbPricePath(y), p);
  }
}

let PRICES = {};
function getP(d, i) { return PRICES[d]?.[i]?.[1] ?? MASTER[d][i][1]; }
function getK(d, i) { return PRICES[d]?.[i]?.[2] ?? MASTER[d][i][2]; }
function getN(d, i) { return PRICES[d]?.[i]?.[0] ?? MASTER[d][i][0]; }

// ── Price Schedule (effective-date pricing) ───────────────────
// Stored as: pearl_price_schedule = [{effectiveDate:'YYYY-MM-DD', year:2026, dept:'ALL'|deptName, prices:{dept:[items]}}]
var _PRICE_SCHEDULE = [];
function loadPriceSchedule() {
  try { _PRICE_SCHEDULE = JSON.parse(_STORE.getItem('pearl_price_schedule') || '[]'); } catch(e) { _PRICE_SCHEDULE = []; }
  // Also sync from Firebase
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/settings/price_schedule').then(function(fb) {
      if (fb && Array.isArray(fb) && fb.length > 0) { _PRICE_SCHEDULE = fb; try { _STORE.setItem('pearl_price_schedule', JSON.stringify(fb)); } catch(e){} }
    });
  }
}
function savePriceSchedule() {
  try { _STORE.setItem('pearl_price_schedule', JSON.stringify(_PRICE_SCHEDULE)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/price_schedule', _PRICE_SCHEDULE);
}
// Get the correct price for a dept/item on a specific date (year, month 1-based, day 1-based)
function getPriceForDate(dept, i, year, month, day) {
  var dateStr = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0');

  // 1. Check monthly price version first (takes highest priority)
  if (hasMonthlyPrices(year, month)) {
    var mpr = loadPRM(year, month);
    if (mpr[dept] && mpr[dept][i] !== undefined) {
      return mpr[dept][i][1] ?? MASTER[dept][i][1];
    }
  }

  // 2. Check price schedule (date-based overrides)
  var best = null;
  _PRICE_SCHEDULE.forEach(function(entry) {
    if (entry.effectiveDate > dateStr) return;
    if (entry.year && entry.year !== year) return;
    if (entry.dept !== 'ALL' && entry.dept !== dept) return;
    if (!best || entry.effectiveDate >= best.effectiveDate) best = entry;
  });
  if (best && best.prices && best.prices[dept] && best.prices[dept][i]) {
    return best.prices[dept][i][1] ?? MASTER[dept][i][1];
  }

  // 3. Fall back to year prices
  var pr = (year === CY) ? PRICES : loadPR(year);
  return pr[dept]?.[i]?.[1] ?? MASTER[dept][i][1];
}
function getKgForDate(dept, i, year, month, day) {
  var dateStr = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0');

  // 1. Monthly price version
  if (hasMonthlyPrices(year, month)) {
    var mpr = loadPRM(year, month);
    if (mpr[dept] && mpr[dept][i] !== undefined) {
      return mpr[dept][i][2] ?? MASTER[dept][i][2];
    }
  }

  // 2. Schedule
  var best = null;
  _PRICE_SCHEDULE.forEach(function(entry) {
    if (entry.effectiveDate > dateStr) return;
    if (entry.year && entry.year !== year) return;
    if (entry.dept !== 'ALL' && entry.dept !== dept) return;
    if (!best || entry.effectiveDate >= best.effectiveDate) best = entry;
  });
  if (best && best.prices && best.prices[dept] && best.prices[dept][i]) {
    return best.prices[dept][i][2] ?? MASTER[dept][i][2];
  }

  // 3. Year prices
  var pr = (year === CY) ? PRICES : loadPR(year);
  return pr[dept]?.[i]?.[2] ?? MASTER[dept][i][2];
}
// Check if a specific date has a different price than the base PRICES (for UI indicator)
function hasScheduledPriceChange(year, month, day) {
  var dateStr = year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0');
  return _PRICE_SCHEDULE.some(function(e) { return e.effectiveDate === dateStr; });
}

// FIX: getVal now reads from in-memory cache, not re-parsing localStorage every call
function getVal(y, m, d, i, day) {
  const db = loadDB(y);
  return db[m + '-' + d + '-' + i + '-' + day] || 0;
}

// Get locked price saved with data (returns null if not set)
function getLockedPrice(y, m, d, i, day) {
  const db = loadDB(y);
  var v = db[m + '-' + d + '-' + i + '-' + day + '-p'];
  return (v !== undefined && v !== null) ? v : null;
}

// Get locked KG saved with data (returns null if not set)
function getLockedKg(y, m, d, i, day) {
  const db = loadDB(y);
  var v = db[m + '-' + d + '-' + i + '-' + day + '-k'];
  return (v !== undefined && v !== null) ? v : null;
}

// Get the price to use for revenue calculation — locked price wins, then schedule, then current
function getPriceForCalc(d, i, y, m, day) {
  var locked = getLockedPrice(y, m, d, i, day - 1);
  if (locked !== null) return locked;
  return getPriceForDate(d, i, y, m, day);
}
function getKgForCalc(d, i, y, m, day) {
  var locked = getLockedKg(y, m, d, i, day - 1);
  if (locked !== null) return locked;
  return getKgForDate(d, i, y, m, day);
}

// FIX: setVal writes to cache and marks dirty, saveDay() commits to localStorage
// Cache for monthTotals — cleared when data changes
var _monthTotalsCache = {};

function invalidateMonthTotalsCache(y, m) {
  if (y && m) delete _monthTotalsCache[y + '_' + m];
  else _monthTotalsCache = {};
}

function setVal(y, m, d, i, day, v) {
  const db = loadDB(y);
  const key = m + '-' + d + '-' + i + '-' + day;
  if (v === 0) {
    delete db[key];
    delete db[key + '-p'];
    delete db[key + '-k'];
  } else {
    db[key] = v;
  }
  _dirty = true;
  // Invalidate all caches for this month/day
  invalidateMonthTotalsCache(y, m);
  invalidateDayTotalsCache(y, m, day+1);
  delete _activeDaysCache[y + '_' + m];
}

// Lock price+kg at save time
function lockPriceAtSave(y, m, d, i, day) {
  const db = loadDB(y);
  const key = m + '-' + d + '-' + i + '-' + day;
  if (db[key] && db[key] > 0) {
    db[key + '-p'] = getPriceForDate(d, i, y, m, day + 1);
    db[key + '-k'] = getKgForDate(d, i, y, m, day + 1);
  }
  _dirty = true;
}

function commitSave(y) {
  if (_dirty) { saveDB(y); _dirty = false; }
}

// ── Real-time Firebase listener — auto-refresh when another device saves ──
var _fbListenerYear = null;
var _fbListenerUnsub = null;
function attachFbListener(y) {
  if (_fbListenerYear === y) return;
  // Detach old listener
  if (_fbListenerYear !== null) {
    try { firebase.database().ref(fbDataPath(_fbListenerYear)).off('value'); } catch(e) {}
  }
  _fbListenerYear = y;
  try {
    firebase.database().ref(fbDataPath(y)).on('value', function(snap) {
      var fbData = snap.val();
      if (fbData && typeof fbData === 'object' && Object.keys(fbData).length > 0) {
        var local = _DB[y] || {};
        // TIMESTAMP-SAFE MERGE: each key's newer timestamp wins — no rollback possible
        var merged = mergeDataSafe(local, fbData);
        var mergedStr = JSON.stringify(merged);
        var localStr  = JSON.stringify(local);
        // If local had newer data push merged back to Firebase to protect it
        var localHasNewer = Object.keys(local).some(function(k) {
          if (k.startsWith('_ts_')) return false;
          return (local['_ts_' + k] || 0) > (fbData['_ts_' + k] || 0);
        });
        if (localHasNewer && window._fbSaveKey) {
          window._fbSaveKey(fbDataPath(y), merged);
        }
        if (mergedStr !== localStr) {
          _DB[y] = merged;
          try { _STORE.setItem(lsKey(y), mergedStr); } catch(e) {}
          invalidateMonthTotalsCache(); // data changed — clear calc cache
          invalidateDayTotalsCache(); // clear day totals cache too
          _activeDaysCache = {}; // clear active days cache too
          if (isMobile()) {
            try { mobRenderDash(); } catch(e) {}
            try { mobRenderEntry(); } catch(e) {}
            try { mobRenderFinance(); } catch(e) {}
          } else {
            try { renderDash(); } catch(e) {}
            try { renderEntry(); } catch(e) {}
            try { renderMonthly(); } catch(e) {}
          }
        }
      } else if (snap.val() === null) {
        var local2 = _DB[y] || {};
        if (Object.keys(local2).length > 0) {
          window._fbSaveKey(fbDataPath(y), local2);
        }
      }
    });
  } catch(e) { console.warn('attachFbListener error', e); }
}
// Start listener when Firebase is ready
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

window.addEventListener('fb-ready', function() {
  attachFbListener(CY);
  loadPriceSchedule();
  loadAuditLog();
  loadCurrency();
  loadFxRates();
  loadHotelSettings();
  syncAllTargetsFromFB();
  // Auto-sync all occupancy data from Firebase on startup
  autoSyncOccupancyFromFB();
  // Daily auto-backup
  checkAndRunDailyAutoBackup();
  // Auto-push any existing local data up to Firebase
  setTimeout(pushLocalDataToFirebase, 2000);
  // One-time migration: stamp locked prices on existing data
  setTimeout(migrateLockedPrices, 3000);
});

// ── Licence check on page load ──
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
  // All pages start hidden in CSS — bootWithLicenceCheck decides which to show
  // Small delay lets Firebase SDK initialise first
  setTimeout(bootWithLicenceCheck, 900);
});

// ── Monthly export menu toggle ────────────────────────────────
function toggleMonthlyExportMenu(e) {
  e.stopPropagation();
  var menu = document.getElementById('monthly-export-menu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  if (menu.style.display === 'block') {
    setTimeout(function() { document.addEventListener('click', closeMonthlyExportMenu, {once:true}); }, 10);
  }
}
function closeMonthlyExportMenu() {
  var menu = document.getElementById('monthly-export-menu');
  if (menu) menu.style.display = 'none';
}

// ── Monthly Export: Excel ─────────────────────────────────────
function exportMonthlyExcel() {
  var mVal = parseInt(document.getElementById('mon-month').value);
  var dVal = document.getElementById('mon-dept').value;
  var mName = MONTH_NAMES[mVal - 1];
  var nd = dim(CY, mVal);
  var depts = dVal === 'ALL' ? DEPT_KEYS : [dVal];

  // Build HTML table (Excel opens .xls HTML tables fine)
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">';
  html += '<head><meta charset="utf-8"><style>';
  html += 'th{background:#0d1b2e;color:#c9a84c;font-weight:bold;padding:4px 6px}';
  html += 'td{padding:3px 6px;border:1px solid #ccc}';
  html += '.dept{background:#e8f0fe;font-weight:bold}';
  html += '.tot{font-weight:bold;background:#fef9ee}';
  html += '</st'+'yle></he'+'ad><body><table border="1">';

  html += '<tr><th>Department</th><th>Item</th>';
  for (var d = 1; d <= nd; d++) html += '<th>' + d + '</th>';
  html += '<th>TOTAL</th><th>QR</th></tr>';

  depts.forEach(function(dk) {
    var items = MASTER[dk];
    if (!items) return;
    html += '<tr class="dept"><td colspan="' + (nd + 4) + '">' + dk + '</td></tr>';
    var subDay = new Array(nd).fill(0), subPcs = 0, subQR = 0;
    items.forEach(function(_, ii) {
      var nm = getN(dk, ii), pr = getP(dk, ii), tot = 0;
      var cells = '';
      for (var dd = 1; dd <= nd; dd++) {
        var v = getVal(CY, mVal, dk, ii, dd - 1);
        cells += '<td>' + (v || '') + '</td>';
        tot += v; subDay[dd-1] += v;
      }
      subPcs += tot; subQR += tot * pr;
      html += '<tr><td>' + dk + '</td><td>' + nm + '</td>' + cells +
        '<td><b>' + (tot||'') + '</b></td><td>' + (tot ? (tot*pr).toFixed(4) : '') + '</td></tr>';
    });
    html += '<tr class="tot"><td colspan="2"><b>Subtotal — ' + dk + '</b></td>';
    subDay.forEach(function(v){ html += '<td><b>' + (v||'') + '</b></td>'; });
    html += '<td><b>' + subPcs + '</b></td><td><b>' + subQR.toFixed(2) + '</b></td></tr>';
  });
  html += '</table></bo'+'dy></ht'+'ml>';

  var blob = new Blob([html], {type: 'application/vnd.ms-excel;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'Pearl_Monthly_' + mName + '_' + CY + (dVal !== 'ALL' ? '_' + dVal : '') + '.xls';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  showToast('📊 Excel exported — ' + mName + ' ' + CY);
}

// ── Monthly Export: CSV ───────────────────────────────────────
function exportMonthlyCSV() {
  var mVal = parseInt(document.getElementById('mon-month').value);
  var dVal = document.getElementById('mon-dept').value;
  var mName = MONTH_NAMES[mVal - 1];
  var nd = dim(CY, mVal);
  var depts = dVal === 'ALL' ? DEPT_KEYS : [dVal];

  var header = ['Department','Item'];
  for (var d = 1; d <= nd; d++) header.push(d);
  header.push('TOTAL', 'QR');
  var lines = [header.join(',')];

  depts.forEach(function(dk) {
    var items = MASTER[dk];
    if (!items) return;
    items.forEach(function(_, ii) {
      var nm = getN(dk, ii), pr = getP(dk, ii), tot = 0;
      var row = ['"' + dk + '"', '"' + nm + '"'];
      for (var dd = 1; dd <= nd; dd++) {
        var v = getVal(CY, mVal, dk, ii, dd - 1);
        row.push(v || 0); tot += v;
      }
      row.push(tot, (tot * pr).toFixed(4));
      lines.push(row.join(','));
    });
  });

  var blob = new Blob([lines.join('\r\n')], {type: 'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'Pearl_Monthly_' + mName + '_' + CY + (dVal !== 'ALL' ? '_' + dVal : '') + '.csv';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  showToast('📄 CSV exported — ' + mName + ' ' + CY);
}

// ── Monthly Export: PDF (print) ───────────────────────────────
function exportMonthlyPDF() {
  var mVal = parseInt(document.getElementById('mon-month').value);
  var dVal = document.getElementById('mon-dept').value;
  var mName = MONTH_NAMES[mVal - 1];
  var nd = dim(CY, mVal);
  var depts = dVal === 'ALL' ? DEPT_KEYS : [dVal];
  var deptLabel = dVal === 'ALL' ? 'All Departments' : dVal;

  var tableHtml = '<table><thead><tr><th>Department</th><th>Item</th>';
  for (var d = 1; d <= nd; d++) tableHtml += '<th>' + d + '</th>';
  tableHtml += '<th>TOTAL</th><th>QR</th></tr></thead><tbody>';

  var grandPcs = 0, grandQR = 0;
  depts.forEach(function(dk) {
    var items = MASTER[dk];
    if (!items) return;
    tableHtml += '<tr class="dept-row"><td colspan="' + (nd + 4) + '">' + dk + '</td></tr>';
    var subDay = new Array(nd).fill(0), subPcs = 0, subQR = 0;
    items.forEach(function(_, ii) {
      var nm = getN(dk, ii), pr = getP(dk, ii), tot = 0;
      var cells = '';
      for (var dd = 1; dd <= nd; dd++) {
        var v = getVal(CY, mVal, dk, ii, dd - 1);
        cells += '<td>' + (v || '') + '</td>';
        tot += v; subDay[dd-1] += v;
      }
      subPcs += tot; subQR += tot * pr;
      tableHtml += '<tr><td>' + dk + '</td><td>' + nm + '</td>' + cells +
        '<td><b>' + (tot||'') + '</b></td><td>' + (tot ? (tot*pr).toFixed(4) : '') + '</td></tr>';
    });
    tableHtml += '<tr class="sub-row"><td colspan="2"><b>Subtotal — ' + dk + '</b></td>';
    subDay.forEach(function(v){ tableHtml += '<td><b>' + (v||'') + '</b></td>'; });
    tableHtml += '<td><b>' + subPcs + '</b></td><td><b>' + subQR.toFixed(2) + '</b></td></tr>';
    grandPcs += subPcs; grandQR += subQR;
  });
  tableHtml += '<tr class="total-row"><td colspan="' + (nd+2) + '"><b>GRAND TOTAL</b></td>' +
    '<td><b>' + grandPcs + '</b></td><td><b>' + grandQR.toFixed(2) + ' QR</b></td></tr>';
  tableHtml += '</tbody></table>';

  var css = [
    'body{font-family:Arial,sans-serif;font-size:9px;color:#1a2332;margin:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    'h2{color:#0d1b2e;margin:0 0 3px;font-size:14px}',
    'p{color:#64748b;margin:0 0 8px;font-size:11px}',
    'table{border-collapse:collapse;width:100%}',
    'th{background:#0d1b2e;color:#c9a84c;padding:4px 5px;text-align:center;font-size:8px;border:1px solid #1e3a5f}',
    'td{padding:2px 5px;border:1px solid #e2e8f0;text-align:center}',
    'td:first-child,td:nth-child(2){text-align:left;white-space:nowrap;font-size:8px}',
    '.dept-row td{background:#e8edf4;font-weight:700;color:#0d1b2e;text-align:left}',
    '.sub-row td{background:#f0f4f8;font-weight:700}',
    '.total-row td{background:#fef3c7;font-weight:700;border-top:2px solid #c9a84c;font-size:10px}',
    '@media print{@page{size:landscape;margin:8mm}body{margin:0}}'
  ].join('');

  var fullHTML = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<title>Pearl Monthly ' + mName + ' ' + CY + '</title>' +
    '<style>' + css + '</st'+'yle></he'+'ad><body>' +
    '<h2>RS LaundryPro Management — Monthly Report</h2>' +
    '<p>' + mName + ' ' + CY + '&nbsp;&nbsp;·&nbsp;&nbsp;' + deptLabel + '</p>' +
    tableHtml + '</bo'+'dy></ht'+'ml>';

  var blob = new Blob([fullHTML], {type: 'text/html;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1200px;height:800px;border:none;opacity:0';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = function() {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) {
      window.open(url, '_blank');
    }
    setTimeout(function(){ document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 5000);
  };
  showToast('🖨️ Print dialog opening...');
}

// ── Remove team account ───────────────────────────────────────
function removeTeamAccount() {
  if (!confirm('Remove team account? Team members will no longer be able to log in.')) return;
  _STORE.removeItem('pearl_team_credentials');
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/team', null);
  var tm = document.getElementById('team-msg');
  if (tm) { tm.textContent = '✅ Team account removed.'; tm.className = 'settings-msg ok'; }
  var el = document.getElementById('settings-current-team');
  if (el) el.textContent = 'None';
  showToast('🗑 Team account removed');
}

// ── Populate current usernames in Settings labels ─────────────
function populateSettingsLabels() {
  var creds = null;
  try { creds = JSON.parse(_STORE.getItem('pearl_credentials') || 'null'); } catch(e) {}
  var adminEl = document.getElementById('settings-current-user');
  if (adminEl) adminEl.textContent = (creds && creds.username) ? creds.username : 'Reda Salah';

  var team = null;
  try { team = JSON.parse(_STORE.getItem('pearl_team_credentials') || 'null'); } catch(e) {}
  var teamEl = document.getElementById('settings-current-team');
  if (teamEl) teamEl.textContent = (team && team.username) ? team.username : 'Not set';

  // Populate username placeholder
  var newUser = document.getElementById('set-new-user');
  if (newUser && creds && creds.username) newUser.placeholder = 'Current: ' + creds.username;
  var teamUser = document.getElementById('set-team-user');
  if (teamUser && team && team.username) teamUser.placeholder = 'Current: ' + team.username;
}

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════
function dim(y, m) { return new Date(y, m, 0).getDate(); }
function fmtDate(d) { return d.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}); }
// ── Currency Settings ─────────────────────────────────────────
var _CURRENCY = { symbol: 'QR', position: 'after', decimals: 2 };

// ══════════════════════════════════════════════════════════
//  HOTEL SETTINGS
// ══════════════════════════════════════════════════════════
var _TOTAL_ROOMS = 161; // default
var _HOTEL_NAME  = '';

function loadHotelSettings() {
  try {
    var stored = JSON.parse(localStorage.getItem('pearl_hotel_settings') || '{}');
    _TOTAL_ROOMS = stored.rooms || 161;
    _HOTEL_NAME  = stored.name  || '';
  } catch(e) { _TOTAL_ROOMS = 161; _HOTEL_NAME = ''; }
  // Apply name to UI — use setTimeout to ensure DOM is ready
  if (_HOTEL_NAME) {
    setTimeout(function() {
      if (typeof applyHotelNameToUI === 'function') applyHotelNameToUI(_HOTEL_NAME);
    }, 100);
  }
  // Also try Firebase
  // Try both Firebase paths (settings/hotel is the write path)
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/settings/hotel').then(function(d) {
      if (d && (d.rooms || d.name)) {
        if (d.rooms > 0) _TOTAL_ROOMS = d.rooms;
        if (d.name)      _HOTEL_NAME  = d.name;
        try { localStorage.setItem('pearl_hotel_settings', JSON.stringify({ rooms: _TOTAL_ROOMS, name: _HOTEL_NAME })); } catch(e) {}
        if (typeof applyHotelNameToUI === 'function') applyHotelNameToUI(_HOTEL_NAME);
        // Update benchmark rooms field if open
        var btr = document.getElementById('bench-total-rooms');
        if (btr) btr.value = _TOTAL_ROOMS;
      }
    }).catch(function(){});
  }
}

function openHotelSettings() {
  loadHotelSettings();
  var ni = document.getElementById('hotel-name-inp');
  var ri = document.getElementById('total-rooms-inp');
  var nd = document.getElementById('hotel-name-display');
  var rd = document.getElementById('rooms-display');
  if (ni) ni.value = _HOTEL_NAME;
  if (ri) ri.value = _TOTAL_ROOMS;
  if (nd) nd.textContent = _HOTEL_NAME || '(not set)';
  if (rd) rd.textContent = _TOTAL_ROOMS + ' rooms';
}

function saveTotalRooms() {
  var val = parseInt(document.getElementById('total-rooms-inp')?.value) || 161;
  if (val < 1 || val > 9999) { toast('⚠️ Enter a valid room count (1-9999)', 'err'); return; }
  _TOTAL_ROOMS = val;
  var stored = JSON.parse(localStorage.getItem('pearl_hotel_settings') || '{}');
  stored.rooms = val;
  localStorage.setItem('pearl_hotel_settings', JSON.stringify(stored));
  if (window._fbDB) window._fbDB.ref('pearl/hotel/rooms').set(val);
  var msg = document.getElementById('rooms-saved-msg');
  var rd  = document.getElementById('rooms-display');
  if (msg) { msg.style.display = 'block'; setTimeout(function(){ msg.style.display='none'; }, 2000); }
  if (rd)  rd.textContent = val + ' rooms';
  invalidateTabCache('dashboard');
  // Re-render dashboard occupancy row if dashboard is active
  if (curTab === 'dashboard') {
    renderDashOccQuick(parseInt(document.getElementById('dash-month')?.value || new Date().getMonth()+1));
  }
  // Also update benchmark rooms field if it exists
  var btr = document.getElementById('bench-total-rooms');
  if (btr) btr.value = val;
  toast('🏨 Total rooms set to ' + val + ' — all displays updated', 'ok');
}

function saveHotelSettings() {
  var name = document.getElementById('hotel-name-inp')?.value?.trim() || '';
  _HOTEL_NAME = name;
  var stored = JSON.parse(localStorage.getItem('pearl_hotel_settings') || '{}');
  stored.name = name;
  localStorage.setItem('pearl_hotel_settings', JSON.stringify(stored));
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/hotel', stored);
  // Update all visible name locations
  applyHotelNameToUI(name);
  toast('🏨 Property name saved: ' + (name || '(cleared)'), 'ok');
}

function applyHotelNameToUI(name) {
  var display = name || 'RS LaundryPro';
  var short   = name ? name.split(' ')[0] : 'Pearl'; // first word for short display

  // 1. Nav bar brand name
  var navName = document.getElementById('nav-hotel-name');
  if (navName) navName.textContent = display;

  // 2. Nav bar subtitle
  var navSub = document.getElementById('nav-hotel-sub');
  if (navSub) navSub.textContent = 'Laundry System';

  // 3. Page title
  document.title = display + ' · Laundry System';

  // 4. Settings display
  var nd = document.getElementById('hotel-name-display');
  if (nd) nd.textContent = name || '(not set)';

  // 5. Nav brand title tooltip
  var brand = document.querySelector('.tn-brand');
  if (brand) brand.title = 'About · ' + display + ' Laundry System';

  // 6. Dashboard header (if visible)
  var dashTitle = document.querySelector('#tab-dashboard h1');
  // Don't override dashboard h1 — it says "Dashboard"

  // 7. Mobile app header if present
  var mobHeader = document.getElementById('mob-hotel-name');
  if (mobHeader) mobHeader.textContent = display;

  // 8. Login screen name (shows before login)
  var loginName = document.getElementById('login-system-name');
  if (loginName) loginName.textContent = display;

  // 9. Footer copyright line
  var footers = document.querySelectorAll('.footer-system-name');
  footers.forEach(function(f){ f.textContent = display; });
}

// ── Load daily occupancy ──
function loadDayOcc(y, m, d) {
  try {
    // 1. Check individual day key (set by dashboard or benchmark bridge)
    var key = 'occ_' + y + '_' + m + '_' + d;
    var stored = JSON.parse(_STORE.getItem(key) || 'null');
    if (stored) return stored;

    // 2. Fallback: check benchmark storage for this day
    var bench = {};
    try { bench = JSON.parse(_STORE.getItem(benchKey(y, m)) || '{}'); } catch(e) {}
    var benchPct = bench[d] !== undefined ? parseFloat(bench[d]) : null;
    if (benchPct !== null && !isNaN(benchPct)) {
      var totalRooms = _TOTAL_ROOMS || 161;
      var rooms = Math.round(benchPct / 100 * totalRooms);
      var bridged = { rooms: rooms, pct: benchPct };
      // Save to individual key for future fast reads
      try { _STORE.setItem(key, JSON.stringify(bridged)); } catch(e) {}
      return bridged;
    }
    return null;
  } catch(e) { return null; }
}

function saveDayOcc(y, m, d, rooms, pct) {
  var data = { rooms: rooms, pct: pct };
  var key = 'occ_' + y + '_' + m + '_' + d;
  _STORE.setItem(key, JSON.stringify(data));
  if (window._fbDB) {
    window._fbDB.ref('pearl/occupancy/' + y + '/' + m + '/' + d).set(data);
  }
}

function loadMonthOcc(y, m) {
  // Returns array of {rooms, pct} for each day (index 0 = day 1)
  var result = [];
  var nd = dim(y, m);
  for (var d = 1; d <= nd; d++) {
    result.push(loadDayOcc(y, m, d));
  }
  return result;
}

function syncOccFromFB(y, m) {
  if (!window._fbDB) return;
  window._fbDB.ref('pearl/occupancy/' + y + '/' + m).once('value').then(function(snap) {
    var data = snap.val() || {};
    Object.keys(data).forEach(function(d) {
      var key = 'occ_' + y + '_' + m + '_' + d;
      _STORE.setItem(key, JSON.stringify(data[d]));
    });
  }).catch(function(){});
}

function loadCurrency() {
  try {
    var saved = JSON.parse(_STORE.getItem('pearl_currency') || 'null');
    if (saved) _CURRENCY = saved;
  } catch(e) {}
  if (window._fbLoadKey) {
    window._fbLoadKey('pearl/settings/currency').then(function(fb) {
      if (fb) { _CURRENCY = fb; try { _STORE.setItem('pearl_currency', JSON.stringify(fb)); } catch(e) {} }
    });
  }
}

function saveCurrency() {
  try { _STORE.setItem('pearl_currency', JSON.stringify(_CURRENCY)); } catch(e) {}
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/currency', _CURRENCY);
}

function fmtMoney(n) {
  var num = parseFloat(n) || 0;
  var dec = _CURRENCY.decimals !== undefined ? _CURRENCY.decimals : 2;
  // Format with commas
  var parts = num.toFixed(dec).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  var formatted = parts.join('.');
  var sym = _CURRENCY.symbol || 'QR';
  if (_CURRENCY.position === 'before') return sym + ' ' + formatted;
  return formatted + ' ' + sym;
}

// Keep f2 as alias for backward compat (plain number, no currency)
function f2(n) {
  var num = parseFloat(n) || 0;
  var dec = _CURRENCY.decimals !== undefined ? _CURRENCY.decimals : 2;
  var parts = num.toFixed(dec).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
function f4(n) { return (+n).toFixed(4); }

// FIX: dayTotals now uses cached reads — fast
var _dayTotalsCache = {};

function invalidateDayTotalsCache(y, m, day) {
  if (y && m && day) delete _dayTotalsCache[y+'_'+m+'_'+day];
  else if (y && m) { Object.keys(_dayTotalsCache).forEach(function(k){ if(k.startsWith(y+'_'+m+'_')) delete _dayTotalsCache[k]; }); }
  else _dayTotalsCache = {};
}

function dayTotals(y, m, day) {
  var ck = y + '_' + m + '_' + day;
  if (_dayTotalsCache[ck]) return _dayTotalsCache[ck];
  let qr = 0, kg = 0;
  DEPT_KEYS.forEach(d => MASTER[d].forEach((_, i) => {
    const v = getVal(y, m, d, i, day - 1);
    if (v > 0) {
      qr += v * getPriceForCalc(d, i, y, m, day);
      kg += v * getKgForCalc(d, i, y, m, day);
    }
  }));
  const result = { qr, kg };
  _dayTotalsCache[ck] = result;
  return result;
}

// FIX: monthTotals — single pass through cache, correct revenue calc
function monthTotals(y, m) {
  var cacheKey = y + '_' + m;
  if (_monthTotalsCache[cacheKey]) return _monthTotalsCache[cacheKey];

  const nd = dim(y, m);
  let qr = 0, kg = 0, pcs = 0;
  const byDept = {};
  DEPT_KEYS.forEach(d => {
    let dq = 0, dk = 0, dp = 0;
    MASTER[d].forEach((_, i) => {
      for (let day = 0; day < nd; day++) {
        const v = getVal(y, m, d, i, day);
        if (v > 0) {
          const pr = getPriceForCalc(d, i, y, m, day + 1);
          const kw = getKgForCalc(d, i, y, m, day + 1);
          dq += v * pr;
          dk += v * kw;
          dp += v;
        }
      }
    });
    byDept[d] = { qr: dq, kg: dk, pcs: dp };
    qr += dq; kg += dk; pcs += dp;
  });
  const result = { qr, kg, pcs, byDept };
  _monthTotalsCache[cacheKey] = result;
  return result;
}

// ════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════
function togglePassVis() {
  var f = document.getElementById('l-pass');
  var i = document.getElementById('eye-icon');
  var b = document.getElementById('eye-btn');
  if (f.type === 'password') {
    f.type = 'text';
    i.textContent = '🙈';
    b.style.color = 'rgba(201,168,76,.8)';
  } else {
    f.type = 'password';
    i.textContent = '👁';
    b.style.color = 'rgba(255,255,255,.4)';
  }
}

// ════════════════════════════════════════════════════════════════
//  SETTINGS — change username / password
// ════════════════════════════════════════════════════════════════
var CREDS_KEY   = 'pearl_credentials';
var TEAM_KEY    = 'pearl_team_credentials';
var ACCESS_KEY  = 'pearl_tab_access';

// All tabs with labels — dashboard & entry always visible to team
var ALL_TABS = [
  {id:'dashboard', label:'📊 Dashboard',      locked: true},
  {id:'entry',     label:'✏️ Daily Entry',     locked: true},
  {id:'monthly',   label:'📅 Monthly',         locked: false},
  {id:'report',    label:'📄 Report & PDF',    locked: false},
  {id:'finance',   label:'🏦 Finance Posting', locked: false},
  {id:'benchmark', label:'🎯 Benchmark',       locked: false},
  {id:'prices',    label:'⚙️ Prices',          locked: false},
  {id:'items',     label:'📦 Items',           locked: false},
  {id:'analytics', label:'📈 Analytics',       locked: false},
  {id:'forecast',  label:'🔮 Forecast',        locked: false},
  {id:'planning',  label:'🎯 Planning',        locked: false},
  {id:'guide',     label:'💡 Help Center',     locked: false},
  {id:'backup',    label:'🛡️ Backup',          locked: false},
];

function getCredentials() {
  try {
    var s = JSON.parse(_STORE.getItem(CREDS_KEY) || 'null');
    if (s && s.user && s.pass) return s;
  } catch(e) {}
  return {user: 'Reda Salah', pass: 'RS@2026'};
}
// Returns array of all team accounts
function getAllTeamAccounts() {
  try {
    var s = JSON.parse(_STORE.getItem('pearl_team_accounts') || 'null');
    if (Array.isArray(s)) return s;
  } catch(e) {}
  // Migrate old single team account if exists
  try {
    var old = JSON.parse(_STORE.getItem(TEAM_KEY) || 'null');
    if (old && old.user && old.pass) {
      var migrated = [{id:'t1', user:old.user, pass:old.pass, tabs:[]}];
      _STORE.setItem('pearl_team_accounts', JSON.stringify(migrated));
      return migrated;
    }
  } catch(e) {}
  return [];
}
// Legacy single account — checks all team accounts
function getTeamCredentials() {
  var all = getAllTeamAccounts();
  return all.length > 0 ? all[0] : null;
}
function getTabAccess() {
  try {
    var s = JSON.parse(_STORE.getItem(ACCESS_KEY) || 'null');
    if (s && Array.isArray(s)) return s;
  } catch(e) {}
  return ['dashboard','entry'];
}

// ── Pull settings from Firebase so ALL devices share same config ──
function syncSettingsFromFirebase(callback) {
  if (!window._fbLoadKey) { if(callback) callback(); return; }
  var done = 0;
  function check() { done++; if (done === 3 && callback) callback(); }
  window._fbLoadKey('pearl/settings/credentials').then(function(v) {
    if (v && v.user && v.pass) { try { _STORE.setItem(CREDS_KEY, JSON.stringify(v)); } catch(e) {} }
    check();
  }).catch(check);
  window._fbLoadKey('pearl/settings/team').then(function(v) {
    if (v && v.user && v.pass) { try { _STORE.setItem(TEAM_KEY, JSON.stringify(v)); } catch(e) {} }
    check();
  }).catch(check);
  window._fbLoadKey('pearl/settings/tabaccess').then(function(v) {
    if (v && Array.isArray(v)) { try { _STORE.setItem(ACCESS_KEY, JSON.stringify(v)); } catch(e) {} }
    check();
  }).catch(check);
}

// ── Settings modal tab switcher ───────────────────────
function updateCurrencyPreview() {
  var sym = document.getElementById('set-currency-symbol')?.value || 'QR';
  var pos = document.querySelector('input[name="currency-pos"]:checked')?.value || 'after';
  var dec = parseInt(document.getElementById('set-currency-decimals')?.value || 2);
  var parts = (32073.63).toFixed(dec).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  var formatted = parts.join('.');
  var preview = pos === 'before' ? sym + ' ' + formatted : formatted + ' ' + sym;
  var el = document.getElementById('currency-preview');
  if (el) el.textContent = preview;
}
function quickCurrency(symbol, position, decimals) {
  var symEl = document.getElementById('set-currency-symbol');
  var decEl = document.getElementById('set-currency-decimals');
  var posEl = document.getElementById('pos-' + position);
  if (symEl) symEl.value = symbol;
  if (decEl) decEl.value = String(decimals);
  if (posEl) posEl.checked = true;
  updateCurrencyPreview();
}
function applyCurrencySettings() {
  var sym = (document.getElementById('set-currency-symbol')?.value || 'QR').trim();
  var pos = document.querySelector('input[name="currency-pos"]:checked')?.value || 'after';
  var dec = parseInt(document.getElementById('set-currency-decimals')?.value || 2);
  if (!sym) { toast('⚠️ Enter a currency symbol', 'err'); return; }
  _CURRENCY = { symbol: sym, position: pos, decimals: dec };
  saveCurrency();
  var msg = document.getElementById('currency-msg');
  if (msg) { msg.textContent = '✅ Saved — ' + sym; setTimeout(function(){ msg.textContent=''; }, 3000); }
  toast('💱 Currency → ' + sym, 'ok');
  try { renderDash(); } catch(e) {}
  try { renderEntry(); } catch(e) {}
  try { renderFinance(); } catch(e) {}
  try { renderMonthly(); } catch(e) {}
}
function openCurrencySettings() {
  var symEl = document.getElementById('set-currency-symbol');
  var decEl = document.getElementById('set-currency-decimals');
  var posEl = document.getElementById('pos-' + (_CURRENCY.position || 'after'));
  if (symEl) symEl.value = _CURRENCY.symbol || 'QR';
  if (decEl) decEl.value = String(_CURRENCY.decimals !== undefined ? _CURRENCY.decimals : 2);
  if (posEl) posEl.checked = true;
  updateCurrencyPreview();
  // Render FX rate inputs and quick converter
  setTimeout(renderFxRateInputs, 50);
  setTimeout(renderFxConvert, 50);
}

function renderAuditLog() {
  var wrap = document.getElementById('audit-log-wrap');
  if (!wrap) return;
  loadAuditLog();
  if (_auditLog.length === 0) {
    wrap.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;font-size:13px">No audit entries yet. Entries are recorded when data is saved.</div>';
    return;
  }
  var html = '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#f8fafc;position:sticky;top:0">' +
    '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px;border-bottom:1.5px solid #e2e8f0">TIME</th>' +
    '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px;border-bottom:1.5px solid #e2e8f0">USER</th>' +
    '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px;border-bottom:1.5px solid #e2e8f0">ACTION</th>' +
    '<th style="padding:9px 12px;text-align:left;color:#64748b;font-size:11px;border-bottom:1.5px solid #e2e8f0">DETAIL</th>' +
    '</tr></thead><tbody>';
  _auditLog.slice(0,100).forEach(function(e, idx) {
    var d = new Date(e.ts);
    var timeStr = d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) + ' ' +
      d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    var bg = idx%2===0?'#fff':'#f8fafc';
    var actionCol = e.action==='SAVE_DAY'?'#0369a1':e.action==='LOGIN'?'#15803d':'#7c3aed';
    html += '<tr style="background:' + bg + '">' +
      '<td style="padding:8px 12px;color:#64748b;white-space:nowrap">' + timeStr + '</td>' +
      '<td style="padding:8px 12px;font-weight:700;color:#0d1b2e">' + (e.user||'—') + '</td>' +
      '<td style="padding:8px 12px"><span style="background:' + actionCol + '22;color:' + actionCol + ';padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">' + e.action + '</span></td>' +
      '<td style="padding:8px 12px;color:#374151">' + (e.detail||'—') + '</td>' +
    '</tr>';
  });
  html += '</tbody></table>';
  if (_auditLog.length > 100) html += '<div style="padding:10px 12px;font-size:11px;color:#94a3b8;text-align:center">Showing 100 of ' + _auditLog.length + ' entries</div>';
  wrap.innerHTML = html;
}

function clearAuditLog() {
  if (!confirm('Clear all audit log entries?')) return;
  _auditLog = [];
  try { _STORE.removeItem('pearl_audit_log'); } catch(e) {}
  renderAuditLog();
  toast('Audit log cleared', 'ok');
}

function switchStab(name) {
  ['admin','team','access','audit','currency','hotel','licence','diag','import'].forEach(function(t) {
    var btn = document.getElementById('stab-'+t);
    var pan = document.getElementById('spanel-'+t);
    if (btn) btn.classList.toggle('on', t===name);
    if (pan) pan.style.display = t===name ? '' : 'none';
  });
  // Scroll content to top on every tab change
  var _ca = document.getElementById('settings-content-area');
  if (_ca) _ca.scrollTop = 0;
  if (name === 'access') buildAccessCheckboxes();
  if (name === 'team') prefillTeam();
  if (name === 'audit') renderAuditLog();
  if (name === 'currency') openCurrencySettings();
  if (name === 'hotel') openHotelSettings();
  if (name === 'import') { setTimeout(renderImportPreview, 50); }
  if (name === 'diag') {
    var ban = document.getElementById('diag-banner');
    var res = document.getElementById('diag-results');
    if (res && !res.querySelector('.diag-check')) {
      res.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;font-size:13px">Click <strong>▶ Run Diagnostics</strong> to check your system health</div>';
    }
    if (ban) ban.style.display = 'none';
    renderDiagErrorLog();
  }
  if (name === 'licence') {
    // Load device status always
    loadDeviceLicenceStatus();
    // Reset auth every time tab opens
    var authWrap = document.getElementById('lic-auth-wrap');
    var lockedContent = document.getElementById('lic-locked-content');
    var passInp = document.getElementById('lic-admin-pass');
    var errEl = document.getElementById('lic-auth-err');
    if (authWrap) authWrap.style.display = 'block';
    if (lockedContent) lockedContent.style.display = 'none';
    if (passInp) passInp.value = '';
    if (errEl) errEl.style.display = 'none';
  }
}

function openSettings() {
  document.body.classList.add('modal-open');
  // Reset all fields
  ['set-cur-pass','set-new-user','set-new-pass','set-confirm-pass',
   'set-team-adminpass','set-team-user','set-team-pass','set-team-confirm',
   'set-access-adminpass'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  ['settings-msg','team-msg','access-msg'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.className='settings-msg'; el.textContent=''; }
  });
  var creds = getCredentials();
  var nuEl = document.getElementById('set-new-user');
  if (nuEl) nuEl.placeholder = 'Current: ' + creds.user;
  // Show full-screen settings
  var modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';
  // Scroll content area to top
  var ca = document.getElementById('settings-content-area');
  if (ca) ca.scrollTop = 0;
  switchStab('admin');
  setTimeout(function(){
    var el = document.getElementById('set-cur-pass');
    if (el) el.focus();
  }, 100);
  populateSettingsLabels();
}

function closeSettings() {
  document.body.classList.remove('modal-open');
  document.getElementById('settings-modal').style.display = 'none';
}

function prefillTeam() {
  // No-op: renderTeamAccountsList handles this now
  renderTeamAccountsList();
  cancelTeamForm();
}

function buildAccessCheckboxes() {
  var allowed = getTabAccess();
  var wrap = document.getElementById('tab-access-checkboxes');
  wrap.innerHTML = ALL_TABS.map(function(t) {
    var chk = (allowed.indexOf(t.id) !== -1) ? 'checked' : '';
    var locked = t.locked ? 'locked' : '';
    var disabled = t.locked ? 'disabled' : '';
    return '<label class="tab-chk-item ' + (chk?'checked':'') + ' ' + locked + '" ' +
      'onclick="' + (t.locked ? '' : 'toggleTabChk(this)') + '">' +
      '<input type="checkbox" id="chk-'+t.id+'" value="'+t.id+'" '+chk+' '+disabled+'>' +
      '<span class="chk-lbl">'+t.label+'</span>' +
      (t.locked ? '<span style="font-size:10px;color:#6b7a8d;margin-left:auto">Always on</span>' : '') +
    '</label>';
  }).join('');
}

function toggleTabChk(el) {
  var chk = el.querySelector('input');
  chk.checked = !chk.checked;
  el.classList.toggle('checked', chk.checked);
}

// ── Save Admin Account ────────────────────────────────
function saveAdminSettings() {
  var curPass    = document.getElementById('set-cur-pass').value.trim();
  var newUser    = document.getElementById('set-new-user').value.trim();
  var newPass    = document.getElementById('set-new-pass').value;
  var confirmPass= document.getElementById('set-confirm-pass').value;
  var msg        = document.getElementById('settings-msg');
  msg.className  = 'settings-msg'; msg.textContent = '';
  var creds = getCredentials();
  if (!curPass) { msg.className='settings-msg err'; msg.textContent='⚠️ Enter your current password.'; return; }
  if (curPass !== creds.pass) { msg.className='settings-msg err'; msg.textContent='❌ Current password is incorrect.'; return; }
  if (!newUser && !newPass) { msg.className='settings-msg err'; msg.textContent='⚠️ Enter a new username or password.'; return; }
  if (newPass) {
    if (newPass.length < 4) { msg.className='settings-msg err'; msg.textContent='⚠️ Password must be at least 4 characters.'; return; }
    if (newPass !== confirmPass) { msg.className='settings-msg err'; msg.textContent='❌ Passwords do not match.'; return; }
  }
  var finalUser = newUser || creds.user;
  var finalPass = newPass || creds.pass;
  var newCreds = {user: finalUser, pass: finalPass};
  _STORE.setItem(CREDS_KEY, JSON.stringify(newCreds));
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/credentials', newCreds);
  document.getElementById('tn-name').textContent = finalUser;
  var nd = document.getElementById('tn-name-display'); if(nd) nd.textContent = finalUser;
  _SESSION.setItem('ph_user', finalUser);
  msg.className = 'settings-msg ok';
  msg.textContent = '✅ Admin account updated! Username: ' + finalUser;
  setTimeout(function(){ closeSettings(); }, 1800);
}

// ── Save Team Account ─────────────────────────────────
// ── Multi-account team management ────────────────────────────
var _editingTeamId = null; // null = new, string = editing existing

function saveAllTeamAccounts(accounts) {
  _STORE.setItem('pearl_team_accounts', JSON.stringify(accounts));
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/team_accounts', accounts);
}

function openAddTeamMember() {
  _editingTeamId = null;
  document.getElementById('team-form-title').textContent = '➕ New Team Account';
  document.getElementById('set-team-user').value = '';
  document.getElementById('set-team-pass').value = '';
  document.getElementById('set-team-confirm').value = '';
  document.getElementById('team-save-btn').textContent = '💾 Save Account';
  buildTeamFormTabs(null);
  document.getElementById('team-add-form').style.display = '';
  document.getElementById('team-msg').textContent = '';
  document.getElementById('team-msg').className = 'settings-msg';
  document.getElementById('set-team-user').focus();
}

function openEditTeamMember(id) {
  var all = getAllTeamAccounts();
  var acc = all.find(function(a){ return a.id === id; });
  if (!acc) return;
  _editingTeamId = id;
  document.getElementById('team-form-title').textContent = '✏️ Edit: ' + acc.user;
  document.getElementById('set-team-user').value = acc.user;
  document.getElementById('set-team-pass').value = '';
  document.getElementById('set-team-confirm').value = '';
  document.getElementById('team-save-btn').textContent = '💾 Update Account';
  buildTeamFormTabs(acc.tabs || []);
  document.getElementById('team-add-form').style.display = '';
  document.getElementById('team-msg').textContent = '';
  document.getElementById('team-msg').className = 'settings-msg';
}

function updateTabChkStyle(chk) {
  var lb = chk.closest('label');
  if (!lb) return;
  lb.style.background = chk.checked ? '#eff6ff' : '#f8fafc';
  lb.style.borderColor = chk.checked ? '#bfdbfe' : '#e2e8f0';
}
function cancelTeamForm() {
  document.getElementById('team-add-form').style.display = 'none';
  _editingTeamId = null;
}

function buildTeamFormTabs(selectedTabs) {
  var wrap = document.getElementById('team-form-tabs');
  if (!wrap) return;
  var defaults = selectedTabs === null ? ALL_TABS.map(function(t){ return t.id; }) : (selectedTabs.length === 0 ? ['dashboard','entry'] : selectedTabs);
  var html = '';
  ALL_TABS.forEach(function(t) {
    var locked = (t.id === 'dashboard' || t.id === 'entry');
    var checked = defaults.indexOf(t.id) !== -1 || locked;
    html += '<label style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:' + (checked ? '#eff6ff' : '#f8fafc') + ';border:1.5px solid ' + (checked ? '#bfdbfe' : '#e2e8f0') + ';border-radius:8px;cursor:' + (locked ? 'default' : 'pointer') + ';font-size:13px;font-weight:600;color:#1a2332">';
    html += '<input type="checkbox" id="tf-chk-' + t.id + '" ' + (checked ? 'checked' : '') + ' ' + (locked ? 'disabled' : '') + ' onchange="updateTabChkStyle(this)">';
    html += t.icon + ' ' + t.label + (locked ? ' <span style="font-size:10px;color:#94a3b8">(always)</span>' : '') + '</label>';
  });
  wrap.innerHTML = html;
}

function saveTeamMember() {
  var adminPass = document.getElementById('set-team-adminpass').value.trim();
  var userName  = document.getElementById('set-team-user').value.trim();
  var pass      = document.getElementById('set-team-pass').value;
  var conf      = document.getElementById('set-team-confirm').value;
  var msg       = document.getElementById('team-msg');
  msg.className = 'settings-msg'; msg.textContent = '';
  var creds = getCredentials();

  if (!adminPass) { msg.className='settings-msg err'; msg.textContent='⚠️ Enter your admin password first.'; return; }
  if (adminPass !== creds.pass) { msg.className='settings-msg err'; msg.textContent='❌ Admin password is incorrect.'; return; }
  if (!userName) { msg.className='settings-msg err'; msg.textContent='⚠️ Enter a username.'; return; }
  if (userName === creds.user) { msg.className='settings-msg err'; msg.textContent='❌ Cannot use admin username.'; return; }

  var all = getAllTeamAccounts();

  // Check duplicate username (excluding current edit)
  var dup = all.find(function(a){ return a.user === userName && a.id !== _editingTeamId; });
  if (dup) { msg.className='settings-msg err'; msg.textContent='❌ Username already exists.'; return; }

  var finalPass = pass;
  if (_editingTeamId && !pass) {
    // Keep existing password if editing and left blank
    var existing = all.find(function(a){ return a.id === _editingTeamId; });
    finalPass = existing ? existing.pass : '';
  }
  if (!finalPass) { msg.className='settings-msg err'; msg.textContent='⚠️ Enter a password.'; return; }
  if (finalPass.length < 4) { msg.className='settings-msg err'; msg.textContent='⚠️ Password must be at least 4 characters.'; return; }
  if (pass && pass !== conf) { msg.className='settings-msg err'; msg.textContent='❌ Passwords do not match.'; return; }

  // Collect tab permissions
  var tabs = [];
  ALL_TABS.forEach(function(t) {
    var chk = document.getElementById('tf-chk-' + t.id);
    if (chk && chk.checked) tabs.push(t.id);
  });
  if (tabs.indexOf('dashboard') === -1) tabs.unshift('dashboard');
  if (tabs.indexOf('entry') === -1) tabs.splice(1, 0, 'entry');

  if (_editingTeamId) {
    // Update existing
    all = all.map(function(a){ return a.id === _editingTeamId ? {id:a.id, user:userName, pass:finalPass, tabs:tabs} : a; });
    msg.textContent = '✅ Updated: ' + userName;
  } else {
    // Add new
    var newId = 't' + Date.now();
    all.push({id:newId, user:userName, pass:finalPass, tabs:tabs});
    msg.textContent = '✅ Added: ' + userName;
  }
  msg.className = 'settings-msg ok';
  saveAllTeamAccounts(all);
  cancelTeamForm();
  renderTeamAccountsList();
}

function deleteTeamMember(id) {
  var all = getAllTeamAccounts();
  var acc = all.find(function(a){ return a.id === id; });
  if (!acc) return;
  if (!confirm('Remove "' + acc.user + '" account? They will no longer be able to log in.')) return;
  var adminPass = document.getElementById('set-team-adminpass').value.trim();
  var creds = getCredentials();
  if (!adminPass || adminPass !== creds.pass) {
    var lm = document.getElementById('team-list-msg');
    lm.className = 'settings-msg err'; lm.textContent = '❌ Enter admin password first.';
    return;
  }
  all = all.filter(function(a){ return a.id !== id; });
  saveAllTeamAccounts(all);
  renderTeamAccountsList();
  var lm = document.getElementById('team-list-msg');
  lm.className = 'settings-msg ok'; lm.textContent = '✅ "' + acc.user + '" removed.';
  showToast('🗑 ' + acc.user + ' removed');
}

function renderTeamAccountsList() {
  var wrap = document.getElementById('team-accounts-list');
  if (!wrap) return;
  var all = getAllTeamAccounts();
  if (all.length === 0) {
    wrap.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px;background:#f8fafc;border-radius:10px;border:1.5px dashed #e2e8f0">No team accounts yet. Click ➕ Add Account to create one.</div>';
    return;
  }
  wrap.innerHTML = all.map(function(acc) {
    var tabCount = (acc.tabs || []).length;
    return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:11px;padding:14px 16px;display:flex;align-items:center;gap:12px">' +
      '<div style="width:38px;height:38px;min-width:38px;background:#eff6ff;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px">👤</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:14px;font-weight:700;color:#1a2332">' + acc.user + '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:2px">' + tabCount + ' tab' + (tabCount !== 1 ? 's' : '') + ' · Password: ' + '•'.repeat(Math.min(acc.pass.length, 8)) + '</div>' +
      '</div>' +
      '<button onclick="openEditTeamMember(\'' + acc.id + '\')" style="padding:7px 13px;background:#f0f9ff;color:#0369a1;border:1.5px solid #bae6fd;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">✏️ Edit</button>' +
      '<button onclick="deleteTeamMember(\'' + acc.id + '\')" style="padding:7px 13px;background:#fff5f5;color:#dc2626;border:1.5px solid #fecaca;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🗑</button>' +
    '</div>';
  }).join('');
}

// Legacy stub — no longer used but kept to avoid errors
function saveTeamSettings() { saveTeamMember(); }
function removeTeamAccount() {
  if (!confirm('Remove ALL team accounts?')) return;
  saveAllTeamAccounts([]);
  renderTeamAccountsList();
  showToast('🗑 All team accounts removed');
}

// ── Save Tab Access ───────────────────────────────────
function saveAccessSettings() {
  var adminPass = document.getElementById('set-access-adminpass').value.trim();
  var msg       = document.getElementById('access-msg');
  msg.className = 'settings-msg'; msg.textContent = '';
  var creds = getCredentials();
  if (!adminPass) { msg.className='settings-msg err'; msg.textContent='⚠️ Enter your admin password.'; return; }
  if (adminPass !== creds.pass) { msg.className='settings-msg err'; msg.textContent='❌ Admin password is incorrect.'; return; }
  var allowed = [];
  ALL_TABS.forEach(function(t) {
    var chk = document.getElementById('chk-'+t.id);
    if (chk && chk.checked) allowed.push(t.id);
  });
  _STORE.setItem(ACCESS_KEY, JSON.stringify(allowed));
  if (window._fbSaveKey) window._fbSaveKey('pearl/settings/tabaccess', allowed);
  msg.className = 'settings-msg ok';
  msg.textContent = '✅ Tab access saved! Team can see: ' + allowed.join(', ');
  // Re-apply tab visibility immediately for current session if team
  var role = _SESSION.getItem('ph_role') || 'admin';
  if (role !== 'admin') {
    var navTabs = document.querySelectorAll('.tn-tab');
    var tabIds  = ['dashboard','entry','monthly','report','finance','prices','analytics','forecast','planning','guide'];
    navTabs.forEach(function(btn, i) {
      var tid = tabIds[i]; if (!tid) return;
      btn.style.display = (allowed.indexOf(tid) !== -1) ? '' : 'none';
    });
  }
  setTimeout(function(){ closeSettings(); }, 2000);
}

function doLogin() {
  const u = document.getElementById('l-user').value.trim();
  const p = document.getElementById('l-pass').value.trim();
  const e = document.getElementById('l-err');
  function showErr(msg) {
    e.innerHTML = '&#x26A0;&#xFE0F; ' + msg;
    e.classList.add('show');
    var pf = document.getElementById('l-pass');
    pf.style.borderColor = '#dc3545';
    setTimeout(function(){ pf.style.borderColor = ''; }, 1500);
  }
  if (!u || !p) { showErr('Please enter both username and password.'); return; }

  // Show loading state
  var btn = document.querySelector('.lbtn');
  if (btn) { btn.textContent = '⏳ Checking...'; btn.disabled = true; }
  function resetBtn() { if (btn) { btn.innerHTML = '▶ &nbsp;ENTER SYSTEM'; btn.disabled = false; } }

  function tryLogin(retried) {
    var _creds = getCredentials();
    var _team  = getTeamCredentials();
    // Admin login — RS@2026 always works as master fallback
    var isAdmin = (u === _creds.user) && (p === _creds.pass);
    if (isAdmin) {
      resetBtn();
      e.classList.remove('show'); e.innerHTML = '';
      _SESSION.setItem('ph_user', u);
      _SESSION.setItem('ph_role', 'admin');
      bootApp(u);
    // Team login — check ALL team accounts
    } else {
      var allTeam = getAllTeamAccounts();
      var matchedTeam = null;
      for (var ti = 0; ti < allTeam.length; ti++) {
        if (allTeam[ti].user === u && allTeam[ti].pass === p) { matchedTeam = allTeam[ti]; break; }
      }
      if (matchedTeam) {
        resetBtn();
        e.classList.remove('show'); e.innerHTML = '';
        _SESSION.setItem('ph_user', u);
        _SESSION.setItem('ph_role', 'team');
        _SESSION.setItem('ph_team_id', matchedTeam.id || 't1');
        bootApp(u);
        return;
      }
    }
    if (!retried && window._fbLoadKey) {
      // Fetch latest credentials from Firebase with 4s timeout
      var done = 0; var timedOut = false;
      var timer = setTimeout(function() { timedOut = true; tryLogin(true); }, 4000);
      function check() {
        if (timedOut) return;
        if (++done === 2) { clearTimeout(timer); tryLogin(true); }
      }
      window._fbLoadKey('pearl/settings/credentials').then(function(v) {
        if (v && v.user && v.pass) { try { _STORE.setItem(CREDS_KEY, JSON.stringify({user:v.user,pass:v.pass})); } catch(ex) {} }
        check();
      }).catch(check);
      window._fbLoadKey('pearl/settings/team').then(function(v) {
        if (v && v.user && v.pass) { try { _STORE.setItem(TEAM_KEY, JSON.stringify({user:v.user,pass:v.pass})); } catch(ex) {} }
        check();
      }).catch(check);
    } else {
      resetBtn();
      showErr('Wrong username or password. Please try again.');
      document.getElementById('l-pass').select();
    }
  }
  tryLogin(false);
}

function showForgotForm() {
  var form = document.getElementById('l-forgot-form');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function doEmergencyReset() {
  var masterInp = document.getElementById('l-master-inp');
  var newPassInp = document.getElementById('l-newpass-inp');
  var msgEl = document.getElementById('l-reset-msg');
  var master = (masterInp?.value || '').trim().toUpperCase();
  var newPass = (newPassInp?.value || '').trim();

  if (master !== _MASTER_KEY) {
    msgEl.style.color = '#fca5a5';
    msgEl.textContent = '❌ Invalid master key.';
    msgEl.style.display = 'block';
    return;
  }
  if (!newPass || newPass.length < 4) {
    msgEl.style.color = '#fca5a5';
    msgEl.textContent = '⚠️ New password must be at least 4 characters.';
    msgEl.style.display = 'block';
    return;
  }

  // Keep same username, reset password
  var current = getCredentials();
  var newCreds = { user: current.user || 'Reda Salah', pass: newPass };

  // Save locally
  try { _STORE.setItem('pearl_credentials', JSON.stringify(newCreds)); } catch(e) {}

  // Save to Firebase
  if (window._fbSaveKey) {
    window._fbSaveKey('pearl/settings/credentials', newCreds).then(function() {
      msgEl.style.color = '#86efac';
      msgEl.textContent = '✅ Password reset! Logging you in...';
      msgEl.style.display = 'block';
      setTimeout(function() {
        document.getElementById('l-pass').value = newPass;
        document.getElementById('l-user').value = newCreds.user;
        document.getElementById('l-forgot-form').style.display = 'none';
        doLogin();
      }, 1200);
    }).catch(function(e) {
      // Saved locally at least
      msgEl.style.color = '#86efac';
      msgEl.textContent = '✅ Password reset locally. Login now.';
      msgEl.style.display = 'block';
    });
  } else {
    msgEl.style.color = '#fca5a5';
    msgEl.textContent = '⚠️ Firebase not ready. Try again in a moment.';
    msgEl.style.display = 'block';
  }
}

function doLogout() {
  if (window._unregisterPresence) window._unregisterPresence();
  _SESSION.removeItem('ph_user');
  _SESSION.removeItem('ph_role');
  document.getElementById('pg-app').style.display = 'none';
  document.getElementById('pg-login').style.display = 'flex';
  document.getElementById('l-pass').value = '';
}

// ── Online presence UI ────────────────────────────────────────
function updateOnlineUI(users) {
  var role = _SESSION.getItem('ph_role') || 'admin';
  var indicator = document.getElementById('online-indicator');
  if (!indicator) return;
  // Only admin sees the indicator
  if (role !== 'admin') { indicator.style.display = 'none'; return; }
  if (!users || users.length === 0) { indicator.style.display = 'none'; return; }

  indicator.style.display = 'flex';
  var count = users.length;
  document.getElementById('online-label').textContent = count + ' online';

  // Build user list in popup
  var now = Date.now();
  var html = users.map(function(u) {
    var ago = Math.floor((now - u.ts) / 1000);
    var timeStr = ago < 10 ? 'just now' : ago < 60 ? ago + 's ago' : Math.floor(ago/60) + 'm ago';
    var dotClass = ago < 35 ? 'online-user-dot' : 'online-user-dot away';
    return '<div class="online-user-row">' +
      '<div class="' + dotClass + '"></div>' +
      '<span class="online-user-name">' + u.name + '</span>' +
      '<span class="online-user-time">' + timeStr + '</span>' +
    '</div>';
  }).join('');
  document.getElementById('online-users-list').innerHTML = html;
}

function toggleOnlinePopup(e) {
  // Position popup below the indicator using fixed coords
  var indicator = document.getElementById('online-indicator');
  var popup = document.getElementById('online-popup');
  if (indicator && popup) {
    var rect = indicator.getBoundingClientRect();
    popup.style.top  = (rect.bottom + 6) + 'px';
    popup.style.right = (window.innerWidth - rect.right) + 'px';
  }
  e.stopPropagation();
  var popup = document.getElementById('online-popup');
  popup.classList.toggle('show');
}

// Close popup when clicking outside
document.addEventListener('click', function() {
  var popup = document.getElementById('online-popup');
  if (popup) popup.classList.remove('show');
});

// ── Show/Hide password toggle ─────────────────────────────────
function togglePw(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
    btn.classList.add('visible');
  } else {
    inp.type = 'password';
    btn.textContent = '👁';
    btn.classList.remove('visible');
  }
}

// ── Caps Lock detection ────────────────────────────────────────
function chkCaps(event, warningId) {
  var warn = document.getElementById(warningId);
  if (!warn) return;
  if (event.getModifierState && event.getModifierState('CapsLock')) {
    warn.classList.remove('hidden');
  } else {
    warn.classList.add('hidden');
  }
}

// Check caps on focus — detects immediately when user clicks the field
function chkCapsOnFocus(event, warningId) {
  // getModifierState works on focus events in modern browsers
  var warn = document.getElementById(warningId);
  if (!warn) return;
  if (event.getModifierState && event.getModifierState('CapsLock')) {
    warn.classList.remove('hidden');
  }
  // Don't hide on focus — only hide when we know caps is off (keyup)
}

// ── About / Copyright popup ───────────────────────────────────
function showAbout() {
  var year = new Date().getFullYear();
  var html = '<div id="about-overlay" onclick="closeAbout()" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:3000;display:flex;align-items:center;justify-content:center">' +
    '<div onclick="event.stopPropagation()" style="background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.25);width:420px;max-width:92vw;overflow:hidden">' +
      '<div style="background:var(--navy);padding:28px 32px 22px;text-align:center">' +
        '<div style="font-size:38px;margin-bottom:8px">🅡🅢</div>' +
        '<div style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#fff;letter-spacing:.5px">RS LaundryPro</div>' +
        '<div style="font-size:11px;color:var(--gold);letter-spacing:2.5px;text-transform:uppercase;margin-top:5px">Management Platform</div>' +
      '</div>' +
      '<div style="padding:26px 32px 30px;text-align:center">' +
        '<div style="display:inline-block;background:#f0f4f8;border-radius:10px;padding:14px 28px;margin-bottom:18px">' +
          '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">System Version</div>' +
          '<div style="font-size:22px;font-weight:800;color:var(--navy);font-family:Georgia,serif">v1.0</div>' +
        '</div>' +
        '<div style="height:1px;background:#e2e8f0;margin-bottom:18px"></div>' +
        '<div style="font-size:13px;color:#64748b;line-height:1.9">' +
          '<div style="margin-bottom:6px"><strong style="color:var(--navy)">Owner & Developer</strong></div>' +
          '<div style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:14px">Reda Salah</div>' +
          '<div style="font-size:12px;color:#94a3b8;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;background:#f8fafc">' +
            '© ' + year + ' Reda Salah. All rights reserved.<br>' +
            'Unauthorised reproduction or distribution<br>of this system is strictly prohibited.' +
          '</div>' +
        '</div>' +
        '<button onclick="closeAbout()" style="margin-top:20px;padding:10px 32px;background:var(--navy);color:var(--gold);border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.5px" onmouseover="this.style.background=\'var(--navy2)\'" onmouseout="this.style.background=\'var(--navy)\'">Close</button>' +
      '</div>' +
    '</div>' +
  '</div>';
  var el = document.createElement('div');
  el.id = 'about-modal-wrap';
  el.innerHTML = html;
  document.body.appendChild(el);
}
function closeAbout() {
  var el = document.getElementById('about-modal-wrap');
  if (el) el.remove();
}
// Caps Lock detection — only on password field
document.addEventListener('DOMContentLoaded', function() {
  var passField = document.getElementById('l-pass');
  if (!passField) return;
  function checkCaps(e) {
    var capsDiv = document.getElementById('caps-warn');
    if (!capsDiv) return;
    if (typeof e.getModifierState === 'function') {
      capsDiv.style.display = e.getModifierState('CapsLock') ? 'block' : 'none';
    }
  }
  passField.addEventListener('keyup', checkCaps);
  passField.addEventListener('keydown', checkCaps);
  passField.addEventListener('focus', checkCaps);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const lg = document.getElementById('pg-login');
    // Use getComputedStyle — works on initial load before any inline style is set
    if (getComputedStyle(lg).display !== 'none') { doLogin(); return; }
    if (document.activeElement?.classList?.contains('qi')) {
      e.preventDefault();
      const all = Array.from(document.querySelectorAll('.qi'));
      const idx = all.indexOf(document.activeElement);
      if (idx < all.length - 1) all[idx + 1].focus();
    }
  }
});

// ════════════════════════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════════════════════════
let curTab = 'dashboard', entDept = DEPT_KEYS[0], priceDept = DEPT_KEYS[0];

function bootApp(user) {
  // Sync settings from Firebase first, then boot
  syncSettingsFromFirebase(function() { _bootApp(user); });
}
// ── Background pre-computation ────────────────────────────────
// Pre-compute all months so Forecast/Analytics are instant
var _precomputeTimer = null;

function precomputeAllMonths() {
  // Pre-compute ALL months for both years in background
  var months = [];
  for (var m = 1; m <= 12; m++) {
    months.push({ y: CY, m: m });
    months.push({ y: CY-1, m: m });
  }
  var idx = 0;
  function computeNext() {
    if (idx >= months.length) return;
    var item = months[idx++];
    var ck = item.y + '_' + item.m;
    // Compute monthTotals (caches automatically)
    if (!_monthTotalsCache[ck]) monthTotals(item.y, item.m);
    // Compute dayTotals for ALL months (not just current) for getActiveDays
    var nd = dim(item.y, item.m);
    for (var d = 1; d <= nd; d++) {
      var dk = item.y+'_'+item.m+'_'+d;
      if (!_dayTotalsCache[dk]) dayTotals(item.y, item.m, d);
    }
    // Compute getActiveDays (caches automatically)
    if (_activeDaysCache[ck] === undefined) getActiveDays(item.y, item.m);
    setTimeout(computeNext, 15); // 15ms yield between months
  }
  computeNext();
}

function schedulePrecompute() {
  if (_precomputeTimer) clearTimeout(_precomputeTimer);
  // Run after 3s on login, then every 5 min
  _precomputeTimer = setTimeout(function() {
    precomputeAllMonths();
    setInterval(function() {
      invalidateMonthTotalsCache();
      invalidateDayTotalsCache();
      precomputeAllMonths();
    }, 300000); // refresh every 5 minutes
  }, 3000);
}


function _bootApp(user) {
  document.getElementById('pg-login').style.display = 'none';
  document.getElementById('pg-app').style.display = 'flex';
  if (window._stopLoginCanvas) window._stopLoginCanvas();
  document.getElementById('tn-name').textContent = user;
  // Apply hotel name + total rooms NOW that DOM is visible
  // Read from localStorage directly (fastest, no Firebase needed)
  try {
    var _hs = JSON.parse(_STORE.getItem('pearl_hotel_settings') || '{}');
    if (_hs.name && typeof applyHotelNameToUI === 'function') {
      applyHotelNameToUI(_hs.name);
    }
    if (_hs.rooms && _hs.rooms > 0) {
      _TOTAL_ROOMS = _hs.rooms;
    }
  } catch(e) {}
  // Also check benchmark settings for rooms (most recently saved source wins)
  try {
    var _bs = JSON.parse(_STORE.getItem('pearl_bench_settings') || '{}');
    if (_bs.totalRooms && _bs.totalRooms > 0) {
      _TOTAL_ROOMS = _bs.totalRooms;
    }
  } catch(e) {}
  // Update benchmark rooms field if visible
  setTimeout(function() {
    var btr = document.getElementById('bench-total-rooms');
    if (btr && !btr.value) btr.value = _TOTAL_ROOMS;
  }, 500);
  var nd2 = document.getElementById('tn-name-display'); if(nd2) nd2.textContent = user;
  var role = _SESSION.getItem('ph_role') || 'admin';
  // Register presence in Firebase
  if (window._registerPresence) window._registerPresence(user);
  // Admin watches who is online
  if (role === 'admin' && window._watchPresence) window._watchPresence();
  // Show/hide nav tabs based on role
  // Per-account tab access: use the logged-in team account's own tabs
  var allowed;
  if (role === 'admin') {
    allowed = ALL_TABS.map(function(t){ return t.id; });
  } else {
    var teamId = _SESSION.getItem('ph_team_id');
    var allAccounts = getAllTeamAccounts();
    var myAccount = allAccounts.find(function(a){ return a.id === teamId; });
    if (myAccount && myAccount.tabs && myAccount.tabs.length > 0) {
      allowed = myAccount.tabs;
    } else {
      allowed = getTabAccess(); // fallback to global tab access
    }
  }
  var navTabs = document.querySelectorAll('.tn-tab');
  var tabIds  = ['dashboard','entry','monthly','report','finance','prices','analytics','forecast','planning','guide'];
  navTabs.forEach(function(btn, i) {
    var tid = tabIds[i];
    if (!tid) return;
    btn.style.display = (allowed.indexOf(tid) !== -1) ? '' : 'none';
  });
  // Hide settings button for team
  var settBtn = document.querySelector('.tn-settings');
  if (settBtn) settBtn.style.display = (role === 'admin') ? '' : 'none';
  // Show first allowed tab
  var firstTab = allowed[0] || 'dashboard';
  buildYearSel(); buildSelectors();
  // Ensure _TOTAL_ROOMS is loaded before rendering
  try {
    var _bsCheck = JSON.parse(localStorage.getItem('pearl_bench_settings') || '{}');
    var _hsCheck = JSON.parse(localStorage.getItem('pearl_hotel_settings') || '{}');
    var _savedRooms = _bsCheck.totalRooms || _hsCheck.rooms || 0;
    if (_savedRooms > 0) _TOTAL_ROOMS = _savedRooms;
  } catch(e) {}
  showTab(firstTab);
  schedulePrecompute(); // pre-compute all months in background
  // Re-render dashboard after short delay — Firebase data may not be ready yet on first render
  setTimeout(function() {
    var _m = parseInt(document.getElementById('dash-month')?.value || new Date().getMonth()+1);
    invalidateMonthTotalsCache(CY, _m);
    if (typeof renderDash === 'function') renderDash();
  }, 1500);
  // Sync targets staggered — don't fire 12 Firebase calls simultaneously
  (function() {
    var _tm = 1;
    function loadNextTarget() {
      if (_tm > 12) return;
      loadTargetFB(CY, _tm);
      _tm++;
      setTimeout(loadNextTarget, 120); // 120ms apart = spread over ~1.4s
    }
    setTimeout(loadNextTarget, 1500); // start after 1.5s delay
  })();
  // Now show error badge if any errors were caught during boot
  setTimeout(_updateErrBadge, 500);
  // Missing dept morning check (runs 4s after login so data is loaded)
  setTimeout(runMissingDeptCheck, 4000);
  // Schedule 8pm daily check
  scheduleMissingDeptCheck();
  // New month lock reminder (runs 6s after login — days 1-7 of each month only)
  setTimeout(checkNewMonthLockReminder, 6000);
  // FX rate update reminder (runs 8s after login)
  setTimeout(checkFxRateReminder, 8000);
  // End-of-month checklist reminder (runs 10s after login)
  setTimeout(checkEomReminder, 10000);
  // Silent startup validation — runs 3s after boot, never blocks UI
  setTimeout(function() {
    if (typeof runStartupValidation === 'function') runStartupValidation();
  }, 3000);
  // Init mobile layout if on phone — wait for Firebase data
  // Show status bar for desktop
  if (!isMobile()) {
  }

  if (isMobile()) {
    // Show loading screen immediately
    var desk3 = document.getElementById('pg-app');
    var mob3 = document.getElementById('mob-app');
    if (desk3 && mob3) {
      desk3.style.display = 'none';
      mob3.style.display = 'flex';
      mob3.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d1b2e;gap:16px">' +
        '<div style="width:60px;height:60px;background:#c9a84c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#0d1b2e">RS</div>' +
        '<div style="font-size:18px;font-weight:800;color:#fff">RS LaundryPro</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,.5)">Loading your data...</div>' +
        '<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:4px;overflow:hidden;margin-top:8px">' +
          '<div id="mob-load-bar" style="height:100%;width:0%;background:#c9a84c;border-radius:4px;transition:width 2s ease"></div>' +
        '</div>' +
      '</div>';
      setTimeout(function(){ var b=document.getElementById('mob-load-bar'); if(b) b.style.width='80%'; }, 100);
    }
    // Wait for Firebase then init
    setTimeout(function() {
      try {
        // Restore mob-app content by re-running init
        var mob4 = document.getElementById('mob-app');
        if (mob4) mob4.innerHTML = _MOB_APP_HTML;
        initMobileApp();
      } catch(e) {
        console.error('Mobile init failed:', e);
        // Fallback to desktop
        var d=document.getElementById('pg-app'); if(d) d.style.display='flex';
        var m=document.getElementById('mob-app'); if(m) m.style.display='none';
      }
    }, 1500);
  }
}

function buildYearSel() {
  const el = document.getElementById('year-sel'); el.innerHTML = '';
  for (let y = 2025; y <= 2035; y++) {
    const o = document.createElement('option');
    o.value = y; o.textContent = y; if (y === CY) o.selected = true; el.appendChild(o);
  }
}

function changeYear(y) {
  CY = parseInt(y);
  _DB[CY] = null; // clear cache so it reloads from Firebase/localStorage
  PRICES = loadPR(CY);
  // On login: sync critical data from Firebase that localStorage-only functions miss
  (function() {
    var today = new Date();
    var cm = today.getMonth() + 1;
    var pm = cm === 1 ? 12 : cm - 1;
    var py = cm === 1 ? CY - 1 : CY;
    // Pre-load and verify prices from Firebase (prevents old prices showing)
    if (typeof preloadCurrentMonthPrices === 'function') {
      setTimeout(preloadCurrentMonthPrices, 4000);
  loadPLImportFromFB(2025); // load imported P&L data from Firebase // delay so UI loads first
    }
  })();
  buildSelectors();
  refreshTab();
  // Re-attach Firebase real-time listener for new year
  _fbListenerYear = null;
  attachFbListener(CY);
}

// ── Auto-push all local data to Firebase if Firebase is empty ──
function pushLocalDataToFirebase() {
  if (!window._fbSaveKey || !window._fbLoadKey) return;
  // Check each year 2025-2035
  for (var y = 2025; y <= 2035; y++) {
    (function(yr) {
      var localData = null;
      try { localData = JSON.parse(_STORE.getItem(lsKey(yr)) || 'null'); } catch(e) {}
      if (!localData || Object.keys(localData).length === 0) return;
      // Only push if Firebase doesn't have this year's data
      window._fbLoadKey(fbDataPath(yr)).then(function(fbData) {
        if (!fbData || Object.keys(fbData).length === 0) {
          window._fbSaveKey(fbDataPath(yr), localData);
          console.log('Pushed year ' + yr + ' data to Firebase (' + Object.keys(localData).length + ' keys)');
        }
      });
      // Push prices too
      var localPrices = null;
      try { localPrices = JSON.parse(_STORE.getItem(prKey(yr)) || 'null'); } catch(e) {}
      if (localPrices) {
        window._fbLoadKey(fbPricePath(yr)).then(function(fbPrices) {
          if (!fbPrices) window._fbSaveKey(fbPricePath(yr), localPrices);
        });
      }
    })(y);
  }
  // Push settings too
  ['credentials','team','tabaccess'].forEach(function(key) {
    var storeKey = key === 'credentials' ? 'pearl_credentials' : key === 'team' ? 'pearl_team_credentials' : 'pearl_tab_access';
    var local = null;
    try { local = JSON.parse(_STORE.getItem(storeKey) || 'null'); } catch(e) {}
    if (local) {
      window._fbLoadKey('pearl/settings/' + key).then(function(fb) {
        if (!fb) window._fbSaveKey('pearl/settings/' + key, local);
      });
    }
  });
}

function buildSelectors() {
  const now = new Date(); const cm = now.getMonth() + 1;
  // Build year selector for report
  var repYrEl = document.getElementById('rep-year');
  if (repYrEl) {
    repYrEl.innerHTML = [2025,2026,2027,2028,2029,2030].map(function(y){ return '<option value="'+y+'"'+(y===CY?' selected':'')+'>'+y+'</option>'; }).join('');
  }
  // For 2025: only show December. For all other years: show all 12 months.
  ['dash-month', 'ent-month', 'mon-month', 'rep-month', 'fin-month', 'ana-month'].forEach(function(id) {
    var el = document.getElementById(id); if (!el) return;
    el.innerHTML = CY === 2025
      ? '<option value="12">December 2025 (Dec 31 carry-in)</option>'
      : MONTH_NAMES.map(function(mn, i){ return '<option value="'+(i+1)+'"'+(i+1===cm?' selected':'')+'>'+mn+' '+CY+'</option>'; }).join('');
  });
  buildDaySel(CY === 2025 ? 12 : cm);
  const ds = document.getElementById('ent-dept');
  if (ds) ds.innerHTML = DEPT_KEYS.map(function(d){ return '<option value="'+d+'"'+(d===entDept?' selected':'')+'>'+DEPT_ICONS[d]+' '+d+'</option>'; }).join('');
  const ms = document.getElementById('mon-dept');
  if (ms) ms.innerHTML = '<option value="ALL">All Departments</option>' + DEPT_KEYS.map(function(d){ return '<option value="'+d+'">'+DEPT_ICONS[d]+' '+d+'</option>'; }).join('');
  buildTabs('dept-tabs', function(d){ entDept = d; document.getElementById('ent-dept').value = d; renderEntryTable(); }, entDept);
}

function buildDaySel(m) {
  const el = document.getElementById('ent-day'); if (!el) return;
  const nd = dim(CY, m); const today = new Date();
  const cd = (today.getMonth() + 1 === m && today.getFullYear() === CY) ? today.getDate() : 1;
  el.innerHTML = Array.from({length: nd}, (_, i) => {
    const d = i + 1; const dn = DAY_SHORT[new Date(CY, m-1, d).getDay()];
    return `<option value="${d}"${d===cd?' selected':''}>${d} — ${dn}</option>`;
  }).join('');
}

function buildTabs(cid, fn, active) {
  const el = document.getElementById(cid); if (!el) return;
  el.innerHTML = DEPT_KEYS.map(d => `<div class="dtab${d===active?' on':''}" onclick="selectTab('${cid}','${d}',this)">${DEPT_ICONS[d]} ${d}</div>`).join('');
  el._fn = fn;
}
function selectTab(cid, d, el) {
  document.getElementById(cid).querySelectorAll('.dtab').forEach(t => t.classList.remove('on'));
  el.classList.add('on'); document.getElementById(cid)._fn(d);
}

// ════════════════════════════════════════════════════════════════
//  NAV
// ════════════════════════════════════════════════════════════════
function showTab(name) {
  // Team role: enforce tab access permissions
  var role = _SESSION.getItem('ph_role') || 'admin';
  if (role !== 'admin') {
    var allowed = getTabAccess();
    if (allowed.indexOf(name) === -1) { toast('🔒 You do not have access to this tab.', 'err'); return; }
  }
  curTab = name;
  // Highlight nav tab by ID — works regardless of tab order
  document.querySelectorAll('.tn-tab').forEach(function(t) {
    var tabId = t.id.replace('nav-', '');
    t.classList.toggle('on', tabId === name);
  });
  updateMoreBtnState(name);
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('tab-' + name)?.classList.add('on');
  window.scrollTo(0, 0);
  // Sync mobile bottom nav
  var mobTabs = ['dashboard','entry','finance','benchmark'];
  document.querySelectorAll('.mob-tab').forEach(function(t){ t.classList.remove('on'); });
  var mobEl = document.getElementById('mob-' + name);
  if (mobEl) mobEl.classList.add('on');
  else { var moreEl = document.getElementById('mob-more'); if (moreEl) moreEl.classList.add('on'); }
  closeMobMore();
  refreshTab();
}

function toggleMobMore() {
  var m = document.getElementById('mob-more-menu');
  if (!m) return;
  var isHidden = m.style.display === 'none' || m.style.display === '';
  m.style.display = isHidden ? 'grid' : 'none';
}
function closeMobMore() {
  var m = document.getElementById('mob-more-menu');
  if (m) m.style.display = 'none';
}
var _tabRenderTime = {}; // { tabName: timestamp }
var _TAB_CACHE_MS  = 30000; // 30 seconds — re-render if stale

function refreshTab() {
  var now   = Date.now();
  var last  = _tabRenderTime[curTab] || 0;
  // Per-tab cache times: heavy calculation tabs get longer cache
  var heavyTabs = { 'forecast':600000, 'analytics':600000, 'planning':600000, 'report':300000, 'benchmark':120000 }; // 10min/10min/5min/2min
  var cacheMs   = heavyTabs[curTab] || _TAB_CACHE_MS;
  var stale     = (now - last) > cacheMs;
  var alwaysRender = ['entry','backup','dashboard'];
  if (alwaysRender.indexOf(curTab) === -1 && !stale) return;
  _tabRenderTime[curTab] = now;
  if (curTab === 'backup')    { renderBackupTab(); return; }
  if (curTab === 'dashboard') { renderDash(); return; }
  if (curTab === 'entry')     { renderEntry(); return; }
  if (curTab === 'monthly')   { renderMonthly(); return; }
  if (curTab === 'report')    { setTimeout(renderReport, 0); return; }
  if (curTab === 'finance')   { renderFinance(); return; }
  if (curTab === 'prices')    { renderPriceTable(); return; }
  if (curTab === 'benchmark') { initBenchmark(); return; }
  if (curTab === 'analytics') { setTimeout(function(){ renderAnalytics(); showAnalyticsTab('charts'); }, 0); return; }
  if (curTab === 'forecast')  { setTimeout(renderForecast, 0); return; }
  if (curTab === 'guide')     { renderGuide(); return; }
  if (curTab === 'planning')  {
    // Ensure data is precomputed before rendering
    setTimeout(function() {
      if (Object.keys(_monthTotalsCache).length < 6) precomputeAllMonths();
      renderPlanning();
    }, 0);
    return;
  }
  if (curTab === 'items')     { renderItemsDeptList(); closeItemsEditor(); initItemsTab(); return; }
}

// Force a tab to re-render even if cached (call after saving data)
function invalidateTabCache(tabName) {
  if (tabName) { delete _tabRenderTime[tabName]; }
  else { _tabRenderTime = {}; } // clear all
}

// ════════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════════
// ── Dashboard date range filter ───────────────────────────────
function getDashRange(m) {
  var fromEl = document.getElementById('dash-range-from');
  var toEl   = document.getElementById('dash-range-to');
  var fromVal = fromEl ? fromEl.value : '';
  var toVal   = toEl   ? toEl.value   : '';
  // Default: full month
  var nd = dim(CY, m);
  var fromDay = 1, toDay = nd;
  if (fromVal) {
    var fd = new Date(fromVal);
    if (fd.getFullYear() === CY && fd.getMonth()+1 === m) fromDay = fd.getDate();
  }
  if (toVal) {
    var td = new Date(toVal);
    if (td.getFullYear() === CY && td.getMonth()+1 === m) toDay = td.getDate();
  }
  var hasRange = fromVal || toVal;
  // Show/hide clear button
  var clr = document.getElementById('dash-range-clear');
  if (clr) clr.style.display = hasRange ? 'block' : 'none';
  return { fromDay: fromDay, toDay: Math.min(toDay, nd), hasRange: hasRange };
}

function clearDashRange() {
  var f = document.getElementById('dash-range-from');
  var t = document.getElementById('dash-range-to');
  if (f) f.value = '';
  if (t) t.value = '';
  var clr = document.getElementById('dash-range-clear');
  if (clr) clr.style.display = 'none';
  renderDash();
}

// Range-aware dayTotals sum
function rangeTotals(y, m, fromDay, toDay) {
  var qr = 0, kg = 0, pcs = 0, activeDays = 0;
  for (var d = fromDay; d <= toDay; d++) {
    var dt = dayTotals(y, m, d);
    if (dt.qr > 0) { activeDays++; }
    qr += dt.qr; kg += dt.kg; pcs += dt.pcs;
  }
  return { qr: qr, kg: kg, pcs: pcs, activeDays: activeDays };
}
