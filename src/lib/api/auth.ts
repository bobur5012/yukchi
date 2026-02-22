import { api } from "./client";

export interface AuthUser {
  id: string;
  role: "admin" | "courier";
  name?: string;
  phone?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(
  phone: string,
  password: string
): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", {
    phone,
    password,
  });
}

export async function logout(): Promise<void> {
  return api.post<void>("/auth/logout");
}
