"use client";

import { useEffect, useMemo, useState } from "react";
import { Eraser, LockKeyhole, RotateCcw, Save, Sparkles, UnlockKeyhole, X, ZoomIn, ZoomOut } from "lucide-react";

type Props = { designId: number; name: string; imageUrl: string; initialNotes?: string | null; onClose: () => void; onSaved: (imageUrl: string, notes: string) => void };

export default function DesignPreviewEditor({ designId, name, imageUrl, initialNotes, onClose, onSaved }: Props) {
  const [width, setWidth] = useState("12");
  const [height, setHeight] = useState("12");
  const [lockAspect, setLockAspect] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [sourceUrl, setSourceUrl] = useState(imageUrl);
  const [status, setStatus] = useState("Original artwork");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const metadata = JSON.parse(initialNotes || "{}");
      if (metadata.width) setWidth(String(metadata.width));
      if (metadata.height) setHeight(String(metadata.height));
    } catch { /* Existing designs may have plain-text notes. */ }
  }, [initialNotes]);

  const measuredWidth = Math.max(0.1, Number.parseFloat(width) || 12);
  const measuredHeight = Math.max(0.1, Number.parseFloat(height) || 12);
  const visualScale = useMemo(() => Math.min(1, 255 / (measuredWidth * 30), 255 / (measuredHeight * 30)), [measuredWidth, measuredHeight]);
  const visualWidth = measuredWidth * 30 * visualScale;
  const visualHeight = measuredHeight * 30 * visualScale;
  const aspectRatio = measuredWidth / measuredHeight;

  function changeWidth(value: string) {
    setWidth(value);
    if (lockAspect) { const next = Number.parseFloat(value); if (Number.isFinite(next) && next > 0) setHeight((next / aspectRatio).toFixed(2)); }
  }

  function changeHeight(value: string) {
    setHeight(value);
    if (lockAspect) { const next = Number.parseFloat(value); if (Number.isFinite(next) && next > 0) setWidth((next * aspectRatio).toFixed(2)); }
  }

  async function process(operation: "REMOVE_BG" | "UPSCALE_2X" | "UPSCALE_4X") {
    setBusy(true); setStatus("Starting image processing…");
    try {
      const response = await fetch(sourceUrl, { credentials: "include" });
      const blob = await response.blob();
      const form = new FormData();
      form.append("upload", new File([blob], name, { type: blob.type || "image/png" }));
      let result: Response;
      if (operation === "REMOVE_BG") result = await fetch(`/api/image-processing/designs/${designId}/remove-background`, { method: "POST", credentials: "include", body: form });
      else { form.append("scale", operation === "UPSCALE_2X" ? "2" : "4"); result = await fetch(`/api/image-processing/designs/${designId}/upscale`, { method: "POST", credentials: "include", body: form }); }
      if (!result.ok) throw new Error((await result.json().catch(() => ({}))).detail || "Image processing unavailable");
      const job = await result.json();
      await poll(job.jobId, operation === "REMOVE_BG" ? "Background removed" : operation === "UPSCALE_2X" ? "Upscaled 2x" : "Upscaled 4x");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Processing failed"); } finally { setBusy(false); }
  }

  async function poll(jobId: string, complete: string) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const response = await fetch(`/api/image-processing/jobs/${jobId}`, { cache: "no-store" });
      const job = await response.json();
      if (job.status === "COMPLETED" && job.result?.imageUrl) { setSourceUrl(job.result.imageUrl.startsWith("http") ? job.result.imageUrl : `${window.location.origin}${job.result.imageUrl}`); setStatus(complete); return; }
      if (job.status === "FAILED") throw new Error(job.error || "Image processing failed");
      setStatus(job.status === "PROCESSING" ? "Processing image…" : "Waiting for processing worker…");
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    throw new Error("Image processing timed out");
  }

  function save() { onSaved(sourceUrl, JSON.stringify({ width, height, status, updatedAt: new Date().toISOString() })); }

  return <div className="design-preview-backdrop" role="presentation"><section className="design-preview-dialog" role="dialog" aria-modal="true"><header><div><strong>{name}</strong><small>{status}</small></div><button type="button" onClick={onClose} aria-label="Close preview"><X size={20} /></button></header><nav className="design-preview-tools"><button type="button" disabled={busy} onClick={() => process("REMOVE_BG")}><Eraser size={16} />Background remove</button><button type="button" disabled={busy} onClick={() => process("UPSCALE_2X")}><Sparkles size={16} />Upscale 2x</button><button type="button" disabled={zoom <= .5} onClick={() => setZoom((value) => Math.max(.5, value - .25))}><ZoomOut size={16} />Zoom out</button><button type="button" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + .25))}><ZoomIn size={16} />Zoom in</button><button type="button" onClick={() => setZoom(1)}><RotateCcw size={16} />Reset</button></nav><div className="design-preview-stage measured"><div className="design-measure-width"><span>◀</span><b>{measuredWidth.toFixed(2)} in</b><span>▶</span></div><div className="design-measure-height"><span>▲</span><b>{measuredHeight.toFixed(2)} in</b><span>▼</span></div><div className="design-preview-canvas" style={{ transform: `scale(${zoom})` }}><img src={sourceUrl} alt={name} style={{ width: `${visualWidth}px`, height: `${visualHeight}px` }} /></div></div><div className="design-preview-fields"><label>Width (in)<input inputMode="decimal" value={width} onChange={(event) => changeWidth(event.target.value)} /></label><button className={`design-lock-button ${lockAspect ? "locked" : ""}`} type="button" onClick={() => setLockAspect((value) => !value)} aria-pressed={lockAspect} aria-label={lockAspect ? "Unlock proportions" : "Lock proportions"} title={lockAspect ? "Unlock proportions" : "Lock proportions"}>{lockAspect ? <LockKeyhole size={17} /> : <UnlockKeyhole size={17} />}</button><label>Height (in)<input inputMode="decimal" value={height} onChange={(event) => changeHeight(event.target.value)} /></label></div><p className="design-preview-status" role="status">{status}</p><footer><span>Save the current preview settings</span><button type="button" onClick={save} disabled={busy}><Save size={16} />Save changes</button></footer></section></div>;
}
