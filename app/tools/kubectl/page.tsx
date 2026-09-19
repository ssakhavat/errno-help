"use client";

import { useState } from "react";
import {
  buildKubectlCommand,
  isKubectlError,
  KUBECTL_OPERATIONS,
  type KubectlOperation,
} from "@/lib/kubectl";
import { ToolHeader } from "@/components/ToolHeader";
import { CopyButton } from "@/components/CopyButton";

const inputClass =
  "w-full border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      <span className="text-text-faint">{label}</span>
      {children}
    </label>
  );
}

export default function KubectlPage() {
  const [operation, setOperation] = useState<KubectlOperation>("get");
  const [resourceType, setResourceType] = useState("pods");
  const [resourceName, setResourceName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [allNamespaces, setAllNamespaces] = useState(false);
  const [outputFormat, setOutputFormat] = useState("");
  const [labelSelector, setLabelSelector] = useState("");
  const [container, setContainer] = useState("");
  const [follow, setFollow] = useState(false);
  const [previous, setPrevious] = useState(false);
  const [tailLines, setTailLines] = useState("");
  const [interactive, setInteractive] = useState(true);
  const [execCommand, setExecCommand] = useState("/bin/sh");
  const [filePath, setFilePath] = useState("");
  const [force, setForce] = useState(false);

  const result = buildKubectlCommand({
    operation,
    resourceType,
    resourceName,
    namespace,
    allNamespaces,
    outputFormat,
    labelSelector,
    container,
    follow,
    previous,
    tailLines,
    interactive,
    execCommand,
    filePath,
    force,
  });
  const error = isKubectlError(result) ? result.error : null;
  const command = !isKubectlError(result) ? result : null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        kubectl builder
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Pick an operation and fill in the fields to generate a kubectl
        command.
      </p>

      <div className="mb-6 flex flex-wrap gap-3 text-[12px]">
        {KUBECTL_OPERATIONS.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => setOperation(op)}
            className={
              op === operation
                ? "border-b border-accent pb-0.5 font-mono text-accent"
                : "border-b border-line pb-0.5 font-mono text-text-dim hover:border-accent hover:text-accent"
            }
          >
            {op}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-4">
        {(operation === "get" || operation === "describe" || operation === "delete") && (
          <Field label="Resource type">
            <input
              type="text"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              placeholder="pods, deployments, svc, ..."
              spellCheck={false}
              className={inputClass}
            />
          </Field>
        )}

        {operation !== "apply" && (
          <Field
            label={
              operation === "logs" || operation === "exec"
                ? "Pod name"
                : "Resource name (optional for get)"
            }
          >
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              spellCheck={false}
              className={inputClass}
            />
          </Field>
        )}

        {operation === "apply" && (
          <Field label="File path (-f)">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="./deployment.yaml"
              spellCheck={false}
              className={inputClass}
            />
          </Field>
        )}

        {operation === "get" ? (
          <div className="flex items-center gap-6 text-[13px]">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-text-faint">Namespace</span>
              <input
                type="text"
                value={namespace}
                disabled={allNamespaces}
                onChange={(e) => setNamespace(e.target.value)}
                spellCheck={false}
                className={`${inputClass} disabled:text-text-faint`}
              />
            </label>
            <label className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={allNamespaces}
                onChange={(e) => setAllNamespaces(e.target.checked)}
              />
              <span className="text-text-dim">All namespaces (-A)</span>
            </label>
          </div>
        ) : (
          <Field label="Namespace (-n, optional)">
            <input
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              spellCheck={false}
              className={inputClass}
            />
          </Field>
        )}

        {(operation === "get" || operation === "delete") && (
          <Field label="Label selector (-l, optional)">
            <input
              type="text"
              value={labelSelector}
              onChange={(e) => setLabelSelector(e.target.value)}
              placeholder="app=frontend"
              spellCheck={false}
              className={inputClass}
            />
          </Field>
        )}

        {operation === "get" && (
          <Field label="Output format (-o, optional)">
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className={inputClass}
            >
              <option value="">(default)</option>
              <option value="wide">wide</option>
              <option value="yaml">yaml</option>
              <option value="json">json</option>
            </select>
          </Field>
        )}

        {(operation === "logs" || operation === "exec") && (
          <Field label="Container (-c, optional)">
            <input
              type="text"
              value={container}
              onChange={(e) => setContainer(e.target.value)}
              spellCheck={false}
              className={inputClass}
            />
          </Field>
        )}

        {operation === "logs" && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={follow}
                onChange={(e) => setFollow(e.target.checked)}
              />
              <span className="text-text-dim">Follow (-f)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={previous}
                onChange={(e) => setPrevious(e.target.checked)}
              />
              <span className="text-text-dim">Previous (-p)</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-text-faint">--tail</span>
              <input
                type="text"
                value={tailLines}
                onChange={(e) => setTailLines(e.target.value)}
                placeholder="100"
                className="w-16 border-0 border-b border-line bg-transparent py-1 font-mono text-text placeholder-text-faint focus:border-accent focus:outline-none"
              />
            </label>
          </div>
        )}

        {operation === "exec" && (
          <>
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={interactive}
                onChange={(e) => setInteractive(e.target.checked)}
              />
              <span className="text-text-dim">Interactive TTY (-it)</span>
            </label>
            <Field label="Command">
              <input
                type="text"
                value={execCommand}
                onChange={(e) => setExecCommand(e.target.value)}
                spellCheck={false}
                className={inputClass}
              />
            </Field>
          </>
        )}

        {operation === "delete" && (
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
            />
            <span className="text-text-dim">
              Force (--force --grace-period=0)
            </span>
          </label>
        )}
      </div>

      {error && <p className="mb-6 text-[13px] text-accent">{error}</p>}
      {command && (
        <div className="flex items-start justify-between gap-3 border-t border-line pt-4">
          <pre className="overflow-x-auto font-mono text-[13px] leading-[1.6] text-text">
            {command}
          </pre>
          <CopyButton value={command} />
        </div>
      )}
    </div>
  );
}
