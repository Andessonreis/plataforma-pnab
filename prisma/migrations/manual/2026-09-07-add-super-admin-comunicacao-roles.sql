-- Migration manual: novos valores em UserRole
-- Data: 2026-09-07
-- Motivo: divide o backoffice em dois níveis. SUPER_ADMIN enxerga e opera
-- qualquer tela (Andesson Reis é o único); ADMIN perde acesso a Logs,
-- Usuários, Configurações, Habilitação e às telas de conteúdo institucional
-- (Notícias, Páginas, Slide Carrossel, Banner Topo). COMUNICACAO é o novo
-- cargo responsável por conteúdo institucional (notícias, páginas, banners,
-- slides, templates de e-mail e notificações) — sem acesso a inscrições,
-- atendimento, habilitação ou avaliação.
--
-- Só adiciona valores ao enum — nenhuma role existente muda de nome nem é
-- removida. Promover a conta do Andesson pra SUPER_ADMIN é um UPDATE manual
-- à parte, feito depois desta migration (ver PR).
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback: não é seguro remover valor de enum com Postgres se ele já estiver
-- em uso por alguma linha — não há rollback automático aqui.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COMUNICACAO';
