// Generate the GERSL system report as a styled PDF using pdfkit.
// Output: docs/GERSL-system-report.pdf
//
// Run:  node scripts/generate_report.cjs

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUT_DIR = path.join(__dirname, '..', 'docs');
const OUT_FILE = path.join(OUT_DIR, 'GERSL-system-report.pdf');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- Design tokens (mirror the app palette) -------------------------------
const NAVY      = '#0D1D3D';
const NAVY_700  = '#1A346C';
const MISSION   = '#F59E0B';
const MISSION_DARK = '#D97706';
const INK_900   = '#0F172A';
const INK_700   = '#334155';
const INK_500   = '#64748B';
const INK_400   = '#94A3B8';
const INK_200   = '#E2E8F0';
const INK_100   = '#EEF1F5';
const INK_50    = '#F5F7FA';
const SUCCESS   = '#16A34A';
const DANGER    = '#DC2626';

const FONT_REG  = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const FONT_OBL  = 'Helvetica-Oblique';

const PAGE = { size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } };
const PAGE_W = 595.28; // A4 width in pt
const PAGE_H = 841.89;

const doc = new PDFDocument({ ...PAGE, autoFirstPage: false, bufferPages: true, info: {
  Title: 'GERSL System Report',
  Author: 'Global Ehsan Relief — Sri Lanka',
  Subject: 'NGO Management System — full architecture & operations report',
  Keywords: 'GERSL, NGO, management, Sri Lanka, system report',
  CreationDate: new Date(),
}});

doc.pipe(fs.createWriteStream(OUT_FILE));

// ---- helpers --------------------------------------------------------------
let pageNum = 0;
function addPage() {
  doc.addPage();
  pageNum += 1;
  drawPageChrome();
}

function drawPageChrome() {
  // Top mission-amber rule
  doc.save()
    .rect(0, 0, PAGE_W, 4).fill(MISSION)
    .restore();
  // Footer line
  doc.save()
    .rect(56, PAGE_H - 32, PAGE_W - 112, 0.6).fill(INK_200)
    .restore();
  // Footer text
  doc.font(FONT_REG).fontSize(8).fillColor(INK_500)
    .text('GERSL — Global Ehsan Relief · Sri Lanka', 56, PAGE_H - 26,
      { width: PAGE_W - 112, align: 'left' });
  doc.text(`Page ${pageNum}`, 56, PAGE_H - 26,
      { width: PAGE_W - 112, align: 'right' });
}

function ensureSpace(needed) {
  if (doc.y + needed > PAGE_H - 60) addPage();
}

function h1(text) {
  ensureSpace(80);
  doc.moveDown(0.4);
  doc.font(FONT_BOLD).fontSize(22).fillColor(NAVY).text(text);
  doc.moveTo(56, doc.y + 4).lineTo(120, doc.y + 4).lineWidth(2).strokeColor(MISSION).stroke();
  doc.moveDown(0.6);
}

function h2(text) {
  ensureSpace(48);
  doc.moveDown(0.4);
  doc.font(FONT_BOLD).fontSize(14).fillColor(NAVY).text(text);
  doc.moveDown(0.2);
}

function h3(text) {
  ensureSpace(34);
  doc.moveDown(0.3);
  doc.font(FONT_BOLD).fontSize(11.5).fillColor(INK_900).text(text);
  doc.moveDown(0.15);
}

function body(text, opts = {}) {
  ensureSpace(40);
  doc.font(FONT_REG).fontSize(10).fillColor(INK_700)
    .text(text, { lineGap: 2, align: 'left', ...opts });
  doc.moveDown(0.4);
}

function bullet(items) {
  doc.font(FONT_REG).fontSize(10).fillColor(INK_700);
  for (const item of items) {
    ensureSpace(24);
    const indent = 56 + 12;
    const bulletY = doc.y + 4;
    doc.save().circle(56 + 4, bulletY, 1.7).fill(MISSION).restore();
    doc.text(item, indent, doc.y, {
      width: PAGE_W - indent - 56,
      lineGap: 2,
      align: 'left',
    });
    doc.moveDown(0.18);
  }
  doc.moveDown(0.2);
}

function kv(rows) {
  // Two-column key/value list (40% / 60%)
  const startX = 56;
  const widthK = 170;
  const widthV = PAGE_W - 112 - widthK - 10;
  doc.font(FONT_REG).fontSize(10);
  for (const [k, v] of rows) {
    ensureSpace(20);
    const y = doc.y;
    doc.font(FONT_BOLD).fillColor(NAVY).text(k, startX, y, { width: widthK });
    doc.font(FONT_REG).fillColor(INK_700).text(v, startX + widthK + 10, y, { width: widthV });
    doc.moveDown(0.25);
  }
  doc.moveDown(0.3);
}

function tableSimple(headers, rows, colWidths) {
  const startX = 56;
  const tableW = PAGE_W - 112;
  const widths = colWidths || headers.map(() => tableW / headers.length);
  ensureSpace(40);

  // Header band
  const headerY = doc.y;
  doc.save().rect(startX, headerY, tableW, 22).fill(NAVY).restore();
  doc.font(FONT_BOLD).fontSize(9.5).fillColor('#FFFFFF');
  let cx = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], cx + 6, headerY + 6, { width: widths[i] - 12, lineBreak: false });
    cx += widths[i];
  }
  doc.y = headerY + 22;

  // Rows
  doc.font(FONT_REG).fontSize(9.5).fillColor(INK_700);
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    // Compute row height from tallest cell
    const heights = row.map((cell, i) => doc.heightOfString(String(cell ?? ''), {
      width: widths[i] - 12, lineGap: 1.5,
    }));
    const rh = Math.max(20, ...heights.map(h => h + 8));
    if (doc.y + rh > PAGE_H - 60) {
      addPage();
      // Re-render header at top of new page
      const hy = doc.y;
      doc.save().rect(startX, hy, tableW, 22).fill(NAVY).restore();
      doc.font(FONT_BOLD).fontSize(9.5).fillColor('#FFFFFF');
      let cx2 = startX;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], cx2 + 6, hy + 6, { width: widths[i] - 12, lineBreak: false });
        cx2 += widths[i];
      }
      doc.y = hy + 22;
      doc.font(FONT_REG).fontSize(9.5).fillColor(INK_700);
    }
    const ry = doc.y;
    if (r % 2 === 0) {
      doc.save().rect(startX, ry, tableW, rh).fill(INK_50).restore();
    }
    cx = startX;
    for (let i = 0; i < row.length; i++) {
      doc.fillColor(INK_700)
        .text(String(row[i] ?? ''), cx + 6, ry + 4, {
          width: widths[i] - 12, lineGap: 1.5,
        });
      cx += widths[i];
    }
    // Row underline
    doc.save().moveTo(startX, ry + rh).lineTo(startX + tableW, ry + rh)
      .lineWidth(0.4).strokeColor(INK_200).stroke().restore();
    doc.y = ry + rh;
  }
  doc.moveDown(0.6);
}

function callout(title, text, color = NAVY) {
  ensureSpace(60);
  const startX = 56;
  const w = PAGE_W - 112;
  const padding = 12;
  doc.font(FONT_BOLD).fontSize(10.5);
  const tH = doc.heightOfString(title, { width: w - padding * 2 });
  doc.font(FONT_REG).fontSize(10);
  const bH = doc.heightOfString(text, { width: w - padding * 2, lineGap: 2 });
  const h = padding * 2 + tH + 4 + bH;
  const y = doc.y;
  doc.save()
    .rect(startX, y, w, h).fill(INK_50)
    .rect(startX, y, 3, h).fill(color)
    .restore();
  doc.font(FONT_BOLD).fontSize(10.5).fillColor(color)
    .text(title, startX + padding, y + padding, { width: w - padding * 2 });
  doc.font(FONT_REG).fontSize(10).fillColor(INK_700)
    .text(text, startX + padding, y + padding + tH + 4, {
      width: w - padding * 2, lineGap: 2,
    });
  doc.y = y + h + 8;
}

// ============================================================================
// COVER
// ============================================================================
doc.addPage();
pageNum = 1;

// Navy hero band on cover
doc.save().rect(0, 0, PAGE_W, 360).fill(NAVY).restore();
// Mission-amber accent strip on top
doc.save().rect(0, 0, PAGE_W, 6).fill(MISSION).restore();
// Decorative blob (simulated with a soft circle)
doc.save().circle(PAGE_W - 60, 80, 100).fillOpacity(0.10).fill(MISSION).restore();
doc.save().circle(40, 320, 130).fillOpacity(0.08).fill('#FFFFFF').restore();

// Eyebrow
doc.font(FONT_BOLD).fontSize(11).fillColor(MISSION)
  .text('GLOBAL EHSAN RELIEF · SRI LANKA', 56, 90, { characterSpacing: 1.6 });

// Title
doc.font(FONT_BOLD).fontSize(36).fillColor('#FFFFFF')
  .text('GERSL Management System', 56, 120, { width: PAGE_W - 112, lineGap: 2 });

// Subtitle
doc.font(FONT_REG).fontSize(14).fillColor('#E2E8F0')
  .text('Complete system report — architecture, modules, workflows, deployment, mobile.',
    56, 200, { width: PAGE_W - 112 });

doc.font(FONT_OBL).fontSize(11).fillColor('#FCD34D')
  .text('“Serving communities across Sri Lanka.”', 56, 250);

// Meta panel
doc.save().rect(56, 380, PAGE_W - 112, 110).fill('#FFFFFF')
  .strokeColor(INK_200).lineWidth(1).stroke().restore();
doc.font(FONT_BOLD).fontSize(10).fillColor(NAVY)
  .text('Report metadata', 70, 394);
doc.moveTo(70, 412).lineTo(120, 412).lineWidth(1.5).strokeColor(MISSION).stroke();
const today = new Date().toISOString().slice(0, 10);
doc.font(FONT_REG).fontSize(10).fillColor(INK_700);
[
  ['Issued',     today],
  ['Audience',   'NGO leadership, IT operations, prospective deployment partners'],
  ['Stack',      'React 19 + Vite · Express + Sequelize · PostgreSQL · Flutter 3.41'],
  ['Hosting',    'Vercel (web + serverless API), Supabase Postgres, Cloudflare R2'],
].forEach(([k, v], i) => {
  doc.font(FONT_BOLD).fillColor(NAVY).text(k, 70, 422 + i * 14, { width: 90 });
  doc.font(FONT_REG).fillColor(INK_700).text(v, 165, 422 + i * 14, { width: PAGE_W - 220 });
});

// Footer
doc.save().rect(0, PAGE_H - 26, PAGE_W, 26).fill(NAVY).restore();
doc.font(FONT_REG).fontSize(9).fillColor('#FCD34D')
  .text('GERSL · Confidential', 56, PAGE_H - 18, { align: 'left' });
doc.font(FONT_REG).fontSize(9).fillColor('#E2E8F0')
  .text(`Issued ${today}`, 0, PAGE_H - 18, { align: 'right', width: PAGE_W - 56 });

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================
addPage();
h1('Table of contents');
const tocEntries = [
  ['1. Executive summary', '3'],
  ['2. What the app does', '3'],
  ['3. User personas & roles', '4'],
  ['4. Module-by-module walkthrough', '5'],
  ['5. End-to-end workflows', '8'],
  ['6. Mobile app — field workflow', '10'],
  ['7. Architecture overview', '11'],
  ['8. Tech stack — web', '12'],
  ['9. Tech stack — backend', '13'],
  ['10. Tech stack — mobile', '14'],
  ['11. Data model', '15'],
  ['12. Security & RBAC', '16'],
  ['13. Design system', '17'],
  ['14. Deployment & operations', '18'],
  ['15. Project status, KPIs & metrics', '19'],
  ['16. Roadmap & known follow-ups', '20'],
  ['17. Appendix — admin pages, routes, models', '21'],
];
doc.font(FONT_REG).fontSize(11).fillColor(INK_700);
for (const [label, page] of tocEntries) {
  ensureSpace(22);
  const y = doc.y;
  doc.text(label, 56, y, { width: 360, continued: false });
  // dotted leader
  doc.font(FONT_REG).fontSize(11).fillColor(INK_400);
  const dotY = y + 6;
  let x = 56 + doc.widthOfString(label) + 6;
  while (x < PAGE_W - 80) {
    doc.circle(x, dotY, 0.6).fill(INK_400);
    x += 4;
  }
  doc.fillColor(NAVY).font(FONT_BOLD).text(page, PAGE_W - 92, y, { width: 36, align: 'right' });
  doc.font(FONT_REG).fillColor(INK_700);
  doc.moveDown(0.4);
}

// ============================================================================
// 1. EXECUTIVE SUMMARY
// ============================================================================
addPage();
h1('1. Executive summary');
body([
  'GERSL is the Global Ehsan Relief – Sri Lanka management system: a single platform that runs every operational facet of the NGO. It combines a React-based web admin for headquarters staff, a Flutter mobile app for field workers, and a shared Node/Express API backed by PostgreSQL on Supabase and S3-compatible object storage on Cloudflare R2. The whole stack is deployed serverlessly on Vercel and is currently in production.',
  '',
  'Functionally, GERSL covers the full NGO operating cycle: beneficiary care (orphans, sponsorships, coordinator visits, distributions), programme delivery (projects, activities, tasks, MEAL indicators, evaluations, complaints), field operations (movement register, fuel claims, GPS tracking, live staff map), human resources (staff master, attendance with selfie punch, shifts, onboarding, appraisal, AI-assisted contracts, payroll), finance (chart of accounts, journals, bank/cash accounts, replenishments, bills, payments, fixed assets, donations, grants), procurement (vendor master, RFQ workflow, bid analysis, purchase orders, PDF), fundraising (partners/donors, AI-assisted proposals, campaigns), compliance & safeguarding (incidents, policies, training, background checks, data protection), CBO partner management, public engagement (campaigns, donations, job postings, vendor calls — surfaced on the public portal), and cross-cutting concerns like multi-stage approvals, audit log, notifications, announcements, social media, and reports.',
  '',
  'Operationally, the system is one product across three surfaces — web admin, public portal, and mobile — sharing one design language (navy + mission-amber + ink slate, Inter typography) and a deliberate set of primitive components so changes propagate end-to-end. The recent ten-wave UI overhaul standardised every admin page on the canonical navy-band hero pattern and ported the same design system to the Flutter app.',
].join('\n'));

// ============================================================================
// 2. WHAT THE APP DOES
// ============================================================================
addPage();
h1('2. What the app does');
body('GERSL replaces what most NGOs piece together from spreadsheets, paper forms, and disconnected SaaS tools. It centralises the day-to-day record-keeping, the approval workflows, the field operations, and the donor-facing public face into one auditable platform.');

h2('2.1  Operational scope');
bullet([
  'Beneficiary care — orphan registry, sponsorship, coordinator visits, individual & aggregate distributions, needs reports.',
  'Programme delivery — projects, activities, tasks (assignment + tracking + beneficiary linkage), completion reports.',
  'Field operations — staff movement register, fuel claims auto-derived from GPS distance, live staff map, shift roster.',
  'Human resources — full staff master, attendance with selfie + GPS punch + corrections workflow, onboarding checklist, appraisal cycle, AI-drafted contracts, payroll, payslips, leave, salary advances, expense claims.',
  'Finance — chart of accounts, journal entries, bank accounts/transactions, cash accounts (locker, cash book, petty cash), replenishment queue, bills/payables, payments, invoices, fixed assets, donations, grants.',
  'Procurement — requisition inbox, vendor master with due-diligence, multi-vendor RFQ + quotation workspace, bid-analysis matrix, purchase order issuance, threshold-based approval routing, PO PDF generation.',
  'Fundraising — partners/donors, AI-assisted proposal drafting, donor relationship history, campaigns + packages, donation collection.',
  'MEAL — log-frame indicators, evaluations (wizard-based), complaints, MEAL reports.',
  'Compliance & safeguarding — incident reporting, policies, mandatory training records, background checks, data-protection requests, learning events.',
  'CBO partners — CBO master, due diligence, projects, proposals, activities, volunteers.',
  'Public engagement — public-facing campaign pages, donation collection, job postings, vendor calls (tenders), all editable from the admin and visible on the public portal.',
  'Cross-cutting — multi-stage Approval Centre, immutable Audit Log, in-app Notifications, organisation-wide Announcements, Social Media planner, Reports & Analytics, Settings (users, roles, permissions, devices).',
]);

h2('2.2  Surfaces');
kv([
  ['Web admin',       'Used by HQ, finance, HR, programme, procurement, MEAL and management. ~150 pages.'],
  ['Public portal',   '12 pages — Home, About, Campaigns (+detail), Careers (+detail), Tenders (+detail), Contact, Orphans-in-Need, Privacy, Terms.'],
  ['Mobile app',      'Used by field officers and managers. 14 screens (Today, Visits, Tasks, Movements, Fuel claims, Leave, Expenses, Shifts, Salary advances, Payslips, Approvals, Announcements + Login + Drawer).'],
]);

// ============================================================================
// 3. USER PERSONAS & ROLES
// ============================================================================
addPage();
h1('3. User personas & roles');
body('Every action in GERSL is permission-gated. Roles are defined in the database and each one is mapped to a flat keyspace of 150+ permissions of the form `module:action` (e.g. `orphans:view`, `finance:approve_po`, `projects:ceo_approve`). A single super-admin permission `*` exists for emergency access. The wildcard fallback bypasses page-level checks entirely.');

h2('3.1  Built-in roles');
tableSimple(
  ['Role', 'Typical user', 'Primary responsibilities'],
  [
    ['Admin / Super-admin', 'IT', 'Full system access, manage users, roles and permissions.'],
    ['BOD', 'Board members', 'Read-only oversight across modules; sees Executive Dashboard.'],
    ['CEO', 'Executive Director', 'Final approver on high-value POs, projects and proposals.'],
    ['Director Programmes', 'Senior management', 'Approves project plans, oversees programme delivery.'],
    ['Programme Manager', 'Programme leads', 'Manages projects, tasks, MEAL indicators and field teams.'],
    ['Project Officer (multiple variants)', 'Field/admin staff', 'Executes activities, logs visits, distributes aid.'],
    ['Finance Manager', 'Finance head', 'Approves bills, journals and payroll runs.'],
    ['Finance Officer / Accountant', 'Finance team', 'Records transactions, reconciles cash and bank.'],
    ['HR Manager', 'HR head', 'Approves leave, manages onboarding, payroll, contracts.'],
    ['HR Officer / Assistant', 'HR support', 'Records attendance corrections, manages shifts.'],
    ['Fundraising Manager', 'Fundraising head', 'Manages donors, proposals and campaigns.'],
    ['MEAL Officer', 'MEAL team', 'Manages indicators, evaluations and complaints.'],
    ['Media / Media Production Officer', 'Comms team', 'Runs the social media planner and announcements.'],
    ['Field Officer', 'Field staff', 'Mobile-first: punch, visits, tasks, claims, expenses.'],
    ['Orphan Coordinator', 'Field staff', 'Manages assigned orphan caseload and visit scheduling.'],
    ['Guest', 'External', 'Read-only access to specific shared dashboards.'],
  ],
  [120, 100, PAGE_W - 112 - 220]
);

h2('3.2  How permissions cascade');
body('On `/auth/login`, the API returns the user record together with their flattened permission list. The web app stores the user in `AuthContext` and all pages, sidebar items and action buttons gate themselves with `hasPermission(\'module:action\')`. The mobile app keeps the same user object in `flutter_secure_storage` and gates approval/admin features the same way (see `_approverRoles` whitelist for the mobile Approvals queue). Server routes additionally re-check permissions in their middleware so a manipulated client cannot escalate.');

// ============================================================================
// 4. MODULE-BY-MODULE WALKTHROUGH
// ============================================================================
addPage();
h1('4. Module-by-module walkthrough');

const modules = [
  ['Dashboard', 'Three dashboards: Executive (KPIs across the org), Admin (operational health), Staff "My Dashboard" (personal tasks, visits, leave balance). Lives Reached and mission-amber metrics are surfaced in hero cards.'],
  ['Orphan Care', 'Master list with grid/list/map views, sponsorship records, coordinator assignment, visit logs, individual & aggregate distribution flows, needs report wizard, bulk Excel upload.'],
  ['Coordinators', 'Field coordinator roster, assignments, performance, communication log.'],
  ['Beneficiaries', 'Universal beneficiary database shared across projects. Bulk upload, list generator (Annex-style), demographic filters, support history.'],
  ['Partners & Donors', 'Partner/donor master, communication log, contribution analytics, contract documents.'],
  ['Proposals', 'Multi-stage proposal pipeline (Draft → Internal Review → CEO → Donor → Funded). AI assistant drafts narrative sections from a brief. Email modal pushes to donor.'],
  ['Projects', 'Portfolio view with budget distribution, status overview, completion-rate trend, performance KPIs. Per-project: team members, financials, tasks (Gantt + list), MEAL indicators/evaluations/complaints, completion report (Annex D).'],
  ['Activities', 'Within projects: scheduled activities with deliverables, beneficiary counts and media coverage uploads.'],
  ['Tasks / My Tasks', 'Org-wide task board with assignment, comments, attachments and beneficiary linkage. Field staff see only "My Tasks".'],
  ['Movement register', 'Field-trip log: plan → depart → arrive → return. Auto-tracks distance for fuel-claim derivation.'],
  ['Fuel claims & rates', 'Auto-derived from returned movements (rate × km, lunch-hour deduction). Vehicle-typed rates effective-dated.'],
  ['Approvals', 'Centralised queue across proposals, projects, finance items, leave, expenses, salary advances. Mobile mirror for managers on the go.'],
  ['Compliance & Safeguarding', 'Incidents, policies, training records, background checks, data-protection requests, learning events.'],
  ['Finance', 'Chart of accounts, journal entries, bank + cash accounts, locker / cash book / petty cash registers, replenishment queue, bills/payables, payments, invoices, fixed assets, financial reports.'],
  ['Procurement', 'Inbox of requisitions assigned to procurement officers, vendor master with due-diligence, RFQ workspace (invite vendors, capture quotations, bid-analysis matrix), purchase order issuance with PDF, scope-aware threshold matrix.'],
  ['Public Engagement', 'Campaigns (with packages) → donations → public donor flow. Job Postings → public Careers page. Vendor Calls → public Tenders page.'],
  ['CBO Partners', 'CBO master, due diligence, projects, proposals, activities, volunteers — separate workflow from internal projects.'],
  ['MEAL', 'Indicators with progress tracking, evaluation wizards, complaint intake.'],
  ['Social Media', 'Content calendar, scheduled posts, analytics cards.'],
  ['Announcements', 'Org-wide messaging visible in admin and on the mobile drawer feed.'],
  ['Reports & Analytics', 'Cross-module reports with PDF/Excel export and email scheduling.'],
  ['Settings', 'User management, role/permission editor, device management, notification rules, system settings.'],
];

for (const [name, desc] of modules) {
  ensureSpace(40);
  doc.font(FONT_BOLD).fontSize(11).fillColor(NAVY).text('• ' + name);
  doc.font(FONT_REG).fontSize(10).fillColor(INK_700)
    .text(desc, 70, doc.y, { width: PAGE_W - 70 - 56, lineGap: 1.5 });
  doc.moveDown(0.5);
}

// ============================================================================
// 5. END-TO-END WORKFLOWS
// ============================================================================
addPage();
h1('5. End-to-end workflows');

h2('5.1  Project → activity → task → distribution');
bullet([
  'Programme Manager creates a Project with budget, timeline, programme area, location.',
  'Director Programmes / CEO approve in the Approvals Centre (multi-stage gate).',
  'Project Officer creates Activities under the project (with planned dates, deliverables, target beneficiaries).',
  'Tasks are assigned to staff with priorities, due dates and beneficiary linkage.',
  'Field staff execute and record either an Individual Distribution (per beneficiary) or an Aggregate Distribution (head-count + media coverage).',
  'MEAL indicators auto-update from underlying records; evaluations and complaints attach to the project.',
  'On closure, Project Completion Report (Annex D) is generated as PDF.',
]);

h2('5.2  Procurement (RFQ → PO)');
bullet([
  'Requisition created (often from a project or budget line) lands in Procurement Inbox.',
  'Procurement Manager assigns to an officer and selects the procurement method.',
  'Officer opens RFQ Builder Modal, picks ≥3 active vendors from the master, sets scope-of-work, closing date, payment & delivery terms.',
  'Draft RFQ created → Send marks it Sent and emails each invited vendor.',
  'Quotations captured in the RFQ Workspace; bid-analysis matrix computes recommended vendor.',
  'PO drafted → routed through threshold matrix (scope: global / donor / project, by amount band) for approval.',
  'On approval, PO PDF generated server-side via pdfkit and sent to vendor.',
]);

h2('5.3  Field punch → fuel claim');
bullet([
  'Field officer opens the mobile app, hits "Punch IN" on the Today screen.',
  'App captures front-camera selfie + GPS coordinates + accuracy → uploaded to R2 → recorded with geofence-match flag.',
  'Officer logs a Movement (plan → depart → arrive → return) over the day.',
  'On Return, distance × vehicle-type rate (minus lunch-hour deduction) auto-creates a Fuel Claim.',
  'Approvers see pending claims under Operations · Fuel Claims and the mobile Approvals queue.',
]);

h2('5.4  Leave / expense / advance request');
bullet([
  'Staff submits via mobile (or web) — request lands in Pending status.',
  'Notification fires to the appropriate approver pool (HR Manager for leave, Finance Manager for expenses & advances).',
  'Approver opens Approvals Centre (web or mobile), reviews details, approves or rejects with comment.',
  'Approved expenses flow into the next payable run; approved advances are deducted from the next payslip.',
]);

h2('5.5  Donor proposal');
bullet([
  'Fundraising Officer creates a draft proposal — fills donor, project tie-in, requested amount, narrative outline.',
  'AI Assistant drafts narrative sections from a brief.',
  'Internal review → CEO sign-off → Donor submission via the integrated email modal.',
  'Pipeline view tracks each proposal\'s stage and success rate.',
  'On Funded status, a Project shell can be auto-created and budget seeded from the proposal.',
]);

// ============================================================================
// 6. MOBILE APP
// ============================================================================
addPage();
h1('6. Mobile app — field workflow');
body('The Flutter mobile app is built for field staff and managers, designed to function on low-end Android devices and intermittent connectivity. It uses the same backend, the same auth, and (after the recent overhaul) the same design language as the web admin.');

h2('6.1  Daily field workflow');
bullet([
  'Open app → already signed in via secure storage; landing tab is "Today".',
  'Today screen shows a navy hero card with current clocked-in status, last punch time, and primary Punch IN (mission-amber) / Punch OUT (outline) buttons.',
  'On Punch IN, the app captures a selfie + GPS, uploads via the punch endpoint, and records the geofence-match.',
  'Throughout the day: log Visits (beneficiaries served, project, purpose), tick off Tasks, register Movements (depart/arrive/return), submit Expenses and Leave requests.',
  'Background GPS service with foreground notification keeps tracking on for assigned routes; toggle from the app bar.',
  'Managers also see the Approvals queue (leave, expense, advance) for their team, and the Announcements feed.',
]);

h2('6.2  Mobile screens');
tableSimple(
  ['Surface', 'Purpose'],
  [
    ['Today / Punch', 'In/Out + Break + selfie + GPS, today\'s punch list.'],
    ['Visits', 'List + log visits with beneficiary count, project, purpose.'],
    ['My Tasks', 'Assigned tasks with priority + status + project linkage.'],
    ['Movements', 'Field-trip register: plan → depart → arrive → return.'],
    ['Fuel claims', 'Auto-derived claims from returned movements.'],
    ['Leave', 'Request + cancel pending; statuses visible.'],
    ['Expenses', 'Submit with receipt photo; cancel pending.'],
    ['Shifts', 'Roster for the next 60 days.'],
    ['Salary advances', 'Request; managers can approve/reject in-line.'],
    ['Payslips', 'List + open PDF externally.'],
    ['Approvals', 'Manager-only batched queue (leave + expense + advance).'],
    ['Announcements', 'Read-only org-wide feed.'],
  ],
  [110, PAGE_W - 112 - 110]
);

h2('6.3  Mobile-specific permissions');
body('The mobile app declares: INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACCESS_BACKGROUND_LOCATION, CAMERA, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION, WAKE_LOCK, RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS. The background location service uses foregroundServiceType="location" so Android 12+ permits continuous tracking with a persistent notification.');

// ============================================================================
// 7. ARCHITECTURE
// ============================================================================
addPage();
h1('7. Architecture overview');
body('GERSL is a single-repo monorepo deployed as one Vercel project. The frontend (web admin + public portal) is a single-page React app. The backend is the same Express app you would `node` locally — but invoked from Vercel\'s serverless runtime via `api/index.js` which directly calls `app(req, res)` (the `serverless-http` wrapper was removed because it caused 30-second hangs).');

h2('7.1  Request paths');
bullet([
  'Browser hits Vercel edge → `/api/*` rewritten to the serverless function `api/index.js` → Express app → controller → Sequelize → Postgres on Supabase.',
  'Browser hits Vercel edge → static path → CDN serves Vite-built JS/CSS/HTML from `dist/`.',
  'Browser hits any unknown path → SPA fallback rewrite serves `index.html`, React Router takes over.',
  'Mobile app (dio) → Same `/api/*` endpoints. Auth via Bearer header from secure storage.',
  'File uploads → multer-s3 → Cloudflare R2 (S3-compatible). URLs returned to client.',
  'Daily cron → Vercel cron triggers `/api/cron/cluster` at 01:30 UTC for movement clustering.',
]);

h2('7.2  Logical layers');
kv([
  ['Presentation',  'React 19 + Tailwind 3 + Radix UI; Flutter 3.41 + Material 3 + Riverpod.'],
  ['State',         'Web: Zustand + React Contexts + TanStack Query. Mobile: Riverpod.'],
  ['API contract',  'REST under `/api`; JWT in httpOnly cookie (web) and Bearer header (mobile).'],
  ['Domain',        'Express controllers + Sequelize models; multi-stage Approval domain.'],
  ['Persistence',   'Postgres on Supabase (managed, SSL, IPv4); SQLite fallback for offline dev.'],
  ['Object store',  'Cloudflare R2 via @aws-sdk/client-s3 + multer-s3 + signed URLs.'],
  ['Background',    'node-cron + Vercel scheduled cron; foreground GPS service in Flutter.'],
  ['Observability', 'morgan request logs + winston app logs; immutable AuditLog model.'],
]);

// ============================================================================
// 8. WEB STACK
// ============================================================================
addPage();
h1('8. Tech stack — web');
tableSimple(
  ['Concern', 'Choice'],
  [
    ['Framework', 'React 19.1 + Vite 7.1'],
    ['Routing', 'react-router-dom 7.9'],
    ['Styling', 'Tailwind 3.4 with custom design tokens (navy, ink, mission, success, danger)'],
    ['Typography', 'Inter + Inter Tight via Google Fonts'],
    ['Component primitives', 'src/components/ui/primitives.jsx — PageHeader, PageWrap, Card, Button, Badge, StatusBadge, EmptyState, ErrorBox, Field, Th/Td'],
    ['Headless UI', 'Radix (Dialog, Dropdown, Select, Tabs, Tooltip, Popover, Switch, Checkbox, Radio)'],
    ['Icons', 'lucide-react'],
    ['State', 'Zustand 5 + 22 React Contexts + TanStack React-Query 5.90 + react-error-boundary'],
    ['HTTP', 'axios; base URL via src/config/apiBase.js'],
    ['Validation', 'zod'],
    ['Maps', 'leaflet + react-leaflet'],
    ['Charts', 'recharts'],
    ['Tables / exports', 'xlsx, file-saver, jspdf, jspdf-autotable'],
    ['Sanitization', 'dompurify'],
    ['Toasts', 'react-toastify'],
    ['Build chunking', 'Manual: react-vendor, ui-vendor, utils-vendor, chart-vendor, document-vendor, plus per-module chunks'],
    ['Minification', 'terser, drop_console + drop_debugger in prod'],
    ['ESLint', 'flat config + react-hooks + react-refresh'],
    ['Code volume', '~103,661 LOC across 60 page files + 51 page-level components + 22 contexts + ~200 shared components'],
  ],
  [150, PAGE_W - 112 - 150]
);

// ============================================================================
// 9. BACKEND STACK
// ============================================================================
addPage();
h1('9. Tech stack — backend');
tableSimple(
  ['Concern', 'Choice'],
  [
    ['Runtime', 'Node.js (ESM "type":"module")'],
    ['Web framework', 'Express 4.18'],
    ['ORM', 'Sequelize 6.35 with pg-hstore'],
    ['Database', 'PostgreSQL on Supabase (project gersl-management-dev, ap-northeast-1). SQLite fallback for offline dev.'],
    ['Static pg import', 'dialectModule: pg so Vercel NFT can trace it (Sequelize\'s dynamic require fails on serverless).'],
    ['SSL', 'Auto-on in prod or DB_SSL=true; family:4 forced to dodge IPv6.'],
    ['Auth', 'JWT (jsonwebtoken) — httpOnly cookies for web, Bearer header for mobile.'],
    ['Hashing', 'bcryptjs'],
    ['CSRF', 'csrf-csrf'],
    ['Validation', 'express-validator + zod'],
    ['Security', 'helmet, express-rate-limit, cors, cookie-parser'],
    ['Logging', 'morgan (HTTP) + winston (app)'],
    ['File uploads', 'multer (local) + multer-s3 + @aws-sdk/client-s3 → Cloudflare R2'],
    ['Pre-signed URLs', '@aws-sdk/s3-request-presigner'],
    ['PDF', 'pdfkit (PO docs, payslips, completion reports, this report)'],
    ['Email', 'nodemailer'],
    ['Cron', 'node-cron + Vercel scheduled cron'],
    ['AI', 'pluggable services in server/src/services/ (Puter / Gemini variants)'],
    ['Code volume', '~51,067 LOC across 84 routes, 106 controllers, 20 root models (+ many domain models), 7 services, 8 middleware'],
  ],
  [150, PAGE_W - 112 - 150]
);

// ============================================================================
// 10. MOBILE STACK
// ============================================================================
addPage();
h1('10. Tech stack — mobile');
tableSimple(
  ['Concern', 'Choice'],
  [
    ['SDK', 'Flutter 3.41.2 stable (engine d96704abcce, 2026-02-18)'],
    ['Dart SDK', '^3.11.0'],
    ['App ID', 'org.gersl.gersl_mobile'],
    ['Version', '1.0.0+1'],
    ['Min SDK', 'Android 21 (5.0) — required by background service & local notifications'],
    ['Target SDK', 'Inherited from Flutter (35 / Android 15)'],
    ['Java target', '17 with core-library desugaring (desugar_jdk_libs:2.1.4)'],
    ['State / DI', 'Riverpod 2.5'],
    ['Routing', 'go_router 14.6'],
    ['HTTP', 'dio 5.7 with auth interceptor'],
    ['Persistence', 'flutter_secure_storage (tokens) + shared_preferences (settings)'],
    ['Permissions', 'permission_handler 11.3'],
    ['Geo / Background GPS', 'geolocator 13 + flutter_background_service 5.0 (foregroundServiceType=location)'],
    ['Camera', 'image_picker 1.1 (front-camera selfies on punch-in)'],
    ['Notifications', 'flutter_local_notifications 17.2'],
    ['URLs', 'url_launcher 6.3'],
    ['Formatting', 'intl 0.20'],
    ['Typography', 'google_fonts 6.2 (Inter, matches admin web)'],
    ['Design tokens', 'mobile/lib/app/theme.dart — kNavy900 #0D1D3D, kMission500 #F59E0B, kInk* slate scale'],
    ['Primitives', 'mobile/lib/app/widgets.dart — SoftCard, GlassCard, GlowButton, StatusPill, GradientBlob, GradientText, SectionHeader, MobilePageHeader, EmptyState, ErrorBox, LoadingPanel'],
    ['Splash + adaptive icon', 'flutter_native_splash + flutter_launcher_icons; colour #0D1D3D'],
    ['Code volume', '~4,998 LOC across 36 Dart files'],
    ['Release APK', '54.1 MB, debug-signed (sideload only)'],
  ],
  [150, PAGE_W - 112 - 150]
);

// ============================================================================
// 11. DATA MODEL
// ============================================================================
addPage();
h1('11. Data model');
body('The schema is large (~70 tables). Here is the core model graph; many other domain models live alongside their feature controllers (cash accounts, journal entries, RFQs, POs, vendor calls, beneficiary support, fuel claims, leave balances, payslips, location points, movement clusters, CBO entities, etc.).');

h2('11.1  Core entities');
bullet([
  'User — the staff record + auth identity. Belongs to Department, has Role + Permissions.',
  'Department, Position — org structure.',
  'Project — programme delivery unit. Has Budget, Team Members, Tasks, Activities, Indicators, Evaluations, Complaints, Distributions.',
  'ProjectTeamMember — User × Project assignment.',
  'Task — Work unit under a Project. Has Assignees, Comments, Attachments, Beneficiaries.',
  'Beneficiary — universal record across projects (orphan, family, individual).',
  'Orphan — specialised Beneficiary with sponsorship + visit log.',
  'AggregateDistribution — head-count distributions with media coverage.',
  'Approval — Polymorphic approval record across proposals, projects, finance items, leaves, expenses, advances.',
  'Notification — in-app + push messaging.',
  'AuditLog — append-only record of significant state changes.',
  'Complaint, Indicator, Report — MEAL primitives.',
  'StaffDocument — file attachments on staff records.',
  'Expense (Mobile-first) — staff out-of-pocket claims.',
  'Proposal — fundraising pipeline record with stages.',
]);

h2('11.2  Storage');
kv([
  ['Primary DB',     'PostgreSQL on Supabase (jkmkeycwpqvhgjmkwyap.supabase.co), region ap-northeast-1.'],
  ['Object store',   'Cloudflare R2 — staff documents, orphan photos, PO PDFs, selfies, receipts, completion reports.'],
  ['Backup posture', 'Supabase managed backups (daily). PITR depends on plan tier.'],
  ['Migrations',     'Sequelize sync + manual scripts in server/src/database/.'],
]);

// ============================================================================
// 12. SECURITY & RBAC
// ============================================================================
addPage();
h1('12. Security & RBAC');

h2('12.1  Auth flow');
bullet([
  'POST /api/auth/login with username/password.',
  'Server validates with bcrypt; on success issues JWT (1h) + refresh token, sets as httpOnly Secure cookies (web) and returns in body for mobile to store in flutter_secure_storage.',
  'All subsequent requests carry the JWT (cookie or Bearer header). middleware decodes, attaches `req.user` (id, role, permissions list).',
  'Logout clears the cookies + secure storage and revokes the refresh token server-side.',
]);

h2('12.2  Defence in depth');
bullet([
  'Helmet sets a tight Content-Security-Policy by default.',
  'express-rate-limit on /auth/login + sensitive write endpoints to slow brute force.',
  'csrf-csrf double-submit pattern for browser-originated mutations.',
  'CORS limited to the deployed origin in prod.',
  'All input validated with express-validator / zod at the route boundary.',
  'Sequelize parameterised queries everywhere — no raw SQL concatenation.',
  'Permissions re-checked server-side on every state-changing endpoint.',
  'Audit Log appends user id, action, target id and diff for every significant change.',
  'Selfies + receipts uploaded via signed pre-uploaded URLs — no direct R2 credentials in the client.',
  'JWT signing key rotated per-environment via JWT_SECRET env var.',
]);

h2('12.3  RBAC keyspace (excerpt)');
tableSimple(
  ['Module', 'Sample permissions'],
  [
    ['Dashboard', 'dashboard:view'],
    ['Orphans', 'orphans:view, orphans:create, orphans:edit, orphans:delete, orphans:approve, orphans:assign_coordinator, orphans:sponsorship_manage'],
    ['Projects', 'projects:view, projects:create, projects:edit, projects:approve, projects:director_approve, projects:ceo_approve'],
    ['Finance', 'finance:view, finance:create_expense, finance:approve_po, finance:manager_approve, finance:ceo_approve, finance:reconcile_accounts, finance:cash:*'],
    ['HR', 'hr:view, hr:approve_leave, hr:manager_approve_leave, hr:attendance_manage, hr:onboarding, hr:appraisal, hr:manage_contracts, finance:view_payroll'],
    ['Procurement', 'procurement:dashboard_view, procurement:request_view, procurement:vendor_view, procurement:thresholds_manage'],
    ['Wildcard', '* (super-admin)'],
  ],
  [85, PAGE_W - 112 - 85]
);

// ============================================================================
// 13. DESIGN SYSTEM
// ============================================================================
addPage();
h1('13. Design system');
body('GERSL has one design language across web admin, public portal, and mobile. The recent ten-wave overhaul standardised every surface on the same tokens and primitive components.');

h2('13.1  Tokens');
tableSimple(
  ['Token', 'Web (Tailwind)', 'Mobile (Dart)', 'Hex'],
  [
    ['Primary',         'navy-900',        'kNavy900',       '#0D1D3D'],
    ['Primary darker',  'navy-800',        'kNavy800',       '#142A55'],
    ['Accent',          'mission-500',     'kMission500',    '#F59E0B'],
    ['Accent on dark',  'mission-300',     'kMission300',    '#FCD34D'],
    ['Text primary',    'ink-900',         'kInk900',        '#0F172A'],
    ['Text secondary',  'ink-500',         'kInk500',        '#64748B'],
    ['Border',          'ink-200',         'kInk200',        '#E2E8F0'],
    ['Surface canvas',  'ink-50',          'kInk50',         '#F5F7FA'],
    ['Card',            'white',           'Colors.white',   '#FFFFFF'],
    ['Success',         'success-600',     'kSuccess600',    '#16A34A'],
    ['Danger',          'danger-600',      'kDanger600',     '#DC2626'],
  ],
  [110, 110, 110, 70]
);

h2('13.2  Canonical page anatomy');
bullet([
  'Web: `<PageWrap>` (p-6 max-w-7xl mx-auto space-y-4) → `<PageHeader icon eyebrow title subtitle actions>` (navy band) → `<Card>`s.',
  'Mobile: `Scaffold` → `MobilePageHeader` (matching navy band) → `SoftCard` rows with `StatusPill` + `EmptyState` / `ErrorBox` / `LoadingPanel` for async states.',
  'Action button hierarchy: primary (navy) for permanent actions; mission-amber for hero CTAs (Add, New, Sign in); onNavy outline for secondary actions inside the navy band.',
]);

h2('13.3  Typography');
body('Inter across all surfaces, from Google Fonts (web CDN, mobile via google_fonts package). Headings use negative letter-spacing and weight 800 for the tight, considered SaaS feel; body uses weight 400/500 with 1.4 line-height for readability.');

// ============================================================================
// 14. DEPLOYMENT
// ============================================================================
addPage();
h1('14. Deployment & operations');

h2('14.1  Topology');
tableSimple(
  ['Layer', 'Provider', 'Notes'],
  [
    ['Web frontend',     'Vercel CDN',     'Static dist/ from `vite build`. Manual chunking by route group.'],
    ['API',              'Vercel serverless', 'Single function api/index.js → Express app (30 s maxDuration).'],
    ['Database',         'Supabase Postgres', 'Project gersl-management-dev, region ap-northeast-1, SSL on, IPv4 forced.'],
    ['Object storage',   'Cloudflare R2', 'S3-compatible; orphan photos, staff docs, PO PDFs, selfies, receipts.'],
    ['Cron',             'Vercel cron', '/api/cron/cluster daily at 01:30 UTC for movement clustering.'],
    ['Source control',   'GitHub', 'jarooq/gersl-management. Push to main triggers Vercel build.'],
    ['Mobile distribution', 'Sideload APK', 'Release-signed keystore TODO before Play Store.'],
  ],
  [120, 110, PAGE_W - 112 - 230]
);

h2('14.2  Environment variables');
bullet([
  'DATABASE_URL — Supabase Postgres connection string.',
  'JWT_SECRET — JWT signing key.',
  'R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT — Cloudflare R2.',
  'EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS — SMTP for nodemailer.',
  'AI_PROVIDER, AI_API_KEY — AI provider routing.',
  'VERCEL=1 — set automatically; gates serverless-aware code paths.',
]);

h2('14.3  Production fixes already shipped');
bullet([
  'Static `import pg from "pg"` in database.js — Vercel\'s NFT could not trace Sequelize\'s dynamic require.',
  'Wrapped `mkdirSync` calls in try/catch — Vercel filesystem is read-only.',
  'Replaced serverless-http with direct `app(req, res)` — wrapper caused 30 s 504 hangs.',
  'SPA catch-all rewrite added — `/((?!assets/|.*\\.[a-zA-Z0-9]+$).*)` → `/index.html`.',
  'Hoisted multer-s3, @aws-sdk/*, node-cron, pdfkit from server/package.json to root — Vercel installs only the root manifest.',
  'Escaped backslash in vercel.json SPA rewrite regex (`\\\\.`) — invalid JSON had been rejecting every deploy for an hour.',
  'Cash-module permissions re-seeded — frontend referenced finance:cash:* but seed had not created them.',
]);

// ============================================================================
// 15. KPI / PROJECT STATUS
// ============================================================================
addPage();
h1('15. Project status, KPIs & metrics');

h2('15.1  Codebase scale');
tableSimple(
  ['Surface', 'Files', 'Lines of code'],
  [
    ['Web admin + public portal', '60 page files + 51 page-components + 22 contexts + ~200 shared components', '103,661'],
    ['Backend API', '84 routes + 106 controllers + 20 root models + 7 services + 8 middleware', '51,067'],
    ['Mobile (Flutter)', '36 Dart files (3 in app/, 11 features, 4 services)', '4,998'],
  ],
  [110, PAGE_W - 112 - 200, 90]
);

h2('15.2  Production health');
bullet([
  'Latest deploy: gersl-management-omq9bewj5 — Ready (45 s build).',
  'Previous 10 deploys errored due to invalid escape in vercel.json — fixed.',
  'flutter analyze on mobile: No issues found.',
  'npm run build on web: 20 s, no errors. Bundle warning on document-vendor (796 KB jspdf+xlsx).',
]);

h2('15.3  Recent work (last 20 commits)');
bullet([
  'Mobile redesign — full theme port + 11 screens reskinned (5e4cde3).',
  'UI waves 1–10 (~150 admin pages migrated) — design tokens, primitives, sidebar/navbar/login/layout, dashboards, HR, Finance, Operations, Procurement, Beneficiaries, Coordinators, Orphans, Partners, CBO, Proposals, Approvals, MEAL, Social, Donations, Campaigns, Jobs, VendorCalls, Projects, Reports, Settings.',
  'Approvals + Contracts + Payroll + MEAL + Social Media polish (eb37853).',
  'vercel.json fix — escaped backslash (ae4d8a3).',
  'Cash module permissions seeded (7828890).',
  'Layout fix — brand block in sidebar, removed duplicate from navbar (d6e8dc3).',
]);

// ============================================================================
// 16. ROADMAP
// ============================================================================
addPage();
h1('16. Roadmap & known follow-ups');

callout(
  'Blocker',
  'GERHR (legacy Firebase HR app) data migration into GERSL is paused awaiting the Firebase service-account JSON for project gerhr-388e1. Once supplied, the migration script can be wired and the GERHR app sunset.',
  DANGER
);

h2('16.1  Short-term');
bullet([
  'Generate a release keystore for the mobile app (signingConfigs.create("release") in build.gradle.kts) before Play Store upload.',
  'Decide whether usesCleartextTraffic="true" should be removed from production builds (currently kept for the dev/staging API).',
  'Code-split the document-vendor chunk (jspdf + xlsx) using dynamic imports to drop the 796 KB bundle warning.',
  'Wire push notifications via firebase-admin (server-side already imports it).',
  'Bump the mobile versionCode on every Play Store release.',
]);

h2('16.2  Medium-term');
bullet([
  'Replace Sequelize sync with proper migrations (Umzug or sequelize-cli).',
  'Move file uploads to direct-to-R2 pre-signed URLs to bypass the Vercel function size limits.',
  'Add e2e tests (Playwright) for the critical workflows (login, RFQ → PO, approve leave).',
  'Surface a public-facing donation receipt PDF flow.',
  'Add SMS notifications for field staff (Sri Lankan SMS gateway integration).',
]);

h2('16.3  Long-term');
bullet([
  'Multi-tenancy if the platform expands to other Ehsan Relief country offices.',
  'Offline-first capability on mobile (drift / sqlite + sync queue) for low-connectivity field work.',
  'Public donor portal — donors log in to see what their money funded.',
  'External donor reporting API (push project completion + spend to donor systems).',
]);

// ============================================================================
// 17. APPENDIX
// ============================================================================
addPage();
h1('17. Appendix — admin pages, routes, models');

h2('17.1  Admin sidebar (43 items)');
const sidebarItems = [
  ['Dashboard', '/admin/dashboard'],
  ['My Dashboard', '/admin/my-dashboard'],
  ['Orphan Management', '/admin/orphans'],
  ['Coordinators', '/admin/coordinators'],
  ['Beneficiaries', '/admin/beneficiaries'],
  ['Partners', '/admin/partners'],
  ['Proposals', '/admin/proposals'],
  ['Projects', '/admin/projects'],
  ['Activities', '/admin/operations/activities'],
  ['All Tasks', '/admin/operations/tasks'],
  ['My Tasks', '/admin/operations/my-tasks'],
  ['Movement Register', '/admin/operations/movements'],
  ['Fuel Claims', '/admin/operations/fuel-claims'],
  ['Fuel Rates', '/admin/operations/fuel-rates'],
  ['Approvals', '/admin/approvals'],
  ['Compliance & Safeguarding', '/admin/compliance'],
  ['Finance', '/admin/finance'],
  ['Cash Accounts', '/admin/finance/cash/accounts'],
  ['Cash Replenishments', '/admin/finance/cash/replenishments'],
  ['Campaigns', '/admin/campaigns'],
  ['Donations', '/admin/donations'],
  ['Job Postings', '/admin/job-postings'],
  ['Vendor Calls', '/admin/vendor-calls'],
  ['Procurement Dashboard', '/admin/procurement/dashboard'],
  ['Procurement Inbox', '/admin/procurement/inbox'],
  ['Procurement Vendors', '/admin/procurement/vendors'],
  ['Procurement Thresholds', '/admin/procurement/thresholds'],
  ['HR Overview', '/admin/hr'],
  ['Attendance', '/admin/hr/attendance'],
  ['Attendance Corrections', '/admin/hr/corrections'],
  ['Live staff map', '/admin/hr/live-map'],
  ['Shift roster', '/admin/hr/shifts'],
  ['Movement segments', '/admin/hr/movement-segments'],
  ['Onboarding', '/admin/hr/onboarding'],
  ['Appraisal', '/admin/hr/appraisal'],
  ['Contracts', '/admin/hr/contracts'],
  ['Payroll', '/admin/hr/payroll'],
  ['CBO Partners', '/admin/cbo'],
  ['MEAL', '/admin/meal'],
  ['Social Media', '/admin/social-media'],
  ['Announcements', '/admin/announcements'],
  ['Reports', '/admin/reports'],
  ['Settings', '/admin/settings'],
];
tableSimple(['Admin page', 'Route'], sidebarItems, [220, PAGE_W - 112 - 220]);

addPage();
h1('17. Appendix (cont.)');
h2('17.2  Backend route surfaces (84)');
const routes = [
  'aggregateDistribution', 'ai', 'announcement', 'approval', 'attendance',
  'auditLog', 'auth', 'background-check', 'bankAccount', 'bankTransaction',
  'beneficiaries', 'beneficiarySupport', 'bill', 'budget', 'budgetCategory',
  'campaign', 'campaignPackage', 'cash', 'cbo', 'cbo-activity',
  'cbo-due-diligence', 'cbo-project', 'cbo-proposal', 'cbo-volunteer',
  'chartOfAccounts', 'complaint', 'compliance', 'compliance-training',
  'contract', 'coordinator', 'data-protection', 'department', 'device',
  'donation', 'donor', 'evaluation', 'finance', 'financialReport',
  'fixedAsset', 'grantReceipt', 'grantReceivable', 'hr', 'hr-appraisal',
  'hr-onboarding', 'invoice', 'jobPosting', 'journalEntry', 'learning-event',
  'leaveBalance', 'locationPoint', 'meExpense', 'meLeave', 'mePayslip',
  'meal', 'movement', 'movementCluster', 'notification', 'orphan', 'partner',
  'payable', 'payment', 'payroll', 'position', 'procurement', 'project',
  'projectTeam', 'proposal', 'purchaseOrder', 'report', 'role',
  'safeguarding-incident', 'safeguarding-policy', 'salaryAdvance', 'shift',
  'socialMedia', 'staffDocument', 'task', 'taskBeneficiary', 'upload',
  'uploads-static', 'users', 'vendorCall', 'visit', 'visitLog',
];
const routeRows = [];
for (let i = 0; i < routes.length; i += 4) {
  routeRows.push([
    routes[i] || '',
    routes[i + 1] || '',
    routes[i + 2] || '',
    routes[i + 3] || '',
  ]);
}
const colW = (PAGE_W - 112) / 4;
tableSimple(['', '', '', ''], routeRows, [colW, colW, colW, colW]);

h2('17.3  Root models (20)');
const rootModels = [
  'AggregateDistribution', 'Approval', 'AuditLog', 'Complaint', 'Department',
  'Expense', 'Indicator', 'Notification', 'Project', 'ProjectTeamMember',
  'Proposal', 'Report', 'StaffDocument', 'Task', 'TaskAssignee',
  'TaskAttachment', 'TaskBeneficiary', 'TaskComment', 'User',
];
const modelRows = [];
for (let i = 0; i < rootModels.length; i += 3) {
  modelRows.push([
    rootModels[i] || '',
    rootModels[i + 1] || '',
    rootModels[i + 2] || '',
  ]);
}
const cw3 = (PAGE_W - 112) / 3;
tableSimple(['', '', ''], modelRows, [cw3, cw3, cw3]);

body('Many additional domain models live in subfolders alongside their controllers (cash accounts, journal entries, RFQs, POs, vendor calls, beneficiary support, fuel rates / claims, leave balances, payslips, location points, movement clusters, CBO entities, etc.) — the comprehensive index lives in server/src/models/index.js.');

// ============================================================================
// END
// ============================================================================
doc.end();

console.log('PDF written to', OUT_FILE);
