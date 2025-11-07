import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  APP_TOKEN: 'app_token',
};

export const storage = {
  async saveTokens(accessToken: any, refreshToken: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, JSON.stringify(accessToken));
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('❌ Erro ao salvar tokens:', error);
      throw error;
    }
  },

  async getAccessToken() {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      return token ? JSON.parse(token) : null;
    } catch (error) {
      console.error('❌ Erro ao buscar access token:', error);
      return null;
    }
  },

  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('❌ Erro ao buscar refresh token:', error);
      return null;
    }
  },

  async saveUserData(userData: any) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('❌ Erro ao salvar dados do usuário:', error);
    }
  },

  async getUserData() {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      return null;
    }
  },

  async saveAppToken(appToken: any) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.APP_TOKEN, JSON.stringify(appToken));
    } catch (error) {
      console.error('❌ Erro ao salvar app token:', error);
    }
  },

  async getAppToken() {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.APP_TOKEN);
      return token ? JSON.parse(token) : null;
    } catch (error) {
      console.error('❌ Erro ao buscar app token:', error);
      return null;
    }
  },

  async clearAll() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('❌ Erro ao limpar storage:', error);
    }
  },

  async clearAllIncludingApp() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.APP_TOKEN);
    } catch (error) {
      console.error('❌ Erro ao limpar storage completo:', error);
    }
  },
};
