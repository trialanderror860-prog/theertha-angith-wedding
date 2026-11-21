import { z } from "zod";

const guestName = z
  .string()
  .trim()
  .min(1, "Please enter your name.")
  .max(120, "Please keep your name under 120 characters.");

const hiddenWebsiteField = z.string().max(200).optional();

export const weddingRsvpSchema = z.object({
  guestName,
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(32, "Please enter a valid phone number.")
    .regex(/^[+\d\s().-]+$/, "Please enter a valid phone number."),
  attendance: z.enum(["accepted", "declined"]),
  guestCount: z.coerce.number().int().min(1, "Choose at least one guest.").max(100),
  message: z.string().trim().max(1000, "Please keep your message under 1,000 characters.").optional(),
  website: hiddenWebsiteField,
});

export const weddingWishSchema = z.object({
  guestName,
  message: z
    .string()
    .trim()
    .min(1, "Please write a message.")
    .max(1000, "Please keep your message under 1,000 characters."),
  website: hiddenWebsiteField,
});

export type WeddingRsvpInput = z.infer<typeof weddingRsvpSchema>;
export type WeddingWishInput = z.infer<typeof weddingWishSchema>;