export function assistantStreamError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/credit balance|insufficient.*credits|billing|purchase credits/i.test(message)) {
    return "The AI provider has run out of credits. Check its billing balance before trying again.";
  }
  if (/unauthorized|invalid.*key|authentication/i.test(message)) {
    return "The AI connection could not authenticate. Check your AI connection in Settings → Integrations.";
  }
  if (/rate.?limit|too many requests/i.test(message)) {
    return "The AI provider is busy. Please wait before trying again.";
  }
  return "The assistant could not complete this request. Please try again; if it continues, check your AI connection in Settings → Integrations.";
}