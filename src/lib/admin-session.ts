import { createHmac, timingSafeEqual } from 'node:crypto';
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server';

const COOKIE = '__Host-storyguide-admin';
const SESSION_SECONDS = 60 * 60 * 8;

function sessionSecret() {
  const secret = process.env['ADMIN_SESSION_SECRET'];
  if (!secret || secret.length < 32) throw new Error('Admin login is not configured securely.');
  return secret;
}

function signature(payload: string) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function equalText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminPassword(password: string) {
  const configured = process.env['STORYGUIDE_ADMIN_PASSWORD'];
  if (!configured) throw new Error('Admin login is not configured. Set STORYGUIDE_ADMIN_PASSWORD in Vercel.');
  return equalText(password, configured);
}

export function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  setResponseHeader('Set-Cookie', `${COOKIE}=${payload}.${signature(payload)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`);
}

export function clearAdminSession() {
  setResponseHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

export function hasAdminSession() {
  const cookieHeader = getRequestHeader('cookie') ?? '';
  const raw = cookieHeader.split(/;\s*/).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return false;
  const [payload, providedSignature] = raw.split('.');
  if (!payload || !providedSignature) return false;
  try {
    if (!equalText(signature(payload), providedSignature)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return Number.isInteger(data.exp) && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function assertAdminSession() {
  if (!hasAdminSession()) throw new Error('Sign in to the StoryGuide admin desk to continue.');
}

