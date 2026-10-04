import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { mobileApi } from '../../lib/api';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react-native';

export default function QrScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

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
          Fountain Gate Equipment needs camera access to scan equipment QR tags for checkouts and returns.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || verifying) return;
    setScanned(true);
    setVerifying(true);

    try {
      const res = await mobileApi.verifyQrScan(data);
      setScanResult({
        success: true,
        message: res.message || 'QR code verified successfully!',
        details: res,
      });
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || 'QR verification failed or invalid code.',
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
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.hintText}>Align QR code inside frame to scan</Text>
        </View>
      </CameraView>

      {verifying && (
        <View style={styles.verifyingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.verifyingText}>Verifying QR code...</Text>
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
              {scanResult?.success ? 'Scan Verified' : 'Scan Failed'}
            </Text>

            <Text style={styles.modalMessage}>{scanResult?.message}</Text>

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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hintText: {
    color: '#ffffff',
    marginTop: 24,
    fontSize: 15,
    fontWeight: '500',
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    color: '#f8fafc',
    marginTop: 12,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
  },
  rescanBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
});
