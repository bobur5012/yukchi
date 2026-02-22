import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const REGIONS = [
  { name: 'Tashkent', nameUz: 'Toshkent' },
  { name: 'Samarkand', nameUz: 'Samarqand' },
  { name: 'Bukhara', nameUz: 'Buxoro' },
  { name: 'Namangan', nameUz: 'Namangan' },
  { name: 'Andijan', nameUz: 'Andijon' },
  { name: 'Fergana', nameUz: 'Farg\'ona' },
  { name: 'Kashkadarya', nameUz: 'Qashqadaryo' },
  { name: 'Surkhandarya', nameUz: 'Surxondaryo' },
  { name: 'Navoi', nameUz: 'Navoiy' },
  { name: 'Jizzakh', nameUz: 'Jizzax' },
  { name: 'Syrdarya', nameUz: 'Sirdaryo' },
  { name: 'Khorezm', nameUz: 'Xorazm' },
  { name: 'Karakalpakstan', nameUz: 'Qoraqalpog\'iston' },
  { name: 'Tashkent Region', nameUz: 'Toshkent viloyati' },
];

const EXCHANGE_RATES = [
  { baseCurrency: 'USD', targetCurrency: 'UZS', rate: '12600.000000' },
  { baseCurrency: 'UZS', targetCurrency: 'USD', rate: '0.000079' },
  { baseCurrency: 'USD', targetCurrency: 'EUR', rate: '0.920000' },
  { baseCurrency: 'EUR', targetCurrency: 'USD', rate: '1.086957' },
  { baseCurrency: 'USD', targetCurrency: 'CNY', rate: '7.240000' },
  { baseCurrency: 'CNY', targetCurrency: 'USD', rate: '0.138122' },
  { baseCurrency: 'USD', targetCurrency: 'TRY', rate: '32.500000' },
  { baseCurrency: 'TRY', targetCurrency: 'USD', rate: '0.030769' },
];

async function main() {
  console.log('Seeding database...');

  await prisma.$transaction(async (tx) => {
    // Regions
    for (const region of REGIONS) {
      await tx.region.upsert({
        where: { name: region.name },
        update: {},
        create: region,
      });
    }
    console.log(`Seeded ${REGIONS.length} regions`);

    // Exchange rates
    for (const rate of EXCHANGE_RATES) {
      await tx.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency: {
            baseCurrency: rate.baseCurrency,
            targetCurrency: rate.targetCurrency,
          },
        },
        update: { rate: rate.rate },
        create: rate,
      });
    }
    console.log(`Seeded ${EXCHANGE_RATES.length} exchange rates`);

    // Admin user
    const passwordHash = await bcrypt.hash('Admin1234!', 12);
    await tx.user.upsert({
      where: { phone: '+998901234567' },
      update: {},
      create: {
        phone: '+998901234567',
        passwordHash,
        name: 'Admin',
        role: 'admin',
      },
    });
    console.log('Seeded admin user: +998901234567 / Admin1234!');
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
