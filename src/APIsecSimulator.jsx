/**
 * APIsec LE Academy: a gamified learning & flow simulator for
 * F5 API Security Local Edition (APIsec LE).
 *
 * Single-file React component (useState + useReducer), Tailwind CSS, Lucide icons.
 *
 * Product facts (ports, install script, BIG-IP integration objects, statuses,
 * risk inputs and bands, schema import, enforcement via iControl REST, export
 * formats, licensing) follow the F5 API Security Local Edition 1.2.6 docs on
 * clouddocs.f5.com. Everything else (hostnames, IPs, endpoint names, risk-factor
 * weights, timings) is simulated for teaching. F5 does not publish risk weights,
 * sizing figures or the iRule body in its docs; the simulator says so where it matters.
 */
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowUpCircle, Award, BookOpen, Boxes, CheckCircle2, ChevronRight,
  Circle, CloudOff, Cpu, Crown, Database, Eye, FileCode, FileSearch, Filter, Fingerprint,
  Gauge, Ghost, GitCompare, KeyRound, Layers, Lightbulb, Lock, Monitor, Network, Play, Radio,
  RotateCcw, Server, Shield, ShieldAlert, ShieldCheck, Skull, Sparkles, Swords, Tag, Target,
  Terminal, Timer, Trophy, Unlock, Upload, Users, Workflow, X, Zap, Columns2, Send,
  Compass, ListChecks, MousePointerClick, Wrench, Flag, Info, Route, PanelRightClose,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#0b1120', panel: '#0f172a', line: '#1e293b', crimson: '#e4002b', cyan: '#06b6d4',
  amber: '#f59e0b', rose: '#f43f5e', violet: '#a78bfa', slate: '#64748b', green: '#22c55e',
};

const DOCS = 'https://clouddocs.f5.com/products/f5-api-security-local-edition/latest/';
const DOMAIN = 'api.acme-bank.local';
const LE_HOST = '10.1.20.50';
const BIGIP_MGMT = '10.1.1.245';

/* ------------------------------------------------------------------ */
/* Gamification                                                        */
/* ------------------------------------------------------------------ */
const RANKS = [
  { lvl: 1, title: 'Traffic Observer', min: 0 },
  { lvl: 2, title: 'Telemetry Wrangler', min: 150 },
  { lvl: 3, title: 'Schema Hunter', min: 350 },
  { lvl: 4, title: 'Risk Sentinel', min: 600 },
  { lvl: 5, title: 'Air-Gapped API Architect', min: 900 },
];
const rankFor = (xp) => RANKS.reduce((r, k) => (xp >= k.min ? k : r), RANKS[0]);

const BADGES = {
  oob: { name: 'Out-of-Band Discovery', icon: Radio, color: C.cyan, how: 'Complete Mission 1' },
  hunter: { name: 'Shadow/Zombie Hunter', icon: Ghost, color: C.amber, how: 'Complete Mission 2' },
  oas: { name: 'OAS Schema Governance', icon: FileCode, color: C.violet, how: 'Upload a schema, review the comparison, export the inventory' },
  awaf: { name: 'AWAF Enforcement', icon: ShieldCheck, color: C.crimson, how: 'Complete Mission 3' },
};

const MISSIONS = [
  {
    id: 1, badge: 'oob', icon: Radio, title: 'Zero-Latency Air-Gapped Onboarding',
    brief: 'Stand up APIsec LE on a local host with no outbound internet, wire BIG-IP telemetry out-of-band, and see your first endpoints.',
    objectives: [
      { id: 'deploy', label: 'Deploy APIsec LE locally (Docker Compose or Kubernetes/Helm)', xp: 30, hint: 'Console → Deploy & Sign-in. Pick a package and click Deploy locally.' },
      { id: 'login', label: 'Sign in on :8000 and change the default admin/admin password', xp: 20, hint: 'Console → Deploy & Sign-in → First sign-in card.' },
      { id: 'chain', label: 'Click through the telemetry chain: API VS → Logging Pool → Logging VS → Collector Pool → Collector', xp: 25, hint: 'Click those five nodes on the flow canvas, in any order.' },
      { id: 'integrate', label: 'Run the BIG-IP wizard: Add BIG-IP → Connect → Apply device settings → VS mode "API Security"', xp: 30, hint: 'Console → BIG-IP Integration.' },
      { id: 'replay:normal', label: 'Replay normal user traffic with telemetry flowing', xp: 20, hint: 'Console → Traffic Replay → Normal users. Integration must be done first.' },
      { id: 'analyze', label: 'See the first endpoints appear (Analyze Now)', xp: 20, hint: 'Traffic Replay or API Inventory → Analyze Now.' },
      { id: 'license', label: 'Licensing check: which task needs an internet-connected machine?', xp: 25, hint: 'Console → Deploy & Sign-in → Licensing check. Think "decoupled model".' },
    ],
  },
  {
    id: 2, badge: 'hunter', icon: Ghost, title: 'Hunting the Shadow PII Leak',
    brief: 'Something is leaking SSNs. Find the undocumented endpoint, prove it with the schema, clean up the inventory, and catch the zombie that went quiet.',
    objectives: [
      { id: 'replay:shadow', label: 'Replay the burst with unauthenticated /api/v1/debug/users calls, then Analyze Now', xp: 20, hint: 'Traffic Replay → Shadow debug calls.' },
      { id: 'filter-shadow', label: 'Filter the endpoint table by Status = shadow', xp: 15, hint: 'API Inventory → Status filter.' },
      { id: 'view-high', label: 'View selected API on the endpoint returning SSN: unauthenticated, High risk', xp: 25, hint: 'Click the row with a red High pill and an SSN tag.' },
      { id: 'upload-schema', label: 'Upload the OpenAPI schema to confirm the endpoint is undocumented', xp: 25, hint: 'Console → Schema (OAS) → Upload Schema.' },
      { id: 'promote3', label: 'Move 3 legitimate endpoints to Inventory', xp: 30, hint: 'API Inventory → tick authenticated, documented endpoints → Approve (Move to Inventory).' },
      { id: 'zombie', label: 'Spot /api/v0/legacy-auth as a zombie by its old Last Updated, then record a retire decision', xp: 30, hint: 'Traffic Replay → Fast-forward 30 days, then open legacy-auth in API Inventory.' },
    ],
  },
  {
    id: 3, badge: 'awaf', icon: ShieldCheck, title: 'Closing the Loop with BIG-IP AWAF Enforcement',
    brief: 'Have APIsec LE update the BIG-IP WAF policy over iControl REST so BIG-IP blocks the shadow endpoint at the edge, then document it for audit.',
    objectives: [
      { id: 'mgmt', label: 'Confirm Management Connectivity to BIG-IP (TCP 443)', xp: 20, hint: 'Console → Enforcement → Test Management Connectivity.' },
      { id: 'block-fail', label: 'Try to Block the shadow endpoint and hit the scheme-differentiation failure', xp: 20, hint: 'Enforcement → Block (push to BIG-IP WAF policy) on /api/v1/debug/users.' },
      { id: 'scheme', label: 'Fix it: use a Fundamental-template policy that differentiates HTTP/HTTPS', xp: 25, hint: 'Enforcement → the fix appears after the failure.' },
      { id: 'block-shadow', label: 'Block the shadow endpoint successfully', xp: 30, hint: 'Retry the Block after the fix.' },
      { id: 'verify-block', label: 'Replay the attack and see it blocked at the BIG-IP edge', xp: 30, hint: 'Traffic Replay → Shadow debug calls.' },
      { id: 'export', label: 'Export a report for the audit (JSON, PDF, HTML or CSV)', xp: 20, hint: 'Schema (OAS) → Export.' },
    ],
  },
];
const LAB_BONUS = [
  { id: 'template', label: 'Module 2 lab: add a Dynamic Path Template for order IDs', xp: 20, hint: 'API Inventory → Discovery tuning.' },
  { id: 'rule', label: 'Module 2 lab: add an API Discovery Rule that marks /health as NON-API', xp: 20, hint: 'API Inventory → Discovery tuning.' },
  { id: 'review-comparison', label: 'Module 4 lab: review the schema-vs-traffic comparison', xp: 20, hint: 'Schema (OAS) → Review comparison.' },
];
const OBJ = Object.fromEntries(MISSIONS.flatMap((m) => m.objectives.map((o) => [o.id, { ...o, mission: m.id }])));
const BONUS = Object.fromEntries(LAB_BONUS.map((o) => [o.id, o]));
const TOTAL_OBJ = Object.keys(OBJ).length;
const CHAIN = ['vs', 'logpool', 'logvs', 'colpool', 'collector'];

/* ------------------------------------------------------------------ */
/* Curriculum                                                          */
/* ------------------------------------------------------------------ */
const MODULES = [
  {
    id: 1, icon: Network, title: 'Air-Gapped Architecture & Traffic Flows',
    focus: ['clients', 'vs', 'logpool', 'logvs', 'colpool', 'collector', 'workstation'], tab: 'deploy',
    lessons: [
      'Discovery is out-of-band: BIG-IP forwards HTTP metadata, no proxy is inserted, and no latency is added to the data path. Enforcement stays on BIG-IP.',
      'Telemetry chain: an iRule on the API Virtual Server → Internal Logging Pool → Internal Logging VS (serverssl) → External Collector Pool → Collector on TCP 6514 (HSL over TLS).',
      'Components: Collector, Analysis Engine, Data Store, Web UI (HTTPS 8000) and the Management Connector (iControl REST to BIG-IP 443, enforcement only).',
      'Runs fully air-gapped on local Docker Compose or Kubernetes, with decoupled licensing: usage reports travel through an internet-connected operator workstation.',
    ],
  },
  {
    id: 2, icon: Radio, title: 'Passive API Discovery & Inventory',
    focus: ['discovery', 'ui', 'datastore'], tab: 'inventory',
    lessons: [
      'Domains are grouped by Host header. The Analysis Engine rebuilds endpoints from the metadata; Analyze Now runs a cycle on demand.',
      'Dynamic segments are grouped automatically (/users/123 and /users/456 → /users/$DYN$). Dynamic Path Templates override grouping; segment types are Static, *, {int}, text-only and {int:split}.',
      'API Discovery Rules are evaluated top-down and the first match wins, e.g. mark health checks as NON-API.',
      'Move to Inventory approves an endpoint; Remove from Inventory and Delete are the other table actions.',
    ],
  },
  {
    id: 3, icon: Ghost, title: 'Shadow/Zombie APIs, Sensitive Data & Risk Scoring',
    focus: ['risk', 'discovery'], tab: 'inventory',
    lessons: [
      'Shadow API: an undocumented or unmanaged endpoint found through passive traffic analysis.',
      'Zombie API: an endpoint with no traffic for an extended period (the docs do not state how long). It shows up as quiet, with an old Last Updated.',
      'Risk is 0–100 per endpoint: Low 0–39, Medium 40–69, High 70–100. It rises for missing auth, shadow or zombie status, PUT/DELETE vs GET, predictable paths (/admin, /settings, /auth) and sensitive data, more so in responses than requests.',
      'Triage High first, especially shadow and unauthenticated endpoints carrying sensitive data such as Date of Birth, SSN, Email or Credit Card.',
    ],
  },
  {
    id: 4, icon: ShieldCheck, title: 'Schema Management & BIG-IP AWAF Enforcement',
    focus: ['schema', 'enforce', 'mgmt', 'awaf'], tab: 'schema',
    lessons: [
      'Upload Schema sets an OpenAPI baseline; observed endpoints that are not in it are flagged. There is no separate diff screen.',
      'Block (Action menu, or batch Block endpoints): the Management Connector calls BIG-IP iControl REST on TCP 443 to update the WAF policy, and BIG-IP blocks. APIsec LE never blocks traffic itself.',
      'Needs Advanced WAF/ASM 15.1+ and Management Connectivity. Known issue: a block creates HTTP and HTTPS entries and fails unless the policy differentiates schemes (workaround: a Fundamental-template policy).',
      'Export All (dashboard) and per-domain Export produce JSON, PDF, HTML or CSV.',
    ],
  },
];

const QUIZZES = {
  1: [
    { q: 'Which port does BIG-IP use to send metadata to the Collector?', a: ['TCP 443', 'TCP 8000', 'TCP 6514, HSL over TLS', 'UDP 514'], c: 2, why: 'BIG-IP → Collector is TCP 6514 (HSL with TLS) and is required.' },
    { q: 'Which connection is needed only if you want enforcement?', a: ['Browser → Web UI on 8000', 'BIG-IP → Collector on 6514', 'APIsec LE → BIG-IP management on 443 (iControl REST)', 'APIsec LE → F5 cloud on 443'], c: 2, why: 'The Management Connector reaches BIG-IP management on TCP 443 only for enforcement.' },
    { q: 'Does APIsec LE add latency to API traffic?', a: ['Yes, a few ms per request', 'Only when blocking', 'No, discovery is out-of-band', 'Only in Advanced API Security mode'], c: 2, why: 'BIG-IP forwards metadata out-of-band; no proxy is inserted in the data path.' },
    { q: 'Which task needs an internet-connected machine?', a: ['Day-to-day discovery traffic', 'The licensing report exchange', 'Endpoint discovery', 'Blocking via iControl REST'], c: 1, why: 'Licensing uses a decoupled model: report.json and the Signed ACK go through an operator workstation with internet. The APIsec LE host stays offline.' },
    { q: 'The ingestion counter is not increasing. What should you check?', a: ['The Web UI certificate', 'TCP 6514 reachability, serverssl on the Internal Logging VS, and the iRule pool name and attachment', 'The license telemetry report', 'The OpenAPI schema version'], c: 1, why: 'Those are the documented ingestion checks.' },
  ],
  2: [
    { q: 'How does APIsec LE group endpoints into domains?', a: ['By virtual server', 'By Host header', 'By source IP', 'By TLS SNI only'], c: 1, why: 'Domains are grouped by the Host header.' },
    { q: 'What does Move to Inventory do?', a: ['Blocks the endpoint', 'Approves the endpoint into the managed inventory', 'Deletes its traffic data', 'Uploads it to BIG-IP'], c: 1, why: 'Move to Inventory approves an endpoint. Remove from Inventory reverses it.' },
    { q: 'Which role cannot manage enforcement?', a: ['Admin', 'Maintainer', 'Viewer', 'All roles can'], c: 2, why: 'Viewer is read-only: dashboard, inventory and exports.' },
    { q: 'Two API Discovery Rules match the same request. Which wins?', a: ['The most specific', 'The last one', 'The first one, evaluated top-down', 'Both apply'], c: 2, why: 'Rules are evaluated top-down and the first match wins.' },
    { q: '/users/123 and /users/456 are grouped as…', a: ['/users/{id}', '/users/$DYN$', '/users/*', 'two separate endpoints'], c: 1, why: 'Automatic grouping normalizes dynamic segments to $DYN$.' },
  ],
  3: [
    { q: 'What is a shadow API?', a: ['An endpoint with no recent traffic', 'An undocumented or unmanaged endpoint found through passive traffic analysis', 'An endpoint behind a second BIG-IP', 'Any 5xx endpoint'], c: 1, why: 'Shadow = undocumented or unmanaged, discovered from traffic.' },
    { q: 'What is a zombie API?', a: ['Any v0 endpoint', 'An endpoint with no traffic for an extended period', 'An unauthenticated endpoint', 'An endpoint returning PII'], c: 1, why: 'Zombie = no traffic for an extended period. A version number alone does not make a zombie.' },
    { q: 'Where is an SSN riskier?', a: ['In the request', 'In the response', 'Same either way', 'Only in headers'], c: 1, why: 'Sensitive data in responses carries higher risk than in requests.' },
    { q: 'What is the High risk range?', a: ['50–100', '60–100', '70–100', '80–100'], c: 2, why: 'Low 0–39, Medium 40–69, High 70–100.' },
    { q: 'Which method raises risk more?', a: ['GET', 'DELETE'], c: 1, why: 'PUT and DELETE carry higher risk than GET.' },
    { q: 'What triage order do the docs recommend?', a: ['Newest endpoints first', 'High first, especially shadow and unauthenticated endpoints with sensitive data', 'Alphabetical by path', 'Zombies first'], c: 1, why: 'Start with High, then Medium, then Low.' },
  ],
  4: [
    { q: 'Who actually blocks the traffic?', a: ['APIsec LE', 'BIG-IP', 'The backend service', 'The Collector'], c: 1, why: 'APIsec LE updates the WAF policy; BIG-IP enforces.' },
    { q: 'Which API does the Management Connector use?', a: ['AS3', 'iControl REST', 'SNMP', 'Syslog'], c: 1, why: 'Blocks are pushed through the BIG-IP iControl REST API on TCP 443.' },
    { q: 'Why might a Block fail?', a: ['The schema is too large', 'The WAF policy does not differentiate HTTP/HTTPS, or there is no Management Connectivity', 'The license is Active', 'The endpoint is in Inventory'], c: 1, why: 'Blocks create HTTP and HTTPS entries; scheme differentiation and management connectivity are both required.' },
    { q: 'Which export formats exist?', a: ['JSON, PDF, HTML, CSV', 'CEF, LEEF', 'XML only', 'YAML only'], c: 0, why: 'Export All and per-domain Export offer JSON, PDF, HTML and CSV.' },
    { q: 'Which BIG-IP module and version does enforcement need?', a: ['LTM 13.1+', 'APM 16.1+', 'Advanced WAF/ASM 15.1+', 'Any TMOS'], c: 2, why: 'Advanced WAF/ASM 15.1 or later is required for enforcement actions.' },
  ],
};
const passMark = (n) => Math.ceil(n * 0.75);

const FIELD_GUIDE = [
  { id: 'sizing', icon: Cpu, title: 'Sizing & supported platforms', cost: 10, src: 'admin_guide/installation.html · release notes: supported platforms',
    body: ['The docs give no CPU, RAM, disk or node figures. Sizing goes through F5 Sales or a Solutions Engineer.', 'Docker Engine 20.10+ with Compose 2.0+ (single host, lab, PoC), or Kubernetes 1.26+ with Helm 3.10+ (production, HA, multi-node). Bash 4+ for the installer.', 'Install with ./install_local.sh --default. Upgrades with --upgrade (try --upgrade --dry-run first) work on Docker Compose only.', 'BIG-IP TMOS 15.1+. Browsers: latest two Chrome, Firefox or Edge releases.'] },
  { id: 'ports', icon: Network, title: 'Ports & connectivity', cost: 10, src: 'admin_guide/ports_connectivity_reference.html',
    body: ['BIG-IP → Collector: TCP 6514, HSL with TLS (required).', 'Browser → Web UI: TCP 8000, HTTPS (https://<host-ip>:8000).', 'Management Connector → BIG-IP management: TCP 443, iControl REST (enforcement only).', 'MCP server: TCP 8080, an optional Docker Compose profile that is off by default.'] },
  { id: 'irule', icon: Workflow, title: 'BIG-IP integration & the iRule', cost: 10, src: 'admin_guide/big_ip_integration.html',
    body: ['Wizard: Manage > BIG-IPs > Add BIG-IP (IP, port 443, user, password) > Connect > Collector host and port (6514) > Apply device settings > per VS choose None / API Security / Advanced API Security > Done.', 'Discovered and Management Connectivity must both succeed before enforcement works.', 'Manual chain: External Collector Pool (6514) → Internal Logging VS with serverssl → Internal Logging Pool → iRule with that pool name → attach the iRule to the API VS.', 'The iRule body and exact metadata fields are not in the web docs; they are in the in-product Integration Guide.'] },
  { id: 'license', icon: KeyRound, title: 'Air-gapped operation & decoupled licensing', cost: 10, src: 'admin_guide/licensing.html',
    body: ['Normal operation needs no outbound internet.', 'Licensing is decoupled: System > License, upload the JWT, Register Device, download report.json, submit it to F5 from an internet-connected workstation, upload signed_ack.json, Activate.', 'A 14-day Evaluation Mode exists.', 'First login is admin/admin and must be changed. Create a Recovery Key in advance under System > Users.'] },
  { id: 'discovery', icon: Radio, title: 'Discovery tuning', cost: 10, src: 'admin_guide/administration.html',
    body: ['Domains are grouped by Host header. Analyze Now runs an analysis cycle on demand.', 'API Discovery Rules: evaluated top-down, first match wins. Example action: NON-API.', 'Dynamic Path Templates override automatic grouping. Segment types: Static, *, {int}, text-only, {int:split}.', 'Roles: Admin (everything, incl. users and licensing), Maintainer (domains, discovery rules, enforcement), Viewer (read-only dashboard, inventory, exports).'] },
  { id: 'risk', icon: Gauge, title: 'Risk scoring & sensitive data', cost: 10, src: 'user_guide/risk_scoring.html',
    body: ['0–100 per endpoint. Low 0–39, Medium 40–69, High 70–100.', 'Raised by: missing authentication, shadow status, zombie status, PUT/DELETE vs GET, predictable paths (/admin, /settings, /auth), sensitive data, and sensitive data in responses (riskier than in requests).', 'Sensitive data examples in the docs: Date of Birth, SSN, Email, Credit Card. The full list is not documented.', 'F5 does not publish weights. The weights in this simulator are invented for teaching.'] },
  { id: 'schema', icon: FileCode, title: 'Schema (OAS) baseline', cost: 10, src: 'user_guide/schema_management.html',
    body: ['Per-domain inventory → Upload Schema → choose an OpenAPI file → confirm.', 'Observed endpoints that are not in the schema are flagged. No separate drift or diff screen is documented.', 'Accepted OpenAPI versions are not documented. DevCentral says generated schemas are OAS 3.0.3 (not in the docs).'] },
  { id: 'enforce', icon: ShieldCheck, title: 'Enforcement & the scheme known issue', cost: 10, src: 'user_guide/enforcement.html · release notes: known issues',
    body: ['Block from an endpoint\'s Action menu, or the batch action Block endpoints. Confirm when prompted.', 'The Management Connector calls BIG-IP iControl REST (TCP 443) to update the WAF policy; BIG-IP blocks. APIsec LE never blocks traffic itself.', 'Requires Advanced WAF/ASM 15.1+ and Management Connectivity.', 'A block creates two entries, HTTP and HTTPS. If the policy does not differentiate schemes the block fails. Enable differentiation, or use a Fundamental-template policy.'] },
  { id: 'export', icon: Send, title: 'Exports (and what about SIEM?)', cost: 10, src: 'user_guide/reports_and_exports.html',
    body: ['Export All on the dashboard; Export per domain for the inventory or a traffic-derived schema. Formats: JSON, PDF, HTML, CSV.', 'Schema exports include only endpoints moved to Inventory.', 'SIEM/SOAR: logos appear on F5 marketing pages only. The docs describe no SIEM, syslog or streaming export. Treat it as a marketing claim, not documented.', 'The optional MCP server (TCP 8080) is the other documented integration surface.'] },
];

/* ------------------------------------------------------------------ */
/* Simulated API surface                                               */
/* ------------------------------------------------------------------ */
// key = METHOD + normalized path. inSchema = present in acme-bank-api-v1.yaml.
const CATALOG = {
  'GET /api/v1/users/$DYN$': { method: 'GET', path: '/api/v1/users/$DYN$', svc: 0, kind: 'valid', auth: true, inSchema: true, sens: ['Email'], category: 'Customer' },
  'POST /api/v1/orders': { method: 'POST', path: '/api/v1/orders', svc: 1, kind: 'valid', auth: true, inSchema: true, sens: [], category: 'Commerce' },
  'GET /api/v1/orders/$DYN$': { method: 'GET', path: '/api/v1/orders/$DYN$', svc: 1, kind: 'valid', auth: true, inSchema: true, sens: [], category: 'Commerce', needsTemplate: true },
  'GET /api/v1/products': { method: 'GET', path: '/api/v1/products', svc: 1, kind: 'valid', auth: false, inSchema: true, sens: [], category: 'Catalog' },
  'POST /api/v1/auth/token': { method: 'POST', path: '/api/v1/auth/token', svc: 2, kind: 'valid', auth: false, inSchema: true, sens: ['Token'], category: 'Identity' },
  'GET /health': { method: 'GET', path: '/health', svc: 1, kind: 'health', auth: false, inSchema: false, sens: [], category: 'Infra' },
  'GET /api/v1/debug/users': { method: 'GET', path: '/api/v1/debug/users', svc: 0, kind: 'shadow', auth: false, inSchema: false, sens: ['SSN', 'Date of Birth', 'Email'], category: 'Internal' },
  'POST /api/v0/legacy-auth': { method: 'POST', path: '/api/v0/legacy-auth', svc: 2, kind: 'legacy', auth: false, inSchema: true, sens: ['Credentials'], reqSens: true, category: 'Identity' },
  'DELETE /api/v1/users/$DYN$': { method: 'DELETE', path: '/api/v1/users/$DYN$', svc: 0, kind: 'valid', auth: true, inSchema: true, sens: [], category: 'Customer' },
};
const SCHEMA_KEYS = Object.keys(CATALOG).filter((k) => CATALOG[k].inSchema);

// [catalogKey, observed path, status, leaksPII, packet colour override]
const BURSTS = {
  normal: { label: 'Normal users', icon: Users, color: C.cyan, desc: 'Authenticated customers, LB health checks, and a few old v0 mobile builds still logging in.',
    reqs: [
      ['GET /api/v1/users/$DYN$', '/api/v1/users/123', 200], ['POST /api/v1/orders', '/api/v1/orders', 201],
      ['GET /api/v1/orders/$DYN$', '/api/v1/orders/ORD-88121', 200], ['GET /api/v1/products', '/api/v1/products?page=2', 200],
      ['POST /api/v1/auth/token', '/api/v1/auth/token', 200], ['GET /api/v1/users/$DYN$', '/api/v1/users/456', 200],
      ['GET /api/v1/orders/$DYN$', '/api/v1/orders/ORD-90233', 200], ['GET /health', '/health', 200],
      ['POST /api/v0/legacy-auth', '/api/v0/legacy-auth', 200, false, C.violet],
    ] },
  shadow: { label: 'Shadow debug calls', icon: Ghost, color: C.amber, desc: 'Unauthenticated GET /api/v1/debug/users. Responses contain SSN and Date of Birth.',
    reqs: [['GET /api/v1/debug/users', '/api/v1/debug/users', 200], ['GET /api/v1/debug/users', '/api/v1/debug/users?limit=500', 200], ['GET /api/v1/debug/users', '/api/v1/debug/users', 200]] },
  pii: { label: 'PII-leaking responses', icon: Fingerprint, color: C.rose, desc: 'A documented endpoint over-shares: SSN and an access token in the user profile response.',
    reqs: [['GET /api/v1/users/$DYN$', '/api/v1/users/5310', 200, true], ['GET /api/v1/users/$DYN$', '/api/v1/users/2219', 200, true]] },
};

// Simulated weights. The factor list matches the docs; the numbers do not come from F5.
function riskOf(ep) {
  const f = [];
  const add = (pts, label, kind) => f.push({ pts, label, kind });
  add(5, 'Baseline exposure', 'base');
  if (!ep.auth) add(25, 'No authentication observed', 'structural');
  if (ep.status === 'shadow') add(20, 'Shadow API (undocumented / unmanaged)', 'structural');
  if (ep.status === 'zombie') add(20, 'Zombie API (no recent traffic)', 'behavioral');
  if (['PUT', 'DELETE'].includes(ep.method)) add(10, `${ep.method} method`, 'structural');
  if (/\/(admin|settings|auth|debug)/.test(ep.path) || /legacy-auth/.test(ep.path)) add(10, 'Predictable path indicator', 'structural');
  if (ep.sens.includes('SSN')) add(20, 'SSN detected', 'data');
  if (ep.sens.includes('Credit Card')) add(20, 'Credit Card detected', 'data');
  if (ep.sens.includes('Token') || ep.sens.includes('Credentials')) add(15, 'Credentials / tokens detected', 'data');
  if (ep.sens.includes('Date of Birth')) add(5, 'Date of Birth detected', 'data');
  if (ep.sens.includes('Email')) add(5, 'Email detected', 'data');
  if (ep.sens.length && !ep.reqSensOnly) add(10, 'Sensitive data in responses', 'data');
  const score = Math.min(100, f.reduce((s, x) => s + x.pts, 0));
  return { score, factors: f, band: score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low' };
}
const bandColor = (b) => (b === 'High' ? C.rose : b === 'Medium' ? C.amber : C.cyan);

/* ------------------------------------------------------------------ */
/* Flow canvas geometry                                                */
/* ------------------------------------------------------------------ */
const NODES = {
  clients: { x: 20, y: 50, w: 130, h: 70, label: 'API Clients', sub: 'web · mobile · B2B', icon: Users },
  vs: { x: 205, y: 50, w: 175, h: 60, label: 'API Virtual Server', sub: 'iRule attached', icon: Server },
  awaf: { x: 395, y: 50, w: 200, h: 60, label: 'Advanced WAF Policy', sub: 'BIG-IP enforces blocks', icon: Shield },
  logpool: { x: 205, y: 125, w: 123, h: 60, label: 'Int. Logging Pool', full: 'Internal Logging Pool', sub: 'iRule target' },
  logvs: { x: 338, y: 125, w: 123, h: 60, label: 'Int. Logging VS', full: 'Internal Logging Virtual Server', sub: 'serverssl' },
  colpool: { x: 471, y: 125, w: 124, h: 60, label: 'Ext. Collector Pool', full: 'External Collector Pool', sub: 'members :6514' },
  mgmt: { x: 205, y: 200, w: 175, h: 55, label: 'BIG-IP Mgmt', sub: 'iControl REST · TCP 443', icon: Terminal },
  svc0: { x: 700, y: 40, w: 270, h: 46, label: 'users-svc', sub: '/api/v1/users · /debug', icon: Boxes },
  svc1: { x: 700, y: 100, w: 270, h: 46, label: 'orders-svc', sub: '/api/v1/orders · /products · /health', icon: Boxes },
  svc2: { x: 700, y: 160, w: 270, h: 46, label: 'auth-svc', sub: '/api/v1/auth · /api/v0', icon: Boxes },
  enforce: { x: 205, y: 335, w: 170, h: 58, label: 'Mgmt Connector', sub: 'enforcement only', icon: ShieldAlert },
  collector: { x: 395, y: 335, w: 200, h: 58, label: 'Collector', sub: 'TCP 6514 · HSL/TLS', icon: Radio },
  discovery: { x: 615, y: 335, w: 170, h: 58, label: 'Analysis Engine', sub: 'endpoints · $DYN$', icon: FileSearch },
  risk: { x: 800, y: 335, w: 170, h: 58, label: 'Risk & Sensitive', sub: 'score 0–100', icon: Gauge },
  license: { x: 205, y: 435, w: 170, h: 58, label: 'License', sub: 'decoupled model', icon: KeyRound },
  ui: { x: 395, y: 435, w: 200, h: 58, label: 'Web UI', sub: 'HTTPS · TCP 8000', icon: Monitor },
  schema: { x: 615, y: 435, w: 170, h: 58, label: 'Schema Baseline', sub: 'Upload Schema (OAS)', icon: FileCode },
  datastore: { x: 800, y: 435, w: 170, h: 58, label: 'Data Store', sub: 'local persistence', icon: Database },
  workstation: { x: 20, y: 435, w: 150, h: 58, label: 'Operator PC', sub: 'licensing only · internet', icon: Monitor },
};
const SVC_Y = [63, 123, 183];
const ROUTES = {
  inline: (svc) => [[150, 80], [292, 80], [495, 80], [650, 80], [650, SVC_Y[svc]], [700, SVC_Y[svc]]],
  blocked: () => [[150, 80], [292, 80], [480, 80]],
  telemetry: () => [[292, 80], [266, 155], [533, 155], [533, 285], [495, 285], [495, 364]],
  analyze: () => [[495, 364], [700, 364], [885, 364], [885, 464]],
  enforce: () => [[495, 464], [385, 464], [385, 364], [290, 364], [290, 228], [185, 228], [185, 30], [495, 30], [495, 50]],
  export: () => [[885, 464], [700, 500], [495, 493]],
  license: () => [[205, 464], [170, 464]],
};
function pointAt(pts, t) {
  const lens = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const r = lens[i] ? d / lens[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}
const toPath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');

const NODE_INFO = {
  clients: { role: 'Consumers of the protected APIs: browsers, mobile apps, partner integrations and, in this lab, attackers.', ports: [['TCP 443', 'HTTPS to the BIG-IP API virtual server']], payload: 'GET /api/v1/users/123 HTTP/1.1\nHost: api.acme-bank.local\nAuthorization: Bearer eyJ…', ops: ['Clients never talk to APIsec LE. They only see BIG-IP.'] },
  vs: { role: 'The existing BIG-IP virtual server that fronts the API. The API Security iRule is attached here and sends per-request HTTP metadata out-of-band. Per-VS mode: None, API Security or Advanced API Security.', ports: [['TCP 443', 'client-facing HTTPS']], payload: 'ltm virtual vs_api_https {\n  destination 10.1.10.100:443\n  rules { ApiSecurityDiscoveryRule }   # example name\n}', ops: ['The iRule body is not in the web docs: copy it from Integration > Integration Guide in the UI.', 'If ingestion stalls, check the iRule references the right Internal Logging Pool and is attached to this VS.'] },
  awaf: { role: 'The BIG-IP Advanced WAF (ASM) policy on the API VS. When you Block an endpoint, APIsec LE updates this policy and BIG-IP does the blocking, inline.', ports: [['inline', 'enforced in the data path']], payload: 'Entries a Block creates:\n  HTTP  /api/v1/debug/users\n  HTTPS /api/v1/debug/users\n(other objects: not documented)', ops: ['Requires Advanced WAF/ASM 15.1+.', 'Known issue: the policy must differentiate HTTP and HTTPS, or the block fails. Workaround: a Fundamental-template policy.'] },
  logpool: { role: 'Internal Logging Pool. The iRule sends metadata to this pool; its member is the Internal Logging VS.', ports: [['internal', '→ Internal Logging VS']], payload: 'ltm pool INTERNAL_LOGGING_POOL {\n  members { <internal-logging-vs-addr>:6514 }\n}', ops: ['The iRule must reference this pool by name.'] },
  logvs: { role: 'Internal Logging Virtual Server on 6514 with a serverssl profile, so the metadata stream to the Collector is TLS-encrypted.', ports: [['TCP 6514', 'serverssl (serverside) → Collector pool']], payload: 'ltm virtual INTERNAL_LOGGING_VS {\n  destination <addr>:6514\n  pool API_SECURITY_COLLECTOR_POOL\n  profiles { serverssl { context serverside } }\n}', ops: ['Missing serverssl is a documented reason for ingestion not increasing.'] },
  colpool: { role: 'External Collector Pool. Its members are the APIsec LE Collector address(es) on TCP 6514.', ports: [['TCP 6514', 'BIG-IP → Collector']], payload: 'ltm pool API_SECURITY_COLLECTOR_POOL {\n  members { 10.1.20.50:6514 }\n}', ops: ['Firewalls between BIG-IP and APIsec LE must allow 6514.'] },
  mgmt: { role: 'BIG-IP management plane. APIsec LE registers the device here (Manage > BIG-IPs) and the Management Connector uses iControl REST to update WAF policies.', ports: [['TCP 443', 'APIsec LE → BIG-IP mgmt (enforcement only)']], payload: 'Device status columns:\n  Discovered ............... ✓\n  Management Connectivity .. ✓', ops: ['Both must succeed before enforcement works.'] },
  svc: { role: 'Backend microservices behind BIG-IP. They receive only traffic that BIG-IP allows.', ports: [['simulated', 'pool members']], payload: '200 OK\n{"id":123,"email":"a@acme.io"}', ops: ['Untouched by APIsec LE: discovery is passive.'] },
  enforce: { role: 'Management Connector. Used only for enforcement: on Block it calls BIG-IP iControl REST to update the relevant WAF policy.', ports: [['TCP 443', '→ BIG-IP management']], payload: 'Block → confirm → iControl REST → WAF policy\n(HTTP + HTTPS entries)', ops: ['APIsec LE never blocks traffic itself.'] },
  collector: { role: 'Receives the per-request HTTP metadata stream from BIG-IP over HSL with TLS.', ports: [['TCP 6514', 'BIG-IP → Collector (required)']], payload: 'per-request HTTP metadata\n(exact field list: in-product Integration Guide,\n not in the web docs)', ops: ['Ingestion not increasing: check 6514 reachability, serverssl on the Internal Logging VS, the iRule pool name and attachment.'] },
  discovery: { role: 'Analysis Engine. Reconstructs endpoints from the metadata, groups domains by Host header, normalizes dynamic segments and applies Discovery Rules and Dynamic Path Templates. Analyze Now runs a cycle on demand.', ports: [['internal', 'container network']], payload: '/api/v1/users/123 ┐\n/api/v1/users/456 ┴─► GET /api/v1/users/$DYN$', ops: ['How long a cycle takes is not documented.'] },
  risk: { role: 'Risk scoring and sensitive-data findings, produced by the analysis. 0–100 per endpoint; Low/Medium/High.', ports: [['internal', 'container network']], payload: 'GET /api/v1/debug/users\n  auth: none · status: shadow\n  response: SSN, Date of Birth, Email\n  score: High', ops: ['Weights are not published by F5; this lab invents them.'] },
  license: { role: 'Decoupled licensing: JWT upload, Register Device, report.json out, Signed ACK in. The APIsec LE host itself stays offline.', ports: [['none', 'no outbound internet from the host']], payload: 'System > License\n  JWT → Register Device → report.json\n  (operator PC submits to F5)\n  signed_ack.json → Activate', ops: ['14-day Evaluation Mode available.'] },
  workstation: { role: 'An operator workstation with internet access. It is only used to carry licensing reports between APIsec LE and the F5 entitlements service.', ports: [['TCP 8000', 'to the Web UI'], ['internet', 'to F5 entitlements']], payload: 'report.json ──► F5\nsigned_ack.json ◄── F5', ops: ['Nothing else in the solution needs internet.'] },
  ui: { role: 'The local console: dashboard, per-domain inventory, schema upload, blocking, exports, system settings.', ports: [['TCP 8000', 'HTTPS from your browser']], payload: 'https://10.1.20.50:8000\nfirst login admin / admin → must be changed\nRecovery Key: System > Users', ops: ['Roles: Admin, Maintainer, Viewer.'] },
  schema: { role: 'Per-domain Upload Schema. The OpenAPI file becomes the baseline; observed endpoints that are not in it are flagged.', ports: [['TCP 8000', 'upload via UI']], payload: 'openapi: 3.0.x\npaths:\n  /api/v1/users/{id}: { get, delete }\n  …', ops: ['No separate drift/diff screen is documented.', 'Accepted OpenAPI versions are not documented.'] },
  datastore: { role: 'Local persistence for endpoints, statistics, audit records and configuration. Nothing leaves the host.', ports: [['internal', 'container network']], payload: 'exports: JSON · PDF · HTML · CSV\n(Export All · per-domain Export)', ops: ['./install_local.sh --purge permanently deletes this data.'] },
};

/* ------------------------------------------------------------------ */
/* Component Guide: what each piece does, in plain language            */
/* ------------------------------------------------------------------ */
// Facts restate NODE_INFO / FIELD_GUIDE (F5 APIsec LE 1.2.6 docs). `node` = the canvas node to show.
const COMPONENTS = {
  clients: { name: 'API Clients', node: 'clients',
    plain: 'Anyone calling the API: browsers, mobile apps, partner integrations. In this lab they include normal customers, a forgotten debug caller and old v0 mobile builds.',
    gets: 'API responses, always from BIG-IP', sends: 'HTTPS requests to the BIG-IP API virtual server (TCP 443)',
    lab: 'Every Traffic Replay burst starts here. Clients never talk to APIsec LE.' },
  vs: { name: 'BIG-IP API Virtual Server', node: 'vs',
    plain: 'The front door that already exists on BIG-IP. It load-balances API requests to the backends. When you set its mode to API Security, the telemetry iRule is attached so every request is also described out-of-band.',
    gets: 'Client HTTPS requests', sends: 'Requests to the backends (through the WAF policy) and request metadata to the Internal Logging Pool',
    lab: 'BIG-IP Integration → Virtual server mode. "None" means no telemetry at all; "Advanced API Security" adds ASM inspection plus an HSL profile.' },
  irule: { name: 'iRule telemetry forwarder', node: 'vs',
    plain: 'A small BIG-IP script attached to the API virtual server. For each request it hands a copy of the HTTP metadata to the Internal Logging Pool using high-speed logging (HSL). The request itself carries on untouched, so no proxy is inserted and no latency is added.',
    gets: 'Each request handled by the API VS', sends: 'HTTP metadata to the Internal Logging Pool',
    lab: 'Created for you by "Apply device settings". The Manual equivalent card shows the same chain by hand. The iRule body and exact field list are in the in-product Integration Guide, not the web docs.' },
  awaf: { name: 'Advanced WAF policy', node: 'awaf',
    plain: 'The BIG-IP Advanced WAF (ASM) policy on the API virtual server. It is the only place in the whole solution where traffic is blocked. APIsec LE writes block entries into it; BIG-IP enforces them inline.',
    gets: 'Requests from the VS, and policy updates from APIsec LE over iControl REST', sends: 'Allowed requests to the backends, 403s for blocked endpoints',
    lab: 'Mission 3. Needs Advanced WAF/ASM 15.1+. The policy must differentiate HTTP and HTTPS or a Block fails (known issue).' },
  svc: { name: 'Backend microservices', node: 'svc0',
    plain: 'users-svc, orders-svc and auth-svc: the real applications. APIsec LE never touches them. It only learns about them from the traffic BIG-IP describes.',
    gets: 'Whatever BIG-IP allows through', sends: 'Responses, which may contain sensitive data such as SSNs',
    lab: 'Packets that reach these boxes were allowed. Blocked ones stop at the WAF with a red ripple.' },
  logpool: { name: 'Internal Logging Pool', node: 'logpool',
    plain: 'A BIG-IP pool that exists so the iRule has a named place to log to. Its only member is the Internal Logging Virtual Server.',
    gets: 'Metadata from the iRule', sends: 'Metadata to the Internal Logging VS',
    lab: 'Dimmed until you Apply device settings. If ingestion stalls, check the iRule references this pool by name.' },
  logvs: { name: 'Internal Logging Virtual Server', node: 'logvs',
    plain: 'An internal BIG-IP virtual server on 6514. Its job is to wrap the metadata stream in TLS (serverssl profile) before it leaves BIG-IP.',
    gets: 'Metadata from the Internal Logging Pool', sends: 'TLS-encrypted metadata to the External Collector Pool',
    lab: 'A missing serverssl profile is a documented reason for the ingestion counter not increasing.' },
  colpool: { name: 'External Collector Pool', node: 'colpool',
    plain: 'A BIG-IP pool whose members are the APIsec LE Collector address(es) on TCP 6514. This is the point where the stream leaves BIG-IP.',
    gets: 'TLS metadata from the Internal Logging VS', sends: 'HSL over TLS to the Collector on TCP 6514',
    lab: 'Firewalls between BIG-IP and APIsec LE must allow 6514.' },
  collector: { name: 'Collector', node: 'collector',
    plain: 'The intake of APIsec LE. It listens on TCP 6514, receives the metadata stream from BIG-IP and holds the records until the Analysis Engine processes them.',
    gets: 'HSL-over-TLS metadata from BIG-IP (TCP 6514, required)', sends: 'Records to the Analysis Engine',
    lab: 'The "N QUEUED" badge on the canvas shows records waiting for Analyze Now.' },
  discovery: { name: 'Analysis Engine (discovery)', node: 'discovery',
    plain: 'Turns raw request records into an API inventory. It groups traffic into domains by Host header, rebuilds endpoints, collapses IDs into $DYN$ (so /users/123 and /users/456 become one endpoint) and applies your Discovery Rules and Dynamic Path Templates.',
    gets: 'Records from the Collector', sends: 'Endpoints to Risk scoring and the Data Store',
    lab: 'Analyze Now runs a cycle on demand. API Inventory → Discovery tuning holds the rules and templates.' },
  risk: { name: 'Risk scoring & sensitive data', node: 'risk',
    plain: 'Scores every endpoint 0–100 (Low 0–39, Medium 40–69, High 70–100) and flags sensitive data such as SSN, Date of Birth, Email or Credit Card. The score tells you what to triage first.',
    gets: 'Endpoints from the Analysis Engine', sends: 'Scores and findings to the Data Store and Web UI',
    lab: 'API Inventory → click a row → View selected API lists the factors. The factors come from the docs; the weights in this lab are invented.' },
  schema: { name: 'Schema baseline (OpenAPI)', node: 'schema',
    plain: 'Holds the OpenAPI file you upload for a domain. It is the yardstick for "documented": anything seen in traffic but not in the schema stays flagged as shadow.',
    gets: 'An OpenAPI file uploaded in the Web UI', sends: 'Baseline status to the inventory',
    lab: 'Schema (OAS) → Upload Schema, then Review comparison. There is no separate diff screen in the product.' },
  datastore: { name: 'Data Store', node: 'datastore',
    plain: 'Where everything APIsec LE learns is kept, on the local host: endpoints, statistics, audit records and configuration. Exports are produced from here.',
    gets: 'Endpoints, scores, settings', sends: 'Exports (JSON, PDF, HTML, CSV) and data for the Web UI',
    lab: 'Schema (OAS) → Export. ./install_local.sh --purge would permanently delete this data.' },
  ui: { name: 'Web UI (local console)', node: 'ui',
    plain: 'The console you open in a browser at https://<host>:8000. Dashboard, per-domain inventory, schema upload, blocking, exports and System settings (users, license).',
    gets: 'Your browser on TCP 8000 (HTTPS)', sends: 'Your decisions: approve, block, upload, export',
    lab: 'The Console Lab panel simulates it. First login is admin/admin and must be changed. Roles: Admin, Maintainer, Viewer.' },
  enforce: { name: 'Management Connector', node: 'enforce',
    plain: 'The only component that talks back to BIG-IP. When you click Block it calls iControl REST on the BIG-IP management address (TCP 443) to update the WAF policy. Discovery works without it.',
    gets: 'Block actions from the Web UI', sends: 'WAF policy updates to BIG-IP management (TCP 443)',
    lab: 'Enforcement → Test Management Connectivity, then Block. Watch the red packet travel up to the WAF.' },
  mgmt: { name: 'BIG-IP management plane', node: 'mgmt',
    plain: 'BIG-IP\'s management interface, separate from the data path. APIsec LE registers the device here and checks two statuses: Discovered and Management Connectivity. Both must succeed before enforcement works.',
    gets: 'iControl REST calls from the Management Connector', sends: 'Configuration changes to the WAF policy',
    lab: 'BIG-IP Integration → Add BIG-IP. The MGMT ✓ badge appears after the connectivity test.' },
  license: { name: 'License (decoupled)', node: 'license',
    plain: 'Licensing inside APIsec LE (System > License). It is decoupled so the host never needs internet: upload the JWT, Register Device, download report.json, bring back signed_ack.json, Activate.',
    gets: 'JWT and signed_ack.json, carried in by the operator', sends: 'report.json, carried out by the operator',
    lab: 'Deploy & Sign-in → Decoupled licensing. A 14-day Evaluation Mode also exists.' },
  workstation: { name: 'Operator workstation', node: 'workstation',
    plain: 'Any operator machine that has internet access. Its only job is to carry report.json to F5 and bring the Signed ACK back. Nothing else in the solution needs internet.',
    gets: 'report.json from APIsec LE', sends: 'signed_ack.json back to APIsec LE',
    lab: 'Do license step 2 and watch the amber packet move to Operator PC.' },
  deploy: { name: 'Deployment platform (Docker Compose or Kubernetes/Helm)', node: 'ui',
    plain: 'APIsec LE ships as containers you run on your own infrastructure. Everything in the cyan zone of the canvas runs here, with no dependency on F5 cloud. Docker Compose suits a single host, lab or proof-of-concept; Kubernetes with Helm suits production, high availability and multi-node.',
    gets: 'The install package', sends: 'Nothing outbound: normal operation needs no internet',
    lab: 'Deploy & Sign-in. Docker Engine 20.10+ with Compose 2.0+, or Kubernetes 1.26+ with Helm 3.10+; Bash 4+ for ./install_local.sh --default. The docs publish no sizing figures.' },
};
const COMPONENT_GROUPS = [
  { title: 'Data path on BIG-IP (inline)', color: C.crimson, ids: ['clients', 'vs', 'irule', 'awaf', 'svc'] },
  { title: 'Telemetry chain (out-of-band, BIG-IP → APIsec LE)', color: C.cyan, ids: ['logpool', 'logvs', 'colpool', 'collector'] },
  { title: 'APIsec LE stack (local Docker / Kubernetes)', color: C.cyan, ids: ['deploy', 'discovery', 'risk', 'schema', 'datastore', 'ui'] },
  { title: 'Enforcement & licensing', color: C.amber, ids: ['enforce', 'mgmt', 'license', 'workstation'] },
];
const JOURNEY = [
  ['clients', 'A client sends an HTTPS request to the BIG-IP API virtual server on TCP 443.'],
  ['awaf', 'The Advanced WAF policy checks it. An endpoint you have blocked gets a 403 here, at the edge.'],
  ['svc', 'Allowed requests reach the backend and the response returns through BIG-IP as usual.'],
  ['irule', 'For each request, the iRule on the VS copies the HTTP metadata to the Internal Logging Pool → Internal Logging VS (adds TLS) → External Collector Pool. The client is not delayed.'],
  ['collector', 'The Collector receives the stream on TCP 6514 and queues the records.'],
  ['discovery', 'The Analysis Engine (Analyze Now) rebuilds endpoints; Risk scoring rates them and flags sensitive data; results land in the Data Store.'],
  ['ui', 'You review them in the Web UI on TCP 8000, compare with the uploaded schema, and approve, retire or block.'],
  ['enforce', 'A Block goes out through the Management Connector → BIG-IP iControl REST (TCP 443) → WAF policy. Step 2 now stops that endpoint.'],
];

/* ------------------------------------------------------------------ */
/* Lab Guide: step-by-step walkthroughs                                */
/* ------------------------------------------------------------------ */
// Each step: where to go, what to click, what you should see, why it matters.
// `tab` = console tab to open, `canvas` = the step happens on the flow canvas, `done` = auto-tick.
const epBy = (s, pred) => Object.values(s.endpoints).some(pred);
const LAB_GUIDE = {
  1: {
    goal: 'Install APIsec LE on a local, air-gapped host, connect BIG-IP so it streams request metadata out-of-band, and discover your first endpoints.',
    before: 'Nothing. Start here after a Reset Simulation.',
    steps: [
      { title: 'Deploy APIsec LE locally', tab: 'deploy', done: (s) => s.deploy.status === 'running',
        do: ['Open the Deploy & Sign-in tab.', 'Pick Docker Compose (single host, lab) or Kubernetes (Helm) (production, HA).', 'Click Deploy locally.'],
        expect: ['The event log prints the install commands, then "APIsec LE running with no outbound internet".', 'The cyan APIsec LE zone on the canvas stops being dimmed and the console pill reads "online · air-gapped".'],
        why: 'Every APIsec LE component (Collector, Analysis Engine, Data Store, Web UI, Management Connector) runs on your own host. Nothing depends on F5 cloud.' },
      { title: 'Sign in and change the default password', tab: 'deploy', done: (s) => s.login === 2,
        do: ['In "2 · First sign-in", click Sign in (admin / admin).', 'Click Change password.'],
        expect: ['Both lines tick and the log suggests creating a Recovery Key under System > Users.'],
        why: 'The product forces a password change on first login. A Recovery Key is your way back in if the admin password is lost.' },
      { title: 'Answer the licensing check', tab: 'deploy', done: (s) => !!s.objectives.license,
        do: ['Optional: in "3 · Decoupled licensing", click Do it on each of the three steps and watch the amber packet move to Operator PC.', 'In the Licensing check, choose the task that needs an internet-connected machine.'],
        expect: ['The right answer turns cyan and the log explains the decoupled model. A wrong answer costs 5 XP.'],
        why: 'Only the license report exchange needs internet, and it goes through an operator workstation. Discovery and enforcement are entirely local.' },
      { title: 'Trace the telemetry chain on the canvas', canvas: true, done: (s) => CHAIN.every((k) => s.inspected[k]),
        do: ['On the flow canvas, click these five nodes: API Virtual Server, Int. Logging Pool, Int. Logging VS, Ext. Collector Pool, Collector.', 'Read each inspector card. The middle three are dimmed until step 5, but you can still click them.'],
        expect: ['Each node gets a small cyan dot and you earn +5 XP the first time.', 'The objective ticks once all five are inspected.'],
        why: 'This is the exact path request metadata takes from BIG-IP to APIsec LE. Knowing it is how you troubleshoot "ingestion not increasing".' },
      { title: 'Run the BIG-IP integration wizard', tab: 'bigip', done: (s) => !!s.objectives.integrate,
        do: ['Open BIG-IP Integration.', 'Click Add BIG-IP.', 'Click Connect → Collector :6514 → Apply device settings.', 'Under Virtual server mode, choose API Security.'],
        expect: ['The device row shows Discovered ✓ and Management Connectivity ✓.', 'The logging pool and VS nodes light up, the VS gets an "API SEC" badge, and the 6514 line turns cyan.'],
        why: 'Apply device settings creates the logging pools, the TLS logging VS, the log profile and the iRule. Choosing a VS mode attaches telemetry to that VS. "None" sends nothing.' },
      { title: 'Replay normal traffic', tab: 'traffic', done: (s) => !!s.objectives['replay:normal'],
        do: ['Open Traffic Replay.', 'Click Normal users.'],
        expect: ['Cyan packets travel Clients → BIG-IP → backends. Smaller packets branch down the dashed TCP 6514 line to the Collector.', 'The Collector shows "9 QUEUED" and "Inline latency added" stays at 0 ms.'],
        why: 'This proves discovery is out-of-band: BIG-IP serves the request normally and streams a description of it on the side.' },
      { title: 'Analyze Now', tab: 'traffic', done: (s) => !!s.objectives.analyze,
        do: ['Click Analyze Now.'],
        expect: ['A packet moves Collector → Analysis Engine → Risk. The log lists the new endpoints and the Analysis Engine shows an EPS badge.', 'Open API Inventory to see them. Order IDs appear as separate rows for now (the Module 2 bonus fixes that).'],
        why: 'The Analysis Engine rebuilds endpoints from the metadata and normalizes IDs to $DYN$.' },
    ],
    result: 'Mission 1 complete: +75 XP and the Out-of-Band Discovery badge. Take the Module 1 Boss Quiz to unlock Module 2.',
  },
  2: {
    goal: 'Find the undocumented endpoint that leaks SSNs, prove it is not in the OpenAPI schema, approve the legitimate APIs, and catch the zombie that went quiet.',
    before: 'Mission 1 done (APIsec LE running, BIG-IP integrated, normal traffic analyzed). The zombie step needs legacy-auth to have been seen in normal traffic first.',
    steps: [
      { title: 'Replay the shadow debug calls', tab: 'traffic', done: (s) => !!s.objectives['replay:shadow'],
        do: ['Traffic Replay → Shadow debug calls.', 'Optional: also click PII-leaking responses to see a documented endpoint over-share.'],
        expect: ['Amber packets reach users-svc. The log shows GET /api/v1/debug/users with no auth.'],
        why: 'Nobody documented this endpoint, but it is live and BIG-IP is happily serving it.' },
      { title: 'Analyze Now', tab: 'traffic', done: (s) => epBy(s, (e) => e.base === 'GET /api/v1/debug/users' && e.hits > 0),
        do: ['Click Analyze Now.'],
        expect: ['The log lists GET /api/v1/debug/users as new.'],
        why: 'Discovery only shows what the Analysis Engine has processed.' },
      { title: 'Filter by Status = shadow', tab: 'inventory', done: (s) => !!s.objectives['filter-shadow'],
        do: ['Open API Inventory.', 'Set the Status filter to shadow.'],
        expect: ['Right now every endpoint shows shadow. That is expected: nothing is documented (no schema) or approved (Inventory) yet.'],
        why: 'Shadow means undocumented or unmanaged. The next steps shrink this list to the real problem.' },
      { title: 'Open the high-risk endpoint', tab: 'inventory', done: (s) => !!s.objectives['view-high'],
        do: ['Click the GET /api/v1/debug/users row (red High pill, SSN tag).'],
        expect: ['View selected API opens: Authentication "none observed", sensitive data SSN, Date of Birth, Email in the response, and the risk factors that add up to High.'],
        why: 'The docs say to triage High first, especially shadow and unauthenticated endpoints that return sensitive data.' },
      { title: 'Upload the OpenAPI schema', tab: 'schema', done: (s) => !!s.objectives['upload-schema'],
        do: ['Open Schema (OAS).', 'Click Upload Schema.', 'Optional bonus: click Review comparison.'],
        expect: ['The log lists what is not in the schema: GET /api/v1/debug/users and GET /health (unless you already marked /health NON-API).', 'Documented endpoints change from shadow to in-schema. The Schema Baseline node gets a BASELINE badge.'],
        why: 'The schema is the yardstick for "documented". debug/users is still shadow, which proves it is undocumented.' },
      { title: 'Move 3 legitimate endpoints to Inventory', tab: 'inventory', done: (s) => !!s.objectives.promote3,
        do: ['In API Inventory, tick three documented endpoints, for example GET /api/v1/users/$DYN$, POST /api/v1/orders and POST /api/v1/auth/token.', 'Click Approve (Move to Inventory).'],
        expect: ['Their status becomes inventory (cyan).', 'Do not approve GET /api/v1/debug/users: the governance check costs 10 XP.'],
        why: 'Move to Inventory is how you approve an endpoint as managed. Only approved endpoints go into a schema export.' },
      { title: 'Fast-forward 30 days', tab: 'traffic', done: (s) => !!s.objectives.zombie || epBy(s, (e) => e.kind === 'legacy' && e.status === 'zombie'),
        do: ['Traffic Replay → Fast-forward 30 days.'],
        expect: ['The log reports a zombie: POST /api/v0/legacy-auth. The Zombie APIs tile in API Inventory shows 1.'],
        why: 'A zombie is an endpoint with no traffic for an extended period. The docs do not give a number; this lab uses 30 days.' },
      { title: 'Record a retire decision for the zombie', tab: 'inventory', done: (s) => !!s.objectives.zombie,
        do: ['In API Inventory, click POST /api/v0/legacy-auth (violet "zombie", old Last Updated).', 'Click Record retire decision.'],
        expect: ['The log records the decision with the API owner.'],
        why: 'A quiet, unauthenticated login endpoint is attack surface nobody watches. Retiring it is a governance decision, not an automatic action.' },
    ],
    result: 'Mission 2 complete: +75 XP and the Shadow/Zombie Hunter badge. Modules 2 and 3 cover this material; take their Boss Quizzes.',
  },
  3: {
    goal: 'Have APIsec LE update the BIG-IP WAF policy so BIG-IP blocks the shadow endpoint at the edge, then export a record for the audit.',
    before: 'Missions 1 and 2 done. GET /api/v1/debug/users must be discovered and still shadow (not deleted).',
    steps: [
      { title: 'Test Management Connectivity', tab: 'enforce', done: (s) => !!s.objectives.mgmt,
        do: ['Open Enforcement.', 'Click Test Management Connectivity.'],
        expect: ['Both device statuses tick and the BIG-IP Mgmt node shows "MGMT ✓".'],
        why: 'Enforcement needs the Management Connector to reach BIG-IP management on TCP 443 (iControl REST). Discovery does not.' },
      { title: 'Try to block the shadow endpoint', tab: 'enforce', done: (s) => !!s.objectives['block-fail'],
        do: ['Find the GET /api/v1/debug/users row. The list also shows other shadow or zombie endpoints such as GET /health; leave those alone.', 'Click its Block (push to BIG-IP WAF policy) and read the confirmation, then click Block.'],
        expect: ['A red packet travels Mgmt Connector → BIG-IP Mgmt → WAF policy, then the log says the block failed.', 'A red "Known issue hit" box appears.'],
        why: 'This failure is deliberate. A block creates two entries, HTTP and HTTPS, and fails if the policy does not differentiate schemes (documented known issue).' },
      { title: 'Apply the documented workaround', tab: 'enforce', done: (s) => !!s.objectives.scheme,
        do: ['In the Known issue box, click Switch to a Fundamental-template policy.'],
        expect: ['The prerequisites card shows "WAF policy differentiates HTTP and HTTPS".'],
        why: 'Enable scheme differentiation, or use a policy built on the Fundamental template.' },
      { title: 'Block it again', tab: 'enforce', done: (s) => !!s.objectives['block-shadow'],
        do: ['Click Block on the GET /api/v1/debug/users row again and confirm.'],
        expect: ['About two seconds of "Management Connector → iControl REST…", then the endpoint shows "blocked by BIG-IP" and the WAF node gets a BLOCKING badge.', 'Blocking a valid endpoint costs 10 XP, because real customers would get 403s.'],
        why: 'APIsec LE never blocks traffic itself. It changes the WAF policy; BIG-IP enforces.' },
      { title: 'Replay the attack', tab: 'traffic', done: (s) => !!s.objectives['verify-block'],
        do: ['Traffic Replay → Shadow debug calls.'],
        expect: ['Crimson packets stop at the WAF policy with a red ripple. The log shows "403 BLOCKED by BIG-IP WAF policy" and the Blocked counter rises.'],
        why: 'This closes the loop: discovered out-of-band, decided in APIsec LE, enforced inline on BIG-IP.' },
      { title: 'Export a report for the audit', tab: 'schema', done: (s) => !!s.objectives.export,
        do: ['Open Schema (OAS) → Export.', 'Pick a format (JSON, PDF, HTML or CSV) and click Export inventory or Export All.'],
        expect: ['A violet packet moves Data Store → Web UI and the log confirms the export.'],
        why: 'Exports are the documented way to hand evidence to auditors. A schema export includes only endpoints in Inventory.' },
    ],
    result: 'Mission 3 complete: +75 XP and the AWAF Enforcement badge. If you also uploaded the schema and reviewed the comparison, you hold the OAS Schema Governance badge. Take the Module 4 Boss Quiz.',
  },
};
const BONUS_GUIDE = [
  { title: 'Group order IDs with a Dynamic Path Template', tab: 'inventory', done: (s) => !!s.objectives.template,
    do: ['Replay Normal users and Analyze Now first, so order IDs like ORD-88121 appear as separate rows.', 'API Inventory → Discovery tuning → Add template (/api/v1/orders/*).'],
    expect: ['The separate order rows merge into GET /api/v1/orders/$DYN$, which then matches the schema.'],
    why: 'Automatic grouping catches numeric IDs. Templates override it for formats it misses. Segment types: Static, *, {int}, text-only, {int:split}.' },
  { title: 'Mark /health as NON-API with a Discovery Rule', tab: 'inventory', done: (s) => !!s.objectives.rule,
    do: ['API Inventory → Discovery tuning → Add rule (path = /health → NON-API).'],
    expect: ['GET /health changes to non-api and drops out of shadow counts.'],
    why: 'Load-balancer health checks are not APIs. Rules are evaluated top-down and the first match wins.' },
  { title: 'Review the schema-vs-traffic comparison', tab: 'schema', done: (s) => !!s.objectives['review-comparison'],
    do: ['Upload Schema first, then click Review comparison.'],
    expect: ['A table of observed endpoints with In schema yes/no and their status.'],
    why: 'This is a baseline comparison, not a diff tool: observed endpoints not in the schema stay flagged as shadow.' },
];
const TROUBLESHOOT = [
  ['Replay says "no metadata reached the Collector"', 'Deploy APIsec LE, then finish BIG-IP Integration through a VS mode other than None.'],
  ['Analyze Now says "no new metadata"', 'Replay a burst first. Analyze Now only processes queued records.'],
  ['Every endpoint is "shadow"', 'Expected until you Upload Schema or Move to Inventory. Shadow means undocumented or unmanaged.'],
  ['Approving lost me XP', 'You approved GET /api/v1/debug/users. It is unauthenticated and returns SSNs: block it instead.'],
  ['No zombie after fast-forward', 'legacy-auth must have been seen first. Replay Normal users and Analyze Now, then fast-forward again.'],
  ['Block failed', 'Expected the first time (HTTP/HTTPS known issue). Use the Fundamental-template fix, then Block again.'],
  ['debug/users is missing from Enforcement', 'The list shows shadow, zombie and blocked endpoints. If you deleted it, replay Shadow debug calls and Analyze Now.'],
  ['Order IDs show as separate rows', 'Add the Dynamic Path Template (Module 2 bonus).'],
  ['The next module is locked', 'Pass the current module\'s Boss Quiz with 75% or more.'],
];

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
const initialState = () => ({
  xp: 0, seq: 1, objectives: {}, missionsDone: {}, badges: {}, quizzes: {}, inspected: {}, hints: {},
  module: 1, mission: 1, view: 'split', tab: 'deploy', node: null, selected: null, drawer: false, quiz: null,
  guide: true, guideTab: 'start', // Lab Guide panel (free step-by-step walkthroughs)
  deploy: { pkg: 'compose', status: 'idle', step: 0 },
  login: 0, // 0 not signed in · 1 signed in, password change required · 2 done
  license: 0, // stepper: 0 none · 1 JWT registered · 2 report downloaded · 3 active
  bigip: { added: false, applied: false, mode: 'None', mgmtOk: false },
  pending: [], endpoints: {}, schema: false, compared: false, day: 0,
  template: false, rule: false,
  scheme: false, schemeFailed: false, filters: { status: 'all', auth: 'all', sens: 'all' }, confirm: null, pushing: null,
  stats: { requests: 0, telemetry: 0, blocked: 0 }, packets: [], logs: [], toasts: [],
});

const stamp = () => new Date().toLocaleTimeString([], { hour12: false });
function log(s, level, text) {
  return { ...s, logs: [...s.logs.slice(-120), { id: s.seq, t: stamp(), level, text }], seq: s.seq + 1 };
}
function toast(s, text, kind = 'xp') {
  return { ...s, toasts: [...s.toasts.slice(-3), { id: s.seq, text, kind }], seq: s.seq + 1 };
}
function award(s, xp, text) {
  const before = rankFor(s.xp);
  let n = { ...s, xp: Math.max(0, s.xp + xp) };
  n = toast(n, `${xp >= 0 ? '+' : ''}${xp} XP · ${text}`, xp >= 0 ? 'xp' : 'warn');
  const after = rankFor(n.xp);
  if (after.lvl > before.lvl) n = toast(n, `Rank up! Lvl ${after.lvl}: ${after.title}`, 'rank');
  return n;
}
function grantBadge(s, id) {
  if (s.badges[id]) return s;
  return toast({ ...s, badges: { ...s.badges, [id]: true } }, `Badge unlocked: ${BADGES[id].name}`, 'badge');
}
function complete(s, id) {
  const o = OBJ[id] || BONUS[id];
  if (!o || s.objectives[id]) return s;
  let n = award({ ...s, objectives: { ...s.objectives, [id]: true } }, o.xp, o.label);
  for (const m of MISSIONS) {
    if (!n.missionsDone[m.id] && m.objectives.every((x) => n.objectives[x.id])) {
      n = award({ ...n, missionsDone: { ...n.missionsDone, [m.id]: true } }, 75, `Mission ${m.id} complete`);
      n = grantBadge(n, m.badge);
    }
  }
  if (['upload-schema', 'review-comparison', 'export'].every((k) => n.objectives[k])) n = grantBadge(n, 'oas');
  return n;
}
function addPacket(s, p) {
  return { ...s, packets: [...s.packets, { id: s.seq, ...p }], seq: s.seq + 1 };
}
const telemetryOn = (s) => s.deploy.status === 'running' && s.bigip.applied && s.bigip.mode !== 'None';
const ZOMBIE_DAYS = 30; // simulated: the docs only say "an extended period"

// Status per docs: shadow (undocumented/unmanaged), inventory (moved to inventory),
// zombie (no traffic for an extended period), non-api (Discovery Rule). "declared" =
// in the uploaded schema but not yet seen.
function statusFor(ep, s) {
  if (ep.nonApi) return 'non-api';
  const known = ep.inventory || (s.schema && ep.inSchema);
  if (ep.hits > 0 && s.day - ep.lastSeen >= ZOMBIE_DAYS) return 'zombie';
  if (!known) return 'shadow';
  return ep.inventory ? 'inventory' : ep.hits > 0 ? 'in-schema' : 'declared';
}
function refresh(s) {
  const endpoints = {};
  for (const [k, ep] of Object.entries(s.endpoints)) {
    const e = { ...ep, status: statusFor(ep, s) };
    endpoints[k] = { ...e, risk: riskOf(e) };
  }
  return { ...s, endpoints };
}
function newEndpoint(key, base, s, path) {
  const c = CATALOG[base];
  return { key, ...c, path: path || c.path, base, host: DOMAIN, hits: 0, samples: [], codes: {}, sens: [...c.sens], reqSensOnly: !!c.reqSens, inventory: false, blocked: false, nonApi: false, lastSeen: s.day, retire: false, status: 'shadow' };
}
// Without a Dynamic Path Template, alphanumeric order IDs (ORD-88121) are not grouped.
const keyFor = (base, path, s) => (CATALOG[base].needsTemplate && !s.template ? `GET ${path.split('?')[0]}` : base);
const findByBase = (s, base) => Object.values(s.endpoints).filter((e) => e.base === base);

function reducer(state, a) {
  let s = state;
  switch (a.type) {
    case 'RESET': return initialState();
    case 'SET': return { ...s, ...a.patch };
    case 'VIEW': return { ...s, view: a.view };
    case 'TAB': return { ...s, tab: a.tab, view: ['flow', 'components'].includes(s.view) ? 'split' : s.view };
    case 'GOTO': { // from the Lab Guide: open a console tab and/or make sure the canvas is visible
      const view = s.view === 'components' || (a.tab && s.view === 'flow') || (a.canvas && s.view === 'console') ? 'split' : s.view;
      return { ...s, view, tab: a.tab || s.tab };
    }
    case 'MODULE': return { ...s, module: a.id, tab: MODULES[a.id - 1].tab };
    case 'DISMISS': return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case 'PRUNE': return s.packets.some((p) => a.now > p.start + p.dur * 1.5) ? { ...s, packets: s.packets.filter((p) => a.now <= p.start + p.dur * 1.5) } : s;

    case 'INSPECT': {
      s = { ...s, node: a.id };
      const id = a.id.startsWith('svc') ? 'svc' : a.id;
      if (!s.inspected[id]) s = award({ ...s, inspected: { ...s.inspected, [id]: true } }, 5, `Inspected ${id === 'svc' ? 'backend' : NODES[a.id].label}`);
      if (CHAIN.every((k) => s.inspected[k])) s = complete(s, 'chain');
      return s;
    }

    case 'DEPLOY_PKG': return { ...s, deploy: { ...s.deploy, pkg: a.pkg } };
    case 'DEPLOY_STEP': return log({ ...s, deploy: { ...s.deploy, status: 'deploying', step: a.step } }, 'info', a.text);
    case 'DEPLOY_DONE': {
      s = log({ ...s, deploy: { ...s.deploy, status: 'running', step: 99 } }, 'ok', `APIsec LE running with no outbound internet. Web UI: https://${LE_HOST}:8000`);
      return complete(s, 'deploy');
    }
    case 'LOGIN': {
      if (s.deploy.status !== 'running') return log(s, 'warn', 'Deploy APIsec LE first.');
      if (a.step === 1) return log({ ...s, login: 1 }, 'info', 'Signed in as admin/admin. The default password must be changed.');
      s = log({ ...s, login: 2 }, 'ok', 'Password changed. Tip: create a Recovery Key under System > Users.');
      return complete(s, 'login');
    }
    case 'LICENSE': {
      if (s.deploy.status !== 'running') return log(s, 'warn', 'Deploy APIsec LE first: System > License lives in the UI.');
      const msgs = ['JWT uploaded (from MyF5). Device registered.', 'report.json downloaded. The operator PC submits it to F5 over the internet.', 'signed_ack.json uploaded. License state: Active.'];
      s = { ...s, license: a.step };
      if (a.step === 2) s = addPacket(s, { route: 'license', color: C.amber, start: a.now, dur: 900, small: true });
      return log(s, a.step === 3 ? 'ok' : 'info', msgs[a.step - 1]);
    }
    case 'LICENSE_Q': {
      if (a.right) return complete(log(s, 'ok', 'Correct: only the licensing report exchange needs internet, via an operator workstation (decoupled model).'), 'license');
      return award(log(s, 'warn', 'Not that one. No internet is needed for normal operation: discovery and enforcement are local. Only the licensing report exchange goes through an internet-connected workstation.'), -5, 'Licensing check');
    }
    case 'BIGIP_ADD':
      if (s.deploy.status !== 'running') return log(s, 'warn', 'Deploy APIsec LE first.');
      return log({ ...s, bigip: { ...s.bigip, added: true } }, 'ok', `Add BIG-IP: ${BIGIP_MGMT}:443 → Discovered ✓  Management Connectivity ✓`);
    case 'BIGIP_APPLY':
      if (!s.bigip.added) return log(s, 'warn', 'Add the BIG-IP first.');
      return log({ ...s, bigip: { ...s.bigip, applied: true } }, 'ok', `Connect → Collector ${LE_HOST}:6514 → Apply device settings: internal log TLS VS ✓ log profile ✓ iRules ✓ pools ✓`);
    case 'BIGIP_MODE': {
      if (!s.bigip.applied) return log(s, 'warn', 'Apply device settings before choosing a VS mode.');
      s = log({ ...s, bigip: { ...s.bigip, mode: a.mode } }, a.mode === 'None' ? 'warn' : 'ok', `vs_api_https → ${a.mode}${a.mode === 'None' ? ' (no telemetry will be sent)' : '. Done.'}`);
      return a.mode !== 'None' ? complete(s, 'integrate') : s;
    }
    case 'MGMT_TEST': {
      if (!s.bigip.added) return log(s, 'block', 'Management Connectivity: no BIG-IP registered. Manage > BIG-IPs > Add BIG-IP.');
      s = log({ ...s, bigip: { ...s.bigip, mgmtOk: true } }, 'ok', `Management Connectivity ✓ (iControl REST, ${BIGIP_MGMT}:443). Discovered ✓.`);
      return complete(s, 'mgmt');
    }

    case 'REPLAY': {
      const b = BURSTS[a.burst];
      const tele = telemetryOn(s);
      let blockedNow = 0;
      const pending = [...s.pending];
      b.reqs.forEach(([base, path, code, leak, color], i) => {
        const blocked = findByBase(s, base).some((e) => e.blocked);
        const start = a.now + i * 240;
        s = addPacket(s, { route: blocked ? 'blocked' : 'inline', svc: CATALOG[base].svc, color: blocked ? C.crimson : color || b.color, start, dur: blocked ? 1000 : 1800, blocked });
        if (tele) {
          s = addPacket(s, { route: 'telemetry', color: color || b.color, start: start + 420, dur: 1500, small: true });
          pending.push({ base, path, code: blocked ? 403 : code, leak });
        }
        if (blocked) blockedNow++;
        s = log(s, blocked ? 'block' : a.burst === 'normal' ? 'info' : 'warn', `${blocked ? '403 BLOCKED by BIG-IP WAF policy' : code} ${CATALOG[base].method} ${path}${leak ? '  ← response contains ssn, dateOfBirth, accessToken' : ''}`);
      });
      s = { ...s, pending, stats: { ...s.stats, requests: s.stats.requests + b.reqs.length, telemetry: s.stats.telemetry + (tele ? b.reqs.length : 0), blocked: s.stats.blocked + blockedNow } };
      if (!tele) return log(s, 'warn', 'BIG-IP served the traffic, but no metadata reached the Collector. Deploy APIsec LE and finish the BIG-IP wizard (VS mode ≠ None).');
      s = log(s, 'info', `Collector received ${b.reqs.length} metadata records on :6514. Inline latency added: 0 ms. Run Analyze Now.`);
      s = complete(s, `replay:${a.burst}`);
      if (blockedNow) s = complete(s, 'verify-block');
      return s;
    }
    case 'ANALYZE': {
      if (s.deploy.status !== 'running') return log(s, 'warn', 'APIsec LE is not running.');
      if (!s.pending.length) return log(s, 'info', 'Analyze Now: no new metadata to process.');
      const endpoints = { ...s.endpoints };
      const fresh = [];
      for (const r of s.pending) {
        const key = keyFor(r.base, r.path, s);
        let ep = endpoints[key];
        if (!ep) { fresh.push(key); ep = newEndpoint(key, r.base, s, key.split(' ')[1]); }
        ep = { ...ep, hits: ep.hits + 1, lastSeen: s.day, samples: [...new Set([...ep.samples, r.path])].slice(-5), codes: { ...ep.codes, [r.code]: (ep.codes[r.code] || 0) + 1 } };
        if (r.leak) ep.sens = [...new Set([...ep.sens, 'SSN', 'Date of Birth', 'Token'])];
        if (s.rule && r.base === 'GET /health') ep.nonApi = true;
        endpoints[key] = ep;
      }
      s = addPacket(s, { route: 'analyze', color: C.cyan, start: a.now, dur: 1300, small: true });
      s = refresh({ ...s, endpoints, pending: [] });
      s = log(s, 'ok', `Analysis cycle: ${state.pending.length} records processed for ${DOMAIN}. ${fresh.length ? `New: ${fresh.join(', ')}` : 'Existing endpoints updated.'}`);
      return complete(s, 'analyze');
    }
    case 'ADVANCE': {
      if (!Object.keys(s.endpoints).length) return log(s, 'warn', 'Nothing discovered yet.');
      const day = s.day + 30;
      const endpoints = { ...s.endpoints };
      // Customers keep using the API; the old v0 app builds are finally retired and the debug caller stops.
      for (const [k, ep] of Object.entries(endpoints)) {
        if (ep.base === 'POST /api/v0/legacy-auth' || !ep.hits) continue;
        endpoints[k] = { ...ep, lastSeen: day, hits: ep.hits + 400 };
      }
      s = refresh({ ...s, day, endpoints });
      s = log(s, 'info', `Day ${day}. Traffic continued for 30 days on every endpoint except legacy-auth: the old v0 app builds were retired.`);
      const z = Object.values(s.endpoints).filter((e) => e.status === 'zombie');
      return z.length ? log(s, 'warn', `Zombie APIs (no traffic for ${ZOMBIE_DAYS}+ simulated days): ${z.map((e) => e.key).join(', ')}`) : s;
    }

    case 'FILTER': {
      s = { ...s, filters: { ...s.filters, [a.field]: a.value } };
      return a.field === 'status' && a.value === 'shadow' ? complete(s, 'filter-shadow') : s;
    }
    case 'SELECT': {
      s = { ...s, selected: a.key };
      const ep = s.endpoints[a.key];
      return ep && ep.risk.band === 'High' && ep.sens.includes('SSN') && !ep.auth ? complete(s, 'view-high') : s;
    }
    case 'MOVE_INV': {
      const keys = a.keys.filter((k) => s.endpoints[k] && !s.endpoints[k].inventory);
      if (!keys.length) return s;
      const endpoints = { ...s.endpoints };
      for (const k of keys) {
        const ep = endpoints[k];
        if (ep.kind === 'shadow') {
          s = award(log(s, 'warn', `Governance check: ${k} is unauthenticated and returns SSNs. Investigate or block it; do not approve it.`), -10, 'Risky approval');
          continue;
        }
        endpoints[k] = { ...ep, inventory: true };
        s = log(s, 'ok', `Move to Inventory: ${k}`);
      }
      s = refresh({ ...s, endpoints });
      const inv = Object.values(s.endpoints).filter((e) => e.inventory && e.kind === 'valid').length;
      return inv >= 3 ? complete(s, 'promote3') : s;
    }
    case 'REMOVE_INV': {
      const endpoints = { ...s.endpoints };
      for (const k of a.keys) if (endpoints[k]) endpoints[k] = { ...endpoints[k], inventory: false };
      return log(refresh({ ...s, endpoints }), 'info', `Remove from Inventory: ${a.keys.join(', ')}`);
    }
    case 'DELETE': {
      const endpoints = { ...s.endpoints };
      delete endpoints[a.key];
      return log({ ...s, endpoints, selected: null }, 'info', `Deleted ${a.key} and its data (it comes back if traffic is seen again).`);
    }
    case 'RETIRE': {
      const ep = s.endpoints[a.key];
      if (!ep || ep.status !== 'zombie') return s;
      s = log({ ...s, endpoints: { ...s.endpoints, [a.key]: { ...ep, retire: true } } }, 'ok', `Retire decision recorded with the API owner for ${a.key} (last updated day ${ep.lastSeen}).`);
      return ep.kind === 'legacy' ? complete(s, 'zombie') : s;
    }
    case 'TEMPLATE': {
      if (s.template) return s;
      const endpoints = {};
      const base = 'GET /api/v1/orders/$DYN$';
      let merged = null;
      for (const [k, ep] of Object.entries(s.endpoints)) {
        if (ep.base !== base) { endpoints[k] = ep; continue; }
        merged = merged
          ? { ...merged, hits: merged.hits + ep.hits, samples: [...new Set([...merged.samples, ...ep.samples])].slice(-5), codes: Object.fromEntries(Object.entries(ep.codes).map(([c, n]) => [c, n + (merged.codes[c] || 0)]).concat(Object.entries(merged.codes).filter(([c]) => !(c in ep.codes)))), inventory: merged.inventory || ep.inventory }
          : { ...ep, key: base, path: '/api/v1/orders/$DYN$' };
      }
      if (merged) endpoints[base] = merged;
      s = log(refresh({ ...s, template: true, endpoints }), 'ok', 'Dynamic Path Template added: /api/v1/orders/* (segment type *). Order IDs now group as /api/v1/orders/$DYN$.');
      return complete(s, 'template');
    }
    case 'RULE': {
      if (s.rule) return s;
      const endpoints = Object.fromEntries(Object.entries(s.endpoints).map(([k, ep]) => [k, ep.base === 'GET /health' ? { ...ep, nonApi: true } : ep]));
      s = log(refresh({ ...s, rule: true, endpoints }), 'ok', 'API Discovery Rule #1 (top-down, first match wins): path equals /health → NON-API.');
      return complete(s, 'rule');
    }

    case 'UPLOAD_SCHEMA': {
      if (s.deploy.status !== 'running') return log(s, 'warn', 'APIsec LE is not running.');
      const endpoints = { ...s.endpoints };
      for (const k of SCHEMA_KEYS) if (!findByBase({ endpoints }, k).length) endpoints[k] = newEndpoint(k, k, s);
      s = refresh({ ...s, schema: true, endpoints });
      const flagged = Object.values(s.endpoints).filter((e) => e.status === 'shadow');
      s = log(s, 'ok', `Upload Schema: acme-bank-api-v1.yaml set as the baseline for ${DOMAIN}. Not in schema: ${flagged.map((e) => e.key).join(', ') || 'none'}.`);
      return complete(s, 'upload-schema');
    }
    case 'REVIEW': {
      if (!s.schema) return log(s, 'warn', 'Upload a schema first.');
      return complete(log({ ...s, compared: true }, 'info', 'Reviewed the baseline comparison: observed endpoints not in the schema are flagged as shadow.'), 'review-comparison');
    }
    case 'SCHEME': {
      s = log({ ...s, scheme: true }, 'ok', 'WAF policy replaced with one built on the Fundamental template (differentiates HTTP and HTTPS). Retry the Block.');
      return complete(s, 'scheme');
    }
    case 'ASK_BLOCK': return { ...s, confirm: a.keys };
    case 'CANCEL_BLOCK': return { ...s, confirm: null };
    case 'BLOCK_START': {
      const keys = s.confirm;
      s = { ...s, confirm: null };
      if (!s.bigip.added) return log(s, 'block', 'Block failed: no BIG-IP registered (Manage > BIG-IPs).');
      s = addPacket(s, { route: 'enforce', color: C.crimson, start: a.now, dur: 1800 });
      if (!s.scheme) {
        s = log({ ...s, schemeFailed: true }, 'block', `Block failed for ${keys.join(', ')}: the change adds HTTP and HTTPS entries, but the WAF policy does not differentiate schemes (known issue).`);
        return complete(s, 'block-fail');
      }
      return log({ ...s, pushing: keys }, 'info', `Management Connector → iControl REST ${BIGIP_MGMT}:443: updating the WAF policy on vs_api_https for ${keys.join(', ')}…`);
    }
    case 'BLOCK_DONE': {
      const keys = s.pushing || [];
      const endpoints = { ...s.endpoints };
      for (const k of keys) if (endpoints[k]) endpoints[k] = { ...endpoints[k], blocked: true };
      s = refresh({ ...s, pushing: null, endpoints });
      for (const k of keys) {
        const ep = s.endpoints[k];
        if (!ep) continue;
        s = log(s, 'ok', `WAF policy updated: HTTP + HTTPS entries for ${k}. BIG-IP now blocks it at the edge.`);
        if (ep.kind === 'shadow') s = complete(s, 'block-shadow');
        if (ep.kind === 'valid') s = award(log(s, 'warn', `You blocked a legitimate endpoint (${k}). Real customers now get 403s.`), -10, 'Blocked a valid API');
      }
      return s;
    }
    case 'UNBLOCK': {
      const ep = s.endpoints[a.key];
      return log(refresh({ ...s, endpoints: { ...s.endpoints, [a.key]: { ...ep, blocked: false } } }), 'info', `Unblock: ${a.key}`);
    }
    case 'EXPORT': {
      if (!Object.keys(s.endpoints).length) return log(s, 'warn', 'Nothing to export yet.');
      s = addPacket(s, { route: 'export', color: C.violet, start: a.now, dur: 900, small: true });
      const inv = Object.values(s.endpoints).filter((e) => e.inventory).length;
      s = log(s, 'ok', a.what === 'schema'
        ? `Exported a traffic-derived schema (${a.fmt}) with ${inv} inventory endpoint(s). Endpoints not in Inventory are left out.`
        : `${a.what === 'all' ? 'Export All (dashboard summary)' : `Exported the ${DOMAIN} inventory`} as ${a.fmt}.`);
      return complete(s, 'export');
    }

    case 'HINT': {
      if (s.hints[a.id]) return s;
      return award({ ...s, hints: { ...s.hints, [a.id]: true } }, -a.cost, 'Field Guide hint');
    }
    case 'QUIZ_DONE': {
      const prev = s.quizzes[a.module] || { best: 0, passed: false };
      const passed = a.score >= passMark(QUIZZES[a.module].length);
      s = { ...s, quizzes: { ...s.quizzes, [a.module]: { best: Math.max(prev.best, a.score), passed: prev.passed || passed } } };
      if (passed && !prev.passed) s = award(s, 100, `Boss Quiz: Module ${a.module} mastered`);
      return s;
    }
    default: return s;
  }
}

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                      */
/* ------------------------------------------------------------------ */
const Pill = ({ color, children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    style={{ color, background: `${color}1f`, border: `1px solid ${color}55` }}>{children}</span>
);
const Btn = ({ onClick, children, variant = 'default', disabled, className = '', title }) => {
  const styles = {
    default: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700',
    primary: 'bg-[#e4002b] hover:bg-[#ff1a45] text-white border-[#e4002b]',
    cyan: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/40',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border-transparent',
  };
  return (
    <button title={title} disabled={disabled} onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};
const STATUS_COLOR = { shadow: C.amber, zombie: C.violet, inventory: C.cyan, 'in-schema': C.green, declared: C.slate, 'non-api': C.slate };

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */
function HUD({ s, dispatch }) {
  const rank = rankFor(s.xp);
  const next = RANKS.find((r) => r.min > s.xp);
  const pct = next ? ((s.xp - rank.min) / (next.min - rank.min)) * 100 : 100;
  const passed = Object.values(s.quizzes).filter((q) => q.passed).length;
  const mastery = Math.round((Object.keys(s.objectives).filter((k) => OBJ[k]).length / TOTAL_OBJ) * 70 + (passed / 4) * 30);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0b1120]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e4002b] shadow-[0_0_18px_#e4002b88]"><Shield size={20} className="text-white" /></div>
          <div>
            <div className="text-sm font-bold tracking-wide text-white">APIsec LE Academy</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">F5 API Security Local Edition · Flow Simulator</div>
          </div>
        </div>
        <div className="flex min-w-[260px] flex-1 items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5">
            <Crown size={16} className="text-amber-400" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">SecOps Rank</div>
              <div className="text-xs font-semibold text-white">Lvl {rank.lvl}: {rank.title}</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-[10px] text-slate-400">
              <span className="font-mono text-cyan-300">{s.xp} XP</span>
              <span>{next ? `${next.min - s.xp} XP to Lvl ${next.lvl}` : 'Max rank'}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#e4002b] transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Mastery</div>
            <div className="font-mono text-sm font-bold text-white">{mastery}%</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {Object.entries(BADGES).map(([id, b]) => {
            const on = s.badges[id];
            const I = b.icon;
            return (
              <div key={id} title={`${b.name}${on ? ' (unlocked)' : `: ${b.how}`}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${on ? 'scale-100' : 'opacity-30 grayscale'}`}
                style={{ borderColor: on ? b.color : '#334155', background: on ? `${b.color}22` : 'transparent', boxShadow: on ? `0 0 12px ${b.color}66` : 'none' }}>
                <I size={16} style={{ color: on ? b.color : '#64748b' }} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <a href="./ai-security.html" className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800" title="Open the F5 AI Security simulator">
            <Sparkles size={14} /> AI Security sim
          </a>
          <Btn variant={s.guide ? 'cyan' : 'default'} onClick={() => dispatch({ type: 'SET', patch: { guide: !s.guide } })} title="Free step-by-step walkthroughs for every mission"><Compass size={14} /> Lab Guide</Btn>
          <Btn onClick={() => dispatch({ type: 'SET', patch: { drawer: true } })}><Lightbulb size={14} className="text-amber-400" /> Field Guide</Btn>
          <Btn onClick={() => { if (window.confirm('Reset the simulation, XP and badges?')) dispatch({ type: 'RESET' }); }}><RotateCcw size={14} /> Reset Simulation</Btn>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar: skill tree + missions                                      */
/* ------------------------------------------------------------------ */
function Sidebar({ s, dispatch }) {
  const mission = MISSIONS[s.mission - 1];
  const done = mission.objectives.filter((o) => s.objectives[o.id]).length;
  return (
    <aside className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400"><Layers size={13} /> Skill Tree</h3>
        <ol className="space-y-1.5">
          {MODULES.map((m, i) => {
            const unlocked = i === 0 || s.quizzes[i]?.passed;
            const mastered = s.quizzes[m.id]?.passed;
            const active = s.module === m.id;
            const I = m.icon;
            return (
              <li key={m.id}>
                <button disabled={!unlocked} onClick={() => dispatch({ type: 'MODULE', id: m.id })}
                  className={`group flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${active ? 'border-[#e4002b] bg-[#e4002b]/10' : 'border-slate-800 hover:border-slate-600'} ${!unlocked ? 'cursor-not-allowed opacity-40' : ''}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${mastered ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'}`}>
                    {unlocked ? <I size={15} /> : <Lock size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Module {m.id}</div>
                    <div className="truncate text-xs font-medium text-slate-100">{m.title}</div>
                  </div>
                  {mastered && <Trophy size={14} className="text-amber-400" />}
                </button>
                {i < MODULES.length - 1 && <div className="ml-6 h-1.5 w-px bg-slate-700" />}
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-[10px] text-slate-500">Pass a module's Boss Quiz (75%) to unlock the next one.</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400"><Target size={13} /> Missions</h3>
        <div className="mb-3 grid grid-cols-3 gap-1">
          {MISSIONS.map((m) => (
            <button key={m.id} onClick={() => dispatch({ type: 'SET', patch: { mission: m.id, guideTab: m.id } })}
              className={`rounded-md border px-1 py-1.5 text-[11px] font-semibold transition ${s.mission === m.id ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}>
              {s.missionsDone[m.id] ? '✓ ' : ''}M{m.id}
            </button>
          ))}
        </div>
        <div key={mission.id} className="animate-fade-in">
          <div className="text-sm font-semibold text-white">{mission.title}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{mission.brief}</p>
          <Btn variant="cyan" className="mt-2 w-full" onClick={() => dispatch({ type: 'SET', patch: { guide: true, guideTab: mission.id } })}><ListChecks size={13} /> Step-by-step walkthrough</Btn>
          <div className="my-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${(done / mission.objectives.length) * 100}%` }} />
          </div>
          <ul className="space-y-1.5">
            {mission.objectives.map((o) => {
              const ok = s.objectives[o.id];
              return (
                <li key={o.id} className={`flex items-start gap-2 text-[11px] leading-snug transition ${ok ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {ok ? <CheckCircle2 size={14} className="mt-px shrink-0 text-cyan-400" /> : <Circle size={14} className="mt-px shrink-0 text-slate-600" />}
                  <span className="flex-1">{o.label}</span>
                  <span className="font-mono text-[10px] text-slate-500">+{o.xp}</span>
                </li>
              );
            })}
          </ul>
          {s.missionsDone[mission.id] && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-200"><Award size={14} /> Mission complete · +75 XP · badge earned</div>
          )}
        </div>
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Lab bonus</div>
          <ul className="space-y-1.5">
            {LAB_BONUS.map((o) => {
              const ok = s.objectives[o.id];
              return (
                <li key={o.id} className={`flex items-start gap-2 text-[11px] leading-snug ${ok ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                  {ok ? <CheckCircle2 size={14} className="mt-px shrink-0 text-cyan-400" /> : <Sparkles size={13} className="mt-px shrink-0 text-slate-600" />}
                  <span className="flex-1">{o.label}</span><span className="font-mono text-[10px] text-slate-500">+{o.xp}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Flow canvas                                                         */
/* ------------------------------------------------------------------ */
function useNow(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    let raf;
    const tick = () => { setNow(Date.now()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

function FlowCanvas({ s, dispatch, compact }) {
  const now = useNow(s.packets.length > 0);
  const focus = MODULES[s.module - 1].focus;
  const running = s.deploy.status === 'running';
  const tele = telemetryOn(s);
  const anyBlocked = Object.values(s.endpoints).some((e) => e.blocked);
  const awafHot = s.packets.some((p) => p.blocked && now >= p.start + p.dur * 0.85 && now <= p.start + p.dur * 1.5);

  const dim = (id) => {
    if (['enforce', 'collector', 'discovery', 'risk', 'license', 'ui', 'schema', 'datastore'].includes(id)) return !running;
    if (['logpool', 'logvs', 'colpool'].includes(id)) return !s.bigip.applied;
    if (id === 'mgmt') return !s.bigip.added;
    return false;
  };
  const badge = (id) => {
    if (id === 'awaf' && anyBlocked) return { t: 'BLOCKING', c: C.crimson };
    if (id === 'vs' && s.bigip.mode !== 'None') return { t: s.bigip.mode === 'API Security' ? 'API SEC' : 'ADV API SEC', c: C.cyan };
    if (id === 'collector' && s.pending.length) return { t: `${s.pending.length} QUEUED`, c: C.amber };
    if (id === 'license' && running) return { t: s.license === 3 ? 'ACTIVE' : 'INACTIVE', c: s.license === 3 ? C.green : C.amber };
    if (id === 'schema' && s.schema) return { t: 'BASELINE', c: C.violet };
    if (id === 'mgmt' && s.bigip.mgmtOk) return { t: 'MGMT ✓', c: C.green };
    if (id === 'discovery' && Object.keys(s.endpoints).length) return { t: `${Object.keys(s.endpoints).length} EPS`, c: C.cyan };
    return null;
  };

  const Edge = ({ pts, color = '#334155', dashed, label, lx, ly, active }) => (
    <g>
      <path d={toPath(pts)} fill="none" stroke={color} strokeWidth={active ? 2 : 1.5} strokeOpacity={active ? 0.9 : 0.5} className={dashed ? 'flow-dash' : ''} markerEnd="url(#arrow)" />
      {label && <text x={lx} y={ly} fill={color} fontSize="9.5" fontFamily="ui-monospace,monospace" opacity="0.9">{label}</text>}
    </g>
  );

  return (
    <div className="relative">
      <svg viewBox="0 0 1000 510" className="h-auto w-full select-none" role="img" aria-label="APIsec LE architecture and data flow">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#64748b" /></marker>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0 L0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" /></pattern>
        </defs>
        <rect width="1000" height="510" fill="url(#grid)" />

        {/* zones */}
        <rect x="190" y="14" width="420" height="252" rx="14" fill="#e4002b0d" stroke="#e4002b55" strokeDasharray="4 4" />
        <text x="202" y="10" fill="#e4002b" fontSize="11" fontWeight="700" letterSpacing="1">F5 BIG-IP · LTM + ADVANCED WAF (inline)</text>
        <rect x="190" y="305" width="790" height="200" rx="14" fill="#06b6d40a" stroke="#06b6d455" strokeDasharray="4 4" />
        <text x="202" y="300" fill="#06b6d4" fontSize="11" fontWeight="700" letterSpacing="1">F5 API SECURITY LOCAL EDITION · {s.deploy.pkg === 'helm' ? 'KUBERNETES (HELM)' : 'DOCKER COMPOSE'} · OUT-OF-BAND</text>
        <g transform="translate(838,286)"><CloudOff size={16} color={C.rose} /><text x="20" y="12" fill={C.rose} fontSize="10">no internet egress</text></g>
        <text x="700" y="28" fill="#94a3b8" fontSize="10" letterSpacing="1">BACKEND MICROSERVICES</text>

        {/* edges */}
        <Edge pts={[[150, 80], [205, 80]]} color={C.cyan} active />
        <Edge pts={[[380, 80], [395, 80]]} color={C.cyan} active />
        <Edge pts={[[595, 80], [650, 80], [650, 183], [700, 183]]} color={C.cyan} active />
        <Edge pts={[[650, 63], [700, 63]]} color={C.cyan} active />
        <Edge pts={[[650, 123], [700, 123]]} color={C.cyan} active />
        <Edge pts={[[266, 110], [266, 125]]} color={tele ? C.cyan : '#334155'} label="iRule" lx={272} ly={121} />
        <Edge pts={[[328, 155], [338, 155]]} color={tele ? C.cyan : '#334155'} />
        <Edge pts={[[461, 155], [471, 155]]} color={tele ? C.cyan : '#334155'} />
        <Edge pts={[[533, 185], [533, 285], [495, 285], [495, 335]]} color={tele ? C.cyan : '#334155'} dashed={tele} active={tele} label="TCP 6514 · HSL over TLS · out-of-band" lx={541} ly={232} />
        <text x="541" y="245" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace,monospace">0 ms added to the request path</text>
        <Edge pts={[[595, 364], [615, 364]]} color={running ? C.cyan : '#334155'} />
        <Edge pts={[[785, 364], [800, 364]]} color={running ? C.cyan : '#334155'} />
        <Edge pts={[[700, 435], [700, 393]]} color={s.schema ? C.violet : '#334155'} />
        <Edge pts={[[885, 393], [885, 435]]} color={running ? '#64748b' : '#334155'} />
        <Edge pts={[[495, 435], [495, 393]]} color={running ? '#64748b' : '#334155'} />
        <Edge pts={[[395, 464], [375, 464]]} color={running ? '#64748b' : '#334155'} />
        <Edge pts={[[170, 464], [205, 464]]} color={C.amber} dashed label="report.json ⇄ Signed ACK" lx={22} ly={428} />
        <Edge pts={[[290, 335], [290, 255]]} color={s.bigip.added ? C.crimson : '#334155'} dashed={!!s.pushing} label="iControl REST · TCP 443" lx={298} ly={300} />
        <Edge pts={[[205, 228], [185, 228], [185, 30], [495, 30], [495, 50]]} color={anyBlocked || s.pushing ? C.crimson : '#334155'} dashed={!!s.pushing} label="WAF policy update" lx={200} ly={44} />

        {/* nodes */}
        {Object.entries(NODES).map(([id, n]) => {
          const I = n.icon;
          const isFocus = focus.includes(id);
          const isSel = s.node === id;
          const off = dim(id);
          const hot = id === 'awaf' && awafHot;
          const stroke = hot ? C.crimson : isSel ? '#f8fafc' : isFocus ? (id === 'awaf' || id === 'enforce' || id === 'mgmt' ? C.crimson : C.cyan) : '#334155';
          const b = badge(id);
          const inspected = s.inspected[id.startsWith('svc') ? 'svc' : id];
          const small = !I;
          const tx = small ? n.x + 9 : n.x + 36;
          return (
            <g key={id} onClick={() => dispatch({ type: 'INSPECT', id })} className="cursor-pointer" opacity={off ? 0.4 : 1} style={{ transition: 'opacity .4s' }}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10" fill={hot ? '#e4002b33' : C.panel} stroke={stroke} strokeWidth={isSel || hot ? 2.2 : isFocus ? 1.8 : 1}
                filter={isFocus || hot ? 'url(#glow)' : undefined} style={{ transition: 'all .3s' }} />
              {I && <I x={n.x + 10} y={n.y + n.h / 2 - 9} width={18} height={18} color={hot ? C.crimson : isFocus ? '#e2e8f0' : '#94a3b8'} />}
              <text x={tx} y={n.y + n.h / 2 - 2} fill="#f1f5f9" fontSize={small ? 10.5 : 11.5} fontWeight="600">{n.label}</text>
              <text x={tx} y={n.y + n.h / 2 + 12} fill="#94a3b8" fontSize="9.5">{off && !['mgmt', 'logpool', 'logvs', 'colpool'].includes(id) ? 'not deployed' : off ? 'not configured' : n.sub}</text>
              {b && (
                <g>
                  <rect x={n.x + n.w - 70} y={n.y - 8} width="66" height="15" rx="7" fill={C.bg} stroke={b.c} />
                  <text x={n.x + n.w - 37} y={n.y + 3} fill={b.c} fontSize="8.5" fontWeight="700" textAnchor="middle">{b.t}</text>
                </g>
              )}
              {inspected && <circle cx={n.x + 6} cy={n.y + 6} r="3.5" fill={C.cyan} />}
            </g>
          );
        })}

        {/* packets */}
        {s.packets.map((p) => {
          const t = (now - p.start) / p.dur;
          if (t < 0) return null;
          const pts = ROUTES[p.route](p.svc);
          if (t > 1) {
            if (!p.blocked || t > 1.5) return null;
            const [x, y] = pts[pts.length - 1];
            const k = (t - 1) / 0.5;
            return <circle key={p.id} cx={x} cy={y} r={6 + k * 22} fill="none" stroke={C.crimson} strokeWidth={3 * (1 - k)} opacity={1 - k} />;
          }
          const [x, y] = pointAt(pts, t);
          return <circle key={p.id} cx={x} cy={y} r={p.small ? 3.2 : 5} fill={p.color} filter="url(#glow)" opacity={p.small ? 0.85 : 1} />;
        })}
      </svg>

      <div className={`flex flex-wrap gap-3 px-1 pt-2 text-[10px] text-slate-400 ${compact ? 'hidden md:flex' : ''}`}>
        {[[C.cyan, 'clean traffic / telemetry'], [C.amber, 'shadow API'], [C.violet, 'legacy / zombie'], [C.rose, 'PII leak'], [C.crimson, 'blocked / enforcement']].map(([c, t]) => (
          <span key={t} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{t}</span>
        ))}
        <span className="ml-auto flex items-center gap-1"><Eye size={11} /> click any node to inspect (+5 XP first time)</span>
      </div>

      {s.node && <Inspector id={s.node} s={s} onClose={() => dispatch({ type: 'SET', patch: { node: null } })} />}
    </div>
  );
}

function Inspector({ id, s, onClose }) {
  const n = NODES[id];
  const info = NODE_INFO[id.startsWith('svc') ? 'svc' : id];
  const I = n.icon || Layers;
  const inFocus = MODULES[s.module - 1].focus.includes(id);
  const comp = COMPONENTS[id.startsWith('svc') ? 'svc' : id];
  return (
    <div key={id} className="animate-fade-in mt-3 grid gap-3 rounded-xl border border-slate-700 bg-[#0b1120]/95 p-4 md:grid-cols-2">
      <div>
      <div className="mb-2 flex items-start gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800"><I size={16} className="text-cyan-300" /></div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{n.full || n.label}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">{n.sub}</div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
      </div>
      {inFocus && <Pill color={C.crimson} className="mb-2">Module {s.module} focus</Pill>}
      {comp && <p className="mb-2 rounded-md border border-cyan-500/30 bg-cyan-500/5 p-2 text-xs leading-relaxed text-slate-200"><span className="font-semibold text-cyan-300">In plain words: </span>{comp.plain}</p>}
      <p className="text-xs leading-relaxed text-slate-300">{info.role}</p>
      {comp && (
        <div className="mt-2 grid grid-cols-[70px_1fr] gap-y-1 text-[11px]">
          <span className="text-slate-500">Receives</span><span className="text-slate-300">{comp.gets}</span>
          <span className="text-slate-500">Sends</span><span className="text-slate-300">{comp.sends}</span>
          <span className="text-slate-500">In the lab</span><span className="text-slate-300">{comp.lab}</span>
        </div>
      )}
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Operational notes</div>
      <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-300">{info.ops.map((o) => <li key={o}>{o}</li>)}</ul>
      </div>
      <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ports & connectivity</div>
      <ul className="mt-1 space-y-1">
        {info.ports.map(([p, d]) => (
          <li key={p + d} className="flex gap-2 text-xs"><span className="w-20 shrink-0 font-mono text-cyan-300">{p}</span><span className="text-slate-300">{d}</span></li>
        ))}
      </ul>
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data / config sample</div>
      <pre className="mt-1 overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-2 font-mono text-[10.5px] leading-relaxed text-slate-300">{info.payload}</pre>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Console lab                                                         */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: 'deploy', label: 'Deploy & Sign-in', icon: Boxes },
  { id: 'bigip', label: 'BIG-IP Integration', icon: Server },
  { id: 'traffic', label: 'Traffic Replay', icon: Activity },
  { id: 'inventory', label: 'API Inventory', icon: Database },
  { id: 'schema', label: 'Schema (OAS)', icon: GitCompare },
  { id: 'enforce', label: 'Enforcement', icon: ShieldCheck },
];

function ConsoleLab({ s, dispatch }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
        <Monitor size={14} className="text-cyan-400" />
        <span className="font-mono text-[11px] text-slate-400">https://{LE_HOST}:8000 · {DOMAIN}</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500"><Timer size={11} /> day {s.day}</span>
        <Pill color={s.deploy.status === 'running' ? C.green : C.slate}>{s.deploy.status === 'running' ? 'online · air-gapped' : s.deploy.status}</Pill>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800 px-2 pt-2">
        {TABS.map((t) => {
          const I = t.icon;
          return (
            <button key={t.id} onClick={() => dispatch({ type: 'TAB', tab: t.id })}
              className={`flex shrink-0 items-center gap-1.5 rounded-t-md border-b-2 px-3 py-1.5 text-xs transition ${s.tab === t.id ? 'border-[#e4002b] bg-slate-800/70 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              <I size={13} /> {t.label}
            </button>
          );
        })}
      </div>
      <div key={s.tab} className="animate-fade-in flex-1 overflow-y-auto p-3">
        {s.tab === 'deploy' && <DeployTab s={s} dispatch={dispatch} />}
        {s.tab === 'bigip' && <BigipTab s={s} dispatch={dispatch} />}
        {s.tab === 'traffic' && <TrafficTab s={s} dispatch={dispatch} />}
        {s.tab === 'inventory' && <InventoryTab s={s} dispatch={dispatch} />}
        {s.tab === 'schema' && <SchemaTab s={s} dispatch={dispatch} />}
        {s.tab === 'enforce' && <EnforceTab s={s} dispatch={dispatch} />}
      </div>
      <LogPane logs={s.logs} />
    </div>
  );
}

const Card = ({ title, icon: I, children, right }) => (
  <section className="mb-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
    <div className="mb-2 flex items-center gap-2">
      {I && <I size={14} className="text-cyan-400" />}
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">{title}</h4>
      <div className="ml-auto">{right}</div>
    </div>
    {children}
  </section>
);
const Code = ({ children }) => <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] leading-relaxed text-emerald-300">{children}</pre>;
const Check = ({ ok, children }) => (
  <li className="flex items-center gap-2">{ok ? <CheckCircle2 size={14} className="shrink-0 text-cyan-400" /> : <Circle size={14} className="shrink-0 text-slate-600" />}<span className={ok ? 'text-slate-500' : 'text-slate-200'}>{children}</span></li>
);

function DeployTab({ s, dispatch }) {
  const d = s.deploy;
  const running = d.status === 'running';
  const steps = d.pkg === 'compose'
    ? ['# Linux host · Docker Engine 20.10+ · Docker Compose 2.0+ · Bash 4+', 'tar -xzf <apisec-le-package>.tgz && cd <package-dir>', './install_local.sh --default', '# no internet needed for normal operation', '# the script prints the host’s usable IP addresses']
    : ['# Kubernetes 1.26+ · kubectl · Helm 3.10+', '# set persistent storage + resource requests/limits (values in the package README)', 'helm install apisec-le <chart-from-package> -n apisec-le -f values.yaml', '# expose the UI on 8000 via ingress, load balancer or NodePort', '# pods ready'];
  const run = () => {
    steps.forEach((t, i) => setTimeout(() => dispatch({ type: 'DEPLOY_STEP', step: i + 1, text: t.startsWith('#') ? t : `$ ${t}` }), i * 500));
    setTimeout(() => dispatch({ type: 'DEPLOY_DONE' }), steps.length * 500 + 200);
  };
  const [pick, setPick] = useState(null);
  const opts = ['Day-to-day dashboard and inventory use', 'The licensing report exchange (report.json / Signed ACK)', 'Endpoint discovery', 'Blocking via iControl REST'];
  return (
    <>
      <Card title="1 · Choose a package and deploy" icon={Boxes} right={<Pill color={running ? C.green : C.slate}>{d.status}</Pill>}>
        <div className="grid gap-2 sm:grid-cols-2">
          {[['compose', 'Docker Compose', 'Single host, lab, proof-of-concept'], ['helm', 'Kubernetes (Helm)', 'Production, high availability, multi-node']].map(([id, t, sub]) => (
            <button key={id} disabled={d.status !== 'idle'} onClick={() => dispatch({ type: 'DEPLOY_PKG', pkg: id })}
              className={`rounded-lg border p-3 text-left transition disabled:cursor-not-allowed ${d.pkg === id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
              <div className="text-sm font-semibold text-white">{t}</div>
              <div className="text-[11px] text-slate-400">{sub}</div>
            </button>
          ))}
        </div>
        <div className="mt-2"><Code>{steps.map((x) => (x.startsWith('#') ? x : `$ ${x}`)).join('\n')}</Code></div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Btn variant="primary" disabled={d.status !== 'idle'} onClick={run}><Play size={13} /> {running ? 'Deployed' : d.status === 'deploying' ? 'Deploying…' : 'Deploy locally'}</Btn>
          <span className="text-[11px] text-slate-500">Sizing: the docs publish no figures. Ask F5 Sales or a Solutions Engineer.</span>
        </div>
      </Card>

      <Card title="2 · First sign-in" icon={KeyRound}>
        <ul className="space-y-1.5 text-xs">
          <Check ok={s.login >= 1}>Open https://{LE_HOST}:8000 and sign in with admin / admin</Check>
          <Check ok={s.login >= 2}>Change the default password (required)</Check>
        </ul>
        <div className="mt-2 flex gap-2">
          <Btn variant="cyan" disabled={!running || s.login > 0} onClick={() => dispatch({ type: 'LOGIN', step: 1 })}>Sign in</Btn>
          <Btn variant="cyan" disabled={s.login !== 1} onClick={() => dispatch({ type: 'LOGIN', step: 2 })}>Change password</Btn>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Create a Recovery Key in advance under System &gt; Users.</p>
      </Card>

      <Card title="3 · Decoupled licensing (System > License)" icon={KeyRound} right={<Pill color={s.license === 3 ? C.green : C.amber}>{s.license === 3 ? 'Active' : 'Inactive'}</Pill>}>
        <ol className="space-y-2 text-xs">
          {[['Upload the JWT from MyF5 → Register Device', 1], ['Download report.json → the operator PC submits it to F5', 2], ['Upload signed_ack.json → Activate Your License', 3]].map(([t, n]) => (
            <li key={n} className="flex items-center gap-2">
              {s.license >= n ? <CheckCircle2 size={14} className="text-cyan-400" /> : <Circle size={14} className="text-slate-600" />}
              <span className={`flex-1 ${s.license >= n ? 'text-slate-500' : 'text-slate-200'}`}>{t}</span>
              <Btn variant="cyan" disabled={s.license !== n - 1 || !running} onClick={() => dispatch({ type: 'LICENSE', step: n, now: Date.now() })}>Do it</Btn>
            </li>
          ))}
        </ol>
        <div className="mt-3 rounded-md border border-slate-700 bg-slate-950/60 p-2">
          <div className="text-xs text-white">Licensing check: which task needs an internet-connected machine?</div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {opts.map((o, i) => (
              <button key={o} disabled={s.objectives.license} onClick={() => { setPick(i); dispatch({ type: 'LICENSE_Q', right: i === 1 }); }}
                className={`rounded-md border px-2 py-1.5 text-left text-[11px] transition disabled:cursor-default ${s.objectives.license && i === 1 ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200' : pick === i ? 'border-rose-500 bg-rose-500/10 text-rose-200' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>{o}</button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">The host runs fully air-gapped. A 14-day Evaluation Mode also exists.</p>
        </div>
      </Card>
    </>
  );
}

function BigipTab({ s, dispatch }) {
  const b = s.bigip;
  return (
    <>
      <Card title="Manage > BIG-IPs" icon={Server}>
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="py-1">Device</th><th>Discovered</th><th>Management Connectivity</th></tr></thead>
          <tbody>
            {b.added ? (
              <tr className="border-t border-slate-800"><td className="py-1.5 font-mono text-slate-200">bigip-edge-01 · {BIGIP_MGMT}:443</td><td className="text-cyan-400">✓</td><td className="text-cyan-400">✓</td></tr>
            ) : (
              <tr className="border-t border-slate-800"><td colSpan={3} className="py-2 text-slate-500">No devices yet.</td></tr>
            )}
          </tbody>
        </table>
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn variant="cyan" disabled={b.added} onClick={() => dispatch({ type: 'BIGIP_ADD' })}><Server size={13} /> Add BIG-IP</Btn>
          <Btn variant="cyan" disabled={!b.added || b.applied} onClick={() => dispatch({ type: 'BIGIP_APPLY' })}><Zap size={13} /> Connect → Collector :6514 → Apply device settings</Btn>
        </div>
        {b.applied && (
          <ul className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            {['Collector ' + LE_HOST + ':6514', 'Internal log TLS VS', 'Log profile', 'iRules', 'Pools'].map((x) => <li key={x} className="flex items-center gap-1"><CheckCircle2 size={12} className="text-cyan-400" />{x}</li>)}
          </ul>
        )}
      </Card>
      <Card title="Virtual server mode → Done" icon={Workflow}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-slate-300">vs_api_https</span>
          {['None', 'API Security', 'Advanced API Security'].map((m) => (
            <button key={m} disabled={!b.applied} onClick={() => dispatch({ type: 'BIGIP_MODE', mode: m })}
              className={`rounded-md border px-2.5 py-1 transition disabled:opacity-40 ${b.mode === m ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200' : 'border-slate-700 text-slate-400 hover:text-white'}`}>{m}</button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Advanced API Security adds ASM inspection plus an HSL profile. Set it up only after standard integration works; it can conflict with an existing WAF policy.</p>
      </Card>
      <Card title="Manual equivalent (in-product Integration Guide)" icon={Terminal}>
        <Code>{`# 1 External Collector Pool  → members ${LE_HOST}:6514
# 2 Internal Logging VS :6514 + serverssl (serverside), pool = #1
# 3 Internal Logging Pool    → member = #2
# 4 iRule (body from Integration > Integration Guide),
#   with the Internal Logging Pool name set
# 5 Attach the iRule to the API virtual server`}</Code>
      </Card>
    </>
  );
}

function TrafficTab({ s, dispatch }) {
  const tele = telemetryOn(s);
  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[['Requests', s.stats.requests, C.cyan], ['Metadata records', s.stats.telemetry, C.cyan], ['Blocked by BIG-IP', s.stats.blocked, C.crimson], ['Inline latency added', '0 ms', C.green]].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{k}</div>
            <div className="font-mono text-lg font-bold" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>
      {!tele && <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-200"><AlertTriangle size={14} /> No telemetry yet. BIG-IP still serves traffic, but APIsec LE sees nothing until it is deployed and a VS is set to API Security.</div>}
      <Card title="Traffic replay simulator" icon={Activity}>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(BURSTS).map(([id, b]) => {
            const I = b.icon;
            return (
              <button key={id} onClick={() => dispatch({ type: 'REPLAY', burst: id, now: Date.now() })}
                className="group rounded-lg border border-slate-700 p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-500" style={{ boxShadow: `inset 3px 0 0 ${b.color}` }}>
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><I size={15} style={{ color: b.color }} /> {b.label}<Play size={12} className="ml-auto text-slate-500 group-hover:text-white" /></div>
                <div className="mt-1 text-[11px] text-slate-400">{b.desc}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Btn variant="primary" onClick={() => dispatch({ type: 'ANALYZE', now: Date.now() })}><Sparkles size={13} /> Analyze Now ({s.pending.length} queued)</Btn>
          <Btn onClick={() => dispatch({ type: 'ADVANCE' })}><Timer size={13} /> Fast-forward 30 days</Btn>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Fast-forward keeps traffic flowing on every endpoint except /api/v0/legacy-auth, whose old app builds were retired. A zombie is an endpoint that goes quiet; the docs do not say how long that takes, so the simulator uses {ZOMBIE_DAYS} days.</p>
      </Card>
    </>
  );
}

function RiskPill({ risk }) {
  if (!risk) return null;
  const c = bandColor(risk.band);
  return <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold" style={{ color: c, background: `${c}1f` }}>{risk.score} {risk.band}</span>;
}
const Sel = ({ label, value, onChange, options }) => (
  <label className="flex items-center gap-1 text-[11px] text-slate-400">{label}
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-xs text-slate-200">
      {options.map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  </label>
);

function InventoryTab({ s, dispatch }) {
  const [checked, setChecked] = useState({});
  const all = Object.values(s.endpoints);
  const f = s.filters;
  const rows = all
    .filter((e) => f.status === 'all' || e.status === f.status)
    .filter((e) => f.auth === 'all' || (f.auth === 'authenticated' ? e.auth : !e.auth))
    .filter((e) => f.sens === 'all' || (f.sens === 'none' ? !e.sens.length : e.sens.includes(f.sens)))
    .sort((a, b) => b.risk.score - a.risk.score);
  const sel = s.selected && s.endpoints[s.selected];
  const counts = all.reduce((m, e) => ({ ...m, [e.status]: (m[e.status] || 0) + 1 }), {});
  const sensTop = all.flatMap((e) => e.sens).reduce((m, x) => ({ ...m, [x]: (m[x] || 0) + 1 }), {});
  const codes = all.reduce((m, e) => { Object.entries(e.codes).forEach(([c, n]) => { m[`${c[0]}xx`] = (m[`${c[0]}xx`] || 0) + n; }); return m; }, {});
  const codeTotal = Object.values(codes).reduce((a, b) => a + b, 0);
  const active = [...all].filter((e) => e.hits).sort((a, b) => b.hits - a.hits).slice(0, 3);
  const chosen = Object.keys(checked).filter((k) => checked[k] && s.endpoints[k]);
  const setF = (field) => (value) => dispatch({ type: 'FILTER', field, value });
  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[['Total Domains', all.length ? 1 : 0, C.cyan], ['Total API Endpoints', all.length, C.cyan], ['Total BIG-IPs', s.bigip.added ? 1 : 0, C.cyan], ['Shadow APIs', counts.shadow || 0, C.amber], ['Zombie APIs', counts.zombie || 0, C.violet]].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2"><div className="text-[10px] uppercase tracking-wider text-slate-500">{k}</div><div className="font-mono text-lg font-bold" style={{ color: c }}>{v}</div></div>
        ))}
      </div>
      {all.length > 0 && (
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Most Active APIs</div>
            {active.map((e) => <div key={e.key} className="flex justify-between font-mono text-[10.5px] text-slate-300"><span className="truncate">{e.key}</span><span className="text-slate-500">{e.hits}</span></div>)}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Top Sensitive Data</div>
            <div className="flex flex-wrap gap-1">{Object.entries(sensTop).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Pill key={k} color={['SSN', 'Credit Card', 'Date of Birth'].includes(k) ? C.rose : C.amber}>{k} × {v}</Pill>)}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Response Code Distribution</div>
            <div className="flex h-3 overflow-hidden rounded">{['2xx', '3xx', '4xx', '5xx'].map((c) => codes[c] ? <div key={c} title={`${c}: ${codes[c]}`} style={{ width: `${(codes[c] / codeTotal) * 100}%`, background: { '2xx': C.cyan, '3xx': C.slate, '4xx': C.crimson, '5xx': C.amber }[c] }} /> : null)}</div>
            <div className="mt-1 flex gap-2 font-mono text-[10px] text-slate-400">{Object.entries(codes).map(([c, n]) => <span key={c}>{c} {n}</span>)}</div>
          </div>
        </div>
      )}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Filter size={13} className="text-slate-500" />
        <Sel label="Status" value={f.status} onChange={setF('status')} options={['all', 'shadow', 'zombie', 'inventory', 'in-schema', 'declared', 'non-api']} />
        <Sel label="Authentication" value={f.auth} onChange={setF('auth')} options={['all', 'authenticated', 'none']} />
        <Sel label="Sensitive Data" value={f.sens} onChange={setF('sens')} options={['all', 'SSN', 'Date of Birth', 'Email', 'Token', 'Credentials', 'none']} />
        <Btn variant="ghost" onClick={() => ['status', 'auth', 'sens'].forEach((k) => dispatch({ type: 'FILTER', field: k, value: 'all' }))}>Reset Filters</Btn>
        <Btn variant="primary" className="ml-auto" onClick={() => dispatch({ type: 'ANALYZE', now: Date.now() })}><Sparkles size={13} /> Analyze Now</Btn>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span>Batch ({chosen.length}):</span>
        <Btn variant="cyan" disabled={!chosen.length} onClick={() => { dispatch({ type: 'MOVE_INV', keys: chosen }); setChecked({}); }}><ArrowUpCircle size={13} /> Approve (Move to Inventory)</Btn>
        <Btn disabled={!chosen.length} onClick={() => { dispatch({ type: 'REMOVE_INV', keys: chosen }); setChecked({}); }}>Reject (Remove from Inventory)</Btn>
        <Btn variant="primary" disabled={!chosen.length} onClick={() => { dispatch({ type: 'ASK_BLOCK', keys: chosen }); setChecked({}); }}><Swords size={13} /> Block endpoints</Btn>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="bg-slate-900 text-left text-[10px] uppercase tracking-wider text-slate-500">
            <tr><th className="w-6 p-2" /><th className="p-2">Endpoint ({DOMAIN})</th><th>Auth</th><th>Sensitive Data</th><th>API Category</th><th>Risk</th><th>Status</th><th>Last Updated</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-slate-500">{all.length ? 'No endpoints match these filters.' : 'No endpoints yet. Replay traffic, then Analyze Now.'}</td></tr>}
            {rows.map((e) => (
              <tr key={e.key} onClick={() => dispatch({ type: 'SELECT', key: e.key })} className={`cursor-pointer border-t border-slate-800 transition hover:bg-slate-800/50 ${s.selected === e.key ? 'bg-slate-800/70' : ''}`}>
                <td className="p-2" onClick={(ev) => ev.stopPropagation()}><input type="checkbox" aria-label={`select ${e.key}`} checked={!!checked[e.key]} onChange={(ev) => setChecked({ ...checked, [e.key]: ev.target.checked })} className="accent-cyan-500" /></td>
                <td className="p-2 font-mono"><span className="mr-1.5 font-bold text-cyan-300">{e.method}</span><span className="text-slate-200">{e.path}</span>{e.blocked && <Pill color={C.crimson} className="ml-2">blocked</Pill>}</td>
                <td>{e.auth ? <span className="text-cyan-400">yes</span> : <span className="text-rose-400">none</span>}</td>
                <td className="space-x-1">{e.sens.map((x) => <Pill key={x} color={['SSN', 'Credit Card', 'Date of Birth'].includes(x) ? C.rose : C.amber}>{x}</Pill>)}</td>
                <td className="text-slate-400">{e.category}</td>
                <td><RiskPill risk={e.risk} /></td>
                <td><Pill color={STATUS_COLOR[e.status]}>{e.status}</Pill></td>
                <td className={`font-mono ${e.hits && s.day - e.lastSeen >= ZOMBIE_DAYS ? 'text-violet-300' : 'text-slate-400'}`}>{e.hits ? (s.day - e.lastSeen ? `${s.day - e.lastSeen}d ago` : 'today') : 'never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sel && <EndpointDetail ep={sel} s={s} dispatch={dispatch} />}
      <Card title="Discovery tuning (Admin / Maintainer)" icon={Workflow}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="text-xs">
            <div className="font-semibold text-slate-200">Dynamic Path Templates</div>
            <p className="mt-1 text-[11px] text-slate-400">Order IDs like ORD-88121 are not grouped automatically. A template overrides grouping. Segment types: Static, *, {'{int}'}, text-only, {'{int:split}'}.</p>
            <div className="mt-2 flex items-center gap-2"><code className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300">/api/v1/orders/*</code>
              <Btn variant="cyan" disabled={s.template} onClick={() => dispatch({ type: 'TEMPLATE' })}>{s.template ? 'Template active' : 'Add template'}</Btn></div>
          </div>
          <div className="text-xs">
            <div className="font-semibold text-slate-200">API Discovery Rules (top-down, first match wins)</div>
            <p className="mt-1 text-[11px] text-slate-400">Load-balancer health checks are not APIs. Mark them NON-API so they leave the inventory and risk views.</p>
            <div className="mt-2 flex items-center gap-2"><code className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300">#1 path = /health → NON-API</code>
              <Btn variant="cyan" disabled={s.rule} onClick={() => dispatch({ type: 'RULE' })}>{s.rule ? 'Rule active' : 'Add rule'}</Btn></div>
          </div>
        </div>
      </Card>
    </>
  );
}

function EndpointDetail({ ep, s, dispatch }) {
  return (
    <div className="animate-fade-in my-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Eye size={14} className="text-cyan-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">View selected API</span>
        <span className="font-mono text-xs text-white">{ep.key}</span>
        <RiskPill risk={ep.risk} />
        <Pill color={STATUS_COLOR[ep.status]}>{ep.status}</Pill>
        <button className="ml-auto text-slate-500 hover:text-white" onClick={() => dispatch({ type: 'SET', patch: { selected: null } })}><X size={14} /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Risk factors (weights simulated)</div>
          <ul className="mt-1 space-y-1">
            {ep.risk.factors.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-xs">
                <div className="h-1.5 rounded bg-slate-800" style={{ width: 60 }}><div className="h-full rounded" style={{ width: `${Math.min(100, f.pts * 4)}%`, background: f.kind === 'data' ? C.rose : f.kind === 'behavioral' ? C.violet : f.kind === 'base' ? C.slate : C.amber }} /></div>
                <span className="w-8 font-mono text-slate-400">+{f.pts}</span><span className="text-slate-200">{f.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-slate-500">Bands: Low 0–39 · Medium 40–69 · High 70–100. The factors are from the docs; F5 does not publish weights.</p>
        </div>
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-[110px_1fr] gap-y-1">
            <span className="text-slate-500">Full path</span><span className="font-mono text-slate-200">{ep.host}{ep.path}</span>
            <span className="text-slate-500">Method</span><span className="font-mono text-slate-200">{ep.method}</span>
            <span className="text-slate-500">Authentication</span><span className={ep.auth ? 'text-cyan-300' : 'text-rose-300'}>{ep.auth ? 'present' : 'none observed'}</span>
            <span className="text-slate-500">Sensitive data</span><span className="text-slate-200">{ep.sens.length ? `${ep.sens.join(', ')} (${ep.reqSensOnly ? 'request' : 'response'})` : 'none'}</span>
            <span className="text-slate-500">Observed samples</span><span className="font-mono text-[11px] text-slate-300">{ep.samples.length ? ep.samples.join('  ') : 'none (declared in schema)'}</span>
            <span className="text-slate-500">Response codes</span><span className="font-mono text-slate-200">{Object.entries(ep.codes).map(([c, n]) => `${c}×${n}`).join('  ') || '—'}</span>
            <span className="text-slate-500">In schema</span><span className="text-slate-200">{s.schema ? (ep.inSchema ? 'yes' : 'no') : 'no schema uploaded'}</span>
            <span className="text-slate-500">Last updated</span><span className="text-slate-200">{ep.hits ? `day ${ep.lastSeen} (${s.day - ep.lastSeen} days ago)` : 'never'}</span>
          </div>
          {ep.status === 'zombie' && (
            <div className="rounded-md border border-violet-500/40 bg-violet-500/10 p-2 text-[11px] text-violet-100">
              No traffic for {s.day - ep.lastSeen} days. Agree a retire decision with the API owner.
              <div className="mt-1.5"><Btn variant="cyan" disabled={ep.retire} onClick={() => dispatch({ type: 'RETIRE', key: ep.key })}>{ep.retire ? 'Retire decision recorded' : 'Record retire decision'}</Btn></div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {!ep.inventory
              ? <Btn variant="cyan" onClick={() => dispatch({ type: 'MOVE_INV', keys: [ep.key] })}><ArrowUpCircle size={12} /> Move to Inventory</Btn>
              : <Btn onClick={() => dispatch({ type: 'REMOVE_INV', keys: [ep.key] })}>Remove from Inventory</Btn>}
            {!ep.blocked
              ? <Btn variant="primary" onClick={() => dispatch({ type: 'ASK_BLOCK', keys: [ep.key] })}><Swords size={12} /> Action → Block</Btn>
              : <Btn onClick={() => dispatch({ type: 'UNBLOCK', key: ep.key })}><Unlock size={12} /> Unblock</Btn>}
            <Btn variant="ghost" onClick={() => dispatch({ type: 'DELETE', key: ep.key })}>Delete</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchemaTab({ s, dispatch }) {
  const eps = Object.values(s.endpoints);
  const [fmt, setFmt] = useState('JSON');
  return (
    <>
      <Card title="Upload Schema (per domain)" icon={Upload} right={s.schema && <Pill color={C.violet}>acme-bank-api-v1.yaml</Pill>}>
        <Code>{`openapi: 3.0.x           # accepted versions are not documented
info: { title: acme-bank-api, version: 1.4.0 }
servers: [{ url: https://${DOMAIN} }]
paths:
  /api/v1/users/{id}:   { get: …, delete: … }
  /api/v1/orders:       { post: … }
  /api/v1/orders/{id}:  { get: … }
  /api/v1/products:     { get: … }
  /api/v1/auth/token:   { post: … }
  /api/v0/legacy-auth:  { post: { deprecated: true } }`}</Code>
        <div className="mt-2 flex gap-2">
          <Btn variant="primary" disabled={s.schema} onClick={() => dispatch({ type: 'UPLOAD_SCHEMA' })}><Upload size={13} /> {s.schema ? 'Baseline set' : 'Upload Schema'}</Btn>
          <Btn variant="cyan" disabled={!s.schema} onClick={() => dispatch({ type: 'REVIEW' })}><GitCompare size={13} /> Review comparison</Btn>
        </div>
      </Card>
      {s.schema && (
        <Card title="Baseline comparison: observed endpoints vs schema" icon={GitCompare}>
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="py-1">Endpoint</th><th>In schema</th><th>Requests</th><th>Status</th></tr></thead>
            <tbody>
              {[...eps].sort((a, b) => Number(a.inSchema) - Number(b.inSchema)).map((e) => (
                <tr key={e.key} className="border-t border-slate-800">
                  <td className="py-1.5 font-mono text-slate-200">{e.key}</td>
                  <td>{e.inSchema && e.key === e.base ? <span className="text-cyan-400">yes</span> : <span className="text-amber-400">no</span>}</td>
                  <td className="font-mono text-slate-400">{e.hits}</td>
                  <td><Pill color={STATUS_COLOR[e.status]}>{e.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-slate-500">This is a baseline comparison, not a diff tool: observed endpoints that are not in the schema stay flagged as shadow. Ungrouped order IDs show up as not-in-schema until you add a Dynamic Path Template.</p>
        </Card>
      )}
      <Card title="Export" icon={Send}>
        <div className="flex flex-wrap items-center gap-2">
          <Sel label="Format" value={fmt} onChange={setFmt} options={['JSON', 'PDF', 'HTML', 'CSV']} />
          <Btn onClick={() => dispatch({ type: 'EXPORT', what: 'inventory', fmt, now: Date.now() })}>Export inventory</Btn>
          <Btn onClick={() => dispatch({ type: 'EXPORT', what: 'schema', fmt, now: Date.now() })}>Export traffic-derived schema</Btn>
          <Btn variant="ghost" onClick={() => dispatch({ type: 'EXPORT', what: 'all', fmt, now: Date.now() })}>Export All (dashboard)</Btn>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">A schema export includes only endpoints that were moved to Inventory.</p>
      </Card>
    </>
  );
}

function EnforceTab({ s, dispatch }) {
  const eps = Object.values(s.endpoints).filter((e) => e.status === 'shadow' || e.status === 'zombie' || e.blocked);
  return (
    <>
      <Card title="Prerequisites" icon={ShieldAlert}>
        <ul className="space-y-1.5 text-xs">
          <Check ok>BIG-IP Advanced WAF/ASM 15.1+ on the API virtual server</Check>
          <Check ok={s.bigip.added}>Device status: Discovered</Check>
          <Check ok={s.bigip.mgmtOk}>Device status: Management Connectivity (iControl REST, TCP 443)</Check>
        </ul>
        <div className="mt-2"><Btn variant="cyan" onClick={() => dispatch({ type: 'MGMT_TEST' })}><Network size={13} /> Test Management Connectivity</Btn></div>
        {s.schemeFailed && !s.scheme && (
          <div className="animate-fade-in mt-3 rounded-md border border-rose-500/50 bg-rose-500/10 p-2 text-[11px] text-rose-100">
            <div className="flex items-center gap-1.5 font-semibold"><AlertTriangle size={13} /> Known issue hit</div>
            A block creates two policy entries, one for HTTP and one for HTTPS. This WAF policy does not differentiate schemes, so the change failed.
            <div className="mt-2"><Btn variant="cyan" onClick={() => dispatch({ type: 'SCHEME' })}>Switch to a Fundamental-template policy (differentiates HTTP/HTTPS)</Btn></div>
          </div>
        )}
        {s.scheme && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-300"><CheckCircle2 size={13} /> WAF policy differentiates HTTP and HTTPS.</p>}
      </Card>
      <Card title="Shadow, zombie & blocked endpoints" icon={Swords}>
        {eps.length === 0 && <p className="text-xs text-slate-500">Nothing to act on yet. Discover shadow or zombie endpoints first.</p>}
        <ul className="space-y-2">
          {eps.map((e) => (
            <li key={e.key} className="flex flex-wrap items-center gap-2 rounded-md border border-slate-800 bg-slate-950/60 p-2 text-xs">
              <span className="font-mono text-slate-200">{e.key}</span>
              <Pill color={STATUS_COLOR[e.status]}>{e.status}</Pill>
              <RiskPill risk={e.risk} />
              <div className="ml-auto">
                {e.blocked ? <Pill color={C.crimson}>blocked by BIG-IP</Pill>
                  : <Btn variant="primary" disabled={!!s.pushing} onClick={() => dispatch({ type: 'ASK_BLOCK', keys: [e.key] })}><Swords size={12} /> Block (push to BIG-IP WAF policy)</Btn>}
              </div>
            </li>
          ))}
        </ul>
        {s.pushing && <div className="mt-2 flex items-center gap-2 text-[11px] text-rose-300"><Send size={12} className="animate-pulse" /> Management Connector → iControl REST {BIGIP_MGMT}:443…</div>}
        <p className="mt-2 text-[11px] text-slate-500">APIsec LE never blocks traffic itself. It updates the WAF policy and BIG-IP enforces. Exactly which policy objects a block creates, beyond the HTTP and HTTPS entries, is not documented.</p>
      </Card>
    </>
  );
}

function LogPane({ logs }) {
  const color = { info: 'text-slate-400', ok: 'text-cyan-300', warn: 'text-amber-300', block: 'text-rose-400' };
  const ref = React.useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs.length]);
  return (
    <div className="border-t border-slate-800 bg-black/40">
      <div className="flex items-center gap-2 px-3 pt-1.5 text-[10px] uppercase tracking-widest text-slate-500"><Terminal size={11} /> event log</div>
      <div ref={ref} className="h-28 overflow-y-auto px-3 pb-2 font-mono text-[10.5px] leading-relaxed">
        {logs.length === 0 && <div className="text-slate-600">Waiting for activity…</div>}
        {logs.map((l) => <div key={l.id} className={color[l.level]}><span className="text-slate-600">[{l.t}]</span> {l.text}</div>)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lab Guide panel + Component Guide view                              */
/* ------------------------------------------------------------------ */
const TAB_LABEL = Object.fromEntries(TABS.map((t) => [t.id, t.label]));

function GuideStep({ n, step, s, dispatch, current }) {
  const ok = step.done(s);
  const [open, setOpen] = useState(false);
  const show = current || open;
  return (
    <li className={`rounded-lg border p-2.5 transition ${current ? 'border-cyan-500/70 bg-cyan-500/5' : ok ? 'border-slate-800 bg-slate-900/30' : 'border-slate-800 bg-slate-900/60'}`}>
      <button className="flex w-full items-start gap-2 text-left" onClick={() => setOpen(!open)}>
        {ok ? <CheckCircle2 size={16} className="mt-px shrink-0 text-cyan-400" />
          : <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${current ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>{n}</span>}
        <span className={`flex-1 text-xs font-semibold ${ok ? 'text-slate-500' : 'text-slate-100'}`}>{step.title}</span>
        {current && <Pill color={C.cyan}>you are here</Pill>}
        {!current && <ChevronRight size={13} className={`mt-px shrink-0 text-slate-500 transition ${open ? 'rotate-90' : ''}`} />}
      </button>
      {show && (
        <div className="animate-fade-in mt-2 space-y-2 pl-6 text-[11.5px] leading-relaxed">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Where</span>
            <span className="text-slate-300">{step.canvas ? 'Flow canvas' : `Console → ${TAB_LABEL[step.tab]}`}</span>
            <Btn variant="cyan" className="ml-auto !px-2 !py-0.5" onClick={() => dispatch({ type: 'GOTO', tab: step.tab, canvas: step.canvas })}><MousePointerClick size={12} /> Take me there</Btn>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Do</div>
            <ol className="mt-0.5 list-decimal space-y-0.5 pl-4 text-slate-200">{step.do.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">You should see</div>
            <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-slate-300">{step.expect.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <p className="rounded-md border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400"><span className="font-semibold text-amber-300">Why it matters: </span>{step.why}</p>
        </div>
      )}
    </li>
  );
}

function GuideSteps({ steps, s, dispatch }) {
  const cur = steps.findIndex((st) => !st.done(s));
  return <ol className="space-y-2">{steps.map((st, i) => <GuideStep key={st.title} n={i + 1} step={st} s={s} dispatch={dispatch} current={i === cur} />)}</ol>;
}

function LabGuide({ s, dispatch }) {
  const t = s.guideTab;
  const tabs = [['start', 'Start'], [1, 'M1'], [2, 'M2'], [3, 'M3'], ['bonus', 'Bonus'], ['help', 'Fixes']];
  const close = () => dispatch({ type: 'SET', patch: { guide: false } });
  return (
    <aside className="animate-slide-in fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-700 bg-[#0b1120] shadow-2xl xl:sticky xl:inset-auto xl:top-[76px] xl:z-auto xl:h-[calc(100vh-92px)] xl:w-auto xl:max-w-none xl:rounded-xl xl:border xl:border-slate-800 xl:shadow-none xl:animate-none">
      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2.5">
        <Compass size={16} className="text-cyan-400" />
        <div className="flex-1">
          <div className="text-sm font-bold text-white">Lab Guide</div>
          <div className="text-[10px] text-slate-500">Step-by-step walkthroughs · free, no XP cost</div>
        </div>
        <button onClick={close} className="text-slate-400 hover:text-white" title="Hide the Lab Guide"><PanelRightClose size={17} /></button>
      </div>
      <div className="flex gap-1 border-b border-slate-800 px-2 py-1.5">
        {tabs.map(([id, label]) => {
          const done = typeof id === 'number' && s.missionsDone[id];
          return (
            <button key={id} onClick={() => dispatch({ type: 'SET', patch: typeof id === 'number' ? { guideTab: id, mission: id } : { guideTab: id } })}
              className={`flex-1 rounded-md px-1.5 py-1 text-[11px] font-semibold transition ${t === id ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>{done ? '✓ ' : ''}{label}</button>
          );
        })}
      </div>
      <div key={String(t)} className="animate-fade-in flex-1 overflow-y-auto p-3">
        {t === 'start' && <GuideStart s={s} dispatch={dispatch} />}
        {typeof t === 'number' && (() => {
          const g = LAB_GUIDE[t];
          const m = MISSIONS[t - 1];
          const n = g.steps.filter((st) => st.done(s)).length;
          return (
            <>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Mission {m.id}</div>
              <div className="text-sm font-semibold text-white">{m.title}</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-300"><span className="font-semibold text-cyan-300">Goal: </span>{g.goal}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400"><span className="font-semibold text-slate-300">Before you start: </span>{g.before}</p>
              <div className="my-2 flex items-center gap-2 text-[10px] text-slate-500">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-500 transition-all" style={{ width: `${(n / g.steps.length) * 100}%` }} /></div>
                {n}/{g.steps.length} steps
              </div>
              <GuideSteps steps={g.steps} s={s} dispatch={dispatch} />
              <div className={`mt-3 flex items-start gap-2 rounded-md border p-2 text-[11px] ${s.missionsDone[t] ? 'border-amber-500/50 bg-amber-500/10 text-amber-100' : 'border-slate-800 text-slate-400'}`}>
                <Flag size={13} className="mt-px shrink-0" /><span>{g.result}</span>
              </div>
            </>
          );
        })()}
        {t === 'bonus' && (
          <>
            <p className="mb-2 text-[11.5px] text-slate-400">Optional labs that deepen Modules 2 and 4. Each is worth 20 XP and can be done any time after Mission 1.</p>
            <GuideSteps steps={BONUS_GUIDE} s={s} dispatch={dispatch} />
          </>
        )}
        {t === 'help' && (
          <>
            <p className="mb-2 flex items-center gap-1.5 text-[11.5px] text-slate-400"><Wrench size={13} /> Stuck? Common causes and fixes.</p>
            <ul className="space-y-2">
              {TROUBLESHOOT.map(([q, a]) => (
                <li key={q} className="rounded-md border border-slate-800 bg-slate-900/60 p-2 text-[11.5px]">
                  <div className="font-semibold text-slate-100">{q}</div>
                  <div className="mt-0.5 text-slate-400">{a}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}

function GuideStart({ s, dispatch }) {
  const tour = [
    ['Top bar (HUD)', 'Rank, XP, mastery and badges. Lab Guide toggles this panel; Field Guide holds reference pages that cost XP; Reset Simulation starts over.'],
    ['Left: Skill Tree & Missions', 'Pick a module (each Boss Quiz unlocks the next) and a mission. The objectives tick themselves as you work.'],
    ['Centre: Workbench', 'The flow canvas (click any box to inspect it) and the Console Lab, which simulates the APIsec LE Web UI. Switch between Split, Architecture Flow, Console Lab and Component Guide.'],
    ['Event log', 'At the bottom of the console. Read it after every click: it says what happened and what to do next.'],
  ];
  const plan = [
    ['Mission 1', 'Module 1', 'Deploy, integrate BIG-IP, discover endpoints'],
    ['Mission 2', 'Modules 2–3', 'Shadow API, PII, schema, inventory, zombie'],
    ['Mission 3', 'Module 4', 'Block through the WAF policy, verify, export'],
  ];
  return (
    <div className="space-y-3 text-[11.5px] leading-relaxed">
      <p className="text-slate-300">You play a SecOps engineer at a bank. BIG-IP already fronts the API. Your job: stand up F5 API Security Local Edition on a local, air-gapped host, find what the API really exposes, and have BIG-IP block what should not be there.</p>
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">The screen</div>
        <ul className="space-y-1.5">{tour.map(([k, v]) => <li key={k}><span className="font-semibold text-slate-100">{k}. </span><span className="text-slate-400">{v}</span></li>)}</ul>
      </div>
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Recommended order</div>
        <table className="w-full">
          <tbody>{plan.map(([m, mod, d]) => <tr key={m} className="border-t border-slate-800 align-top"><td className="py-1 pr-2 font-semibold text-cyan-300">{m}</td><td className="py-1 pr-2 text-slate-400">{mod}</td><td className="py-1 text-slate-300">{d}</td></tr>)}</tbody>
        </table>
        <p className="mt-1 text-slate-500">Each mission builds on the state left by the previous one, so play them in order. Take a module's Boss Quiz once you have done its mission.</p>
      </div>
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Packet colours</div>
        <div className="flex flex-wrap gap-2 text-[10.5px] text-slate-400">
          {[[C.cyan, 'clean traffic / telemetry'], [C.amber, 'shadow API'], [C.violet, 'legacy / zombie'], [C.rose, 'PII leak'], [C.crimson, 'blocked / enforcement']].map(([c, x]) => <span key={x} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{x}</span>)}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" onClick={() => dispatch({ type: 'SET', patch: { guideTab: 1, mission: 1 } })}><Play size={12} /> Start Mission 1</Btn>
        <Btn onClick={() => dispatch({ type: 'VIEW', view: 'components' })}><Route size={12} /> What does each component do?</Btn>
      </div>
      <p className="flex items-start gap-1.5 text-[10.5px] text-slate-500"><Info size={12} className="mt-0.5 shrink-0" /> Product behaviour follows the F5 API Security Local Edition 1.2.6 docs. Hostnames, IPs, endpoint names, timings and risk weights are simulated.</p>
    </div>
  );
}

function ComponentGuide({ s, dispatch }) {
  const show = (node) => { dispatch({ type: 'VIEW', view: 'split' }); dispatch({ type: 'INSPECT', id: node }); };
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400"><Route size={13} /> Follow one request end to end</div>
        <ol className="grid gap-2 md:grid-cols-2">
          {JOURNEY.map(([id, text], i) => (
            <li key={id} className="flex gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-xs leading-relaxed">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e4002b]/20 text-[10px] font-bold text-[#ff4d6d]">{i + 1}</span>
              <span className="text-slate-300"><button className="font-semibold text-cyan-300 hover:underline" onClick={() => show(COMPONENTS[id].node)}>{COMPONENTS[id].name}.</button> {text}</span>
            </li>
          ))}
        </ol>
      </section>
      {COMPONENT_GROUPS.map((g) => (
        <section key={g.title}>
          <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: g.color }}><span className="h-2 w-2 rounded-full" style={{ background: g.color }} />{g.title}</h3>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {g.ids.map((id) => {
              const c = COMPONENTS[id];
              const info = NODE_INFO[id === 'irule' ? 'vs' : id === 'deploy' ? null : id];
              const seen = s.inspected[id === 'irule' ? 'vs' : id];
              return (
                <article key={id} className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="mb-1 flex items-start gap-2">
                    <div className="flex-1 text-sm font-semibold text-white">{c.name}</div>
                    {seen && <Pill color={C.cyan}>inspected</Pill>}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">{c.plain}</p>
                  <div className="mt-2 grid grid-cols-[70px_1fr] gap-y-1 text-[11px]">
                    <span className="text-slate-500">Receives</span><span className="text-slate-300">{c.gets}</span>
                    <span className="text-slate-500">Sends</span><span className="text-slate-300">{c.sends}</span>
                    {info && <><span className="text-slate-500">Ports</span><span className="font-mono text-[10.5px] text-cyan-300">{info.ports.map(([p]) => p).join(' · ')}</span></>}
                  </div>
                  <p className="mt-2 rounded-md border border-slate-800 bg-slate-950/60 p-1.5 text-[11px] text-slate-400"><span className="font-semibold text-amber-300">In the lab: </span>{c.lab}</p>
                  <div className="mt-auto pt-2"><Btn variant="ghost" className="!px-0" onClick={() => show(c.node)}><Eye size={12} /> Show on canvas</Btn></div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overlays: block confirm, field guide, boss quiz, toasts             */
/* ------------------------------------------------------------------ */
function BlockConfirm({ s, dispatch }) {
  const keys = s.confirm;
  const go = () => {
    const willPush = s.bigip.added && s.scheme;
    dispatch({ type: 'BLOCK_START', now: Date.now() });
    if (willPush) setTimeout(() => dispatch({ type: 'BLOCK_DONE' }), 1900);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="animate-fade-in w-full max-w-md rounded-xl border border-slate-700 bg-[#0b1120] p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><ShieldAlert size={16} className="text-[#e4002b]" /> Confirm: Block {keys.length > 1 ? `${keys.length} endpoints` : 'endpoint'}</div>
        <table className="w-full text-xs">
          <tbody className="[&_td]:py-1 [&_td]:align-top">
            <tr><td className="w-28 text-slate-500">Endpoint(s)</td><td className="font-mono text-slate-200">{keys.map((k) => <div key={k}>{k}</div>)}</td></tr>
            <tr><td className="text-slate-500">BIG-IP</td><td className="font-mono text-slate-200">bigip-edge-01 ({BIGIP_MGMT})</td></tr>
            <tr><td className="text-slate-500">Virtual server</td><td className="font-mono text-slate-200">vs_api_https</td></tr>
            <tr><td className="text-slate-500">How</td><td className="text-slate-200">Management Connector → iControl REST (TCP 443) → WAF policy update (HTTP and HTTPS entries)</td></tr>
          </tbody>
        </table>
        <div className="mt-3 flex justify-end gap-2">
          <Btn onClick={() => dispatch({ type: 'CANCEL_BLOCK' })}>Cancel</Btn>
          <Btn variant="primary" onClick={go}><Swords size={13} /> Block</Btn>
        </div>
      </div>
    </div>
  );
}

function FieldGuide({ s, dispatch }) {
  const mission = MISSIONS[s.mission - 1];
  const nextObj = mission.objectives.find((o) => !s.objectives[o.id]);
  const hintId = nextObj ? `obj:${nextObj.id}` : null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={() => dispatch({ type: 'SET', patch: { drawer: false } })}>
      <div className="animate-slide-in h-full w-full max-w-md overflow-y-auto border-l border-slate-700 bg-[#0b1120] p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-amber-400" />
          <h3 className="text-sm font-bold text-white">Hint / Field Guide</h3>
          <button className="ml-auto text-slate-400 hover:text-white" onClick={() => dispatch({ type: 'SET', patch: { drawer: false } })}><X size={18} /></button>
        </div>
        <p className="mb-3 text-[11px] text-slate-400">Each page costs XP the first time you open it. Content follows the F5 API Security Local Edition 1.2.6 docs; anything not in the docs is labeled.</p>
        {nextObj && (
          <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <div className="text-[10px] uppercase tracking-wider text-amber-300">Next objective · Mission {mission.id}</div>
            <div className="text-xs text-white">{nextObj.label}</div>
            {s.hints[hintId] ? <p className="mt-1 text-xs text-amber-100">{nextObj.hint}</p>
              : <Btn className="mt-2" onClick={() => dispatch({ type: 'HINT', id: hintId, cost: 15 })}><Lightbulb size={12} /> Reveal hint (−15 XP)</Btn>}
          </div>
        )}
        <div className="space-y-2">
          {FIELD_GUIDE.map((g) => {
            const I = g.icon;
            const open = s.hints[g.id];
            return (
              <div key={g.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center gap-2">
                  <I size={14} className="text-cyan-400" />
                  <div className="flex-1 text-xs font-semibold text-white">{g.title}</div>
                  {!open && <Btn onClick={() => dispatch({ type: 'HINT', id: g.id, cost: g.cost })}>Open (−{g.cost} XP)</Btn>}
                </div>
                {open && (
                  <div className="animate-fade-in">
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-[11.5px] leading-relaxed text-slate-300">{g.body.map((b) => <li key={b}>{b}</li>)}</ul>
                    <a className="mt-2 block font-mono text-[10px] text-cyan-400 hover:underline" href={DOCS} target="_blank" rel="noreferrer">Source: {g.src}</a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BossQuiz({ module, s, dispatch }) {
  const qs = QUIZZES[module];
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = qs[i];
  const choose = (k) => { if (pick !== null) return; setPick(k); if (k === q.c) setScore((x) => x + 1); };
  const next = () => {
    if (i + 1 < qs.length) { setI(i + 1); setPick(null); return; }
    setDone(true);
    dispatch({ type: 'QUIZ_DONE', module, score });
  };
  const close = () => dispatch({ type: 'SET', patch: { quiz: null } });
  const passed = score >= passMark(qs.length);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="animate-fade-in w-full max-w-lg rounded-2xl border border-[#e4002b]/60 bg-[#0b1120] p-5 shadow-[0_0_40px_#e4002b44]">
        <div className="mb-3 flex items-center gap-2">
          <Skull size={18} className="text-[#e4002b]" />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Boss Quiz · Module {module}</div>
            <div className="text-sm font-bold text-white">{MODULES[module - 1].title}</div>
          </div>
          <button className="text-slate-400 hover:text-white" onClick={close}><X size={18} /></button>
        </div>
        {!done ? (
          <div key={i} className="animate-fade-in">
            <div className="mb-2 flex gap-1">{qs.map((_, k) => <div key={k} className={`h-1 flex-1 rounded ${k < i ? 'bg-cyan-500' : k === i ? 'bg-[#e4002b]' : 'bg-slate-800'}`} />)}</div>
            <p className="mb-3 text-sm text-slate-100">{q.q}</p>
            <div className="space-y-2">
              {q.a.map((opt, k) => {
                const state = pick === null ? '' : k === q.c ? 'border-cyan-500 bg-cyan-500/10' : k === pick ? 'border-rose-500 bg-rose-500/10' : 'opacity-50';
                return <button key={opt} onClick={() => choose(k)} className={`w-full rounded-lg border border-slate-700 p-2.5 text-left text-xs text-slate-200 transition hover:border-slate-500 ${state}`}>{opt}</button>;
              })}
            </div>
            {pick !== null && (
              <div className="animate-fade-in mt-3 rounded-md border border-slate-700 bg-slate-900 p-2 text-[11.5px] text-slate-300">
                <span className={pick === q.c ? 'text-cyan-300' : 'text-rose-300'}>{pick === q.c ? 'Correct. ' : 'Not quite. '}</span>{q.why}
              </div>
            )}
            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>Score {score}/{qs.length}</span>
              <Btn variant="primary" disabled={pick === null} onClick={next}>{i + 1 < qs.length ? 'Next' : 'Finish'} <ChevronRight size={13} /></Btn>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in text-center">
            {passed ? <Trophy size={40} className="mx-auto text-amber-400" /> : <ShieldAlert size={40} className="mx-auto text-rose-400" />}
            <div className="mt-2 text-lg font-bold text-white">{score}/{qs.length} · {passed ? 'Boss defeated!' : 'The boss survives'}</div>
            <p className="mt-1 text-xs text-slate-400">{passed ? (s.quizzes[module]?.passed ? 'Module mastered. Next module unlocked.' : '') : `You need ${passMark(qs.length)} of ${qs.length}. Review the lesson and Field Guide, then try again.`}</p>
            <div className="mt-4 flex justify-center gap-2">
              {!passed && <Btn onClick={() => { setI(0); setPick(null); setScore(0); setDone(false); }}><RotateCcw size={13} /> Retry</Btn>}
              <Btn variant="primary" onClick={close}>Close</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toasts({ toasts, dispatch }) {
  useEffect(() => {
    if (!toasts.length) return undefined;
    const t = setTimeout(() => dispatch({ type: 'DISMISS', id: toasts[0].id }), 2800);
    return () => clearTimeout(t);
  }, [toasts, dispatch]);
  const style = { xp: 'border-cyan-500/50 text-cyan-200', warn: 'border-amber-500/50 text-amber-200', badge: 'border-[#e4002b]/60 text-white', rank: 'border-amber-400/70 text-amber-200' };
  const icon = { xp: Zap, warn: AlertTriangle, badge: Award, rank: Crown };
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const I = icon[t.kind];
        return <div key={t.id} className={`animate-fade-in flex items-center gap-2 rounded-lg border bg-[#0b1120]/95 px-3 py-2 text-xs shadow-xl ${style[t.kind]}`}><I size={14} /> {t.text}</div>;
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */
export default function APIsecSimulator() {
  const [s, dispatch] = useReducer(reducer, undefined, initialState);
  const mod = MODULES[s.module - 1];

  useEffect(() => {
    if (!s.packets.length) return undefined;
    const t = setInterval(() => dispatch({ type: 'PRUNE', now: Date.now() }), 800);
    return () => clearInterval(t);
  }, [s.packets.length]);

  const views = useMemo(() => [
    { id: 'split', label: 'Split Workbench', icon: Columns2 },
    { id: 'flow', label: 'Architecture Flow', icon: Workflow },
    { id: 'console', label: 'Console Lab', icon: Terminal },
    { id: 'components', label: 'Component Guide', icon: Route },
  ], []);

  const flowPanel = (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400"><Workflow size={13} /> Interactive architecture & data flow</div>
      <FlowCanvas s={s} dispatch={dispatch} compact={s.view === 'split'} />
    </div>
  );
  const consolePanel = (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50" style={{ minHeight: 560 }}>
      <ConsoleLab s={s} dispatch={dispatch} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <HUD s={s} dispatch={dispatch} />
      <main className={`mx-auto grid gap-4 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] ${s.guide ? 'max-w-[1960px] xl:grid-cols-[260px_minmax(0,1fr)_380px]' : 'max-w-[1600px]'}`}>
        <Sidebar s={s} dispatch={dispatch} />
        <div className="min-w-0 space-y-4">
          <section key={mod.id} className="animate-fade-in rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-[#0b1120] p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e4002b]/15"><mod.icon size={20} className="text-[#e4002b]" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Module {mod.id} of 4</div>
                <h2 className="text-lg font-bold text-white">{mod.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-lg border border-slate-700 p-0.5">
                  {views.map((v) => (
                    <button key={v.id} title={v.label} onClick={() => dispatch({ type: 'VIEW', view: v.id })}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition ${s.view === v.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                      <v.icon size={13} /> <span className={s.guide ? 'hidden 2xl:inline' : 'hidden sm:inline'}>{v.label}</span>
                    </button>
                  ))}
                </div>
                <Btn variant="primary" onClick={() => dispatch({ type: 'SET', patch: { quiz: mod.id } })}><Skull size={13} /> Boss Quiz {s.quizzes[mod.id]?.passed ? '✓' : ''}</Btn>
              </div>
            </div>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {mod.lessons.map((l) => <li key={l} className="flex gap-2 text-xs leading-relaxed text-slate-300"><ChevronRight size={14} className="mt-0.5 shrink-0 text-cyan-400" />{l}</li>)}
            </ul>
          </section>

          <div key={s.view} className="animate-fade-in">
            {s.view === 'split' && <div className="grid gap-4 min-[1900px]:grid-cols-[1.2fr_1fr]">{flowPanel}{consolePanel}</div>}
            {s.view === 'flow' && flowPanel}
            {s.view === 'console' && consolePanel}
            {s.view === 'components' && <ComponentGuide s={s} dispatch={dispatch} />}
          </div>

          <footer className="pb-6 text-[10.5px] leading-relaxed text-slate-500">
            Training simulator, not an F5 product. Product behaviour follows the F5 API Security Local Edition 1.2.6 documentation
            (<a className="text-cyan-500 hover:underline" href={DOCS} target="_blank" rel="noreferrer">clouddocs.f5.com</a>). Hostnames, IPs, endpoint names, timings and
            risk-factor weights are simulated. F5 does not publish sizing figures, risk weights or the iRule body in its docs.
          </footer>
        </div>
        {s.guide && <LabGuide s={s} dispatch={dispatch} />}
      </main>

      {s.drawer && <FieldGuide s={s} dispatch={dispatch} />}
      {s.quiz && <BossQuiz module={s.quiz} s={s} dispatch={dispatch} />}
      {s.confirm && <BlockConfirm s={s} dispatch={dispatch} />}
      <Toasts toasts={s.toasts} dispatch={dispatch} />
    </div>
  );
}
