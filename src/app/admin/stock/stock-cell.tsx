"use client";

import { useActionState, useState } from "react";
import { adjustStockAction } from "@/server/actions/admin";
import { SubmitButton } from "@/components/form";
import { LOW_STOCK } from "@/lib/constants";

export function StockCell({ variantId, stock }: { variantId: string; stock: number }) {
  const [state, action] = useActionState(adjustStockAction, {});
  const [value, setValue] = useState(String(stock));
  const [base, setBase] = useState(stock);
  // Server value changed (after save or another sale): resync the input.
  if (stock !== base) {
    setBase(stock);
    setValue(String(stock));
  }
  const dirty = value !== String(stock);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="variantId" value={variantId} />
      <input
        name="stock"
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Stock"
        className={`h-9 w-20 rounded-lg border border-border bg-surface-2 px-2 text-sm tabular-nums ${stock === 0 ? "text-danger" : stock <= LOW_STOCK ? "text-warning" : ""}`}
      />
      {dirty ? <SubmitButton size="sm" pendingText="…">OK</SubmitButton> : null}
      {state.error ? <span className="text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}
