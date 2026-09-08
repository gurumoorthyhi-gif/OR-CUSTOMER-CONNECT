import { notFound } from "next/navigation";

import { apiGet } from "../../../lib/api";
import { StaffCustomerEditor } from "./staff-customer-editor";

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
  delivery_code: string;
  billing_address: {
    door_no: string;
    street_name: string;
    village_city: string;
    landmark: string;
    pincode: string;
    district: string;
    state: string;
  } | null;
  profile_locked: boolean;
  level: string;
  account_manager: string | null;
  security_note: string | null;
};

const fallbackCustomer: CustomerProfile = {
  id: "OR-TN-0001",
  contact_name: "Sowmiya",
  business_name: "Sowmiya Prints",
  mobile: "+91 98765 43210",
  email: "orders@sowmiyaprints.example",
  profile_image_url: null,
  gst_number: "33ABCDE1234F1Z5",
  delivery_type: "courier",
  preferred_courier: "DTDC",
  delivery_code: "CO-0001-SOW-CHN",
  billing_address: { door_no: "", street_name: "", village_city: "", landmark: "", pincode: "", district: "", state: "" },
  profile_locked: false,
  level: "Dealer",
  account_manager: "ODD RAVEN Support",
  security_note: "OTP login active",
};

export default async function StaffCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await apiGet<CustomerProfile | null>(`/api/customers/${encodeURIComponent(id)}`, id === fallbackCustomer.id ? fallbackCustomer : null);
  if (!customer) notFound();
  return <StaffCustomerEditor initialCustomer={customer} />;
}
