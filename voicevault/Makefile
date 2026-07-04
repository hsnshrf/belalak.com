# VoiceVault — single entry point for CI and local quality gates.
#
#   make check          lint + typecheck + tests for every app that has a toolchain available
#   make check-js       Node workspaces only (shared, api, web)
#   make check-mobile   Flutter app only (skipped with a warning if the Flutter SDK is absent)
#   make dev-infra      start Postgres + Redis + MinIO for local development (docker compose)

.PHONY: check check-js check-mobile install dev-infra dev-infra-down migrate

check: check-js check-mobile

install:
	npm install

check-js: install
	npm run lint
	npm run typecheck
	npm run test

check-mobile:
	@if command -v flutter >/dev/null 2>&1; then \
		cd apps/mobile && flutter analyze && flutter test; \
	else \
		echo "WARNING: Flutter SDK not found — skipping mobile analyze/tests (install Flutter to enable)."; \
	fi

dev-infra:
	docker compose -f infra/docker-compose.yml up -d

dev-infra-down:
	docker compose -f infra/docker-compose.yml down

migrate:
	npm run migrate --workspace apps/api
