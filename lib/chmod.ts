export interface ChmodPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface ChmodOptions {
  path: string;
  owner: ChmodPermissions;
  group: ChmodPermissions;
  other: ChmodPermissions;
  recursive: boolean;
}

export interface ChmodError {
  error: string;
}

export interface ChmodResult {
  octal: string;
  rwx: string;
  octalCommand: string;
  symbolicCommand: string;
}

function permsToDigit(p: ChmodPermissions): number {
  return (p.read ? 4 : 0) | (p.write ? 2 : 0) | (p.execute ? 1 : 0);
}

function permsToRwx(p: ChmodPermissions): string {
  return `${p.read ? "r" : "-"}${p.write ? "w" : "-"}${p.execute ? "x" : "-"}`;
}

function permsToSymbolicClause(letter: string, p: ChmodPermissions): string {
  const perms = `${p.read ? "r" : ""}${p.write ? "w" : ""}${p.execute ? "x" : ""}`;
  return `${letter}=${perms}`;
}

function quote(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

export function buildChmod(options: ChmodOptions): ChmodResult | ChmodError {
  const path = options.path.trim();
  if (!path) {
    return { error: "Enter a file or directory path." };
  }

  const octal = `${permsToDigit(options.owner)}${permsToDigit(options.group)}${permsToDigit(options.other)}`;
  const rwx = `${permsToRwx(options.owner)}${permsToRwx(options.group)}${permsToRwx(options.other)}`;
  const symbolicMode = [
    permsToSymbolicClause("u", options.owner),
    permsToSymbolicClause("g", options.group),
    permsToSymbolicClause("o", options.other),
  ].join(",");

  const flag = options.recursive ? " -R" : "";
  const quotedPath = quote(path);

  return {
    octal,
    rwx,
    octalCommand: `chmod${flag} ${octal} ${quotedPath}`,
    symbolicCommand: `chmod${flag} ${symbolicMode} ${quotedPath}`,
  };
}

export function isChmodError(
  result: ChmodResult | ChmodError,
): result is ChmodError {
  return "error" in result;
}
