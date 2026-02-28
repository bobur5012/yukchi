import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  newTrip: boolean;
  tripUpdated: boolean;
  newExpense: boolean;
  newProduct: boolean;
  newShop: boolean;
  newDebt: boolean;
  paymentReceived: boolean;
  newCourier: boolean;
  courierAssigned: boolean;
  tripReminder: boolean;
}

export interface MessageTemplates {
  [key: string]: string;
  newDebt: string;
  paymentReceived: string;
  newTrip: string;
  tripUpdated: string;
  newExpense: string;
  newProduct: string;
  newShop: string;
  newCourier: string;
  courierAssigned: string;
  tripReminder: string;
}

interface SettingsState {
  telegramBot: TelegramBotConfig;
  telegramClient: TelegramClientConfig;
  notifications: NotificationSettings;
  messageTemplates: MessageTemplates;
  setTelegramBot: (config: Partial<TelegramBotConfig>) => void;
  setTelegramClient: (config: Partial<TelegramClientConfig>) => void;
  setNotifications: (settings: Partial<NotificationSettings>) => void;
  setMessageTemplate: (key: keyof MessageTemplates, value: string) => void;
  setMessageTemplates: (templates: Partial<MessageTemplates>) => void;
}

export const DEFAULT_TEMPLATES: MessageTemplates = {
  newDebt:
    "🔴 *Новый долг*\n📦 Магазин: {shop}\n💰 Сумма: {amount} {currency}\n👤 Добавил: {courier}\n📝 Описание: {description}\n💳 Итого долг: {totalDebt}\n📅 Дата: {date}",
  paymentReceived:
    "✅ *Оплата получена*\n📦 Магазин: {shop}\n💰 Сумма: {amount} {currency}\n👤 Принял: {courier}\n💳 Остаток долга: {remainingDebt}\n📅 Дата: {date}",
  newTrip:
    "✈️ *Новая поездка*\n📛 Название: {name}\n📍 Регион: {region}\n💰 Бюджет: {budget} {currency}\n👥 Курьеры: {couriers}\n📅 Вылет: {departureDate}",
  tripUpdated:
    "✏️ *Поездка обновлена*\n✈️ {name}\n📊 Статус: {status}\n👤 Обновил: {courier}",
  newExpense:
    "💸 *Новый расход*\n✈️ Поездка: {trip}\n📝 Описание: {description}\n💰 Сумма: {amount} {currency}\n👤 Добавил: {courier}",
  newProduct:
    "📦 *Новый товар*\n✈️ Поездка: {trip}\n🏷️ Название: {name}\n🔢 Кол-во: {quantity} {unit}\n💰 Цена: {costPrice} {currency}",
  newShop:
    "🏪 *Новый магазин*\n📛 Название: {name}\n👤 Владелец: {owner}\n📞 Телефон: {phone}\n📍 Адрес: {address}",
  newCourier:
    "🚀 *Новый курьер*\n👤 Имя: {name}\n📞 Телефон: {phone}",
  courierAssigned:
    "🔗 *Курьер назначен на поездку*\n✈️ Поездка: {trip}\n👤 Курьер: {courier}",
  tripReminder:
    "⏰ *Напоминание о поездке*\n✈️ {trip}\n📅 Дата вылета: {departureDate}\n⏳ Через: {days} дн.",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
        newTrip: true,
        tripUpdated: true,
        newExpense: true,
        newProduct: true,
        newShop: true,
        newDebt: true,
        paymentReceived: true,
        newCourier: true,
        courierAssigned: true,
        tripReminder: true,
      },
      messageTemplates: { ...DEFAULT_TEMPLATES },

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

      setMessageTemplates: (templates) =>
        set((state) => ({
          messageTemplates: { ...state.messageTemplates, ...templates } as MessageTemplates,
        })),
    }),
    {
      name: "yukchi_settings",
      partialize: (s) => ({
        messageTemplates: s.messageTemplates,
      }),
    }
  )
);
