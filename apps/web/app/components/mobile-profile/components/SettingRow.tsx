import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SettingRow({ icon: Icon, title, subtitle, href, danger = false, right }: { icon: React.ComponentType<{size?: number}>; title: string; subtitle?: string; href?: string; danger?: boolean; right?: React.ReactNode }) {
  const content = <><span className={`or-setting-icon ${danger?'danger':''}`}><Icon size={19}/></span><span className="or-setting-copy"><strong>{title}</strong>{subtitle ? <small>{subtitle}</small> : null}</span><span className="or-setting-right">{right ?? <ChevronRight size={18}/>}</span></>;
  return href ? <Link className={`or-setting-row ${danger?'danger':''}`} href={href}>{content}</Link> : <button className={`or-setting-row ${danger?'danger':''}`} type="button">{content}</button>;
}
