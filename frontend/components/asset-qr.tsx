"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
export function AssetQr({ code }: { code: string }) {
  const [url, setUrl] = useState(code);
  useEffect(() => setUrl(`${window.location.origin}/assets/code/${encodeURIComponent(code)}`), [code]);
  return <div className="inline-flex rounded-lg bg-white p-3"><QRCodeSVG value={url} size={160} includeMargin /></div>;
}
