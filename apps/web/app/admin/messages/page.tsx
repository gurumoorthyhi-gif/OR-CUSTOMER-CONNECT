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

type StaffCustomer = {
  id: string;
  business_name: string;
  profile_image_url?: string | null;
  delivery_code?: string;
};

export default async function AdminMessagesPage() {
  const messages = await apiGet<Message[]>("/api/messages?viewer_type=staff&limit=100", sampleMessages);
  const customers = await apiGet<StaffCustomer[]>("/api/customers", []);

  return <Messenger messages={messages} mode="staff" initialCustomer={customers[0] ?? null} />;
}
