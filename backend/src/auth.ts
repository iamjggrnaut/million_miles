import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from './config.js';
import type { LoginBody } from './schemas.js';

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export function login(req: Request, res: Response): void {
  const { login: username, password } = req.body as LoginBody;
  if (username !== env.ADMIN_LOGIN || password !== env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid login or password', code: 'INVALID_CREDENTIALS' });
    return;
  }
  const token = jwt.sign(
    { sub: username },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Authorization required', code: 'UNAUTHORIZED' });
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as Request & { user?: string }).user = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }
}
