export type KubectlOperation =
  | "get"
  | "describe"
  | "logs"
  | "exec"
  | "delete"
  | "apply";

export const KUBECTL_OPERATIONS: KubectlOperation[] = [
  "get",
  "describe",
  "logs",
  "exec",
  "delete",
  "apply",
];

export interface KubectlOptions {
  operation: KubectlOperation;
  resourceType: string;
  resourceName: string;
  namespace: string;
  allNamespaces: boolean;
  outputFormat: string;
  labelSelector: string;
  container: string;
  follow: boolean;
  previous: boolean;
  tailLines: string;
  interactive: boolean;
  execCommand: string;
  filePath: string;
  force: boolean;
}

export interface KubectlError {
  error: string;
}

function quote(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

export function buildKubectlCommand(
  options: KubectlOptions,
): string | KubectlError {
  const parts: string[] = ["kubectl", options.operation];
  const resourceType = options.resourceType.trim();
  const resourceName = options.resourceName.trim();
  const namespace = options.namespace.trim();
  const labelSelector = options.labelSelector.trim();

  switch (options.operation) {
    case "get": {
      if (!resourceType) return { error: "Resource type is required." };
      parts.push(resourceType);
      if (resourceName) parts.push(resourceName);
      if (options.allNamespaces) parts.push("-A");
      else if (namespace) parts.push("-n", namespace);
      if (labelSelector) parts.push("-l", quote(labelSelector));
      if (options.outputFormat) parts.push("-o", options.outputFormat);
      break;
    }
    case "describe": {
      if (!resourceType) return { error: "Resource type is required." };
      if (!resourceName) return { error: "Resource name is required." };
      parts.push(resourceType, resourceName);
      if (namespace) parts.push("-n", namespace);
      break;
    }
    case "logs": {
      if (!resourceName) return { error: "Pod name is required." };
      parts.push(resourceName);
      if (namespace) parts.push("-n", namespace);
      if (options.container.trim()) parts.push("-c", options.container.trim());
      if (options.follow) parts.push("-f");
      if (options.previous) parts.push("-p");
      if (options.tailLines.trim()) parts.push(`--tail=${options.tailLines.trim()}`);
      break;
    }
    case "exec": {
      if (!resourceName) return { error: "Pod name is required." };
      parts.push(resourceName);
      if (namespace) parts.push("-n", namespace);
      if (options.container.trim()) parts.push("-c", options.container.trim());
      if (options.interactive) parts.push("-it");
      const cmd = options.execCommand.trim() || "/bin/sh";
      parts.push("--", cmd);
      break;
    }
    case "delete": {
      if (!resourceType) return { error: "Resource type is required." };
      if (!resourceName && !labelSelector) {
        return { error: "Provide a resource name or a label selector." };
      }
      parts.push(resourceType);
      if (resourceName) parts.push(resourceName);
      if (namespace) parts.push("-n", namespace);
      if (labelSelector) parts.push("-l", quote(labelSelector));
      if (options.force) parts.push("--force", "--grace-period=0");
      break;
    }
    case "apply": {
      if (!options.filePath.trim()) return { error: "File path is required." };
      parts.push("-f", quote(options.filePath.trim()));
      if (namespace) parts.push("-n", namespace);
      break;
    }
  }

  return parts.join(" ");
}

export function isKubectlError(
  result: string | KubectlError,
): result is KubectlError {
  return typeof result !== "string";
}
