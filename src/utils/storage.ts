import { StorageOptions } from '../types';

class StorageManager {
  private static instance: StorageManager;
  private storagePrefix = 'pointmoney_';

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private getKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  get(key: string, defaultValue: any = null): any {
    try {
      const prefixedKey = this.getKey(key);
      
      // First try localStorage
      const localValue = localStorage.getItem(prefixedKey);
      if (localValue) {
        const parsed = JSON.parse(localValue);
        // Sync to sessionStorage
        sessionStorage.setItem(prefixedKey, localValue);
        return parsed;
      }

      // Then try sessionStorage
      const sessionValue = sessionStorage.getItem(prefixedKey);
      if (sessionValue) {
        const parsed = JSON.parse(sessionValue);
        // Sync back to localStorage
        localStorage.setItem(prefixedKey, sessionValue);
        return parsed;
      }

      return defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  set(key: string, value: any, options: StorageOptions = {}): boolean {
    try {
      const prefixedKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);

      // Save to both storages
      localStorage.setItem(prefixedKey, serializedValue);
      sessionStorage.setItem(prefixedKey, serializedValue);

      // Broadcast storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: prefixedKey,
        newValue: serializedValue,
        storageArea: localStorage
      }));

      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      const prefixedKey = this.getKey(key);
      localStorage.removeItem(prefixedKey);
      sessionStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  sync(): void {
    try {
      // Sync localStorage to sessionStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storagePrefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            sessionStorage.setItem(key, value);
          }
        }
      }

      // Sync sessionStorage to localStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(this.storagePrefix)) {
          const value = sessionStorage.getItem(key);
          if (value) {
            localStorage.setItem(key, value);
          }
        }
      }
    } catch (error) {
      console.error('Storage sync error:', error);
    }
  }

  clear(): void {
    try {
      // Only clear items with our prefix
      const itemsToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storagePrefix)) {
          itemsToRemove.push(key);
        }
      }

      itemsToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
}

export const storage = StorageManager.getInstance();