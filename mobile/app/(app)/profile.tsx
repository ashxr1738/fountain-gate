import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { User, LogOut, ShieldCheck, Mail } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Fountain Gate Mobile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <User color="#ffffff" size={48} />
        </View>
        <Text style={styles.userName}>{profile?.name || user?.email || 'User'}</Text>
        <View style={styles.roleBadge}>
          <ShieldCheck color="#60a5fa" size={14} style={{ marginRight: 4 }} />
          <Text style={styles.roleText}>{profile?.role || 'USER'}</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Mail color="#94a3b8" size={18} style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <LogOut color="#ef4444" size={20} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7f1d1d',
    paddingVertical: 14,
    borderRadius: 8,
  },
  signOutText: {
    color: '#fca5a5',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
