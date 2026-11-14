import type { ZodError } from "zod";

/** Shared result shape for server actions used with useActionState. */
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of submitted values so forms keep their content after a validation error. */
  values?: Record<string, string>;
  /** Bumped on each successful submit; lets clients react (e.g. reset a form). */
  nonce?: number;
};

export const initialState: ActionState = {};

export function zodErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formValues(fd: FormData, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = fd.get(k);
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};
