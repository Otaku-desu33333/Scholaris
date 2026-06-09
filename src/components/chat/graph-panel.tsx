"use client";

import { useEffect, useRef, useState } from "react";
import functionPlot, { type FunctionPlotOptions } from "function-plot";
import { normalizeGraphExpression } from "@/lib/math/notation";

type GraphPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GraphPanel({ isOpen, onClose }: GraphPanelProps) {
  const [draft, setDraft] = useState("");
  const [plottedExpression, setPlottedExpression] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !plottedExpression) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      drawGraph(container, plottedExpression);
    });

    resizeObserver.observe(container);
    drawGraph(container, plottedExpression);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen, plottedExpression]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = normalizeGraphExpression(draft);

    if ("error" in normalized) {
      setGraphError(normalized.error ?? "That function could not be graphed.");
      return;
    }

    if (containerRef.current) {
      try {
        drawGraph(containerRef.current, normalized.expression);
      } catch {
        setGraphError("That function could not be graphed. Try a simpler expression in x.");
        return;
      }
    }

    setPlottedExpression(normalized.expression);
    setGraphError(null);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="mx-6 mt-4 rounded-[1.75rem] border border-slate-900/8 bg-slate-50/80 shadow-sm">
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Graph a function</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Plot a function in x when a visual helps.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Graph a function
            </span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="y = x² - 4x + 3"
              className="w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Plot
          </button>
        </form>

        {graphError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {graphError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-900/8 bg-white">
          {plottedExpression ? (
            <div ref={containerRef} className="h-[320px] w-full bg-white" />
          ) : (
            <div className="flex h-[320px] items-center justify-center px-6 text-center text-sm text-slate-500">
              Enter a function and press Plot.
            </div>
          )}
        </div>

        <p className="text-xs leading-6 text-slate-500">
          Drag to pan and use the mouse wheel or trackpad to zoom.
        </p>
      </div>
    </div>
  );
}

function drawGraph(container: HTMLDivElement, expression: string) {
  container.innerHTML = "";

  const width = Math.max(280, Math.floor(container.clientWidth || 320));
  const options: FunctionPlotOptions = {
    target: container,
    width,
    height: 320,
    grid: true,
    xAxis: {
      label: "x",
      domain: [-10, 10],
    },
    yAxis: {
      label: "y",
      domain: [-10, 10],
    },
    tip: {
      xLine: true,
      yLine: true,
      renderer: (x, y) =>
        `x = ${x.toFixed(2)}, y = ${Number.isFinite(y) ? y.toFixed(2) : "undefined"}`,
    },
    data: [
      {
        fn: expression,
        graphType: "polyline",
        sampler: "builtIn",
        color: "#f59e0b",
      },
    ],
  };

  functionPlot(options);
}
