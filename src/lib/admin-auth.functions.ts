import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { assertAdminSession, clearAdminSession, createAdminSession, hasAdminSession, verifyAdminPassword } from './admin-session';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const loginRateLimit = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const { getRequest } = await import('@tanstack/react-start/server');
  const request = getRequest();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const now = Date.now();
  const prior = loginAttempts.get(ip);
  if (prior && prior.resetAt > now && prior.count >= 5) throw new Error('Too many login attempts. Wait 15 minutes and try again.');
  const current = prior && prior.resetAt > now ? prior : { count: 0, resetAt: now + 15 * 60 * 1000 };
  current.count += 1;
  loginAttempts.set(ip, current);
  return next();
});

export const loginAdmin = createServerFn({ method: 'POST' }).middleware([loginRateLimit]).validator(z.object({ password: z.string().min(1).max(256) })).handler(({ data }) => {
  if (!verifyAdminPassword(data.password)) throw new Error('The password is incorrect.');
  createAdminSession();
  return { ok: true };
});

export const getAdminSession = createServerFn({ method: 'GET' }).handler(() => ({ authenticated: hasAdminSession() }));

export const logoutAdmin = createServerFn({ method: 'POST' }).handler(() => {
  assertAdminSession();
  clearAdminSession();
  return { ok: true };
});

export const requireAdminSession = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  assertAdminSession();
  return next({ context: { isStoryGuideAdmin: true as const } });
});

