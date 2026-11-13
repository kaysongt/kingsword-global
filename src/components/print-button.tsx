"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print certificate" }: { label?: string }) {
  return <button type="button" className="button-primary" onClick={() => window.print()}><Printer size={15} /> {label}</button>;
}
