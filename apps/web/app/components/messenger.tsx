"use client";

import {
  Archive,
  Bell,
  BellOff,
  Camera,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Info,
  MoreVertical,
  Mail,
  Maximize2,
  Mic,
  NotebookPen,
  Paperclip,
  Pause,
  Pencil,
  Pin,
  Play,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  Star,
  StopCircle,
  Trash2,
  Video,
  Volume2,
  VolumeX,
  WifiOff,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, KeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type MediaAttachment = {
  id: number | string;
  url: string;
  thumbnail_url?: string | null;
  original_filename: string;
  mime_type: string;
  extension?: string | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  checksum?: string | null;
  uploaded_by?: string | null;
  uploaded_at?: string | null;
};

type PendingMedia = {
  id: string;
  file: File;
  previewUrl: string | null;
  kind: "image" | "video" | "audio" | "document";
  durationSeconds?: number | null;
};

type Message = {
  id?: number;
  client_message_id?: string | null;
  from?: string;
  sender_type?: string;
  sender_user_id?: string | null;
  message_type?: string;
  text?: string;
  body?: string;
  time?: string;
  created_at?: string;
  updated_at?: string | null;
  edited_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  reply_to_message_id?: number | null;
  reply_to_body?: string | null;
  reply_to_sender_type?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachments?: MediaAttachment[];
  deleted_at?: string | null;
  hidden_for_customer?: boolean;
  hidden_for_staff?: boolean;
  is_pinned?: boolean;
  is_starred?: boolean;
  reaction?: string | null;
  note_text?: string | null;
};

type MessengerProps = {
  messages: Message[];
  mode: "customer" | "staff";
};

type SearchHit = {
  message: Message;
  customer_name: string;
  customer_public_id: string;
  matched_attachment?: string | null;
};

type SocketEvent = {
  type: string;
  role?: string;
  online?: boolean;
  last_seen?: string | null;
  message?: Message;
  message_ids?: number[];
  read_at?: string;
  viewer_type?: string;
  preference?: ConversationPreference;
};

type ConversationPreference = {
  is_archived: boolean;
  is_pinned: boolean;
  muted_until: string | null;
  marked_unread: boolean;
};

const DEFAULT_PREFERENCE: ConversationPreference = {
  is_archived: false,
  is_pinned: false,
  muted_until: null,
  marked_unread: false,
};

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "✅"];
const COMPOSER_EMOJIS = ["😀", "😊", "👍", "🙏", "❤️", "✅", "🎨", "📦"];
const CUSTOMER_NAME = "Sowmiya Prints";
const CUSTOMER_ID = "OR-TN-0001";
const VOICE_BARS = [8, 14, 20, 11, 24, 17, 10, 19, 27, 14, 22, 9, 16, 25, 13, 20, 28, 12, 18, 23, 10, 26, 15, 21, 9, 18, 24, 12, 20, 15];
const DEFAULT_API_BASE = "http://127.0.0.1:8000";
const MAX_UPLOAD_BYTES = 1 * 1024 * 1024 * 1024;

function browserApiBase() {
  if (typeof window !== "undefined" && window.location.port === "3010") {
    return "http://127.0.0.1:8010";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE;
}

function isOwnMessage(message: Message, mode: MessengerProps["mode"]) {
  const sender = (message.from ?? message.sender_type ?? "").toLowerCase();
  return mode === "customer" ? sender === "you" || sender === "customer" : sender === "staff";
}

function parseServerDate(value?: string | null) {
  if (!value) return null;
  const hasTimezone = /(?:z|[+-]\d{2}:\d{2})$/i.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(value?: string | null, seconds = false) {
  const date = parseServerDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: seconds ? "2-digit" : undefined,
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).toLowerCase();
}

function messageTime(message: Message, mounted: boolean) {
  if (message.time) return message.time.toLowerCase();
  return mounted ? formatTime(message.created_at) : "";
}

function dateLabel(message: Message) {
  const date = parseServerDate(message.created_at) ?? new Date();
  const now = new Date();
  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const key = dayKey.format(date);
  if (key === dayKey.format(now)) return "Today";
  if (key === dayKey.format(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function messageText(message: Message) {
  const text = (message.text ?? message.body ?? "").trim();
  if (text) return text;
  if (message.deleted_at) return "This message was deleted";
  const attachments = messageAttachments(message);
  if (attachments.length > 1) return `${attachments.length} attachments`;
  if (attachments[0]?.mime_type.startsWith("image/")) return "Photo";
  if (attachments[0]?.mime_type.startsWith("video/")) return "Video";
  if (attachments[0]?.mime_type.startsWith("audio/")) return "Voice message";
  if (attachments[0]?.original_filename) return attachments[0].original_filename;
  return "Message";
}

function messageAttachments(message: Message): MediaAttachment[] {
  if (message.attachments?.length) return message.attachments;
  if (!message.attachment_url) return [];
  return [{
    id: `legacy-${message.id ?? message.client_message_id}`,
    url: message.attachment_url,
    thumbnail_url: null,
    original_filename: message.attachment_name ?? "Attachment",
    mime_type: message.attachment_type ?? "application/octet-stream",
  }];
}

function mediaKind(file: File): PendingMedia["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function formatBytes(size?: number | null) {
  if (size === null || size === undefined) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size >= 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fullTimestamp(value?: string | null) {
  const date = parseServerDate(value);
  if (!date) return "Not yet";
  return `${date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}, ${formatTime(value, true)}`;
}

function makeClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function MessageReceipt({ message }: { message: Message }) {
  if (message.status === "sending") return <i className="message-status pending">◷</i>;
  if (message.status === "failed") return <i className="message-status failed">!</i>;
  if (!message.read_at && !message.delivered_at && message.status === "sent") return <i className="message-status">✓</i>;
  return (
    <svg className={`read-receipt ${message.read_at ? "read" : ""}`} viewBox="0 0 18 12" aria-label={message.read_at ? "Read" : "Delivered"}>
      <path d="M1 6.4 4.2 9.6 10.8 2.2" />
      <path d="M7.2 8.8 8.8 10.4 17 1.2" />
    </svg>
  );
}

function VoiceMessagePlayer({ attachment, apiBase }: { attachment: MediaAttachment; apiBase: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.duration_seconds ?? 0);
  const [speed, setSpeed] = useState(1);
  const source = attachment.url.startsWith("blob:") ? attachment.url : `${apiBase}${attachment.url}`;
  const progress = duration ? currentTime / duration : 0;

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  function cycleSpeed() {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  return (
    <div className="voice-message">
      <button className="voice-play" type="button" aria-label={playing ? "Pause voice message" : "Play voice message"} onClick={togglePlayback}>
        {playing ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <div className="voice-content">
        <div className="voice-track">
          <div className="voice-bars" aria-hidden="true">
            {VOICE_BARS.map((height, index) => <i className={index / VOICE_BARS.length <= progress ? "played" : ""} key={index} style={{ height }} />)}
          </div>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={Math.min(currentTime, duration || 1)}
            aria-label="Voice message position"
            onChange={(event) => {
              const next = Number(event.target.value);
              setCurrentTime(next);
              if (audioRef.current) audioRef.current.currentTime = next;
            }}
          />
        </div>
        <span>{formatDuration(currentTime)} / {formatDuration(duration)}</span>
      </div>
      <button className="voice-speed" type="button" aria-label="Change playback speed" onClick={cycleSpeed}>{speed}x</button>
      <audio
        ref={audioRef}
        src={source}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration);
          event.currentTarget.playbackRate = speed;
        }}
      />
    </div>
  );
}

export function Messenger({ messages, mode }: MessengerProps) {
  const apiBase = browserApiBase();
  const [mounted, setMounted] = useState(false);
  const [customerName, setCustomerName] = useState(CUSTOMER_NAME);
  const [customerId, setCustomerId] = useState(CUSTOMER_ID);
  const [customerAvatarUrl, setCustomerAvatarUrl] = useState<string | null>(null);
  const [customerDeliveryCode, setCustomerDeliveryCode] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [draft, setDraft] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<PendingMedia[]>([]);
  const [activeUpload, setActiveUpload] = useState<{ clientId: string; names: string; progress: number } | null>(null);
  const [activeDownload, setActiveDownload] = useState<{ name: string; progress: number } | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [editTarget, setEditTarget] = useState<Message | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [noteTarget, setNoteTarget] = useState<Message | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [infoTarget, setInfoTarget] = useState<Message | null>(null);
  const [reactionTarget, setReactionTarget] = useState<Message | null>(null);
  const [menuMessageId, setMenuMessageId] = useState<number | string | null>(null);
  const [messageMenuOpensUp, setMessageMenuOpensUp] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [searchDate, setSearchDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [conversationSearchIds, setConversationSearchIds] = useState<number[] | null>(null);
  const [conversationSearchLoading, setConversationSearchLoading] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<SearchHit[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [socketState, setSocketState] = useState<"connecting" | "connected" | "offline">("connecting");
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [recipientLastSeen, setRecipientLastSeen] = useState<string | null>(null);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [recipientRecording, setRecipientRecording] = useState(false);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "processing">("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
  const [cameraRecording, setCameraRecording] = useState(false);
  const [cameraProcessing, setCameraProcessing] = useState(false);
  const [cameraSeconds, setCameraSeconds] = useState(0);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [conversationMenuOpen, setConversationMenuOpen] = useState(false);
  const [composerMenuOpen, setComposerMenuOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [preference, setPreference] = useState<ConversationPreference>(DEFAULT_PREFERENCE);
  const [chatActive, setChatActive] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef = useRef(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const recipientTypingTimerRef = useRef<number | null>(null);
  const recipientRecordingTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingSecondsRef = useRef(0);
  const recordingActionRef = useRef<"send" | "cancel">("cancel");
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraChunksRef = useRef<Blob[]>([]);
  const cameraTimerRef = useRef<number | null>(null);
  const cameraSecondsRef = useRef(0);
  const cameraActionRef = useRef<"send" | "cancel">("cancel");
  const uploadRequestRef = useRef<XMLHttpRequest | null>(null);
  const pendingMediaRef = useRef<Map<string, PendingMedia[]>>(new Map());
  const originalTitleRef = useRef("ODD RAVEN");
  const audioContextRef = useRef<AudioContext | null>(null);
  const visibleMessagesRef = useRef<Message[]>([]);
  const chatActiveRef = useRef(false);
  const mutedRef = useRef(false);
  const notificationsEnabledRef = useRef(false);
  const soundEnabledRef = useRef(true);

  const hiddenKey = mode === "customer" ? "hidden_for_customer" : "hidden_for_staff";
  const visibleMessages = useMemo(
    () => localMessages.filter((message) => !message[hiddenKey]),
    [hiddenKey, localMessages],
  );
  const searchResults = useMemo(() => {
    if (conversationSearchIds !== null) {
      return conversationSearchIds
        .map((id) => visibleMessages.find((message) => message.id === id))
        .filter((message): message is Message => Boolean(message));
    }
    const query = messageSearch.trim().toLowerCase();
    if (!query) return [];
    return visibleMessages.filter((message) =>
      [message.body, message.text, message.attachment_name, message.reply_to_body, ...messageAttachments(message).map((item) => item.original_filename)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [conversationSearchIds, messageSearch, visibleMessages]);
  const pinnedMessage = [...visibleMessages].reverse().find((message) => message.is_pinned && !message.deleted_at);
  const lastMessage = visibleMessages.at(-1);
  const incomingUnread = visibleMessages.filter((message) => !isOwnMessage(message, mode) && !message.read_at).length;
  const displayedUnread = Math.max(incomingUnread, preference.marked_unread ? 1 : 0);
  const muted = Boolean(preference.muted_until && (parseServerDate(preference.muted_until)?.getTime() ?? 0) > Date.now());
  const mediaItems = visibleMessages.flatMap((message) => messageAttachments(message)
    .filter((attachment) => attachment.mime_type.startsWith("image/") || attachment.mime_type.startsWith("video/"))
    .map((attachment) => ({ message, attachment })));
  const sharedDocuments = visibleMessages.flatMap((message) => messageAttachments(message)
    .filter((attachment) => !attachment.mime_type.startsWith("image/") && !attachment.mime_type.startsWith("video/") && !attachment.mime_type.startsWith("audio/"))
    .map((attachment) => ({ message, attachment })));
  const sharedLinks = visibleMessages.flatMap((message) => (message.body ?? "").match(/https?:\/\/[^\s]+/g) ?? []);
  const chatMatches = !chatSearch.trim() || [customerName, "OR-TN-0001", messageText(lastMessage ?? {})]
    .some((value) => value.toLowerCase().includes(chatSearch.trim().toLowerCase()));

  const refreshCustomer = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/api/customers/me`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { customer?: { id?: string; business_name?: string; profile_image_url?: string | null; delivery_code?: string } };
      setCustomerId(data.customer?.id || CUSTOMER_ID);
      setCustomerName(data.customer?.business_name || CUSTOMER_NAME);
      setCustomerAvatarUrl(data.customer?.profile_image_url ?? null);
      setCustomerDeliveryCode(data.customer?.delivery_code ?? "");
    } catch {
      // Keep the last known customer name while the API reconnects.
    }
  }, [apiBase]);

  const customerAvatarSource = customerAvatarUrl?.startsWith("/") ? `${apiBase}${customerAvatarUrl}` : customerAvatarUrl;
  const customerInitials = customerName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CU";
  const staffCustomerLabel = customerDeliveryCode || customerName;
  const customerAvatar = (size = "") => (
    <div className={`avatar customer-avatar ${size}`}>
      {customerAvatarSource ? <img src={customerAvatarSource} alt="" /> : customerInitials}
    </div>
  );

  const upsertMessage = useCallback((incoming: Message) => {
    setLocalMessages((current) => {
      const index = current.findIndex((message) =>
        (incoming.id && message.id === incoming.id)
        || (incoming.client_message_id && message.client_message_id === incoming.client_message_id),
      );
      if (index < 0) return [...current, incoming];
      const next = [...current];
      next[index] = { ...next[index], ...incoming };
      return next;
    });
  }, []);

  useEffect(() => {
    visibleMessagesRef.current = visibleMessages;
  }, [visibleMessages]);

  useEffect(() => {
    if (menuMessageId === null) return;

    const closeMessageMenu = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".message-action-menu, .message-menu-trigger")) return;
      setMenuMessageId(null);
    };

    window.addEventListener("pointerdown", closeMessageMenu);
    return () => window.removeEventListener("pointerdown", closeMessageMenu);
  }, [menuMessageId]);

  useEffect(() => {
    void refreshCustomer();
    const refreshTimer = window.setInterval(refreshCustomer, 3000);
    window.addEventListener("focus", refreshCustomer);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshCustomer);
    };
  }, [refreshCustomer]);

  useEffect(() => {
    chatActiveRef.current = chatActive;
  }, [chatActive]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const focusMessage = useCallback((messageId?: number | null) => {
    const currentMessages = visibleMessagesRef.current;
    const targetId = messageId ?? currentMessages.find((message) => !isOwnMessage(message, mode) && !message.read_at)?.id ?? currentMessages.at(-1)?.id;
    if (!targetId) return;
    setFocusedMessageId(targetId);
    window.setTimeout(() => {
      document.getElementById(`message-${targetId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
    window.setTimeout(() => setFocusedMessageId((current) => current === targetId ? null : current), 2600);
  }, [mode]);

  const notificationBody = useCallback((message: Message) => {
    const attachments = messageAttachments(message);
    if (!messageText(message) || messageText(message) === "Message") {
      if (attachments.length > 1) return `${attachments.length} attachments`;
      const attachment = attachments[0];
      if (attachment?.mime_type.startsWith("image/")) return "Photo";
      if (attachment?.mime_type.startsWith("video/")) return "Video";
      if (attachment?.mime_type.startsWith("audio/")) return "Voice message";
      if (attachment?.original_filename) return attachment.original_filename;
    }
    if (attachments.length === 1 && !message.body?.trim() && !message.text?.trim()) {
      const attachment = attachments[0];
      if (attachment.mime_type.startsWith("image/")) return "Photo";
      if (attachment.mime_type.startsWith("video/")) return "Video";
      if (attachment.mime_type.startsWith("audio/")) return "Voice message";
      return attachment.original_filename;
    }
    return messageText(message);
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current || mutedRef.current) return;
    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const context = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch {
      // Browsers may block audio until the user has interacted with the page.
    }
  }, []);

  const showMessageNotification = useCallback((message: Message) => {
    if (!notificationsEnabledRef.current || mutedRef.current || !("Notification" in window) || Notification.permission !== "granted") return;
    const title = mode === "staff" ? customerName : "ODD RAVEN";
    const url = `${window.location.origin}${window.location.pathname}?message=${message.id ?? ""}`;
    const options: NotificationOptions = {
      body: notificationBody(message),
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: `message-${mode}-${message.id ?? message.client_message_id ?? Date.now()}`,
      data: { url },
    };
    if (navigator.serviceWorker?.controller && "showNotification" in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready
        .then((registration) => registration.showNotification(title, options))
        .catch(() => {
          const notification = new Notification(title, options);
          notification.onclick = () => { window.focus(); focusMessage(message.id); notification.close(); };
        });
      return;
    }
    const notification = new Notification(title, options);
    notification.onclick = () => { window.focus(); focusMessage(message.id); notification.close(); };
  }, [customerName, focusMessage, mode, notificationBody]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/api/messages?viewer_type=${mode}&limit=100`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load messages");
      const persisted = (await response.json()) as Message[];
      setLocalMessages((current) => {
        const pending = current.filter((message) =>
          (message.status === "sending" || message.status === "failed")
          && !persisted.some((saved) => saved.client_message_id && saved.client_message_id === message.client_message_id),
        );
        return [...persisted, ...pending];
      });
    } catch {
      setSocketState((state) => state === "connected" ? state : "offline");
    }
  }, [apiBase, mode]);

  const fetchPreference = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/api/messages/preference?viewer_type=${mode}`, { cache: "no-store" });
      if (response.ok) setPreference(await response.json() as ConversationPreference);
    } catch {
      // Message history remains available while preference sync reconnects.
    }
  }, [apiBase, mode]);

  const markRead = useCallback(async () => {
    await fetch(`${apiBase}/api/messages/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reader_type: mode }),
    }).catch(() => undefined);
  }, [apiBase, mode]);

  useEffect(() => {
    setMounted(true);
    originalTitleRef.current = document.title || "ODD RAVEN";
    setNotificationsEnabled(localStorage.getItem(`odd-raven-notifications-${mode}`) === "on");
    setSoundEnabled(localStorage.getItem(`odd-raven-notification-sound-${mode}`) !== "off");
    const updateActive = () => setChatActive(document.visibilityState === "visible" && document.hasFocus());
    updateActive();
    window.addEventListener("focus", updateActive);
    window.addEventListener("blur", updateActive);
    document.addEventListener("visibilitychange", updateActive);
    return () => {
      window.removeEventListener("focus", updateActive);
      window.removeEventListener("blur", updateActive);
      document.removeEventListener("visibilitychange", updateActive);
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.title = displayedUnread > 0 ? `(${displayedUnread}) ${originalTitleRef.current.replace(/^\(\d+\)\s*/, "")}` : originalTitleRef.current.replace(/^\(\d+\)\s*/, "");
    return () => {
      document.title = originalTitleRef.current.replace(/^\(\d+\)\s*/, "");
    };
  }, [displayedUnread, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    const messageId = Number(params.get("message"));
    if (Number.isFinite(messageId) && messageId > 0) {
      focusMessage(messageId);
      params.delete("message");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", next);
    }
  }, [focusMessage, mounted]);

  useEffect(() => {
    if (!mounted || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "notification.clicked") return;
      const url = new URL(event.data.url, window.location.origin);
      const messageId = Number(url.searchParams.get("message"));
      if (Number.isFinite(messageId) && messageId > 0) focusMessage(messageId);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [focusMessage, mounted]);

  useEffect(() => {
    fetchMessages();
    fetchPreference();
    const fallback = window.setInterval(fetchMessages, 30000);
    return () => window.clearInterval(fallback);
  }, [fetchMessages, fetchPreference]);

  useLayoutEffect(() => {
    if (!visibleMessages.length) {
      return;
    }
    if (!mounted || initialScrollDoneRef.current) return;

    const messageTarget = Number(new URLSearchParams(window.location.search).get("message"));
    if (Number.isFinite(messageTarget) && messageTarget > 0) {
      initialScrollDoneRef.current = true;
      return;
    }

    const scrollToBottom = () => {
      const body = bodyRef.current;
      if (!body) return;
      body.scrollTop = body.scrollHeight;
      setNewMessageCount(0);
    };

    scrollToBottom();
    const frame = window.requestAnimationFrame(scrollToBottom);
    const firstRetry = window.setTimeout(scrollToBottom, 100);
    const finalRetry = window.setTimeout(() => {
      scrollToBottom();
      initialScrollDoneRef.current = true;
    }, 350);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(firstRetry);
      window.clearTimeout(finalRetry);
    };
  }, [lastMessage?.id, mounted, visibleMessages.length]);

  useEffect(() => {
    if (chatActive) markRead();
  }, [chatActive, markRead]);

  useEffect(() => {
    let stopped = false;
    let reconnectTimer: number | undefined;
    const socketUrl = `${apiBase.replace(/^http/i, "ws")}/api/messages/ws?role=${mode}`;
    const connect = () => {
      if (stopped) return;
      setSocketState("connecting");
      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;
      socket.onopen = () => {
        setSocketState("connected");
        socket.send(JSON.stringify({ type: "presence.requested" }));
        fetchMessages();
        fetchPreference();
      };
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data) as SocketEvent;
        if (data.type === "message.created" && data.message) {
          upsertMessage(data.message);
          const incoming = !isOwnMessage(data.message, mode);
          const body = bodyRef.current;
          const nearBottom = body ? body.scrollHeight - body.scrollTop - body.clientHeight < 120 : true;
          if (incoming && document.visibilityState === "visible" && document.hasFocus()) markRead();
          if (incoming && !nearBottom) setNewMessageCount((count) => count + 1);
          if (incoming && (!chatActiveRef.current || document.visibilityState !== "visible")) {
            playNotificationSound();
            showMessageNotification(data.message);
          } else if (incoming && !mutedRef.current) {
            playNotificationSound();
          }
        }
        if (data.type === "message.updated" && data.message) upsertMessage(data.message);
        if (data.type === "messages.read" && data.message_ids) {
          setLocalMessages((current) => current.map((message) =>
            message.id && data.message_ids?.includes(message.id)
              ? { ...message, read_at: data.read_at, status: "read" }
              : message,
          ));
        }
        if (data.type === "presence.updated" && data.role && data.role !== mode) {
          setRecipientOnline(Boolean(data.online));
          if (data.last_seen) setRecipientLastSeen(data.last_seen);
        }
        if ((data.type === "typing.started" || data.type === "typing.stopped") && data.role !== mode) {
          setRecipientTyping(data.type === "typing.started");
          if (recipientTypingTimerRef.current) window.clearTimeout(recipientTypingTimerRef.current);
          if (data.type === "typing.started") {
            recipientTypingTimerRef.current = window.setTimeout(() => setRecipientTyping(false), 2500);
          }
        }
        if ((data.type === "recording.started" || data.type === "recording.stopped") && data.role !== mode) {
          setRecipientRecording(data.type === "recording.started");
          if (recipientRecordingTimerRef.current) window.clearTimeout(recipientRecordingTimerRef.current);
          if (data.type === "recording.started") {
            recipientRecordingTimerRef.current = window.setTimeout(() => setRecipientRecording(false), 5000);
          }
        }
        if (data.type === "conversation.updated" && data.viewer_type === mode && data.preference) {
          setPreference(data.preference);
        }
      };
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (!stopped) {
          setSocketState(navigator.onLine ? "connecting" : "offline");
          reconnectTimer = window.setTimeout(connect, 1500);
        }
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, [apiBase, fetchMessages, fetchPreference, markRead, mode, playNotificationSound, showMessageNotification, upsertMessage]);

  useEffect(() => {
    if ((!messageSearch && !searchDate) || searchResults.length === 0) return;
    const target = searchResults[Math.min(searchIndex, searchResults.length - 1)];
    if (target?.id) document.getElementById(`message-${target.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [messageSearch, searchDate, searchIndex, searchResults]);

  useEffect(() => {
    const query = messageSearch.trim();
    if (!query && !searchDate) {
      setConversationSearchIds(null);
      setConversationSearchLoading(false);
      return;
    }
    let cancelled = false;
    setConversationSearchLoading(true);
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({ viewer_type: mode, limit: "200" });
      if (query) params.set("q", query);
      if (searchDate) params.set("date", searchDate);
      try {
        const response = await fetch(`${apiBase}/api/messages/search?${params}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Search failed");
        const hits = await response.json() as SearchHit[];
        if (cancelled) return;
        hits.forEach((hit) => upsertMessage(hit.message));
        setConversationSearchIds(hits.map((hit) => hit.message.id).filter((id): id is number => Boolean(id)));
        setSearchIndex(0);
      } catch {
        if (!cancelled) setConversationSearchIds([]);
      } finally {
        if (!cancelled) setConversationSearchLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [apiBase, messageSearch, mode, searchDate, upsertMessage]);

  useEffect(() => {
    const query = chatSearch.trim();
    if (mode !== "staff" || !query) {
      setGlobalSearchResults([]);
      setGlobalSearchLoading(false);
      return;
    }
    let cancelled = false;
    setGlobalSearchLoading(true);
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({ q: query, viewer_type: "staff", limit: "50" });
      try {
        const response = await fetch(`${apiBase}/api/messages/search?${params}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Search failed");
        const hits = await response.json() as SearchHit[];
        if (!cancelled) setGlobalSearchResults(hits);
      } catch {
        if (!cancelled) setGlobalSearchResults([]);
      } finally {
        if (!cancelled) setGlobalSearchLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [apiBase, chatSearch, mode]);

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function openGlobalSearchHit(hit: SearchHit) {
    upsertMessage(hit.message);
    setChatSearch("");
    if (!hit.message.id) return;
    setFocusedMessageId(hit.message.id);
    window.setTimeout(() => {
      document.getElementById(`message-${hit.message.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 30);
    window.setTimeout(() => setFocusedMessageId((id) => id === hit.message.id ? null : id), 3000);
  }

  function sendSocketEvent(type: string) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type }));
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    sendSocketEvent(value ? "typing.started" : "typing.stopped");
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => sendSocketEvent("typing.stopped"), 1200);
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }

  async function updateMessageAction(message: Message, action: string, localPatch: Partial<Message>, extraPayload = {}) {
    if (!message.id) return false;
    const previous = message;
    upsertMessage({ ...message, ...localPatch });
    try {
      const response = await fetch(`${apiBase}/api/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, actor: mode, ...extraPayload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Action failed");
      if (result.message) upsertMessage(result.message as Message);
      return true;
    } catch (error) {
      upsertMessage(previous);
      showNotice(error instanceof Error ? error.message : "Action failed");
      return false;
    }
  }

  async function updateConversationPreference(action: string, duration?: string) {
    try {
      const response = await fetch(`${apiBase}/api/messages/preference`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewer_type: mode, action, duration }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Inbox action failed");
      setPreference(result as ConversationPreference);
      if (action === "archive") setShowArchived(Boolean(result.is_archived));
      setConversationMenuOpen(false);
      setComposerMenuOpen(false);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Inbox action failed");
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      showNotice("Browser notifications are not supported");
      return;
    }
    if (Notification.permission === "denied") {
      setNotificationsEnabled(false);
      localStorage.setItem(`odd-raven-notifications-${mode}`, "off");
      showNotice("Browser notifications are blocked in site settings");
      setConversationMenuOpen(false);
      return;
    }
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    const enabled = permission === "granted";
    setNotificationsEnabled(enabled);
    localStorage.setItem(`odd-raven-notifications-${mode}`, enabled ? "on" : "off");
    showNotice(enabled ? "Notifications enabled" : "Notifications remain disabled");
    setConversationMenuOpen(false);
  }

  function disableNotifications() {
    setNotificationsEnabled(false);
    localStorage.setItem(`odd-raven-notifications-${mode}`, "off");
    showNotice("Notifications turned off");
    setConversationMenuOpen(false);
  }

  function toggleNotificationSound() {
    const enabled = !soundEnabled;
    setSoundEnabled(enabled);
    localStorage.setItem(`odd-raven-notification-sound-${mode}`, enabled ? "on" : "off");
    showNotice(enabled ? "Notification sound on" : "Notification sound off");
    setConversationMenuOpen(false);
  }

  function chooseReply(message: Message) {
    setReplyTarget({ ...message, body: messageText(message), text: undefined });
    textareaRef.current?.focus();
  }

  async function copyMessage(message: Message) {
    await navigator.clipboard?.writeText(messageText(message)).catch(() => undefined);
    showNotice("Message copied");
  }

  function addMessageNote(message: Message) {
    setNoteTarget(message);
    setNoteDraft(message.note_text ?? messageText(message));
  }

  async function saveMessageNote(event: FormEvent) {
    event.preventDefault();
    if (!noteTarget) return;
    const note = noteDraft.trim();
    const saved = await updateMessageAction(noteTarget, "note", { note_text: note || null }, { note_text: note });
    if (!saved) return;
    setNoteTarget(null);
    showNotice("Note saved");
  }

  function beginEdit(message: Message) {
    setEditTarget(message);
    setEditDraft(messageText(message));
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editTarget || !editDraft.trim()) return;
    await updateMessageAction(editTarget, "edit", { body: editDraft.trim(), text: undefined, edited_at: new Date().toISOString() }, { body: editDraft.trim() });
    setEditTarget(null);
  }

  function selectMedia(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files);
    if (selectedMedia.length + incoming.length > 100) {
      showNotice("You can send up to 100 files in one message");
      return;
    }
    const oversized = incoming.find((file) => file.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      showNotice(`${oversized.name} exceeds the 1 GB limit`);
      return;
    }
    setSelectedMedia((current) => [...current, ...incoming.map((file) => {
      const kind = mediaKind(file);
      return {
        id: makeClientId(),
        file,
        kind,
        previewUrl: kind === "document" ? null : URL.createObjectURL(file),
      };
    })]);
  }

  function stopCameraStream() {
    if (cameraTimerRef.current) window.clearInterval(cameraTimerRef.current);
    cameraTimerRef.current = null;
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    cameraRecorderRef.current = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
  }

  function closeCamera() {
    cameraActionRef.current = "cancel";
    const recorder = cameraRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopCameraStream();
    }
    setCameraOpen(false);
    setCameraRecording(false);
    setCameraProcessing(false);
    setCameraSeconds(0);
  }

  async function openCamera(mode: "photo" | "video") {
    if (activeUpload || recordingState !== "idle" || cameraOpen) return;
    setCameraMode(mode);
    if (!navigator.mediaDevices?.getUserMedia || (mode === "video" && !("MediaRecorder" in window))) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: mode === "video" });
      cameraStreamRef.current = stream;
      cameraActionRef.current = "cancel";
      cameraSecondsRef.current = 0;
      setCameraSeconds(0);
      setCameraProcessing(false);
      setCameraOpen(true);
    } catch (error) {
      showNotice(error instanceof DOMException && error.name === "NotAllowedError" ? "Camera permission was denied. Choose a photo or video instead." : "Unable to open the camera");
      cameraInputRef.current?.click();
    }
  }

  useEffect(() => {
    if (!cameraOpen || !cameraStreamRef.current || !cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    video.srcObject = cameraStreamRef.current;
    void video.play().catch(() => undefined);
    return () => {
      video.srcObject = null;
    };
  }, [cameraOpen]);

  useEffect(() => () => {
    if (cameraTimerRef.current) window.clearInterval(cameraTimerRef.current);
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function captureCameraPhoto() {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      showNotice("Camera is still starting. Try again in a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        showNotice("Unable to capture the photo");
        return;
      }
      const file = new File([blob], `Camera photo ${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`, { type: "image/jpeg" });
      const photo: PendingMedia = { id: makeClientId(), file, kind: "image", previewUrl: URL.createObjectURL(file) };
      closeCamera();
      void sendMessage(undefined, undefined, [photo]);
    }, "image/jpeg", 0.92);
  }

  function startCameraVideoRecording() {
    const stream = cameraStreamRef.current;
    if (!stream || cameraRecording || cameraProcessing || !("MediaRecorder" in window)) {
      if (!("MediaRecorder" in window)) showNotice("Video recording is not supported in this browser");
      return;
    }
    try {
      const preferredType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4", "video/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      cameraRecorderRef.current = recorder;
      cameraChunksRef.current = [];
      cameraActionRef.current = "cancel";
      cameraSecondsRef.current = 0;
      setCameraSeconds(0);
      setCameraRecording(true);
      sendSocketEvent("recording.started");
      recorder.ondataavailable = (event) => {
        if (event.data.size) cameraChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const action = cameraActionRef.current;
        const mimeType = recorder.mimeType || preferredType || "video/webm";
        const chunks = cameraChunksRef.current;
        stopCameraStream();
        setCameraOpen(false);
        setCameraRecording(false);
        setCameraProcessing(false);
        sendSocketEvent("recording.stopped");
        if (action !== "send") return;
        const blob = new Blob(chunks, { type: mimeType });
        if (!blob.size) {
          showNotice("No video was recorded");
          return;
        }
        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `Camera video ${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`, { type: mimeType });
        const video: PendingMedia = {
          id: makeClientId(),
          file,
          kind: "video",
          previewUrl: URL.createObjectURL(file),
          durationSeconds: cameraSecondsRef.current,
        };
        void sendMessage(undefined, undefined, [video]);
      };
      recorder.start(250);
      cameraTimerRef.current = window.setInterval(() => {
        if (recorder.state !== "recording") return;
        cameraSecondsRef.current += 1;
        setCameraSeconds(cameraSecondsRef.current);
      }, 1000);
    } catch {
      stopCameraStream();
      setCameraRecording(false);
      showNotice("Unable to start video recording");
    }
  }

  function finishCameraVideoRecording(action: "send" | "cancel") {
    const recorder = cameraRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    cameraActionRef.current = action;
    if (action === "send") setCameraProcessing(true);
    recorder.stop();
  }

  async function startVoiceRecording() {
    if (activeUpload || recordingState !== "idle") return;
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      showNotice("Voice recording is not supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      recordingSecondsRef.current = 0;
      recordingActionRef.current = "cancel";
      setRecordingSeconds(0);
      setRecordingState("recording");
      setEmojiOpen(false);
      sendSocketEvent("recording.started");
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        sendSocketEvent("recording.stopped");
        setRecordingState("idle");
        if (recordingActionRef.current !== "send") return;
        const mimeType = recorder.mimeType || preferredType || "audio/webm";
        const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        if (!blob.size) {
          showNotice("No audio was recorded");
          return;
        }
        const file = new File([blob], `Voice message ${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`, { type: mimeType });
        const voice: PendingMedia = {
          id: makeClientId(),
          file,
          kind: "audio",
          previewUrl: URL.createObjectURL(file),
          durationSeconds: recordingSecondsRef.current,
        };
        void sendMessage(undefined, undefined, [voice]);
      };
      recorder.start(250);
      recordingTimerRef.current = window.setInterval(() => {
        if (recorder.state !== "recording") return;
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);
    } catch (error) {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      setRecordingState("idle");
      showNotice(error instanceof DOMException && error.name === "NotAllowedError" ? "Microphone permission was denied" : "Unable to start voice recording");
    }
  }

  function toggleRecordingPause() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setRecordingState("paused");
    } else if (recorder.state === "paused") {
      recorder.resume();
      setRecordingState("recording");
    }
  }

  function finishVoiceRecording(action: "send" | "cancel") {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recordingActionRef.current = action;
    if (action === "send") {
      setRecordingState("processing");
    } else {
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      setRecordingState("idle");
      sendSocketEvent("recording.stopped");
    }
    recorder.stop();
  }

  function removeSelectedMedia(id: string) {
    setSelectedMedia((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function moveSelectedMedia(index: number, direction: -1 | 1) {
    setSelectedMedia((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function uploadMedia(formData: FormData, clientId: string, names: string) {
    return new Promise<{ message: Message }>((resolve, reject) => {
      const request = new XMLHttpRequest();
      uploadRequestRef.current = request;
      setActiveUpload({ clientId, names, progress: 0 });
      request.open("POST", `${apiBase}/api/messages/with-attachment`);
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setActiveUpload({ clientId, names, progress: Math.round((event.loaded / event.total) * 100) });
      };
      request.onload = () => {
        uploadRequestRef.current = null;
        try {
          const result = JSON.parse(request.responseText);
          if (request.status < 200 || request.status >= 300) throw new Error(result.detail ?? "Upload failed");
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () => reject(new Error("Upload failed"));
      request.onabort = () => reject(new Error("Upload cancelled"));
      request.send(formData);
    });
  }

  function downloadAttachment(attachment: MediaAttachment) {
    const request = new XMLHttpRequest();
    setActiveDownload({ name: attachment.original_filename, progress: 0 });
    request.open("GET", attachment.url.startsWith("blob:") ? attachment.url : `${apiBase}${attachment.url}`);
    request.responseType = "blob";
    request.onprogress = (event) => {
      if (event.lengthComputable) setActiveDownload({ name: attachment.original_filename, progress: Math.round((event.loaded / event.total) * 100) });
    };
    request.onload = () => {
      if (request.status && (request.status < 200 || request.status >= 300)) {
        showNotice("Download failed");
        setActiveDownload(null);
        return;
      }
      const url = URL.createObjectURL(request.response);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.original_filename;
      link.click();
      URL.revokeObjectURL(url);
      setActiveDownload(null);
      showNotice("Download completed");
    };
    request.onerror = () => { setActiveDownload(null); showNotice("Download failed"); };
    request.send();
  }

  function openMediaViewer(attachmentId: number | string) {
    const index = mediaItems.findIndex((item) => item.attachment.id === attachmentId);
    if (index >= 0) {
      setViewerZoom(1);
      setViewerIndex(index);
    }
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>, retryMessage?: Message, mediaOverride?: PendingMedia[]) {
    event?.preventDefault();
    if (activeUpload && !retryMessage) {
      showNotice("Wait for the current upload to finish");
      return;
    }
    const body = retryMessage ? (retryMessage.body ?? retryMessage.text ?? "").trim() : draft.trim();
    const media = mediaOverride ?? (retryMessage?.client_message_id
      ? pendingMediaRef.current.get(retryMessage.client_message_id) ?? []
      : selectedMedia);
    const oversized = media.find((item) => item.file.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      showNotice(`${oversized.file.name} exceeds the 1 GB limit`);
      return;
    }
    const reply = retryMessage ? null : replyTarget;
    if (!body && !media.length) return;
    const clientId = retryMessage?.client_message_id ?? makeClientId();
    const kinds = new Set(media.map((item) => item.kind));
    const optimisticAttachments: MediaAttachment[] = media.map((item) => ({
      id: item.id,
      url: item.previewUrl ?? "",
      thumbnail_url: item.previewUrl,
      original_filename: item.file.name,
      mime_type: item.file.type || "application/octet-stream",
      extension: item.file.name.split(".").at(-1) ?? "",
      size_bytes: item.file.size,
      uploaded_by: mode,
      uploaded_at: new Date().toISOString(),
      duration_seconds: item.durationSeconds,
    }));
    const optimistic: Message = retryMessage ?? {
      id: -Date.now(),
      client_message_id: clientId,
      sender_type: mode,
      text: body,
      attachment_name: media[0]?.file.name,
      attachment_type: media[0]?.file.type,
      attachment_url: media[0]?.previewUrl,
      attachments: optimisticAttachments,
      message_type: media.length ? (kinds.size === 1 ? [...kinds][0] : "mixed") : "text",
      reply_to_message_id: reply?.id && reply.id > 0 ? reply.id : null,
      reply_to_body: reply ? messageText(reply) : null,
      reply_to_sender_type: reply?.sender_type ?? null,
      status: "sending",
      created_at: new Date().toISOString(),
    };
    upsertMessage({ ...optimistic, status: "sending" });
    if (!retryMessage) {
      setDraft("");
      setReplyTarget(null);
      setSelectedMedia([]);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      sendSocketEvent("typing.stopped");
    }
    try {
      let result: { message: Message };
      if (media.length) {
        pendingMediaRef.current.set(clientId, media);
        const formData = new FormData();
        formData.append("sender_type", mode);
        formData.append("body", body);
        formData.append("client_message_id", clientId);
        if (reply?.id && reply.id > 0) formData.append("reply_to_message_id", String(reply.id));
        if (reply) {
          formData.append("reply_to_body", messageText(reply));
          formData.append("reply_to_sender_type", reply.sender_type ?? "");
        }
        media.forEach((item) => formData.append("attachments", item.file));
        formData.append("attachment_durations", JSON.stringify(media.map((item) => item.durationSeconds ?? null)));
        result = await uploadMedia(formData, clientId, media.map((item) => item.file.name).join(", "));
      } else {
        const response = await fetch(`${apiBase}/api/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender_type: mode,
            body,
            client_message_id: clientId,
            reply_to_message_id: reply?.id && reply.id > 0 ? reply.id : undefined,
            reply_to_body: reply ? messageText(reply) : undefined,
            reply_to_sender_type: reply?.sender_type,
          }),
        });
        const responseBody = await response.json();
        if (!response.ok) throw new Error(responseBody.detail ?? "Message failed to send");
        result = responseBody;
      }
      setLocalMessages((current) => current.filter((message) => message.id !== optimistic.id));
      upsertMessage(result.message);
      setActiveUpload(null);
      const completedMedia = pendingMediaRef.current.get(clientId) ?? [];
      completedMedia.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
      pendingMediaRef.current.delete(clientId);
      window.setTimeout(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" }), 20);
    } catch (error) {
      setActiveUpload(null);
      upsertMessage({ ...optimistic, status: "failed" });
      showNotice(error instanceof Error ? error.message : "Message failed to send");
    }
  }

  async function deleteForEveryone() {
    if (!deleteTarget) return;
    await updateMessageAction(deleteTarget, "delete_for_everyone", {
      body: "This message was deleted",
      text: undefined,
      deleted_at: new Date().toISOString(),
      attachment_url: null,
      attachment_name: null,
      attachment_type: null,
      attachments: [],
      reaction: null,
    });
    setDeleteTarget(null);
  }

  async function deleteForMe() {
    if (!deleteTarget) return;
    await updateMessageAction(deleteTarget, "delete_for_me", { [hiddenKey]: true }, {});
    setDeleteTarget(null);
  }

  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function scrollToLatest() {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
    setNewMessageCount(0);
  }

  function toggleMessageMenu(event: ReactMouseEvent<HTMLButtonElement>, messageKey: number | string) {
    const triggerRect = event.currentTarget.getBoundingClientRect();
    const menuNeedsRoom = mode === "staff" ? 380 : 300;
    setMessageMenuOpensUp(window.innerHeight - triggerRect.bottom < menuNeedsRoom);
    setMenuMessageId((current) => current === messageKey ? null : messageKey);
  }

  function startSidebarResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (mode !== "staff") return;
    event.preventDefault();
    const minimumWidth = 280;
    const maximumWidth = Math.max(minimumWidth, Math.min(720, window.innerWidth - 360));
    const clampWidth = (width: number) => Math.round(Math.min(maximumWidth, Math.max(minimumWidth, width)));
    const resize = (moveEvent: PointerEvent) => setSidebarWidth(clampWidth(moveEvent.clientX));
    const stopResize = () => {
      setIsSidebarResizing(false);
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
    };

    setIsSidebarResizing(true);
    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize, { once: true });
  }

  const statusText = recipientRecording
    ? "recording voice message..."
    : recipientTyping
      ? "typing..."
    : recipientOnline
      ? "online"
      : recipientLastSeen
        ? `last seen ${formatTime(recipientLastSeen)}`
        : "offline";

  return (
    <main
      className={`messenger-shell ${mode === "customer" ? "customer-direct-chat" : ""} ${isSidebarResizing ? "is-resizing" : ""}`}
      style={mode === "staff" ? { gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` } : undefined}
    >
      {mode === "staff" ? (
        <aside className="messenger-sidebar">
          <div className="messenger-sidebar-header">
            <div className="avatar">OR</div>
            <strong>Messages</strong>
            <button className="sidebar-menu-button" type="button" aria-label="Inbox options" onClick={() => setConversationMenuOpen((open) => !open)}><MoreVertical size={19} /></button>
            {conversationMenuOpen ? (
              <div className="conversation-menu">
                <button type="button" onClick={() => updateConversationPreference("pin")}><Pin size={17} />{preference.is_pinned ? "Unpin chat" : "Pin chat"}</button>
                <button type="button" onClick={() => updateConversationPreference("mark_unread")}><Mail size={17} />Mark as unread</button>
                <button type="button" onClick={() => updateConversationPreference("archive")}><Archive size={17} />{preference.is_archived ? "Unarchive chat" : "Archive chat"}</button>
                <button type="button" onClick={() => updateConversationPreference("mute", muted ? "off" : "8_hours")}><BellOff size={17} />{muted ? "Unmute" : "Mute for 8 hours"}</button>
                {!muted ? <button type="button" onClick={() => updateConversationPreference("mute", "1_week")}><BellOff size={17} />Mute for 1 week</button> : null}
                {!muted ? <button type="button" onClick={() => updateConversationPreference("mute", "always")}><BellOff size={17} />Mute always</button> : null}
                {notificationsEnabled
                  ? <button type="button" onClick={disableNotifications}><Bell size={17} />Notifications on</button>
                  : <button type="button" onClick={enableNotifications}><Bell size={17} />Notifications off</button>}
                <button type="button" onClick={toggleNotificationSound}><Bell size={17} />{soundEnabled ? "Sound on" : "Sound off"}</button>
              </div>
            ) : null}
          </div>
          <label className="chat-search">
            <Search size={16} />
            <input value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="Search messages and files" />
          </label>
          {chatSearch.trim() ? (
            <div className="global-search-results" aria-live="polite">
              {globalSearchLoading ? <p>Searching...</p> : null}
              {!globalSearchLoading && !globalSearchResults.length ? <p>No messages or files found</p> : null}
              {globalSearchResults.map((hit) => (
                <button type="button" key={hit.message.id} onClick={() => openGlobalSearchHit(hit)}>
                  <span><strong>{hit.customer_name}</strong><small>{hit.customer_public_id}</small></span>
                  <b>{hit.matched_attachment ?? messageText(hit.message)}</b>
                  <time>{dateLabel(hit.message)} · {messageTime(hit.message, mounted)}</time>
                </button>
              ))}
            </div>
          ) : (
            <div className="chat-list">
              {preference.is_archived ? <button className="archived-toggle" type="button" onClick={() => setShowArchived((open) => !open)}><Archive size={16} />Archived <b>1</b></button> : null}
              {chatMatches && (!preference.is_archived || showArchived) ? (
                <button className="chat-tile selected" type="button" onClick={() => preference.marked_unread && updateConversationPreference("mark_read")}>
                  {customerAvatar()}
                  <span>
                    <strong>{preference.is_pinned ? <Pin size={13} /> : null}{mode === "staff" ? staffCustomerLabel : customerName}</strong>
                    <small>{lastMessage ? messageText(lastMessage) : "No messages yet"}</small>
                  </span>
                  <em>
                    {mounted && lastMessage ? messageTime(lastMessage, mounted) : ""}
                    {muted ? <BellOff size={14} /> : null}
                    {displayedUnread > 0 ? <b>{displayedUnread}</b> : null}
                  </em>
                </button>
              ) : <p className="empty-list">No conversations found</p>}
            </div>
          )}
          <Link className="new-customer-button" href="/admin/customers/new" aria-label="Add new customer" title="Add new customer"><Plus size={22} /></Link>
          <button
            className="sidebar-resize-handle"
            type="button"
            aria-label="Resize conversation list"
            title="Drag to resize conversation list"
            onPointerDown={startSidebarResize}
          />
        </aside>
      ) : null}

      <section className="conversation">
        <header className="conversation-header">
          <button className="profile-button" type="button" onClick={() => mode === "staff" && setInfoOpen(true)} aria-label="Conversation information">
            {mode === "customer" ? <div className="avatar">OR</div> : customerAvatar()}
            <span>
              <strong>{mode === "customer" ? "ODD RAVEN" : staffCustomerLabel}</strong>
              {mode === "staff" ? <small>{statusText}</small> : null}
            </span>
          </button>
          <div className="conversation-actions">
            <label className="message-search" aria-label="Search messages">
              <Search size={18} />
              <input
                value={messageSearch}
                onChange={(event) => { setMessageSearch(event.target.value); setSearchIndex(0); }}
                placeholder="Search messages"
              />
              {messageSearch || searchDate ? <small>{conversationSearchLoading ? "..." : searchResults.length ? `${searchIndex + 1}/${searchResults.length}` : "0/0"}</small> : null}
              {messageSearch || searchDate ? (
                <>
                  <button type="button" aria-label="Previous result" disabled={!searchResults.length} onClick={() => setSearchIndex((index) => (index - 1 + searchResults.length) % searchResults.length)}>↑</button>
                  <button type="button" aria-label="Next result" disabled={!searchResults.length} onClick={() => setSearchIndex((index) => (index + 1) % searchResults.length)}>↓</button>
                </>
              ) : null}
            </label>
            <button className={searchDate ? "date-search-button active" : "date-search-button"} type="button" aria-label="Search by date" onClick={() => setDatePickerOpen((open) => !open)}><CalendarDays size={19} /></button>
            {datePickerOpen ? (
              <div className="date-search-popover">
                <label htmlFor={`message-search-date-${mode}`}>Search by date</label>
                <input
                  id={`message-search-date-${mode}`}
                  type="date"
                  max={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}
                  value={searchDate}
                  onChange={(event) => { setSearchDate(event.target.value); setSearchIndex(0); }}
                />
                {searchDate ? <button type="button" onClick={() => { setSearchDate(""); setDatePickerOpen(false); }}>Clear date</button> : null}
              </div>
            ) : null}
            {mode === "customer" ? (
              <>
                <button type="button" aria-label={notificationsEnabled ? "Turn notifications off" : "Turn notifications on"} title={notificationsEnabled ? "Notifications on" : "Notifications off"} onClick={notificationsEnabled ? disableNotifications : enableNotifications}>
                  {notificationsEnabled ? <Bell size={19} /> : <BellOff size={19} />}
                </button>
                <button type="button" aria-label={soundEnabled ? "Turn notification sound off" : "Turn notification sound on"} title={soundEnabled ? "Sound on" : "Sound off"} onClick={toggleNotificationSound}>
                  {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
                </button>
              </>
            ) : null}
            {mode === "staff" ? (
              <Link className="chat-edit-customer" href={`/admin/customers/${encodeURIComponent(customerId)}`} aria-label="Edit customer profile" title="Edit customer profile">
                <Pencil size={19} />
              </Link>
            ) : null}
          </div>
        </header>

        {socketState !== "connected" ? (
          <div className={`connection-banner ${socketState}`}>
            <WifiOff size={15} /> {socketState === "offline" ? "No internet connection" : "Connecting..."}
          </div>
        ) : null}

        {pinnedMessage ? (
          <button className="pinned-message" type="button" onClick={() => document.getElementById(`message-${pinnedMessage.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" })}>
            <Pin size={15} />
            <span>{messageText(pinnedMessage)}</span>
            <ChevronDown size={15} />
          </button>
        ) : null}

        <div className="conversation-body" ref={bodyRef} onScroll={(event) => {
          const element = event.currentTarget;
          if (element.scrollHeight - element.scrollTop - element.clientHeight < 80) setNewMessageCount(0);
        }}>
          {notice ? <div className="message-notice">{notice}</div> : null}
          {!visibleMessages.length ? (
            <div className="empty-chat"><strong>Start your ODD RAVEN conversation</strong><span>Messages and files will appear here.</span></div>
          ) : null}
          {visibleMessages.map((message, index) => {
            const own = isOwnMessage(message, mode);
            const deleted = Boolean(message.deleted_at);
            const messageKey = message.id ?? message.client_message_id ?? index;
            const currentDate = dateLabel(message);
            const previousDate = index > 0 ? dateLabel(visibleMessages[index - 1]) : "";
            const highlighted = focusedMessageId === message.id || searchResults[searchIndex]?.id === message.id;
            const createdAt = parseServerDate(message.created_at);
            const attachments = messageAttachments(message);
            const canEdit = own && !deleted && message.message_type !== "document" && Boolean(messageText(message))
              && Boolean(createdAt && Date.now() - createdAt.getTime() <= 15 * 60 * 1000);
            return (
              <div key={messageKey}>
                {mounted && currentDate !== previousDate ? <div className="date-pill">{currentDate}</div> : null}
                <div className="message-row-wrap">
                  <article id={message.id ? `message-${message.id}` : undefined} className={`bubble ${own ? "own" : "theirs"} ${deleted ? "deleted" : ""} ${highlighted ? "search-highlight" : ""}`}>
                    <button className="message-menu-trigger" type="button" aria-label="Message actions" onClick={(event) => toggleMessageMenu(event, messageKey)}>
                      <ChevronDown size={16} />
                    </button>
                    {menuMessageId === messageKey ? (
                      <div className={`message-action-menu ${own ? "align-right" : ""} ${messageMenuOpensUp ? "opens-up" : ""}`}>
                        {own ? <button type="button" onClick={() => { setInfoTarget(message); setMenuMessageId(null); }}><Info size={17} />Message info</button> : null}
                        <button type="button" onClick={() => { chooseReply(message); setMenuMessageId(null); }}><Reply size={17} />Reply</button>
                        {!deleted ? <button type="button" onClick={() => { copyMessage(message); setMenuMessageId(null); }}><Copy size={17} />Copy</button> : null}
                        {!deleted ? <button type="button" onClick={() => { setReactionTarget(message); setMenuMessageId(null); }}><Smile size={17} />React</button> : null}
                        {canEdit ? <button type="button" onClick={() => { beginEdit(message); setMenuMessageId(null); }}><Pencil size={17} />Edit</button> : null}
                        {!deleted ? <button type="button" onClick={() => { updateMessageAction(message, "pin", { is_pinned: !message.is_pinned }); setMenuMessageId(null); }}><Pin size={17} />{message.is_pinned ? "Unpin" : "Pin"}</button> : null}
                        {!deleted ? <button type="button" onClick={() => { updateMessageAction(message, "star", { is_starred: !message.is_starred }); setMenuMessageId(null); }}><Star size={17} />{message.is_starred ? "Unstar" : "Star"}</button> : null}
                        {mode === "staff" && !deleted ? <button type="button" onClick={() => { addMessageNote(message); setMenuMessageId(null); }}><NotebookPen size={17} />Add text to note</button> : null}
                        <button className="delete-menu-item" type="button" onClick={() => { setDeleteTarget(message); setMenuMessageId(null); }}><Trash2 size={17} />Delete</button>
                      </div>
                    ) : null}
                    {message.reply_to_body ? (
                      <button className="message-quote" type="button" onClick={() => document.getElementById(`message-${message.reply_to_message_id}`)?.scrollIntoView({ block: "center", behavior: "smooth" })}>
                        <strong>{message.reply_to_sender_type === "staff" ? "ODD RAVEN" : customerName}</strong>
                        <span>{message.reply_to_body.trim() || "Message"}</span>
                      </button>
                    ) : null}
                    {message.is_pinned || message.is_starred || message.note_text ? (
                      <div className="message-badges">
                        {message.is_pinned ? <b><Pin size={11} /> Pinned</b> : null}
                        {message.is_starred ? <b><Star size={11} /> Starred</b> : null}
                        {message.note_text ? <b><NotebookPen size={11} /> Note</b> : null}
                      </div>
                    ) : null}
                    {attachments.length && !deleted ? (
                      <div className={`message-media-grid count-${Math.min(attachments.length, 4)}`}>
                        {attachments.map((media) => {
                          const mediaUrl = media.url.startsWith("blob:") ? media.url : `${apiBase}${media.url}`;
                          const thumbnailUrl = media.thumbnail_url
                            ? (media.thumbnail_url.startsWith("blob:") ? media.thumbnail_url : `${apiBase}${media.thumbnail_url}`)
                            : mediaUrl;
                          if (media.mime_type.startsWith("image/")) {
                            return <button className="message-attachment image" type="button" key={media.id} onClick={() => openMediaViewer(media.id)}><img src={thumbnailUrl} alt={media.original_filename} /></button>;
                          }
                          if (media.mime_type.startsWith("video/")) {
                            return <div className="message-video" key={media.id}><video src={mediaUrl} controls preload="metadata" /><button type="button" onClick={() => openMediaViewer(media.id)}><Maximize2 size={17} /> Open</button></div>;
                          }
                          if (media.mime_type.startsWith("audio/")) {
                            return <VoiceMessagePlayer key={media.id} attachment={media} apiBase={apiBase} />;
                          }
                          return (
                            <button className="document-card" type="button" key={media.id} onClick={() => media.url && downloadAttachment(media)}>
                              <FileText size={28} />
                              <span><strong>{media.original_filename}</strong><small>{(media.extension || media.mime_type.split("/").at(-1) || "FILE").replace(".", "").toUpperCase()}{media.size_bytes ? ` · ${formatBytes(media.size_bytes)}` : ""}</small></span>
                              <Download size={20} />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    {(message.text || message.body) ? <p>{message.text ?? message.body}</p> : null}
                    {message.reaction && !deleted ? <em className="message-reaction">{message.reaction}</em> : null}
                    <footer className="message-meta">
                      {message.edited_at ? <i>edited</i> : null}
                      {messageTime(message, mounted)}
                      {own ? <MessageReceipt message={message} /> : null}
                    </footer>
                    {message.status === "failed" ? <button className="retry-message" type="button" onClick={() => sendMessage(undefined, message)}>Retry</button> : null}
                  </article>
                </div>
              </div>
            );
          })}
          {newMessageCount > 0 ? <button className="scroll-latest" type="button" onClick={scrollToLatest}>↓ {newMessageCount}</button> : null}
        </div>

        <form className="conversation-compose" onSubmit={sendMessage}>
          {replyTarget ? (
            <div className="reply-preview">
              <div>
                <strong>{isOwnMessage(replyTarget, mode) ? "You" : mode === "customer" ? "ODD RAVEN" : customerName}</strong>
                <span>{messageText(replyTarget)}</span>
              </div>
              <button type="button" aria-label="Cancel reply" onClick={() => setReplyTarget(null)}><X size={22} /></button>
            </div>
          ) : null}
          {selectedMedia.length ? (
            <section className="media-preview-panel">
              <header><strong>{selectedMedia.length} {selectedMedia.length === 1 ? "attachment" : "attachments"}</strong><button type="button" aria-label="Cancel all attachments" onClick={() => { selectedMedia.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl)); setSelectedMedia([]); }}><X size={20} /></button></header>
              <div className="media-preview-grid">
                {selectedMedia.map((item, index) => (
                  <article key={item.id}>
                    {item.kind === "image" ? <img src={item.previewUrl ?? ""} alt={item.file.name} /> : null}
                    {item.kind === "video" ? <video src={item.previewUrl ?? ""} muted /> : null}
                    {item.kind === "document" ? <FileText size={40} /> : null}
                    <span><strong>{item.file.name}</strong><small>{formatBytes(item.file.size)}</small></span>
                    <button className="remove-media" type="button" aria-label={`Remove ${item.file.name}`} onClick={() => removeSelectedMedia(item.id)}><X size={16} /></button>
                    {selectedMedia.length > 1 ? <div className="reorder-media"><button type="button" disabled={index === 0} aria-label="Move left" onClick={() => moveSelectedMedia(index, -1)}><ChevronLeft size={15} /></button><button type="button" disabled={index === selectedMedia.length - 1} aria-label="Move right" onClick={() => moveSelectedMedia(index, 1)}><ChevronRight size={15} /></button></div> : null}
                  </article>
                ))}
              </div>
              <small>Add an optional caption below, then send.</small>
            </section>
          ) : null}
          {activeUpload ? <div className="transfer-progress"><span>Uploading {activeUpload.names}</span><progress value={activeUpload.progress} max="100" /><b>{activeUpload.progress}%</b><button type="button" onClick={() => uploadRequestRef.current?.abort()}>Cancel</button></div> : null}
          {activeDownload ? <div className="transfer-progress download"><span>Downloading {activeDownload.name}</span><progress value={activeDownload.progress} max="100" /><b>{activeDownload.progress}%</b></div> : null}
          {emojiOpen ? (
            <div className="emoji-picker" role="dialog" aria-label="Emoji picker">
              {COMPOSER_EMOJIS.map((emoji) => <button type="button" key={emoji} onClick={() => { handleDraftChange(`${draft}${emoji}`); textareaRef.current?.focus(); }}>{emoji}</button>)}
            </div>
          ) : null}
          {recordingState !== "idle" ? (
            <div className="voice-recording" aria-live="polite">
              <button className="recording-cancel" type="button" aria-label="Cancel voice recording" onClick={() => finishVoiceRecording("cancel")} disabled={recordingState === "processing"}><X size={20} /></button>
              <b>{formatDuration(recordingSeconds)}</b>
              <div className={`recording-waveform ${recordingState}`} aria-hidden="true">{VOICE_BARS.slice(0, 18).map((height, index) => <i key={index} style={{ height }} />)}</div>
              <button type="button" aria-label={recordingState === "paused" ? "Resume recording" : "Pause recording"} onClick={toggleRecordingPause} disabled={recordingState === "processing"}>{recordingState === "paused" ? <Play size={20} /> : <Pause size={20} />}</button>
              <button className="send-round" type="button" aria-label="Send voice message" onClick={() => finishVoiceRecording("send")} disabled={recordingState === "processing"}><Send size={18} /></button>
            </div>
          ) : (
            <div className="compose-row">
              <div className="compose-input-shell">
                <button type="button" aria-label="Emoji" onClick={() => setEmojiOpen((open) => !open)}><Smile size={20} /></button>
                <textarea ref={textareaRef} rows={1} value={draft} onChange={(event) => handleDraftChange(event.target.value)} onKeyDown={handleComposerKey} placeholder="It's between us..." />
                <label className="attach-button" aria-label="Attach file">
                  <Paperclip size={19} />
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf,.svg,.ai,.eps,.psd,.cdr,.tif,.tiff,.zip,.rar,.mp4,.mov,.webm,.m4a,.mp3,.ogg,.opus,.wav,.aac"
                    multiple
                    ref={attachmentInputRef}
                    onChange={(event) => { selectMedia(event.target.files); event.currentTarget.value = ""; }}
                  />
                </label>
                <button type="button" aria-label="More chat options" onClick={() => setComposerMenuOpen((open) => !open)}><MoreVertical size={19} /></button>
              </div>
              {composerMenuOpen ? (
                <div className="conversation-menu composer-menu">
                  <button type="button" onClick={() => { setDatePickerOpen(true); setComposerMenuOpen(false); }}><CalendarDays size={17} />Calendar</button>
                  <button type="button" onClick={() => updateConversationPreference("mute", muted ? "off" : "8_hours")}><BellOff size={17} />{muted ? "Unmute chat" : "Mute chat"}</button>
                </div>
              ) : null}
              {!draft.trim() && !selectedMedia.length
                ? <button className="send-round" type="button" aria-label="Record voice message" onClick={startVoiceRecording}><Mic size={19} /></button>
                : <button className="send-round" type="submit" aria-label="Send message"><Send size={18} /></button>}
            </div>
          )}
        </form>
      </section>

      {cameraOpen ? (
        <div className="camera-dialog-backdrop" role="presentation">
          <section className="camera-dialog" role="dialog" aria-modal="true" aria-labelledby="camera-dialog-title">
            <header>
              <div>
                <strong id="camera-dialog-title">{cameraMode === "photo" ? "Take photo" : "Record video"}</strong>
                <small>{cameraMode === "photo" ? "Capture a photo to send in this chat" : "Record a video to send in this chat"}</small>
              </div>
              <button type="button" aria-label="Close camera" onClick={closeCamera}><X size={22} /></button>
            </header>
            <div className="camera-preview-wrap">
              <video ref={cameraVideoRef} autoPlay muted playsInline aria-label="Camera preview" />
              {cameraMode === "video" && cameraRecording ? <span className="camera-recording-time">{formatDuration(cameraSeconds)}</span> : null}
            </div>
            <footer>
              <button type="button" className="camera-cancel" onClick={closeCamera}>Cancel</button>
              {cameraMode === "photo" ? (
                <button type="button" className="camera-shutter" aria-label="Capture photo" onClick={captureCameraPhoto}><Camera size={27} /></button>
              ) : cameraRecording ? (
                <button type="button" className="camera-shutter recording" aria-label="Stop and send video" onClick={() => finishCameraVideoRecording("send")} disabled={cameraProcessing}><StopCircle size={27} /></button>
              ) : (
                <button type="button" className="camera-shutter video" aria-label="Start video recording" onClick={startCameraVideoRecording}><Video size={27} /></button>
              )}
              {cameraMode === "video" && cameraRecording ? <button type="button" className="camera-cancel" onClick={() => finishCameraVideoRecording("cancel")} disabled={cameraProcessing}>Discard</button> : <span className="camera-footer-space" aria-hidden="true" />}
            </footer>
          </section>
        </div>
      ) : null}

      {viewerIndex !== null && mediaItems[viewerIndex] ? (() => {
        const item = mediaItems[viewerIndex];
        const source = item.attachment.url.startsWith("blob:") ? item.attachment.url : `${apiBase}${item.attachment.url}`;
        return (
          <div className="media-viewer" role="dialog" aria-modal="true" aria-label="Media viewer">
            <header>
              <span><strong>{item.attachment.original_filename}</strong><small>{formatBytes(item.attachment.size_bytes)}{item.attachment.width ? ` · ${item.attachment.width} × ${item.attachment.height}` : ""}</small></span>
              <div>
                {item.attachment.mime_type.startsWith("image/") ? <><button type="button" aria-label="Zoom out" onClick={() => setViewerZoom((zoom) => Math.max(0.5, zoom - 0.25))}><ZoomOut size={20} /></button><button type="button" aria-label="Actual size" onClick={() => setViewerZoom(1)}>1:1</button><button type="button" aria-label="Zoom in" onClick={() => setViewerZoom((zoom) => Math.min(4, zoom + 0.25))}><ZoomIn size={20} /></button></> : null}
                <button type="button" aria-label="Download" onClick={() => downloadAttachment(item.attachment)}><Download size={20} /></button>
                <button type="button" aria-label="Message information" onClick={() => setInfoTarget(item.message)}><Info size={20} /></button>
                <button type="button" aria-label="Close viewer" onClick={() => setViewerIndex(null)}><X size={22} /></button>
              </div>
            </header>
            <div className="media-viewer-stage">
              {item.attachment.mime_type.startsWith("image/") ? <img src={source} alt={item.attachment.original_filename} style={{ transform: `scale(${viewerZoom})` }} /> : <video src={source} controls autoPlay />}
            </div>
            {mediaItems.length > 1 ? <><button className="viewer-previous" type="button" aria-label="Previous media" onClick={() => { setViewerZoom(1); setViewerIndex((viewerIndex - 1 + mediaItems.length) % mediaItems.length); }}><ChevronLeft size={28} /></button><button className="viewer-next" type="button" aria-label="Next media" onClick={() => { setViewerZoom(1); setViewerIndex((viewerIndex + 1) % mediaItems.length); }}><ChevronRight size={28} /></button></> : null}
          </div>
        );
      })() : null}

      {mode === "staff" && infoOpen ? (
        <aside className="chat-info-panel">
          <header><strong>Contact info</strong><button type="button" aria-label="Close" onClick={() => setInfoOpen(false)}><X size={20} /></button></header>
          <div className="info-profile">{customerAvatar("large")}<h2>{customerDeliveryCode || customerName}</h2></div>
          <section><h3>Starred messages</h3>{visibleMessages.filter((message) => message.is_starred).map((message) => <button type="button" key={message.id} onClick={() => document.getElementById(`message-${message.id}`)?.scrollIntoView({ block: "center" })}>{messageText(message)}</button>)}</section>
          <section><h3>Media</h3><div className="shared-media-grid">{mediaItems.map((item) => <button key={item.attachment.id} type="button" onClick={() => openMediaViewer(item.attachment.id)}>{item.attachment.mime_type.startsWith("image/") ? <img src={`${apiBase}${item.attachment.thumbnail_url ?? item.attachment.url}`} alt={item.attachment.original_filename} /> : <video src={`${apiBase}${item.attachment.url}`} muted />}</button>)}</div>{!mediaItems.length ? <p>No shared media</p> : null}</section>
          <section><h3>Documents</h3>{sharedDocuments.map((item) => <button className="shared-file" type="button" key={item.attachment.id} onClick={() => downloadAttachment(item.attachment)}>{item.attachment.original_filename}<small>{formatBytes(item.attachment.size_bytes)} · {formatTime(item.message.created_at)}</small></button>)}{!sharedDocuments.length ? <p>No shared documents</p> : null}</section>
          <section><h3>Links</h3>{sharedLinks.map((link) => <a className="shared-file" key={link} href={link} target="_blank" rel="noreferrer">{link}</a>)}{!sharedLinks.length ? <p>No shared links</p> : null}</section>
        </aside>
      ) : null}

      {reactionTarget ? (
        <div className="reaction-picker" role="dialog" aria-label="Choose a reaction">
          {REACTIONS.map((reaction) => <button type="button" key={reaction} onClick={() => { updateMessageAction(reactionTarget, "react", { reaction: reactionTarget.reaction === reaction ? null : reaction }, { reaction: reactionTarget.reaction === reaction ? "" : reaction }); setReactionTarget(null); }}>{reaction}</button>)}
          <button type="button" aria-label="Close" onClick={() => setReactionTarget(null)}><X size={18} /></button>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="delete-dialog-backdrop" role="presentation">
          <section className="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <h2 id="delete-dialog-title">Delete message?</h2>
            {isOwnMessage(deleteTarget, mode) && !deleteTarget.deleted_at ? <button className="delete-everyone" type="button" onClick={deleteForEveryone}>Delete for everyone</button> : null}
            <button className="delete-me" type="button" onClick={deleteForMe}>Delete for me</button>
            <button className="delete-cancel" type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
          </section>
        </div>
      ) : null}

      {editTarget ? (
        <div className="delete-dialog-backdrop">
          <form className="edit-dialog" onSubmit={saveEdit}>
            <h2>Edit message</h2>
            <textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} autoFocus />
            <div><button type="button" onClick={() => setEditTarget(null)}>Cancel</button><button className="primary" type="submit"><Check size={17} /> Save</button></div>
          </form>
        </div>
      ) : null}

      {noteTarget ? (
        <div className="delete-dialog-backdrop">
          <form className="edit-dialog note-dialog" role="dialog" aria-modal="true" aria-labelledby="note-dialog-title" onSubmit={saveMessageNote}>
            <h2 id="note-dialog-title">Add text to note</h2>
            <textarea
              value={noteDraft}
              maxLength={1000}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Internal staff note"
              autoFocus
            />
            <small>{noteDraft.length}/1000</small>
            <div>
              <button type="button" onClick={() => setNoteTarget(null)}>Cancel</button>
              <button className="primary" type="submit"><Check size={17} /> Save note</button>
            </div>
          </form>
        </div>
      ) : null}

      {infoTarget ? (
        <div className="delete-dialog-backdrop">
          <section className="message-info-dialog" role="dialog" aria-modal="true">
            <header><h2>Message info</h2><button type="button" onClick={() => setInfoTarget(null)} aria-label="Close"><X size={20} /></button></header>
            <dl>
              <div><dt>Sent</dt><dd>{fullTimestamp(infoTarget.created_at)}</dd></div>
              <div><dt>Delivered</dt><dd>{fullTimestamp(infoTarget.delivered_at)}</dd></div>
              <div><dt>Read</dt><dd>{fullTimestamp(infoTarget.read_at)}</dd></div>
            </dl>
          </section>
        </div>
      ) : null}
    </main>
  );
}
