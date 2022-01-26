export type User = {
  name: string;
  password: string;
  admin?: boolean;
};

export type UserRes = {
  data: User;
  ts: number;
};
