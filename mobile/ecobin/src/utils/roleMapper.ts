import { UserRole } from '../types';

/**
 * Mapeia o tipo (número) do backend para o role (string) do frontend
 * @param tipo - 0 = admin (NaoIdentificado/Admin padrão), 1 = admin, 2 = sindico, 3 = coletor
 * @returns UserRole correspondente
 */
export const mapTipoToRole = (tipo: number): UserRole => {
  switch (tipo) {
    case 0:
      // Tipo 0 = NaoIdentificado, tratado como admin
      return 'admin';
    case 1:
      return 'admin';
    case 2:
      return 'sindico';
    case 3:
      return 'coletor';
    default:
      // Para tipos inválidos, retorna coletor (menor privilégio)
      return 'coletor';
  }
};

/**
 * Mapeia o role (string) do frontend para o tipo (número) do backend
 * @param role - 'admin', 'sindico' ou 'coletor'
 * @returns Tipo numérico correspondente
 */
export const mapRoleToTipo = (role: UserRole): number => {
  switch (role) {
    case 'admin':
      return 1;
    case 'sindico':
      return 2;
    case 'coletor':
      return 3;
    default:
      return 0;
  }
};
