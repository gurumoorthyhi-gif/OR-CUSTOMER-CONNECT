"use client";
import { useState } from "react";
export default function Toggle({ defaultChecked = false, label }: { defaultChecked?: boolean; label: string }) {
  const [checked,setChecked]=useState(defaultChecked);
  return <button type="button" className={`or-toggle ${checked?'on':''}`} onClick={()=>setChecked(!checked)} aria-pressed={checked} aria-label={label}><i/></button>;
}
