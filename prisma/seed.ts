import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export async function main() {
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // ROLE
  await prisma.role.create({
    data: {
      role: "ADMIN",
    },
  });

  // USER
  const admin = await prisma.user.create({
    data: {
      firstName: "Mario",
      lastName: "Rossi",
      email: "admin@example.com",
      password: hashedPassword,
      role: {
        connect: {
          role: "ADMIN",
        },
      },
    },
  });

  // DELIVERY STATES
  await prisma.deliveryState.createMany({
    data: [
      { id: "CREATA" },
      { id: "RITIRATA" },
      { id: "IN_CONSEGNA" },
      { id: "CONSEGNATA" },
      { id: "ANNULLATA" },
    ],
  });

  // CUSTOMERS
  const customer1 = await prisma.customer.create({
    data: {
      firstName: "Giuseppe",
      lastName: "Verdi",
      address: "Via Roma",
      number: 10,
      city: "Padova",
      province: "PD",
      phoneNumber: "3331111111",
      email: "giuseppe.verdi@example.com",
      notes: "Citofono Verdi",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      firstName: "Anna",
      lastName: "Bianchi",
      address: "Via Venezia",
      number: 25,
      city: "Padova",
      province: "PD",
      phoneNumber: "3332222222",
      email: "anna.bianchi@example.com",
      notes: "Consegna al piano terra",
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      firstName: "Marco",
      lastName: "Neri",
      address: "Via Milano",
      number: 5,
      city: "Vicenza",
      province: "VI",
      phoneNumber: "3333333333",
      email: "marco.neri@example.com",
      notes: "Telefonare prima della consegna",
    },
  });

  // DELIVERIES
  await prisma.delivery.createMany({
    data: [
      {
        customerId: customer1.id,
        userId: admin.id,
        stateId: "CREATA",
        pickupDate: new Date("2026-06-01T09:00:00"),
        deliveryDate: new Date("2026-06-02T14:00:00"),
        deliveryKey: "DEL-000001",
      },
      {
        customerId: customer2.id,
        userId: admin.id,
        stateId: "IN_CONSEGNA",
        pickupDate: new Date("2026-06-01T08:00:00"),
        deliveryDate: new Date("2026-06-01T17:00:00"),
        deliveryKey: "DEL-000002",
      },
      {
        customerId: customer3.id,
        userId: admin.id,
        stateId: "CONSEGNATA",
        pickupDate: new Date("2026-05-29T09:30:00"),
        deliveryDate: new Date("2026-05-30T11:15:00"),
        deliveryKey: "DEL-000003",
      },
    ],
  });

  console.log("Seed completato");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });