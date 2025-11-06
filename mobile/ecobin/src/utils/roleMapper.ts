import { UserRole } from '../types';

export const mapTipoToRole = (tipo: number): UserRole => {
  switch (tipo) {
    case 0:
      return 'admin';
    case 1:
      return 'admin';
    case 2:
      return 'sindico';
    case 3:
      return 'coletor';
    default:
      return 'coletor';
  }
};

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
