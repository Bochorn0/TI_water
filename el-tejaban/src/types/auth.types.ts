/** TI Water user shape from POST /auth/login and GET /auth/me */
export interface TiWaterAuthRole {
  _id: number;
  name: string;
  permissions: string[];
}

export interface TiWaterAuthUser {
  id: number;
  email: string;
  nombre?: string;
  puesto?: string;
  role: TiWaterAuthRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: TiWaterAuthUser;
}

/** Permission paths stored on TI Water roles */
export type PermissionPath = '/el-tejaban' | '/el-tejaban-admin';

export const PERMISSION_POS: PermissionPath = '/el-tejaban';
export const PERMISSION_ADMIN: PermissionPath = '/el-tejaban-admin';
