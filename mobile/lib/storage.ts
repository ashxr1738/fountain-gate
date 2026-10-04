import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'fgcn_auth_token';

let memoryToken: string | null = null;

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return memoryToken;
    }
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return memoryToken;
    }
  },

  async setToken(token: string): Promise<void> {
    memoryToken = token;
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('SecureStore save failed', e);
    }
  },

  async removeToken(): Promise<void> {
    memoryToken = null;
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('SecureStore remove failed', e);
    }
  },
};
