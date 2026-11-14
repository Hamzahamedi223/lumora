import type { OrderStatus, PaymentMethod, PaymentStatus, RequestStatus, RequestType } from "@prisma/client";

export const BRAND = "Lumora";

export const GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan", "Kasserine",
  "Kébili", "Le Kef", "Mahdia", "La Manouba", "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid",
  "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
] as const;

export type Tone = "amber" | "blue" | "violet" | "green" | "red" | "zinc";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  RETURNED: "Retournée",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING: "amber",
  CONFIRMED: "blue",
  SHIPPED: "violet",
  DELIVERED: "green",
  CANCELLED: "red",
  RETURNED: "zinc",
};

/** Allowed manual transitions in the admin. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Paiement à la livraison",
  BANK_TRANSFER: "Virement bancaire",
  D17: "D17",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Non payée",
  PAID: "Payée",
  REFUNDED: "Remboursée",
};

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  LAMP: "Luminaire",
  WALL_ART: "Art mural",
  OTHER: "Autre objet",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  NEW: "Nouvelle",
  REVIEWING: "En étude",
  QUOTED: "Devis envoyé",
  ACCEPTED: "Acceptée",
  IN_PRODUCTION: "En fabrication",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const REQUEST_STATUS_TONE: Record<RequestStatus, Tone> = {
  NEW: "amber",
  REVIEWING: "blue",
  QUOTED: "violet",
  ACCEPTED: "blue",
  IN_PRODUCTION: "violet",
  COMPLETED: "green",
  CANCELLED: "red",
};

export const LOW_STOCK = 3;
export const MAX_QTY_PER_LINE = 10;
