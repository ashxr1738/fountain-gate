"use client";

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Camera, X, ScanLine } from "lucide-react";
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
  const [lastFormat, setLastFormat] = useState("");

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function start() {
    if (!videoRef.current) return;
    setError("");
    setOpen(true);
    setLastFormat("");
    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current,
        result => {
          if (!result) return;
          const code = getAssetCode(result.getText());
          // Detect format
          const fmt = result.getBarcodeFormat();
          const MAP: Record<number, string> = { 4: "Code 128", 7: "EAN-13", 11: "QR Code", 14: "UPC-A" };
          setLastFormat(MAP[fmt ?? -1] ?? "Barcode");
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
    {!open && <button type="button" onClick={() => void start()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-church-600 px-4 py-2 font-semibold text-church-700"><ScanLine size={17}/>Scan QR or barcode</button>}
    {open && <div className="space-y-3 rounded-lg border bg-slate-950 p-3">
      <div className="relative">
        <video ref={videoRef} className="w-full rounded-lg" playsInline muted />
        {/* Crosshair overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: "min(65%, 200px)", aspectRatio: "1" }}>
            <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-emerald-400 rounded-tl" />
            <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-emerald-400 rounded-tr" />
            <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
            <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-emerald-400 rounded-br" />
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          Scanning QR codes &amp; barcodes…
        </p>
      </div>
      <div className="flex justify-end"><button type="button" title="Stop scanner" onClick={close} className="rounded p-2 text-white"><X size={18}/></button></div>
    </div>}
    {lastFormat && !open && <p className="rounded-lg bg-emerald-950 p-3 text-sm text-emerald-300">{lastFormat} detected ✓</p>}
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>;
}
