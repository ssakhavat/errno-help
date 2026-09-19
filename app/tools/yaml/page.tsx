"use client";

import { useState } from "react";
import { jsonToYaml, yamlToJson, isConvertError } from "@/lib/yamlJson";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

const SAMPLE_YAML_PLACEHOLDER = `name: errno.help
tools:
  - cidr
  - jwt
  - hash
active: true`;

export default function YamlPage() {
  const [yamlText, setYamlText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function convertYamlToJson() {
    const result = yamlToJson(yamlText);
    if (isConvertError(result)) {
      setError(result.error);
    } else {
      setJsonText(result);
      setError(null);
    }
  }

  function convertJsonToYaml() {
    const result = jsonToYaml(jsonText);
    if (isConvertError(result)) {
      setError(result.error);
    } else {
      setYamlText(result);
      setError(null);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        YAML ⇄ JSON
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Convert between YAML and JSON, entirely in your browser. Edit either
        side, then convert in the direction you need.
      </p>

      {error && <p className="mb-6 text-[13px] text-accent">{error}</p>}

      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="m-0 text-[13px] text-text-faint">YAML</h2>
            <div className="flex items-center gap-3">
              {yamlText && <CopyButton value={yamlText} />}
              {yamlText && (
                <ClearButton
                  onClick={() => {
                    setYamlText("");
                    setError(null);
                  }}
                />
              )}
              <button
                type="button"
                onClick={convertYamlToJson}
                className="border-b border-line pb-0.5 text-[12px] text-text-dim hover:border-accent hover:text-accent"
              >
                Convert → JSON
              </button>
            </div>
          </div>
          <textarea
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
            rows={16}
            spellCheck={false}
            placeholder={SAMPLE_YAML_PLACEHOLDER}
            className="w-full resize-none border border-line bg-transparent p-3 font-mono text-[13px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="m-0 text-[13px] text-text-faint">JSON</h2>
            <div className="flex items-center gap-3">
              {jsonText && <CopyButton value={jsonText} />}
              {jsonText && (
                <ClearButton
                  onClick={() => {
                    setJsonText("");
                    setError(null);
                  }}
                />
              )}
              <button
                type="button"
                onClick={convertJsonToYaml}
                className="border-b border-line pb-0.5 text-[12px] text-text-dim hover:border-accent hover:text-accent"
              >
                Convert → YAML
              </button>
            </div>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={16}
            spellCheck={false}
            placeholder="Convert the YAML on the left, or paste JSON here."
            className="w-full resize-none border border-line bg-transparent p-3 font-mono text-[13px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
