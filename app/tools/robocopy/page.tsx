"use client";

import { useState } from "react";
import { buildRobocopyCommand, isRobocopyError } from "@/lib/robocopy";
import { ToolHeader } from "@/components/ToolHeader";
import { CopyButton } from "@/components/CopyButton";

export default function RobocopyPage() {
  const [source, setSource] = useState("C:\\Data");
  const [destination, setDestination] = useState("D:\\Backup");
  const [mirror, setMirror] = useState(true);
  const [copySubdirs, setCopySubdirs] = useState(false);
  const [restartable, setRestartable] = useState(false);
  const [multithreaded, setMultithreaded] = useState(true);
  const [threadCount, setThreadCount] = useState(8);
  const [retries, setRetries] = useState(3);
  const [waitSeconds, setWaitSeconds] = useState(5);
  const [verbose, setVerbose] = useState(false);
  const [excludeFiles, setExcludeFiles] = useState("");
  const [excludeDirs, setExcludeDirs] = useState("");
  const [logPath, setLogPath] = useState("");

  const result = buildRobocopyCommand({
    source,
    destination,
    mirror,
    copySubdirs,
    restartable,
    multithreaded,
    threadCount,
    retries,
    waitSeconds,
    verbose,
    excludeFiles,
    excludeDirs,
    logPath,
  });
  const error = isRobocopyError(result) ? result.error : null;
  const command = !isRobocopyError(result) ? result : null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Robocopy builder
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Fill in source, destination, and options to generate a Robocopy
        command. Built with our own logic — no library or API involved.
      </p>

      <div className="mb-6 flex flex-col gap-4 text-[13px]">
        <label className="flex flex-col gap-1">
          <span className="text-text-faint">Source</span>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            className="w-full border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text-faint">Destination</span>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            spellCheck={false}
            className="w-full border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={mirror}
            onChange={(e) => setMirror(e.target.checked)}
          />
          <span className="text-text-dim">Mirror (/MIR)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={copySubdirs}
            disabled={mirror}
            onChange={(e) => setCopySubdirs(e.target.checked)}
          />
          <span className={mirror ? "text-text-faint" : "text-text-dim"}>
            Copy subdirs (/E)
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={restartable}
            onChange={(e) => setRestartable(e.target.checked)}
          />
          <span className="text-text-dim">Restartable (/Z)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={verbose}
            onChange={(e) => setVerbose(e.target.checked)}
          />
          <span className="text-text-dim">Verbose (/V)</span>
        </label>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={multithreaded}
            onChange={(e) => setMultithreaded(e.target.checked)}
          />
          <span className="text-text-dim">Multithreaded (/MT)</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-text-faint">threads</span>
          <input
            type="number"
            min={1}
            max={128}
            value={threadCount}
            disabled={!multithreaded}
            onChange={(e) => setThreadCount(Number(e.target.value))}
            className="w-14 border-0 border-b border-line bg-transparent py-1 font-mono text-text focus:border-accent focus:outline-none disabled:text-text-faint"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-text-faint">retries (/R)</span>
          <input
            type="number"
            min={0}
            max={1000000}
            value={retries}
            onChange={(e) => setRetries(Number(e.target.value))}
            className="w-16 border-0 border-b border-line bg-transparent py-1 font-mono text-text focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-text-faint">wait secs (/W)</span>
          <input
            type="number"
            min={0}
            max={3600}
            value={waitSeconds}
            onChange={(e) => setWaitSeconds(Number(e.target.value))}
            className="w-16 border-0 border-b border-line bg-transparent py-1 font-mono text-text focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <div className="mb-8 flex flex-col gap-4 text-[13px]">
        <label className="flex flex-col gap-1">
          <span className="text-text-faint">Exclude files (/XF, space-separated)</span>
          <input
            type="text"
            value={excludeFiles}
            onChange={(e) => setExcludeFiles(e.target.value)}
            placeholder="*.tmp *.log"
            spellCheck={false}
            className="w-full border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text-faint">Exclude dirs (/XD, space-separated)</span>
          <input
            type="text"
            value={excludeDirs}
            onChange={(e) => setExcludeDirs(e.target.value)}
            placeholder="node_modules .git"
            spellCheck={false}
            className="w-full border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text-faint">Log file (/LOG, optional)</span>
          <input
            type="text"
            value={logPath}
            onChange={(e) => setLogPath(e.target.value)}
            placeholder="C:\Logs\robocopy.log"
            spellCheck={false}
            className="w-full border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </label>
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
