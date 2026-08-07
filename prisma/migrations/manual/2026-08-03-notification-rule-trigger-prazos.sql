-- Novos valores de NotificationRuleTrigger: lembretes de prazo (encerramento
-- de inscrições e de janela de recurso). Idempotente — ALTER TYPE ADD VALUE
-- IF NOT EXISTS não falha se já aplicado.
ALTER TYPE "NotificationRuleTrigger" ADD VALUE IF NOT EXISTS 'EDITAL_PRAZO_ENCERRANDO';
ALTER TYPE "NotificationRuleTrigger" ADD VALUE IF NOT EXISTS 'RECURSO_PRAZO_ENCERRANDO';
