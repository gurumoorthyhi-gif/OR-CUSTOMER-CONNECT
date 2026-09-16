import { FileText, Home, MessageCircle, Plus, UserRound } from "lucide-react";
import Link from "next/link";

export default function BottomNav({ active = "Profile" }: { active?: "Home" | "Orders" | "New" | "Chat" | "Profile" }) {
  type NavItem = { label: "Home" | "Orders" | "New" | "Chat" | "Profile"; href: string; icon: typeof Home; primary?: boolean };
  const items: NavItem[] = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Orders", href: "/orders", icon: FileText },
    { label: "New", href: "/new-order", icon: Plus, primary: true },
    { label: "Chat", href: "/messages", icon: MessageCircle },
    { label: "Profile", href: "/profile", icon: UserRound },
  ];
  return <nav className="or-profile-bottom-nav" aria-label="Customer mobile navigation">{items.map(({label,href,icon:Icon,primary}) => <Link key={label} href={href} className={`${active===label?'active':''} ${primary?'primary':''}`}><span><Icon size={primary?26:22}/></span><small>{label}</small></Link>)}</nav>;
}
