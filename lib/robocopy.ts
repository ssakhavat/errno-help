export interface RobocopyOptions {
  source: string;
  destination: string;
  mirror: boolean;
  copySubdirs: boolean;
  restartable: boolean;
  multithreaded: boolean;
  threadCount: number;
  retries: number;
  waitSeconds: number;
  verbose: boolean;
  excludeFiles: string;
  excludeDirs: string;
  logPath: string;
}

export interface RobocopyError {
  error: string;
}

function quote(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function buildRobocopyCommand(
  options: RobocopyOptions,
): string | RobocopyError {
  const source = options.source.trim();
  const destination = options.destination.trim();
  if (!source || !destination) {
    return { error: "Source and destination are both required." };
  }

  const parts = ["robocopy", quote(source), quote(destination)];

  // /MIR already implies recursing into subdirectories (and purging extra
  // files at the destination), so it takes precedence over a plain /E.
  if (options.mirror) {
    parts.push("/MIR");
  } else if (options.copySubdirs) {
    parts.push("/E");
  }

  if (options.restartable) parts.push("/Z");
  if (options.multithreaded) {
    parts.push(`/MT:${clampInt(options.threadCount, 1, 128, 8)}`);
  }
  parts.push(`/R:${clampInt(options.retries, 0, 1000000, 3)}`);
  parts.push(`/W:${clampInt(options.waitSeconds, 0, 3600, 5)}`);
  if (options.verbose) parts.push("/V");

  const excludeFiles = options.excludeFiles.trim();
  if (excludeFiles) {
    parts.push("/XF", ...excludeFiles.split(/\s+/).map(quote));
  }
  const excludeDirs = options.excludeDirs.trim();
  if (excludeDirs) {
    parts.push("/XD", ...excludeDirs.split(/\s+/).map(quote));
  }
  const logPath = options.logPath.trim();
  if (logPath) {
    parts.push(`/LOG:${quote(logPath)}`);
  }

  return parts.join(" ");
}

export function isRobocopyError(
  result: string | RobocopyError,
): result is RobocopyError {
  return typeof result !== "string";
}
