import { ProfileEditor } from "./profile-editor";
import ProfileSuiteRouter from "../components/mobile-profile/ProfileSuiteRouter";
import { Suspense } from "react";

export default function ProfilePage() {
  return <><Suspense fallback={null}><ProfileSuiteRouter /></Suspense><div className="desktop-profile-only"><ProfileEditor /></div></>;
}
