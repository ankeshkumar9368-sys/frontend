"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileText,
  Loader2,
  Presentation,
  Sparkles,
  Wand2,
} from "lucide-react";

type FormatResult = {
  presentationId: string;
  presentationTitle?: string;
  mode: "preview" | "apply";
  applied: boolean;
  requestsCount: number;
  summary: string[];
  editUrl: string;
  automationScript?: string;
  setupSteps?: string[];
  slideStatuses?: string[];
};

export default function SlidesFormatterPage() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FormatResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [progressRows, setProgressRows] = useState<string[]>([]);

  const runFormatter = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setProgressRows([
      "Reading Google Slides link",
      "Extracting presentation ID",
      "Starting textbook formatter",
    ]);

    try {
      window.setTimeout(() => {
        setProgressRows((rows) => [...rows, "Checking server formatter access"]);
      }, 350);

      const response = await fetch("/api/slides/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link, mode: "apply" }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not format slides.");
      setResult(data);
      setProgressRows(data.slideStatuses || ["Formatter finished"]);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copyScript = async () => {
    if (!result?.automationScript) return;
    await navigator.clipboard.writeText(result.automationScript);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="mobile-container bg-slate-50 text-slate-950">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-cyan-700">
            Slides Tool
          </p>
          <h1 className="truncate text-xl font-black">Textbook Auto Format</h1>
        </div>
      </div>

      <section className="flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white">
              <Presentation className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">Paste Google Slides Link</h2>
              <p className="text-sm font-semibold text-slate-600">
                Works now with Apps Script. Direct API automation can be added later.
              </p>
            </div>
          </div>

          <textarea
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://docs.google.com/presentation/d/..."
            className="min-h-[104px] w-full resize-none rounded-xl border border-cyan-200 bg-white p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <button
            onClick={runFormatter}
            disabled={loading || !link.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {loading ? "Processing Slides" : "Create Formatter"}
          </button>
        </div>

        {(loading || progressRows.length > 0) && (
          <div className="mt-5 rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-cyan-700">
                  Live Status
                </p>
                <h3 className="text-base font-black">
                  {loading ? "Processing started" : "Processing report"}
                </h3>
              </div>
              {loading && <Loader2 className="h-5 w-5 animate-spin text-cyan-700" />}
            </div>

            <div className="space-y-2">
              {progressRows.map((row, index) => (
                <div key={`${row}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    loading && index === progressRows.length - 1
                      ? "bg-cyan-600 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-700">{row}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          {[
            "White textbook background with readable spacing",
            "Bold chapter-style headings and clean body text",
            "Consistent font, line height, borders, and title blocks",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span className="text-sm font-bold text-slate-700">{item}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                {result.applied ? <Sparkles className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
                  {result.applied ? "Formatted by API" : "Script Ready"}
                </p>
                <h3 className="text-base font-black">
                  {result.presentationTitle || "Google Slides Deck"}
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {result.summary.map((item) => (
                <p key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                  {item}
                </p>
              ))}
            </div>

            <a
              href={result.editUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-4 text-sm font-black text-white"
            >
              Open Google Slides
              <ExternalLink className="h-4 w-4" />
            </a>

            {!result.applied && result.automationScript && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-black text-slate-900">Run inside Google Slides</h4>
                  <button
                    onClick={copyScript}
                    className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white"
                  >
                    <Clipboard className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mb-3 space-y-2">
                  {(result.setupSteps || []).map((step, index) => (
                    <div key={step} className="flex gap-2 text-xs font-bold text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] text-cyan-800">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <pre className="max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] font-semibold leading-relaxed text-cyan-50">
                  {result.automationScript}
                </pre>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
