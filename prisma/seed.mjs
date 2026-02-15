import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoEmail = process.env.DEMO_USER_EMAIL ?? "demo@drift.local";
  const demoName = process.env.DEMO_USER_NAME ?? "Demo User";

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      name: demoName
    },
    create: {
      email: demoEmail,
      name: demoName,
      timezone: "UTC"
    }
  });

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      reminderHourLocal: 20,
      notificationsEnabled: true
    }
  });

  console.log(`Seeded demo user: ${user.email} (${user.id})`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
