"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action";
import { buttonClass, cn } from "./ui";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  name?: string;
  value?: string;
  formAction?: (fd: FormData) => void;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || rest.disabled} aria-busy={pending} {...rest} className={buttonClass(variant, size, className)}>
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormAlert({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {state.error}
      </div>
    );
  if (state.ok && state.message)
    return (
      <div role="status" className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        {state.message}
      </div>
    );
  return null;
}

/**
 * Generic form bound to a server action through useActionState.
 * Children receive the current state (field errors, echoed values).
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  showAlert = true,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: (state: ActionState) => ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  showAlert?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={cn("space-y-5", className)} noValidate>
      {showAlert ? <FormAlert state={state} /> : null}
      {children(state)}
    </form>
  );
}
