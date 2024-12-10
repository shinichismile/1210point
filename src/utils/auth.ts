import { storage } from './storage';
import type { User, AuthCredentials } from '../types';

const AUTH_KEY = 'auth_credentials';
const USERS_KEY = 'users';

// Initial admin credentials
export const AUTH_CREDENTIALS: AuthCredentials = {
  'kkkk1111': 'kkkk1111',
  'kkkk2222': 'kkkk2222',
};

class AuthManager {
  private static instance: AuthManager;
  private credentials: AuthCredentials;

  private constructor() {
    this.credentials = { ...AUTH_CREDENTIALS };
    this.loadCredentials();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private loadCredentials(): void {
    const saved = storage.get(AUTH_KEY);
    if (saved) {
      this.credentials = { ...AUTH_CREDENTIALS, ...saved };
    }
    // Ensure initial credentials are always saved
    this.saveCredentials();
  }

  private saveCredentials(): void {
    storage.set(AUTH_KEY, this.credentials);
  }

  addCredential(loginId: string, password: string): void {
    this.credentials[loginId] = password;
    this.saveCredentials();
  }

  verifyCredential(loginId: string, password: string): boolean {
    return this.credentials[loginId] === password;
  }

  removeCredential(loginId: string): void {
    delete this.credentials[loginId];
    this.saveCredentials();
  }

  getUsers(): Record<string, User> {
    return storage.get(USERS_KEY, {});
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    users[user.id] = user;
    storage.set(USERS_KEY, users);
  }

  removeUser(userId: string): void {
    const users = this.getUsers();
    delete users[userId];
    storage.set(USERS_KEY, users);
  }

  getCredentials(): AuthCredentials {
    return { ...this.credentials };
  }
}

export const authManager = AuthManager.getInstance();