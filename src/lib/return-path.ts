// Only article URLs are accepted as post-login destinations.
export function safeReturnPath(value: unknown) {
  return typeof value === "string" && /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : "/";
}
