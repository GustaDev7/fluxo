import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

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

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Autenticação obrigatória' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({ error: 'Supabase não configurado no servidor' });
    }

    const token = authHeader.slice('Bearer '.length);
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    }

    req.user = {
      uid: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name,
      picture: data.user.user_metadata?.avatar_url,
    };
    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Falha na autenticação do usuário' });
  }
};
