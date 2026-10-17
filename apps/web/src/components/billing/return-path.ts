/** A same-site path to come back to, never an open redirect. */
export function safeReturnPath(value: string | null | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/rooms";
}
