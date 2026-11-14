import { z } from "zod";
import { GOVERNORATES } from "./constants";

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.\-()]/g, ""))
  .refine((v) => /^(\+216|00216)?[2-9]\d{7}$/.test(v), "Numéro de téléphone tunisien invalide (8 chiffres).");

export const emailSchema = z.string().trim().toLowerCase().max(160).pipe(z.email("Adresse e-mail invalide."));
export const nameSchema = z.string().trim().min(2, "Nom trop court.").max(80, "Nom trop long.");
export const passwordSchema = z.string().min(8, "8 caractères minimum.").max(128, "128 caractères maximum.");
export const governorateSchema = z.enum(GOVERNORATES, "Choisissez un gouvernorat.");
export const optionalText = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`).optional().or(z.literal("")).transform((v) => v || undefined);
