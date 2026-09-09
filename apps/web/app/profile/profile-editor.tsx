"use client";

import {
  ArrowLeft,
  Bell,
  Brush,
  Camera,
  Check,
  Database,
  Image as ImageIcon,
  KeyRound,
  Link2,
  LogOut,
  Minus,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  SwitchCamera,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type CustomerProfile = {
  id: string;
  contact_name: string | null;
  business_name: string;
  mobile: string;
  email: string | null;
  profile_image_url: string | null;
  gst_number: string | null;
  delivery_type: "local" | "courier";
  preferred_courier: string | null;
  delivery_code?: string;
  billing_address: BillingAddress | null;
  profile_locked: boolean;
  level: string;
  account_manager: string | null;
  security_note: string | null;
};

type BillingAddress = {
  door_no: string;
  street_name: string;
  village_city: string;
  landmark: string;
  pincode: string;
  district: string;
  state: string;
};

const EMPTY_BILLING_ADDRESS: BillingAddress = {
  door_no: "",
  street_name: "",
  village_city: "",
  landmark: "",
  pincode: "",
  district: "",
  state: "",
};

const STANDARD_COURIERS = ["DTDC", "Delhivery", "Blue Dart", "Professional Couriers", "Shiprocket"];
const DISTRICT_SHORT_CODES: Record<string, string> = {
  CHENNAI: "CHN", CHENGALPATTU: "CGL", COIMBATORE: "CBE", CUDDALORE: "CUD", DHARMAPURI: "DPI", DINDIGUL: "DGL", ERODE: "ERD", KANCHIPURAM: "KPM", KARUR: "KRR", KRISHNAGIRI: "KGI", MADURAI: "MDU", MAYILADUTHURAI: "MYL", NAGAPATTINAM: "NGT", NAMAKKAL: "NMK", NILGIRIS: "NLG", PERAMBALUR: "PBL", PUDUKKOTTAI: "PDK", RAMANATHAPURAM: "RMD", RANIPET: "RPT", SALEM: "SLM", SIVAGANGA: "SVG", TENKASI: "TKS", THANJAVUR: "TNJ", THENI: "THN", THOOTHUKKUDI: "TUT", TIRUCHIRAPPALLI: "TRY", TIRUNELVELI: "TVL", TIRUPATHUR: "TPT", TIRUPPUR: "TUP", TIRUVALLUR: "TVD", TIRUVANNAMALAI: "TVM", TIRUVARUR: "TVR", VELLORE: "VLR", VILLUPURAM: "VPM", VIRUDHUNAGAR: "VNR",
};

type StaffProfile = {
  employee_name: string;
  role: string;
  avatar_url: string | null;
  active_status: string;
};

type ProfileResponse = {
  customer: CustomerProfile;
  staff: StaffProfile;
  settings_sections: string[];
};

const SECTION_ICONS = {
  Account: UserRound,
  Profile: UserRound,
  Chats: MessageCircle,
  Notifications: Bell,
  Appearance: Brush,
  Privacy: ShieldCheck,
  Security: KeyRound,
  "Linked Devices / Sessions": Link2,
  Storage: Database,
  Logout: LogOut,
};

const SECTION_ROUTES: Record<string, string> = {
  Account: "/profile?section=account",
  Profile: "/profile",
  Chats: "/messages",
  Notifications: "/profile?section=notifications",
  Appearance: "/profile?section=appearance",
  Privacy: "/profile?section=privacy",
  Security: "/profile?section=security",
  "Linked Devices / Sessions": "/profile?section=sessions",
  Storage: "/profile?section=storage",
  Logout: "/login",
};

const FALLBACK: ProfileResponse = {
  customer: {
    id: "OR-TN-0001",
    contact_name: "Sowmiya",
    business_name: "Sowmiya Prints",
    mobile: "+919876543210",
    email: "orders@sowmiyaprints.example",
    profile_image_url: null,
    gst_number: "33ABCDE1234F1Z5",
    delivery_type: "courier",
    preferred_courier: "DTDC",
    billing_address: {
      door_no: "12/4",
      street_name: "Raven Street",
      village_city: "Chennai",
      landmark: "Near print market",
      pincode: "600001",
      district: "Chennai",
      state: "Tamil Nadu",
    },
    profile_locked: false,
    level: "Dealer",
    account_manager: "ODD RAVEN Support",
    security_note: "OTP login active",
  },
  staff: {
    employee_name: "ODD RAVEN Support",
    role: "Customer Success",
    avatar_url: null,
    active_status: "active",
  },
  settings_sections: Object.keys(SECTION_ICONS),
};

function browserApiBase() {
  if (typeof window !== "undefined" && window.location.port === "3010") {
    return "http://127.0.0.1:8010";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
}

function normaliseCustomer(customer: CustomerProfile): CustomerProfile {
  const preferredCourier = customer.preferred_courier ?? "";
  return {
    ...customer,
    profile_locked: Boolean(customer.profile_locked),
    delivery_type: customer.delivery_type === "local" ? "local" : "courier",
    preferred_courier: preferredCourier && !STANDARD_COURIERS.includes(preferredCourier) ? "Other" : preferredCourier,
    billing_address: { ...EMPTY_BILLING_ADDRESS, ...(customer.billing_address ?? {}) },
  };
}

export function ProfileEditor() {
  const apiBase = browserApiBase();
  const [profile, setProfile] = useState<ProfileResponse>(FALLBACK);
  const [form, setForm] = useState(FALLBACK.customer);
  const [customCourierName, setCustomCourierName] = useState("");
  const photoGalleryInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoCameraOpen, setPhotoCameraOpen] = useState(false);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [removePhotoOpen, setRemovePhotoOpen] = useState(false);
  const [photoEditorSource, setPhotoEditorSource] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoOffset, setPhotoOffset] = useState({ x: 0, y: 0 });
  const [photoImageRevision, setPhotoImageRevision] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const photoEditorImageRef = useRef<HTMLImageElement>(null);
  const photoEditorCanvasRef = useRef<HTMLCanvasElement>(null);
  const profileCameraVideoRef = useRef<HTMLVideoElement>(null);
  const profileCameraStreamRef = useRef<MediaStream | null>(null);
  const photoEditorObjectUrlRef = useRef<string | null>(null);
  const cropPointersRef = useRef(new Map<number, { x: number; y: number }>());
  const cropDragRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const cropPinchRef = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase}/api/customers/me`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Profile unavailable")))
      .then((data: ProfileResponse) => {
        if (cancelled) return;
        const customer = normaliseCustomer(data.customer);
        setCustomCourierName(STANDARD_COURIERS.includes(data.customer.preferred_courier ?? "") ? "" : data.customer.preferred_courier ?? "");
        setProfile({ ...data, customer });
        setForm(customer);
      })
      .catch(() => setNotice("Profile is showing local fallback until API reconnects"));
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const initials = useMemo(() => {
    const source = form.contact_name || form.business_name || "OR";
    return source.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }, [form.business_name, form.contact_name]);

  const customerDeliveryCode = useMemo(() => {
    const serial = form.id.match(/(\d{4})$/)?.[1] ?? "0001";
    const short = (value: string) => (value.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "XXX").padEnd(3, "X");
    const districtName = (form.billing_address?.district ?? "").replace(/[^A-Za-z]/g, "").toUpperCase();
    const district = DISTRICT_SHORT_CODES[districtName] ?? short(form.billing_address?.district ?? "");
    return `${form.delivery_type === "local" ? "LC" : "CO"}-${serial}-${short(form.business_name)}-${district}`;
  }, [form.billing_address?.district, form.business_name, form.delivery_type, form.id]);

  function updateField(field: keyof CustomerProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAddressField(field: keyof BillingAddress, value: string) {
    setForm((current) => ({
      ...current,
      billing_address: { ...EMPTY_BILLING_ADDRESS, ...(current.billing_address ?? {}), [field]: value },
    }));
  }

  const profileImageSource = form.profile_image_url
    ? form.profile_image_url.startsWith("/") ? `${apiBase}${form.profile_image_url}` : form.profile_image_url
    : null;

  function openPhotoSheet() {
    setPhotoSheetOpen(true);
  }

  function closePhotoEditor() {
    if (photoEditorObjectUrlRef.current) URL.revokeObjectURL(photoEditorObjectUrlRef.current);
    photoEditorObjectUrlRef.current = null;
    setPhotoEditorSource(null);
    setPhotoEditorOpen(false);
    setPhotoZoom(1);
    setPhotoRotation(0);
    setPhotoOffset({ x: 0, y: 0 });
  }

  function openPhotoEditor(source: string, objectUrl?: string) {
    if (photoEditorObjectUrlRef.current) URL.revokeObjectURL(photoEditorObjectUrlRef.current);
    photoEditorObjectUrlRef.current = objectUrl ?? null;
    setPhotoEditorSource(source);
    setPhotoZoom(1);
    setPhotoRotation(0);
    setPhotoOffset({ x: 0, y: 0 });
    setPhotoSheetOpen(false);
    setPhotoEditorOpen(true);
  }

  function chooseGalleryPhoto(file: File) {
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    const supported = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    if (!supported.includes(file.type) && !["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(extension ?? "")) {
      setNotice("Choose a JPG, PNG, WEBP, HEIC, HEIF, or GIF image");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice("Profile photo must be 10 MB or smaller");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    openPhotoEditor(objectUrl, objectUrl);
  }

  async function requestProfileCamera(facing: "user" | "environment") {
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("Camera is not supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } } });
      profileCameraStreamRef.current = stream;
      setCameraFacing(facing);
      setPhotoCameraOpen(true);
    } catch (error) {
      setPhotoCameraOpen(false);
      setNotice(error instanceof DOMException && error.name === "NotAllowedError" ? "Camera permission was denied" : "Unable to open the camera");
    }
  }

  function stopProfileCamera() {
    profileCameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    profileCameraStreamRef.current = null;
    if (profileCameraVideoRef.current) profileCameraVideoRef.current.srcObject = null;
  }

  function closeProfileCamera() {
    stopProfileCamera();
    setPhotoCameraOpen(false);
  }

  async function startProfileCamera() {
    setPhotoSheetOpen(false);
    await requestProfileCamera(cameraFacing);
  }

  async function switchProfileCamera() {
    stopProfileCamera();
    await requestProfileCamera(cameraFacing === "user" ? "environment" : "user");
  }

  function captureProfilePhoto() {
    const video = profileCameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setNotice("Camera is still starting. Try again in a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setNotice("Unable to capture the photo");
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      closeProfileCamera();
      openPhotoEditor(objectUrl, objectUrl);
    }, "image/jpeg", 0.94);
  }

  function clampPhotoOffset(offset: { x: number; y: number }, zoom = photoZoom) {
    const image = photoEditorImageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return offset;
    const cropSize = 420;
    const scale = Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight) * zoom;
    const maxX = Math.max(0, (image.naturalWidth * scale - cropSize) / 2);
    const maxY = Math.max(0, (image.naturalHeight * scale - cropSize) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, offset.x)), y: Math.max(-maxY, Math.min(maxY, offset.y)) };
  }

  function setPhotoZoomValue(value: number) {
    const nextZoom = Math.max(0.1, Math.min(4, value));
    setPhotoZoom(nextZoom);
    setPhotoOffset((offset) => clampPhotoOffset(offset, nextZoom));
  }

  function drawPhotoCanvas(size = 420) {
    const canvas = photoEditorCanvasRef.current;
    const image = photoEditorImageRef.current;
    if (!canvas || !image?.naturalWidth || !image.naturalHeight) return;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * photoZoom;
    const offsetScale = size / 420;
    context.clearRect(0, 0, size, size);
    context.save();
    context.translate(size / 2 + photoOffset.x * offsetScale, size / 2 + photoOffset.y * offsetScale);
    context.rotate((photoRotation * Math.PI) / 180);
    context.drawImage(image, -(image.naturalWidth * scale) / 2, -(image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
    context.restore();
  }

  useEffect(() => {
    if (!photoEditorOpen) return;
    drawPhotoCanvas();
  }, [photoEditorOpen, photoImageRevision, photoOffset, photoRotation, photoZoom]);

  useEffect(() => {
    if (!photoCameraOpen || !profileCameraStreamRef.current || !profileCameraVideoRef.current) return;
    const video = profileCameraVideoRef.current;
    video.srcObject = profileCameraStreamRef.current;
    void video.play().catch(() => undefined);
    return () => {
      video.srcObject = null;
    };
  }, [cameraFacing, photoCameraOpen]);

  useEffect(() => () => {
    stopProfileCamera();
    if (photoEditorObjectUrlRef.current) URL.revokeObjectURL(photoEditorObjectUrlRef.current);
  }, []);

  function openCurrentPhotoEditor() {
    if (profileImageSource) openPhotoEditor(profileImageSource);
  }

  function handlePhotoPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    cropPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (cropPointersRef.current.size === 1) {
      cropDragRef.current = { x: event.clientX, y: event.clientY, originX: photoOffset.x, originY: photoOffset.y };
    } else if (cropPointersRef.current.size === 2) {
      const points = [...cropPointersRef.current.values()];
      cropPinchRef.current = { distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), zoom: photoZoom };
      cropDragRef.current = null;
    }
  }

  function handlePhotoPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!cropPointersRef.current.has(event.pointerId)) return;
    cropPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (cropPointersRef.current.size === 2 && cropPinchRef.current) {
      const points = [...cropPointersRef.current.values()];
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const nextZoom = Math.max(0.1, Math.min(4, cropPinchRef.current.zoom * (distance / cropPinchRef.current.distance)));
      setPhotoZoomValue(nextZoom);
    } else if (cropPointersRef.current.size === 1 && cropDragRef.current) {
      const deltaX = event.clientX - cropDragRef.current.x;
      const deltaY = event.clientY - cropDragRef.current.y;
      setPhotoOffset(clampPhotoOffset({ x: cropDragRef.current.originX + deltaX, y: cropDragRef.current.originY + deltaY }));
    }
  }

  function handlePhotoPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    cropPointersRef.current.delete(event.pointerId);
    cropDragRef.current = null;
    cropPinchRef.current = null;
  }

  function renderEditedPhoto() {
    const image = photoEditorImageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return null;
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * photoZoom;
    context.translate(size / 2 + photoOffset.x * (size / 420), size / 2 + photoOffset.y * (size / 420));
    context.rotate((photoRotation * Math.PI) / 180);
    context.drawImage(image, -(image.naturalWidth * scale) / 2, -(image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
    return canvas;
  }

  async function saveEditedPhoto() {
    const canvas = renderEditedPhoto();
    if (!canvas) {
      setNotice("Photo is still loading");
      return;
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
    if (!blob) {
      setNotice("Unable to prepare the profile photo");
      return;
    }
    const localPreview = URL.createObjectURL(blob);
    const previousPhoto = form.profile_image_url;
    closePhotoEditor();
    setForm((current) => ({ ...current, profile_image_url: localPreview }));
    setPhotoUploading(true);
    setNotice("Updating profile photo...");
    try {
      const payload = new FormData();
      payload.append("photo", new File([blob], "profile-photo.webp", { type: "image/webp" }));
      const response = await fetch(`${apiBase}/api/customers/me/photo`, { method: "POST", body: payload });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Could not update profile photo");
      URL.revokeObjectURL(localPreview);
      const customer = normaliseCustomer(result.customer);
      setCustomCourierName(STANDARD_COURIERS.includes(result.customer.preferred_courier ?? "") ? "" : result.customer.preferred_courier ?? "");
      setProfile((current) => ({ ...current, customer }));
      setForm(customer);
      setNotice("Profile photo updated");
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setForm((current) => ({ ...current, profile_image_url: previousPhoto }));
      setNotice(error instanceof Error ? error.message : "Could not update profile photo");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function removeProfilePhoto() {
    setRemovePhotoOpen(false);
    setPhotoUploading(true);
    setNotice("Removing profile photo...");
    try {
      const response = await fetch(`${apiBase}/api/customers/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_image_url: null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Could not remove profile photo");
      const customer = normaliseCustomer(result.customer);
      setProfile((current) => ({ ...current, customer }));
      setForm(customer);
      setNotice("Profile photo removed");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not remove profile photo");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (form.profile_locked) {
      setNotice("Profile details are managed by staff after the first save.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const preferredCourier = form.preferred_courier === "Other" ? customCourierName.trim() : form.preferred_courier;
      if (!preferredCourier) {
        setNotice("Please enter a courier or transport name");
        setSaving(false);
        return;
      }
      const response = await fetch(`${apiBase}/api/customers/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, preferred_courier: preferredCourier }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Could not save profile");
      const customer = normaliseCustomer(result.customer);
      setCustomCourierName(STANDARD_COURIERS.includes(result.customer.preferred_courier ?? "") ? "" : result.customer.preferred_courier ?? "");
      setProfile((current) => ({ ...current, customer }));
      setForm(customer);
      setNotice("Profile saved");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell profile-shell">
      <section className="page-heading">
        <button className="profile-back-button" type="button" aria-label="Back" onClick={() => window.history.back()}><ArrowLeft size={21} /></button>
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </div>
      </section>

      {notice ? <div className="profile-notice">{notice}</div> : null}
      {form.profile_locked ? <div className="profile-lock-notice">Profile details are locked after setup. Contact staff for any changes.</div> : null}

      <section className="profile-layout">
        <form className="profile-panel" onSubmit={saveProfile}>
          <fieldset className="profile-form-fieldset" disabled={form.profile_locked}>
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <button className="profile-avatar profile-avatar-button" type="button" aria-label="Open profile photo options" onClick={openPhotoSheet}>
                {profileImageSource ? <img src={profileImageSource} alt="" crossOrigin="anonymous" /> : <span>{initials}</span>}
              </button>
              <button className="profile-photo-edit" type="button" aria-label="Edit profile photo" onClick={openPhotoSheet} disabled={photoUploading}><Pencil size={15} /></button>
              <input className="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" ref={photoGalleryInputRef} onChange={(event) => { const file = event.target.files?.[0]; if (file) chooseGalleryPhoto(file); event.currentTarget.value = ""; }} />
            </div>
            <div>
              <strong>{form.business_name}</strong>
              <small className="delivery-code">{customerDeliveryCode}</small>
            </div>
          </div>

          <div className="profile-form-grid">
            <label>
              <span>Name</span>
              <input required value={form.contact_name ?? ""} onChange={(event) => updateField("contact_name", event.target.value)} />
            </label>
            <label>
              <span>Business name</span>
              <input required value={form.business_name} onChange={(event) => updateField("business_name", event.target.value)} />
            </label>
            <label>
              <span>Phone</span>
              <input required value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} />
            </label>
            <label>
              <span>Email</span>
              <input required type="email" value={form.email ?? ""} onChange={(event) => updateField("email", event.target.value)} />
            </label>
            <label>
              <span>GST number</span>
              <input required value={form.gst_number ?? ""} onChange={(event) => updateField("gst_number", event.target.value)} />
            </label>
            <label>
              <span>Delivery type</span>
              <select required value={form.delivery_type} onChange={(event) => updateField("delivery_type", event.target.value)}>
                <option value="local">Local</option>
                <option value="courier">Courier</option>
              </select>
            </label>
            <label>
              <span>Preferred courier</span>
              <select required value={form.preferred_courier ?? ""} onChange={(event) => { updateField("preferred_courier", event.target.value); if (event.target.value !== "Other") setCustomCourierName(""); }}>
                <option value="">Select courier</option>
                <option>DTDC</option>
                <option>Delhivery</option>
                <option>Blue Dart</option>
                <option>Professional Couriers</option>
                <option>Shiprocket</option>
                <option>Other</option>
              </select>
            </label>
            {form.preferred_courier === "Other" ? (
              <label>
                <span>Courier / transport name</span>
                <input required value={customCourierName} placeholder="Type courier or transport name" onChange={(event) => setCustomCourierName(event.target.value)} />
              </label>
            ) : null}
          </div>

          <section className="billing-address-section">
            <h2>Billing address</h2>
            <div className="billing-address-grid">
              <label><span>Door No.</span><input required value={form.billing_address?.door_no ?? ""} onChange={(event) => updateAddressField("door_no", event.target.value)} /></label>
              <label><span>Street name</span><input required value={form.billing_address?.street_name ?? ""} onChange={(event) => updateAddressField("street_name", event.target.value)} /></label>
              <label><span>Village / City</span><input required value={form.billing_address?.village_city ?? ""} onChange={(event) => updateAddressField("village_city", event.target.value)} /></label>
              <label><span>Landmark</span><input required value={form.billing_address?.landmark ?? ""} onChange={(event) => updateAddressField("landmark", event.target.value)} /></label>
              <label><span>Pincode</span><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Enter 6-digit pincode" value={form.billing_address?.pincode ?? ""} onChange={(event) => updateAddressField("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
              <label><span>District</span><input required value={form.billing_address?.district ?? ""} onChange={(event) => updateAddressField("district", event.target.value)} /></label>
              <label><span>State</span><input required list="billing-states" placeholder="Type to search state" value={form.billing_address?.state ?? ""} onChange={(event) => updateAddressField("state", event.target.value)} /></label>
            </div>
            <datalist id="billing-states">
              {['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'West Bengal'].map((state) => <option key={state} value={state} />)}
            </datalist>
          </section>

          <div className="profile-actions">
            <button className="primary-action" type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
          </div>
          </fieldset>
        </form>

        <aside className="profile-side">
          <section className="profile-mini">
            <div className="section-title">
              <h2>Staff Identity</h2>
              <ShieldCheck size={18} />
            </div>
            <div className="staff-card">
              <div className="profile-avatar staff">
                {profile.staff.avatar_url ? <img src={profile.staff.avatar_url} alt="" /> : <span>OR</span>}
              </div>
              <span>
                <strong>{profile.staff.employee_name}</strong>
                <small>{profile.staff.role} / {profile.staff.active_status}</small>
              </span>
            </div>
          </section>
          <section className="profile-mini">
            <div className="section-title">
              <h2>Security</h2>
              <KeyRound size={18} />
            </div>
            <p>{form.security_note || "Password and OTP settings are active"}</p>
            <small>Password/security settings are managed from verified account flow.</small>
          </section>
          <section className="profile-mini">
            <div className="section-title">
              <h2>Contact</h2>
              <Phone size={18} />
            </div>
            <p>{form.mobile}</p>
            <small>{form.email || "No email added"}</small>
          </section>
        </aside>
      </section>

      <section className="settings-panel">
        <div className="section-title">
          <h2>Settings</h2>
          <span>No Contacts, Status, or Groups</span>
        </div>
        <div className="settings-grid">
          {profile.settings_sections.map((section) => {
            const Icon = SECTION_ICONS[section as keyof typeof SECTION_ICONS] ?? UserRound;
            return (
              <Link href={SECTION_ROUTES[section] ?? "/profile"} key={section} aria-label={section}>
                <Icon size={19} />
                <span>{section}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {photoSheetOpen ? (
        <div className="profile-photo-overlay" role="presentation">
          <section className="profile-photo-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-photo-sheet-title">
            <header>
              <h2 id="profile-photo-sheet-title">{profileImageSource ? "Profile photo" : "Add profile photo"}</h2>
              <button type="button" aria-label="Close" onClick={() => setPhotoSheetOpen(false)}><X size={20} /></button>
            </header>
            <div className="profile-photo-actions">
              <button type="button" onClick={() => { void startProfileCamera(); }}><Camera size={19} /><span>Take photo</span></button>
              <button type="button" onClick={() => photoGalleryInputRef.current?.click()}><ImageIcon size={19} /><span>Choose from gallery</span></button>
              {profileImageSource ? <button type="button" onClick={openCurrentPhotoEditor}><Pencil size={19} /><span>Edit current photo</span></button> : null}
              {profileImageSource ? <button className="danger" type="button" onClick={() => { setPhotoSheetOpen(false); setRemovePhotoOpen(true); }}><Trash2 size={19} /><span>Remove photo</span></button> : null}
            </div>
            <button className="profile-photo-cancel" type="button" onClick={() => setPhotoSheetOpen(false)}>Cancel</button>
          </section>
        </div>
      ) : null}

      {photoCameraOpen ? (
        <div className="profile-photo-overlay profile-camera-overlay" role="presentation">
          <section className="profile-camera-screen" role="dialog" aria-modal="true" aria-labelledby="profile-camera-title">
            <header>
              <button type="button" aria-label="Close camera" onClick={closeProfileCamera}><X size={23} /></button>
              <strong id="profile-camera-title">Take photo</strong>
              <span />
            </header>
            <div className="profile-camera-view">
              <video ref={profileCameraVideoRef} autoPlay muted playsInline aria-label="Camera view" />
              <div className="profile-camera-crop-ring" aria-hidden="true" />
            </div>
            <footer>
              <button type="button" onClick={() => { void switchProfileCamera(); }}><SwitchCamera size={20} />Switch camera</button>
              <button className="profile-camera-shutter" type="button" aria-label="Capture photo" onClick={captureProfilePhoto}><Camera size={28} /></button>
              <span />
            </footer>
          </section>
        </div>
      ) : null}

      {photoEditorOpen && photoEditorSource ? (
        <div className="profile-photo-overlay profile-editor-overlay" role="presentation">
          <section className="profile-photo-editor" role="dialog" aria-modal="true" aria-labelledby="profile-editor-title">
            <header>
              <button type="button" onClick={closePhotoEditor}>Cancel</button>
              <h2 id="profile-editor-title">Edit photo</h2>
              <button className="profile-editor-done" type="button" onClick={() => { void saveEditedPhoto(); }} disabled={photoUploading}><Check size={16} />Done</button>
            </header>
            <div className="profile-editor-stage">
              <img className="profile-editor-source" ref={photoEditorImageRef} src={photoEditorSource} alt="" crossOrigin="anonymous" onLoad={() => setPhotoImageRevision((revision) => revision + 1)} onError={() => setNotice("This image format cannot be edited in this browser")} />
              <canvas
                ref={photoEditorCanvasRef}
                className="profile-editor-canvas"
                aria-label="Profile photo crop area"
                onPointerDown={handlePhotoPointerDown}
                onPointerMove={handlePhotoPointerMove}
                onPointerUp={handlePhotoPointerUp}
                onPointerCancel={handlePhotoPointerUp}
                onWheel={(event) => { event.preventDefault(); setPhotoZoomValue(photoZoom - event.deltaY * 0.002); }}
              />
              <div className="profile-editor-circle" aria-hidden="true" />
            </div>
            <footer className="profile-editor-controls">
              <button type="button" onClick={() => setPhotoRotation((rotation) => (rotation + 90) % 360)}><RotateCcw size={18} />Rotate</button>
              <div className="profile-editor-zoom-controls">
                <button type="button" aria-label="Zoom out" disabled={photoZoom <= 0.1} onClick={() => setPhotoZoomValue(photoZoom - 0.1)}><Minus size={17} /></button>
                <label><span>Resize {Math.round(photoZoom * 100)}%</span><input aria-label="Resize profile photo" type="range" min="0.1" max="4" step="0.1" value={photoZoom} onChange={(event) => setPhotoZoomValue(Number(event.target.value))} /></label>
                <button type="button" aria-label="Zoom in" disabled={photoZoom >= 4} onClick={() => setPhotoZoomValue(photoZoom + 0.1)}><Plus size={17} /></button>
              </div>
              <button type="button" onClick={() => { setPhotoZoom(1); setPhotoRotation(0); setPhotoOffset({ x: 0, y: 0 }); }}><ArrowLeft size={18} />Reset</button>
            </footer>
          </section>
        </div>
      ) : null}

      {removePhotoOpen ? (
        <div className="profile-photo-overlay" role="presentation">
          <section className="profile-remove-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-photo-title">
            <h2 id="remove-photo-title">Remove profile photo?</h2>
            <p>Your profile photo will no longer be visible to other users.</p>
            <footer><button type="button" onClick={() => setRemovePhotoOpen(false)}>Cancel</button><button className="danger" type="button" onClick={() => { void removeProfilePhoto(); }}>Remove</button></footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
