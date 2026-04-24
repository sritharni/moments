export type AuthUser = {
  id: string;
  email: string;
  username: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  username: string;
  email: string;
  password: string;
};
