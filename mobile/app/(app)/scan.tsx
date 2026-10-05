import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';
import { mobileApi } from '../../lib/api';
import { CheckCircle2, AlertCircle, RefreshCw, Zap, ZapOff, SwitchCamera, Package } from 'lucide-react-native';

const ALL_BARCODE_TYPES: BarcodeType[] = [
  'qr',
  'code128',
  'code39',
  'code93',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'itf14',
  'codabar',
  'pdf417',
  'aztec',
  'datamatrix',
];

function parseScannedCode(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.asset_code) return String(parsed.asset_code).trim();
    if (parsed.code) return String(parsed.code).trim();
    if (parsed.id) return String(parsed.id).trim();
  } catch {}

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('fgcn://')) {
      const url = new URL(trimmed);
      const codeParam = url.searchParams.get('code') || url.searchParams.get('asset_code') || url.searchParams.get('id');
      if (codeParam) return decodeURIComponent(codeParam).trim();
      const match = url.pathname.match(/\/(?:assets|equipment|items?)\/(?:code\/)?([^/]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]).trim();
    }
  } catch {}

  return trimmed;
}

export default function QrScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
    details?: any;
  } | null>(null);

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSub}>
          Fountain Gate Equipment needs camera access to scan equipment QR tags and barcodes for checkouts and returns.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data, type }: { data: string; type: string }) => {
    if (scanned || verifying) return;
    setScanned(true);
    setVerifying(true);

    const cleanCode = parseScannedCode(data);

    try {
      const res = await mobileApi.verifyQrScan(cleanCode || data);
      setScanResult({
        success: true,
        message: res.message || 'Equipment code verified successfully!',
        code: cleanCode,
        details: res,
      });
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || `Scanned code: ${cleanCode}. Make sure this equipment is registered.`,
        code: cleanCode,
      });
    } finally {
      setVerifying(false);
      setResultModalVisible(true);
    }
  };

  const handleResetScan = () => {
    setResultModalVisible(false);
    setScanResult(null);
    setScanned(false);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ALL_BARCODE_TYPES,
        }}
      >
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setTorch((prev) => !prev)}
              accessibilityLabel="Toggle Flashlight"
            >
              {torch ? <Zap color="#fbbf24" size={24} /> : <ZapOff color="#ffffff" size={24} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
              accessibilityLabel="Switch Camera"
            >
              <SwitchCamera color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Target */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>

          <Text style={styles.hintText}>Center QR code or barcode in the target</Text>
        </View>
      </CameraView>

      {verifying && (
        <View style={styles.verifyingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.verifyingText}>Verifying equipment code...</Text>
        </View>
      )}

      {/* Result Modal */}
      <Modal
        visible={resultModalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleResetScan}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {scanResult?.success ? (
              <CheckCircle2 color="#22c55e" size={56} style={styles.modalIcon} />
            ) : (
              <AlertCircle color="#ef4444" size={56} style={styles.modalIcon} />
            )}

            <Text style={styles.modalTitle}>
              {scanResult?.success ? 'Code Detected' : 'Scan Result'}
            </Text>

            {scanResult?.code && (
              <View style={styles.codeBadge}>
                <Package color="#60a5fa" size={16} />
                <Text style={styles.codeBadgeText}>{scanResult.code}</Text>
              </View>
            )}

            <ScrollView style={{ maxHeight: 160 }}>
              <Text style={styles.modalMessage}>{scanResult?.message}</Text>
            </ScrollView>

            <TouchableOpacity style={styles.rescanBtn} onPress={handleResetScan}>
              <RefreshCw color="#ffffff" size={18} />
              <Text style={styles.rescanBtnText}>Scan Another Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  grantBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  grantBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#38bdf8',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  hintText: {
    color: '#f1f5f9',
    marginTop: 24,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    color: '#f8fafc',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  codeBadgeText: {
    color: '#93c5fd',
    fontWeight: '700',
    fontSize: 15,
  },
  modalMessage: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
  },
  rescanBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
