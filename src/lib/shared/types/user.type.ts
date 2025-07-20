export interface User {
  _id: string;
  email: string;
  name: string;
  permissions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegisterPayload {
  email: string;
  password: string;
  name: string;
  permissions?: number;
}