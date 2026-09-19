import cronstrue from "cronstrue";

export interface CronError {
  error: string;
}

export function describeCron(expression: string): string | CronError {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { error: "Enter a cron expression, e.g. */15 9-17 * * 1-5" };
  }
  try {
    return cronstrue.toString(trimmed);
  } catch (caught) {
    const message = typeof caught === "string" ? caught : String(caught);
    return { error: message.replace(/^Error:\s*/, "") };
  }
}

export function isCronError(result: string | CronError): result is CronError {
  return typeof result !== "string";
}
