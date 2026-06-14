/** Enable with NEXT_PUBLIC_DEBUG_AUTH=true on remote envs */
const DEBUG =
  process.env.NEXT_PUBLIC_DEBUG_AUTH === "true" ||
  process.env.NODE_ENV === "development";

export function authLog(
  scope: string,
  message: string,
  data?: Record<string, unknown>
) {
  if (!DEBUG) return;
  if (data !== undefined) {
    console.log(`[Auth:${scope}] ${message}`, data);
  } else {
    console.log(`[Auth:${scope}] ${message}`);
  }
}
