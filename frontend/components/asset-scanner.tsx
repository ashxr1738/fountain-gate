"use client";

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function getAssetCode(value: string): string {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/assets\/code\/([^/]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {
    // QR values may be plain asset codes.
  }
  return value.trim();
}

export function AssetScanner({ onDetected, redirectOnScan = false }: { onDetected?: (code: string) => void; redirectOnScan?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function start() {
    if (!videoRef.current) return;
    setError("");
    setOpen(true);
    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoRef.current,
        result => {
          if (!result) return;
          const code = getAssetCode(result.getText());
          controlsRef.current?.stop();
          setOpen(false);
          if (redirectOnScan) window.location.assign(`/assets/code/${encodeURIComponent(code)}`);
          else onDetected?.(code);
        },
      );
    } catch (scanError: any) {
      setOpen(false);
      setError(scanError?.message || "Camera access was denied. Check browser permissions and try again.");
    }
  }

  function close() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setOpen(false);
  }

  return <div className="space-y-3">
    {!open && <button type="button" onClick={() => void start()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-church-600 px-4 py-2 font-semibold text-church-700"><Camera size={17}/>Scan with camera</button>}
    {open && <div className="space-y-3 rounded-lg border bg-slate-950 p-3"><div className="flex justify-end"><button type="button" title="Stop scanner" onClick={close} className="rounded p-2 text-white"><X size={18}/></button></div><video ref={videoRef} className="w-full rounded-lg" playsInline muted /></div>}
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>;
}
