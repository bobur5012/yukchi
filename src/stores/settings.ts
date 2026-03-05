import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TelegramBotConfig {
  token: string;
  chatId: string;
  status: "connected" | "disconnected" | "error";
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
  notifications: NotificationSettings;
  messageTemplates: MessageTemplates;
  setTelegramBot: (config: Partial<TelegramBotConfig>) => void;
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
    "📦 *Yangi mahsulot*\n✈️ Safar: {trip}\n🏬 Do'kon: {shop}\n🏷 Nomi: {name}\n🔢 Miqdor: {quantity} {unit}\n💵 Sotuv narxi: {salePrice} {currency}\n🚚 Dostavka turi: {deliveryMode}\n🚚 Dostavka narxi: {deliveryPrice} {currency}\n⚖️ 1 kg narxi: {pricePerKg} {currency}\n🧾 Mahsulot jami: {totalSale} {currency}\n🚚 Dostavka jami: {totalDelivery} {currency}\n💰 Umumiy jami: {grandTotal} {currency}\n👤 Qo'shgan: {addedBy}\n🕒 Sana: {createdAt}",
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
