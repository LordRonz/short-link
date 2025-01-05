export type IronSessionData = {
  user: {
    id: number;
    name: string;
    admin?: boolean;
  };
};

export type LoginResponse = {
  message?: string;
  status?: number;
  ok?: boolean;
};
