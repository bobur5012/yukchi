import { api } from "./client";

export interface CourierTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export async function getTasks(): Promise<CourierTask[]> {
  return api.get<CourierTask[]>("/tasks");
}

export async function createTask(title: string): Promise<CourierTask> {
  return api.post<CourierTask>("/tasks", { title });
}

export async function updateTask(
  id: string,
  data: { title?: string; completed?: boolean }
): Promise<CourierTask> {
  return api.patch<CourierTask>(`/tasks/${id}`, data);
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete<void>(`/tasks/${id}`);
}
