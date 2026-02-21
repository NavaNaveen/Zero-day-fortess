# 🛡️ ZERO DAY FORTRESS

> **Continuous AI-driven cyber war inside your codebase so real hackers never win.**

Autonomous Red Team vs Blue Team AI Cyber Defense System where adversarial AI agents attack your codebase while defensive AI agents patch and harden it in real time.

---

## Architecture

```
                    WAR GENERAL (Orchestrator)
                            │
       ┌────────────────────┴────────────────────┐
       │                                         │
   RED TEAM                                 BLUE TEAM
  (Attackers)                               (Defenders)
       │                                         │
       └───────────────┬─────────────────────────┘
                       │
                 BATTLEGROUND
                (Codebase + API)
                       │
                 WAR REPORTER
                 (Dashboard)
```

### Red Team Agents
| Agent | Codename | Role |
|-------|----------|------|
| Recon Agent | Spider | Map attack surface |
| Exploiter Agent | Blade | Execute exploit payloads |
| Chain Builder | Venom | Chain low-severity → critical paths |
| Business Logic | Phantom | Find logic-level vulnerabilities |

### Blue Team Agents
| Agent | Codename | Role |
|-------|----------|------|
| Patcher Agent | Shield | Generate secure patches |
| Hardening Agent | Fortress | Apply systemic defenses |
| Verification Agent | Proof | Validate exploits are fixed |
| Compliance Agent | Auditor | OWASP/SOC2/PCI-DSS reports |

---

## Quick Start

```bash
# Clone & setup
cp .env.example .env
# Fill in ANTHROPIC_API_KEY

# Start everything
make dev

# Or with Docker
make docker-up

# Run a battle
make battle TARGET=./vulnerable-app
```

## Stack

- **Backend**: Python 3.12 + FastAPI + asyncio agents
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **LLM**: Claude (claude-sonnet-4-6) via Anthropic SDK
- **Real-time**: WebSockets
- **Target Sandbox**: Node.js vulnerable demo app
- **Orchestration**: AsyncIO agent loop

## Project Structure

```
zero-day-fortress/
├── backend/               # Python FastAPI + AI Agents
│   ├── agents/
│   │   ├── red_team/      # Spider, Blade, Venom, Phantom
│   │   └── blue_team/     # Shield, Fortress, Proof, Auditor
│   ├── api/               # REST + WebSocket endpoints
│   ├── core/              # Config, LLM client, events
│   ├── models/            # Data models
│   ├── services/          # Battle orchestration
│   └── tools/             # Scanner, GitHub, Sandbox
├── frontend/              # Next.js War Dashboard
│   └── src/
│       ├── app/           # App Router pages
│       ├── components/    # BattleMap, VulnerabilityCard, etc.
│       └── hooks/         # useBattle, useWebSocket
├── vulnerable-app/        # Demo target with seeded vulns
└── docker/                # Docker Compose configs
```
