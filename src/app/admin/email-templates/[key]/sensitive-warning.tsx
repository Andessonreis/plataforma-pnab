import { Card } from '@/components/ui'

export function SensitiveWarning() {
  return (
    <Card className="bg-red-50 border-red-200">
      <div className="flex gap-3 items-start">
        <span aria-hidden className="text-red-600 text-xl leading-none">⚠</span>
        <div className="text-sm text-red-900">
          <p className="font-semibold mb-1">Cuidado: e-mail crítico do sistema</p>
          <p className="text-red-800 leading-relaxed">
            Este e-mail faz parte de um fluxo crítico (autenticação / recuperação de senha). Se a
            personalização esquecer o atalho <code className="bg-red-100 px-1 rounded">{'{{resetUrl}}'}</code>,
            os usuários ficam sem conseguir recuperar a senha. Personalize apenas se for muito
            necessário — na dúvida, deixe a personalização desativada e o sistema usa o texto padrão.
          </p>
        </div>
      </div>
    </Card>
  )
}
