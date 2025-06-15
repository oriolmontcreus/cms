export type User = {
  _id: string;
  email: string;
  name: string;
  permissions: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserRegisterPayload = {
  name: string;
  email: string;
  password: string;
};
