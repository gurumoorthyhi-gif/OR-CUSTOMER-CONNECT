"use client";

import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LoaderCircle, RotateCcw, Save, WandSparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { GangsheetArtwork, GangsheetLayoutMode, GangsheetResult, GangsheetSettings, generateGangsheet } from "../gangsheet/engine";

type GangsheetBuilderProps = {
  artworks: GangsheetArtwork[];
  attachedResult: GangsheetResult | null;
  refreshKey: number;
  onBack: () => void;
  onAttach: (result: GangsheetResult) => void;
};

function formatInches(mm: number) {
  return `${(mm / 25.4).toFixed(2)} in`;
}

function formatGenerationError(result: GangsheetResult) {
  if (result.validationErrors[0]) return result.validationErrors[0];
  const count = result.unplaced.length;
  const label = count === 1 ? "artwork file could not be placed" : "artwork files could not be placed";
  const names = result.unplaced.slice(0, 2).map((artwork) => artwork.fileName).join(", ");
  const nameDetail = names ? ` Affected artwork: ${names}.` : ".";
  return `${count} ${label} within the fixed 22.6 in roll and 100 in page length.${nameDetail}`;
}

export default function GangsheetBuilder({ artworks, attachedResult, refreshKey, onBack, onAttach }: GangsheetBuilderProps) {
  const [layoutMode, setLayoutMode] = useState<GangsheetLayoutMode>(attachedResult?.settings.layoutMode ?? "compact");
  const settings: GangsheetSettings = { sheetWidthInches: 22.6, maxLengthInches: 100, gapMm: 5, marginMm: 0, allowRotation: true, layoutMode };
  const [result, setResult] = useState<GangsheetResult | null>(attachedResult);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [generating, setGenerating] = useState(!attachedResult);
  const [error, setError] = useState("");

  function generate(nextLayoutMode = layoutMode) {
    setGenerating(true);
    setError("");
    window.setTimeout(() => {
      const next = generateGangsheet(artworks, { ...settings, layoutMode: nextLayoutMode });
      setResult(next);
      setActivePageIndex(0);
      setGenerating(false);
      if (!next.valid) setError(formatGenerationError(next));
    }, 80);
  }

  function changeLayoutMode(nextLayoutMode: GangsheetLayoutMode) {
    if (nextLayoutMode === layoutMode) return;
    setLayoutMode(nextLayoutMode);
    setResult(null);
    generate(nextLayoutMode);
  }

  useEffect(() => {
    if (attachedResult) return;
    generate();
    // Generate immediately when Create gangsheet opens the builder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!refreshKey) return;
    generate();
    // The parent increments this after the explicit Generate action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const activePage = result?.pages[activePageIndex] ?? result?.pages[0] ?? null;

  return (
    <section className="gangsheet-builder" aria-label="Auto gangsheet builder">
      <header className="gangsheet-builder-header">
        <div><button type="button" className="gangsheet-back-button" onClick={onBack}><ArrowLeft size={17} /> Back to artwork</button><h2><WandSparkles size={22} /> Auto Gangsheet</h2><p>Arrange the validated artwork into a production-ready DTF sheet.</p></div>
        <span className="gangsheet-stage-badge">Artwork confirmed</span>
      </header>

      {!result || !activePage ? (
        <div className="gangsheet-generation-state" role={error ? "alert" : "status"}>
          {generating ? <><LoaderCircle size={24} className="spin" /><strong>Generating gangsheet...</strong></> : <><strong>Gangsheet could not be generated.</strong>{error ? <span>{error}</span> : null}<button type="button" className="gangsheet-rearrange-button" onClick={() => generate()}><WandSparkles size={17} /> Generate again</button></>}
        </div>
      ) : (
        <>
          {!result.valid ? <div className="gangsheet-error-banner" role="alert"><strong>Gangsheet could not be completed.</strong><span>{error || formatGenerationError(result)}</span></div> : null}
          <div className="gangsheet-result-summary"><div><span>Roll width</span><strong>{formatInches(result.sheetWidthMm)}</strong></div><div><span>Page length</span><strong>{formatInches(activePage.usedLengthMm)}</strong></div><div><span>Artwork</span><strong>{activePage.placements.length} pieces</strong></div><div><span>Utilization</span><strong>{activePage.utilizationPercent}%</strong></div><div><span>Page</span><strong>{activePage.pageNumber} / {result.pageCount}</strong></div></div>
          <div className="gangsheet-preview-layout">
            <div className="gangsheet-preview-wrap"><div className="gangsheet-preview-toolbar"><strong>Gangsheet preview</strong><span>{activePage.valid && !result.unplaced.length ? <><CheckCircle2 size={16} /> Validated layout</> : "Review placement warnings"}</span></div><div className="gangsheet-preview-sheet" style={{ aspectRatio: `${result.sheetWidthMm} / ${Math.max(activePage.usedLengthMm, 1)}` }}>{activePage.placements.map((placement) => { const left = placement.xMm / result.sheetWidthMm * 100; const top = placement.yMm / Math.max(activePage.usedLengthMm, 1) * 100; const width = placement.widthMm / result.sheetWidthMm * 100; const height = placement.heightMm / Math.max(activePage.usedLengthMm, 1) * 100; return <div className="gangsheet-placement" key={placement.instanceId} style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }} title={`${placement.fileName} / ${placement.rotation} degrees`}><img src={artworks.find((artwork) => artwork.id === placement.artworkId)?.previewUrl} alt={placement.fileName} style={{ transform: placement.rotation === 90 ? "rotate(90deg)" : undefined }} /></div>; })}</div><div className="gangsheet-page-navigation"><button type="button" onClick={() => setActivePageIndex(0)} disabled={activePageIndex === 0} aria-label="First page"><ChevronsLeft size={16} /></button><button type="button" onClick={() => setActivePageIndex((page) => Math.max(0, page - 1))} disabled={activePageIndex === 0} aria-label="Previous page"><ChevronLeft size={16} /></button><span>{activePage.pageNumber} of {result.pageCount}</span><div className="gangsheet-page-tabs">{result.pages.map((page, index) => <button type="button" key={page.pageNumber} className={index === activePageIndex ? "active" : ""} onClick={() => setActivePageIndex(index)}>Page {page.pageNumber}</button>)}</div><button type="button" onClick={() => setActivePageIndex((page) => Math.min(result.pageCount - 1, page + 1))} disabled={activePageIndex >= result.pageCount - 1} aria-label="Next page"><ChevronRight size={16} /></button><button type="button" onClick={() => setActivePageIndex(result.pageCount - 1)} disabled={activePageIndex >= result.pageCount - 1} aria-label="Last page"><ChevronsRight size={16} /></button></div></div>
            <aside className="gangsheet-metrics-panel"><h3>Total meters</h3><p>Total material <strong>{(result.pages.reduce((sum, page) => sum + page.usedLengthMm, 0) / 1000).toFixed(2)} m</strong></p>{result.pages.map((page) => <p key={page.pageNumber}>Page {page.pageNumber} <strong>{(page.usedLengthMm / 1000).toFixed(2)} m</strong></p>)}<fieldset className="gangsheet-layout-options"><legend>Layout arrangement</legend><label className={layoutMode === "compact" ? "active" : ""}><input type="radio" name="gangsheet-layout" checked={layoutMode === "compact"} onChange={() => changeLayoutMode("compact")} /><span><strong>Compact layout</strong><small>Use the current material-efficient packing.</small></span></label><label className={layoutMode === "grouped" ? "active" : ""}><input type="radio" name="gangsheet-layout" checked={layoutMode === "grouped"} onChange={() => changeLayoutMode("grouped")} /><span><strong>Group same sizes</strong><small>Place each size group from left to right for easier cutting.</small></span></label></fieldset>{result.unplaced.length ? <p className="gangsheet-warning">{result.unplaced.length} {result.unplaced.length === 1 ? "artwork file" : "artwork files"} could not be placed.</p> : null}<button type="button" className="gangsheet-rearrange-button" onClick={() => generate()}><RotateCcw size={17} /> Generate again</button></aside>
          </div>
          <footer className="gangsheet-builder-footer"><span>Attach this validated layout to the current order.</span><button type="button" className="gangsheet-attach-button" onClick={() => onAttach(result)} disabled={!result.valid}><Save size={17} /> Attach gangsheet to new order</button></footer>
        </>
      )}
    </section>
  );
}
