export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  company: string;
  gstNumber?: string;
  accountType: "Individual" | "Business";
  avatarUrl?: string | null;
  level: number;
  levelName: string;
  levelProgress: number;
  levelCurrent: number;
  levelTarget: number;
};

export type AddressItem = {
  id: string;
  type: "Home" | "Office" | "Other";
  name?: string;
  address: string;
  phone?: string;
  isDefault?: boolean;
};

export type PaymentMethod = {
  id: string;
  type: "card" | "upi";
  label: string;
  subtitle: string;
  isDefault?: boolean;
};

export type SavedDesign = {
  id: string;
  name: string;
  date: string;
  src: string;
  fileType: string;
  size: string;
  dimensions: string;
  resolution?: string;
  favorite?: boolean;
};
