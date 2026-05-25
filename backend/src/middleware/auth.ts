import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    tenantId: number;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super-secret-key-marcenaria-mvp';
    const verified = jwt.verify(token, secret) as { id: number; email: string; role: string; tenantId: number };
    req.user = verified;

    // Verificar se o trial está expirado, exceto para as rotas liberadas
    const isExemptRoute = req.path === '/auth/me' || req.path === '/tenants/subscribe';
    if (!isExemptRoute) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: verified.tenantId },
        select: { plan: true, trialEndsAt: true }
      });

      if (tenant && tenant.plan === 'TRIAL' && new Date() > new Date(tenant.trialEndsAt)) {
        return res.status(402).json({
          error: 'TRIAL_EXPIRED',
          message: 'Seu período de teste de 14 dias expirou.'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};
