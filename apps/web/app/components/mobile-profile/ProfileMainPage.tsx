"use client";
import { useEffect, useState } from "react";
import { Camera, CreditCard, Image, LogOut, MapPin, Settings, CircleHelp, Crown, UserRound } from "lucide-react";
import BottomNav from "./components/BottomNav";
import SettingRow from "./components/SettingRow";
import { profileSample } from "./mobile-profile.data";

export default function ProfileMainPage(){
  const [p, setP] = useState(profileSample);
  useEffect(() => {
    fetch(`${window.location.origin}/api/customers/me`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const customer = payload?.customer;
        if (!customer) return;
        const name = customer.contact_name || customer.business_name || profileSample.name;
        setP({ ...profileSample, name, email: customer.email || profileSample.email, phone: customer.mobile || profileSample.phone, company: customer.business_name || profileSample.company, gstNumber: customer.gst_number || profileSample.gstNumber, levelName: customer.level || profileSample.levelName });
      }).catch(() => undefined);
  }, []);
  return <main className="or-profile-page"><div className="or-profile-scroll"><section className="or-profile-greeting"><p>Good morning,</p><h1>{p.name} 👋</h1><span>Manage your account and preferences.</span></section><section className="or-profile-identity-card"><div className="or-profile-avatar">{p.name.slice(0,2).toUpperCase()}<button aria-label="Change photo"><Camera size={14}/></button></div><strong>{p.name}</strong><small>{p.email}</small><span className="or-profile-pill">Customer</span></section><section className="or-profile-level-card"><Crown size={30}/><div><strong>Level {p.level} · {p.levelName}</strong><small>{p.levelCurrent} / {p.levelTarget} to Level {p.level+1}</small><div><i style={{width:`${p.levelProgress}%`}}/></div></div><b>{p.levelProgress}%</b></section><section className="or-setting-list"><SettingRow icon={UserRound} title="Edit Profile" href="/profile?section=account"/><SettingRow icon={MapPin} title="Address Book" href="/profile?section=addresses"/><SettingRow icon={CreditCard} title="Payment Methods" href="/profile?section=payments"/><SettingRow icon={Image} title="My Designs" href="/designs"/><SettingRow icon={Settings} title="Preferences" href="/profile?section=preferences"/><SettingRow icon={CircleHelp} title="Help & Support" href="/support"/><SettingRow icon={Crown} title="Level & Rewards" href="/profile?section=level"/><SettingRow icon={LogOut} title="Sign Out" danger/></section></div><BottomNav/></main>;
}
