# APIsec LE Academy: F5 API Security Local Edition flow simulator

A gamified, single-page learning simulator for **F5 API Security Local Edition (APIsec LE)**, built for classroom use.

- **Single-file React component:** [`src/APIsecSimulator.jsx`](src/APIsecSimulator.jsx) (`useState` + `useReducer`, Tailwind CSS, Lucide icons).
- **Minimal Vite wrapper** so it runs locally.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/
```

## What's inside

| Area | Details |
|---|---|
| HUD | SecOps rank (Lvl 1 Traffic Observer → Lvl 5 Air-Gapped API Architect), XP bar, mastery %, 4 badges, Field Guide, Reset Simulation |
| Skill tree | 4 modules. Each module's Boss Quiz (75% to pass) unlocks the next one |
| Flow canvas | SVG map of clients → BIG-IP API VS → Advanced WAF → backends, plus the out-of-band telemetry chain (iRule → Internal Logging Pool → Internal Logging VS/serverssl → External Collector Pool → Collector :6514) into the APIsec LE stack. It shows animated packets, clickable inspector cards, and blocked requests turning red at the BIG-IP edge |
| Console lab | Deploy & Sign-in (Compose/Helm, admin/admin change, decoupled licensing), BIG-IP Integration wizard, Traffic Replay + Analyze Now + fast-forward, API Inventory (dashboard tiles, filters, batch Approve/Reject/Block, View selected API, Discovery Rules, Dynamic Path Templates), Schema (OAS) baseline + exports, Enforcement (Management Connectivity, Block via iControl REST, HTTP/HTTPS known issue) |
| Missions | 1 Zero-Latency Air-Gapped Onboarding · 2 Hunting the Shadow PII Leak · 3 Closing the Loop with BIG-IP AWAF Enforcement. Objectives tick off automatically. There are also 3 lab-bonus objectives |
| Field Guide | 9 pages that cost XP to open. Each one cites its doc page |

## Accuracy

Product behaviour follows the **F5 API Security Local Edition 1.2.6** docs on clouddocs.f5.com (`/products/f5-api-security-local-edition/latest/`) and the approved class content outline. The simulator says so in the UI wherever something is **not** documented:

- **Simulated:** hostnames, IPs, endpoint names, timings, the 30-day zombie threshold (the docs say only "an extended period"), and the risk-factor weights (the factors are documented, the weights are not).
- **Not in the docs, so not taught as fact:** sizing figures, the iRule body and exact metadata fields, accepted OpenAPI versions, and SIEM/SOAR export.
