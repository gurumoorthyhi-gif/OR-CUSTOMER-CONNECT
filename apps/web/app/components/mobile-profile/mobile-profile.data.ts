import type { AddressItem, CustomerProfile, PaymentMethod, SavedDesign } from "./mobile-profile.types";

export const profileSample: CustomerProfile = {
  name: "Guru",
  email: "guru@example.com",
  phone: "+91 98765 43210",
  company: "Guru Prints",
  gstNumber: "33ABCDE1234F1Z5",
  accountType: "Business",
  avatarUrl: null,
  level: 3,
  levelName: "Dealer",
  levelProgress: 72,
  levelCurrent: 721,
  levelTarget: 1000,
};

export const addressSample: AddressItem[] = [
  { id: "home", type: "Home", name: "Guru", address: "123, Park Street, Anna Nagar, Chennai, Tamil Nadu, 600040, India", phone: "+91 98765 43210", isDefault: true },
  { id: "office", type: "Office", name: "Guru Prints", address: "456, Industrial Area, Tiruppur, Tamil Nadu, 641021, India", phone: "+91 98765 43210" },
  { id: "other", type: "Other", address: "789, Green Avenue, Adyar, Chennai, Tamil Nadu, 600020, India" },
];

export const paymentSample: PaymentMethod[] = [
  { id: "visa", type: "card", label: "•••• 4242", subtitle: "Visa · Expires 12/27", isDefault: true },
  { id: "card2", type: "card", label: "•••• 5555", subtitle: "Card · Expires 08/26" },
  { id: "upi", type: "upi", label: "guru@okaxis", subtitle: "UPI" },
];

export const designsSample: SavedDesign[] = [
  { id: "raven", name: "raven_logo.png", date: "12 Nov 2026", src: "/designs/raven.svg", fileType: "PNG", size: "2.4 MB", dimensions: "12 × 12 in", resolution: "300 DPI", favorite: true },
  { id: "good", name: "good_vibes.png", date: "10 Nov 2026", src: "/designs/good-vibes.svg", fileType: "PNG", size: "1.8 MB", dimensions: "10 × 12 in" },
  { id: "butterfly", name: "butterfly.png", date: "8 Nov 2026", src: "/designs/butterfly.svg", fileType: "PNG", size: "1.3 MB", dimensions: "10 × 10 in" },
  { id: "skull", name: "skull_art.png", date: "5 Nov 2026", src: "/designs/skull.svg", fileType: "PNG", size: "3.1 MB", dimensions: "12 × 14 in" },
  { id: "tiger", name: "tiger_art.png", date: "1 Nov 2026", src: "/designs/tiger.svg", fileType: "PNG", size: "2.2 MB", dimensions: "12 × 12 in" },
  { id: "smile", name: "smiley.png", date: "28 Oct 2026", src: "/designs/smiley.svg", fileType: "PNG", size: "900 KB", dimensions: "8 × 8 in" },
];
