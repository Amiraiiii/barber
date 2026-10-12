import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding BLACKLINE BARBERS database...");

  // 1. Clear existing data
  await prisma.review.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.client.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.break.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.barberService.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.service.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.adminUser.deleteMany();

  // 2. Seed Services
  const haircut = await prisma.service.create({
    data: {
      name: "Signature Haircut",
      description: "Precision cut, razor line-up, wash, scalp massage & hot towel finish.",
      price: 65.0,
      durationMin: 45,
    },
  });

  const beard = await prisma.service.create({
    data: {
      name: "Beard Sculpting",
      description: "Razor edge line-up, precise trim, hot oil treatment & beard balm finish.",
      price: 45.0,
      durationMin: 30,
    },
  });

  const executive = await prisma.service.create({
    data: {
      name: "The Executive Package",
      description: "Signature haircut + Beard sculpt + luxury scalp & shoulder relaxation.",
      price: 100.0,
      durationMin: 75,
    },
  });

  const shave = await prisma.service.create({
    data: {
      name: "Royal Hot Towel Shave",
      description: "Traditional straight-razor shave with warm pre-shave oil & cold compress.",
      price: 55.0,
      durationMin: 45,
    },
  });

  // 3. Seed Barbers
  const vance = await prisma.barber.create({
    data: {
      name: "Alexander Vance",
      roleTitle: "Senior Master Barber",
      bio: "12 years of experience specializing in precision fades and classic taper cuts.",
      avatarUrl: "/images/barber-vance.jpg",
      email: "vance@blacklinebarbers.com",
      phone: "+1 555 019 2834",
    },
  });

  const cole = await prisma.barber.create({
    data: {
      name: "Dmitri Cole",
      roleTitle: "Master Craftsman",
      bio: "9 years of experience with expert razor work and executive beard sculpting.",
      avatarUrl: "/images/barber-cole.jpg",
      email: "cole@blacklinebarbers.com",
      phone: "+1 555 019 4721",
    },
  });

  const mercer = await prisma.barber.create({
    data: {
      name: "Julian Mercer",
      roleTitle: "Senior Stylist",
      bio: "7 years of experience focused on modern textured cuts and scalp treatments.",
      avatarUrl: "/images/barber-mercer.jpg",
      email: "mercer@blacklinebarbers.com",
      phone: "+1 555 019 8392",
    },
  });

  // 4. Link Barbers to Services
  const barbers = [vance, cole, mercer];
  const services = [haircut, beard, executive, shave];

  for (const barber of barbers) {
    for (const service of services) {
      await prisma.barberService.create({
        data: {
          barberId: barber.id,
          serviceId: service.id,
        },
      });
    }

    // Set working hours (Mon-Sat 10:00 - 20:00, Sun off)
    for (let day = 0; day <= 6; day++) {
      await prisma.workingHours.create({
        data: {
          barberId: barber.id,
          dayOfWeek: day,
          startTime: "10:00",
          endTime: "20:00",
          isOff: day === 0, // Sunday off
        },
      });

      // Lunch break 14:00 - 15:00 on working days
      if (day !== 0) {
        await prisma.break.create({
          data: {
            barberId: barber.id,
            dayOfWeek: day,
            startTime: "14:00",
            endTime: "15:00",
          },
        });
      }
    }
  }

  // 5. Seed Settings
  await prisma.setting.createMany({
    data: [
      { key: "brand_name", value: "BLACKLINE BARBERS" },
      { key: "booking_horizon_days", value: "30" },
      { key: "min_notice_min", value: "60" },
      { key: "currency", value: "USD" },
    ],
  });

  // 6. Seed Admin User
  await prisma.adminUser.create({
    data: {
      username: "admin",
      // Argon2 / bcrypt placeholder hash
      passwordHash: "$2b$10$EpRnTzVlqHNP0.fKbX25y.9V/7U.zY0N6uW0k5J5a6E7i8O9P0Q1R",
      role: "SUPER_ADMIN",
    },
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
