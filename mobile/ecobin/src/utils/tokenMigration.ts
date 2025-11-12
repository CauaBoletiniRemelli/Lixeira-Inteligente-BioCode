import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './storage';
import { STORAGE_KEYS } from '../config/env';

export async function migrateTokensToSecureStore(): Promise<boolean> {
  try {

    const oldUserToken = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    const oldRefreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const oldUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    const oldAppToken = await AsyncStorage.getItem(STORAGE_KEYS.APP_TOKEN);

    let migrated = false;

    if (oldUserToken) {
      try {
        const tokenObj = JSON.parse(oldUserToken);
        await storage.saveTokens(tokenObj, oldRefreshToken || '');
        migrated = true;
      } catch (e) {
        await storage.saveTokens({ token: oldUserToken }, oldRefreshToken || '');
        migrated = true;
      }
    }

    if (oldUserData) {
      try {
        const userData = JSON.parse(oldUserData);
        await storage.saveUserData(userData);
        migrated = true;
      } catch (e) {
        console.error('❌ Erro ao migrar dados do usuário:', e);
      }
    }

    if (oldAppToken) {
      try {
        const appTokenObj = JSON.parse(oldAppToken);
        await storage.saveAppToken(appTokenObj);
        migrated = true;
      } catch (e) {
        await storage.saveAppToken({ token: oldAppToken });
        migrated = true;
      }
    }

    if (migrated) {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.APP_TOKEN);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Erro durante migração de tokens:', error);
    return false;
  }
}

export async function checkIfMigrationNeeded(): Promise<boolean> {
  try {
    const oldUserToken = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    const newUserToken = await storage.getAccessToken();

    return !!oldUserToken && !newUserToken;
  } catch (error) {
    console.error('❌ Erro ao verificar necessidade de migração:', error);
    return false;
  }
}
