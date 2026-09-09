"use client";

import { Calculator, Eraser, FileUp, Image, MessageCircle, Redo2, Ruler, Save, Sparkles, Undo2 } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

const MAX_ARTWORK_FILES = 100;
const MAX_TOTAL_UPLOAD_BYTES = 1 * 1024 * 1024 * 1024;
const DEFAULT_IMAGE_DPI = 300;
const PREVIEW_PIXELS_PER_INCH = 96;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "tif", "tiff"]);

type ArtworkItem = {
  id: string;
  file: File;
  selected: boolean;
  width: string;
  height: string;
  aspectRatio: number | null;
  lockAspect: boolean;
  quantity: string;
  previewUrl: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function isImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type.startsWith("image/") || IMAGE_EXTENSIONS.has(extension);
}

function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Image dimensions could not be read"));
    image.src = url;
  });
}

function pixelsToInches(pixels: number) {
  return `${Math.max(0.01, pixels / DEFAULT_IMAGE_DPI).toFixed(2)} in`;
}

function measurementValue(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function NewOrderPage() {
  const [artwork, setArtwork] = useState<ArtworkItem[]>([]);
  const [groupWidth, setGroupWidth] = useState("");
  const [groupHeight, setGroupHeight] = useState("");
  const [groupQuantity, setGroupQuantity] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [previewArtwork, setPreviewArtwork] = useState<ArtworkItem | null>(null);
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);
  const [previewFuture, setPreviewFuture] = useState<string[]>([]);
  const [processingMessage, setProcessingMessage] = useState("");
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const artworkRef = useRef<ArtworkItem[]>([]);

  const selectedArtwork = useMemo(() => artwork.filter((item) => item.selected), [artwork]);
  const totalSize = useMemo(() => artwork.reduce((sum, item) => sum + item.file.size, 0), [artwork]);
  const allSelected = artwork.length > 0 && selectedArtwork.length === artwork.length;

  useEffect(() => {
    artworkRef.current = artwork;
  }, [artwork]);

  useEffect(() => () => {
    artworkRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  function updateArtwork(id: string, changes: Partial<ArtworkItem>) {
    setArtwork((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  function addArtwork(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");
    setNotice("");
    if (!files.length) return;
    if (files.some((file) => !isImage(file))) {
      setError("Upload image files only: PNG, JPG, WEBP, TIF, or TIFF.");
      return;
    }
    if (artwork.length + files.length > MAX_ARTWORK_FILES) {
      setError(`An order can include up to ${MAX_ARTWORK_FILES} images.`);
      return;
    }
    const addedSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize + addedSize > MAX_TOTAL_UPLOAD_BYTES) {
      setError("The combined artwork upload must not exceed 1 GB.");
      return;
    }
    const newItems = files.map((file) => ({
        id: globalThis.crypto?.randomUUID?.() ?? `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        selected: false,
        width: "",
        height: "",
        aspectRatio: null,
        lockAspect: true,
        quantity: "",
        previewUrl: URL.createObjectURL(file),
      }));
    setArtwork((items) => [...items, ...newItems]);
    void Promise.all(newItems.map(async (item) => {
      try {
        const dimensions = await readImageDimensions(item.previewUrl);
        updateArtwork(item.id, {
          width: pixelsToInches(dimensions.width),
          height: pixelsToInches(dimensions.height),
          aspectRatio: dimensions.width / dimensions.height,
        });
      } catch {
        // Unsupported browser preview formats can still be entered manually.
      }
    }));
  }

  function applyGroupDetails() {
    if (!selectedArtwork.length) return;
    if (!groupWidth && !groupHeight && !groupQuantity) {
      setError("Enter a width, a height, a quantity, or any combination before applying them.");
      return;
    }
    setArtwork((items) => items.map((item) => item.selected ? {
      ...item,
      width: groupWidth || item.width,
      height: groupHeight || item.height,
      quantity: groupQuantity || item.quantity,
    } : item));
    setError("");
  }

  function updateArtworkDimension(id: string, dimension: "width" | "height", value: string) {
    setArtwork((items) => items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [dimension]: value };
      if (!item.lockAspect || !item.aspectRatio) return next;
      const numericValue = measurementValue(value);
      if (!numericValue) return next;
      if (dimension === "width") next.height = `${(numericValue / item.aspectRatio).toFixed(2)} in`;
      else next.width = `${(numericValue * item.aspectRatio).toFixed(2)} in`;
      return next;
    }));
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!selectedArtwork.length) {
      setError("Select at least one artwork file for this order.");
      return;
    }
    if (selectedArtwork.some((item) => !item.width.trim() || !item.height.trim() || !item.quantity.trim())) {
      setError("Add a width, height, and quantity for every selected artwork file.");
      return;
    }
    setNotice(`${selectedArtwork.length} artwork ${selectedArtwork.length === 1 ? "file is" : "files are"} ready for ERP calculation.`);
  }

  function openArtworkPreview(item: ArtworkItem) {
    setPreviewArtwork(item);
    setPreviewHistory([]);
    setPreviewFuture([]);
    setProcessingMessage("");
    setProcessingJobId(null);
  }

  function applyPreviewTool(tool: string) {
    setPreviewHistory((history) => [...history, tool]);
    setPreviewFuture([]);
  }

  function undoPreviewTool() {
    setPreviewHistory((history) => {
      if (!history.length) return history;
      const next = [...history];
      const last = next.pop();
      if (last) setPreviewFuture((future) => [last, ...future]);
      return next;
    });
  }

  function redoPreviewTool() {
    setPreviewFuture((future) => {
      if (!future.length) return future;
      const [next, ...remaining] = future;
      setPreviewHistory((history) => [...history, next]);
      return remaining;
    });
  }

  function savePreviewChanges() {
    if (!previewArtwork) return;
    const savedPreviewUrl = previewArtwork.previewUrl;
    setArtwork((items) => items.map((item) => {
      if (item.id !== previewArtwork.id) return item;
      if (item.previewUrl !== savedPreviewUrl && item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      return { ...item, previewUrl: savedPreviewUrl, width: previewArtwork.width, height: previewArtwork.height, aspectRatio: previewArtwork.aspectRatio };
    }));
    setNotice(`${previewArtwork.file.name} changes saved.`);
    setPreviewArtwork(null);
    setProcessingMessage("");
    setProcessingJobId(null);
  }

  async function runImageProcessing(operation: "REMOVE_BG" | "UPSCALE_2X" | "UPSCALE_4X") {
    if (!previewArtwork) return;
    const formData = new FormData();
    formData.append("operation", operation);
    formData.append("upload", previewArtwork.file, previewArtwork.file.name);
    setProcessingMessage("Sending image to the Pixelcut processing queue…");
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8010";
      const response = await fetch(`${apiBase}/api/image-processing/upload`, { method: "POST", body: formData });
      const result = await response.json() as { status?: string; jobId?: string; error?: string; result?: { imageUrl?: string } };
      if (!response.ok) throw new Error(result.error || "Image processing could not be started.");
      if (!result.jobId || result.status === "FAILED") {
        setProcessingMessage(result.error || "Image processing is temporarily unavailable.");
        return;
      }
      setProcessingJobId(result.jobId);
      setProcessingMessage(result.status === "PROCESSING" ? "Processing image…" : "Waiting for an available staff processing browser…");
      const deadline = Date.now() + 4 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const statusResponse = await fetch(`${apiBase}/api/image-processing/jobs/${result.jobId}`, { cache: "no-store" });
        const statusResult = await statusResponse.json() as { status?: string; error?: string; result?: { imageUrl?: string } };
        if (statusResult.status === "COMPLETED" && statusResult.result?.imageUrl) {
          const processedPreviewUrl = `${apiBase}${statusResult.result.imageUrl}`;
          let processedDimensions: { width: number; height: number } | null = null;
          try {
            processedDimensions = await readImageDimensions(processedPreviewUrl);
          } catch {
            // Keep the processed preview even if a browser cannot inspect its dimensions.
          }
          const dimensionChanges = processedDimensions ? {
            width: pixelsToInches(processedDimensions.width),
            height: pixelsToInches(processedDimensions.height),
            aspectRatio: processedDimensions.width / processedDimensions.height,
          } : {};
          setPreviewArtwork((current) => current ? { ...current, previewUrl: processedPreviewUrl, ...dimensionChanges } : current);
          setArtwork((items) => items.map((item) => item.id === previewArtwork.id ? { ...item, ...dimensionChanges } : item));
          setPreviewHistory((history) => [...history, operation === "REMOVE_BG" ? "Background removed" : "Image upscaled"]);
          setProcessingMessage("Processing completed.");
          setProcessingJobId(null);
          return;
        }
        if (statusResult.status === "FAILED" || statusResult.status === "CANCELLED") {
          throw new Error(statusResult.error || "Image processing could not be completed. Please try again.");
        }
        setProcessingMessage(statusResult.status === "PROCESSING" ? "Processing image in the staff browser…" : "Waiting for an available staff processing browser…");
      }
      throw new Error("Image processing timed out. Please try again.");
    } catch (processingError) {
      setProcessingMessage(processingError instanceof Error ? processingError.message : "Image processing could not be started.");
      setProcessingJobId(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="page-heading">
        <FileUp size={24} />
        <div>
          <p className="eyebrow">ERP Upload Flow</p>
          <h1>New Order</h1>
        </div>
      </section>

      <section className="order-create-grid">
        <form className="auth-panel order-form artwork-order-form" onSubmit={submitOrder}>
          <div className="artwork-upload-heading">
            <div>
              <strong>Select artwork</strong>
              <small>Up to 100 images, 1 GB combined</small>
            </div>
            <label className="artwork-upload-button">
              <FileUp size={18} />
              Add images
              <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/tiff,.tif,.tiff" onChange={addArtwork} />
            </label>
          </div>

          {artwork.length ? (
            <>
              <div className="artwork-selection-summary">
                <label>
                  <input type="checkbox" checked={allSelected} onChange={(event) => setArtwork((items) => items.map((item) => ({ ...item, selected: event.target.checked })))} />
                  Select all
                </label>
                <span>{selectedArtwork.length} selected · {artwork.length}/{MAX_ARTWORK_FILES} images · {formatFileSize(totalSize)}</span>
              </div>

              <fieldset className="artwork-bulk-details" disabled={!selectedArtwork.length}>
                <legend>Apply common details to selected artwork</legend>
                <label>
                  Width
                  <span><Ruler size={17} /><input value={groupWidth} onChange={(event) => setGroupWidth(event.target.value)} placeholder="Example: 22 inch" /></span>
                </label>
                <label>
                  Height
                  <input value={groupHeight} onChange={(event) => setGroupHeight(event.target.value)} placeholder="Example: 16 inch" />
                </label>
                <label>
                  Quantity
                  <input value={groupQuantity} onChange={(event) => setGroupQuantity(event.target.value)} placeholder="Example: 10 pieces" />
                </label>
                <button type="button" onClick={applyGroupDetails}>Apply to {selectedArtwork.length || "selected"}</button>
              </fieldset>

              <div className="artwork-file-list" aria-label="Artwork files">
                {artwork.map((item, index) => (
                  <article className={`artwork-file-row ${item.selected ? "selected" : ""}`} key={item.id}>
                    <label className="artwork-checkbox">
                      <input type="checkbox" checked={item.selected} onChange={(event) => updateArtwork(item.id, { selected: event.target.checked })} aria-label={`Select ${item.file.name}`} />
                    </label>
                    <button className="artwork-thumbnail" type="button" onClick={() => openArtworkPreview(item)} aria-label={`Preview ${item.file.name}`}><img src={item.previewUrl} alt="" /></button>
                    <div className="artwork-file-name"><span><strong>{item.file.name}</strong><small>Image {index + 1} · {formatFileSize(item.file.size)}</small></span></div>
                    <label>Width<input value={item.width} onChange={(event) => updateArtworkDimension(item.id, "width", event.target.value)} placeholder="22 inch" /></label>
                    <button className={`artwork-aspect-lock ${item.lockAspect ? "locked" : ""}`} type="button" onClick={() => updateArtwork(item.id, { lockAspect: !item.lockAspect })} aria-label={`${item.lockAspect ? "Unlock" : "Lock"} proportions for ${item.file.name}`} title={item.lockAspect ? "Unlock proportions" : "Lock proportions"}>{item.lockAspect ? "🔒" : "🔓"}</button>
                    <label>Height<input value={item.height} onChange={(event) => updateArtworkDimension(item.id, "height", event.target.value)} placeholder="16 inch" /></label>
                    <label>Quantity<input value={item.quantity} onChange={(event) => updateArtwork(item.id, { quantity: event.target.value })} placeholder="10 pieces" /></label>
                    <button className="remove-artwork" type="button" onClick={() => { URL.revokeObjectURL(item.previewUrl); setPreviewArtwork((current) => current?.id === item.id ? null : current); setArtwork((items) => items.filter((entry) => entry.id !== item.id)); }} aria-label={`Remove ${item.file.name}`}>Remove</button>
                  </article>
                ))}
              </div>
            </>
          ) : <div className="artwork-empty-state"><Image size={22} /><span>Add one or more artwork images to begin.</span></div>}

          {error ? <p className="order-form-message error" role="alert">{error}</p> : null}
          {notice ? <p className="order-form-message success" role="status">{notice}</p> : null}

          <label>
            Instructions
            <textarea rows={5} placeholder="Size, background, urgency, packing note" />
          </label>
          <button className="primary-action" type="submit">
            <Calculator size={18} />
            Send To ERP Calculator
          </button>
        </form>

        {previewArtwork ? (
          <div className="artwork-preview-backdrop" role="presentation" onClick={() => setPreviewArtwork(null)}>
            <section className="artwork-preview-dialog" role="dialog" aria-modal="true" aria-label={`Preview ${previewArtwork.file.name}`} onClick={(event) => event.stopPropagation()}>
              <header><div><strong>{previewArtwork.file.name}</strong><small>Transparent artwork preview</small></div><button type="button" onClick={() => setPreviewArtwork(null)} aria-label="Close preview">×</button></header>
              <nav className="artwork-preview-toolbar" aria-label="Artwork tools">
                <button type="button" disabled={Boolean(processingJobId)} onClick={() => runImageProcessing("REMOVE_BG")}><Eraser size={17} />Background remove</button>
                <button type="button" disabled={Boolean(processingJobId)} onClick={() => runImageProcessing("UPSCALE_2X")}><Sparkles size={17} />Upscale 2x</button>
                <button type="button" onClick={() => applyPreviewTool("Sent to ChatGPT")}><MessageCircle size={17} />ChatGPT</button>
                <span className="artwork-preview-toolbar-spacer" />
                <button type="button" onClick={undoPreviewTool} disabled={!previewHistory.length} aria-label="Undo"><Undo2 size={18} />Undo</button>
                <button type="button" onClick={redoPreviewTool} disabled={!previewFuture.length} aria-label="Redo"><Redo2 size={18} />Redo</button>
              </nav>
              {previewHistory.length ? <p className="artwork-preview-status" role="status">{previewHistory[previewHistory.length - 1]}</p> : null}
              {processingMessage ? <p className="artwork-preview-status" role="status">{processingMessage}</p> : null}
              <div className="artwork-preview-stage">
                <div className="artwork-preview-boundary">
                  <img
                    src={previewArtwork.previewUrl}
                    alt={previewArtwork.file.name}
                    style={{
                      ...(measurementValue(previewArtwork.width) ? { width: `${measurementValue(previewArtwork.width)! * PREVIEW_PIXELS_PER_INCH}px` } : {}),
                      ...(measurementValue(previewArtwork.height) ? { height: `${measurementValue(previewArtwork.height)! * PREVIEW_PIXELS_PER_INCH}px` } : {}),
                    }}
                  />
                </div>
              </div>
              <footer className="artwork-preview-footer">
                <span>Save the current preview to this artwork</span>
                <button type="button" onClick={savePreviewChanges}><Save size={17} />Save changes</button>
              </footer>
            </section>
          </div>
        ) : null}

        <aside className="work-panel">
          <div className="section-title">
            <h2>Before Production</h2>
            <Image size={18} />
          </div>
          <div className="check-list">
            <span>Select the artwork files included in this order</span>
            <span>Set individual widths or apply shared width and quantity to a group</span>
            <span>ERP creates preview or gangsheet</span>
            <span>ERP returns rate and estimate</span>
            <span>Customer approves preview</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
