# APIsec LE Academy: lab guide and component reference

This is the written version of the in-app **Lab Guide** panel and **Component Guide** view. In the app, open the Lab Guide from the top bar (or **Step-by-step walkthrough** under a mission). Steps tick off by themselves as you work, and **Take me there** opens the right console tab.

Product behaviour follows the F5 API Security Local Edition 1.2.6 docs. Hostnames, IPs, endpoint names, timings and risk weights are simulated.

## How to run a lab

1. `npm install && npm run dev`, then open http://localhost:5280.
2. Play the missions in order. Each one builds on the state the previous one left behind.
3. After each mission, take the matching module's **Boss Quiz** (75% to pass) to unlock the next module.
4. Read the **event log** under the console after every click: it says what happened and what to do next.
5. **Reset Simulation** starts everything over.

| Mission | Modules | What you do |
|---|---|---|
| 1 Zero-Latency Air-Gapped Onboarding | 1 | Deploy, integrate BIG-IP, discover endpoints |
| 2 Hunting the Shadow PII Leak | 2–3 | Shadow API, PII, schema, inventory, zombie |
| 3 Closing the Loop with BIG-IP AWAF Enforcement | 4 | Block through the WAF policy, verify, export |

Packet colours on the canvas: cyan = clean traffic/telemetry, amber = shadow API, violet = legacy/zombie, rose = PII leak, crimson = blocked/enforcement.

## Mission 1: Zero-Latency Air-Gapped Onboarding

**Goal:** install APIsec LE on a local, air-gapped host, connect BIG-IP so it streams request metadata out-of-band, and discover the first endpoints.

| # | Where | Do | You should see |
|---|---|---|---|
| 1 | Console → Deploy & Sign-in | Pick Docker Compose or Kubernetes (Helm), click **Deploy locally** | Install commands in the log, then "APIsec LE running with no outbound internet"; the cyan APIsec LE zone lights up |
| 2 | Deploy & Sign-in → First sign-in | **Sign in** (admin/admin), then **Change password** | Both lines tick; tip to create a Recovery Key |
| 3 | Deploy & Sign-in → Decoupled licensing | Optionally click the three **Do it** steps; answer the licensing check | Correct answer: "The licensing report exchange". A wrong answer costs 5 XP |
| 4 | Flow canvas | Click API Virtual Server, Int. Logging Pool, Int. Logging VS, Ext. Collector Pool, Collector | A cyan dot on each node, +5 XP each the first time |
| 5 | Console → BIG-IP Integration | **Add BIG-IP** → **Connect → Collector :6514 → Apply device settings** → VS mode **API Security** | Discovered ✓ and Management Connectivity ✓; logging nodes light up; VS shows "API SEC"; the 6514 line turns cyan |
| 6 | Console → Traffic Replay | **Normal users** | Packets go to the backends while small ones branch down the 6514 line; Collector shows "9 QUEUED"; inline latency stays 0 ms |
| 7 | Traffic Replay | **Analyze Now** | New endpoints in the log and in API Inventory |

**Why:** discovery is out-of-band. BIG-IP serves each request normally and streams a description of it on the side, so no proxy and no latency are added. Only the license report exchange needs internet, through an operator workstation.

## Mission 2: Hunting the Shadow PII Leak

**Goal:** find the undocumented endpoint that leaks SSNs, prove it is not in the OpenAPI schema, approve legitimate APIs, and catch the zombie.
**Before you start:** Mission 1 done. The zombie step needs legacy-auth to have been seen in normal traffic first.

| # | Where | Do | You should see |
|---|---|---|---|
| 1 | Traffic Replay | **Shadow debug calls** (optionally **PII-leaking responses**) | Amber packets; unauthenticated GET /api/v1/debug/users in the log |
| 2 | Traffic Replay | **Analyze Now** | GET /api/v1/debug/users listed as new |
| 3 | API Inventory | Status filter = **shadow** | Every endpoint is shadow for now: nothing is documented or approved yet |
| 4 | API Inventory | Click the GET /api/v1/debug/users row | View selected API: no auth, SSN / Date of Birth / Email in the response, High risk |
| 5 | Schema (OAS) | **Upload Schema** (optionally **Review comparison**) | Log lists what is not in the schema (debug/users, /health); documented endpoints become in-schema |
| 6 | API Inventory | Tick three documented endpoints (e.g. GET users/$DYN$, POST orders, POST auth/token) → **Approve (Move to Inventory)** | Status becomes inventory. Approving debug/users costs 10 XP |
| 7 | Traffic Replay | **Fast-forward 30 days** | Log reports POST /api/v0/legacy-auth as a zombie; Zombie APIs tile = 1 |
| 8 | API Inventory | Click legacy-auth → **Record retire decision** | Decision logged |

**Why:** shadow means undocumented or unmanaged; the schema is the yardstick. A zombie is an endpoint with no traffic for an extended period (the docs give no number; the lab uses 30 days). Triage High first, especially shadow and unauthenticated endpoints with sensitive data.

## Mission 3: Closing the Loop with BIG-IP AWAF Enforcement

**Goal:** have APIsec LE update the BIG-IP WAF policy so BIG-IP blocks the shadow endpoint at the edge, then export evidence.
**Before you start:** Missions 1 and 2 done; GET /api/v1/debug/users still discovered and shadow.

| # | Where | Do | You should see |
|---|---|---|---|
| 1 | Enforcement | **Test Management Connectivity** | Both device statuses tick; BIG-IP Mgmt shows "MGMT ✓" |
| 2 | Enforcement | On the GET /api/v1/debug/users row, **Block (push to BIG-IP WAF policy)** → confirm | Red packet to the WAF, then "Block failed" and a Known issue box. This is deliberate |
| 3 | Enforcement | **Switch to a Fundamental-template policy** | "WAF policy differentiates HTTP and HTTPS" |
| 4 | Enforcement | Block the same row again → confirm | Endpoint shows "blocked by BIG-IP"; WAF node shows BLOCKING. Blocking a valid endpoint costs 10 XP |
| 5 | Traffic Replay | **Shadow debug calls** | Crimson packets stop at the WAF; "403 BLOCKED by BIG-IP WAF policy" |
| 6 | Schema (OAS) → Export | Pick JSON/PDF/HTML/CSV → **Export inventory** or **Export All** | Export confirmed in the log |

**Why:** APIsec LE never blocks traffic itself. The Management Connector updates the WAF policy over iControl REST (TCP 443) and BIG-IP enforces. A block creates HTTP and HTTPS entries and fails if the policy does not differentiate schemes (documented known issue).

## Bonus labs

| Lab | Do | Result |
|---|---|---|
| Dynamic Path Template | After normal traffic, API Inventory → Discovery tuning → **Add template** (/api/v1/orders/*) | Order ID rows merge into GET /api/v1/orders/$DYN$ |
| API Discovery Rule | **Add rule** (path = /health → NON-API) | /health becomes non-api. Rules run top-down, first match wins |
| Schema comparison | Schema (OAS) → **Review comparison** | Observed endpoints with In schema yes/no |

## Troubleshooting

| Symptom | Fix |
|---|---|
| "No metadata reached the Collector" | Deploy, then finish BIG-IP Integration with a VS mode other than None |
| Analyze Now: "no new metadata" | Replay a burst first |
| Every endpoint is shadow | Expected until you Upload Schema or Move to Inventory |
| Approving lost XP | You approved debug/users; block it instead |
| No zombie after fast-forward | Replay Normal users and Analyze Now first, then fast-forward |
| Block failed | Expected first time; apply the Fundamental-template fix |
| debug/users missing from Enforcement | If deleted, replay Shadow debug calls and Analyze Now |
| Next module locked | Pass the Boss Quiz with 75%+ |

## Component reference

### One request, end to end

1. **API Clients** send HTTPS to the BIG-IP API virtual server (TCP 443).
2. The **Advanced WAF policy** checks it; a blocked endpoint gets a 403 at the edge.
3. Allowed requests reach the **backend microservices**.
4. The **iRule** on the VS copies the HTTP metadata to the Internal Logging Pool → Internal Logging VS (adds TLS) → External Collector Pool. The client is not delayed.
5. The **Collector** receives it on TCP 6514 (HSL over TLS).
6. The **Analysis Engine** rebuilds endpoints; **Risk scoring** rates them; results go to the **Data Store**.
7. You review in the **Web UI** (TCP 8000), compare with the **schema baseline**, and approve, retire or block.
8. A Block goes through the **Management Connector** → BIG-IP iControl REST (TCP 443) → WAF policy.

### What each component does

| Component | Where it runs | What it does | Ports |
|---|---|---|---|
| API Clients | Outside | Call the API. Never talk to APIsec LE | TCP 443 to BIG-IP |
| BIG-IP API Virtual Server | BIG-IP | Existing front door; mode None / API Security / Advanced API Security decides whether telemetry is attached | TCP 443 |
| iRule telemetry forwarder | BIG-IP | Copies per-request HTTP metadata to the Internal Logging Pool via HSL; body is in the in-product Integration Guide | — |
| Advanced WAF policy | BIG-IP | The only place traffic is blocked. Needs Advanced WAF/ASM 15.1+ and HTTP/HTTPS differentiation | inline |
| Backend microservices | Your apps | Receive only what BIG-IP allows; untouched by APIsec LE | — |
| Internal Logging Pool | BIG-IP | Named target for the iRule; its member is the Internal Logging VS | internal |
| Internal Logging Virtual Server | BIG-IP | Adds TLS (serverssl) to the metadata stream | TCP 6514 |
| External Collector Pool | BIG-IP | Members are the Collector address(es) | TCP 6514 |
| Collector | APIsec LE | Receives the metadata stream and queues records | TCP 6514 (required) |
| Analysis Engine | APIsec LE | Groups by Host header, rebuilds endpoints, $DYN$ grouping, Discovery Rules, Dynamic Path Templates | internal |
| Risk scoring & sensitive data | APIsec LE | 0–100 score (Low 0–39, Medium 40–69, High 70–100), sensitive-data findings | internal |
| Schema baseline | APIsec LE | Uploaded OpenAPI file per domain; unlisted endpoints stay shadow | via UI |
| Data Store | APIsec LE | Local persistence; source of JSON/PDF/HTML/CSV exports | internal |
| Web UI | APIsec LE | Local console; admin/admin on first login, must be changed; roles Admin/Maintainer/Viewer | TCP 8000 HTTPS |
| Management Connector | APIsec LE | Calls BIG-IP iControl REST to update WAF policy; enforcement only | TCP 443 to BIG-IP mgmt |
| BIG-IP management plane | BIG-IP | Device registration; Discovered and Management Connectivity statuses | TCP 443 |
| License (decoupled) | APIsec LE | JWT → Register Device → report.json → signed_ack.json → Activate; 14-day Evaluation Mode | none outbound |
| Operator workstation | Your PC | Carries license files to and from F5; the only thing that needs internet | TCP 8000, internet |
| Deployment platform | Your host | Docker Engine 20.10+ / Compose 2.0+ (lab, PoC) or Kubernetes 1.26+ / Helm 3.10+ (production, HA); `./install_local.sh --default`. No published sizing figures | — |
