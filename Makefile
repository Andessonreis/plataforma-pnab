# =============================================================================
# Makefile - Portal PNAB Irecê
# =============================================================================
# Uso | Usage: make <target>
# Ajuda | Help: make help
# =============================================================================

.PHONY: help dev dev-local dev-docker dev-worker start build install clean \
        docker-up docker-down docker-build docker-logs docker-ps docker-clean \
        db-generate db-push db-migrate db-seed db-studio db-reset db-setup \
        lint typecheck check setup env-check

# -----------------------------------------------------------------------------
# Detecção de OS | OS Detection
# -----------------------------------------------------------------------------
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    SLEEP = powershell -command "Start-Sleep -Seconds $(1)"
    RM_RF = if exist "$(1)" rmdir /s /q "$(1)"
    RM_MULTI = $(foreach dir,$(1),if exist "$(dir)" rmdir /s /q "$(dir)" &)
else
    DETECTED_OS := $(shell uname -s)
    SLEEP = sleep $(1)
    RM_RF = rm -rf $(1)
    RM_MULTI = rm -rf $(1)
endif

# -----------------------------------------------------------------------------
# Variáveis | Variables
# -----------------------------------------------------------------------------
DOCKER_COMPOSE = docker compose
NPM = npm

ifeq ($(DETECTED_OS),Windows)
    GREEN  :=
    YELLOW :=
    CYAN   :=
    RESET  :=
else
    GREEN  := \033[0;32m
    YELLOW := \033[0;33m
    CYAN   := \033[0;36m
    RESET  := \033[0m
endif

# -----------------------------------------------------------------------------
# Desenvolvimento | Development
# -----------------------------------------------------------------------------

## Inicia infra (Postgres + Redis) + Next.js (recomendado)
dev: docker-up db-generate
	@echo "$(GREEN)Aguardando banco de dados e Redis...$(RESET)"
	@$(call SLEEP,3)
	@$(NPM) run dev

## Inicia apenas o Next.js (sem Docker — infra deve estar rodando)
dev-local:
	@$(NPM) run dev

## Inicia tudo via Docker (app + worker + postgres + redis)
dev-docker:
	@$(DOCKER_COMPOSE) up --build

## Inicia o worker BullMQ (email, pdf) em separado
dev-worker:
	@$(NPM) run worker

## Servidor de produção
start:
	@$(NPM) run start

## Build de produção
build: db-generate
	@$(NPM) run build

## Instala dependências
install:
	@$(NPM) install

# -----------------------------------------------------------------------------
# Docker
# -----------------------------------------------------------------------------

## Inicia Postgres + Redis em background (para dev local)
docker-up:
	@$(DOCKER_COMPOSE) up -d postgres redis
	@echo "$(GREEN)PostgreSQL (5432) e Redis (6379) iniciados$(RESET)"

## Para todos os containers
docker-down:
	@$(DOCKER_COMPOSE) down

## Build das imagens Docker
docker-build:
	@$(DOCKER_COMPOSE) build

## Logs de todos os containers
docker-logs:
	@$(DOCKER_COMPOSE) logs -f

## Logs de um serviço específico: make docker-logs-s S=postgres
docker-logs-s:
	@$(DOCKER_COMPOSE) logs -f $(S)

## Status dos containers
docker-ps:
	@$(DOCKER_COMPOSE) ps

## Remove containers, volumes e imagens locais
docker-clean:
	@$(DOCKER_COMPOSE) down -v --rmi local
	@echo "$(YELLOW)Containers, volumes e imagens removidos$(RESET)"

# -----------------------------------------------------------------------------
# Banco de Dados | Database
# -----------------------------------------------------------------------------

## Gera o Prisma Client
db-generate:
	@$(NPM) run db:generate

## Push do schema para o banco (sem migration — útil no início)
db-push:
	@$(NPM) run db:push

## Cria e executa migration
db-migrate:
	@$(NPM) run db:migrate

## Abre Prisma Studio (GUI visual do banco)
db-studio:
	@$(NPM) run db:studio

## Reset completo do banco (apaga tudo e recria)
db-reset:
	@$(NPM) run db:push -- --force-reset
	@echo "$(YELLOW)Banco resetado$(RESET)"

## Setup completo do banco (generate + push)
db-setup: db-generate db-push
	@echo "$(GREEN)Banco de dados configurado!$(RESET)"

# -----------------------------------------------------------------------------
# Qualidade de Código | Code Quality
# -----------------------------------------------------------------------------

## Verifica lint (ESLint)
lint:
	@$(NPM) run lint

## Verifica tipos TypeScript
typecheck:
	@npx tsc --noEmit

## Verifica lint + tipos
check: lint typecheck
	@echo "$(GREEN)Todas as verificações passaram!$(RESET)"

# -----------------------------------------------------------------------------
# Utilitários | Utilities
# -----------------------------------------------------------------------------

## Limpa .next e node_modules
clean:
	@$(call RM_MULTI,.next node_modules)
	@echo "$(YELLOW).next e node_modules removidos$(RESET)"

## Cria .env a partir de .env.example se não existir
env-check:
ifeq ($(DETECTED_OS),Windows)
	@if not exist ".env" (copy ".env.example" ".env" && echo "$(YELLOW).env criado a partir de .env.example — preencha as variaveis antes de continuar$(RESET)")
else
	@test -f .env || (cp .env.example .env && echo "$(YELLOW).env criado a partir de .env.example — preencha as variáveis antes de continuar$(RESET)")
endif

## Setup inicial completo: env-check + install + infra + banco
setup: env-check install docker-clean docker-up db-setup
	@echo ""
	@echo "$(GREEN)Setup completo! Execute 'make dev' para iniciar.$(RESET)"
	@echo ""

# -----------------------------------------------------------------------------
# Ajuda | Help
# -----------------------------------------------------------------------------

## Mostra esta ajuda
help:
	@echo ""
	@echo "$(CYAN)Portal PNAB Irecê — Comandos Disponíveis$(RESET)"
	@echo "$(CYAN)==========================================$(RESET)"
	@echo ""
	@echo "$(GREEN)Desenvolvimento:$(RESET)"
	@echo "  make dev           Inicia infra + Next.js (recomendado)"
	@echo "  make dev-local     Inicia apenas Next.js (infra já rodando)"
	@echo "  make dev-docker    Inicia tudo via Docker"
	@echo "  make dev-worker    Inicia worker BullMQ (email/pdf)"
	@echo "  make start         Servidor de produção"
	@echo "  make build         Build de produção"
	@echo "  make install       Instala dependências"
	@echo ""
	@echo "$(GREEN)Docker:$(RESET)"
	@echo "  make docker-up     Inicia Postgres + Redis"
	@echo "  make docker-down   Para todos os containers"
	@echo "  make docker-build  Build das imagens"
	@echo "  make docker-logs   Logs de todos os containers"
	@echo "  make docker-ps     Status dos containers"
	@echo "  make docker-clean  Remove containers, volumes e imagens"
	@echo ""
	@echo "$(GREEN)Banco de Dados:$(RESET)"
	@echo "  make db-generate   Gera Prisma Client"
	@echo "  make db-push       Push do schema (sem migration)"
	@echo "  make db-migrate    Cria e executa migration"
	@echo "  make db-studio     Abre Prisma Studio (GUI)"
	@echo "  make db-reset      Reset completo do banco"
	@echo "  make db-setup      Setup completo (generate + push)"
	@echo ""
	@echo "$(GREEN)Qualidade:$(RESET)"
	@echo "  make lint          Verifica lint"
	@echo "  make typecheck     Verifica tipos TypeScript"
	@echo "  make check         lint + typecheck"
	@echo ""
	@echo "$(GREEN)Utilitários:$(RESET)"
	@echo "  make clean         Remove .next e node_modules"
	@echo "  make setup         Setup inicial completo"
	@echo "  make help          Mostra esta ajuda"
	@echo ""
	@echo "$(CYAN)Primeira vez? Execute: make setup && make dev$(RESET)"
	@echo ""
