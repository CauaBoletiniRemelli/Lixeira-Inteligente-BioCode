// Tipos globais da aplicação

export type UserRole = 'coletor' | 'sindico' | 'admin';

export interface Bin {
  id: string;
  location: string;
  fillLevel: number;
  status: 'normal' | 'warning' | 'full';
  lastUpdate: Date;
  type: 'organic' | 'recyclable' | 'general';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  condominiumName?: string;
  condominiumId?: number;
}

export interface Collection {
  id: string;
  binId: string;
  date: Date;
  weight: number;
  type: string;
}

export interface Sensor {
  id: string;
  binId: string;
  name: string;
  status: 'active' | 'inactive';
  batteryLevel: number;
  lastReading: Date;
}

export interface Condominium {
  id: string;
  name: string;
  address: string;
  managerId: string;
  sensorsCount: number;
}
