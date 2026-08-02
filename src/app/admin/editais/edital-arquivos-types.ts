export interface Arquivo {
  id: string
  titulo: string
  tipo: string
  url: string
}

export interface PendingFile {
  localId: string
  file: File
  titulo: string
  tipo: string
}

export interface TipoOption {
  value: string
  label: string
}
