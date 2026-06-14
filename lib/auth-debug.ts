export function authLog(
  scope: string,
  message: string,
  data?: Record<string, unknown>
) {
  if (data !== undefined) {
    console.log(`[Auth:${scope}] ${message}`, data);
  } else {
    console.log(`[Auth:${scope}] ${message}`);
  }
}
