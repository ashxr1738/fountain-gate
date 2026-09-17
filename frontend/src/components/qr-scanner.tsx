import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

type QrScannerProps = { onDetected: (value: string) => void };

function assetCode(value: string): string {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/assets\/code\/([^/]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {
    // QR values may be plain asset codes.
  }
  return value.trim();
}

export function QrScanner({ onDetected }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function start() {
    if (!videoRef.current) return;
    setError("");
    setScanning(true);
    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoRef.current,
        (result) => {
          if (!result) return;
          controlsRef.current?.stop();
          setScanning(false);
          onDetected(assetCode(result.getText()));
        },
      );
    } catch (scanError: any) {
      setScanning(false);
      setError(scanError?.message || "Camera access was denied. Check browser permissions and try again.");
    }
  }

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  return <section className="scanner panel">
    <div className="panel-heading"><div><h2>Scan an asset</h2><p className="muted">Use your phone camera to identify equipment.</p></div><button className="icon-button" title="Close scanner" onClick={stop}><X size={18} /></button></div>
    <div className="scanner-body"><video ref={videoRef} className="scanner-video" playsInline muted />{!scanning && <button onClick={() => void start()}><Camera size={16} /> Start camera</button>}{scanning && <button className="secondary" onClick={stop}>Stop camera</button>}{error && <p className="alert">{error}</p>}</div>
  </section>;
}
