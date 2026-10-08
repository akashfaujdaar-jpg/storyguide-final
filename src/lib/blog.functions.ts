import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

export const getPublishedPosts = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Blog connection unavailable');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers }); } } });
  const { data, error } = await client.from('blog_posts').select('id,slug,title,excerpt,body,created_at').eq('published', true).order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error('Could not load the journal');
  return data;
});
export const getEditorPosts = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: editor, error: roleError } = await context.supabase.rpc('is_editor');
  if (roleError || !editor) throw new Error('Publishing is restricted to the StoryGuide owner. Sign in with the StoryGuide Google account.');
  const { data, error } = await context.supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Could not load your posts');
  return data;
});
const postInput = z.object({ id: z.string().uuid().optional(), title: z.string().trim().min(1).max(180), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180), excerpt: z.string().trim().max(500), body: z.string().trim().min(1).max(60000), published: z.boolean() });
export const saveBlogPost = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(postInput).handler(async ({ context, data }) => {
  const { data: editor } = await context.supabase.rpc('is_editor');
  if (!editor) throw new Error('Only the StoryGuide owner can publish.');
  const { id, ...post } = data;
  const values = { ...post, updated_at: new Date().toISOString() };
  const result = id ? await context.supabase.from('blog_posts').update(values).eq('id', id).select('id').single() : await context.supabase.from('blog_posts').insert(values).select('id').single();
  if (result.error) throw new Error(result.error.code === '23505' ? 'That article address is already in use.' : 'Could not save the article. Please try again.');
  return result.data;
});
export const deleteBlogPost = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ context, data }) => {
  const { data: editor } = await context.supabase.rpc('is_editor');
  if (!editor) throw new Error('Only the StoryGuide owner can delete posts.');
  const { error } = await context.supabase.from('blog_posts').delete().eq('id', data.id);
  if (error) throw new Error('Could not delete the article.');
  return { ok: true };
});