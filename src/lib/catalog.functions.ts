import { createServerFn } from '@tanstack/react-start';
import { books as fallbackBooks, categories as fallbackCategories } from './catalog';
import { queryOptions } from '@tanstack/react-query';

export type SiteSettings = {
  home?: Record<string, string>;
  about?: Record<string, string>;
  contact?: Record<string, string>;
  branding?: Record<string, string>;
};

export const getPublicCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) return { books: fallbackBooks, categories: fallbackCategories, settings: {} as SiteSettings };
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith('sb_publishable_') && !key.startsWith('sb_secret_')) headers['Authorization'] = `Bearer ${key}`;
  const root = `${url.replace(/\/$/, '')}/rest/v1`;
  try {
    const [booksResponse, categoriesResponse, contentResponse] = await Promise.all([
      fetch(`${root}/storyguide_books?select=id,slug,title,category,subtitle,description,audience,themes,experience,cover_url,small_cover_url,pdf_path,published,sort_order&order=sort_order.asc`, { headers }),
      fetch(`${root}/storyguide_categories?select=slug,name,description,sort_order,visible&order=sort_order.asc`, { headers }),
      fetch(`${root}/storyguide_site_content?select=key,content`, { headers }),
    ]);
    if (!booksResponse.ok || !categoriesResponse.ok || !contentResponse.ok) throw new Error('Catalogue is not connected yet');
    const rows = await booksResponse.json() as Array<Record<string, unknown>>;
    const categoryRows = await categoriesResponse.json() as Array<Record<string, unknown>>;
    const contentRows = await contentResponse.json() as Array<{ key: keyof SiteSettings; content: Record<string, string> }>;
    const publicRows = rows.filter(row => row['published'] === true);
    const mappedBooks = publicRows.map(row => ({
      slug: String(row['slug']), title: String(row['title']), category: String(row['category']), subtitle: String(row['subtitle'] ?? ''),
      image: String(row['cover_url'] ?? ''), small: String(row['small_cover_url'] || row['cover_url'] || ''),
      description: String(row['description'] ?? ''), audience: String(row['audience'] ?? ''),
      themes: Array.isArray(row['themes']) ? row['themes'].map(String) : [], experience: String(row['experience'] ?? ''),
      id: String(row['id']), pdfPath: typeof row['pdf_path'] === 'string' ? row['pdf_path'] : null,
      pdfUrl: typeof row['pdf_path'] === 'string' ? `${url.replace(/\/$/, '')}/storage/v1/object/public/storyguide-pdfs/${row['pdf_path']}` : null,
      published: true, sortOrder: Number(row['sort_order'] ?? 0),
    }));
    const mappedCategories = categoryRows.filter(row => row['visible'] === true).map(row => ({
      slug: String(row['slug']), name: String(row['name']), description: String(row['description'] ?? ''),
    }));
    const settings = Object.fromEntries(contentRows.map(row => [row.key, row.content])) as SiteSettings;
    return {
      books: mappedBooks,
      categories: mappedCategories,
      settings,
    };
  } catch {
    return { books: fallbackBooks, categories: fallbackCategories, settings: {} as SiteSettings };
  }
});

export const catalogQuery = queryOptions({ queryKey: ['public-catalog'], queryFn: () => getPublicCatalog(), staleTime: 60_000 });
