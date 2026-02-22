import { create } from "zustand";

interface TelegramBotConfig {
  token: string;
  chatId: string;
  status: "connected" | "disconnected" | "error";
}

interface TelegramClientConfig {
  phone: string;
  appId: string;
  appHash: string;
  code: string;
  status: "authorized" | "unauthorized" | "pending";
}

interface NotificationSettings {
  newDebt: boolean;
  paymentReceived: boolean;
  tripReminder: boolean;
}

interface SettingsState {
  telegramBot: TelegramBotConfig;
  telegramClient: TelegramClientConfig;
  notifications: NotificationSettings;
  messageTemplates: Record<string, string>;
  setTelegramBot: (config: Partial<TelegramBotConfig>) => void;
  setTelegramClient: (config: Partial<TelegramClientConfig>) => void;
  setNotifications: (settings: Partial<NotificationSettings>) => void;
  setMessageTemplate: (key: string, value: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  telegramBot: {
    token: "",
    chatId: "",
    status: "disconnected",
  },
  telegramClient: {
    phone: "",
    appId: "",
    appHash: "",
    code: "",
    status: "unauthorized",
  },
  notifications: {
    newDebt: true,
    paymentReceived: true,
    tripReminder: true,
  },
  messageTemplates: {
    newDebt: "Новый долг: {shop} - {amount} {currency}",
    paymentReceived: "Получена оплата: {shop} - {amount}",
    tripReminder: "Напоминание: поездка {trip} через {days} дн.",
  },

  setTelegramBot: (config) =>
    set((state) => ({
      telegramBot: { ...state.telegramBot, ...config },
    })),

  setTelegramClient: (config) =>
    set((state) => ({
      telegramClient: { ...state.telegramClient, ...config },
    })),

  setNotifications: (settings) =>
    set((state) => ({
      notifications: { ...state.notifications, ...settings },
    })),

  setMessageTemplate: (key, value) =>
    set((state) => ({
      messageTemplates: { ...state.messageTemplates, [key]: value },
    })),
}));
