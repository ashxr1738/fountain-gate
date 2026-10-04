"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  BarcodeFormat,
  DecodeHintType,
  MultiFormatReader,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from "@zxing/library";
import { Camera, X, ScanLine, Image as ImageIcon } from "lucide-react";

function getAssetCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.asset_code) return String(parsed.asset_code).trim();
    if (parsed.code) return String(parsed.code).trim();
    if (parsed.id) return String(parsed.id).trim();
  } catch {}

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

export function AssetScanner({
  onDetected,
}: {
  onDetected: (assetCode: string) => void;
}) {
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
  const [detectedFormat, setDetectedFormat] = useState("");

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
    (rawValue: string, formatName: string = "Code") => {
      if (!isScanningRef.current) return;
      isScanningRef.current = false;
      const clean = getAssetCode(rawValue);
      if (!clean) return;

      playBeep();
      setDetectedFormat(formatName);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setScanning(false);
      onDetected(clean);
    },
    [onDetected]
  );

  const scanLoop = useCallback(() => {
    if (!isScanningRef.current || !videoRef.current) return;
    const video = videoRef.current;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
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
            fallbackScan();
          })
          .catch(() => {
            fallbackScan();
          });
      } else {
        fallbackScan();
      }
    } else {
      if (isScanningRef.current) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    }

    function fallbackScan() {
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
            handleSuccess(result.getText(), "Barcode");
            return;
          }
        }
      } catch {}

      if (isScanningRef.current) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    }
  }, [handleSuccess]);

  const start = useCallback(async () => {
    setError("");
    setScanning(true);
    isScanningRef.current = true;
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      isScanningRef.current = false;
      setScanning(false);
      setError(err?.message || "Camera access was denied or unavailable.");
    }
  }, [scanLoop]);

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
  }, []);

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

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(url);
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
      setError("Could not detect a QR code or barcode in this image.");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Failed to load image.");
    };
    img.src = url;
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <video ref={videoRef} className="h-64 w-full object-cover" playsInline muted autoPlay />
        {scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="relative h-44 w-44 rounded-lg border-2 border-indigo-400/80">
              <span className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-indigo-300" />
              <span className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-indigo-300" />
              <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-indigo-300" />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-indigo-300" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
            </div>
            <p className="mt-2 text-xs text-white/80 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded">
              <ScanLine className="h-3 w-3" /> Align barcode or QR in box
            </p>
          </div>
        )}
        {detectedFormat && !scanning && (
          <div className="absolute top-2 right-2 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-semibold text-white">
            {detectedFormat} detected ✓
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!scanning ? (
          <>
            <button
              type="button"
              onClick={() => void start()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Camera className="h-4 w-4" /> Start camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              <ImageIcon className="h-4 w-4" /> Upload photo
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" /> Stop
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              title="Upload image"
            >
              <ImageIcon className="h-4 w-4" />
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

      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
