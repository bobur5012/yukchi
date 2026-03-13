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
  tripExpense: string;
  tripIncome: string;
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
    "______________________________________________\n🔴 *Qarz qo'shildi*\n\n🏬 {shop}\n💰 {amount} {currency}\n\n💳 {totalDebt} (jami)\n👤 {courier} • {date}",
  paymentReceived:
    "_____________________________________________\n✅ *To'lov qabul qilindi*\n\n🏬 {shop}\n💰 {amount} {currency}\n\n👤 {courier}\n💳 Qarz: {remainingDebt}\n\n📅 {date}",
  newTrip:
    "______________________________________\n✈️ *Yangi safar*\n\n📛 {name}\n📍 {region}\n\n💰 Byudjet: {budget} {currency}\n👥 {couriers}\n\n📅 {departureDate}",
  tripUpdated:
    "✏️ *Sayohat yangilandi*\n✈️ {name}\n📊 Holat: {status}\n👤 Yangilagan: {courier}",
  newExpense:
    "💸 *Yangi xarajat*\n✈️ Sayohat: {trip}\n📝 Tavsif: {description}\n💰 Summa: {amount} {currency}\n👤 Qo'shgan: {courier}",
  tripExpense:
    "_____________________________________________\n💸 *Sayohat xarajati*\n\n✈️ {trip}\n📝 {description}\n\n💰 {amount} {currency}\n👤 {courier} • {date}",
  tripIncome:
    "____________________________________________\n💰 *Sayohat kirimi*\n\n✈️ {trip}\n📝 {description}\n\n➕ {amount} {currency}\n👤 {courier} • {date}",
  newProduct:
    "📦 *{name} — {quantity} {unit}*\n\n✈️ {trip} | 🏬 {shop}\n\n💵 {saleLine}\n🚚 {deliveryLine}\n\n🧾 Tovar: {totalSale}{currencyShort}\n🚚 Dostavka: {totalDelivery}{currencyShort}\n💰 Jami: {grandTotal}{currencyShort}\n\n👤 {addedBy} • {createdAt}",
  newShop:
    "🏪 *Yangi do'kon*\n📛 Nomi: {name}\n👤 Egasi: {owner}\n📞 Telefon: {phone}\n📍 Manzil: {address}",
  newCourier:
    "🚀 *Yangi kuryer*\n👤 Ismi: {name}\n📞 Telefon: {phone}",
  courierAssigned:
    "🔗 *Kuryer sayohatga tayinlandi*\n✈️ Sayohat: {trip}\n👤 Kuryer: {courier}",
  tripReminder:
    "⏰ *Sayohat eslatmasi*\n✈️ {trip}\n📅 Uchish sanasi: {departureDate}\n⏳ Qoldi: {days} kun",
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
