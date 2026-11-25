# AI Security Academy: lab guide and component reference

This is the written version of the in-app **Lab Guide** panel and **Component Guide** view of the AI Security simulator (`/ai-security.html`). In the app, open the Lab Guide from the top bar (or **Step-by-step walkthrough** under a mission). Steps tick off by themselves as you work, and **Take me there** opens the right console tab.

Product behaviour follows the F5 AI Security docs (docs.f5.com/ai-security → docs.aisecurity.f5.com). Hostnames, prompts, model answers, success rates, CASI values and timings are simulated.

## How to run a lab

1. `npm install && npm run dev`, then open http://localhost:5280/ai-security.html.
2. Play the missions in order. Each one builds on the state the previous one left behind.
3. After each mission, take the matching module's **Boss Quiz** (75% to pass) to unlock the next module.
4. Read the **event log** under the console after every click.
5. **Reset Simulation** starts everything over.

| Mission | Modules | What you do |
|---|---|---|
| 1 Onboard a Guarded Support Chatbot | 1 | Deploy, connect a model, project, token, route the app |
| 2 Stop the PII & Prompt-Injection Leak | 2–3 | Audit, then Block PII and prompt injection |
| 3 Red Team → Remediate → Re-test | 4 | Red Team, AI Remediate, deploy, re-test |

## Mission 1: Onboard a Guarded Support Chatbot

| # | Where | Do | You should see |
|---|---|---|---|
| 1 | Setup & Connect → 1 · Deployment | **SaaS · us1 / eu1**, or **Self-hosted** and answer the readiness check | Workspace URL in the header. Self-hosted answer: TCP 443 to the F5 Harbor registry |
| 2 | Setup & Connect → 2 · Connections | **Test and connect** | "statusCode 200 → Configuration Saved!" |
| 3 | Setup & Connect → 3 · Projects | Scope **Guardrails**, a project type (Chat) → **Create** | Project created. Red Team scope costs 5 XP |
| 4 | Setup & Connect → 4 · API token | Scope **Project** → **Create token** | Green "Project" pill, api-token-created audit event |
| 5 | Flow canvas | Click Chat App, AI Guardrails, Request Scan, Connection, Response Scan | +5 XP per node the first time |
| 6 | Setup & Connect → 5 · Route the app | Pick `{BASE_URL}/openai/support-bot-model` | App configured; wrong URLs cost 5 XP |
| 7 | Prompt Traffic, then Prompt Logs & Agents | **Normal customers** | Packets through scans to the model; three `passed` records |

## Mission 2: Stop the PII & Prompt-Injection Leak

Leave all guardrails off until step 1 ticks.

| # | Where | Do | You should see |
|---|---|---|---|
| 1 | Prompt Traffic | **Prompt injection**, then **PII in prompts & responses** | Everything reaches the model; the log shows the leaked system prompt, email and phone |
| 2 | Guardrails | Enable **PII core** and **Adversarial attacks**, Mode = **Audit** | Both saved in Audit |
| 3 | Prompt Traffic → Prompt Logs | Replay the attacks, Outcome = **flagged** | Amber records; the email leak is not yet flagged |
| 4 | Guardrails | PII core → Scan direction = **Prompts and responses** | The email in the answer is now caught |
| 5 | Guardrails → Prompt Traffic | Both packages Mode = **Block**, replay | Prompts stop at Request Scan, the email answer at Response Scan |
| 6 | Prompt Logs | Outcome = **blocked**, click a row "at request" | Response scan: "Did not run", model not called |

## Mission 3: Red Team → Remediate → Re-test

| # | Where | Do | You should see |
|---|---|---|---|
| 1 | AI Red Team | **Run** All Attacks | Report ready after a few seconds |
| 2 | AI Red Team → Reports | **View** the All Attacks report | CASI, Agentic resistance, Operational, Recommendations, by-vector results, OWASP LLM01 |
| 3 | AI Red Team → New campaign | Agent attack prompts + the discount-code intent → **Run campaign** | Intent succeeded 9/10 |
| 4 | AI Remediate | **Request remediation** on the custom-intent report | Requested → In progress → Ready; 10% → 92%, F1 0.93 (docs' example values) |
| 5 | AI Remediate | Mode **Audit** → **Import and deploy** | Deployed; two remediation rows on Guardrails |
| 6 | Guardrails → AI Red Team | Both remediation rows Mode = **Block**, **Rerun campaign** | Intent succeeds 1/12 |

## Bonus labs

| Lab | Do | Result |
|---|---|---|
| Custom guardrail | Guardrails → builder. Keyword/Regex need direction RESPONSE or BOTH (the codes are in the answer); GenAI also matches the request. Then replay Discount-code social engineering | Your guardrail hits; with REQUEST only, the log tells you to change direction |
| Performance protection | Protection type = Performance on PII core or Adversarial attacks | One CPU-only guardrail per package |
| Agentic fingerprint | Prompt Logs & Agents → Create Agentic project → Run a Claude Code session → Fingerprints › View | Session timeline with the tool call |
| Refusal phrase | AI Red Team → Refusal phrases → Add phrase | Extends the built-in refusal strings org-wide |

## Troubleshooting

| Symptom | Fix |
|---|---|
| Prompt Traffic buttons greyed out | Finish Setup & Connect (deployment, connection, project, token) |
| Mission 2 step 1 will not tick | It counts only with no guardrails enabled |
| Nothing flagged | Guardrails must be in Audit (they default to Block); replay after changing |
| Email leak not caught | Set PII core to Prompts and responses |
| Custom guardrail misses | Keyword/Regex: use RESPONSE or BOTH |
| Request remediation lost XP | Use the custom-intent report, not All Attacks |
| Rerun still 9/10 | Deploy, set both remediation rows to Block, then rerun |

## Component reference

### One prompt, end to end

1. **Chat App** sends a prompt with the OpenAI SDK to `{BASE_URL}/openai/{connection}`, with a project token as the API key.
2. Self-hosted only: an external **L4 load balancer** (BIG-IP LTM recommended) passes it to the proxy.
3. The **AI Guardrails proxy** checks the token and finds the project, which decides the guardrails.
4. **Request Scan** runs prompt guardrails. A Block hit stops it: no model call, no response scan.
5. An allowed prompt goes through the **connection** to the **model provider**.
6. **Response Scan** checks the answer before the app sees it.
7. The outcome (blocked, passed, flagged) lands in **Prompt Logs**; the dashboard counts tokens.
8. Separately, **AI Red Team** attacks the connection and **AI Remediate** turns custom-intent findings into GenAI guardrails deployed back into the project.

### What each component does

| Component | What it does |
|---|---|
| Chat App | The chatbot; keeps the OpenAI SDK, changes only base URL and key |
| AI Agent (Claude Code) | Agent traffic via an Agentic project with `x-cai-metadata-session-id`, for fingerprints |
| BIG-IP LTM | Self-hosted only, recommended (not required) L4 load balancer; does not scan |
| AI Guardrails proxy | Token check, project lookup, request scan, forward, response scan, log. OpenAI/Anthropic-compatible plus a scan API |
| Request Scan | Prompt-direction guardrails; Block stops the prompt, Audit records it |
| Model connection | Connections > Models entry (display name, case-sensitive model name, key); default model and Red Team target |
| Model providers | OpenAI, Anthropic, Azure, watsonx, Hugging Face, OpenAI Compatible, custom YAML; most latency is here, F5 adds ~500 ms |
| Response Scan | Response-direction guardrails on the model's answer |
| Guardrail packages | F5 packages, custom GenAI/Regex/Keyword, remediation guardrails; Enable, direction, Block/Audit, Enforce; Comprehensive vs Performance |
| Projects & tokens | Guardrails (Agentic/App/Bot/Chat) or Red Team scope; Personal/Organization/Project tokens |
| Prompt Logs | Prompt, response, outcome, time, user; filter and export |
| Dashboard & audit | Token usage by guardrail, top projects, audit events |
| Agent sessions | Agentic fingerprints: messages, tool calls, guardrails, system prompt, timeline |
| AI Red Team | Signature, Operational, Agentic Warfare and Agent attack prompts campaigns |
| Reports | CASI, Agentic resistance, Operational, Recommendations, by vector/intent, OWASP mapping |
| AI Remediate | Generates GenAI guardrails from custom-intent attacks, aims for F1 > 90%; deploy in Audit, then Block |
| Deployment | SaaS (us1, eu1) or Kubernetes v1.33–v1.36, connected (TCP 443 to F5 Harbor only) or air-gapped |
