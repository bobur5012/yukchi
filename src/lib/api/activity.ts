import { api } from "./client";

export type ActivityItem =
  | {
      type: "expense";
      id: string;
      createdAt: string;
      trip?: { id: string; name: string };
      amount?: string;
      description?: string;
      createdByUser?: { name: string };
    }
  | {
      type: "debt";
      id: string;
      createdAt: string;
      shop?: { id: string; name: string };
      amount?: string;
      description?: string;
      createdByUser?: { name: string };
    }
  | {
      type: "product";
      id: string;
      createdAt: string;
      trip?: { id: string; name: string };
      shop?: { id: string; name: string } | null;
      name?: string;
      createdByUser?: { name: string };
    };

export interface ActivityResponse {
  items: ActivityItem[];
}

export type DebtPaymentItem = {
  id: string;
  type: "debt" | "payment";
  amount?: string;
  description?: string;
  shop?: { id: string; name: string };
  createdAt: string;
};

export async function getActivity(limit = 50): Promise<ActivityResponse> {
  return api.get<ActivityResponse>(`/activity?limit=${limit}`);
}

export async function getMyDebtPaymentActivity(
  limit = 20
): Promise<DebtPaymentItem[]> {
  return api.get<DebtPaymentItem[]>(
    `/activity/my-debt-payments?limit=${limit}`
  );
}
