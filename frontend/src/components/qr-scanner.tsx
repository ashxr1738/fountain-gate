import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, SwitchCamera, ScanLine, Zap, ZapOff } from "lucide-react";

type QrScannerProps = {
  onDetected: (value: string) => void;
  /** Label shown above the viewfinder */
  title?: string;
  /** Subtitle below the title */
  subtitle?: string;
  /** If true the scanner opens automatically on mount */
  autoStart?: boolean;
  /** Compact inline variant (no panel wrapper) */
  inline?: boolean;
};

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

/** Detect readable format name from ZXing BarcodeFormat enum value */
function formatLabel(format: number | undefined): string {
  const MAP: Record<number, string> = {
    0: "Aztec", 1: "Codabar", 2: "Code 39", 3: "Code 93",
    4: "Code 128", 5: "Data Matrix", 6: "EAN-8", 7: "EAN-13",
    8: "ITF", 9: "MaxiCode", 10: "PDF 417", 11: "QR Code",
    12: "RSS 14", 13: "RSS Expanded", 14: "UPC-A", 15: "UPC-E",
    16: "UPC/EAN", 17: "UPC-A (EAN)"
  };
  if (format === undefined || format === null) return "Code";
  return MAP[format] ?? "Barcode";
}

export function QrScanner({
  onDetected,
  title = "Scan an asset",
  subtitle = "Point the camera at a QR code or barcode on the equipment label.",
  autoStart = false,
  inline = false,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastFormat, setLastFormat] = useState("");
  const [flashAnim, setFlashAnim] = useState(false);
  const [torch, setTorch] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // cleanup on unmount
  useEffect(() => () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  // auto-start
  useEffect(() => {
    if (autoStart && !scanning) void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const start = useCallback(async () => {
    if (!videoRef.current) return;
    setError("");
    setScanning(true);
    setLastFormat("");
    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current,
        (result) => {
          if (!result) return;
          const label = formatLabel(result.getBarcodeFormat());
          setLastFormat(label);
          setFlashAnim(true);
          setTimeout(() => setFlashAnim(false), 400);
          controlsRef.current?.stop();
          controlsRef.current = null;
          setScanning(false);
          onDetected(assetCode(result.getText()));
        },
      );
      // check torch support
      const track = videoRef.current.srcObject instanceof MediaStream
        ? videoRef.current.srcObject.getVideoTracks()[0]
        : null;
      if (track) {
        const caps = track.getCapabilities?.() as any;
        setTorchAvailable(caps?.torch === true);
      }
    } catch (scanError: any) {
      setScanning(false);
      setError(scanError?.message || "Camera access was denied. Check browser permissions and try again.");
    }
  }, [facingMode, onDetected]);

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
    setTorch(false);
    setTorchAvailable(false);
  }

  function toggleTorch() {
    const track = videoRef.current?.srcObject instanceof MediaStream
      ? videoRef.current.srcObject.getVideoTracks()[0]
      : null;
    if (!track) return;
    const next = !torch;
    void track.applyConstraints({ advanced: [{ torch: next } as any] });
    setTorch(next);
  }

  function switchCamera() {
    stop();
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    // restart after state update
    setTimeout(() => void start(), 150);
  }

  const content = (
    <>
      <div className={`scanner-viewport ${flashAnim ? "scanner-flash" : ""}`}>
        <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
        {scanning && (
          <div className="scanner-overlay">
            <div className="scanner-crosshair">
              <span className="corner tl" />
              <span className="corner tr" />
              <span className="corner bl" />
              <span className="corner br" />
              <div className="scanner-line" />
            </div>
            <p className="scanner-hint">
              <ScanLine size={14} /> Scanning for QR codes &amp; barcodes…
            </p>
          </div>
        )}
        {lastFormat && !scanning && (
          <div className="scanner-detected">
            <span className="detected-badge">{lastFormat} detected ✓</span>
          </div>
        )}
      </div>

      <div className="scanner-controls">
        {!scanning && (
          <button type="button" onClick={() => void start()} className="scanner-start-btn">
            <Camera size={17} /> Start camera
          </button>
        )}
        {scanning && (
          <>
            <button type="button" className="scanner-ctrl-btn" onClick={switchCamera} title="Switch camera">
              <SwitchCamera size={17} />
            </button>
            {torchAvailable && (
              <button type="button" className={`scanner-ctrl-btn ${torch ? "active" : ""}`} onClick={toggleTorch} title="Toggle flashlight">
                {torch ? <Zap size={17} /> : <ZapOff size={17} />}
              </button>
            )}
            <button type="button" className="secondary scanner-stop-btn" onClick={stop}>
              <X size={15} /> Stop
            </button>
          </>
        )}
      </div>

      {error && <p className="alert">{error}</p>}
    </>
  );

  if (inline) return <div className="scanner-inline">{content}</div>;

  return (
    <section className="scanner panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
        {scanning && (
          <button type="button" className="icon-button" title="Close scanner" onClick={stop}>
            <X size={18} />
          </button>
        )}
      </div>
      <div className="scanner-body">{content}</div>
    </section>
  );
}
