import { StaffCustomerEditor, type CustomerProfile } from "../[id]/staff-customer-editor";

const newCustomer: CustomerProfile = {
  id: "",
  contact_name: "",
  business_name: "",
  mobile: "",
  email: "",
  profile_image_url: null,
  gst_number: "",
  delivery_type: "courier",
  preferred_courier: "",
  delivery_code: "",
  billing_address: {
    door_no: "",
    street_name: "",
    village_city: "",
    landmark: "",
    pincode: "",
    district: "",
    state: "",
  },
  profile_locked: false,
  level: "standard",
  account_manager: "ODD RAVEN Support",
  security_note: "",
};

export default function NewStaffCustomerPage() {
  return <StaffCustomerEditor initialCustomer={newCustomer} isNew />;
}
