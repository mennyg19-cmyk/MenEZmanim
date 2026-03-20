import { getDbClient } from './client';
import { seedDemoOrganization } from './demo-seed';

const db = getDbClient();

seedDemoOrganization(db)
  .then(() => {
    console.log('Seed complete.');
  })
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
