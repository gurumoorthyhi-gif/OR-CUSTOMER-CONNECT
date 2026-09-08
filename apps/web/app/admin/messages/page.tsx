import { Messenger } from "../../components/messenger";
import { sampleMessages } from "../../data";
import { apiGet } from "../../lib/api";

type Message = {
  id?: number;
  from?: string;
  sender_type?: string;
  text?: string;
  body?: string;
  time?: string;
  created_at?: string;
};

export default async function AdminMessagesPage() {
  const messages = await apiGet<Message[]>("/api/messages?viewer_type=staff&limit=100", sampleMessages);

  return <Messenger messages={messages} mode="staff" />;
}
