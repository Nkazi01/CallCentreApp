import { User } from '../types/user';

export const sampleAgents: User[] = [
  {
    id: '1',
    username: 'agent1',
    role: 'agent',
    fullName: 'Thabo Khumalo',
    email: 'thabo@iyfinance.co.za',
    active: true,
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    username: 'agent2',
    role: 'agent',
    fullName: 'Nomsa Dlamini',
    email: 'nomsa@iyfinance.co.za',
    active: true,
    createdAt: '2024-01-20T08:00:00Z'
  },
  {
    id: '3',
    username: 'agent3',
    role: 'agent',
    fullName: 'Sipho Ndlovu',
    email: 'sipho@iyfinance.co.za',
    active: true,
    createdAt: '2024-02-01T08:00:00Z'
  }
];

export const manager: User = {
  id: 'mgr1',
  username: 'manager',
  role: 'manager',
  fullName: 'Zanele Mthembu',
  email: 'zanele@iyfinance.co.za',
  active: true,
  createdAt: '2024-01-01T08:00:00Z'
};

