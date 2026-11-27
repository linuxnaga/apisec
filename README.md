# F5 security academies: gamified flow simulators

This repo has two single-page simulators built with the same pattern (React, Tailwind CSS, Lucide icons, `useState` + `useReducer`):

| Page | Simulator | Source |
|---|---|---|
| `/` (`index.html`) | **APIsec LE Academy** for F5 API Security Local Edition | [`src/APIsecSimulator.jsx`](src/APIsecSimulator.jsx) |
| `/ai-security.html` | **AI Security Academy** for F5 AI Security (AI Guardrails, AI Red Team, AI Remediate) | [`src/ai-security/AISecuritySimulator.jsx`](src/ai-security/AISecuritySimulator.jsx) |

Each HUD links to the other simulator.

# APIsec LE Academy: F5 API Security Local Edition flow simulator

A gamified, single-page learning simulator for **F5 API Security Local Edition (APIsec LE)**, built for classroom use.

- **Single-file React component:** [`src/APIsecSimulator.jsx`](src/APIsecSimulator.jsx) (`useState` + `useReducer`, Tailwind CSS, Lucide icons).
- **Minimal Vite wrapper** so it runs locally.

## Run it

The dev server uses port **5280** (not Vite's default 5173) with `strictPort`, so it stops with an error instead of switching ports if 5280 is busy. To use another port: `npm run dev -- --port 6000`.

```bash
npm install
npm run dev      # http://localhost:5280  ·  AI Security: http://localhost:5280/ai-security.html
npm run build    # static build in dist/
npm run preview  # serves dist/ on http://localhost:5281
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
| Lab Guide | Free side panel with step-by-step walkthroughs for each mission and bonus lab: where to go, what to click, what you should see and why it matters. Steps tick off automatically and **Take me there** opens the right tab. Also a getting-started tour and a troubleshooting page |
| Component Guide | A view (next to Split / Flow / Console) that explains every component in plain words: what it receives and sends, its ports, and how to use it in the lab, plus an 8-step "one request end to end" walkthrough. Inspector cards on the canvas show the same summary |

## Lab walkthroughs and component reference

The full step-by-step instructions for all three missions, the bonus labs, troubleshooting, and a table of what each component does are in [`docs/apisec-le-lab-guide.md`](docs/apisec-le-lab-guide.md). In short:

1. **Mission 1:** Deploy & Sign-in → sign in and change password → licensing check → click the five telemetry-chain nodes → BIG-IP Integration wizard (VS mode API Security) → Replay normal traffic → Analyze Now.
2. **Mission 2:** Replay shadow debug calls → Analyze Now → filter shadow → open the High-risk SSN endpoint → Upload Schema → approve 3 documented endpoints → fast-forward 30 days → retire the legacy-auth zombie.
3. **Mission 3:** Test Management Connectivity → Block debug/users (fails: HTTP/HTTPS known issue) → switch to a Fundamental-template policy → Block again → replay the attack and watch it stop at the WAF → export a report.

## Accuracy

Product behaviour follows the **F5 API Security Local Edition 1.2.6** docs on clouddocs.f5.com (`/products/f5-api-security-local-edition/latest/`) and the approved class content outline. The simulator says so in the UI wherever something is **not** documented:

- **Simulated:** hostnames, IPs, endpoint names, timings, the 30-day zombie threshold (the docs say only "an extended period"), and the risk-factor weights (the factors are documented, the weights are not).
- **Not in the docs, so not taught as fact:** sizing figures, the iRule body and exact metadata fields, accepted OpenAPI versions, and SIEM/SOAR export.

# AI Security Academy: F5 AI Security flow simulator

| Area | Details |
|---|---|
| HUD | SecOps rank (Lvl 1 Prompt Observer → Lvl 5 AI Security Architect), XP bar, mastery %, 4 badges (Guarded Gateway, PII & Injection Shield, Red Team Operator, Closed-Loop Remediator), Field Guide, Reset Simulation |
| Skill tree | 1 Platform Architecture, Connections & Projects · 2 AI Guardrails: Runtime Prompt & Response Scanning · 3 Custom Guardrails, Prompt Logs & Agentic Fingerprints · 4 AI Red Team & AI Remediate. Each Boss Quiz (75% to pass) unlocks the next module |
| Flow canvas | Apps & agents → (BIG-IP LTM as the recommended L4 LB, self-hosted only) → AI Guardrails proxy → Request Scan → Connection → model providers, and back through Response Scan. Below it, the platform: Projects & Tokens, Prompt Logs, Dashboard & Audit, Agent Sessions, AI Red Team, Reports, AI Remediate, Deployment. Animated prompts turn red where a guardrail blocks them; clickable inspector cards on every node |
| Console lab | Setup & Connect (SaaS us1/eu1 or self-hosted readiness check, Connections > Models > Test and connect, Guardrails vs Red Team project, token scopes, OpenAI SDK base URL), Prompt Traffic replay, Guardrails (Enable, Scan direction, Block/Audit, Enforce, Comprehensive/Performance, custom GenAI/regex/keyword builder), Prompt Logs & Agents (outcome filters, request vs response scan detail, agentic fingerprints, dashboard), AI Red Team (All Attacks, custom-intent campaign, reports, refusal phrases), AI Remediate (request → Ready → import/deploy in Audit → Block → rerun) |
| Missions | 1 Onboard a Guarded Support Chatbot · 2 Stop the PII & Prompt-Injection Leak · 3 Red Team → Remediate → Re-test, plus 4 lab-bonus objectives |
| Field Guide | 10 pages that cost XP to open, each citing its docs page |
| Lab Guide & Component Guide | Same as APIsec LE: a free Lab Guide panel with step-by-step walkthroughs for Missions 1–3 and 4 bonus labs, a getting-started tour and troubleshooting; a Component Guide view explaining every component plus a one-prompt end-to-end walkthrough. Full text: [`docs/ai-security-lab-guide.md`](docs/ai-security-lab-guide.md) |

## Accuracy (AI Security)

Product behaviour follows the F5 AI Security docs (`docs.f5.com/ai-security/`, served from `docs.aisecurity.f5.com`): project scopes and types, token scopes, connection fields and auth types, guardrail packages and the 11 PII core entities, scan directions, Block/Audit, Comprehensive vs Performance, custom guardrail types and directions, prompt-log outcomes, fingerprints, attack types/vectors/converters, report cards, refusal checks, retries, AI Remediate statuses and the F1 target, and the self-hosted Kubernetes requirements.

- **Simulated:** hostnames, prompts and model answers, Red Team success rates, the CASI value, token counts and timings. The AI Remediate numbers (10% → 92%, F1 0.93, TP/FP/TN/FN) are the docs' own example values.
- **Teaching assumptions, labelled in the UI:** Audit hits appear as `flagged` in Prompt Logs; reruns of the custom campaign go through the project so its guardrails apply.
- **Not in the docs, so not taught as fact:** a CASI range or formula, a redact/mask action, a BIG-IP or NGINX enforcement integration (BIG-IP LTM appears only as the recommended L4 load balancer), general CPU/RAM sizing, and the raw auth header.
