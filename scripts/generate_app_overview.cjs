// =============================================================================
// GERSL Management System — full operational overview PDF.
//
// Output: docs/GERSL-Management-Overview.pdf
// Run:    node scripts/generate_app_overview.cjs
// =============================================================================

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUT_DIR  = path.join(__dirname, '..', 'docs');
const OUT_FILE = path.join(OUT_DIR, 'GERSL-Management-Overview.pdf');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- Design tokens --------------------------------------------------------
const NAVY    = '#0D1D3D';
const ACCENT  = '#a4f056';
const INK_700 = '#334155';
const INK_500 = '#64748B';
const INK_300 = '#CBD5E1';
const INK_100 = '#EEF1F5';
const INK_50  = '#F5F7FA';
const SUCCESS = '#16A34A';

const F_REG  = 'Helvetica';
const F_BOLD = 'Helvetica-Bold';
const F_IT   = 'Helvetica-Oblique';

const PAGE = { size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } };
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - PAGE.margins.left - PAGE.margins.right;

// IMPORTANT: not using bufferPages — the deferred-write path caused this PDF
// to fail to open in some viewers. Streaming straight to disk is plenty fast
// and produces a strictly-conformant file.
const doc = new PDFDocument({
  ...PAGE, autoFirstPage: false,
  info: {
    Title: 'GERSL Management System — Operational Overview',
    Author: 'Global Ehsan Relief Sri Lanka',
    Subject: 'NGO management platform — architecture, modules, workflows',
    Keywords: 'GERSL, WASH, IGP, orphan care, NGO, management',
  },
});

const out = fs.createWriteStream(OUT_FILE);
doc.pipe(out);

// ===========================================================================
// HELPERS
// ===========================================================================

const today = () => new Date().toLocaleDateString('en-LK', {
  year: 'numeric', month: 'long', day: 'numeric',
});

function newPage() {
  doc.addPage(PAGE);
  drawHeader();
}

function drawHeader() {
  doc.save();
  doc.rect(0, 0, PAGE_W, 36).fill(NAVY);
  doc.fillColor(ACCENT).font(F_BOLD).fontSize(8)
     .text('GERSL - GLOBAL EHSAN RELIEF SRI LANKA',
       PAGE.margins.left, 13, { characterSpacing: 1.5 });
  doc.fillColor('#FFFFFF').font(F_REG).fontSize(8)
     .text('Management System Overview', PAGE_W - 200, 13,
       { width: 200 - PAGE.margins.right, align: 'right' });
  doc.restore();
  doc.fillColor(INK_700).font(F_REG);
  doc.x = PAGE.margins.left;
  doc.y = 76;
}

function ensureSpace(needed) {
  if (doc.y + needed > PAGE_H - PAGE.margins.bottom) newPage();
}

function h1(text) {
  ensureSpace(48);
  doc.moveDown(0.4);
  doc.font(F_BOLD).fontSize(20).fillColor(NAVY)
     .text(text, { width: CONTENT_W });
  doc.moveTo(PAGE.margins.left, doc.y + 2)
     .lineTo(PAGE.margins.left + 60, doc.y + 2)
     .strokeColor(ACCENT).lineWidth(2).stroke();
  doc.moveDown(0.8);
  doc.fillColor(INK_700).font(F_REG);
}

function h2(text) {
  ensureSpace(32);
  doc.moveDown(0.6);
  doc.font(F_BOLD).fontSize(13).fillColor(NAVY)
     .text(text, { width: CONTENT_W });
  doc.moveDown(0.3);
  doc.fillColor(INK_700).font(F_REG);
}

function p(text) {
  ensureSpace(40);
  doc.font(F_REG).fontSize(10).fillColor(INK_700);
  doc.text(text, { width: CONTENT_W, lineGap: 2, paragraphGap: 4 });
}

function bullet(text) {
  ensureSpace(18);
  doc.font(F_REG).fontSize(10).fillColor(INK_700);
  // Simple bullet via the text indent option — no manual y math.
  doc.text('- ' + text, {
    width: CONTENT_W, indent: 12, lineGap: 2, paragraphGap: 2,
  });
}

function kv(label, value) {
  // Inline "Label: value" line.
  ensureSpace(16);
  doc.font(F_BOLD).fontSize(10).fillColor(NAVY).text(label, { continued: true });
  doc.font(F_REG).fontSize(10).fillColor(INK_700).text('  ' + value);
}

function callout(label, body) {
  ensureSpace(60);
  const padX = 10, padY = 8;
  const labelLines = doc.font(F_BOLD).fontSize(9)
    .heightOfString(label.toUpperCase(), { width: CONTENT_W - padX * 2 });
  const bodyLines = doc.font(F_REG).fontSize(10)
    .heightOfString(body, { width: CONTENT_W - padX * 2, lineGap: 2 });
  const boxH = padY * 2 + labelLines + 4 + bodyLines;
  const yStart = doc.y;
  const x = PAGE.margins.left;
  doc.save();
  doc.rect(x, yStart, CONTENT_W, boxH).fill('#EFF6FF');
  doc.lineWidth(1).strokeColor('#BFDBFE').rect(x, yStart, CONTENT_W, boxH).stroke();
  doc.fillColor('#1E3A8A').font(F_BOLD).fontSize(9)
     .text(label.toUpperCase(), x + padX, yStart + padY,
       { width: CONTENT_W - padX * 2, characterSpacing: 1 });
  doc.fillColor(INK_700).font(F_REG).fontSize(10)
     .text(body, x + padX, yStart + padY + labelLines + 4,
       { width: CONTENT_W - padX * 2, lineGap: 2 });
  doc.restore();
  doc.x = PAGE.margins.left;
  doc.y = yStart + boxH + 6;
}

function table(headers, rows, colWidths) {
  const x = PAGE.margins.left;
  const widths = colWidths || headers.map(() => CONTENT_W / headers.length);
  ensureSpace(40);
  let y = doc.y;
  // Header
  doc.save();
  doc.rect(x, y, CONTENT_W, 20).fill(NAVY);
  doc.fillColor('#FFFFFF').font(F_BOLD).fontSize(9);
  let cx = x;
  headers.forEach((h, i) => {
    doc.text(h, cx + 6, y + 5, { width: widths[i] - 12, lineBreak: false });
    cx += widths[i];
  });
  doc.restore();
  y += 20;
  // Body
  doc.font(F_REG).fontSize(9).fillColor(INK_700);
  rows.forEach((row, ri) => {
    const cellHeights = row.map((cell, i) =>
      doc.heightOfString(String(cell == null ? '' : cell), {
        width: widths[i] - 12, lineGap: 1,
      })
    );
    const rowH = Math.max(...cellHeights) + 10;
    if (y + rowH > PAGE_H - PAGE.margins.bottom) {
      newPage();
      y = doc.y;
      doc.save();
      doc.rect(x, y, CONTENT_W, 20).fill(NAVY);
      doc.fillColor('#FFFFFF').font(F_BOLD).fontSize(9);
      let cx2 = x;
      headers.forEach((h, i) => {
        doc.text(h, cx2 + 6, y + 5, { width: widths[i] - 12, lineBreak: false });
        cx2 += widths[i];
      });
      doc.restore();
      y += 20;
      doc.font(F_REG).fontSize(9).fillColor(INK_700);
    }
    if (ri % 2 === 1) {
      doc.save();
      doc.rect(x, y, CONTENT_W, rowH).fill(INK_50);
      doc.restore();
    }
    let rx = x;
    row.forEach((cell, i) => {
      doc.fillColor(INK_700).font(F_REG).fontSize(9)
         .text(String(cell == null ? '' : cell), rx + 6, y + 5,
           { width: widths[i] - 12, lineGap: 1 });
      rx += widths[i];
    });
    y += rowH;
  });
  doc.x = PAGE.margins.left;
  doc.y = y + 8;
}

// ===========================================================================
// COVER PAGE
// ===========================================================================
doc.addPage(PAGE);

doc.save();
doc.rect(0, 0, PAGE_W, 220).fill(NAVY);
doc.fillColor(ACCENT).font(F_BOLD).fontSize(10)
   .text('GLOBAL EHSAN RELIEF - SRI LANKA',
     PAGE.margins.left, 70, { characterSpacing: 2 });
doc.fillColor('#FFFFFF').font(F_BOLD).fontSize(28)
   .text('GERSL Management', PAGE.margins.left, 100, { width: CONTENT_W });
doc.fillColor('#FFFFFF').font(F_BOLD).fontSize(28)
   .text('System Overview', PAGE.margins.left, 138, { width: CONTENT_W });
doc.fillColor('#cbd5e1').font(F_REG).fontSize(12)
   .text('Architecture, modules, and end-to-end workflows.',
     PAGE.margins.left, 180, { width: CONTENT_W });
doc.restore();

doc.font(F_REG).fontSize(11).fillColor(INK_700);
doc.text(
  'This document explains how the GERSL management platform connects every '
  + 'part of the organisation - from the moment a donor commits funding to '
  + 'the moment a beneficiary receives an asset and the report closes the '
  + 'loop back to the donor.',
  PAGE.margins.left, 260, { width: CONTENT_W, lineGap: 3 }
);
doc.moveDown(0.5);
doc.text(
  'Use it as: an onboarding reference for new staff, a stakeholder briefing '
  + 'pack, and a working document that captures the operational rules baked '
  + 'into the system.',
  { width: CONTENT_W, lineGap: 3 }
);

// Stat tiles
const tileY = 400;
const stats = [
  { label: 'Web admin', value: '50+ pages' },
  { label: 'Mobile',    value: 'iOS + Android' },
  { label: 'Modules',   value: '14' },
  { label: 'Roles',     value: '20+' },
];
const tileW = (CONTENT_W - 24) / 4;
stats.forEach((s, i) => {
  const x = PAGE.margins.left + i * (tileW + 8);
  doc.save();
  doc.rect(x, tileY, tileW, 70).fill(INK_50);
  doc.lineWidth(1).strokeColor(INK_100).rect(x, tileY, tileW, 70).stroke();
  doc.fillColor(NAVY).font(F_BOLD).fontSize(22)
     .text(s.value, x + 12, tileY + 14, { width: tileW - 24 });
  doc.fillColor(INK_500).font(F_REG).fontSize(9)
     .text(s.label.toUpperCase(), x + 12, tileY + 44,
       { width: tileW - 24, characterSpacing: 1 });
  doc.restore();
});

// Footer block
const footY = PAGE_H - 140;
doc.lineWidth(0.5).strokeColor(INK_300)
   .moveTo(PAGE.margins.left, footY)
   .lineTo(PAGE_W - PAGE.margins.right, footY).stroke();
doc.fillColor(INK_500).font(F_REG).fontSize(9);
doc.text('Generated  ' + today(), PAGE.margins.left, footY + 8,
  { width: CONTENT_W });
doc.text('Repo  github.com/jarooq/gersl-management', { width: CONTENT_W });
doc.text('Stack  Vercel (web + API) - Supabase (Postgres) - Codemagic (mobile CI)',
  { width: CONTENT_W });

// ===========================================================================
// TABLE OF CONTENTS
// ===========================================================================
newPage();
h1('Table of Contents');
const toc = [
  '1.  Executive summary',
  '2.  The closed operational loop',
  '3.  Technical architecture',
  '4.  Module reference',
  '5.  WASH programme - full workflow',
  '6.  IGP programme - full workflow',
  '7.  Partner-wise finance integration',
  '8.  End-to-end case study (One Nation)',
  '9.  Mobile application',
  '10. Roles and access control',
  '11. Background automation',
  '12. Database and schema overview',
  '13. Audit, compliance, and reporting',
  '14. Deployment and environment',
  '15. What is intentionally parked',
  '16. Appendix - API surface, glossary',
];
toc.forEach((line) => {
  doc.font(F_REG).fontSize(11).fillColor(INK_700)
     .text(line, { lineGap: 6 });
});

// ===========================================================================
// 1. EXECUTIVE SUMMARY
// ===========================================================================
newPage();
h1('1. Executive Summary');
p(
  'The GERSL Management System is a single platform that handles the full '
  + 'operational life-cycle of an Islamic relief NGO: orphan care, water/'
  + 'sanitation/hygiene projects, income-generating programmes, finance, HR, '
  + 'procurement, monitoring and evaluation, and partner relationships. '
  + 'It is purpose-built - not adapted from generic ERP - so every workflow '
  + 'matches the way GERSL actually operates.'
);

h2('Three audiences, one system');
bullet(
  'Field staff (mobile) - punch in, log visits, update programme stages in '
  + 'the field with GPS and photos, capture income follow-ups, submit fuel '
  + 'and expense claims.'
);
bullet(
  'Office staff (web admin) - manage projects, partners, proposals, '
  + 'finance, HR, procurement, MEAL indicators, reports.'
);
bullet(
  'Donors and partners - receive automated per-beneficiary PDFs and batch '
  + 'donor-bundle reports as work is delivered.'
);

h2('What was just built');
table(
  ['Module', 'Status', 'Key capabilities'],
  [
    ['WASH', 'Production', 'Donor order to installation to handover to PDF'],
    ['IGP', 'Production', 'Asset distribution + income follow-up tracking'],
    ['Partner Financials', 'Production', 'Per-partner committed / received / spent / net'],
    ['Beneficiary Map', 'Production', 'Leaflet map, layered WASH/IGP/Orphan/Households'],
    ['Mobile programmes', 'Production', 'Stage update + map + follow-up + add-beneficiary'],
    ['Auto-tasks', 'Production', 'Stage transition spawns next-step task'],
    ['Deadline reminders', 'Production *', '* requires CRON_SECRET on Vercel'],
    ['Donor email', 'Production *', '* requires SMTP env vars on Vercel'],
  ],
  [120, 80, CONTENT_W - 200]
);

callout(
  'Reliability posture',
  'The system follows a "best-effort outbound, atomic inbound" model. Email '
  + 'sends and PDF generation never block business operations - if SMTP is '
  + 'unconfigured, work proceeds and emails simply do not fire. Financial '
  + 'mutations (cash transactions, invoice reconciliation) are wrapped in '
  + 'transactions and audited.'
);

// ===========================================================================
// 2. CLOSED LOOP
// ===========================================================================
newPage();
h1('2. The Closed Operational Loop');
p(
  'GERSL\'s work is fundamentally a closed loop. A partner commits funding, '
  + 'your team delivers to beneficiaries, reports return to the partner, '
  + 'and the next commitment cycle begins. Every screen, every endpoint, '
  + 'every automated job in the system supports one part of this loop.'
);

// Simple linear loop diagram — three boxes stacked vertically with arrows
// drawn as straight lines. No bezier curves.
ensureSpace(280);
const dy0 = doc.y + 8;
const boxW = 180, boxH = 60, gapY = 90;
const cx0 = PAGE.margins.left + (CONTENT_W - boxW) / 2;

function drawBox(yPos, fill, title, subtitle, accentLine) {
  doc.save();
  doc.rect(cx0, yPos, boxW, boxH).fill(fill);
  doc.fillColor('#FFFFFF').font(F_BOLD).fontSize(11)
     .text(title, cx0, yPos + 12, { width: boxW, align: 'center' });
  doc.font(F_REG).fontSize(8).fillColor(ACCENT)
     .text(accentLine, cx0, yPos + 30, { width: boxW, align: 'center' });
  doc.font(F_REG).fontSize(8).fillColor('#cbd5e1')
     .text(subtitle, cx0, yPos + 43, { width: boxW, align: 'center' });
  doc.restore();
}

drawBox(dy0,                NAVY,      'PARTNER (Donor)',
  'Partners page - Proposals', 'AlKhair UK - One Nation');
drawBox(dy0 + gapY,         '#1e3a8a', 'GERSL ORGANIZATION',
  'Orders - Items - Tasks',    'Programme + Finance teams');
drawBox(dy0 + gapY * 2,     SUCCESS,   'BENEFICIARIES',
  'GPS + needs + photos',      'Named households');

function drawArrow(yStart, label) {
  const xC = cx0 + boxW / 2;
  doc.save();
  doc.moveTo(xC, yStart).lineTo(xC, yStart + 24)
     .strokeColor(INK_500).lineWidth(1).stroke();
  doc.moveTo(xC - 4, yStart + 20).lineTo(xC, yStart + 26)
     .lineTo(xC + 4, yStart + 20).stroke();
  doc.fillColor(INK_500).font(F_IT).fontSize(8)
     .text(label, xC + 10, yStart + 10, { width: 160 });
  doc.restore();
}

drawArrow(dy0 + boxH,           'Proposal -> Order');
drawArrow(dy0 + gapY + boxH,    'Items + delivery');

// Return arrow on the right — straight lines forming a square bracket back up.
const xR = cx0 + boxW + 22;
doc.save();
doc.lineWidth(1).strokeColor(INK_500);
doc.moveTo(cx0 + boxW, dy0 + gapY * 2 + boxH / 2)
   .lineTo(xR, dy0 + gapY * 2 + boxH / 2)
   .lineTo(xR, dy0 + boxH / 2)
   .lineTo(cx0 + boxW + 4, dy0 + boxH / 2).stroke();
doc.moveTo(cx0 + boxW + 8, dy0 + boxH / 2 - 4)
   .lineTo(cx0 + boxW + 4, dy0 + boxH / 2)
   .lineTo(cx0 + boxW + 8, dy0 + boxH / 2 + 4).stroke();
doc.fillColor(INK_500).font(F_IT).fontSize(8)
   .text('Reports back',
     xR + 4, dy0 + gapY + 10, { width: 80 });
doc.text('(PDFs + email +',
  xR + 4, dy0 + gapY + 22, { width: 80 });
doc.text('Financials panel)',
  xR + 4, dy0 + gapY + 34, { width: 80 });
doc.restore();

// Move cursor past the diagram
doc.x = PAGE.margins.left;
doc.y = dy0 + gapY * 2 + boxH + 30;

p(
  'Money flows one way; work flows the other; reports close the loop. '
  + 'Every operational artefact in the system - orders, invoices, items, '
  + 'tasks, PDFs, emails, audit logs - sits somewhere on this diagram.'
);

// ===========================================================================
// 3. ARCHITECTURE
// ===========================================================================
newPage();
h1('3. Technical Architecture');

h2('Layers');
table(
  ['Layer', 'Stack', 'Hosted on'],
  [
    ['Web admin', 'React 19 + Vite 5 + Tailwind v3', 'Vercel'],
    ['Server / API', 'Express 4 + Sequelize 6 (Node 20)', 'Vercel serverless'],
    ['Database', 'PostgreSQL 15+', 'Supabase'],
    ['Mobile', 'Flutter 3.x + Riverpod + Dio + go_router', 'Codemagic CI'],
    ['File storage', 'Supabase Storage (photos, receipts)', 'Supabase'],
    ['Email transport', 'SMTP via nodemailer', 'Bring-your-own SMTP'],
    ['Maps', 'OpenStreetMap tiles (react-leaflet / flutter_map)', 'OSM (free)'],
  ],
  [110, 270, CONTENT_W - 380]
);

h2('Auth model');
bullet(
  'JWT access token (15 min) + refresh token (7 days). HttpOnly cookies '
  + 'primary; Bearer header fallback for mobile.'
);
bullet(
  'Role-based permissions plus row-level scoping on programme data - '
  + 'field staff see only items they supervise; senior roles see all.'
);
bullet(
  'Login + register + refresh rate-limited (10 requests / 15 min) '
  + 'separately from the rest of the API.'
);
bullet(
  'CRON_SECRET protects scheduled-job triggers with constant-time '
  + 'comparison so the secret cannot be probed character by character.'
);

h2('Code organisation');
bullet('server/src/ - controllers, routes, models, services, migrations');
bullet('src/ - web admin pages, components, services');
bullet('mobile/lib/ - Flutter features, repositories, services');
bullet('docs/ - generated documentation (this file)');

// ===========================================================================
// 4. MODULES
// ===========================================================================
newPage();
h1('4. Module Reference');
p(
  'Each module is a self-contained part of the system with its own '
  + 'database tables, controllers, web pages, and (where relevant) mobile '
  + 'screens. Modules cross-reference via foreign keys - there is no '
  + 'duplication of partners, beneficiaries, or projects.'
);

const modules = [
  ['Dashboard', '/admin/dashboard',
    'Role-tailored landing page with KPI tiles, recent activity, and role-specific shortcuts.'],
  ['Orphan Care', '/admin/orphans',
    'Orphan registry with dossier, sponsor linkage, coordinator assignment, visit log with progress ratings, generated reports.'],
  ['WASH', '/admin/wash',
    'Donor-funded water/sanitation/hygiene installations. Hand pumps, community wells, hybrid wells, tube wells, filters, tanks, latrines.'],
  ['IGP', '/admin/igp',
    'Income-generating asset distribution. Sewing machines, canoes, bicycles, livestock kits, tool kits, cash grants. Captures income baseline and follow-up uplift.'],
  ['Beneficiaries', '/admin/beneficiaries',
    'Shared registry across programmes. NIC, contact, address, household GPS. Same person can receive across WASH, IGP, and Orphan Care.'],
  ['Beneficiary Map', '/admin/map',
    'Leaflet map with toggleable layers (WASH, IGP, Orphans, Households) and filters by district, stage, donor.'],
  ['Partners', '/admin/partners',
    'Donor CRM with contributions log, communication log, and the Financial Summary panel rolling up committed/received/spent/net.'],
  ['Proposals', '/admin/proposals',
    'Funding proposals with approval workflow, PDF generation, donor response tracking, and one-click conversion to Project or Order.'],
  ['Projects', '/admin/projects',
    'Project umbrella with budget vs actual, team members, tasks, embedded beneficiary map.'],
  ['Operations', '/admin/operations/*',
    'Activities, Tasks (Kanban), My Tasks, Field Visits, Movement Register, Fuel Claims, Fuel Rates, Approvals queue, Compliance.'],
  ['Finance', '/admin/finance',
    'Invoices, bills, expenses, journal entries, accounts, bank reconciliation, fixed assets, grant receivables, budget reports.'],
  ['Cash module', '/admin/finance/cash/*',
    'Locker / CashBook / PettyCash accounts with vouchers, replenishments, cash counts, and bulk receipt entry.'],
  ['HR', '/admin/hr',
    'Staff register, attendance, onboarding, appraisals, contracts, payroll, salary advances, staff expenses, asset register.'],
  ['Procurement', '/admin/procurement/*',
    'Inbox queue, RFQ workspace, PO management, vendor master, three-way match, GRN, bid analysis.'],
  ['MEAL', '/admin/meal',
    'Indicators, evaluations, learning events, complaints/feedback log.'],
  ['Campaigns', '/admin/campaigns',
    'Public fundraising campaigns with donation tiers and donor-facing pages.'],
  ['Reports', '/admin/reports',
    'Multi-format export (PDF, Excel, CSV), date ranges, scheduled reports.'],
  ['Settings', '/admin/settings',
    'Users, roles, permissions, system settings, audit log access.'],
];

modules.forEach(([name, route, desc]) => {
  ensureSpace(50);
  doc.save();
  doc.rect(PAGE.margins.left, doc.y, CONTENT_W, 3).fill(ACCENT);
  doc.restore();
  doc.moveDown(0.2);
  doc.font(F_BOLD).fontSize(12).fillColor(NAVY)
     .text(name, { continued: true });
  doc.font(F_REG).fontSize(9).fillColor(INK_500)
     .text('   ' + route);
  doc.moveDown(0.2);
  doc.font(F_REG).fontSize(10).fillColor(INK_700)
     .text(desc, { width: CONTENT_W, lineGap: 2 });
  doc.moveDown(0.5);
});

// ===========================================================================
// 5. WASH
// ===========================================================================
newPage();
h1('5. WASH Programme - Full Workflow');
p(
  'WASH handles donor-funded installations where each unit is delivered to '
  + 'a named beneficiary with GPS evidence. Examples: a hand pump at a '
  + 'household, a community well at a village, water filters, latrines.'
);

h2('Data model');
table(
  ['Entity', 'Purpose'],
  [
    ['wash_orders', 'A batch from a donor (e.g. 50 hand pumps for April).'],
    ['wash_items', 'One installation. Linked to beneficiary, contractor, supervisor, GPS, stage.'],
    ['wash_stage_updates', 'Append-only timeline of stage transitions with photos, GPS, notes.'],
    ['partners', 'The donor (FK from order.donor_id).'],
    ['projects', 'Umbrella that aggregates multiple orders.'],
    ['proposals', 'Upstream funding commitment (FK from order.proposal_id).'],
    ['invoices', 'Downstream billing record (FK from order.invoice_id).'],
    ['beneficiaries', 'Recipient registry (FK from item.beneficiary_id).'],
    ['vendors', 'Contractor pool (FK from item.assigned_contractor_id).'],
  ],
  [180, CONTENT_W - 180]
);

h2('Stage workflow');
const washStages = [
  ['Ordered', 'Items registered against the order. No work yet.'],
  ['Surveyed', 'Field officer visits the site, captures GPS + photos. Materials PR auto-task created.'],
  ['Materials', 'Procurement raises a PO, materials delivered to site.'],
  ['Construction', 'Contractor builds the installation. Progress photos captured.'],
  ['Testing', 'MEAL Officer tests water quality / pump function.'],
  ['HandedOver', 'Beneficiary takes ownership. Per-item PDF auto-generated.'],
  ['Reported', 'Donor bundle PDF generated and emailed.'],
];
washStages.forEach(([stage, what], i) => {
  kv(`${i + 1}. ${stage}`, what);
});

h2('What happens at each transition');
bullet('Photos + GPS + notes recorded in wash_stage_updates (append-only).');
bullet('Item stage column updated to new value.');
bullet('Auto-task created for the next operational step (idempotent).');
bullet('Audit log entry written (who, when, what changed).');
bullet('At HandedOver: per-item donor PDF available immediately.');

// ===========================================================================
// 6. IGP
// ===========================================================================
newPage();
h1('6. IGP Programme - Full Workflow');
p(
  'IGP handles donor-funded livelihood assets. Unlike WASH where each order '
  + 'is usually a single unit type, IGP orders are typically mixed (e.g. 15 '
  + 'sewing machines + 15 canoes + 20 bicycles in one order). The asset '
  + 'mix is stored as JSONB on the order.'
);

h2('Stage workflow');
const igpStages = [
  ['Ordered',  'Beneficiaries registered. No procurement yet.'],
  ['Surveyed', 'Field officer confirms eligibility, captures household details.'],
  ['Procured', 'Asset purchased / produced. Bill recorded against the partner.'],
  ['Training', 'Optional - for assets requiring skills (e.g. sewing machine course).'],
  ['Delivered','Asset handed to beneficiary. Photo + signature + GPS captured.'],
  ['FollowUp', 'Income follow-up visit captures monthly income uplift.'],
  ['Reported', 'Donor bundle PDF generated with income tracking section.'],
];
igpStages.forEach(([stage, what], i) => {
  kv(`${i + 1}. ${stage}`, what);
});

h2('Income tracking - the IGP differentiator');
p(
  'IGP captures two figures per beneficiary: an income_baseline at survey '
  + 'time, and income_followup at the follow-up visit (typically 30-90 days '
  + 'after delivery). The system computes uplift automatically and exposes '
  + 'it on the donor report so impact is visible per beneficiary, not just '
  + 'in aggregate.'
);

callout(
  'Field workflow',
  'Mobile users see "Record income follow-up" on the item detail screen '
  + 'after stage = Delivered. The bottom sheet captures the new income '
  + 'figure, notes, GPS, and optional photo. Stage automatically flips to '
  + 'FollowUp.'
);

// ===========================================================================
// 7. PARTNER FINANCIALS
// ===========================================================================
newPage();
h1('7. Partner-wise Finance Integration');
p(
  'Until recently, expenses and bills could only be tagged to a project; '
  + 'partner-wise reporting relied on string-matching the donor name. This '
  + 'is now fixed: projects, expenses, and bills carry a partner_id foreign '
  + 'key, populated automatically through database hooks.'
);

h2('Data flow');
table(
  ['Tile (UI)', 'Computed from'],
  [
    ['Committed', 'SUM(wash_orders.total_budget) + SUM(igp_orders.total_budget) where donor_id = partner'],
    ['Received',  'SUM(invoices.paid_amount) + SUM(partner_contributions.amount) where partner_id = partner'],
    ['Spent',     'SUM(wash_items.actual_cost) + SUM(igp_items.actual_cost) + SUM(expenses.amount) + SUM(bills.paid_amount) where partner_id = partner'],
    ['Net position', 'Received - Spent'],
    ['Outstanding',  'SUM(invoices.total_amount - invoices.paid_amount)'],
  ],
  [120, CONTENT_W - 120]
);

h2('Auto-population hooks');
bullet(
  'Expense.beforeCreate - if expense has projectId but no partnerId, '
  + 'looks up the project and copies its partner_id automatically.'
);
bullet(
  'Bill.beforeCreate - same pattern; bills against a contractor on a '
  + 'partner-linked project roll up to that partner.'
);
bullet(
  'Invoice.afterUpdate - when paid_amount changes, finds any linked '
  + 'WASH/IGP orders and updates their payment_status. This unlocks '
  + '"OnFundsReceived" orders the moment donor funds arrive.'
);

h2('Access control');
p(
  'The /api/partners/:id/financials endpoint is restricted to senior roles '
  + '(Admin, CEO, Finance Manager, Finance Officer, Accountant, Fundraising '
  + 'Manager, Director Programmes, Programme Manager). General PARTNERS_VIEW '
  + 'permission does not unlock the financial breakdown - that exposes '
  + 'contractor bills and cash flows that should not be visible to general '
  + 'staff.'
);

// ===========================================================================
// 8. CASE STUDY
// ===========================================================================
newPage();
h1('8. End-to-End Case Study');
h2('One Nation March - 50 IGP assets');

const caseSteps = [
  ['Day 1', 'Programme Officer creates Proposal: 15 sewing machines + 15 canoes + 20 bicycles. proposalType = IGP, proposalLineItems = JSON array.'],
  ['Day 2', 'Submitted - CEO + Finance + Programme Manager approve. PDF auto-generated.'],
  ['Day 3', 'PDF emailed to One Nation (via PartnerCommunication log). Status = Submitted to Donor.'],
  ['Day 7', 'One Nation approves. Status = Donor Approved. "Convert to Order" button appears.'],
  ['Day 7', 'One click converts to IGP order IO-2026-001. 50 empty items pre-stubbed because namedBeneficiaries = true. proposal.convertedOrderId set bidirectionally.'],
  ['Day 7', '"Generate Invoice" creates proforma INV-2026-IGP-00001 (donor.paymentTerm = AdvanceProforma). Auto-emailed to One Nation.'],
  ['Day 12', 'One Nation transfers funds. Finance records BankTransaction, reconciles to invoice. Invoice.afterUpdate hook flips order.paymentStatus = Paid. 50 auto-tasks "Conduct site survey" assigned.'],
  ['Day 15-25', 'Programme Officer bulk-imports 50 beneficiary names via CSV. Each row becomes a Beneficiary + IgpItem. GPS validated against Sri Lanka bounds.'],
  ['Day 26-50', 'Field officers update items on mobile. Surveyed -> Procured -> Training -> Delivered. Each transition captures photo + GPS. Per-item PDF auto-generated at Delivered.'],
  ['Day 60+', 'Mobile follow-up visits 30 days post-delivery. "Record income follow-up" captures uplift against baseline.'],
  ['Day 65', 'Programme Manager clicks "Email donor". Server generates donor-bundle PDF (cover sheet + 50 item pages). PDF attached to email to One Nation.'],
  ['Day 66+', 'One Nation receives bundle. Reviews impact. Opens conversation for next quarter. Partner Financials panel shows Committed/Received/Spent/Net.'],
];

caseSteps.forEach(([day, what]) => {
  ensureSpace(36);
  doc.font(F_BOLD).fontSize(9).fillColor(NAVY).text(day, { continued: true });
  doc.font(F_REG).fontSize(10).fillColor(INK_700)
     .text('   ' + what, { width: CONTENT_W, lineGap: 2, paragraphGap: 4 });
});

// ===========================================================================
// 9. MOBILE
// ===========================================================================
newPage();
h1('9. Mobile Application');
p(
  'The mobile app is what field staff use day-to-day. It targets iOS and '
  + 'Android, ships through Codemagic, and supports the operational flows '
  + 'that need to happen at the point of service - not at a desk.'
);

h2('Feature matrix');
table(
  ['Feature', 'Mobile', 'Web admin'],
  [
    ['Punch in/out (face detection, GPS, selfie)', 'Yes', 'View only'],
    ['Attendance summary', 'Yes', 'Yes'],
    ['My Tasks', 'Yes', 'Yes'],
    ['Visits (general field)', 'Yes', 'Yes'],
    ['Movements (vehicle trips)', 'Yes', 'Yes'],
    ['Fuel claims', 'Submit', 'Approve'],
    ['Leave / Expense / Advance request', 'Submit', 'Approve'],
    ['Payslip view + download PDF', 'Yes', 'Generate'],
    ['Vehicle / accommodation requests', 'Submit', 'Approve'],
    ['Compliance incident report', 'Submit', 'Manage'],
    ['Announcements', 'Read', 'Manage'],
    ['Notifications', 'Yes', 'Yes'],
    ['My Programmes (WASH + IGP items)', 'Yes', 'Yes'],
    ['Item stage transitions + photo + GPS', 'Yes', 'Yes'],
    ['Item detail with stage timeline', 'Yes', 'Yes'],
    ['Per-item PDF view / share', 'Yes', 'Yes'],
    ['Order-level view + sibling items', 'Yes', 'Yes'],
    ['Add beneficiary during field survey', 'Yes', 'Bulk import'],
    ['IGP income follow-up capture', 'Yes', 'Yes'],
    ['Beneficiary map (Leaflet / OSM)', 'Yes', 'Yes'],
    ['Funds-gate warning on unpaid orders', 'Yes', 'Yes'],
  ],
  [320, 75, CONTENT_W - 395]
);

h2('Build and distribution');
bullet('Codemagic CI on push to main; produces signed .apk and .ipa');
bullet('iOS uploads to TestFlight; Android to Play Console internal track');
bullet('flutter_map + latlong2 dependencies handle the in-app map');
bullet('Sentry wired (DSN optional - silent without it)');

// ===========================================================================
// 10. ROLES
// ===========================================================================
newPage();
h1('10. Roles and Access Control');
p(
  'GERSL uses both role-based permissions (RBAC) and row-level scoping. '
  + 'Permissions decide which pages a user can see; row-level scoping '
  + 'decides which records inside those pages they actually receive.'
);

h2('Senior roles (full org-wide visibility on programmes)');
p(
  'Admin, CEO, BOD, Programme Manager, Director Programmes, Programme '
  + 'Officer, Finance Manager, Finance Officer, Accountant, MEAL Officer, '
  + 'Fundraising Manager.'
);

h2('Field-level roles (scoped to their assignments)');
p(
  'Anyone outside the senior set sees only items where they are the '
  + 'assigned supervisor - including Field Officer, Coordinator, Driver, '
  + 'and any custom roles your org defines.'
);

callout(
  'How to add a new senior role',
  'Edit server/src/utils/programmeAccess.js - FULL_VIEW_ROLES is the single '
  + 'list to update. A code change is required (one-line addition). No '
  + 'database migration needed.'
);

h2('Authentication layers');
bullet('HttpOnly access cookie (primary, 15-min expiry)');
bullet('Bearer header (fallback, for mobile + cross-origin)');
bullet('Refresh token (7-day, stored in DB)');
bullet('CRON_SECRET via x-cron-secret header (timing-safe comparison)');
bullet('?token=... query parameter allow-listed only for PDF endpoints');

// ===========================================================================
// 11. AUTOMATION
// ===========================================================================
newPage();
h1('11. Background Automation');

h2('Database hooks');
table(
  ['Hook', 'What it does'],
  [
    ['Expense.beforeCreate', 'Inherits partner_id from project if not set.'],
    ['Bill.beforeCreate', 'Same - inherits partner_id from project.'],
    ['Invoice.afterUpdate', 'Syncs payment_status onto linked WASH/IGP orders when paid_amount changes.'],
    ['Stage transition', 'Writes stage_updates row + creates next-step Task (idempotent).'],
    ['withAuditLog hooks', 'Records create/update/delete to audit_logs.'],
  ],
  [180, CONTENT_W - 180]
);

h2('Scheduled jobs (cron)');
bullet(
  'Daily 01:30 - movement clusterer aggregates location_points into '
  + 'movement_segments for fuel-claim distance calculations.'
);
bullet(
  'Daily 08:00 - programme deadline reminder digest. Finds at-risk '
  + 'WASH/IGP items and emails each supervisor a personalised list of '
  + 'items overdue, due tomorrow, or due this week.'
);

callout(
  'Vercel cron setup',
  'In-process cron only fires on long-running servers, not on Vercel '
  + 'serverless. For production, configure a vercel.json cron entry '
  + 'pointing at POST /api/cron/programme-deadline-reminders with header '
  + 'x-cron-secret set to your CRON_SECRET env var.'
);

h2('Email events');
bullet('Leave / expense / salary advance submitted - notify approvers');
bullet('Decision (approve / reject) - notify the requester');
bullet('Donation recorded - automated donor receipt PDF');
bullet('Programme order completion - donor bundle PDF on request');
bullet('Deadline reminder digest - daily 08:00 (when cron wired)');

// ===========================================================================
// 12. DATABASE
// ===========================================================================
newPage();
h1('12. Database and Schema Overview');
p(
  'PostgreSQL on Supabase. Schema managed through SQL migrations in '
  + 'server/src/migrations/. Sequelize provides the ORM layer with about '
  + '80 declared models. All recent migrations are idempotent and safe '
  + 'to re-run.'
);

h2('Core entity groups');
table(
  ['Group', 'Tables'],
  [
    ['Identity', 'users, roles, permissions, role_permissions'],
    ['Org', 'departments, positions, staff, staff_documents'],
    ['Programmes', 'orphans, wash_orders, wash_items, wash_stage_updates, igp_orders, igp_items, igp_stage_updates, beneficiaries, beneficiary_supports'],
    ['Partners', 'partners, partner_contributions, partner_communications'],
    ['Finance', 'invoices, bills, expenses, journal_entries, accounts, bank_accounts, bank_transactions, cash_accounts, cash_transactions, cash_count_sessions, petty_cash_replenishments'],
    ['Projects', 'projects, project_team_members, project_indicators, evaluations, learning_events, complaints'],
    ['Proposals', 'proposals'],
    ['Procurement', 'purchase_requisitions, rfqs, rfq_vendors, quotations, quotation_lines, bid_analyses, purchase_orders, po_lines, goods_receipt_notes, grn_lines, three_way_matches, vendors, vendor_calls, vendor_submissions'],
    ['HR', 'leave_requests, leave_balances, salary_advances, payrolls, employment_agreements, contract_renewals, terminations, resignations, attendances, attendance_punches, attendance_corrections'],
    ['Mobile / field', 'location_points, movement_logs, movement_segments, fuel_claims, fuel_claim_passengers, fuel_rates, vehicles, visits, vehicle_requests, accommodation_requests'],
    ['Audit / logs', 'audit_logs, notifications, announcements'],
  ],
  [80, CONTENT_W - 80]
);

h2('Key foreign-key links (closed loop)');
bullet('partners <- wash_orders.donor_id, igp_orders.donor_id');
bullet('projects <- wash_orders.project_id, expenses.project_id, bills.project_id');
bullet('proposals <- wash_orders.proposal_id, igp_orders.proposal_id (bidirectional)');
bullet('invoices <- wash_orders.invoice_id, igp_orders.invoice_id');
bullet('beneficiaries <- wash_items.beneficiary_id, igp_items.beneficiary_id');
bullet('vendors <- wash_items.assigned_contractor_id');
bullet('partners <- projects.partner_id, expenses.partner_id, bills.partner_id, invoices.partner_id');

// ===========================================================================
// 13. AUDIT
// ===========================================================================
newPage();
h1('13. Audit, Compliance, and Reporting');

h2('Audit log coverage');
p(
  'The audit_logs table captures every create/update/delete on entities '
  + 'most relevant to compliance and donor accountability. Every entry '
  + 'records the actor, IP, timestamp, before/after diff, and request path.'
);
bullet('Users, Roles, Role-Permissions');
bullet('Projects, Proposals, Approvals');
bullet('Beneficiaries, Vendors, Employment Agreements');
bullet('Bills, Payments, Donations, Journal Entries');
bullet('Cash Accounts, Cash Transactions, Cash Count Sessions, Petty Cash Replenishments');
bullet('Purchase Requisitions, RFQs, Quotations, Bid Analyses, POs, GRNs, Three-Way Matches');
bullet('WASH Orders, WASH Items, IGP Orders, IGP Items');
bullet('Attendance, Punches, Corrections, Fuel Rates, Fuel Claims, Movements');

h2('Generated documents');
table(
  ['Document', 'Where', 'Trigger'],
  [
    ['Cash voucher PDF', '/admin/finance/cash', 'On-demand per transaction'],
    ['Cash book PDF', '/admin/finance/cash', 'On-demand per account'],
    ['Payslip PDF', '/admin/hr/payroll', 'On payroll run'],
    ['Fuel claim PDF', '/admin/operations/fuel-claims', 'On approval'],
    ['Invoice PDF', '/admin/finance', 'On invoice generation'],
    ['Donation receipt', '(email)', 'On payment Completed'],
    ['WASH/IGP per-item PDF', 'Item detail', 'On-demand or stage Reported'],
    ['WASH/IGP donor bundle', 'Order detail', 'On-demand'],
    ['Proposal PDF', '/admin/proposals', 'On submission'],
    ['Project completion', '/admin/projects/:id', 'On-demand'],
  ],
  [180, 130, CONTENT_W - 310]
);

// ===========================================================================
// 14. DEPLOYMENT
// ===========================================================================
newPage();
h1('14. Deployment and Environment');

h2('Production stack');
table(
  ['Service', 'Provider', 'Purpose'],
  [
    ['Web + API', 'Vercel', 'Auto-deploy on push to main. Serverless functions for /api routes.'],
    ['Database', 'Supabase', 'PostgreSQL with automatic backups. SQL editor for migrations.'],
    ['Mobile CI', 'Codemagic', 'Manual trigger; auto-signs and uploads to TestFlight + Play.'],
    ['Email', 'SMTP', 'Bring-your-own (SendGrid, Mailgun, etc.). Dormant until configured.'],
    ['Storage', 'Supabase Storage', 'Uploaded photos, receipts, fuel claim attachments.'],
  ],
  [110, 110, CONTENT_W - 220]
);

h2('Required environment variables (Vercel)');
table(
  ['Variable', 'Required for', 'Notes'],
  [
    ['DATABASE_URL', 'Always', 'Supabase Postgres connection string'],
    ['JWT_SECRET', 'Always', 'Signs access + refresh tokens'],
    ['JWT_REFRESH_SECRET', 'Always', 'Separate from JWT_SECRET'],
    ['APP_BASE_URL', 'Email links', 'Your Vercel URL, no trailing slash'],
    ['SMTP_HOST', 'Email features', 'Without this, emails short-circuit silently'],
    ['SMTP_PORT', 'Email features', 'Default 587'],
    ['SMTP_USER', 'Email features', 'SMTP auth username'],
    ['SMTP_PASS', 'Email features', 'SMTP auth password'],
    ['EMAIL_FROM', 'Email features', 'e.g. GERSL <noreply@gersl.org>'],
    ['CRON_SECRET', 'Vercel Cron', 'Random 32+ char string'],
    ['SENTRY_DSN', 'Error tracking', 'Optional. App runs without it.'],
  ],
  [180, 120, CONTENT_W - 300]
);

h2('SQL migration history');
bullet('add_visits_orphan_columns.sql - orphan visit linkage');
bullet('add_hot_column_indexes.sql - performance indexes');
bullet('create_wash_igp_modules.sql - WASH/IGP tables + partner extensions');
bullet('extend_staff_columns.sql - HR profile columns for Edit Staff form');
bullet('add_partner_id_to_finance_tables.sql - partner FK + backfill');
bullet('add_programme_composite_indexes.sql - cron query optimisation');

callout(
  'Migration policy',
  'All migrations are idempotent. Safe to re-run. To apply, paste contents '
  + 'into Supabase SQL Editor and run. No migration framework currently '
  + 'tracks applied state - take care to apply only what is unrun.'
);

// ===========================================================================
// 15. PARKED
// ===========================================================================
newPage();
h1('15. What Is Intentionally Parked');
p(
  'These features have been considered or partially scoped but deliberately '
  + 'not built - either because they need stakeholder decisions, additional '
  + 'budget, or the current workaround is sufficient.'
);

h2('Mobile push notifications (FCM)');
p(
  'The mobile app currently relies on email + manual app open for '
  + 'notifications. Firebase Cloud Messaging would add proper push. '
  + 'Estimated effort: 1-2 days. Blocker: Firebase project decision + '
  + 'iOS APNs key.'
);

h2('Partner self-service portal');
p(
  'Donors currently receive PDF reports by email. A login portal where '
  + 'partners can view their own orders, invoices, and reports would '
  + 'replace most ad-hoc email exchanges. Estimated effort: 1-1.5 days. '
  + 'Alternative: tokenised share links per partner (2 hours).'
);

h2('Bank to Cash reconciliation workflow');
p(
  'Currently manual: finance officer reconciles bank transactions against '
  + 'cash accounts by eye. An automated reconciliation screen with matching '
  + 'algorithms would speed this up. Multi-day effort.'
);

h2('Auto journal-entry creation');
p(
  'Every cash transaction would ideally generate a corresponding journal '
  + 'entry on the chart of accounts. Currently those are entered manually. '
  + 'Multi-day implementation across cash, finance, and accounting modules.'
);

h2('Refresh token rotation');
p(
  'Refresh tokens are reused for the full 7-day window. Rotating on each '
  + 'use would shorten the theft window. Few-hour change but needs careful '
  + 'rollout to avoid logging out active sessions.'
);

// ===========================================================================
// 16. APPENDIX
// ===========================================================================
newPage();
h1('16. Appendix');

h2('A. REST API surface (high level)');
table(
  ['Prefix', 'Module'],
  [
    ['/api/auth/*', 'Login, register, refresh, logout, password reset'],
    ['/api/users/*', 'User management, profile, current user'],
    ['/api/orphans/*', 'Orphan registry, visits, reports'],
    ['/api/wash/*', 'WASH orders, items, stage updates, summary'],
    ['/api/igp/*', 'IGP orders, items, stage updates, follow-up'],
    ['/api/map/pins', 'Unified map pins (WASH + IGP + Orphan + Households)'],
    ['/api/partners/*', 'Partner CRM + financial rollup'],
    ['/api/proposals/*', 'Proposals + convert-to-project + convert-to-order'],
    ['/api/projects/*', 'Projects + budget vs actual + indicators'],
    ['/api/finance/*', 'Invoices, bills, expenses, journal entries, accounts'],
    ['/api/cash/*', 'Cash accounts, transactions, vouchers, replenishments'],
    ['/api/hr/*', 'Staff register, payroll, leave, expenses, advances'],
    ['/api/procurement/*', 'PRs, RFQs, POs, GRNs, vendors, three-way match'],
    ['/api/me/*', 'Self-service for mobile (visits, leaves, expenses)'],
    ['/api/cron/*', 'Scheduled-job triggers (auth via x-cron-secret)'],
    ['/api/audit-logs', 'Audit log access (Admin/CEO/BOD only)'],
  ],
  [140, CONTENT_W - 140]
);

h2('B. Glossary');
const glossary = [
  ['WASH', 'Water, Sanitation, Hygiene - programme delivering installations to beneficiaries.'],
  ['IGP', 'Income Generating Programmes - livelihood asset distribution.'],
  ['MEAL', 'Monitoring, Evaluation, Accountability, Learning - programme quality function.'],
  ['Partner', 'Donor organisation funding programmes (e.g. AlKhair UK, One Nation).'],
  ['Beneficiary', 'Named individual receiving support - household head or guardian.'],
  ['Order', 'A batch of work from a donor (e.g. 50 hand pumps for April).'],
  ['Item', 'One installation/asset within an order - one beneficiary, one GPS point.'],
  ['Stage', 'Operational status of an item (Ordered -> Surveyed -> ... -> Reported).'],
  ['Stage update', 'Append-only timeline entry with photos, GPS, notes per transition.'],
  ['Funds-gate', 'Rule that blocks (or warns) on work starting before donor pays.'],
  ['Donor bundle', 'PDF report combining a cover sheet with one page per item.'],
  ['Voucher', 'Cash transaction printout (A5 PDF) for audit attachment.'],
  ['Three-way match', 'Procurement check: PO + GRN + vendor invoice must agree.'],
];
glossary.forEach(([term, def]) => {
  kv(term, def);
});

h2('C. Regenerating this document');
p(
  'This PDF is generated from scripts/generate_app_overview.cjs using the '
  + 'PDFKit dependency already in the server package.'
);
doc.font('Courier').fontSize(9).fillColor(INK_700)
   .text('cd <repo-root>',                          { indent: 20 });
doc.text('node scripts/generate_app_overview.cjs',   { indent: 20 });
doc.text('-> docs/GERSL-Management-Overview.pdf',    { indent: 20 });
doc.moveDown(0.6);
doc.font(F_REG).fontSize(10).fillColor(INK_700)
   .text(
     'Add new sections by editing the script. Each h1/h2/p/bullet/table '
     + 'helper handles pagination automatically, so you can append content '
     + 'top-to-bottom without managing page breaks manually.',
     { width: CONTENT_W, lineGap: 2 }
   );

// ===========================================================================
// FINISH — wait for stream to close before reporting success.
// ===========================================================================
doc.end();
out.on('finish', () => console.log(`OK wrote ${OUT_FILE}`));
out.on('error', (err) => {
  console.error('write failed:', err);
  process.exit(1);
});
