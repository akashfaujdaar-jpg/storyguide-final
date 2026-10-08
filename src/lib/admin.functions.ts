import { createServerFn } from '@tanstack/react-start';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { CmsDatabase } from './cms-database';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const adminContext = async (context: { supabase: unknown }) => {
  const client = context.supabase as SupabaseClient<CmsDatabase>;
  const { data, error } = await client.rpc('is_editor');
  if (error || data !== true) throw new Error('Publishing is restricted to the verified StoryGuide owner account.');
  return client;
};

export const getAdminContent = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const client = await adminContext(context);
  const [booksResult, categoriesResult, settingsResult] = await Promise.all([
    client.from('storyguide_books').select('*').order('sort_order'),
    client.from('storyguide_categories').select('*').order('sort_order'),
    client.from('storyguide_site_content').select('*'),
  ]);
  if (booksResult.error || categoriesResult.error || settingsResult.error) throw new Error('Could not load the publishing desk. Apply the StoryGuide CMS database migration first.');
  return { books: booksResult.data, categories: categoriesResult.data, settings: settingsResult.data };
});

const categoryInput = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), name: z.string().trim().min(1).max(100), description: z.string().max(1000), sort_order: z.number().int().min(0).max(10000), visible: z.boolean() });
export const saveCategory = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).validator(categoryInput).handler(async ({ context, data }) => {
  const client = await adminContext(context);
  const { error } = await client.from('storyguide_categories').upsert({ ...data, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.code === '23505' ? 'That category already exists.' : 'Could not save the category.');
  return { ok: true };
});
export const deleteCategory = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).validator(z.object({ slug: z.string() })).handler(async ({ context, data }) => {
  const client = await adminContext(context);
  const { error } = await client.from('storyguide_categories').delete().eq('slug', data.slug);
  if (error) throw new Error(error.code === '23503' ? 'Move or delete this category’s books before removing the category.' : 'Could not delete the category.');
  return { ok: true };
});

const bookInput = z.object({ id: z.string().uuid().optional(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180), title: z.string().trim().min(1).max(180), category: z.string().min(1), subtitle: z.string().max(240), description: z.string().max(5000), audience: z.string().max(1500), themes: z.array(z.string().max(80)).max(20), experience: z.string().max(2500), cover_url: z.string().max(1000).refine(value => value === '' || value.startsWith('/') || /^https:\/\//i.test(value), 'Use a site path or HTTPS image URL.'), small_cover_url: z.string().max(1000).refine(value => value === '' || value.startsWith('/') || /^https:\/\//i.test(value), 'Use a site path or HTTPS image URL.'), pdf_path: z.string().max(500).nullable(), published: z.boolean(), sort_order: z.number().int().min(0).max(10000) }).refine(value => !value.published || value.cover_url.length > 0, { path: ['cover_url'], message: 'Published books need a cover image.' });
export const saveBook = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).validator(bookInput).handler(async ({ context, data }) => {
  const client = await adminContext(context);
  const { id, ...book } = data;
  const payload = { ...book, updated_at: new Date().toISOString() };
  const result = id
    ? await client.from('storyguide_books').update(payload).eq('id', id).select('id').single()
    : await client.from('storyguide_books').insert(payload).select('id').single();
  if (result.error) throw new Error(result.error.code === '23505' ? 'That book address is already in use.' : 'Could not save the book.');
  return result.data;
});
export const deleteBook = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).validator(z.object({ id: z.string().uuid() })).handler(async ({ context, data }) => {
  const client = await adminContext(context);
  const { error } = await client.from('storyguide_books').delete().eq('id', data.id);
  if (error) throw new Error('Could not delete the book.');
  return { ok: true };
});

export const saveSiteContent = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).validator(z.object({ key: z.enum(['home', 'about', 'contact', 'branding']), content: z.record(z.string(), z.string()) })).handler(async ({ context, data }) => {
  const client = await adminContext(context);
  const { error } = await client.from('storyguide_site_content').upsert({ ...data, updated_at: new Date().toISOString() });
  if (error) throw new Error('Could not save the page settings.');
  return { ok: true };
});
