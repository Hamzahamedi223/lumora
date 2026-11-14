"use client";

import { useEffect } from "react";
import { cart } from "@/components/shop/cart-store";

export function ClearCart() {
  useEffect(() => {
    cart.clear();
  }, []);
  return null;
}
