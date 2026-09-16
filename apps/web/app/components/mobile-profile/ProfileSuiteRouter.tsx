"use client";

import { useSearchParams } from "next/navigation";
import {
  AddPaymentMethodPage,
  AddressBookPage,
  EditAddressPage,
  EditProfilePage,
  HelpSupportPage,
  LevelRewardsPage,
  MyDesignsPage,
  PaymentMethodsPage,
  PreferencesPage,
  ProfileMainPage,
} from "./index";

export default function ProfileSuiteRouter() {
  const section = useSearchParams().get("section");
  if (section === "account") return <EditProfilePage />;
  if (section === "addresses") return <AddressBookPage />;
  if (section === "payments") return <PaymentMethodsPage />;
  if (section === "preferences" || section === "settings") return <PreferencesPage />;
  if (section === "level") return <LevelRewardsPage />;
  return <ProfileMainPage />;
}
