/**
 * Servicio de autenticación
 */

import { getAllowedUsers, getUserName } from '../config';
import { sendLoginCodeEmail } from '../mailer';
import { setPendingCode, consumePendingCode } from '../auth-store';

const allowedUsers = getAllowedUsers();

export class AuthService {

  isEmailAllowed(email: string): boolean {
    return allowedUsers.has(email);
  }

  getUserDisplayName(email: string): string {
    const name = getUserName(email);
    return name || email.split('@')[0] || 'Usuario';
  }

  async sendVerificationCode(email: string): Promise<void> {
    if (!this.isEmailAllowed(email)) {
      throw new Error('Email no autorizado');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

    setPendingCode(email, code, expiresAt);

    await sendLoginCodeEmail(email, code);
  }

  verifyCode(email: string, code: string): boolean {
    if (!this.isEmailAllowed(email)) {
      return false;
    }

    return consumePendingCode(email, code);
  }
}

export const authService = new AuthService();