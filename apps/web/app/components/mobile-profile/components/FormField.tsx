export default function FormField({ label, value, placeholder, disabled = false, type = "text" }: { label: string; value?: string; placeholder?: string; disabled?: boolean; type?: string }) {
  return <label className="or-form-field"><span>{label}</span><input type={type} defaultValue={value} placeholder={placeholder} disabled={disabled}/></label>;
}
