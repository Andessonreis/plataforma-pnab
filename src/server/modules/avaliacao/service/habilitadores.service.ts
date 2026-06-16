import { habilitadoresRepository } from '../repository/habilitadores.repository'

export function listHabilitadores() {
  return habilitadoresRepository.listHabilitadores()
}
