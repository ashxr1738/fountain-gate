import { useEffect, useRef, useState, useCallback } from "react";
import {
  BarcodeFormat,
  DecodeHintType,
  MultiFormatReader,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from "@zxing/library";
import { Camera, X, SwitchCamera, ScanLine, Zap, ZapOff, CheckCircle2, Image as ImageIcon } from "lucide-react";

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

/** Clean and parse scanned content (URLs, JSON, fgcn:// schema, or plain code) */
function parseScannedCode(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Try JSON payload
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.asset_code) return String(parsed.asset_code).trim();
    if (parsed.code) return String(parsed.code).trim();
    if (parsed.id) return String(parsed.id).trim();
  } catch {}

  // Try URL parsing
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("fgcn://")) {
      const url = new URL(trimmed);
      const codeParam = url.searchParams.get("code") || url.searchParams.get("asset_code") || url.searchParams.get("id");
      if (codeParam) return decodeURIComponent(codeParam).trim();

      const match = url.pathname.match(/\/(?:assets|equipment|items?)\/(?:code\/)?([^/]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]).trim();
    }
  } catch {}

  return trimmed;
}

/** Play instant audio confirmation beep */
function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {}
}

/** Trigger haptic vibration if supported */
function triggerVibrate() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 40, 50]);
    }
  } catch {}
}

// Prepare ZXing reader with all 1D and 2D barcode formats and aggressive detection hints
function createZxingReader(): MultiFormatReader {
  const reader = new MultiFormatReader();
  const hints = new Map<DecodeHintType, unknown>();
  const formats: BarcodeFormat[] = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.AZTEC,
    BarcodeFormat.PDF_417,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
    BarcodeFormat.RSS_14,
    BarcodeFormat.RSS_EXPANDED,
  ];
  hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
  hints.set(DecodeHintType.TRY_HARDER, true);
  reader.setHints(hints);
  return reader;
}

export function QrScanner({
  onDetected,
  title = "Scan an asset",
  subtitle = "Point the camera at a QR code or barcode on the equipment label.",
  autoStart = false,
  inline = false,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const zxingReaderRef = useRef<MultiFormatReader | null>(null);
  const nativeDetectorRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [detectedValue, setDetectedValue] = useState("");
  const [detectedFormat, setDetectedFormat] = useState("");
  const [flashAnim, setFlashAnim] = useState(false);
  const [torch, setTorch] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Initialize BarcodeDetector API if available
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        nativeDetectorRef.current = new BarcodeDetectorClass({
          formats: [
            "qr_code",
            "code_128",
            "code_39",
            "code_93",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "itf",
            "codabar",
            "data_matrix",
            "aztec",
            "pdf417",
          ],
        });
      }
    } catch {
      nativeDetectorRef.current = null;
    }
  }, []);

  const handleSuccess = useCallback(
    (rawValue: string, formatLabel: string = "Code") => {
      if (!isScanningRef.current) return;
      isScanningRef.current = false;
      const cleanValue = parseScannedCode(rawValue);
      if (!cleanValue) return;

      playBeep();
      triggerVibrate();
      setDetectedValue(cleanValue);
      setDetectedFormat(formatLabel);
      setFlashAnim(true);
      setTimeout(() => setFlashAnim(false), 450);

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setScanning(false);
      setTorch(false);

      onDetected(cleanValue);
    },
    [onDetected]
  );

  // Core frame-by-frame scanner loop
  const scanLoop = useCallback(() => {
    if (!isScanningRef.current || !videoRef.current) return;
    const video = videoRef.current;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      // 1. Try Native BarcodeDetector first (extremely fast & robust)
      if (nativeDetectorRef.current) {
        nativeDetectorRef.current
          .detect(video)
          .then((barcodes: Array<{ rawValue: string; format?: string }>) => {
            if (!isScanningRef.current) return;
            if (barcodes && barcodes.length > 0) {
              const b = barcodes[0];
              const fmt = b.format ? b.format.toUpperCase().replace(/_/g, " ") : "Barcode";
              handleSuccess(b.rawValue, fmt);
              return;
            }
            // Fallback to ZXing in this frame if native didn't detect
            fallbackZxingScan();
          })
          .catch(() => {
            fallbackZxingScan();
          });
      } else {
        fallbackZxingScan();
      }
    } else {
      if (isScanningRef.current) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    }

    function fallbackZxingScan() {
      if (!isScanningRef.current || !videoRef.current) return;
      try {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);

          // Full frame scan with ZXing
          const imgData = ctx.getImageData(0, 0, width, height);
          const luminances = new Uint8ClampedArray(width * height);
          for (let i = 0; i < imgData.data.length; i += 4) {
            luminances[i / 4] = Math.round(
              0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]
            );
          }

          if (!zxingReaderRef.current) {
            zxingReaderRef.current = createZxingReader();
          }

          const lumSource = new RGBLuminanceSource(luminances, width, height);
          const binaryBitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
          const result = zxingReaderRef.current.decode(binaryBitmap);

          if (result && result.getText()) {
            const formatStr = result.getBarcodeFormat() ? String(result.getBarcodeFormat()) : "Barcode";
            handleSuccess(result.getText(), formatStr);
            return;
          }
        }
      } catch {
        // Normal if frame has no barcode yet
      }

      if (isScanningRef.current) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    }
  }, [handleSuccess]);

  const start = useCallback(async () => {
    setError("");
    setDetectedValue("");
    setDetectedFormat("");
    setScanning(true);
    isScanningRef.current = true;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          ...(facingMode === "environment" ? { focusMode: "continuous" } : {}),
        } as MediaTrackConstraints,
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Check flashlight support
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities?.() as any;
        setTorchAvailable(caps?.torch === true);
      }

      // Start scanning loop
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (scanError: any) {
      isScanningRef.current = false;
      setScanning(false);
      setError(
        scanError?.message ||
          "Camera access was denied or unavailable. Please check your browser permissions or use the upload button."
      );
    }
  }, [facingMode, scanLoop]);

  const stop = useCallback(() => {
    isScanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setScanning(false);
    setTorch(false);
    setTorchAvailable(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isScanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !scanning) {
      void start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch;
    void track.applyConstraints({ advanced: [{ torch: next } as any] });
    setTorch(next);
  }

  function switchCamera() {
    stop();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setTimeout(() => {
      void start();
    }, 150);
  }

  // Support file / photo upload for barcodes
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(url);
      // Try native detector on image
      if (nativeDetectorRef.current) {
        try {
          const barcodes = await nativeDetectorRef.current.detect(img);
          if (barcodes && barcodes.length > 0) {
            isScanningRef.current = true;
            handleSuccess(barcodes[0].rawValue, barcodes[0].format || "Image Code");
            return;
          }
        } catch {}
      }

      // Try ZXing on image canvas
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const luminances = new Uint8ClampedArray(img.width * img.height);
          for (let i = 0; i < imgData.data.length; i += 4) {
            luminances[i / 4] = Math.round(
              0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]
            );
          }
          const lumSource = new RGBLuminanceSource(luminances, img.width, img.height);
          const binaryBitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
          const reader = createZxingReader();
          const res = reader.decode(binaryBitmap);
          if (res && res.getText()) {
            isScanningRef.current = true;
            handleSuccess(res.getText(), "Barcode Image");
            return;
          }
        }
      } catch {}

      setError("Could not detect a valid QR code or barcode in the selected photo. Please try a clearer picture.");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Failed to load image file.");
    };
    img.src = url;
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
              <ScanLine size={14} /> Center QR code or barcode within target
            </p>
          </div>
        )}
        {detectedValue && !scanning && (
          <div className="scanner-detected">
            <span className="detected-badge">
              <CheckCircle2 size={14} /> Scanned: {detectedValue}
              {detectedFormat ? ` (${detectedFormat})` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="scanner-controls">
        {!scanning && (
          <>
            <button type="button" onClick={() => void start()} className="scanner-start-btn">
              <Camera size={17} /> {detectedValue ? "Scan again" : "Start camera"}
            </button>
            <button
              type="button"
              className="secondary scanner-ctrl-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo of QR or barcode"
            >
              <ImageIcon size={16} /> Upload image
            </button>
          </>
        )}
        {scanning && (
          <>
            <button type="button" className="scanner-ctrl-btn" onClick={switchCamera} title="Switch camera">
              <SwitchCamera size={17} />
            </button>
            {torchAvailable && (
              <button
                type="button"
                className={`scanner-ctrl-btn ${torch ? "active" : ""}`}
                onClick={toggleTorch}
                title="Toggle flashlight"
              >
                {torch ? <Zap size={17} /> : <ZapOff size={17} />}
              </button>
            )}
            <button
              type="button"
              className="secondary scanner-ctrl-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo of barcode"
            >
              <ImageIcon size={16} />
            </button>
            <button type="button" className="secondary scanner-stop-btn" onClick={stop}>
              <X size={15} /> Stop
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
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
