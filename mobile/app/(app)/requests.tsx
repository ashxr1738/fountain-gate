import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { mobileApi } from '../../lib/api';
import type { EquipmentRequest } from '../../lib/types';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await mobileApi.getMyRequests();
      setRequests(data);
    } catch (err) {
      console.warn('Failed to load my requests', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending Approval', bg: '#713f12', text: '#fde047' };
      case 'APPROVED':
        return { label: 'Approved', bg: '#14532d', text: '#86efac' };
      case 'REJECTED':
        return { label: 'Rejected', bg: '#7f1d1d', text: '#fca5a5' };
      case 'COMPLETED':
        return { label: 'Completed', bg: '#1e3a8a', text: '#93c5fd' };
      default:
        return { label: status, bg: '#334155', text: '#cbd5e1' };
    }
  };

  const renderRequestItem = ({ item }: { item: EquipmentRequest }) => {
    const badge = getStatusBadge(item.status);
    const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.assetTitle}>
            {item.asset?.name || 'Equipment Item'}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.purposeText}>Purpose: {item.purpose}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>Requested on {dateStr}</Text>
          {item.pickup_verified_at && (
            <Text style={styles.verifiedText}>Verified Picked Up</Text>
          )}
        </View>
      </View>
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
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Requests Yet</Text>
            <Text style={styles.emptySub}>
              Select equipment from the Assets tab to request items for church services or events.
            </Text>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
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
  assetTitle: {
    fontSize: 16,
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
  purposeText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  verifiedText: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
