export interface User {
  id: string;
  username: string;
  role: 'agent' | 'manager';
  fullName: string;
  email: string;
  active: boolean;
  createdAt: string;
}

