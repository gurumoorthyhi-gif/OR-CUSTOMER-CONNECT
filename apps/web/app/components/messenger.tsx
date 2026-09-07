"use client";

import {
  Archive,
  CheckCheck,
  Image as ImageIcon,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Message = {
  id?: number;
  from?: string;
  sender_type?: string;
  text?: string;
  body?: string;
  time?: string;
  created_at?: string;
};

type MessengerProps = {
  messages: Message[];
  mode: "customer" | "staff";
};

const chats = [
  { id: "support", name: "ODD RAVEN Support", last: "Preview uploaded for approval.", time: "10:42 AM", unread: 2 },
  { id: "order", name: "OR-1028", last: "Streetwear chest logos", time: "10:20 AM", unread: 0 },
  { id: "accounts", name: "Accounts", last: "Estimate is ready.", time: "Yesterday", unread: 0 },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function isOwnMessage(message: Message, mode: MessengerProps["mode"]) {
  const sender = (message.from ?? message.sender_type ?? "").toLowerCase();
  return mode === "customer" ? sender === "you" || sender === "customer" : sender === "staff";
}

export function Messenger({ messages, mode }: MessengerProps) {
  const [activeChat, setActiveChat] = useState(chats[0]);
  const [draft, setDraft] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const visibleMessages = useMemo(() => localMessages, [localMessages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body && !attachmentName) {
      return;
    }

    const message: Message = {
      id: Date.now(),
      from: mode === "customer" ? "You" : "Staff",
      sender_type: mode === "customer" ? "customer" : "staff",
      text: attachmentName ? `${body || "Attachment"} (${attachmentName})` : body,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setLocalMessages((current) => [...current, message]);
    setDraft("");
    setAttachmentName("");

    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_type: message.sender_type,
        body: message.text,
        order_id: activeChat.id === "order" ? activeChat.name : undefined,
      }),
    }).catch(() => undefined);
  }

  return (
    <main className="messenger-shell">
      <aside className="messenger-sidebar">
        <div className="messenger-sidebar-header">
          <div className="avatar">OR</div>
          <div className="sidebar-actions">
            <button type="button" aria-label="Search chats">
              <Search size={18} />
            </button>
            <button type="button" aria-label="More options">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <label className="chat-search">
          <Search size={16} />
          <input placeholder="Search or start new chat" />
        </label>

        <div className="chat-list">
          {chats.map((chat) => (
            <button
              className={`chat-tile ${activeChat.id === chat.id ? "selected" : ""}`}
              type="button"
              key={chat.name}
              onClick={() => setActiveChat(chat)}
            >
              <div className="avatar">{initials(chat.name)}</div>
              <span>
                <strong>{chat.name}</strong>
                <small>{chat.last}</small>
              </span>
              <em>
                {chat.time}
                {chat.unread > 0 ? <b>{chat.unread}</b> : null}
              </em>
            </button>
          ))}
        </div>
      </aside>

      <section className="conversation">
        <header className="conversation-header">
          <div className="avatar">OR</div>
          <div>
            <strong>{mode === "customer" ? "ODD RAVEN Support" : "Sowmiya Prints"}</strong>
            <small>online</small>
          </div>
          <div className="conversation-actions">
            <button type="button" aria-label="Voice call">
              <Phone size={18} />
            </button>
            <button type="button" aria-label="Video call">
              <Video size={18} />
            </button>
            <button type="button" aria-label="More options">
              <MoreVertical size={18} />
            </button>
          </div>
        </header>

        <div className="conversation-body">
          <div className="date-pill">Today</div>
          {visibleMessages.map((message) => {
            const own = isOwnMessage(message, mode);
            return (
              <article className={`bubble ${own ? "own" : "theirs"}`} key={message.id ?? `${message.from}-${message.time}`}>
                <p>{message.text ?? message.body}</p>
                <span>
                  {message.time ?? "10:42 AM"}
                  {own ? <CheckCheck size={14} /> : null}
                </span>
              </article>
            );
          })}
          {attachmentName ? (
            <article className="attachment-preview">
              <ImageIcon size={18} />
              <span>{attachmentName}</span>
              <button type="button" onClick={() => setAttachmentName("")} aria-label="Remove attachment">
                Remove
              </button>
            </article>
          ) : null}
        </div>

        <form className="conversation-compose" onSubmit={sendMessage}>
          <button type="button" aria-label="Emoji">
            <Smile size={22} />
          </button>
          <label className="attach-button" aria-label="Attach file">
            <Paperclip size={22} />
            <input
              type="file"
              onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")}
            />
          </label>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message" />
          <button type="button" aria-label="Archive chat">
            <Archive size={20} />
          </button>
          <button className="send-round" type="submit" aria-label="Send message">
            <Send size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}
