import Image from 'next/image'

interface UserAvatarProps {
  nome: string
  src?: string | null
  /** Diâmetro em px. Padrão 40. */
  size?: number
  className?: string
}

function getInitial(nome: string): string {
  const trimmed = nome.trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toUpperCase()
}

// Avatar circular. Mostra a imagem em `src` ou cai pro fallback com a inicial
// do nome em fundo brand. Pensado pra usar em sidebar, header, mensagens etc.
export function UserAvatar({ nome, src, size = 40, className }: UserAvatarProps) {
  const dimension = `${size}px`

  if (src) {
    return (
      <span
        className={`inline-block rounded-full overflow-hidden bg-slate-100 ${className ?? ''}`}
        style={{ width: dimension, height: dimension }}
      >
        <Image
          src={src}
          alt={`Foto de ${nome}`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized // URLs externas (Supabase) — evita exigir config no next.config
        />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold ${className ?? ''}`}
      style={{
        width: dimension,
        height: dimension,
        fontSize: `${Math.round(size * 0.42)}px`,
      }}
      aria-label={`Foto de ${nome}`}
    >
      {getInitial(nome)}
    </span>
  )
}
