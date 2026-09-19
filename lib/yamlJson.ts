import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export interface ConvertError {
  error: string;
}

export function yamlToJson(input: string): string | ConvertError {
  if (!input.trim()) {
    return { error: "Paste some YAML to convert it." };
  }
  let data: unknown;
  try {
    data = parseYaml(input);
  } catch (err) {
    return { error: `Invalid YAML: ${(err as Error).message}` };
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return { error: `Could not serialize as JSON: ${(err as Error).message}` };
  }
}

export function jsonToYaml(input: string): string | ConvertError {
  if (!input.trim()) {
    return { error: "Paste some JSON to convert it." };
  }
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (err) {
    return { error: `Invalid JSON: ${(err as Error).message}` };
  }
  try {
    return stringifyYaml(data);
  } catch (err) {
    return { error: `Could not serialize as YAML: ${(err as Error).message}` };
  }
}

export function isConvertError(
  result: string | ConvertError,
): result is ConvertError {
  return typeof result !== "string";
}
