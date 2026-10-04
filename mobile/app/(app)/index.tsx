import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { mobileApi } from '../../lib/api';
import type { Asset } from '../../lib/types';
import { Search, Plus, X } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

export default function AssetsScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Request modal state
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const loadAssets = async () => {
    try {
      const data = await mobileApi.getAssets();
      setAssets(data);
    } catch (e) {
      console.warn('Failed to fetch assets', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAssets();
  };

  const filteredAssets = assets.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateRequest = async () => {
    if (!selectedAsset || !purpose.trim()) {
      setRequestError('Please provide a purpose for requesting this equipment.');
      return;
    }

    setSubmittingRequest(true);
    setRequestError('');
    try {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await mobileApi.requestEquipment({
        assetId: selectedAsset.id,
        purpose: purpose.trim(),
        requestedFrom: now.toISOString(),
        requestedUntil: tomorrow.toISOString(),
      });

      setRequestSuccess('Equipment request queued successfully!');
      setTimeout(() => {
        setRequestModalVisible(false);
        setSelectedAsset(null);
        setPurpose('');
        setRequestSuccess('');
        loadAssets();
      }, 1500);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'Available', bg: '#14532d', text: '#86efac' };
      case 'REQUESTED':
        return { label: 'Requested', bg: '#713f12', text: '#fde047' };
      case 'CHECKED_OUT':
        return { label: 'Checked Out', bg: '#7f1d1d', text: '#fca5a5' };
      default:
        return { label: status, bg: '#334155', text: '#cbd5e1' };
    }
  };

  const renderAssetCard = ({ item }: { item: Asset }) => {
    const badge = getStatusBadge(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedAsset(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.assetName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.assetCode}>Code: {item.asset_code}</Text>
        {item.category && (
          <Text style={styles.categoryText}>Category: {item.category}</Text>
        )}
        {item.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search equipment, code, or category..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Equipment List */}
      <FlatList
        data={filteredAssets}
        keyExtractor={(item) => item.id}
        renderItem={renderAssetCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No equipment found.</Text>
          </View>
        }
      />

      {/* Asset Details / QR Modal */}
      <Modal
        visible={!!selectedAsset}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAsset(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAsset && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedAsset.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedAsset(null)}>
                    <X color="#94a3b8" size={24} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSub}>Code: {selectedAsset.asset_code}</Text>

                {/* QR Code Display */}
                <View style={styles.qrContainer}>
                  <QRCode
                    value={selectedAsset.asset_code}
                    size={160}
                    color="#000000"
                    backgroundColor="#ffffff"
                  />
                  <Text style={styles.qrHint}>Scan QR code to verify or check out</Text>
                </View>

                {selectedAsset.status === 'AVAILABLE' && (
                  <TouchableOpacity
                    style={styles.requestBtn}
                    onPress={() => setRequestModalVisible(true)}
                  >
                    <Plus color="#ffffff" size={20} />
                    <Text style={styles.requestBtnText}>Request Equipment</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Request Submission Modal */}
      <Modal
        visible={requestModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Equipment</Text>
              <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            {requestError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{requestError}</Text>
              </View>
            ) : null}

            {requestSuccess ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{requestSuccess}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Purpose of Request</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Sunday Service Audio / Youth Event"
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={purpose}
              onChangeText={setPurpose}
            />

            <TouchableOpacity
              style={styles.submitRequestBtn}
              onPress={handleCreateRequest}
              disabled={submittingRequest}
            >
              {submittingRequest ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitRequestBtnText}>Submit Request Queue</Text>
              )}
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
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#f8fafc',
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#f8fafc',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assetCode: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 13,
    color: '#60a5fa',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  modalSub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
  },
  qrHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#475569',
  },
  requestBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  requestBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitRequestBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitRequestBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  successBox: {
    backgroundColor: '#14532d',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  successText: {
    color: '#86efac',
    fontSize: 13,
  },
});
