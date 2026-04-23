import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  const categories = await Promise.all([
    prisma.pizzaCategory.upsert({
      where: { name: "Classiques" },
      update: {},
      create: {
        name: "Classiques",
        description: "Les incontournables",
        sortOrder: 1,
      },
    }),
    prisma.pizzaCategory.upsert({
      where: { name: "Signatures" },
      update: {},
      create: {
        name: "Signatures",
        description: "Créations maison premium",
        sortOrder: 2,
      },
    }),
  ]);

  const extras = await Promise.all([
    prisma.extraOption.upsert({
      where: { name: "Burrata crémeuse" },
      update: {},
      create: { name: "Burrata crémeuse", priceChf: 4.5 },
    }),
    prisma.extraOption.upsert({
      where: { name: "Jambon cru" },
      update: {},
      create: { name: "Jambon cru", priceChf: 3.0 },
    }),
    prisma.extraOption.upsert({
      where: { name: "Champignons" },
      update: {},
      create: { name: "Champignons", priceChf: 2.0 },
    }),
    prisma.extraOption.upsert({
      where: { name: "Mozzarella di bufala" },
      update: {},
      create: { name: "Mozzarella di bufala", priceChf: 3.5 },
    }),
  ]);

  const pizzas = [
    {
      slug: "margherita-artisanale",
      name: "Margherita Artisanale",
      description:
        "Sauce tomate San Marzano, mozzarella fior di latte, basilic frais.",
      imageUrl:
        "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1600&auto=format&fit=crop",
      basePriceChf: 15.9,
      categoryId: categories[0].id,
    },
    {
      slug: "diavola-calabrese",
      name: "Diavola Calabrese",
      description:
        "Spianata piquante, tomate, mozzarella, huile pimentée maison.",
      imageUrl:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1600&auto=format&fit=crop",
      basePriceChf: 18.9,
      categoryId: categories[0].id,
    },
    {
      slug: "tartufo-bianco",
      name: "Tartufo Bianco",
      description:
        "Crème de truffe, mozzarella, champignons, roquette, parmesan.",
      imageUrl:
        "https://images.unsplash.com/photo-1594007654729-407eedc4be65?q=80&w=1600&auto=format&fit=crop",
      basePriceChf: 24.5,
      categoryId: categories[1].id,
    },
    {
      slug: "alpina-gruyere",
      name: "Alpina Gruyère",
      description:
        "Crème légère, gruyère AOP, oignons rouges, viande séchée des Grisons.",
      imageUrl:
        "https://images.unsplash.com/photo-1548365328-9f547fb0953e?q=80&w=1600&auto=format&fit=crop",
      basePriceChf: 22.0,
      categoryId: categories[1].id,
    },
  ];

  for (const pizzaData of pizzas) {
    const pizza = await prisma.pizza.upsert({
      where: { slug: pizzaData.slug },
      update: pizzaData,
      create: pizzaData,
    });

    const sizes = [
      { name: "Moyenne 30cm", diameterCm: 30, priceDeltaChf: 0, sortOrder: 1 },
      { name: "Grande 35cm", diameterCm: 35, priceDeltaChf: 4, sortOrder: 2 },
    ];

    for (const size of sizes) {
      await prisma.pizzaSizeOption.upsert({
        where: {
          id: `${pizza.id}-${size.name}`.replaceAll(" ", "-").toLowerCase(),
        },
        update: {},
        create: {
          id: `${pizza.id}-${size.name}`.replaceAll(" ", "-").toLowerCase(),
          pizzaId: pizza.id,
          ...size,
        },
      });
    }

    for (const extra of extras) {
      await prisma.pizzaExtra.upsert({
        where: {
          pizzaId_extraId: {
            pizzaId: pizza.id,
            extraId: extra.id,
          },
        },
        update: {},
        create: {
          pizzaId: pizza.id,
          extraId: extra.id,
        },
      });
    }
  }

  await Promise.all([
    prisma.deliveryZone.upsert({
      where: { id: "zone-lausanne-centre" },
      update: {},
      create: {
        id: "zone-lausanne-centre",
        name: "Lausanne Centre",
        postalCodes: ["1000", "1003", "1004", "1005"],
        deliveryFeeChf: 4.9,
      },
    }),
    prisma.deliveryZone.upsert({
      where: { id: "zone-lausanne-nord" },
      update: {},
      create: {
        id: "zone-lausanne-nord",
        name: "Lausanne Nord",
        postalCodes: ["1010", "1012"],
        deliveryFeeChf: 6.5,
      },
    }),
  ]);

  const adminHash = await bcrypt.hash("Admin1234!", 12);
  const staffHash = await bcrypt.hash("Staff1234!", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      fullName: "Admin Pizza Lau",
      role: UserRole.ADMIN,
      passwordHash: adminHash,
      email: "admin@pizza-lau.ch",
      phone: "+41791234567",
    },
  });

  await prisma.user.upsert({
    where: { username: "kitchen" },
    update: {},
    create: {
      username: "kitchen",
      fullName: "Staff Cuisine",
      role: UserRole.STAFF,
      passwordHash: staffHash,
      email: "kitchen@pizza-lau.ch",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
