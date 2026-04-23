import { OrderStatus, PickupMode, UserRole } from "@prisma/client";
import { z } from "zod";

const swissPostal = /^[1-9]\d{3}$/;
const swissPhone = /^\+41\d{9}$/;

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9._-]+$/, "Username invalide"),
  fullName: z.string().min(2).max(120),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir une minuscule")
    .regex(/\d/, "Le mot de passe doit contenir un chiffre")
    .regex(/[^a-zA-Z0-9]/, "Le mot de passe doit contenir un caractère spécial"),
  email: z.string().email().max(255).optional().or(z.literal("")),
  phone: z
    .string()
    .regex(swissPhone, "Format téléphone attendu: +41791234567")
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

export const cartItemSchema = z.object({
  pizzaId: z.string().cuid(),
  sizeOptionId: z.string().cuid().optional(),
  quantity: z.int().min(1).max(20),
  extras: z
    .array(
      z.object({
        extraOptionId: z.string().cuid(),
        quantity: z.int().min(1).max(5),
      }),
    )
    .optional()
    .default([]),
  notes: z.string().max(300).optional(),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().cuid(),
  quantity: z.int().min(1).max(20),
});

export const deliveryAddressSchema = z.object({
  street: z.string().min(5).max(200),
  postalCode: z.string().regex(swissPostal, "Code postal suisse invalide"),
  city: z.string().min(2).max(100),
  canton: z.string().max(5).optional(),
});

export const checkoutSchema = z
  .object({
    pickupMode: z.enum(PickupMode),
    customerName: z.string().min(2).max(120),
    customerPhone: z
      .string()
      .regex(swissPhone, "Format téléphone attendu: +41791234567")
      .optional()
      .or(z.literal("")),
    customerEmail: z.string().email().optional().or(z.literal("")),
    customerNotes: z.string().max(500).optional(),
    deliveryAddress: deliveryAddressSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.pickupMode === PickupMode.DELIVERY && !value.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Adresse requise pour la livraison",
        path: ["deliveryAddress"],
      });
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(OrderStatus),
  note: z.string().max(250).optional(),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(UserRole),
});
