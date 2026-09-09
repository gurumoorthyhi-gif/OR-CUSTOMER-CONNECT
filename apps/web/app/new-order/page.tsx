"use client";

import { ArrowLeft, Calculator, CheckCircle2, CloudUpload, Copy, Eraser, FileUp, Grid2X2, Image, List, LockKeyhole, MessageCircle, MoreHorizontal, Move, Redo2, RotateCcw, Ruler, Save, ShieldCheck, Sparkles, Undo2, UnlockKeyhole, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { ChangeEvent, CSSProperties, DragEvent, FormEvent, PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from "react";

import type { GangsheetResult } from "../gangsheet/engine";
import GangsheetBuilder from "./gangsheet-builder";
import { API_BASE, useConnection } from "../components/connection-setup";

const MAX_ARTWORK_FILES = 100;
const MAX_TOTAL_UPLOAD_BYTES = 1 * 1024 * 1024 * 1024;
const DEFAULT_IMAGE_DPI = 300;
const PREVIEW_PIXELS_PER_INCH = 96;
const MIN_PREVIEW_ZOOM = 0.1;
const MAX_PREVIEW_ZOOM = 5;
const PREVIEW_ZOOM_STEP = 0.25;
const PREVIEW_WHEEL_ZOOM_STEP = 0.05;
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

type PreviewSnapshot = Pick<ArtworkItem, "previewUrl" | "width" | "height" | "aspectRatio"> & {
  status: string;
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

function displayMeasurement(value: string) {
  const normalized = value.trim();
  if (!normalized) return "—";
  return /\b(in|inch|inches|cm|mm|px)\b/i.test(normalized) ? normalized : `${normalized} in`;
}

function artworkAspectRatio(item: Pick<ArtworkItem, "aspectRatio" | "width" | "height">) {
  if (item.aspectRatio && item.aspectRatio > 0) return item.aspectRatio;
  const width = measurementValue(item.width);
  const height = measurementValue(item.height);
  return width && height ? width / height : null;
}

export default function NewOrderPage() {
  const { connection, check: checkConnection } = useConnection();
  const [processingStarting, setProcessingStarting] = useState(false);
  const [artwork, setArtwork] = useState<ArtworkItem[]>([]);
  const [groupWidth, setGroupWidth] = useState("");
  const [groupHeight, setGroupHeight] = useState("");
  const [groupQuantity, setGroupQuantity] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [previewArtwork, setPreviewArtwork] = useState<ArtworkItem | null>(null);
  const [previewHistory, setPreviewHistory] = useState<PreviewSnapshot[]>([]);
  const [previewFuture, setPreviewFuture] = useState<PreviewSnapshot[]>([]);
  const [previewStatus, setPreviewStatus] = useState("Original artwork");
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sortOrder, setSortOrder] = useState("recent");
  const [gangsheetMode, setGangsheetMode] = useState(false);
  const [gangsheetResult, setGangsheetResult] = useState<GangsheetResult | null>(null);
  const [gangsheetRefreshKey, setGangsheetRefreshKey] = useState(0);
  const artworkRef = useRef<ArtworkItem[]>([]);
  const panSession = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const previewStageRef = useRef<HTMLDivElement | null>(null);

  const selectedArtwork = useMemo(() => artwork.filter((item) => item.selected), [artwork]);
  const totalSize = useMemo(() => artwork.reduce((sum, item) => sum + item.file.size, 0), [artwork]);
  const allSelected = artwork.length > 0 && selectedArtwork.length === artwork.length;
  const displayedArtwork = useMemo(() => {
    if (sortOrder === "name") return [...artwork].sort((left, right) => left.file.name.localeCompare(right.file.name));
    if (sortOrder === "size") return [...artwork].sort((left, right) => right.file.size - left.file.size);
    return artwork;
  }, [artwork, sortOrder]);
  const canCreateGangsheet = artwork.length > 0 && selectedArtwork.length === artwork.length && selectedArtwork.every((item) => measurementValue(item.width) && measurementValue(item.height) && Number.parseInt(item.quantity, 10) > 0);

  useEffect(() => {
    artworkRef.current = artwork;
  }, [artwork]);

  useEffect(() => () => {
    artworkRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  function updateArtwork(id: string, changes: Partial<ArtworkItem>) {
    setArtwork((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  function addArtworkFiles(files: File[]) {
    setError("");
    setNotice("");
    if (!files.length) return;
    const unsupportedFile = files.find((file) => !isImage(file));
    if (unsupportedFile) {
      const detectedType = unsupportedFile.type || "unknown file type";
      setError(`"${unsupportedFile.name}" was rejected as ${detectedType}. Its ${formatFileSize(unsupportedFile.size)} size is within the limit; upload PNG, JPG, WEBP, TIF, or TIFF artwork.`);
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
        selected: true,
        width: "",
        height: "",
        aspectRatio: null,
        lockAspect: true,
        quantity: "1",
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
    const requestedWidth = measurementValue(groupWidth);
    const requestedHeight = measurementValue(groupHeight);
    setArtwork((items) => items.map((item) => item.selected ? {
      ...item,
      ...(groupWidth ? { width: groupWidth } : {}),
      ...(groupHeight ? { height: groupHeight } : {}),
      ...(requestedWidth && !groupHeight && artworkAspectRatio(item) ? { height: `${(requestedWidth / artworkAspectRatio(item)!).toFixed(2)} in` } : {}),
      ...(requestedHeight && !groupWidth && artworkAspectRatio(item) ? { width: `${(requestedHeight * artworkAspectRatio(item)!).toFixed(2)} in` } : {}),
      ...(groupQuantity ? { quantity: groupQuantity } : {}),
    } : item));
    setError("");
  }

  function updateArtworkDimension(id: string, dimension: "width" | "height", value: string) {
    setArtwork((items) => items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [dimension]: value };
      const aspectRatio = artworkAspectRatio(item);
      if (!item.lockAspect || !aspectRatio) return next;
      const numericValue = measurementValue(value);
      if (!numericValue) return next;
      if (dimension === "width") next.height = `${(numericValue / aspectRatio).toFixed(2)} in`;
      else next.width = `${(numericValue * aspectRatio).toFixed(2)} in`;
      return next;
    }));
  }

  function addArtwork(event: ChangeEvent<HTMLInputElement>) {
    addArtworkFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleArtworkDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addArtworkFiles(Array.from(event.dataTransfer.files));
  }

  function duplicateArtwork(id: string) {
    const source = artwork.find((item) => item.id === id);
    if (!source || artwork.length >= MAX_ARTWORK_FILES) return;
    const duplicate: ArtworkItem = {
      ...source,
      id: globalThis.crypto?.randomUUID?.() ?? `${source.file.name}-${Date.now()}-${Math.random()}`,
      selected: false,
      previewUrl: URL.createObjectURL(source.file),
    };
    setArtwork((items) => {
      const sourceIndex = items.findIndex((item) => item.id === id);
      return [...items.slice(0, sourceIndex + 1), duplicate, ...items.slice(sourceIndex + 1)];
    });
  }

  function openGangsheetBuilder() {
    if (!canCreateGangsheet) {
      setError("Select all artwork and provide a valid width, height, and quantity before creating a gangsheet.");
      return;
    }
    setError("");
    setGangsheetMode(true);
  }

  function attachGangsheet(result: GangsheetResult) {
    setGangsheetResult(result);
    setGangsheetMode(false);
    setNotice(`Gangsheet attached to this order: ${result.totalPieces} pieces across ${(result.usedLengthMm / 25.4).toFixed(2)} in.`);
  }

  function generateGangsheetPreview() {
    setGangsheetRefreshKey((key) => key + 1);
    setNotice("");
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
    setPreviewStatus("Original artwork");
    setPreviewZoom(1);
    setPreviewPan({ x: 0, y: 0 });
    setPanMode(false);
    setProcessingMessage("");
    setProcessingJobId(null);
  }

  function fitPreviewToWindow() {
    const stage = previewStageRef.current;
    const measurements = stage?.querySelector<HTMLElement>(".artwork-preview-measurements");
    if (!stage || !measurements || !measurements.offsetWidth || !measurements.offsetHeight) return;
    const availableWidth = Math.max(1, stage.clientWidth - 56);
    const availableHeight = Math.max(1, stage.clientHeight - 56);
    const fitZoom = Math.min(availableWidth / measurements.offsetWidth, availableHeight / measurements.offsetHeight);
    setPreviewZoom(Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, Number(fitZoom.toFixed(2)))));
    setPreviewPan({ x: 0, y: 0 });
  }

  useEffect(() => {
    if (!previewArtwork) return;
    const frame = requestAnimationFrame(fitPreviewToWindow);
    return () => cancelAnimationFrame(frame);
  }, [previewArtwork?.id]);

  function adjustPreviewZoom(delta: number) {
    setPreviewZoom((zoom) => Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, Number((zoom + delta).toFixed(2)))));
  }

  function resetPreviewView() {
    setPreviewZoom(1);
    setPreviewPan({ x: 0, y: 0 });
    requestAnimationFrame(() => requestAnimationFrame(fitPreviewToWindow));
  }

  function startPreviewPan(event: PointerEvent<HTMLDivElement>) {
    const middleButtonPan = event.button === 1;
    const toolbarPan = panMode && event.button === 0;
    if (!middleButtonPan && !toolbarPan) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panSession.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: previewPan.x,
      originY: previewPan.y,
    };
  }

  function movePreviewPan(event: PointerEvent<HTMLDivElement>) {
    const session = panSession.current;
    if (!session || session.pointerId !== event.pointerId) return;
    setPreviewPan({
      x: session.originX + event.clientX - session.startX,
      y: session.originY + event.clientY - session.startY,
    });
  }

  function zoomPreviewAtWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    adjustPreviewZoom(event.deltaY < 0 ? PREVIEW_WHEEL_ZOOM_STEP : -PREVIEW_WHEEL_ZOOM_STEP);
  }

  function endPreviewPan(event: PointerEvent<HTMLDivElement>) {
    if (panSession.current?.pointerId !== event.pointerId) return;
    panSession.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function getPreviewSnapshot(item: ArtworkItem, status: string): PreviewSnapshot {
    return {
      previewUrl: item.previewUrl,
      width: item.width,
      height: item.height,
      aspectRatio: item.aspectRatio,
      status,
    };
  }

  function applyPreviewSnapshot(snapshot: PreviewSnapshot) {
    setPreviewArtwork((current) => current ? { ...current, ...snapshot } : current);
    setPreviewStatus(snapshot.status);
  }

  function applyPreviewTool(tool: string) {
    if (!previewArtwork) return;
    setPreviewHistory((history) => [...history, getPreviewSnapshot(previewArtwork, previewStatus)]);
    setPreviewFuture([]);
    setPreviewStatus(tool);
  }

  function undoPreviewTool() {
    if (!previewArtwork || !previewHistory.length || processingJobId) return;
    const previous = previewHistory[previewHistory.length - 1];
    setPreviewHistory((history) => history.slice(0, -1));
    setPreviewFuture((future) => [getPreviewSnapshot(previewArtwork, previewStatus), ...future]);
    applyPreviewSnapshot(previous);
  }

  function redoPreviewTool() {
    if (!previewArtwork || !previewFuture.length || processingJobId) return;
    const [next, ...remaining] = previewFuture;
    setPreviewFuture(remaining);
    setPreviewHistory((history) => [...history, getPreviewSnapshot(previewArtwork, previewStatus)]);
    applyPreviewSnapshot(next);
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
    if (!previewArtwork || processingStarting || processingJobId) return;
    setProcessingStarting(true);
    const formData = new FormData();
    const apiBase = API_BASE;
    setProcessingMessage("Sending image to the Pixelcut processing queue…");
    try {
      const checked = await checkConnection();
      const service = operation === "REMOVE_BG" ? checked.background : checked.upscale;
      if (!checked.backend || !service.ready) throw new Error(service.message);
      const previewResponse = await fetch(previewArtwork.previewUrl);
      if (!previewResponse.ok) throw new Error("The current preview image could not be loaded.");
      const previewBlob = await previewResponse.blob();
      const sourceFile = new File(
        [previewBlob],
        previewArtwork.file.name,
        { type: previewBlob.type || previewArtwork.file.type || "image/png" },
      );
      formData.append("operation", operation);
      formData.append("upload", sourceFile, sourceFile.name);
      const response = await fetch(`${apiBase}/api/image-processing/upload`, { method: "POST", body: formData });
      const result = await response.json() as { status?: string; jobId?: string; error?: string; detail?: string; result?: { imageUrl?: string } };
      if (!response.ok) throw new Error(result.detail || result.error || "Image processing could not be started.");
      if (!result.jobId || result.status === "FAILED") {
        setProcessingMessage(result.error || "Image processing is temporarily unavailable.");
        return;
      }
      setProcessingJobId(result.jobId);
      setProcessingMessage(result.status === "PROCESSING" ? "Processing image…" : "Waiting for an available staff processing browser…");
      const deadline = Date.now() + 4 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const statusResponse = await fetch(`${apiBase}/api/image-processing/jobs/${result.jobId}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (!statusResponse.ok) throw new Error("The processing job status could not be retrieved. Check the service connection.");
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
          const processedStatus = operation === "REMOVE_BG" ? "Background removed" : "Image upscaled";
          setPreviewHistory((history) => previewArtwork ? [...history, getPreviewSnapshot(previewArtwork, previewStatus)] : history);
          setPreviewFuture([]);
          setPreviewArtwork((current) => current ? { ...current, previewUrl: processedPreviewUrl, ...dimensionChanges } : current);
          setPreviewStatus(processedStatus);
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
      void checkConnection();
    } finally {
      setProcessingStarting(false);
    }
  }

  return (
    <main className="app-shell new-order-page">
      <header className="new-order-header">
        <div className="new-order-title-block">
          <button className="new-order-back" type="button" aria-label="Back to ERP upload flow"><ArrowLeft size={18} /> ERP Upload Flow</button>
          <h1>New Order</h1>
          <p>Add artwork images and provide details for your order.</p>
        </div>
        <nav className="new-order-steps" aria-label="Order progress">
          <div className="new-order-step active"><span>1</span><strong>Add Artwork</strong></div>
          <div className="new-order-step-line" />
          <div className="new-order-step"><span>2</span><strong>Review</strong></div>
          <div className="new-order-step-line" />
          <div className="new-order-step"><span>3</span><strong>Submit</strong></div>
        </nav>
        <button className="new-order-cancel" type="button" onClick={() => window.history.back()}>Cancel</button>
      </header>

      <section className="order-create-grid">
        <form className="auth-panel order-form artwork-order-form" onSubmit={submitOrder}>
          <section className="artwork-upload-card">
            <div className="artwork-upload-heading">
              <div className="artwork-upload-icon"><Image size={28} /></div>
              <div><strong>Select artwork</strong><small>Upload your artwork files to get started.</small></div>
            </div>
            <div className={`artwork-dropzone ${isDragging ? "drag-over" : ""}`} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }} onDrop={handleArtworkDrop}>
              <div className="artwork-drop-main">
                <CloudUpload className="artwork-cloud-icon" size={54} />
                <h2>Drag and drop artwork here</h2>
                <p>or <span>browse from your computer</span></p>
                <label className="artwork-upload-button"><Upload size={18} /> Add images<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/tiff,.tif,.tiff" onChange={addArtwork} /></label>
              </div>
              <aside className="artwork-trust-panel" aria-label="Upload information">
                <div><span className="trust-icon blue"><Upload size={19} /></span><p><strong>Up to 100 images</strong><small>1 GB combined limit</small></p></div>
                <div><span className="trust-icon green"><CheckCircle2 size={19} /></span><p><strong>High quality</strong><small>Keep original resolution</small></p></div>
                <div><span className="trust-icon purple"><ShieldCheck size={19} /></span><p><strong>Secure upload</strong><small>Your files stay private</small></p></div>
              </aside>
            </div>
          </section>

          {artwork.length ? (
            <>
              <div className="artwork-section-heading">
                <div><h2>Uploaded Images ({artwork.length})</h2><span>{selectedArtwork.length} selected</span></div>
                <div className="artwork-view-tools">
                  <label>Sort by <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="recent">Recent</option><option value="name">Name</option><option value="size">File size</option></select></label>
                  <div className="artwork-view-toggle" aria-label="Artwork view"><button className="active" type="button" aria-label="List view"><List size={18} /></button><button type="button" disabled aria-label="Grid view"><Grid2X2 size={18} /></button></div>
                </div>
              </div>
              <div className="artwork-bulk-panel">
                <div className="artwork-selection-summary">
                  <label><input type="checkbox" checked={allSelected} onChange={(event) => setArtwork((items) => items.map((item) => ({ ...item, selected: event.target.checked })))} /> Select all</label>
                  <span>{selectedArtwork.length} selected / {artwork.length} images / {formatFileSize(totalSize)}</span>
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
              </div>

              <div className="artwork-file-list" aria-label="Artwork files">
                {displayedArtwork.map((item, index) => (
                  <article className={`artwork-file-row ${item.selected ? "selected" : ""}`} key={item.id}>
                    <label className="artwork-checkbox">
                      <input type="checkbox" checked={item.selected} onChange={(event) => updateArtwork(item.id, { selected: event.target.checked })} aria-label={`Select ${item.file.name}`} />
                    </label>
                    <button className="artwork-thumbnail" type="button" onClick={() => openArtworkPreview(item)} aria-label={`Preview ${item.file.name}`}><img src={item.previewUrl} alt={item.file.name} /></button>
                    <div className="artwork-file-name"><span><strong>{item.file.name}</strong><small>Image {index + 1} · {formatFileSize(item.file.size)}</small></span></div>
                    <label className="artwork-row-field">Width (in)<input value={item.width.replace(/\s*in\s*$/i, "")} onChange={(event) => updateArtworkDimension(item.id, "width", event.target.value)} placeholder="22.00" inputMode="decimal" /></label>
                    <button className={`artwork-aspect-lock ${item.lockAspect ? "locked" : ""}`} type="button" onClick={() => updateArtwork(item.id, { lockAspect: !item.lockAspect })} aria-label={`${item.lockAspect ? "Unlock" : "Lock"} proportions for ${item.file.name}`} title={item.lockAspect ? "Unlock proportions" : "Lock proportions"}>{item.lockAspect ? <LockKeyhole size={16} /> : <UnlockKeyhole size={16} />}</button>
                    <label className="artwork-row-field">Height (in)<input value={item.height.replace(/\s*in\s*$/i, "")} onChange={(event) => updateArtworkDimension(item.id, "height", event.target.value)} placeholder="16.00" inputMode="decimal" /></label>
                    <label className="artwork-row-field">Quantity<input value={item.quantity} onChange={(event) => updateArtwork(item.id, { quantity: event.target.value })} placeholder="10" inputMode="numeric" /></label>
                    <div className="artwork-row-actions"><button type="button" aria-label={`More actions for ${item.file.name}`} title="More actions"><MoreHorizontal size={19} /></button><button type="button" onClick={() => duplicateArtwork(item.id)} disabled={artwork.length >= MAX_ARTWORK_FILES} aria-label={`Duplicate ${item.file.name}`} title="Duplicate"><Copy size={17} /></button><button className="remove-artwork" type="button" onClick={() => { URL.revokeObjectURL(item.previewUrl); setPreviewArtwork((current) => current?.id === item.id ? null : current); setArtwork((items) => items.filter((entry) => entry.id !== item.id)); }} aria-label={`Remove ${item.file.name}`} title="Remove">Remove</button></div>
                  </article>
                ))}
              </div>
            </>
          ) : <div className="artwork-empty-state"><Image size={22} /><span>Add one or more artwork images to begin.</span></div>}

          {error ? <p className="order-form-message error" role="alert">{error}</p> : null}
          {notice ? <p className="order-form-message success" role="status">{notice}</p> : null}

          {gangsheetMode ? <>
            <div className="gangsheet-generate-bar">
              <span>Generate the gangsheet using the current artwork sizes and quantities.</span>
              <button type="button" onClick={generateGangsheetPreview}><Sparkles size={17} /> Generate gangsheet</button>
            </div>
            <GangsheetBuilder
              artworks={selectedArtwork.map((item) => ({
              id: item.id,
              fileName: item.file.name,
              previewUrl: item.previewUrl,
              widthInches: measurementValue(item.width) ?? 0,
              heightInches: measurementValue(item.height) ?? 0,
              quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
              }))}
              attachedResult={gangsheetResult}
              refreshKey={gangsheetRefreshKey}
              onBack={() => setGangsheetMode(false)}
              onAttach={attachGangsheet}
            />
          </> : null}

          <label className="artwork-instructions">
            Instructions
            <textarea rows={5} placeholder="Size, background, urgency, packing note" />
          </label>
          <div className="artwork-footer-actions">
            <span>{artwork.length} {artwork.length === 1 ? "image" : "images"} / {formatFileSize(totalSize)} total</span>
            <div><label className="artwork-add-more"><FileUp size={17} /> Add more images<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/tiff,.tif,.tiff" onChange={addArtwork} /></label><button className="gangsheet-open-button" type="button" onClick={openGangsheetBuilder} disabled={!canCreateGangsheet}><Sparkles size={17} /> {gangsheetResult ? "Edit gangsheet" : "Create gangsheet"}</button><button className="primary-action" type="submit"><Calculator size={18} /> Continue to review</button></div>
          </div>
        </form>

        {previewArtwork ? (
          <div className="artwork-preview-backdrop" role="presentation" onClick={() => setPreviewArtwork(null)}>
            <section className="artwork-preview-dialog" role="dialog" aria-modal="true" aria-label={`Preview ${previewArtwork.file.name}`} onClick={(event) => event.stopPropagation()}>
              <header><div><strong>{previewArtwork.file.name}</strong><small>Transparent artwork preview</small></div><button type="button" onClick={() => setPreviewArtwork(null)} aria-label="Close preview">×</button></header>
              <nav className="artwork-preview-toolbar" aria-label="Artwork tools">
                <button type="button" disabled={processingStarting || Boolean(processingJobId) || !connection.background.ready} title={connection.background.message} onClick={() => runImageProcessing("REMOVE_BG")}><Eraser size={17} />Background remove</button>
                <button type="button" disabled={processingStarting || Boolean(processingJobId) || !connection.upscale.ready} title={connection.upscale.message} onClick={() => runImageProcessing("UPSCALE_2X")}><Sparkles size={17} />Upscale 2x</button>
                <button type="button" onClick={() => applyPreviewTool("Sent to ChatGPT")}><MessageCircle size={17} />ChatGPT</button>
                <span className="artwork-preview-toolbar-spacer" />
                <button type="button" onClick={undoPreviewTool} disabled={Boolean(processingJobId) || !previewHistory.length} aria-label="Undo"><Undo2 size={18} />Undo</button>
                <button type="button" onClick={redoPreviewTool} disabled={Boolean(processingJobId) || !previewFuture.length} aria-label="Redo"><Redo2 size={18} />Redo</button>
                <span className="artwork-preview-toolbar-divider" />
                <button type="button" onClick={() => adjustPreviewZoom(-PREVIEW_ZOOM_STEP)} disabled={previewZoom <= MIN_PREVIEW_ZOOM} aria-label="Zoom out" title="Zoom out"><ZoomOut size={17} />Zoom out</button>
                <span className="artwork-preview-zoom-value" aria-label={`Zoom ${Math.round(previewZoom * 100)} percent`}>{Math.round(previewZoom * 100)}%</span>
                <button type="button" onClick={() => adjustPreviewZoom(PREVIEW_ZOOM_STEP)} disabled={previewZoom >= MAX_PREVIEW_ZOOM} aria-label="Zoom in" title="Zoom in"><ZoomIn size={17} />Zoom in</button>
                <button type="button" onClick={resetPreviewView} aria-label="Reset preview view" title="Reset preview view"><RotateCcw size={17} />Reset</button>
                <button type="button" className={panMode ? "active" : ""} onClick={() => setPanMode((active) => !active)} aria-pressed={panMode} aria-label="Pan preview" title="Pan preview"><Move size={17} />Pan</button>
              </nav>
              {previewStatus ? <p className="artwork-preview-status" role="status">{previewStatus}</p> : null}
              {!connection.background.ready || !connection.upscale.ready ? <p className="artwork-preview-status" role="status">{!connection.background.ready ? connection.background.message : connection.upscale.message}</p> : null}
              {processingMessage ? <p className="artwork-preview-status" role="status">{processingMessage}</p> : null}
              <div
                className={`artwork-preview-stage ${panMode ? "pan-mode" : ""}`}
                ref={previewStageRef}
                onPointerDown={startPreviewPan}
                onPointerMove={movePreviewPan}
                onPointerUp={endPreviewPan}
                onPointerCancel={endPreviewPan}
                onWheel={zoomPreviewAtWheel}
              >
                <div className="artwork-preview-canvas" style={{ transform: `translate3d(calc(-50% - 57px + ${previewPan.x}px), calc(-50% - 32px + ${previewPan.y}px), 0) scale(${previewZoom})`, "--preview-zoom": previewZoom } as CSSProperties}>
                  <div className="artwork-preview-measurements" aria-label={`Artwork dimensions: ${previewArtwork.width || "not set"} by ${previewArtwork.height || "not set"}`}>
                  <div className="artwork-preview-width-measurement" aria-hidden="true">
                    <span className="artwork-preview-dimension-arrow start" />
                    <span className="artwork-preview-dimension-line" />
                    <span className="artwork-preview-dimension-value">{displayMeasurement(previewArtwork.width)}</span>
                    <span className="artwork-preview-dimension-line" />
                    <span className="artwork-preview-dimension-arrow end" />
                  </div>
                  <div className="artwork-preview-height-measurement" aria-hidden="true">
                    <span className="artwork-preview-dimension-arrow start" />
                    <span className="artwork-preview-dimension-line" />
                    <span className="artwork-preview-dimension-value">{displayMeasurement(previewArtwork.height)}</span>
                    <span className="artwork-preview-dimension-line" />
                    <span className="artwork-preview-dimension-arrow end" />
                  </div>
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
                </div>
              </div>
              <footer className="artwork-preview-footer">
                <span>Save the current preview to this artwork</span>
                <button type="button" onClick={savePreviewChanges}><Save size={17} />Save changes</button>
              </footer>
            </section>
          </div>
        ) : null}

      </section>
    </main>
  );
}
