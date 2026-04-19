function _renderGuideContent() {

  var badge = function(txt, bg, col, border) {
    border = border || bg;
    return '<span style="background:' + bg + ';color:' + col + ';border:1.5px solid ' + border + ';padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap">' + txt + '</span>';
  };
  var btn = function(txt, bg, col, border) {
    border = border || 'transparent';
    return '<span style="background:' + bg + ';color:' + col + ';border:1.5px solid ' + border + ';padding:3px 10px;border-radius:6px;font-size:11.5px;font-weight:700">' + txt + '</span>';
  };
  var tip = function(txt) {
    return '<div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:9px 14px;border-radius:0 8px 8px 0;margin:10px 0;font-size:12px;color:#92400e"><strong>💡 Tip:</strong> ' + txt + '</div>';
  };
  var warn = function(txt) {
    return '<div style="background:#fff5f5;border-left:3px solid #ef4444;padding:9px 14px;border-radius:0 8px 8px 0;margin:10px 0;font-size:12px;color:#b91c1c"><strong>⚠️ Important:</strong> ' + txt + '</div>';
  };
  var step = function(items) {
    var out = '<ol style="padding-left:20px;margin:8px 0">';
    items.forEach(function(i){ out += '<li style="margin-bottom:6px;line-height:1.7">' + i + '</li>'; });
    return out + '</ol>';
  };
  var ul = function(items) {
    var out = '<ul style="padding-left:18px;margin:8px 0">';
    items.forEach(function(i){ out += '<li style="margin-bottom:5px;line-height:1.7">' + i + '</li>'; });
    return out + '</ul>';
  };

  var secs = window._cachedGuideSecs || (window._cachedGuideSecs = [

    // ── 1. GETTING STARTED ──────────────────────────────────────
    ['🚀 Getting Started',
     '<strong>How to open the system:</strong>' +
     ul([
       'Open your GitHub Pages URL in any browser: <code>https://redasalah1980-pixel.github.io/pearl-laundry/index.html</code>',
       'Works on any device — laptop, desktop, tablet, phone. No installation needed.',
       'Bookmark the URL on all your devices for one-click access.'
     ]) +

     '<br><strong>🎨 Login Screen — Immersive Dark Design:</strong>' +
     ul([
       'Full-screen animated background — deep dark space scene with drifting gold particles, nebula glows and occasional shooting stars.',
       'A glass card floats in the center — semi-transparent with gold shimmer line at top.',
       '<strong>RS LaundryPro monogram</strong> with pulsing gold rings at the top of the card.',
       '<strong>Pearl Management System</strong> title in elegant serif font.',
       'Underline-style input fields with gold focus glow.',
       'Gold gradient <strong>▶ ENTER SYSTEM</strong> button.',
       'Security badges at the bottom: 🔒 Encrypted · ☁️ Cloud Sync · 🛡️ Licensed.'
     ]) +

     '<br><strong>🔑 Licence Protection:</strong>' +
     ul([
       'The system is domain-locked — only runs on approved URLs.',
       'On <strong>your approved domain</strong> (github.io) → goes straight to login. No key needed.',
       'On any <strong>unknown domain</strong> → shows a locked screen. A valid licence key is required.',
       'To give someone else access → generate a key in ⚙️ Settings → 🔑 Licences.',
       'You can revoke any key anytime.'
     ]) +

     '<br><strong>🔐 Login credentials:</strong>' +
     ul([
       'Default Admin credentials are set during system setup. Contact your system administrator if you need login details.',
       'Press <strong>Enter</strong> or click <strong>▶ ENTER SYSTEM</strong>.',
       'Team members use their own credentials set in ⚙️ Settings → Team Account.',
       'Wrong password → card shakes with red error message.',
       'Caps Lock on → amber warning appears automatically.'
     ]) +

     '<br><strong>Top navigation bar after login:</strong>' +
     ul([
       '<strong>Year selector</strong> — switch between 2025–2035. Each year is completely independent.',
       badge('● 1 ONLINE','#14532d','#86efac','#166534') + ' — admin only. Shows how many users are active. Click to see names.',
       badge('● LIVE','#14532d','#86efac','#166534') + ' = connected to Firebase cloud. &nbsp;' + badge('● OFFLINE','#991b1b','#fca5a5','#991b1b') + ' = no internet — saves locally, auto-syncs when back online.',
       '<strong>⚙️ Your Name</strong> — opens Settings (admin only).',
       '<strong>⏏ Logout</strong> — always visible top right.'
     ]) +
     tip('Bookmark the URL on your laptop AND work desktop for instant one-click access. Both go straight to login — no key needed.')
    ],

    // ── 2. DAILY ENTRY ──────────────────────────────────────────
    ['✏️ Daily Entry — Entering Quantities & Mobile Use',
     '<strong>How to enter data:</strong>' +
     step([
       'Select the <strong>Month</strong>, <strong>Day</strong>, and <strong>Department</strong> from the dropdowns.',
       'Type the piece count in the <strong>QTY</strong> column for each item. Revenue and KG update instantly.',
       'Use the <strong>department tabs</strong> below the toolbar to switch between departments quickly without changing the day.',
       'Click ' + btn('💾 Save Day','#16a34a','#fff') + ' to save. Do this for each department.'
     ]) +
     '<strong>The 4 live stat cards (update as you type):</strong>' +
     ul([
       '<strong>Day Total (QR)</strong> — total revenue for all departments on the selected day.',
       '<strong>Day KG</strong> — total weight for all departments.',
       '<strong>Department Revenue</strong> — revenue for the currently selected department only.',
       '<strong>Department Pieces</strong> — total piece count for the current department.'
     ]) +
     '<strong>Toolbar buttons explained:</strong>' +
     ul([
       btn('💾 Save Day','#16a34a','#fff') + ' — commits all quantities for current department and day to cloud.',
       btn('📋 Copy Day','#fffbeb','#92400e','#d97706') + ' — copies all quantities to clipboard. A blue badge appears to confirm.',
       btn('📌 Paste Day','#fff','#d97706','#d97706') + ' — grayed out until you copy. Switch to any day or department then click — fills instantly. Amber <strong>✕</strong> clears the clipboard.',
       btn('📝 Receiving Log','#0D1B2E','#C9A84C') + ' — opens the batch drawer on the right. Red badge = pending batches.',
       btn('📋 Bulk Paste','#f8fafc','#475569','#94a3b8') + ' — paste multiple days from Excel at once.',
       btn('📂 Import Excel','#f0fdf4','#15803d','#16a34a') + ' — import a full .xlsx file.',
       btn('🗑 Clear ▾','#fff5f5','#dc2626','#fca5a5') + ' — clear data for a day, date range, or entire month.'
     ]) +
     '<strong>Copy & Paste workflow:</strong>' +
     step([
       'Select department + day → click ' + btn('📋 Copy Day','#fffbeb','#92400e','#d97706') + '.',
       'Switch to a different day or department.',
       'Click ' + btn('📌 Paste Day','#fff','#d97706','#d97706') + ' — quantities fill automatically.',
       'Click ' + btn('💾 Save Day','#16a34a','#fff') + '. The clipboard stays active so you can keep pasting to more days.',
       'Click the amber <strong>✕</strong> button when done to clear the clipboard.'
     ]) +
     warn('Always click 💾 Save Day after entering or pasting. Navigating away without saving will lose that day\'s data.') +

     '<br><strong>🔒 Locked Prices — Permanent Price Protection:</strong>' +
     '<br><br>Every time you click ' + btn('💾 Save Day','#16a34a','#fff') + ', the system permanently locks the price of each item at that exact moment. This means:' +
     ul([
       'If you change prices next month, all previously saved data keeps its original prices forever.',
       'Finance calculations, Dashboard revenue, and all reports always use the price that was active when the data was saved.',
       'No schedules or manual steps needed — protection is automatic on every save.'
     ]) +
     '<strong>⚠️ Price Conflict Warning:</strong>' +
     '<br><br>If you try to save a day that was previously saved with different prices, the system shows a warning:' +
     ul([
       btn('🔒 Keep Old Prices','#0d1b2e','#c9a84c') + ' — saves the quantity correction but keeps the original locked prices. Use this when fixing a typo.',
       btn('🔄 Update Prices','#dc2626','#fff') + ' — saves with current prices. Use this if you intentionally want to reprice.',
       'Cancel — nothing saved.'
     ]) +
     tip('When correcting a quantity mistake on an old day, always choose Keep Old Prices to protect the revenue figures that were already reported.') +
     '<br><strong>📱 Mobile Use:</strong>' +
     '<br><br>Open the same link on your phone or tablet — the system detects the screen size and adapts automatically. On mobile you will see:' +
     ul([
       'A <strong>bottom navigation bar</strong> with Dashboard, Entry, Finance, Benchmark, and a <strong>⋯ More</strong> button for other tabs.',
       'Touch-friendly larger buttons and stat cards.',
       'The entry table scrolls horizontally so all columns are accessible.',
       'All data syncs instantly — same Firebase database as desktop.'
     ]) +
     tip('Bookmark the link on your phone home screen for one-tap access. Works on iOS Safari and Android Chrome.')
    ],

    // ── 3. RECEIVING LOG ────────────────────────────────────────
    ['📝 Receiving Log — Multiple Batches Per Day',
     '<strong>When to use:</strong> When laundry arrives in separate deliveries during the day. Record each batch separately and the system adds them together.' +
     step([
       'Click ' + btn('📝 Receiving Log','#0D1B2E','#C9A84C') + ' — the batch drawer slides in from the right.',
       'Select the <strong>Day</strong> and <strong>Department</strong>.',
       'Click <strong>+ Add Batch</strong> for the first delivery and enter quantities.',
       'Click <strong>+ Add Batch</strong> again for each additional delivery.',
       'When all batches are entered, click ' + btn('✅ Apply to Day','#16a34a','#fff') + ' — all batches are summed and the entry table fills automatically.',
       'Click ' + btn('💾 Save Day','#16a34a','#fff') + ' to commit.'
     ]) +
     ul([
       '<strong>📋 Copy</strong> button duplicates a batch. <strong>🗑</strong> deletes a single batch.',
       'Batches are saved in the browser — closing and reopening the drawer keeps them.',
       'The red badge on the button shows how many batches are pending.',
     ]) +
     tip('Use Receiving Log when you have morning and evening deliveries. It prevents manual addition errors.')
    ],

    // ── 4. BULK PASTE ───────────────────────────────────────────
    ['📋 Bulk Paste — Paste Multiple Days From Excel',
     '<strong>When to use:</strong> Entering data for a past month from an existing Excel file. Saves hours of manual entry.' +
     step([
       'Click ' + btn('📋 Bulk Paste','#f8fafc','#475569','#94a3b8') + ' in the toolbar.',
       'Set <strong>Year</strong>, <strong>Month</strong>, <strong>Day From</strong>, <strong>Day To</strong>.',
       '<strong>Select the exact Department</strong> — do not leave it on "All Departments".',
       'In Excel: select the item names column + day columns only. <strong>No headers, no totals row.</strong>',
       'Press <strong>Ctrl+C</strong> in Excel → click inside the paste box in the system → press <strong>Ctrl+V</strong>.',
       'Check the preview table — confirm items are matched correctly.',
       'Click <strong>Apply All Rows</strong>.'
     ]) +
     warn('Always select a specific department (e.g. Rooms Linen) before pasting. The system maps Row 1 → Item 1, Row 2 → Item 2 in order. If you select "All Departments" it uses name matching which can be unreliable for similar names like King/Queen/Full sheets.') +
     ul([
       'Blank cells = 0. You can paste a full month (Day 1–31) in one action.',
       'Paste one department at a time. Six departments = six separate pastes.',
       'After applying, the system jumps to the pasted year/month so you can verify immediately.'
     ]) +
     tip('Check the item order in ✏️ Daily Entry first to confirm it matches your Excel row order before pasting.')
    ],

    // ── 5. IMPORT EXCEL ─────────────────────────────────────────
    ['📂 Import Excel — Full .xlsx File Import',
     '<strong>When to use:</strong> You have a complete .xlsx file with one sheet per department. A ready-to-use example template is available for download from the system.' +
     step([
       'Click ' + btn('📂 Import Excel','#f0fdf4','#15803d','#16a34a') + ' in the toolbar.',
       'Set <strong>Year</strong>, <strong>Month</strong>, <strong>Day From</strong>, <strong>Day To</strong>.',
       'Choose <strong>All Sheets</strong> or a specific department.',
       'Click <strong>Choose File</strong> and select your .xlsx file.',
       'Review the preview table — confirm item names on the left match system rows on the right.',
       'Click <strong>Import All Data</strong>.'
     ]) +
     '<strong>Excel file structure — exact rules:</strong>' +
     ul([
       '<strong>Sheet names must match exactly:</strong> <code>Rooms Linen</code> · <code>F & B</code> · <code>Spa & Pool</code> · <code>Uniform</code> · <code>Others</code> · <code>Dry Cleaning</code>. Any other name is ignored.',
       '<strong>Rooms Linen:</strong> Col A = #, Col B = Item Name, Col C = Day 1, Col D = Day 2 ... Col AG = Day 31.',
       '<strong>All other sheets:</strong> Col A = #, Col B = Item Name, Col C = Price, Col D = Weight, Col E = Day 1, Col F = Day 2 ... Col AJ = Day 31.',
       '<strong>Row layout (Rooms Linen):</strong> Row 1 = title, Row 2 = column headers, Row 3+ = item data.',
       '<strong>Row layout (F&B, Uniform, Others, Dry Cleaning):</strong> Row 1 = title, Row 2 = headers, Row 3+ = item data.',
       '<strong>Row layout (Spa & Pool):</strong> Row 1 = title, Row 2 = headers, Row 3 = sub-header, Row 4+ = item data.',
     ]) +
     warn('Items are matched by <strong>position only</strong> — Row 1 = Item 1, Row 2 = Item 2. Do NOT add, remove, or reorder rows. Do NOT add blank rows between items. Leave rows with no data as zeros.') +
     '<strong>Month length handling:</strong>' +
     ul([
       'Set Day To to match the month: <strong>28</strong> for February, <strong>30</strong> for April/June/Sept/Nov, <strong>31</strong> for other months.',
       'The system only reads the columns you specify. Extra day columns beyond Day To are ignored.',
       'For February: fill days 1–28 and leave day columns 29–31 blank.'
     ]) +
     tip('Use the example template available from the system — it has all sheets pre-built with correct structure, item names in the exact right order, and instructions inside.')
    ],

    // ── 5B. IMPORT FULL MONTH ───────────────────────────────────
    ['📅 Import Full Month — All Departments at Once',
     '<strong>What it does:</strong> Upload one Excel file containing all departments and all days for a full month — in one click.' +
     '<br><br><strong>How to use:</strong>' +
     step([
       'Go to <strong>Entry tab</strong> → click ' + btn('📅 Import Full Month','#f5f3ff','#6d28d9','#7c3aed') + '.',
       'Select the <strong>Year</strong> and <strong>Month</strong> you want to import.',
       'Click <strong>⬇️ Download Template</strong> — saves an Excel file with one sheet per department.',
       'Open the Excel file and fill in quantities for each day and item.',
       'Come back → choose the filled file → system shows a preview of what will be imported.',
       'Click <strong>✅ Import All Departments</strong> — all data saved at once.'
     ]) +
     '<br><strong>Excel file structure:</strong>' +
     ul([
       'One sheet per department (sheet names must match department names).',
       'First row = headers: Day | Item 1 | Item 2 | Item 3 | ...',
       'Each row after = one day: 1, 22, 6, 18, ...',
       'Leave cells blank to skip — existing data is kept.',
       'Use the downloaded template to get the correct format automatically.'
     ]) +
     warn('Blank cells are skipped — existing data for that item/day stays. Only cells with numbers are imported. Always download the template first to get correct item names and column order.') +
     tip('Download the template at start of month, fill it throughout the month as a daily log, then import at end of month in one shot.')
    ],

        // ── 6. DEC 31 CARRY-IN ──────────────────────────────────────
    ['📥 December 31 Carry-In — January Finance Accuracy',
     '<strong>Why this exists:</strong> Items received on December 31 are posted to finance on January 1 of the next year. Year 2025 exists only to hold this carry-in data.' +
     step([
       'Switch the <strong>Year selector</strong> to <strong>2025</strong>.',
       'Only <strong>December 2025</strong> is available.',
       'Go to <strong>✏️ Daily Entry</strong> → select Day 31.',
       'Enter quantities per department.',
       'Click ' + btn('💾 Save Day','#16a34a','#fff') + ' for each department.'
     ]) +
     '<strong>Effect:</strong> Finance Posting → January 2026 → the amber row on Day 1 automatically reads this data. Enter it once and it is always correct.' +
     tip('If you skip this, the January Finance Posting amber row will show zero instead of the correct carry-in amount.')
    ],

    // ── 7. CLEAR DATA ───────────────────────────────────────────
    ['🗑 Clear Data — Day / Range / Month',
     'Click the ' + btn('🗑 Clear ▾','#fff5f5','#dc2626','#fca5a5') + ' dropdown in the Daily Entry toolbar.' +
     ul([
       '<strong>📅 Clear This Day</strong> — removes quantities for the selected day and department only.',
       '<strong>📆 Clear Date Range</strong> — clears across a range of days you specify.',
       '<strong>🗑 Clear Entire Month</strong> — clears the full month. Asks for a second confirmation before proceeding.'
     ]) +
     warn('Clear operations cannot be undone. Make a backup before clearing large amounts of data.')
    ],

    // ── 8. DASHBOARD ────────────────────────────────────────────
    ['📊 Dashboard — Live Monthly Overview',
     '<strong>5 stat cards at the top:</strong>' +
     ul([
       '<strong>Monthly Revenue</strong> — total for all departments in the selected month. Shows % of target in the subtitle: <span style="color:#16a34a;font-weight:700">🎉 +10.5% above target</span> or <span style="color:#dc2626;font-weight:700">46.7% of target</span>.',
       '<strong>Finance Posted Total</strong> — posting view total (shifted +1 day).',
       '<strong>Total KG</strong> — total weight washed.',
       '<strong>Avg Daily Revenue</strong> — average per active day. Shows a live projection line below.',
       '<strong>Avg Daily KG</strong> — average weight per day.'
     ]) +

     '<br><strong>📈 Live Projection on Avg Daily Revenue card:</strong>' +
     '<br><br>Below the active days count, a small line shows your projected month-end performance based on your current daily average:' +
     ul([
       '<strong>Formula:</strong> Avg Daily Revenue × Total days in month = Estimated month close',
       '<strong>Example:</strong> Avg 2,197 QR/day × 31 days = Est. 68,124 QR close',
       'If target is set → shows % of target: <span style="color:#d97706;font-weight:700">📊 Est. 68,124.36 QR · 85.2% of target</span>',
       'If target exceeded → shows: <span style="color:#16a34a;font-weight:700">📈 Est. 88,000.00 QR · 🎉 +10.0% above target</span>',
       'If no target set → shows estimated close amount only.',
       '<strong>Updates automatically</strong> every time you save new data — reflects current performance pace.'
     ]) +
     '<div style="background:#f0fdf4;border-left:3px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin:10px 0;font-size:12px;color:#14532d">' +
     '<strong>How to read it:</strong><br>' +
     '• 85% → at current pace you will miss target by 15% — need to push daily numbers up<br>' +
     '• 100%+ → you are on track to exceed target — keep going<br>' +
     '• Number changes every day as your average improves or drops' +
     '</div>' +
     '<strong>🎯 Monthly Revenue Target:</strong>' +
     ul([
       'Set a revenue target for each month separately — each month is independent.',
       'Enter amount → click <strong>Set Target</strong> → a color-coded progress bar appears below the cards.',
       'Green ≥75% · Amber ≥50% · Red below 50% · 🎉 when 100% reached.',
       'The progress bar shows: <strong>Actual amount · % of target · Target amount</strong>',
       'Below the bar: <strong>remaining amount + days left + required daily revenue</strong> to hit target.',
       'Example: <em>📉 42,641.46 QR remaining · 13 days left · need 3,280.11 QR/day</em>',
       'If exceeded: <em>🎉 Exceeded by 5,358.54 QR</em>',
       'Switching months automatically updates everything to that month\'s target.',
       'Syncs to Firebase — set once, available on all devices.'
     ]) +
     '<strong>🔔 Smart Notifications:</strong>' +
     ul([
       '⚠️ <strong>Missing days</strong> — click the badge to see a popup listing exactly which days have no data. Click any day in the popup to jump directly to it in Entry.',
       '📉 <strong>Below target</strong> — warns if revenue is under 50% of target mid-month.',
       '🎉 <strong>Target reached</strong> — celebrates when you hit your goal.'
     ]) +
     '<strong>Calendar:</strong>' +
     ul([
       'Click any day to jump directly to that day in Daily Entry.',
       '<strong>💰 Hide/Show Amounts</strong> — toggles revenue values in cells.',
       '<strong>⚖️ Hide/Show KG</strong> — toggles KG values.',
       '<strong>📥 Receiving Day / 📤 Posting Day</strong> — switch between actual and finance posting view (+1 day shift).'
     ]) +
     '<strong>Department Breakdown table</strong> — Revenue, KG, Pieces and % share per department.' +
     tip('All amounts use comma formatting (32,073.63) for easy reading. Change currency symbol anytime in ⚙️ Settings → 💱 Currency.')
    ],

    // ── 9. MONTHLY ──────────────────────────────────────────────
    ['📅 Monthly Overview & Exports',
     '<strong>What it shows:</strong> Full day-by-day table for the selected month. Each row is an item, each column is a day. Non-zero values are highlighted in blue. Subtotals appear at the bottom of each department section.' +
     '<br><br><strong>Export & Share (top-right dropdown):</strong>' +
     ul([
       btn('📊 Excel (.xlsx)','#f0fdf4','#15803d','#16a34a') + ' — full monthly table with all items, daily counts, totals and QR values. Opens directly in Excel.',
       btn('🖨️ PDF / Print','#fff7ed','#c2410c','#fdba74') + ' — opens a clean print window. Use browser Print → Save as PDF to share.',
       btn('📄 CSV Export','#eff6ff','#1d4ed8','#bfdbfe') + ' — raw data for use in other spreadsheet tools.'
     ]) +
     tip('Select "All Departments" in the department filter to export everything in one file.')
    ],

    // ── 10. FINANCE POSTING ─────────────────────────────────────
    ['🏦 Finance Posting',
     '<strong>What it shows:</strong> Items received on Day D are posted to finance on Day D+1. The table reflects this shift automatically.' +
     ul([
       badge('Amber row','#fffbeb','#92400e','#fde68a') + ' = previous month\'s last day carry-in posting on Day 1. January always uses Dec 31 2025 carry-in data.',
       'The carry-in row uses the <strong>previous year\'s prices</strong> — so Dec 31 data is always valued correctly at 2025 prices, not 2026 prices.',
       'Last row of the month is greyed out — it posts to next month and is excluded from the monthly total.',
       '<strong>POSTED THIS MONTH TOTAL</strong> at the bottom matches the Finance Posted Total on the Dashboard exactly.'
     ]) +
     '<strong>Export buttons — each has Excel + PDF:</strong>' +
     ul([
       '<strong>📊 Daily Summary</strong> — all departments per day.',
       '<strong>📅 Monthly Summary</strong> — all months for the current year.',
       '<strong>📆 Yearly Summary</strong> — all years combined.'
     ])
    ],

    // ── 11. ANALYTICS ───────────────────────────────────────────
    ['📈 Analytics — Charts & Trends',
     '<strong>Available charts (all update when you change the Month):</strong>' +
     ul([
       '<strong>Revenue by Department</strong> — 3D bar chart.',
       '<strong>KG Washed by Department</strong> — 3D bar chart.',
       '<strong>Revenue Share %</strong> — donut chart showing each department\'s contribution.',
       '<strong>Department Summary Table</strong> — QR, KG, Pieces and % side by side.',
       '<strong>Daily Revenue Trend</strong> — line chart across the month.',
       '<strong>Daily KG Trend</strong> — line chart across the month.'
     ]) +
     tip('Use the Month selector at the top of the Analytics tab to update all charts at once.')
    ],

    // ── 12. PRICES ──────────────────────────────────────────────
    ['⚙️ Prices & Weights — Full Guide',
     '<strong>The Prices tab has 3 sub-tabs:</strong>' +
     ul([
       btn('📋 Price List','#0d1b2e','#c9a84c') + ' — view and edit prices and weights for each department.',
       btn('🔧 Tools','#f8fafc','#0d1b2e','#e2e8f0') + ' — Copy from Year, Bulk Adjust %, Import Excel, Import CSV.',
       btn('📅 Price Schedules','#f8fafc','#0d1b2e','#e2e8f0') + ' — manage mid-year price changes with effective dates.'
     ]) +
     warn('Changing the price list NEVER affects quantities already entered. Only revenue calculations use prices, and schedules control which price applies to which date.') +

     '<br><strong>📋 Price List sub-tab:</strong>' +
     ul([
       'Use department tabs to switch. Click <strong>🗂 All Items</strong> to see all departments at once.',
       'Changes in <strong>🗂 All Items</strong> save automatically when you click away.',
       'Changes in individual department tabs require clicking ' + btn('💾 Save Prices & Weights','#16a34a','#fff') + '.',
       'Use <strong>▲ ▼</strong> arrows to reorder items — order changes everywhere in the system.',
       btn('➕ Add Item','#eff6ff','#1d4ed8','#3b82f6') + ' — add new item to current department.',
       btn('🏢 Add Dept','#fdf4ff','#7e22ce','#a855f7') + ' — create a new department with custom emoji.',
       btn('↩ Reset','#fff5f5','#dc2626','#fca5a5') + ' — restore default prices for this department.',
       '🖨️ Print/PDF dropdown — choose Prices Only, Weight Only, or Prices + Weight.'
     ]) +

     '<br><strong>🔧 Tools sub-tab — Price Change Manager:</strong>' +
     '<br><br>The Tools sub-tab contains the <strong>🎛 Price Change Manager</strong> — one powerful tool that replaces Copy Prices, Bulk Adjust, and manual schedule saving. It does everything in one step with a full preview before applying.' +
     '<br><br><strong>Price Change Manager fields:</strong>' +
     ul([
       '<strong>Mode</strong> — "Adjust Current Prices by %" uses the existing price list as base. "Copy from Another Year + % Adjust" copies prices from a different year first, then applies the %.',
       '<strong>Source Year</strong> (copy mode only) — the year to copy prices from.',
       '<strong>Target Year</strong> — the year to update.',
       '<strong>Department</strong> — All Departments or a specific one.',
       '<strong>Adjust %</strong> — positive = increase, negative = decrease. Leave 0 to copy only.',
       '<strong>From Month / From Date</strong> — when new prices start. Quick Month picker fills the 1st automatically.',
       '<strong>To Month / To Date</strong> — optional end date. If set, old prices are restored after this date.'
     ]) +
     step([
       'Fill in all fields.',
       'Click ' + btn('🔍 Preview','#f8fafc','#0d1b2e','#e2e8f0') + ' — shows a table of before/after prices per department before anything changes.',
       'Confirm numbers look correct.',
       'Click ' + btn('✅ Apply & Save Schedule','#0d1b2e','#c9a84c') + ' — applies prices AND saves the schedule automatically in one step.'
     ]) +
     '<div style="background:#f0fdf4;border-left:3px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin:10px 0;font-size:12px;color:#14532d">' +
     '<strong>✅ Example — +3.5% prices from April 2026 based on 2025 prices:</strong><br><br>' +
     'Mode: Adjust Current Prices by % · Year 2026 · All Departments · +3.5% · From Month: April<br>' +
     'Click Preview → confirm prices → Click Apply & Save Schedule<br><br>' +
     '<strong>Result:</strong> January/February/March use original 2026 prices · April onwards uses +3.5% · All entered data is permanently protected by locked prices ✅' +
     '</div>' +
     tip('The Price Change Manager also includes Import from Excel (.xlsx) and Export/Import CSV cards for bulk price updates from spreadsheets.') +

     '<br><strong>📅 Price Schedules sub-tab — Mid-Year Price Changes:</strong>' +
     '<br><br>This is the most important feature when prices change during the year. The system stores a history of price snapshots. Each day\'s revenue uses the price that was active on that date — automatically.' +
     '<br><br><div style="background:#f0fdf4;border-left:3px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin:10px 0;font-size:12px;color:#14532d">' +
     '<strong>✅ Correct workflow — Example: +3.5% prices starting April 2026</strong><br><br>' +
     '<strong>Step 1</strong> — Go to Price Schedules → Quick Month: January → Year 2026 → All Departments → Save as Scheduled Prices<br>' +
     '<em>This locks current prices for Jan 1. Jan, Feb, March will use these prices.</em><br><br>' +
     '<strong>Step 2</strong> — Go to Tools → Bulk Adjust → Year 2026 → All Departments → enter +3.5 → Apply → Save<br>' +
     '<em>This changes the active price list to +3.5%</em><br><br>' +
     '<strong>Step 3</strong> — Go to Price Schedules → Quick Month: April → Year 2026 → All Departments → Save as Scheduled Prices<br>' +
     '<em>This locks new +3.5% prices from April 1 onwards.</em><br><br>' +
     '<strong>Result:</strong> Jan/Feb/Mar → original prices · April onwards → +3.5% prices · All data untouched ✅' +
     '</div>' +
     ul([
       'The <strong>Quick Month</strong> dropdown auto-fills the date to the 1st of the selected month.',
       'You can also set an exact date for mid-month changes.',
       'Each schedule shows ' + badge('UPCOMING','#dbeafe','#1d4ed8','#93c5fd') + ' ' + badge('TODAY','#d1fae5','#065f46','#6ee7b7') + ' or ' + badge('ACTIVE','#f1f5f9','#64748b','#e2e8f0') + ' badge.',
       'Delete any schedule with the 🗑 Delete button.'
     ]) +
     warn('Always save the CURRENT prices as a Jan 1 schedule BEFORE applying any adjustment. If you apply the adjustment first and then save, the schedule captures wrong prices.') +

     '<br><strong>🛠 Fix a Wrong Schedule:</strong>' +
     '<br>If you accidentally saved a schedule with already-adjusted prices, use the <strong>Fix a Wrong Schedule</strong> tool at the bottom of the Price Schedules sub-tab.' +
     step([
       'Select the schedule date to fix from the dropdown.',
       'Enter the % that was already applied (e.g. 3.5).',
       'Click ' + btn('🔄 Reverse & Re-save','#dc2626','#fff') + ' — the system divides all prices in that snapshot by 1.035 to get back the original prices.'
     ]) +
     tip('Export your prices as CSV before making any major changes. That way you always have a copy of the exact prices to restore from.')
    ],

    // ── 13. SETTINGS ────────────────────────────────────────────
    ['⚙️ Settings — Accounts & Access',
     '<strong>How to open:</strong> Click <strong>⚙️ Settings</strong> in the top navigation bar. Admin only — team members cannot see this button.' +
     '<br><br>The Settings panel uses a <strong>left sidebar navigation</strong> with 8 sections grouped into 4 categories:' +
     ul([
       '<strong>Account:</strong> 👤 Admin Account · 👥 Team Accounts',
       '<strong>System:</strong> 🔒 Tab Access · 📋 Audit Log',
       '<strong>Property:</strong> 💱 Currency · 🏨 Hotel',
       '<strong>Licence:</strong> 🔑 Licences',
       '<strong>Tools:</strong> 🩺 Diagnostics'
     ]) +
     '<br><strong>All sections are always visible</strong> — nothing is hidden or cut off regardless of screen size.' +
     '<br><br>The Settings panel has <strong>8 sections</strong>:' +
     '<br><br><strong>👤 Admin Account</strong>' +
     step([
       'Click <strong>⚙️ Settings</strong> → <strong>👤 Admin Account</strong>.',
       'Enter your <strong>current password</strong> (required to save any changes).',
       'Enter a new username and/or password. Leave blank to keep the current one.',
       'Click ' + btn('💾 Save Admin Changes','#0d1b2e','#c9a84c') + '.'
     ]) +
     '<strong>👥 Team Accounts</strong>' +
     ul([
       'Create multiple team accounts — each with their own username, password and tab permissions.',
       'Click <strong>➕ Add Account</strong> → enter name, password, and select which tabs they can see.',
       'Edit or delete any account at any time using the Edit / Delete buttons.',
       'Team members cannot see ⚙️ Settings.'
     ]) +
     '<strong>🔒 Tab Access</strong>' +
     ul([
       'Controls which tabs team members can see. Admin always sees all tabs.',
       '📊 Dashboard and ✏️ Daily Entry are always ON — cannot be hidden.',
       'Changes apply immediately — no re-login needed.',
       'Recommended for data-entry staff: ✅ Dashboard ✅ Daily Entry ❌ everything else.'
     ]) +
     warn('All Settings changes sync to cloud instantly. All devices update automatically within seconds.')
    ],

    // ── 14. BACKUP & HISTORY ────────────────────────────────────
    ['🛡️ Backup & Restore — Protecting Your Data',
     '<strong>Where to find it:</strong> Click the ' + badge('🛡️ Backup','#0d1b2e','#c9a84c') + ' tab in the top navigation bar (under ⋯ More dropdown).' +
     '<br><br>The Backup tab has <strong>4 sections</strong> stacked top to bottom:' +
     '<br><br><strong>💾 Section 1 — Manual Backup File (your device)</strong>' +
     step([
       'Click ' + btn('⬇️ Download Backup (.json)','#0d1b2e','#c9a84c') + ' — a file downloads to your device instantly.',
       'File is named e.g. <code>Pearl_Backup_2026-03-12.json</code> and contains ALL years of data, prices, and settings.',
       'Store it safely — USB drive, email to yourself, or Google Drive.',
       'To restore: click ' + btn('⬆️ Restore from File','#f0fdf4','#15803d','#86efac') + ' → select the file → confirm. Data is merged safely — nothing deleted.'
     ]) +
     '<strong>☁️ Section 2 — Cloud Backup (Firebase)</strong>' +
     step([
       'Click ' + btn('☁️ Save Cloud Backup Now','#16a34a','#fff') + ' to save a full versioned backup to Firebase.',
       'Status bar shows the date of your last backup and who saved it.',
       'To restore: click ' + btn('🔄 Restore from Cloud Backup','#fff7ed','#c2410c','#fdba74') + ' → confirm. Data merges safely — nothing deleted.',
       'Auto-retry: if the save fails, the system automatically retries up to <strong>3 times</strong> (immediately, then after 2s, then 5s) before alerting you.'
     ]) +
     warn('If you ever see your data disappear, go to the Backup tab immediately and restore. Do not enter new data first — restoring will merge the backup on top of whatever is there.') +
     '<br><strong>🚨 Section 3 — Emergency Raw Firebase Download</strong>' +
     '<br>This section exists for worst-case scenarios when the normal backup system is not working.' +
     step([
       'Click ' + btn('⬇️ Download Raw Firebase JSON','#92400e','#fff') + '.',
       'Downloads your <strong>entire Firebase database</strong> as a raw JSON file — everything, including entry data, occupancy, settings, prices, and backup history.',
       'Use this file to restore manually using the Import function or the emergency_restore.html tool.',
       'File size is typically 100–500 KB depending on how much data you have.'
     ]) +
     tip('The raw Firebase JSON is the most complete backup possible. If a normal backup ever fails, this is your safety net.') +
     '<br><strong>🕐 Section 4 — Backup History (Version Control)</strong>' +
     step([
       'Every time you click <strong>☁️ Save Cloud Backup Now</strong> — a new numbered version is created.',
       'Last <strong>20 versions</strong> are kept — the oldest is deleted when the 21st is saved.',
       'Each version shows: version number, date & time, who saved it, how many years of data, file size.',
       '<strong>● LATEST</strong> badge marks the most recent version.',
       'Click ' + btn('🔄 Restore','#eff6ff','#1d4ed8','#bfdbfe') + ' on any version to restore it. Data is merged — nothing deleted.',
       'Click 🗑 to delete old versions you no longer need (not available on the latest version).',
       'Click <strong>🔄 Refresh</strong> to reload history fresh from Firebase.'
     ]) +
     warn('Always save a cloud backup before uploading a new version of the system to GitHub. This creates a restore point you can always return to.') +
     tip('Save a backup at least once a week. The 20-version history means you can always go back to any point in the last 20 saves.')
    ],

    // ── 15. CLOUD SYNC ──────────────────────────────────────────
    ['☁️ Cloud Sync & Online Presence',
     '<strong>How sync works:</strong>' +
     ul([
       'Every save writes to <strong>Firebase cloud</strong> (primary) and <strong>browser localStorage</strong> (offline backup) at the same time.',
       badge('● LIVE','#14532d','#86efac','#166634') + ' — connected and syncing normally.',
       badge('● OFFLINE','#991b1b','#fca5a5','#991b1b') + ' — no internet. Saves locally. Auto-syncs everything when back online.',
       '<strong>Auto-retry on failure</strong> — if a cloud save fails, the system retries automatically up to 3 times (0s, 2s, 5s delays) before showing a warning. You never need to manually retry.',
       'Clearing browser cache does <strong>not</strong> erase your data — it lives in Firebase.',
       'Deploying a new version to Netlify never touches your data.'
     ]) +
     '<strong>👥 Online Users badge (admin only):</strong>' +
     ul([
       'Shows how many people are currently active.',
       'Click the badge to see each person\'s name and when they were last active.',
       'Each browser tab counts as one session — opening the same site on the same computer shows as one user, not duplicates.'
     ]) +
     '<strong>Sharing with your team:</strong>' +
     ul([
       'Share the URL: <code>stupendous-truffle-53b8ae.netlify.app</code>',
       'Team opens in any browser — no downloading needed.',
       'Everyone reads from the same database. Saves are visible to all within seconds.',
       'When a new version is deployed, team just refreshes the browser — same URL, same data.'
     ])
    ],

    // ── 16. BENCHMARK ───────────────────────────────────────────
    ['🎯 Benchmark — Occupancy vs Revenue Analysis',
     '<strong>What it does:</strong> Compares daily laundry revenue and KG against hotel occupancy % to measure laundry performance per occupied room.' +
     '<br><br><strong>How to set up:</strong>' +
     step([
       'Click <strong>🎯 Benchmark</strong> in the navigation bar.',
       'Enter the <strong>Total Rooms in Hotel</strong> number — e.g. 200. Saved automatically.',
       'Select the <strong>Month</strong> to analyse.',
       'Enter the <strong>occupancy % for each day</strong> in the grid.',
       'Or use <strong>📋 Fill Same %</strong> to fill all days with the same occupancy.',
       'Click ' + btn('💾 Save Occupancy','#16a34a','#fff') + ' — syncs to Firebase for all devices.',
       'Click ' + btn('🔄 Refresh','#0d1b2e','#c9a84c') + ' to update all charts and calculations.'
     ]) +

     '<br><strong>📊 How each figure is calculated:</strong>' +
     '<br><br><div style="background:#f8fafc;border-radius:10px;padding:14px 16px;font-size:12px">' +
     '<table style="width:100%;border-collapse:collapse">' +
     '<tr style="background:#0d1b2e;color:#c9a84c"><th style="padding:8px 10px;text-align:left">Figure</th><th style="padding:8px 10px;text-align:left">Formula</th><th style="padding:8px 10px;text-align:left">Example</th></tr>' +
     '<tr style="background:#fff"><td style="padding:8px 10px;font-weight:700">Avg Occupancy %</td><td style="padding:8px 10px;color:#64748b">Sum of daily Occ% ÷ Days with data</td><td style="padding:8px 10px;color:#0369a1">51.5%</td></tr>' +
     '<tr style="background:#f8fafc"><td style="padding:8px 10px;font-weight:700">Occupied Rooms</td><td style="padding:8px 10px;color:#64748b">Total Rooms × Occ% ÷ 100</td><td style="padding:8px 10px;color:#0369a1">200 × 51.5% = 103 rooms</td></tr>' +
     '<tr style="background:#fff"><td style="padding:8px 10px;font-weight:700">Revenue / Room</td><td style="padding:8px 10px;color:#64748b">Day Revenue ÷ Occupied Rooms that day</td><td style="padding:8px 10px;color:#0369a1">2,500 ÷ 103 = 24.27 QR</td></tr>' +
     '<tr style="background:#f8fafc"><td style="padding:8px 10px;font-weight:700">KG / Room</td><td style="padding:8px 10px;color:#64748b">Day KG ÷ Occupied Rooms that day</td><td style="padding:8px 10px;color:#0369a1">1,200 ÷ 103 = 11.65 kg</td></tr>' +
     '<tr style="background:#fff"><td style="padding:8px 10px;font-weight:700">Avg Rev/Room</td><td style="padding:8px 10px;color:#64748b">Sum of daily Rev/Room ÷ Days tracked</td><td style="padding:8px 10px;color:#0369a1">27.07 QR avg</td></tr>' +
     '<tr style="background:#f8fafc"><td style="padding:8px 10px;font-weight:700">Avg KG/Room</td><td style="padding:8px 10px;color:#64748b">Sum of daily KG/Room ÷ Days tracked</td><td style="padding:8px 10px;color:#0369a1">13.14 kg avg</td></tr>' +
     '<tr style="background:#fff"><td style="padding:8px 10px;font-weight:700">RevPOR/Dept</td><td style="padding:8px 10px;color:#64748b">Dept Revenue ÷ Days tracked ÷ Avg Occupied Rooms</td><td style="padding:8px 10px;color:#0369a1">Rooms: 18.50 QR/room/day</td></tr>' +
     '</table></div>' +

     '<br><strong>Why these numbers matter:</strong>' +
     ul([
       '<strong>Revenue/Room</strong> tells you how much laundry each occupied room generates on average. Useful for benchmarking against industry standards.',
       '<strong>KG/Room</strong> measures laundry weight per room — helps plan capacity and staffing.',
       'A high occupancy day with low Revenue/Room means guests are using less laundry — useful to investigate.',
       'Compare months to see if efficiency is improving.'
     ]) +

     '<strong>Occupancy % badges in the table:</strong>' +
     ul([
       badge('≥70%','#dcfce7','#15803d','#86efac') + ' Green — high occupancy day',
       badge('50–70%','#fef9c3','#92400e','#fde68a') + ' Amber — medium occupancy',
       badge('<50%','#fee2e2','#dc2626','#fca5a5') + ' Red — low occupancy day'
     ]) +

     '<strong>📥 Import/Export:</strong>' +
     ul([
       '<strong>⬇️ Download Template</strong> — Excel file with Day and Occupancy % columns.',
       '<strong>📂 Import Excel</strong> — upload filled template to populate all days at once.',
       '<strong>⬇️ Export Excel</strong> — export full benchmark report.',
       '<strong>🖨️ Print / PDF</strong> — generates PDF with all charts, table, department breakdown.'
     ]) +
     tip('Enter occupancy data at the start of each month and save. The benchmark updates automatically as you enter daily laundry data.')
    ],

    // ── 17. CURRENCY & NUMBER FORMAT ────────────────────────────
    ['💱 Currency & Number Formatting',
     '<strong>All amounts in the system use comma formatting:</strong>' +
     ul([
       '32,073.63 QR — thousands separator makes large numbers easy to read.',
       '1,234,567.89 — works for any size.',
       'Consistent across Dashboard, Entry, Finance, Monthly, Analytics, Benchmark, Reports.'
     ]) +
     '<strong>To change currency:</strong>' +
     step([
       'Click ⚙️ Settings in the top navigation bar.',
       'Click the <strong>💱 Currency</strong> tab.',
       'Type your currency symbol (QR, $, €, £, SAR, AED, KWD, or anything custom).',
       'Choose position — After (32,073.63 QR) or Before ($ 32,073.63).',
       'Choose decimal places — 0, 2, or 3.',
       'Check the <strong>Live Preview</strong> to confirm it looks right.',
       'Click <strong>💾 Save Currency Settings</strong>.'
     ]) +
     '<br><strong>Quick Select currencies available:</strong>' +
     ul([
       'QR — Qatari Riyal (default)',
       '$ USD — US Dollar (before, 2 decimals)',
       '€ EUR — Euro (before, 2 decimals)',
       '£ GBP — British Pound (before, 2 decimals)',
       'SAR — Saudi Riyal (after, 2 decimals)',
       'AED — UAE Dirham (after, 2 decimals)',
       'KWD — Kuwaiti Dinar (after, 3 decimals)'
     ]) +
     warn('Changing currency only affects how numbers are displayed. All data, calculations and stored values remain unchanged. You can switch currency anytime without any risk.') +
     tip('The currency setting syncs to Firebase — all devices (phone, tablet, other computers) automatically use the same currency format.')
    ],

    // ── 18. FORECAST ────────────────────────────────────────────
    ['🔮 Forecast — Revenue Forecasting Engine',
     '<strong>What it does:</strong> Predicts future revenue using three scientific methods — current pace, year-over-year trends, and occupancy-based modelling. Gives you a weighted forecast with a confidence rating.' +

     '<br><br><strong>How to open:</strong>' +
     step([
       'Click <strong>🔮 Forecast</strong> in the navigation bar.',
       'Select the <strong>Base Year</strong> and <strong>View</strong> type.',
       'For month views, select the <strong>Month</strong>.',
       'Click <strong>🔄 Refresh</strong> to recalculate.'
     ]) +

     '<br><strong>3 View Modes:</strong>' +
     ul([
       btn('📅 This Month','#0d1b2e','#c9a84c') + ' — detailed forecast for the current or selected month.',
       btn('📆 Next Month','#4c1d95','#fff') + ' — forecast for the upcoming month using seasonal factors.',
       btn('📊 Full Year','#0d1b2e','#c9a84c') + ' — complete month-by-month projection for the full year.'
     ]) +

     '<br><strong>🎯 Confidence Rating:</strong>' +
     ul([
       badge('High','#f0fdf4','#15803d','#86efac') + ' — 70%+ days entered AND historical data available. Most accurate.',
       badge('Medium','#fffbeb','#92400e','#fde68a') + ' — partial data or missing one source. Reasonably reliable.',
       badge('Low','#fee2e2','#dc2626','#fca5a5') + ' — limited data. Use as rough estimate only.'
     ]) +

     '<br><strong>📐 The 3 Forecast Methods explained:</strong>' +
     '<br><br><div style="background:#f8fafc;border-radius:10px;padding:16px;font-size:12px">' +
     '<table style="width:100%;border-collapse:collapse">' +
     '<tr style="background:#0d1b2e;color:#c9a84c"><th style="padding:8px 10px;text-align:left">Method</th><th style="padding:8px 10px;text-align:left">Formula</th><th style="padding:8px 10px;text-align:left">When most useful</th></tr>' +
     '<tr style="background:#fff"><td style="padding:8px 10px;font-weight:700">📈 Current Pace</td><td style="padding:8px 10px;color:#64748b">Avg daily revenue × Total days in month</td><td style="padding:8px 10px;color:#0369a1">Best when 50%+ of month entered</td></tr>' +
     '<tr style="background:#f8fafc"><td style="padding:8px 10px;font-weight:700">📅 Year-over-Year</td><td style="padding:8px 10px;color:#64748b">Same month last year × (1 + growth %)</td><td style="padding:8px 10px;color:#0369a1">Best early in month with good history</td></tr>' +
     '<tr style="background:#fff"><td style="padding:8px 10px;font-weight:700">🏨 Occupancy-Based</td><td style="padding:8px 10px;color:#64748b">RevPOR × Avg occupied rooms × Days</td><td style="padding:8px 10px;color:#0369a1">Best when benchmark data is entered</td></tr>' +
     '<tr style="background:#f5f3ff;font-weight:800"><td style="padding:8px 10px;color:#6d28d9">🎯 Weighted Final</td><td style="padding:8px 10px;color:#6d28d9">Pace 70% + YoY 30% (or reversed if early in month)</td><td style="padding:8px 10px;color:#6d28d9">Always shown — adjusts weights automatically</td></tr>' +
     '</table></div>' +

     '<br><strong>📅 This Month View includes:</strong>' +
     ul([
       '<strong>Forecasted Month Close</strong> — weighted result with color coding vs target.',
       '<strong>Actual So Far</strong> — revenue entered + active days + daily average.',
       '<strong>Last Year Same Month</strong> — comparison with YoY % change.',
       '<strong>Monthly Target</strong> — and how much per day is needed to hit it.',
       '<strong>Forecast Methodology breakdown</strong> — shows each method result and weight.',
       '<strong>Day-by-day projection table</strong> — projects each remaining day at current avg, shows running total and % of target.',
       '<strong>Department Forecast table</strong> — projected close per department with YoY comparison.'
     ]) +

     '<br><strong>📆 Next Month View includes:</strong>' +
     ul([
       '<strong>Forecast amount</strong> — using seasonal factor + YoY growth rate.',
       '<strong>Seasonal Factor</strong> — ratio of next month vs current month (from last year). Shows if next month is historically stronger or weaker.',
       '<strong>Suggested Daily Target</strong> — what you need to average per day to hit the forecast.',
       '<strong>Planning Insight</strong> — compares suggested daily vs target daily so you know if forecast covers the target or not.'
     ]) +

     '<br><strong>📊 Full Year View includes:</strong>' +
     ul([
       '<strong>Actual YTD</strong> — total revenue entered so far this year.',
       '<strong>Projected Full Year</strong> — all 12 months combined (actual for past + forecast for future).',
       '<strong>YoY comparison</strong> — projected this year vs full last year.',
       '<strong>Month-by-month table</strong> — each month with actual, forecast, last year, target, and status.',
       'Status badges: ' + badge('✅ Hit','#f0fdf4','#15803d','#86efac') + ' ' + badge('⚡ Close','#fffbeb','#92400e','#fde68a') + ' ' + badge('❌ Missed','#fee2e2','#dc2626','#fca5a5') + ' ' + badge('📍 In Progress','#eff6ff','#1d4ed8','#bfdbfe') + ' ' + badge('🔮 Projected','#f5f3ff','#6d28d9','#c4b5fd') + '',
       'Mini progress bar per month showing forecast vs best month — easy visual scan.',
       'Totals row at the bottom.'
     ]) +

     warn('Forecast accuracy improves as you enter more data. Early in the month (less than 30% days entered) the YoY method gets more weight. After 50% days entered, current pace gets more weight as it reflects real performance.') +

     tip('For best accuracy: (1) Enter data daily, (2) Set monthly targets, (3) Keep benchmark occupancy updated. All three feed the forecast engine with richer data.')
    ],

    // ── 19. PLAN NEXT YEAR ──────────────────────────────────────
    ['📋 Plan Next Year — Annual Budget Planning Tool',
     '<strong>What it does:</strong> A professional annual budget planning tool. Enter your expected growth % and occupancy % for each month of next year — the system calculates forecasted revenue and KG for all 12 months, shows totals, YoY comparison, and lets you export a finance-ready Excel sheet.' +

     '<br><br><strong>How to open:</strong>' +
     step([
       'Click <strong>🔮 Forecast</strong> tab.',
       'Change <strong>View</strong> to <strong>📋 Plan Next Year</strong>.',
       'Select your <strong>Base Year</strong> (e.g. 2026) — next year is calculated automatically.',
       'The planning table appears with all 12 months.'
     ]) +

     '<br><strong>🎯 3 Quick Scenarios:</strong>' +
     ul([
       '<span style="font-weight:700;color:#64748b">🔵 Conservative</span> — 3% growth · 0% occupancy increase. Use for pessimistic planning.',
       '<span style="font-weight:700;color:#92400e">🟡 Moderate</span> — 7% growth · +2% occupancy. Standard planning assumption.',
       '<span style="font-weight:700;color:#15803d">🟢 Optimistic</span> — 12% growth · +5% occupancy. Best-case scenario.'
     ]) +

     '<br><strong>📊 The Planning Table rows explained:</strong>' +
     '<br><br><div style="background:#f8fafc;border-radius:10px;padding:14px 16px;font-size:12px">' +
     '<table style="width:100%;border-collapse:collapse">' +
     '<tr style="background:#0d1b2e;color:#c9a84c"><th style="padding:7px 10px;text-align:left">Row</th><th style="padding:7px 10px;text-align:left">What it shows</th><th style="padding:7px 10px;text-align:left">Editable?</th></tr>' +
     '<tr style="background:#fff"><td style="padding:7px 10px;font-weight:700">Occ %</td><td style="padding:7px 10px;color:#64748b">Expected occupancy for each month of next year</td><td style="padding:7px 10px;color:#16a34a">✅ Yes — per month</td></tr>' +
     '<tr style="background:#f8fafc"><td style="padding:7px 10px;font-weight:700">Growth %</td><td style="padding:7px 10px;color:#64748b">Your target revenue growth vs same month in base year</td><td style="padding:7px 10px;color:#16a34a">✅ Yes — per month</td></tr>' +
     '<tr style="background:#fff"><td style="padding:7px 10px;font-weight:700">Occupied Rooms</td><td style="padding:7px 10px;color:#64748b">Occ% × Total rooms × Days in month</td><td style="padding:7px 10px;color:#94a3b8">Auto-calculated</td></tr>' +
     '<tr style="background:#f8fafc"><td style="padding:7px 10px;font-weight:700">Laundry Revenue</td><td style="padding:7px 10px;color:#64748b">60% growth-based + 40% occupancy-based blend</td><td style="padding:7px 10px;color:#94a3b8">Auto-calculated</td></tr>' +
     '<tr style="background:#fff"><td style="padding:7px 10px;font-weight:700">vs Base Year</td><td style="padding:7px 10px;color:#64748b">% change vs same month in base year</td><td style="padding:7px 10px;color:#94a3b8">Auto-calculated</td></tr>' +
     '<tr style="background:#f8fafc"><td style="padding:7px 10px;font-weight:700">KG Forecast</td><td style="padding:7px 10px;color:#64748b">Projected laundry weight using same blend method</td><td style="padding:7px 10px;color:#94a3b8">Auto-calculated</td></tr>' +
     '<tr style="background:#fff"><td style="padding:7px 10px;font-weight:700">vs Base Year KG</td><td style="padding:7px 10px;color:#64748b">% change in KG vs same month in base year</td><td style="padding:7px 10px;color:#94a3b8">Auto-calculated</td></tr>' +
     '</table></div>' +

     '<br><strong>🧮 The Revenue Forecast Formula:</strong>' +
     ul([
       '<strong>Growth-based:</strong> Base month revenue × (1 + Growth%)',
       '<strong>Occupancy-based:</strong> Base month revenue × (New Occ% ÷ Base Occ%)',
       '<strong>Final blend:</strong> Growth-based × 60% + Occupancy-based × 40%',
       'If no base occupancy data → uses growth-based only (100%)',
       'Same formula applies to KG forecast'
     ]) +

     '<br><strong>⚡ Quick Fill tools:</strong>' +
     ul([
       '<strong>Apply same growth % to all</strong> — type one number, click Apply → fills all 12 months at once.',
       '<strong>Apply same occ % to all</strong> — type one occupancy %, click Apply → fills all 12 months.',
       'You can then fine-tune individual months manually.'
     ]) +

     '<br><strong>💾 Save as Targets:</strong>' +
     ul([
       'Click <strong>💾 Save as Targets</strong> → saves all 12 months as monthly revenue targets in one click.',
       'These targets then appear in the Dashboard progress bar and Forecast confidence calculations.',
       'You can always update individual month targets from the Dashboard.'
     ]) +

     '<br><strong>⬇️ Export Excel:</strong>' +
     ul([
       'Exports a clean Excel file: <strong>Pearl_Budget_Plan_2027.xlsx</strong>',
       'Includes all rows: Occ%, Growth%, Revenue Forecast, vs Base Year, KG Forecast, vs Base KG.',
       'Total Year column on the right — matches the finance submission format.',
       'Add planning notes before exporting — they appear at the bottom of the sheet.'
     ]) +

     '<br><strong>🖨️ Print / PDF:</strong>' +
     ul([
       'Opens a clean print window with summary cards + full table + notes.',
       'Use browser Print → Save as PDF to share with finance team.',
       'Includes RS LaundryPro branding, preparation date, and YoY growth summary.'
     ]) +

     tip('Best workflow: (1) Select scenario, (2) Fine-tune high/low season months manually, (3) Add notes, (4) Save as Targets, (5) Export Excel for finance.')
    ],

    // ── 20. LICENCE & PROTECTION ────────────────────────────────
    ['🔑 Licence & System Protection',
     '<strong>How the protection system works:</strong>' +
     ul([
       '<strong>Domain Lock</strong> — the system only runs on approved domains. If someone copies the file and hosts it elsewhere → they see a locked screen, not the system.',
       '<strong>Licence Key</strong> — first time opening on any device, a key must be entered. Valid key → system activates. Wrong key → no access.',
       '<strong>Your data is always safe</strong> — protection only affects access. Firebase data is never touched by the licence system.'
     ]) +

     '<br><strong>🔓 First-time activation on a new device:</strong>' +
     step([
       'Open the system URL in browser.',
       'Licence activation screen appears (dark screen with lock icon).',
       'Enter your key in format: <strong>XXXX-XXXX-XXXX-XXXX</strong>',
       'Click <strong>🔓 ACTIVATE SYSTEM</strong>.',
       'Green success screen → login page appears.',
       'Key is saved on that device — never asked again.'
     ]) +

     '<br><strong>🔑 Your master key (always works):</strong>' +
     '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:14px 16px;margin:10px 0;font-size:13px;color:#15803d;text-align:center">Your master key was provided during system setup. It is stored privately — do not share it.</div>' +
     '<div style="font-size:11px;color:#64748b;margin-bottom:12px">This key never expires and always works. Keep it private — only share keys you generate for others.</div>' +

     '<br><strong>➕ Generating keys for others (e.g. another hotel):</strong>' +
     step([
       'Open ⚙️ Settings → click <strong>🔑 Licences</strong> tab (last tab).',
       'Enter the <strong>Holder Name</strong> — e.g. Hotel Al Rayyan.',
       'Set an <strong>Expiry Date</strong> (optional but recommended — e.g. 1 year from today).',
       'Click <strong>🔑 Generate Key</strong> — key appears in green, automatically copied to clipboard.',
       'Share the key with the user — format: <code>XXXX-XXXX-XXXX-XXXX</code>',
       'They enter it on their device → system activates → they can log in.',
       'You can revoke any key anytime — user loses access immediately on next open.'
     ]) +
     '<br><strong>📋 Licences panel shows:</strong>' +
     ul([
       'All generated keys with holder name and expiry date.',
       'Status badge: ' + badge('✅ Active','#f0fdf4','#15803d','#86efac') + ' · ' + badge('⏰ Expired','#fee2e2','#dc2626','#fca5a5') + ' · ' + badge('❌ Revoked','#f8fafc','#94a3b8','#e2e8f0') + '',
       'Last used date — shows when the key was last activated.',
       'Revoke button — one click to cut access.',
       'Your master key displayed at the bottom for reference.'
     ]) +

     '<br><strong>❌ Revoking access:</strong>' +
     ul([
       'Go to ⚙️ Settings → 🔑 Licences.',
       'Find the key → click <strong>Revoke</strong>.',
       'Next time that user opens the system → licence screen appears, key rejected.',
       'Their local data (if any) is unaffected — only access is blocked.'
     ]) +

     warn('Never share your master key with anyone. Always generate separate keys for each user so you can revoke individually.') +
     tip('Set an expiry date when generating keys for clients — e.g. 1 year from today. When it expires they need to renew, giving you control over annual licensing.')
    ],

    // ── 21. HOTEL SETTINGS ──────────────────────────────────────
    ['🏨 Hotel Settings — Property Name & Total Rooms',
     '<strong>Where to find:</strong> ⚙️ Settings → 🏨 Hotel tab' +
     '<br><br><strong>🏷️ Property Name:</strong>' +
     ul([
       'Set your hotel name — e.g. Pearl Hotel, Sheraton Doha, etc.',
       'This name appears throughout the system instead of the default.',
       'Saves to Firebase so all devices see the same name.'
     ]) +
     '<br><strong>🏠 Total Rooms:</strong>' +
     ul([
       'Default is <strong>161 rooms</strong> — change to your hotel\'s actual room count.',
       'Used for all occupancy % calculations throughout the system.',
       'Changes here automatically update Benchmark, Forecast and What-If.',
       'Reset to 161 button available if needed.'
     ]) +
     tip('Set your total rooms first before entering any occupancy data — all calculations depend on it.')
    ],

    // ── 22. RATES MANAGER ────────────────────────────────────────
    ['💰 Rates Manager — Versioned Prices & Weights',
     '<strong>Where to find:</strong> 💰 Rates Mgr tab' +
     '<br><br><strong>Why versioning?</strong>' +
     ul([
       'Prices and weights change over time. If you change them, old historical data must NEVER be recalculated with new values.',
       'The system uses <strong>"Values are never updated — they are versioned over time"</strong> approach.',
       'Each version is locked to its time period. Past years are read-only.'
     ]) +
     '<br><strong>📅 Rate History (default sub-tab):</strong>' +
     ul([
       'Select a year to view its rate card.',
       '<strong>🔒 LOCKED</strong> — past years, read-only, historical data protected.',
       '<strong>● ACTIVE</strong> — current year, editable.',
       '<strong>📅 FUTURE</strong> — scheduled for future year.',
       'Change log shows every version change with date and note.'
     ]) +
     '<br><strong>➕ Adding a new rate version:</strong>' +
     step([
       'Click <strong>➕ New Version</strong> button.',
       'Select year and optionally a specific month (for mid-year changes).',
       'Choose source prices to copy from (current or previous year).',
       'Enter % adjustment — e.g. 5 for +5%, -3 for -3%.',
       'Check: apply to Prices ✓ and/or Weights ✓.',
       'Add a note — e.g. "+5% increase from Jan 2026".',
       'Click <strong>👁 Preview</strong> to see before/after for every item.',
       'Click <strong>✅ Save Version</strong> to confirm.'
     ]) +
     warn('Never edit past years\' rate cards. Historical entries use locked prices stored at entry time — changing rates here does NOT affect past data.') +
     tip('Set up next year\'s rates in advance using the year selector. The system will automatically use them when that year\'s data is entered.')
    ],

    // ── 23. DAILY OCCUPANCY ──────────────────────────────────────
    ['🏨 Daily Occupancy — Enter & Track',
     '<strong>Where to enter:</strong> 🎯 Benchmark tab → Daily Occupancy grid' +
     '<br><strong>Where to view summary:</strong> 📊 Dashboard → Occupancy strip' +
     '<br><br><strong>How it works:</strong>' +
     ul([
       'Each day has TWO input fields: <strong>Rooms</strong> (number of occupied rooms) and <strong>Occ %</strong> (percentage).',
       'Enter either one — the other calculates automatically.',
       'Example: enter 120 rooms → % shows 74.5% automatically (for 161 room hotel).',
       'Or enter 74.5% → rooms shows 120 automatically.',
       'Color coded dot per day: 🟢 ≥80% · 🟡 60-79% · 🔴 <60%'
     ]) +
     '<br><strong>📊 Dashboard occupancy strip:</strong>' +
     ul([
       'Shows mini bar chart of all days in the month.',
       'Displays: Avg Occ%, Avg Rooms, Best Day.',
       'Click <strong>✏️ Edit →</strong> to jump to Benchmark for data entry.',
       'If no data — shows prompt to enter occupancy.'
     ]) +
     '<br><strong>📋 Fill Same %:</strong> apply same occupancy % to all days at once.' +
     tip('Enter occupancy daily or at end of each week. More accurate data = better RevPOR calculations and forecast accuracy.')
    ],

    // ── 24. WHAT-IF SIMULATION ───────────────────────────────────
    ['🎮 What-If Simulation',
     '<strong>Where to find:</strong> 🔮 Forecast tab → View: 🎮 What-If Simulation' +
     '<br><br><strong>What it does:</strong>' +
     ul([
       'Lets you test different scenarios before committing to a plan.',
       'Adjust sliders → all numbers recalculate instantly.',
       'Compare occupancy-based forecast vs growth-based forecast.',
       'See recommendations based on your inputs.'
     ]) +
     '<br><strong>🎛️ The 4 variables you control:</strong>' +
     ul([
       '<strong>🏨 Occupancy %</strong> — slide from 10% to 100%. See how occupancy affects revenue.',
       '<strong>📈 Growth %</strong> — from -20% to +50%. Negative = planned decline, positive = growth target.',
       '<strong>💰 RevPOR</strong> — revenue per occupied room. Historical shown for reference.',
       '<strong>🏨 Total Rooms</strong> — adjustable directly here too.'
     ]) +
     '<br><strong>📊 Results shown:</strong>' +
     ul([
       '<strong>Projected Revenue</strong> — blended 50% occupancy model + 50% growth model.',
       '<strong>Occ-Based</strong> — RevPOR × Occupied Rooms × Days.',
       '<strong>Growth-Based</strong> — Base Revenue × (1 + Growth%).',
       'vs ' + (new Date().getFullYear()-1) + ' actual and vs target (if set).'
     ]) +
     '<br><strong>💡 Recommendations panel</strong> — appears automatically based on your settings:' +
     ul([
       'Gap to target analysis — what RevPOR or occupancy needed to hit target.',
       'RevPOR vs historical benchmark — is your rate realistic?',
       'Growth rate warnings if too aggressive.',
       'Occupancy feasibility check (>92% flagged as unrealistic).'
     ]) +
     tip('Run 3 scenarios: conservative (low occ, low growth), realistic (historical), optimistic (best case). Compare all three before deciding.')
    ],

    // ── 25. RISK INDICATORS ──────────────────────────────────────
    ['🔴 Risk Indicators',
     '<strong>Where to find:</strong> 📈 Analytics tab → Risk Indicators section (above charts)' +
     '<br><br><strong>What it does:</strong>' +
     ul([
       'Analyzes each month for revenue instability and performance issues.',
       'Assigns a risk level to each month automatically.',
       'Updates every time you open Analytics.'
     ]) +
     '<br><strong>Risk levels:</strong>' +
     ul([
       badge('🟢 Low Risk','#f0fdf4','#15803d','#86efac') + ' — stable month, on track.',
       badge('🟡 Medium Risk','#fffbeb','#92400e','#fde68a') + ' — some concerns, monitor.',
       badge('🔴 High Risk','#fee2e2','#b91c1c','#fca5a5') + ' — multiple issues detected.',
       badge('🚨 Critical','#f5f3ff','#7c3aed','#c4b5fd') + ' — serious problems, investigate.'
     ]) +
     '<br><strong>What triggers risk flags:</strong>' +
     ul([
       '<strong>High variance</strong> — daily revenue is very inconsistent (coefficient of variation >60%).',
       '<strong>Below target</strong> — less than 60% of monthly target achieved.',
       '<strong>YoY decline</strong> — more than 15% below same month last year.',
       '<strong>Missing days</strong> — more than 5 days with no data entered.'
     ]) +
     tip('Review high-risk months first. Each card shows specific issues so you know exactly what to address.')
    ],

    // ── 26. REALITY CHECK ────────────────────────────────────────
    ['⚖️ Reality Check — Plan Next Year',
     '<strong>Where to find:</strong> 🔮 Forecast → Plan Next Year → below summary cards' +
     '<br><br><strong>What it does:</strong>' +
     ul([
       'Automatically checks your plan inputs against historical data.',
       'Detects unrealistic values and warns you before you commit.',
       'Updates instantly as you change growth % or occupancy values.'
     ]) +
     '<br><strong>What it checks:</strong>' +
     ul([
       '<strong>Growth > 25%</strong> — flagged as very aggressive vs historical avg.',
       '<strong>Growth < -10%</strong> — planned significant decline flagged.',
       '<strong>Occupancy > 97%</strong> — physically impossible, flagged.',
       '<strong>Occ 30%+ above historical</strong> — watch flag, may be optimistic.',
       '<strong>No base data</strong> — month with no prior year data.',
       '<strong>Overall growth > 20%</strong> — overall plan flagged as high.'
     ]) +
     '<br><strong>Result labels:</strong>' +
     ul([
       badge('✅ Looks Good','#f0fdf4','#15803d','#86efac') + ' — input is realistic.',
       badge('⚠️ Warning','#fee2e2','#b91c1c','#fca5a5') + ' — needs review.',
       badge('💡 Watch','#fffbeb','#92400e','#fde68a') + ' — monitor carefully.',
       badge('ℹ️ Info','#eff6ff','#1d4ed8','#bfdbfe') + ' — informational note.'
     ]) +
     tip('Reality Check doesn\'t prevent you from saving — it\'s advisory. Use it to stress-test your assumptions before presenting to management.')
    ],

    // ── 27. NAV DROPDOWNS ───────────────────────────────────────
    ['📋 Navigation — Reports & More Dropdowns',
     '<strong>What changed:</strong> The navigation bar now has two dropdown menus to reduce clutter.' +
     '<br><br><strong>📋 Reports ▾ dropdown contains:</strong>' +
     ul([
       '<strong>📅 Monthly Overview</strong> — full month summary & exports',
       '<strong>📄 Report & PDF</strong> — print and export reports',
       '<strong>🏦 Finance Posting</strong> — revenue posting view'
     ]) +
     '<strong>⋯ More ▾ dropdown contains:</strong>' +
     ul([
       '<strong>🛡️ Backup</strong> — cloud & local data backup',
       '<strong>💡 Help Center</strong> — full documentation & guides'
     ]) +
     '<br><strong>How to use:</strong>' +
     ul([
       'Click <strong>📋 Reports ▾</strong> or <strong>⋯ More ▾</strong> to open the dropdown',
       'Click any item inside to navigate to that tab',
       'Click anywhere outside to close the dropdown',
       'The dropdown button turns <strong style="color:#c9a84c">gold</strong> when you are on one of its tabs',
       'Both dropdowns cannot be open at the same time'
     ]) +
     tip('The main tabs that stay always visible are: Dash, Entry, Bench, Rates, Analytics, Forecast.')
    ],

    // ── 28. QUICK OCCUPANCY (DASHBOARD) ─────────────────────────
    ['🏨 Quick Occupancy Entry — Dashboard Widget',
     '<strong>Where to find:</strong> 📊 Dashboard tab → above the occupancy strip' +
     '<br><br><strong>What it does:</strong>' +
     ul([
       'Enter occupancy for ANY day of the month — not just today.',
       'Day selector dropdown shows all days with ✓ on days already saved.',
       'Saves instantly to Benchmark and Firebase — syncs everywhere.',
       'Real-time colour indicator: 🟢 ≥80% · 🟡 60-79% · 🔴 <60%'
     ]) +
     '<br><strong>How to use:</strong>' +
     step([
       'Open the <strong>📊 Dashboard</strong> tab',
       'Find the <strong>🏨 Occupancy Entry</strong> widget above the strip',
       'Use <strong>SELECT DAY</strong> dropdown — defaults to today, pick any day',
       'Days with <strong>✓</strong> already have data — selecting them loads saved values',
       'Enter <strong>Occupied Rooms</strong> (blue) → Occ% calculates automatically',
       'Or enter <strong>Occ%</strong> (green) → Rooms calculates automatically',
       'Click <strong>💾 Save</strong> — saves for that specific day instantly',
       'Click <strong>🗑</strong> to clear a day entered by mistake'
     ]) +
     '<br><strong>Stats shown below:</strong>' +
     ul([
       'Selected day — occupancy % and rooms occupied',
       'Previous day — % with ▲▼ difference in percentage points',
       'Month average — across all days with data'
     ]) +
     tip('Enter occupancy every morning — select today, enter rooms, hit Save. Takes 5 seconds and keeps all forecasts and benchmarks accurate.')
    ],

    // ── 29. CALCULATOR ──────────────────────────────────────────
    ['🧮 Quick Calculator',
     '<strong>Where to find:</strong> Click <strong>🧮 Calc</strong> button in the top navigation bar' +
     '<br><br><strong>What it does:</strong> A floating calculator available from any tab — no need to leave your current screen.' +
     '<br><br><strong>4 calculation modes:</strong>' +
     ul([
       '<strong>% Change</strong> — enter base price + % → get new price instantly. ' +
         'Quick buttons: +3.5% · +5% · +10% · -3.5% · -5%. ' +
         'Shows: new price, difference, impact per 100 items, verification %.',
       '<strong>% of Target</strong> — enter actual + target → see achievement %. ' +
         'Shows gap remaining and daily amount needed to close.',
       '<strong>Price Check</strong> — enter old price + new price → find what % was applied. ' +
         'Useful to verify: "was this really +3.5%?"',
       '<strong>General</strong> — any % calculation: A is what % of B, X% of A, A±X%, % difference.'
     ]) +
     tip('Use % Change to verify prices before applying them in the Rate Manager. Example: 15.00 + 3.5% = 15.525 QR.')
    ],

    // ── 30. BACKUP HISTORY ──────────────────────────────────────
    ['🕐 Backup History — Version Control',
     '<strong>Where to find:</strong> 🛡️ Backup tab → scroll down to the <strong>Backup History</strong> panel at the bottom.' +
     '<br><br><strong>How versioning works:</strong>' +
     ul([
       'Every time you click <strong>☁️ Save Cloud Backup Now</strong> — a new numbered version is created automatically.',
       'Last <strong>20 versions</strong> are kept — the oldest is deleted when the 21st is saved.',
       'Each version shows: version number, date & time, who saved it, years of data included, and file size.',
       '<strong>● LATEST</strong> badge marks the most recent version.'
     ]) +
     '<br><strong>Actions available per version:</strong>' +
     ul([
       btn('🔄 Restore','#eff6ff','#1d4ed8','#bfdbfe') + ' — restores that backup version. Data is <strong>merged</strong> — backup wins over local, nothing is deleted.',
       '🗑 Delete — removes the version from Firebase and the index. Not available on the latest version.',
       btn('🔄 Refresh','#f8fafc','#64748b','#e2e8f0') + ' — reloads version history fresh from Firebase.'
     ]) +
     '<br><strong>How restore works (important):</strong>' +
     ul([
       'The system saves the updated index to Firebase <strong>first</strong>, then re-renders the list. This prevents the deleted item from reappearing.',
       'Shows <strong>⏳ Deleting...</strong> while the Firebase save is in progress.',
       'If Firebase save fails, shows a warning and still updates the local view.',
       'Restore merges: backup data fills in anything missing from your local copy. Your most recent local data is preserved for any keys that exist in both.'
     ]) +
     warn('Always save a cloud backup before uploading a new version of the system to GitHub. This creates a restore point.') +
     tip('Save a backup at least once a week. The 20-version history means you can always go back to any point in the last 20 saves.')
    ],

    // ── 31. COPYRIGHT ───────────────────────────────────────────
    ['© Copyright & Ownership',
     '<div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:10px;padding:20px 24px;color:#fff;margin-bottom:12px"><div style="font-size:18px;font-weight:700;color:#c9a84c;letter-spacing:1px;margin-bottom:6px">© 2026 Reda Salah</div><div style="font-size:13px;color:rgba(255,255,255,.75);line-height:1.9">All Rights Reserved.<br><strong style="color:#fff">RS LaundryPro Laundry Management System v1.0</strong> — proprietary software created and owned by <strong style="color:#c9a84c">Reda Salah</strong>.<br>Developed for professional laundry operations management.<br>Unauthorised copying, distribution, or modification is strictly prohibited.</div></div><div style="font-size:12px;color:#6b7a8d;line-height:1.8">Intellectual property and full ownership: <strong>Reda Salah</strong><br>For support or licensing enquiries, contact the author directly.</div>'
    ],

    // ── 32. SYSTEM DIAGNOSTICS ──────────────────────────────────
    ['🩺 System Diagnostics, Self-Healing & Error Tools',
     '<strong>Where to find:</strong> ⚙️ Settings → <strong>🩺 Diagnostics</strong> (under Tools in the sidebar)' +
     '<br><br>The system has <strong>4 layers of protection</strong> that work together automatically — plus manual tools you can use anytime.' +

     '<br><br><div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:14px 16px;font-size:12px;color:#14532d;margin-bottom:4px">' +
     '<strong>✅ 100% Read-Only Guarantee</strong> — all diagnostic and monitoring tools only read data. They never save, delete, or modify anything.' +
     '</div>' +

     '<br><strong>🟢 Layer 1 — Auto-Retry on Save Failures (always on)</strong>' +
     '<br>Every time data is saved to Firebase, the system uses smart retry logic:' +
     ul([
       'If a save fails, it retries automatically — immediately, then after 2 seconds, then after 5 seconds',
       'Only if all 3 attempts fail does it show you a warning toast',
       'Applies to all entry saves, price saves, and backup saves',
       'localStorage is always saved first — so your data is safe locally even if the cloud save fails'
     ]) +

     '<br><strong>🟡 Layer 2 — Startup Validation (automatic — 3 seconds after every login)</strong>' +
     '<br>Every time you log in, 5 checks run silently in the background:' +
     ul([
       'All critical functions (18 checked) are still defined and callable',
       'Local storage is readable and writable',
       'Current year data exists in local storage',
       'Firebase database is connected',
       'Last backup is not more than 14 days old'
     ]) +
     'Results: if a serious issue is found → a yellow toast appears. All results are stored in the error log in Diagnostics for review. If data is missing, the system automatically triggers Layer 3.' +

     '<br><br><strong>🔵 Layer 3 — Auto-Recovery (triggers automatically if data is missing)</strong>' +
     '<br>If startup validation detects that your local data is empty or missing:' +
     step([
       'System silently fetches fresh data from <code>pearl/data</code> in Firebase',
       'If Firebase data is also empty, tries the <code>pearl/backup/latest</code> snapshot instead',
       'If both succeed → data is written to localStorage and all tabs re-render automatically',
       'If both fail → a <strong>self-healing restore prompt</strong> appears (see below)'
     ]) +

     '<br><strong>🔴 Layer 4 — Runtime Error Capture (always on, all sessions)</strong>' +
     '<br>All JavaScript errors that happen silently in the background are now caught and stored:' +
     ul([
       'A <strong style="color:#dc2626">red badge</strong> appears in the bottom-left corner showing the error count',
       'Click the badge → opens Settings → Diagnostics and shows the full error log',
       'Each error shows: type, message, source file, line number, stack trace, and timestamp',
       'Browser extension errors and Firebase internal noise are filtered out automatically',
       'Log covers the current session only — cleared on page refresh'
     ]) +

     '<br><br><strong>🩺 Manual Diagnostics Panel — 7 check groups, 18+ checks:</strong>' +
     ul([
       '<strong>Connectivity</strong> — Firebase SDK connected, read/write helpers available, live real-time read test with 5s timeout',
       '<strong>Local Storage</strong> — read/write test, data entry count per year, credentials cached',
       '<strong>Backup</strong> — days since last backup (warn >7, fail >14), auto-backup ran today, local vs Firebase index match',
       '<strong>Occupancy</strong> — days of occupancy saved for current month',
       '<strong>Settings</strong> — currency configured, hotel rooms set, hotel name set',
       '<strong>System Functions</strong> — all 18 critical functions defined (login, save, export, restore, sync, forecast, etc.)',
       '<strong>Firebase Live Test</strong> — actual async read from Firebase with real response data'
     ]) +
     step([
       'Click ⚙️ Settings → 🩺 Diagnostics',
       'Click ' + btn('▶ Run Diagnostics','#0d1b2e','#c9a84c') + ' — results appear within a few seconds',
       'Green ✅ = passing · Yellow ⚠️ = needs attention · Red ❌ = broken',
       'Read the detail line under each check — it tells you exactly what is wrong and what to do',
       'The Runtime Error Log below the results shows all JS errors caught this session'
     ]) +

     '<br><strong>🔃 Force Re-Sync from Firebase button:</strong>' +
     '<br>A blue button next to Run Diagnostics. One click pulls everything fresh from Firebase — entry data for all years, prices, settings, occupancy — writes it all to localStorage, then re-renders every tab.' +
     ul([
       'Use this when: data looks out of date, after switching devices, after a browser storage wipe',
       'Safe to run at any time — it only overwrites localStorage with what Firebase has',
       'Shows a summary of what was synced in the timestamp line after finishing'
     ]) +

     '<br><strong>🚨 Self-Healing Restore Prompt:</strong>' +
     '<br>If auto-recovery fails and no data is found anywhere, a floating card appears at the bottom of the screen with two options:' +
     ul([
       btn('☁️ Restore from Cloud Backup','#c9a84c','#0d1b2e') + ' — one click restore from latest backup',
       'Open Backup Tab button — takes you to the Backup tab to restore manually or import a file'
     ]) +

     '<br><strong>📋 Copy Issue Report button:</strong>' +
     '<br>Available in the Diagnostics panel and in the error log. Formats a complete issue report containing:' +
     ul([
       'All errors with timestamps, file names, and line numbers',
       'Browser info and Firebase connection status',
       'Data summary (entries per year)',
       'Copies automatically to your clipboard — paste and send'
     ]) +
     'Use this when something goes wrong and you need help. Send the copied report and it provides everything needed to diagnose and fix the issue remotely.' +

     warn('If the red error badge appears, do not ignore it. Click it, read the error, and run diagnostics. Most errors are harmless but some may indicate a problem that needs attention.') +
     tip('Run diagnostics once a week as a routine check — it takes under 10 seconds and catches issues before they become problems.')
    ],


    // ── 33. EMERGENCY RESTORE TOOL ──────────────────────────────
    ['🚨 Emergency Restore Tool — emergency_restore.html',
     '<strong>What it is:</strong> A separate standalone HTML file (<code>emergency_restore.html</code>) that can recover your data directly from Firebase using the REST API — completely independent of the main system.' +
     '<br><br>' +
     '<div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:14px 16px;font-size:12px;color:#991b1b;margin-bottom:8px">' +
     '<strong>🚨 Use this tool ONLY when:</strong> the main system will not load, you are on a new device with no data, or the normal restore functions inside the system are not working.' +
     '</div>' +
     '<strong>Key advantage over the built-in restore:</strong>' +
     ul([
       'Works without logging in — open the file directly in any browser',
       'Does not need the main system to be working at all',
       'Uses Firebase REST API directly — bypasses the Firebase SDK completely',
       'Can download your raw data as JSON even if nothing else works'
     ]) +
     '<br><strong>How to use — 3 steps:</strong>' +
     step([
       '<strong>Open</strong> <code>emergency_restore.html</code> in any browser (double-click the file)',
       '<strong>Click 🔌 Test Connection</strong> — confirms Firebase is reachable. If it fails, check your internet or Firebase rules.',
       '<strong>Choose your restore method:</strong>'
     ]) +
     '<br><strong>Available actions:</strong>' +
     ul([
       btn('🔍 Check All Data','#0284c7','#fff') + ' — shows a summary of everything in Firebase',
       btn('📊 Check Entry Data','#0284c7','#fff') + ' — shows entry data per year with entry counts',
       btn('🏨 Check Occupancy','#0284c7','#fff') + ' — shows occupancy data per month',
       btn('💾 Check Backup Versions','#0284c7','#fff') + ' — lists all saved backup versions',
       btn('✅ Restore ALL Entry Data','#16a34a','#fff') + ' — pulls all entry data from Firebase into this browser\'s localStorage',
       btn('🏨 Restore Occupancy','#16a34a','#fff') + ' — restores occupancy for all years and months',
       btn('☁️ Restore from Latest Backup','#16a34a','#fff') + ' — uses the latest cloud backup snapshot instead of live data',
       btn('⬇️ Download ALL Firebase Data','#dc2626','#fff') + ' — downloads the complete raw Firebase database as JSON'
     ]) +
     '<br><strong>After restoring:</strong>' +
     step([
       'The tool writes data directly to <code>localStorage</code> in your browser',
       'Press <strong>Cmd+Shift+R</strong> (Mac) or <strong>Ctrl+Shift+R</strong> (Windows) to hard-refresh',
       'Open your main RS LaundryPro system — data should appear immediately',
       'If it does not appear, use the <strong>🔃 Force Re-Sync</strong> button in Settings → Diagnostics'
     ]) +
     '<br><strong>Firebase Rules note:</strong>' +
     '<br>If the connection test fails with a permission error, your Firebase rules may require authentication. Temporarily set rules to public read, restore your data, then change them back:' +
     '<div style="background:#f1f5f9;border-radius:8px;padding:12px 14px;font-family:monospace;font-size:12px;color:#0369a1;margin:8px 0">' +
     '{"rules":{".read":true,".write":true}}' +
     '</div>' +
     warn('Change Firebase rules back to authenticated access after you finish the emergency restore. Open rules: Firebase Console → Realtime Database → Rules → Publish.') +
     tip('Keep the emergency_restore.html file saved separately from the main system — on your desktop, USB drive, or email it to yourself. If the main system ever breaks, you want this file available even without internet access to the main system.')
    ],

    // ── 34. MISSING DEPARTMENT ALERTS ──────────────────────────
    ['⚠️ Missing Department Alerts',
     '<strong>What it does:</strong> Automatically checks every day whether all required departments have data entered. If any are missing, a notification banner appears at the top of the screen.' +
     '<br><br><strong>When it checks:</strong>' +
     ul([
       '<strong>Morning (on login)</strong> — checks all previous days in the current month up to yesterday. If any required department has no entries for any past day, you see the alert immediately.',
       '<strong>Evening at 8:00 PM</strong> — checks again including today. If you forgot to enter data for today\'s required departments, the alert appears automatically.'
     ]) +
     '<br><strong>Required departments (your configuration):</strong>' +
     ul([
       '<strong>Rooms Linen</strong> — required every day',
       '<strong>F &amp; B</strong> — required every day',
       '<strong>Spa &amp; Pool</strong> — required every day',
       '<strong>Uniform</strong> — required every day',
       '<strong>Others</strong> — NOT required (skipped)',
       '<strong>Dry Cleaning</strong> — NOT required (skipped)'
     ]) +
     '<br><strong>What the alert shows:</strong>' +
     ul([
       'Each department with missing data and which days are affected',
       'A <strong>✏️ Go to Entry</strong> button that takes you directly to the entry tab',
       'A <strong>⚙️ Configure</strong> button to change which departments are required',
       'Auto-dismisses after 30 seconds if you don\'t interact with it'
     ]) +
     '<br><strong>How to configure required departments:</strong>' +
     step([
       'Click <strong>⚙️ Configure</strong> on any missing alert banner',
       'Tick or untick departments in the list',
       'Click <strong>💾 Save</strong> — takes effect immediately',
       'The system re-checks right away with your new settings'
     ]) +
     warn('The system only alerts on past days and today — never on future days. If Others or Dry Cleaning have no data it is completely ignored unless you add them to the required list.') +
     tip('If a department genuinely has no laundry on a particular day (e.g. Spa is closed), just enter zeros or use the ✕ dismiss button. The alert is a reminder, not a block — you can always dismiss and continue.')
    ],

    // ── 35. MONTHLY PRICE MANAGER ────────────────────────────
    ['💰 Monthly Price Manager',
     '<strong>What it is:</strong> An independent price table per month. Each month can have its own prices completely isolated from every other month. Changing May prices never affects April or June.' +
     '<br><br><strong>How to open it:</strong> Go to <strong>Prices</strong> tab → click <strong>📅 Monthly Price Manager</strong> button in the top right.' +
     '<br><br><strong>What you see:</strong>' +
     ul([
       '<strong>✅ Monthly prices set</strong> — this month has its own independent price table',
       '<strong>⚠️ Uses year prices</strong> — this month falls back to the year base prices',
       '<strong>Future month</strong> — no action needed until that month arrives'
     ]) +
     '<br><strong>Two actions per month:</strong>' +
     ul([
       '<strong>🔒 Lock Entries</strong> — permanently stamps the current price onto every saved entry in that month. After locking, revenue for that month is frozen forever regardless of any future price changes.',
       '<strong>📋 Set Prices</strong> — creates an independent price table for that month. Enter a % change from the previous month (e.g. 3.5 for +3.5%, 0 to copy exactly, -2 for -2%).'
     ]) +
     '<br><strong>Safe price change workflow (use this every time):</strong>' +
     step([
       'Open 📅 Monthly Price Manager',
       'Click 🔒 Lock Entries on all past months that have data',
       'Click 📋 Set Prices on the new month and enter the % change',
       'Done — the new month has new prices, all past months are frozen'
     ]) +
     warn('Always lock past months BEFORE setting new prices. The system warns you automatically if you have unlocked past months when you open the manager.') +
     tip('The manager shows a red warning banner listing any past months that have data but are not yet locked. Always clear that warning before proceeding.')
    ],

    // ── 36. PRICE CHANGE — STEP BY STEP ─────────────────────
    ['🔄 Changing Prices for a New Month',
     '<strong>Scenario:</strong> You want to change prices starting May 1 without affecting January–April data.' +
     '<br><br><strong>Step-by-step:</strong>' +
     step([
       'Go to <strong>Prices</strong> tab → click <strong>📅 Monthly Price Manager</strong>',
       'Check the red warning banner — if Jan, Feb, Mar, Apr are listed as unlocked, click 🔒 Lock Entries on each one first',
       'Find May in the list → click <strong>📋 Set Prices</strong>',
       'Enter the % change (e.g. <strong>3.5</strong> for +3.5% from April, <strong>0</strong> to copy April prices exactly)',
       'Click <strong>✅ Create May Prices</strong>',
       'May now shows <strong>✅ Monthly prices set</strong>',
       'Go to Entry tab → select any May day → confirm prices show the new values'
     ]) +
     '<br><strong>To verify it worked:</strong>' +
     ul([
       'Entry tab → April day → price should be the old value',
       'Entry tab → May 1 → price should be the new value',
       'Both months are completely independent'
     ]) +
     tip('You can do this for any month at any time — not just at the start of the month. Even if you have already entered May data, you can still set May prices and re-save those entries to lock them at the new price.') +
     warn('If you enter May data BEFORE setting May prices, those entries will use the year prices. After setting May prices, re-open and re-save each day to lock the correct price.')
    ],

    // ── 37. ANNUAL REPORT ────────────────────────────────────
    ['📊 Annual Report',
     '<strong>What it shows:</strong> A complete year view — revenue, KG, volume, department performance, and top items — all in one management-level report.' +
     '<br><br><strong>How to open:</strong> Click <strong>Reports ▾</strong> in the nav → <strong>Annual Report</strong>. Select the year from the dropdown.' +
     '<br><br><strong>7 sections in the report:</strong>' +
     ul([
       '<strong>Year at a Glance</strong> — 6 summary cards: Total Revenue, Total KG, Total Pieces, Avg Monthly Revenue, Avg Daily KG, Months Active',
       '<strong>Monthly Breakdown Table</strong> — all 12 months with Revenue, KG, Pieces, Avg Daily Revenue, Avg Daily KG, and a column per department. Current month is highlighted.',
       '<strong>Revenue Trend Chart</strong> — bar chart of all 12 months. Current month shown in gold.',
       '<strong>Department Performance</strong> — each department with Revenue, % of total (visual bar), KG, Pieces, Avg per Piece, KG per Piece',
       '<strong>Top 10 Items by Revenue</strong> — which items generated the most revenue this year',
       '<strong>Top 10 Items by Volume</strong> — which items had the highest piece count',
       '<strong>Top 10 Items by Weight</strong> — which items were heaviest in total KG'
     ]) +
     '<br>All calculations use monthly price versions — so revenue is accurate even when prices changed mid-year.' +
     '<br><br>Click <strong>🖨️ Print / PDF</strong> to print or save as a PDF for management reporting.' +
     tip('Use the Annual Report at the end of each month to track year-to-date performance. The Monthly Breakdown table highlights the current month so you can see exactly where you are in the year.')
    ],

    // ── 38. MONTHLY DETAIL REPORT ────────────────────────────
    ['📅 Monthly Detail Report',
     '<strong>What it shows:</strong> A full breakdown of one month — every item, every day, quantities entered, prices, revenue, and KG per department.' +
     '<br><br><strong>How to open:</strong> Click <strong>Reports ▾</strong> → <strong>Monthly Overview</strong>. Select month and department.' +
     '<br><br><strong>What\'s in the report:</strong>' +
     ul([
       '<strong>Dept summary cards</strong> at the top — one card per department showing Revenue, KG, Pieces at a glance',
       '<strong>Price column</strong> — shows the actual monthly price for each item (correct for that month)',
       '<strong>KG/pc column</strong> — weight per piece',
       '<strong>Daily quantity columns</strong> — one column per day of the month',
       '<strong>Pcs total</strong> — total pieces for the month per item',
       '<strong>Revenue column</strong> — total revenue per item',
       '<strong>KG total column</strong> — total kilograms per item'
     ]) +
     '<br><strong>Export options:</strong>' +
     ul([
       '<strong>📊 Excel (.xlsx)</strong> — full monthly table with all items',
       '<strong>🖨️ PDF / Print</strong> — print or save as PDF',
       '<strong>📄 CSV</strong> — raw data for spreadsheets'
     ]) +
     tip('Use the department filter to focus on one department at a time. When All Departments is selected, dept summary cards appear at the top for a quick overview before the detail tables.')
    ],

    // ── 39. BACKUP — PRICES RESTORE ──────────────────────────
    ['💰 Restoring Prices from Backup',
     '<strong>What it does:</strong> Restores ONLY the prices from a previous backup version. Entry data (quantities, daily records) is completely untouched.' +
     '<br><br><strong>When to use it:</strong> If prices were accidentally changed and your revenue calculations are wrong, use this to instantly restore prices from any backup version.' +
     '<br><br><strong>How to use:</strong>' +
     step([
       'Go to <strong>Backup</strong> tab',
       'In the Backup History section, find a version from before the price change',
       'Click <strong>💰 Prices</strong> next to that version (not 🔄 Data)',
       'Confirm in the dialog that appears',
       'Prices are restored and the price schedule is cleared automatically',
       'Check Entry tab to confirm prices are correct'
     ]) +
     '<br><strong>Two restore buttons per backup version:</strong>' +
     ul([
       '<strong>🔄 Data</strong> — restores entry data (quantities, daily records). Use this if data was lost.',
       '<strong>💰 Prices</strong> — restores only prices and price schedule. Use this if prices were wrong.'
     ]) +
     warn('The 💰 Prices restore clears the current price schedule. Any scheduled price changes will need to be re-applied after the restore.') +
     tip('Always take a cloud backup before changing prices. That way you always have a recent version to restore from if anything goes wrong.')
    ],


    // ── 40. CURRENCY & EXCHANGE RATES ───────────────────────
    ['💱 Currency & Exchange Rates',
     '<strong>Two separate things:</strong> The display currency (what symbol shows everywhere in the system) and the exchange rates (for converting QAR amounts to other currencies). They are independent — you can display in QAR and still convert to USD on demand.' +
     '<br><br><strong>How to open:</strong> Settings → Currency tab. The panel has three sections.' +
     '<br><br><strong>Section 1 — Display Currency</strong>' +
     ul([
       'Change the symbol shown everywhere (QR, $, €, etc.)',
       'Set position — before or after the number',
       'Set decimal places (0, 2, or 3)',
       'Quick select buttons for common currencies',
       'Click <strong>💾 Save Display Currency</strong> to apply — syncs to all devices'
     ]) +
     '<br><strong>Section 2 — Exchange Rates</strong>' +
     ul([
       'Eight currencies with editable rates: USD, EUR, GBP, SAR, AED, KWD, EGP, INR',
       'Rates are stored as <strong>how many QAR = 1 unit</strong> of that currency (e.g. 1 USD = 3.64 QAR)',
       'Update any rate — just type the new value and click <strong>💾 Save Exchange Rates</strong>',
       'Rates are synced to Firebase so every device uses the same rates',
       'A <strong>Rate Update Reminder</strong> dropdown lets you choose how often to be reminded to check rates: Off, 1 week, 2 weeks, or 1 month'
     ]) +
     '<br><strong>Section 3 — Quick Converter</strong>' +
     ul([
       'Type any QAR amount and see it instantly converted to all 8 currencies side by side',
       'Updates live as you type — no button to press',
       'Useful when someone asks you about a specific amount'
     ]) +
     tip('The default rates are approximate. Always update them to match your bank or hotel finance rates before using for reporting.')
    ],

    // ── 41. CONVERTING REVENUE TO OTHER CURRENCIES ──────────
    ['💱 Converting Revenue to Other Currencies',
     '<strong>Scenario:</strong> Someone asks "what was March revenue in USD?" — you can answer in 2 seconds.' +
     '<br><br><strong>Three places to convert instantly:</strong>' +
     ul([
       '<strong>Dashboard</strong> — click <strong>💱 Convert Revenue</strong> button in the top right. Shows the current month total in all 8 currencies.',
       '<strong>Monthly Detail report</strong> — click <strong>💱 View in USD / EUR...</strong>. Shows that month total in all currencies.',
       '<strong>Annual Report</strong> — click <strong>💱 Year Total in USD / EUR...</strong>. Shows the full year revenue in all currencies.'
     ]) +
     '<br>Each button opens a popup showing the QAR amount converted to all 8 currencies at once. A link at the bottom lets you update rates if needed.' +
     '<br><br><strong>Example:</strong>' +
     ul([
       'March revenue: 48,250 QAR',
       'USD: $ 13,255.49',
       'EUR: € 12,092.73',
       'GBP: £ 10,489.13',
       'SAR: 49,742.27 SAR'
     ]) +
     warn('Conversions are based on the rates you set manually in Settings → Currency. They are NOT live rates. Always update rates regularly to keep conversions accurate.') +
     tip('Set up a monthly reminder in Settings → Currency → Rate Update Reminder. This way you never forget to check if exchange rates have changed significantly.')
    ],

    // ── 42. RATE UPDATE REMINDER ────────────────────────────
    ['⏰ Exchange Rate Reminder',
     '<strong>What it does:</strong> Automatically reminds you to check and update exchange rates on a schedule you set. The reminder appears as a small banner in the bottom-right corner of the screen.' +
     '<br><br><strong>How to set it up:</strong>' +
     step([
       'Go to Settings → Currency tab',
       'In Section 2 (Exchange Rates), find the <strong>Rate Update Reminder</strong> dropdown',
       'Choose: Off / 1 week / 2 weeks / 1 month',
       'Click <strong>💾 Save Exchange Rates</strong>',
       'The system now tracks when you last saved rates and reminds you automatically'
     ]) +
     '<br><strong>What the reminder looks like:</strong><br>' +
     '<div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:9px;padding:12px;margin:10px 0;font-size:12px">' +
     '💱 <strong>Exchange Rates Need Update</strong><br>' +
     'Rates were last updated <strong>14 days ago</strong>. Check they are still accurate.<br>' +
     '<em>Two buttons: Update Now (opens Settings) · Later (dismisses)</em>' +
     '</div>' +
     '<br><strong>Behaviour:</strong>' +
     ul([
       'Shows 8 seconds after login — never during work',
       'Shows maximum once per day — not every login',
       'Auto-dismisses after 20 seconds if you do not interact',
       'Clicking <strong>Update Now</strong> takes you directly to the Currency settings panel',
       'Clicking <strong>Later</strong> dismisses it until tomorrow'
     ]) +
     tip('Set the reminder to 2 weeks — that is usually the right balance. Exchange rates do not change dramatically day to day, but checking every 2 weeks keeps your reports accurate.')
    ],


    // ── 43. DEPARTMENTS & ITEMS TAB ─────────────────────────────
    ['📦 Departments & Items Tab',
     'A dedicated tab in the main navigation for managing all departments and their items. Access it from the top nav bar: <strong>📦 Items</strong>.' +
     '<br><br><strong>What you can do:</strong>' +
     ul([
       'View all departments with their item count',
       'Edit any item — name, price, and weight — inline',
       'Add new items to any department',
       'Delete items (historical data is preserved)',
       'Add entirely new departments',
       'Rename custom departments',
       'Delete custom departments you created'
     ]) +
     warn('Built-in departments (Rooms Linen, F&B, Spa & Pool, Uniform, Others, Dry Cleaning) cannot be renamed or deleted — only their items can be edited. This protects your historical data structure.') +
     tip('All changes sync to Firebase automatically so every device sees the latest items immediately.')
    ],

    // ── 44. EDITING ITEMS ────────────────────────────────────────
    ['✏️ Editing Items in a Department',
     '<strong>How to edit items:</strong>' +
     step([
       'Go to <strong>📦 Items</strong> tab',
       'Find the department you want to edit',
       'Click <strong>Edit Items →</strong> on the department card',
       'The item editor opens below — all items are shown in a table',
       'Click any field to edit: name, price (QR), or weight (KG)',
       'Changes are tracked automatically as you type',
       'Click <strong>💾 Save All Changes</strong> when done'
     ]) +
     '<br><strong>Price field:</strong> 4 decimal places (e.g. 1.5525 QR). This is the base price — you can still override per month in the Price Manager.' +
     '<br><strong>Weight field:</strong> 3 decimal places (e.g. 1.151 KG per item).' +
     '<br><br><strong>Adding a new item:</strong>' +
     step([
       'Open the editor for the department',
       'Click <strong>+ Add Item</strong>',
       'Enter the name, price, and weight when prompted',
       'The item appears at the bottom of the list',
       'Click <strong>💾 Save All Changes</strong> to confirm'
     ]) +
     tip('Prices set here are the BASE prices. If you have a monthly price version set in the Price Manager, those take priority during entry.')
    ],

    // ── 45. ADDING A NEW DEPARTMENT ─────────────────────────────
    ['🏢 Adding a New Department',
     'You can create a new department for any new laundry category — for example if the hotel opens a new outlet or service.' +
     '<br><br><strong>How to add a department:</strong>' +
     step([
       'Go to <strong>📦 Items</strong> tab',
       'Click <strong>🏢 Add Department</strong> button in the top right',
       'Enter the department name (e.g. "New Outlet")',
       'Choose an emoji icon',
       'Add items — one per line in the format: <code>Item Name, price, weight</code>',
       'Example: <code>Bath Towel, 1.05, 0.756</code>',
       'Click <strong>Add Department</strong>'
     ]) +
     '<br>The new department immediately appears in:' +
     ul([
       'Entry tab — department selector and tabs',
       'Dashboard — department breakdown',
       'Reports — all monthly and annual reports',
       'Prices tab — price management',
       'Finance Posting — department columns'
     ]) +
     warn('You must add at least one item to create a department. You can always add more items later through the Edit Items panel.')
    ],

    // ── 46. DELETING ITEMS & DEPARTMENTS ────────────────────────
    ['🗑 Deleting Items and Departments',
     '<strong>Deleting an item:</strong>' +
     ul([
       'Open the department editor (📦 Items → Edit Items →)',
       'Click the 🗑 red button next to the item',
       'Confirm the deletion',
       'Click 💾 Save All Changes'
     ]) +
     warn('Deleting an item removes it from future data entry. All historical quantities and revenue for that item remain safe in your data — they are not deleted.') +
     '<br><strong>Deleting a department:</strong>' +
     ul([
       'Only custom departments (ones you created) can be deleted',
       'Built-in departments are protected',
       'Click the 🗑 button on the department card',
       'A warning shows the number of items that will be removed',
       'Confirm to proceed'
     ]) +
     warn('Like items, deleting a department only removes it from future use. All historical data for that department is preserved in your backups and existing monthly records.') +
     tip('If you just want to stop using a department temporarily, you can use Tab Access in Settings to hide it from the entry form without deleting it.')
    ],


    // ── 47. PRICE INTEGRITY SYSTEM ──────────────────────────────
    ['🔒 How Prices Are Protected',
     'The system uses a <strong>Price Integrity System</strong> to make sure you always see the correct monthly prices — even after a browser refresh, cache clear, or switching devices.' +
     '<br><br><strong>How it works:</strong>' +
     ul([
       '<strong>Firebase is the master</strong> — monthly prices are always verified against Firebase when you open the Entry tab',
       '<strong>localStorage is a cache only</strong> — used for fast loading but always checked against Firebase',
       '<strong>Auto-sync on login</strong> — every time you log in, the system pulls current month prices from Firebase before anything renders',
       '<strong>Background verification</strong> — prices are silently re-verified from Firebase every time you open the Entry tab'
     ]) +
     '<br><strong>What you will see:</strong>' +
     ul([
       '✅ No banner = prices are verified and correct',
       '🟡 Gold banner = prices loaded locally, verifying with cloud (normal, disappears in seconds)',
       '🔴 Red banner = monthly prices not found — base year prices being used (action required)'
     ]) +
     warn('If prices look wrong, click the Sync Now button in the Entry tab banner, or go to Prices tab to re-apply monthly prices.')
    ],

    // ── 48. WHAT TO DO IF PRICES ARE WRONG ──────────────────────
    ['⚠️ What To Do If Prices Look Wrong',
     'If you notice prices in the Entry tab look higher than expected (e.g. showing 1.5750 instead of 1.5525 for April):' +
     step([
       'Look at the top of the Entry tab — is there a red or gold banner?',
       'If yes: click <strong>🔄 Sync Now</strong> in the banner',
       'If prices still look wrong after sync: go to <strong>⚙️ Prices → Monthly Price Manager</strong>',
       'Select the month and click <strong>Apply Monthly Prices</strong>',
       'Return to Entry tab — prices should now be correct'
     ]) +
     '<br><strong>Why this happens (rare cases):</strong>' +
     ul([
       'Browser cleared localStorage automatically (common on iOS Safari)',
       'First time opening on a new device or browser',
       'Firebase connection was briefly unavailable during login'
     ]) +
     tip('The system now auto-recovers from all of these cases. The 🔄 Sync Now button is a manual override for edge cases.')
    ],

    // ── 49. REVENUE TARGET PERSISTENCE ─────────────────────────
    ['🎯 Revenue Target — How It Is Saved',
     'The monthly revenue target is saved in both localStorage and Firebase. If localStorage is cleared (browser cache, new device), the target is automatically restored from Firebase on your next login.' +
     '<br><br><strong>Setting a target:</strong>' +
     ul([
       'Go to Dashboard',
       'Click directly on the TARGET number in the Revenue Target bar',
       'Type the new value and press Enter or click away',
       'Use the +1k / +5k / +10k buttons for quick adjustments',
       'Saves automatically — no Save button needed'
     ]) +
     tip('The target is saved per month. You can set different targets for each month. Once set, it persists permanently in Firebase and will always reload correctly even if you clear your browser.')
    ],


    // ── 50. APP NAME & HOTEL SETTINGS ─────────────────────────
    ['🏨 Property Name & App Settings',
     'RS LaundryPro supports custom hotel names so the system can be used at any property.' +
     '<br><br><strong>How to set your hotel name:</strong>' +
     step([
       'Go to <strong>⚙️ Settings</strong> (gear icon or Settings menu)',
       'Click <strong>Hotel</strong> in the left sidebar',
       'Type your property name in the <strong>Property Name</strong> field',
       'Click <strong>💾 Save Name</strong>',
       'The name updates immediately in the nav bar, page title, and reports'
     ]) +
     '<br><strong>Where the name appears:</strong>' +
     ul([
       'Navigation bar — top left brand name',
       'Browser tab title',
       'Monthly and annual report headers',
       'About screen'
     ]) +
     tip('The property name is saved to Firebase and syncs to all devices automatically. Every computer or phone that opens the system will show the same hotel name.')
    ],

    // ── 51. USING RS LAUNDRYPRO AT A NEW HOTEL ──────────────────
    ['🏩 Using RS LaundryPro at a New Hotel',
     'RS LaundryPro is designed to work at any hotel — not just one property.' +
     '<br><br><strong>To set up at a completely new hotel:</strong>' +
     step([
       'Get a fresh copy of the RS LaundryPro file (index.html)',
       'Create a new Firebase project at console.firebase.google.com (free)',
       'Update the 3 Firebase config lines at the top of the file with the new project details',
       'Upload the file to a new GitHub Pages or Netlify link',
       'Log in and go to Settings → Hotel to set the new property name and room count',
       'Go to ⚙️ Prices to set up the correct prices for that hotel',
       'Done — completely separate system with no connection to the previous hotel'
     ]) +
     '<br><strong>Each hotel deployment has its own:</strong>' +
     ul([
       'Firebase database — completely isolated data',
       'Admin password and team accounts',
       'Prices, departments, and items',
       'Revenue targets and occupancy data',
       'Backups and audit log',
       'Licence key'
     ]) +
     warn('Never use the same Firebase project for two different hotels — their data would mix. Always create a fresh Firebase project for each new property.')
    ],

    // ── 52. KG TOTALS ────────────────────────────────────────────
    ['⚖️ KG Totals — Whole Numbers',
     'All KG totals throughout the system are displayed as whole numbers (e.g. <strong>1742 kg</strong> not 1741.4 kg). This makes it easier to report to finance and operations teams.' +
     '<br><br><strong>What is rounded:</strong>' +
     ul([
       'Day total KG in the entry stats',
       'Department KG subtotals',
       'Monthly KG totals in reports',
       'Calendar day KG values',
       'Analytics and benchmark KG cards'
     ]) +
     '<br><strong>What stays precise (not rounded):</strong>' +
     ul([
       'Individual item weights in the entry table (e.g. 0.756 kg per Bath Towel)',
       'Weight column in the Prices tab',
       'KG per room rates in Benchmark (e.g. 1.234 kg/room)'
     ]) +
     tip('The underlying calculation always uses full precision. Rounding only happens at the display level — your data accuracy is never affected.')
    ],

    // ── 53. OCCUPANCY — DASHBOARD & BENCHMARK SYNC ──────────────
    ['🏨 Occupancy — Dashboard & Benchmark Sync',
     'Occupancy data entered in the <strong>Benchmark</strong> tab automatically appears on the <strong>Dashboard</strong>, and vice versa. They are fully in sync.' +
     '<br><br><strong>Two ways to enter occupancy:</strong>' +
     ul([
       '<strong>Dashboard</strong> — compact single-day entry with rooms and % fields. Good for entering today occupancy quickly.',
       '<strong>Benchmark tab</strong> — full monthly grid showing all 30/31 days at once. Good for entering a whole month of occupancy.'
     ]) +
     '<br><strong>How the sync works:</strong>' +
     ul([
       'Enter occupancy % in Benchmark → automatically converts to rooms count and saves to dashboard storage',
       'Enter rooms in Dashboard → automatically updates benchmark calculations',
       'Both sync to Firebase so all devices see the same occupancy data'
     ]) +
     tip('The easiest workflow: enter the full month of occupancy in the Benchmark tab at the start of each month, then update individual days on the Dashboard as needed throughout the month.')
    ],

    // ── 54. TAB NAVIGATION ──────────────────────────────────────
    ['🗂 Tab Navigation & Speed',
     'The system has a 30-second tab cache to keep navigation fast. Here is how it works:' +
     '<br><br>' +
     ul([
       '<strong>First visit to a tab</strong> — loads and renders fully',
       '<strong>Return within 30 seconds</strong> — instant, no re-render needed',
       '<strong>Return after 30 seconds</strong> — refreshes with latest data',
       '<strong>Dashboard & Entry</strong> — always refresh immediately (you are actively changing data there)'
     ]) +
     '<br><strong>If a tab seems stuck or showing old data:</strong>' +
     step([
       'Click away to another tab',
       'Wait 3 seconds',
       'Click back — it will force a fresh render'
     ]) +
     tip('Analytics, Forecast and Report tabs may take 1-2 seconds on first open as they process all your monthly data. This is normal and only happens on the first visit — subsequent visits within 30 seconds are instant.')
    ],


    // ── 55. ABOUT RS LAUNDRYPRO v1.0 ────────────────────────────
    ['🎉 RS LaundryPro v1.0 — Official Release',
     '<div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:12px;padding:20px 24px;color:#fff;margin-bottom:16px;text-align:center">' +
     '<div style="font-size:28px;font-weight:900;color:#c9a84c;letter-spacing:2px;margin-bottom:4px">RS LaundryPro</div>' +
     '<div style="font-size:14px;color:rgba(255,255,255,.7);letter-spacing:3px;text-transform:uppercase">Version 1.0 — Production Release</div>' +
     '</div>' +
     '<strong>What is RS LaundryPro?</strong><br>' +
     'RS LaundryPro is a professional laundry management system built for luxury hotel operations. ' +
     'It tracks daily laundry quantities, revenue, KG, occupancy, and performance across all departments.' +
     '<br><br><strong>What is included in v1.0:</strong>' +
     ul([
       '<strong>12 tabs</strong> — Dashboard, Daily Entry, Monthly, Report & PDF, Finance Posting, Benchmark, Prices, Items, Analytics, Forecast, Backup, Help Center',
       '<strong>Real-time Firebase sync</strong> — all data syncs instantly across all devices',
       '<strong>Price integrity system</strong> — monthly prices verified from Firebase on every session',
       '<strong>Year Health panel</strong> — 5-point monthly checklist for operations closure',
       '<strong>Smart missing alerts</strong> — detects missing data entries automatically',
       '<strong>Revenue target tracking</strong> — with progress bar and daily pace calculation',
       '<strong>Benchmark & RevPOR</strong> — revenue and KG per occupied room analysis',
       '<strong>FX converter</strong> — convert revenue to 8 currencies',
       '<strong>Department & Items management</strong> — full CRUD for departments and items',
       '<strong>Multi-device support</strong> — desktop, tablet, and mobile',
       '<strong>Custom hotel branding</strong> — property name throughout the system',
       '<strong>Licence system</strong> — secure access control',
       '<strong>54-section Help Center</strong> — full documentation and user manual'
     ]) +
     '<br>' +
     tip('v1.0 is the first official production release. Future updates will be v1.1, v1.2 etc. for new features, and v1.0.1, v1.0.2 for fixes.')
    ],

    // ── 56. VERSION HISTORY ──────────────────────────────────────
    ['📋 Version History',
     '<div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:4px">' +
     '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
     '<div style="font-size:14px;font-weight:800;color:#0d1b2e">v1.0</div>' +
     '<div style="font-size:11px;color:#94a3b8">April 2026</div>' +
     '</div>' +
     '<div style="font-size:12px;color:#64748b;line-height:1.8">' +
     'First official production release.<br>' +
     'Built for Four Seasons Pearl Hotel Doha.<br>' +
     'Complete laundry operations management system.' +
     '</div>' +
     '</div>' +
     '<br>' +
     '<strong>Owner & Developer:</strong> Reda Salah<br>' +
     '<strong>Built:</strong> 2025–2026<br>' +
     '<strong>Technology:</strong> HTML · JavaScript · Firebase Realtime Database · GitHub Pages<br>' +
     '<strong>Licence:</strong> Proprietary — all rights reserved' +
     '<br><br>' +
     warn('Unauthorised copying, distribution, or modification of RS LaundryPro is strictly prohibited. This system is the intellectual property of Reda Salah.')
    ],


    // ── 57. ADDING ITEMS — DATA SAFETY ──────────────────────────
    ['⚠️ Adding Items — Important Data Safety Rules',
     'Understanding how item data is stored is critical to keeping your historical records accurate.' +
     '<br><br><strong>How data is stored:</strong>' +
     '<br>Each item quantity is saved using its <strong>position number</strong> in the list (index 0, 1, 2, 3...). ' +
     'For example: Rooms Linen item 0 = King Bottom Sheet, item 1 = King Top Sheet XL, and so on.' +
     '<br><br><div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;padding:14px 16px;margin:10px 0">' +
     '<div style="font-size:13px;font-weight:800;color:#92400e;margin-bottom:8px">⚠️ CRITICAL RULES</div>' +
     '<div style="font-size:12px;color:#92400e;line-height:1.9">' +
     '✅ <strong>Safe:</strong> Add new items — always at the bottom of the list<br>' +
     '✅ <strong>Safe:</strong> Edit item name, price, or weight<br>' +
     '❌ <strong>NEVER:</strong> Delete an existing item that has historical data<br>' +
     '❌ <strong>NEVER:</strong> Reorder or move existing items up or down<br>' +
     '❌ <strong>NEVER:</strong> Insert a new item in the middle of the list' +
     '</div></div>' +
     '<br><strong>Why this matters:</strong><br>' +
     'If you move "King Bottom Sheet" from position 0 to position 5, all historical data that was saved ' +
     'at position 0 would now show against the wrong item. Your January numbers would be wrong.' +
     '<br><br><strong>What happens when you add a new item at the bottom:</strong>' +
     ul([
       'It appears immediately in the Entry tab for all months',
       'Past months show 0 quantity for the new item — which is correct (it did not exist yet)',
       'Current and future months can have quantities entered for it',
       'Revenue and KG calculations update automatically'
     ]) +
     '<br><strong>What if I need to remove an item no longer used?</strong><br>' +
     'Do not delete it. Instead, just enter 0 for that item going forward. ' +
     'You can rename it to something like "(Discontinued) King Bottom Sheet" so you know not to use it.' +
     tip('The system shows a warning banner every time you open the item editor as a reminder of these rules.')
    ],

    // ── 58. NEW DEPARTMENTS — WHERE THEY APPEAR ──────────────────
    ['🏢 New Departments — Where They Appear',
     'When you add a new department in the <strong>📦 Items</strong> tab, it appears immediately everywhere in the system:' +
     ul([
       '<strong>Entry tab</strong> — department dropdown selector and department tabs',
       '<strong>Dashboard</strong> — department breakdown panel and daily summary',
       '<strong>Monthly report</strong> — department columns',
       '<strong>Finance Posting</strong> — department columns',
       '<strong>Analytics</strong> — department breakdown charts',
       '<strong>Prices tab</strong> — department selector for price management',
       '<strong>Benchmark</strong> — included in totals'
     ]) +
     '<br><strong>For past months:</strong><br>' +
     'The new department shows with 0 quantities for all past days — which is correct. ' +
     'You can go back and enter historical data for past months if needed.' +
     '<br><br><strong>Department rules:</strong>' +
     ul([
       'Built-in departments (Rooms Linen, F&B, Spa & Pool, Uniform, Others, Dry Cleaning) cannot be deleted or renamed — they are protected',
       'Custom departments you create can be renamed or deleted',
       'Deleting a department removes it from future entry only — historical data is preserved in backups'
     ]) +
     warn('Before adding a new department, make sure the name is final. Renaming later is possible for custom departments but will not update any historical report labels.')
    ],


    // ── 59. ANNUAL BUDGET MANAGER ────────────────────────────────
    ['💰 Annual Budget Manager',
     'The Annual Budget Manager lets you set your full-year revenue budget in one place — month by month. ' +
     'Budgets automatically become the monthly revenue targets on the Dashboard.' +
     '<br><br><strong>How to access:</strong>' +
     step([
       'Go to <strong>🔮 Forecast</strong> tab',
       'Change View to <strong>💰 Annual Budget</strong>',
       'Select the year'
     ]) +
     '<br><strong>What you see:</strong>' +
     ul([
       'A table of all 12 months with budget input, actual revenue, progress bar and status',
       'Total year budget vs actual at the bottom',
       'Year progress percentage'
     ]) +
     '<br><strong>Setting budgets:</strong>' +
     step([
       'Type the budget for each month directly in the input fields',
       'Press Enter on any row to save that month instantly',
       'Or fill all months first then click <strong>💾 Save All Targets</strong>'
     ]) +
     '<br><strong>Quick Fill tools:</strong>' +
     ul([
       '<strong>⚖️ Fill Evenly</strong> — enter an annual total (e.g. 900,000) and it divides equally across all 12 months',
       '<strong>📈 Apply Growth</strong> — enter a % and it applies growth to existing values, or distributes an annual total with seasonal weights',
       '<strong>Growth %</strong> field — set the growth rate (default 5%)'
     ]) +
     '<br><strong>Auto-sync to Dashboard:</strong><br>' +
     'When you save budgets here, they immediately become the monthly revenue targets on the Dashboard. ' +
     'The target bar, remaining amount, and daily pace all update automatically.' +
     tip('Set your full-year budget at the start of each year. You can always come back and adjust individual months as the year progresses.')
    ],


    // ── 60. PLANNING TAB ─────────────────────────────────────────
    ['🎯 Planning Tab',
     'The Planning tab contains tools for budgeting and simulating future performance. These are separated from the Forecast tab to keep both tabs fast and responsive.' +
     '<br><br><strong>How to access:</strong> Click <strong>🎯 Planning</strong> in the navigation bar.' +
     '<br><br><strong>Three views available:</strong>' +
     ul([
       '<strong>💰 Annual Budget</strong> — Set your full-year revenue budget month by month. Budgets auto-sync to the Dashboard revenue target bar so you never need to set monthly targets separately.',
       '<strong>📋 Plan Next Year</strong> — Build a detailed plan for next year using growth rates, occupancy projections, and historical trends.',
       '<strong>🎮 What-If Simulation</strong> — Test scenarios: what if occupancy increases by 10%? What if you raise prices? See projected revenue impact instantly.'
     ]) +
     '<br><strong>Why separate from Forecast?</strong><br>' +
     'Forecast tab is used daily — this month, next month. Planning is used occasionally for strategic decisions. Keeping them separate means both tabs open faster.' +
     tip('Set your Annual Budget at the start of each year. Once saved, the Dashboard revenue target bar updates automatically for every month — no need to set targets one by one.')
    ],

    // ── 61. FORECAST TAB (updated) ───────────────────────────────
    ['🔮 Forecast Tab — What Changed',
     'The Forecast tab has been streamlined to focus on daily operational forecasting.' +
     '<br><br><strong>Three views now in Forecast:</strong>' +
     ul([
       '<strong>📅 This Month</strong> — Current month projection based on daily pace, YoY trends, and occupancy. Shows confidence level and forecast methodology.',
       '<strong>📆 Next Month</strong> — Next month forecast using historical patterns and current trajectory.',
       '<strong>📊 Full Year</strong> — Full year projection: actual YTD + forecast for remaining months using YoY growth factor.'
     ]) +
     '<br><strong>Moved to Planning tab:</strong>' +
     ul([
       'Annual Budget Manager',
       'Plan Next Year',
       'What-If Simulation'
     ]) +
     tip('Forecast tab now opens instantly because it only calculates 3 lightweight views. For budgeting and scenario planning, use the 🎯 Planning tab.')
    ],


  ]);

  var style = '<style>' +
    '#guide-wrap .gs-section{display:none}' +
    '#guide-wrap .gs-section.active{display:block}' +
    '.guide-p{font-size:13px;color:#334155;line-height:1.8}' +
    '.guide-p ul,.guide-p ol{padding-left:20px;margin:8px 0}' +
    '.guide-p li{margin-bottom:7px;line-height:1.8}' +
    '.guide-p code{background:#f1f5f9;padding:2px 7px;border-radius:5px;font-size:12px;color:#0369a1;font-family:monospace}' +
    '.guide-p strong{color:#0d1b2e}' +
    '.guide-nav-item{display:flex;align-items:center;gap:10px;padding:9px 16px;cursor:pointer;transition:all .15s;border-left:3px solid transparent;color:rgba(255,255,255,.6);font-size:12px;font-weight:600}' +
    '.guide-nav-item:hover{background:rgba(255,255,255,.06);color:#fff;border-left-color:rgba(201,168,76,.5)}' +
    '.guide-nav-item.active{background:rgba(201,168,76,.12);color:#c9a84c;border-left-color:#c9a84c}' +
    '.guide-nav-num{width:20px;height:20px;background:rgba(255,255,255,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}' +
    '.guide-nav-item.active .guide-nav-num{background:#c9a84c;color:#0d1b2e}' +
    '</st'+'yle>';

  // Build sidebar nav
  var navHtml = '';
  secs.forEach(function(s, idx) {
    var icon = s[0].split(' ')[0];
    var title = s[0].replace(/^[^\s]+\s/, '').split(' — ')[0];
    navHtml += '<div class="guide-nav-item" id="gnav-' + idx + '" onclick="showGuideSection(' + idx + ')">' +
      '<span class="guide-nav-num">' + (idx+1) + '</span>' +
      '<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + icon + ' ' + title + '</span>' +
      '</div>';
  });
  var navEl = document.getElementById('guide-nav');
  if (navEl) navEl.innerHTML = style + navHtml;

  // Clear existing content first to prevent stale sections showing
  var guideWrap = document.getElementById('guide-wrap');
  if (guideWrap) guideWrap.innerHTML = '';

  // Build all sections (hidden by default)
  var html2 = '';
  secs.forEach(function(s, idx) {
    html2 += '<div class="gs-section" id="gs-' + idx + '">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0">' +
        '<div style="width:36px;height:36px;background:#0d1b2e;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">' + s[0].split(' ')[0] + '</div>' +
        '<div>' +
          '<div style="font-size:18px;font-weight:800;color:#0d1b2e">' + s[0].replace(/^[^\s]+\s/, '') + '</div>' +
          '<div style="font-size:12px;color:#94a3b8;margin-top:2px">Section ' + (idx+1) + ' of ' + secs.length + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="guide-p">' + s[1] + '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0">' +
        (idx > 0 ? '<button onclick="showGuideSection(' + (idx-1) + ')" style="padding:8px 18px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-weight:700;color:#64748b;cursor:pointer">← Previous</button>' : '<div></div>') +
        (idx < secs.length-1 ? '<button onclick="showGuideSection(' + (idx+1) + ')" style="padding:8px 18px;background:#0d1b2e;border:none;border-radius:8px;font-size:12px;font-weight:700;color:#c9a84c;cursor:pointer">Next →</button>' : '<div style="font-size:12px;color:#94a3b8;align-self:center">End of Guide</div>') +
      '</div>' +
    '</div>';
  });
  if (guideWrap) guideWrap.innerHTML = html2;
  // Small delay ensures DOM is painted before we show section
  setTimeout(function() { showGuideSection(0); }, 20);
}

// ══════════════════════════════════════════════════════════════
//  MOBILE APP — dedicated mobile layout
// ══════════════════════════════════════════════════════════════
var _mobTab = 'dashboard';
var _MOB_APP_HTML = ''; // stored on first load
var _mobEntDept = '';
var _mobDayClip = null;
