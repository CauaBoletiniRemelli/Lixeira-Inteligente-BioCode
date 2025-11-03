import { Bin, User, Collection } from '../types';

export const mockBins: Bin[] = [
  {
    id: '1',
    location: 'Prédio A - 1º Andar',
    fillLevel: 85,
    status: 'warning',
    lastUpdate: new Date('2025-11-03T10:30:00'),
    type: 'recyclable',
  },
  {
    id: '2',
    location: 'Prédio B - Térreo',
    fillLevel: 45,
    status: 'normal',
    lastUpdate: new Date('2025-11-03T09:15:00'),
    type: 'organic',
  },
  {
    id: '3',
    location: 'Prédio C - 2º Andar',
    fillLevel: 95,
    status: 'full',
    lastUpdate: new Date('2025-11-03T11:00:00'),
    type: 'general',
  },
  {
    id: '4',
    location: 'Área Externa - Estacionamento',
    fillLevel: 30,
    status: 'normal',
    lastUpdate: new Date('2025-11-03T08:45:00'),
    type: 'recyclable',
  },
  {
    id: '5',
    location: 'Refeitório',
    fillLevel: 70,
    status: 'warning',
    lastUpdate: new Date('2025-11-03T12:00:00'),
    type: 'organic',
  },
];

export const mockUser: User = {
  id: '1',
  name: 'João Silva',
  email: 'joao@ecobin.com',
  avatar: 'https://i.pravatar.cc/150?img=1',
  role: 'admin',
};

export const mockCollections: Collection[] = [
  {
    id: '1',
    binId: '1',
    date: new Date('2025-11-02T14:30:00'),
    weight: 12.5,
    type: 'recyclable',
  },
  {
    id: '2',
    binId: '2',
    date: new Date('2025-11-02T15:00:00'),
    weight: 8.3,
    type: 'organic',
  },
  {
    id: '3',
    binId: '3',
    date: new Date('2025-11-02T16:20:00'),
    weight: 15.7,
    type: 'general',
  },
];
