import Image from 'next/image'

interface ImagemMemorialProps {
  src: string
  alt: string
  /** Larguras de exibição, para o otimizador não servir a digitalização original. */
  sizes: string
  className?: string
  prioridade?: boolean
}

/**
 * Imagem que preenche o contêiner (posicionado e com proporção definida por quem usa).
 * Arquivos do próprio portal passam pelo otimizador do Next: digitalizações do
 * acervo chegam a vários MB e o celular recebe só o tamanho que vai mostrar.
 */
export function ImagemMemorial({ src, alt, sizes, className = '', prioridade }: ImagemMemorialProps) {
  if (src.startsWith('/')) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={prioridade} className={`object-cover ${className}`} />
  }
  // Link externo cadastrado à mão não está na lista de domínios do otimizador
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={prioridade ? 'eager' : 'lazy'} className={`absolute inset-0 h-full w-full object-cover ${className}`} />
}
