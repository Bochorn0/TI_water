export interface AuthRole {
  _id: number;
  name: string;
  permissions: string[];
  dashboardVersion?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  nombre?: string;
  puesto?: string;
  avatar?: string;
  role: AuthRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
