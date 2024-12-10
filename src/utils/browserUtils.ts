import { useState, useEffect } from 'react';

/**
 * ブラウザの機能サポートをチェック
 */
export const checkFeatureSupport = (feature: string): boolean => {
  switch (feature) {
    case 'webp':
      const elem = document.createElement('canvas');
      if (elem.getContext && elem.getContext('2d')) {
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;

    case 'localStorage':
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }

    case 'indexedDB':
      return !!window.indexedDB;

    default:
      return false;
  }
};

/**
 * ブラウザ情報を取得
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (ua.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || "";
  } else if (ua.indexOf("Chrome") > -1) {
    browserName = "Chrome";
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || "";
  } else if (ua.indexOf("Safari") > -1) {
    browserName = "Safari";
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || "";
  } else if (ua.indexOf("Edge") > -1) {
    browserName = "Edge";
    browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || "";
  }

  return {
    name: browserName,
    version: browserVersion,
    isMobile: /Mobile|Android|iPhone/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
    isJapanese: /ja|ja-JP/.test(navigator.language),
  };
};

/**
 * 永続的なストレージ操作のラッパー
 */
export const storage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      // まずローカルストレージから取得
      const localItem = localStorage.getItem(key);
      if (localItem) {
        const parsedLocal = JSON.parse(localItem);
        // セッションストレージにも同期
        sessionStorage.setItem(key, localItem);
        return parsedLocal;
      }

      // セッションストレージをチェック
      const sessionItem = sessionStorage.getItem(key);
      if (sessionItem) {
        const parsedSession = JSON.parse(sessionItem);
        // ローカルストレージに同期
        localStorage.setItem(key, sessionItem);
        return parsedSession;
      }

      return defaultValue;
    } catch (e) {
      console.warn('Storage is not available:', e);
      return defaultValue;
    }
  },

  set: (key: string, value: any) => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      sessionStorage.setItem(key, serializedValue);

      // ストレージ変更イベントを発火
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: serializedValue,
        storageArea: localStorage
      }));

      return true;
    } catch (e) {
      console.warn('Storage is not available:', e);
      return false;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Storage is not available:', e);
      return false;
    }
  },

  sync: () => {
    try {
      // ローカルストレージの内容をセッションストレージに同期
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            sessionStorage.setItem(key, value);
          }
        }
      }

      // セッションストレージの内容をローカルストレージに同期
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value) {
            localStorage.setItem(key, value);
          }
        }
      }

      return true;
    } catch (e) {
      console.warn('Storage sync failed:', e);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      return true;
    } catch (e) {
      console.warn('Storage clear failed:', e);
      return false;
    }
  }
};

/**
 * 安全なrequestAnimationFrame
 */
export const raf = (callback: FrameRequestCallback): number => {
  return window.requestAnimationFrame?.(callback) || 
         window.setTimeout(callback, 1000 / 60);
};

/**
 * アニメーションフレームのキャンセル
 */
export const cancelRaf = (id: number): void => {
  (window.cancelAnimationFrame || window.clearTimeout)(id);
};

/**
 * IMEの状態を管理するフック
 */
export const useIME = () => {
  const [isIMEOn, setIsIMEOn] = useState(false);

  const handleCompositionStart = () => setIsIMEOn(true);
  const handleCompositionEnd = () => setIsIMEOn(false);

  return {
    isIMEOn,
    handlers: {
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
    },
  };
};

/**
 * ストレージの同期を行うフック
 */
export const useStorageSync = () => {
  useEffect(() => {
    // 初回マウント時にストレージを同期
    storage.sync();

    // ストレージの変更を監視
    const handleStorage = (e: StorageEvent) => {
      if (e.key && (e.storageArea === localStorage || e.storageArea === sessionStorage)) {
        const otherStorage = e.storageArea === localStorage ? sessionStorage : localStorage;
        if (e.newValue === null) {
          otherStorage.removeItem(e.key);
        } else {
          otherStorage.setItem(e.key, e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
};