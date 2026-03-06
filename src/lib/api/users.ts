import { api } from "./client";
import type { AuthUser } from "./auth";

export interface UserProfile extends AuthUser {
  phone: string;
  createdAt?: string;
}

export interface UpdateMePayload {
  name?: string;
  avatarUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  return api.get<UserProfile>("/users/me");
}

export async function updateCurrentUserProfile(
  data: UpdateMePayload
): Promise<UserProfile> {
  return api.patch<UserProfile>("/users/me", data);
}

export async function updateUserPasswordByAdmin(
  userId: string,
  newPassword: string
): Promise<{ success: true }> {
  return api.patch<{ success: true }>(`/users/${userId}/password`, {
    newPassword,
  });
}
