import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  const org = await db.organization.upsert({
    where: { slug: 'default-shul' },
    update: {},
    create: {
      name: 'Default Synagogue',
      slug: 'default-shul',
      latitude: 40.7128,
      longitude: -74.006,
      elevation: 10,
      timezone: 'America/New_York',
      dialect: 'Ashkenazi',
      candleLightingMinutes: 18,
      shabbatEndType: 'degrees',
      shabbatEndValue: 8.5,
      rabbeinu_tam_minutes: 72,
      amPmFormat: false,
      inIsrael: false,
    },
  });

  console.log(`Created organization: ${org.name} (${org.id})`);

  const defaultStyle = await db.style.upsert({
    where: { id: 'default-style' },
    update: {},
    create: {
      id: 'default-style',
      name: 'Default Layout',
      orgId: org.id,
      isDefault: true,
      activationRules: JSON.stringify({ type: 'always' }),
      sortOrder: 0,
    },
  });

  console.log(`Created style: ${defaultStyle.name}`);

  await db.screen.upsert({
    where: { id: 'main-screen' },
    update: {},
    create: {
      id: 'main-screen',
      name: 'Main Display',
      orgId: org.id,
      assignedStyleId: defaultStyle.id,
      isActive: true,
      resolution: '1920x1080',
    },
  });

  console.log('Created main screen');

  const scheduleGroups = [
    { name: 'Weekday', hebrewName: 'חול', color: '#4CAF50', sortOrder: 0, isBuiltIn: true },
    { name: 'Shabbat', hebrewName: 'שבת', color: '#2196F3', sortOrder: 1, isBuiltIn: true },
    { name: 'Yom Tov', hebrewName: 'יום טוב', color: '#FF9800', sortOrder: 2, isBuiltIn: true },
    { name: 'Chol HaMoed', hebrewName: 'חול המועד', color: '#9C27B0', sortOrder: 3, isBuiltIn: true },
    { name: 'Fast Day', hebrewName: 'צום', color: '#F44336', sortOrder: 4, isBuiltIn: true },
    { name: 'Rosh Chodesh', hebrewName: 'ראש חודש', color: '#00BCD4', sortOrder: 5, isBuiltIn: true },
  ];

  for (const group of scheduleGroups) {
    await db.scheduleGroup.create({
      data: { orgId: org.id, ...group },
    });
  }

  console.log(`Created ${scheduleGroups.length} schedule groups`);

  const sampleMinyans = [
    { name: 'Shacharit', hebrewName: 'שחרית', type: 'shacharit', fixedTime: '07:00', sortOrder: 0 },
    { name: 'Mincha', hebrewName: 'מנחה', type: 'mincha', baseZman: 'mincha_gedola', offset: 0, sortOrder: 1 },
    { name: 'Maariv', hebrewName: 'מעריב', type: 'maariv', baseZman: 'tzais', offset: 10, sortOrder: 2 },
  ];

  for (const minyan of sampleMinyans) {
    await db.minyanSchedule.create({
      data: {
        orgId: org.id,
        name: minyan.name,
        hebrewName: minyan.hebrewName,
        type: minyan.type,
        fixedTime: minyan.fixedTime ?? null,
        baseZman: minyan.baseZman ?? null,
        offset: minyan.offset ?? 0,
        roundTo: 5,
        dayOfWeekMask: '1111111',
        isActive: true,
        sortOrder: minyan.sortOrder,
      },
    });
  }

  console.log(`Created ${sampleMinyans.length} minyan schedules`);

  await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: '$placeholder_change_me',
      orgId: org.id,
      role: 'admin',
    },
  });

  console.log('Created default admin user');
  console.log('Seed complete!');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
