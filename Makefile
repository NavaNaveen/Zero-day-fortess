.PHONY: dev dev-backend dev-frontend install battle docker-up docker-down clean lint test

# ─── Development ─────────────────────────────────────────────────────────────

dev:
	@echo "🛡️  Starting Zero Day Fortress..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	@cd backend && .venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@cd frontend && npm run dev

dev-target:
	@cd vulnerable-app && npm run dev

# ─── Install ──────────────────────────────────────────────────────────────────

install:
	@echo "📦 Installing dependencies..."
	@cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	@cd frontend && npm install
	@cd vulnerable-app && npm install

install-backend:
	@cd backend && .venv/bin/pip install -r requirements.txt

install-frontend:
	@cd frontend && npm install

# ─── Battle ───────────────────────────────────────────────────────────────────

battle:
	@echo "⚔️  Starting autonomous battle..."
	@cd backend && python -m services.battle_runner

battle-demo:
	@echo "🎯 Running demo battle against vulnerable-app..."
	@TARGET_BASE_URL=http://localhost:3001 \
	 TARGET_REPO_PATH=../vulnerable-app \
	 cd backend && python -m services.battle_runner --demo

battle-ollama:
	@echo "🦙 Starting Ollama battle..."
	@curl -s -X POST "http://localhost:8000/battle/start?provider=ollama" | python3 -m json.tool

battle-royale:
	@echo "⚔️  Starting Battle Royale..."
	@curl -s -X POST "http://localhost:8000/battle/royale?providers=ollama" | python3 -m json.tool

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-up:
	@docker compose -f docker/docker-compose.yml up --build

docker-down:
	@docker compose -f docker/docker-compose.yml down

docker-logs:
	@docker compose -f docker/docker-compose.yml logs -f

# ─── Quality ──────────────────────────────────────────────────────────────────

lint:
	@cd backend && ruff check . && mypy .
	@cd frontend && npm run lint

test:
	@cd backend && pytest tests/ -v
	@cd frontend && npm run test

format:
	@cd backend && ruff format .
	@cd frontend && npm run format

# ─── Clean ────────────────────────────────────────────────────────────────────

clean:
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅ Cleaned"
