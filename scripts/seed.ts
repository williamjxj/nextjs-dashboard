import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  customers,
  invoices,
  revenue,
  users,
} from "../app/lib/placeholder-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Seed users
    console.log("👤 Seeding users...");
    for (const user of users) {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: hashedPassword,
        },
      });
    }
    console.log(`✅ Seeded ${users.length} users`);

    // Seed customers
    console.log("👥 Seeding customers...");
    for (const customer of customers) {
      await prisma.customer.upsert({
        where: { id: customer.id },
        update: {},
        create: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
        },
      });
    }
    console.log(`✅ Seeded ${customers.length} customers`);

    // Clear existing invoices first
    console.log("📄 Clearing existing invoices...");
    await prisma.invoice.deleteMany({});

    // Seed invoices
    console.log("📄 Seeding invoices...");
    for (const invoice of invoices) {
      await prisma.invoice.create({
        data: {
          customerId: invoice.customer_id,
          amount: invoice.amount,
          status: invoice.status as
            | "PENDING"
            | "PAID"
            | "PARTIALLY_PAID"
            | "OVERDUE"
            | "CANCELLED",
          date: new Date(invoice.date),
        },
      });
    }
    console.log(`✅ Seeded ${invoices.length} invoices`);

    // Seed revenue
    console.log("💰 Seeding revenue...");
    for (const rev of revenue) {
      await prisma.revenue.upsert({
        where: { month: rev.month },
        update: {},
        create: {
          month: rev.month,
          revenue: rev.revenue,
        },
      });
    }
    console.log(`✅ Seeded ${revenue.length} revenue records`);

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
