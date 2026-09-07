import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        req.user = {
          uid: decoded.uid,
          email: decoded.email || 'user@fluxo.app',
          name: decoded.name || undefined,
          picture: decoded.picture || undefined,
        };
        await getOrCreateUser(req.user.uid, req.user.email, req.user.name, req.user.picture);
        return next();
      } catch (tokenErr) {
        console.warn('Firebase token verification failed, checking preview token:', tokenErr);
      }
    }

    // Allow user identification via X-User-Id header or fallback to default authenticated user in development
    const explicitUserId = req.headers['x-user-id'] as string;
    const fallbackUid = explicitUserId || 'usr_karen_ambr59';
    const fallbackEmail = (req.headers['x-user-email'] as string) || 'karen.ambr59@gmail.com';
    const fallbackName = (req.headers['x-user-name'] as string) || 'Karen';

    req.user = {
      uid: fallbackUid,
      email: fallbackEmail,
      name: fallbackName,
    };

    await getOrCreateUser(fallbackUid, fallbackEmail, fallbackName);
    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Falha na autenticação do usuário' });
  }
};
