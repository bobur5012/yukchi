'use client';

import { motion } from 'framer-motion';
import { Plus, Package, CreditCard, Banknote } from 'lucide-react';
import { CurrencyWidget } from './CurrencyWidget';
import { TopCouriers } from './TopCouriers';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/useTranslations';

export function CourierDashboard() {
  const router = useRouter();
  const { t } = useTranslations();

  const quickActions = [
    {
      icon: Package,
      label: t('courier.addProduct'),
      onClick: () => router.push('/trips'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: CreditCard,
      label: t('courier.addDebt'),
      onClick: () => router.push('/shops'),
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Banknote,
      label: t('courier.receivePayment'),
      onClick: () => router.push('/shops'),
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Currency Widget */}
      <CurrencyWidget />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-3"
      >
        {quickActions.map((action, idx) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={action.onClick}
            className={`flex items-center gap-4 p-6 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-lg hover:shadow-xl transition-all active:scale-95`}
          >
            <div className="p-3 bg-white/20 rounded-lg">
              <action.icon className="w-7 h-7" />
            </div>
            <span className="text-lg font-semibold flex-1 text-left">{action.label}</span>
            <Plus className="w-6 h-6" />
          </motion.button>
        ))}
      </motion.div>

      {/* Top Couriers */}
      <TopCouriers showAll={false} />
    </div>
  );
}
