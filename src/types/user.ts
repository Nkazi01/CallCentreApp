export interface User {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
  role: 'agent' | 'manager';
  fullName: string;
  email: string;
  active: boolean;
  createdAt: string;
}

