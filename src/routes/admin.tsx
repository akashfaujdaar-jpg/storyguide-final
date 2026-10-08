import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Save, Trash2, Upload, LogOut, PenLine, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { getAdminContent, saveBook, deleteBook, saveCategory, deleteCategory, saveSiteContent } from '@/lib/admin.functions';
import type { CmsDatabase } from '@/lib/cms-database';
import type { SupabaseClient } from '@supabase/supabase-js';

export const Route = createFileRoute('/admin')({
  head: () => pageHead('StoryGuide Admin', 'Manage StoryGuide books, pages, categories, and PDF publications.', '/admin', true),
  component: AdminPage,
});

type CategoryDraft = { slug: string; name: string; description: string; sort_order: number; visible: boolean };
type BookDraft = { id?: string; slug: string; title: string; category: string; subtitle: string; description: string; audience: string; themes: string; experience: string; cover_url: string; small_cover_url: string; pdf_path: string | null; published: boolean; sort_order: number };
type ContentKey = 'home' | 'about' | 'contact' | 'branding';
const emptyBook = (category = ''): BookDraft => ({ slug: '', title: '', category, subtitle: '', description: '', audience: '', themes: '', experience: '', cover_url: '', small_cover_url: '', pdf_path: null, published: false, sort_order: 0 });
const contentFields: Record<ContentKey, Array<[string, string]>> = {
  home: [['eyebrow', 'Opening eyebrow'], ['headline', 'Main headline'], ['intro', 'Introduction'], ['featured_note', 'Featured section note'], ['closing_heading', 'Closing heading'], ['closing_copy', 'Closing paragraph']],
  about: [['eyebrow', 'Eyebrow'], ['headline', 'Page headline'], ['intro', 'Introduction'], ['idea_heading', 'Our idea heading'], ['idea_copy', 'Our idea'], ['collection_heading', 'Collection heading'], ['collection_copy', 'Collection description'], ['closing_heading', 'Closing heading'], ['closing_copy', 'Closing paragraph']],
  contact: [['headline', 'Page headline'], ['intro', 'Introduction'], ['email', 'Contact email'], ['instagram', 'Instagram URL']],
  branding: [['site_name', 'Site name'], ['edition', 'Header edition line'], ['footer_note', 'Footer note'], ['logo_alt', 'Logo description']],
};
const defaults: Record<ContentKey, Record<string, string>> = {
  home: { eyebrow: '— A note from the editor', headline: 'Stories worth spending time with.', intro: 'Fiction, ideas, perspectives and practical reads for the many chapters of life.', featured_note: 'Six covers · A first look', closing_heading: 'A note on the desk', closing_copy: 'Some books give you an escape. Others give you a different way of looking at your own life. StoryGuide brings both together — stories and ideas for every kind of reader, and every chapter of life.' },
  about: { eyebrow: 'The idea behind StoryGuide', headline: 'Stories for every kind of reader.', intro: 'A space for stories, ideas and books that explore the many different ways we experience life.', idea_heading: 'Our idea', idea_copy: 'Some stories make us feel understood. Some challenge the way we think. Some simply give us a few quiet minutes away from everything else.\n\nWe believe there is no single kind of reader — and no single kind of story worth telling.', collection_heading: 'What you’ll find here', collection_copy: 'From stories and fiction to ideas about how we live, StoryGuide brings different kinds of reading together.', closing_heading: 'For the many chapters of life', closing_copy: 'You might be looking for an escape. A fresh idea. A different way of understanding yourself or someone else. StoryGuide is for anyone who believes a good read is time well spent.' },
  contact: { headline: 'Get in touch.', intro: 'Have a question, feedback, idea, or something you’d like to share? We’d love to hear from you.', email: 'storyguidebooks@gmail.com', instagram: 'https://www.instagram.com/storyguidebooks?utm_source=qr' },
  branding: { site_name: 'StoryGuide', edition: 'The Publisher’s Desk — Stories, ideas & a little perspective', footer_note: 'A quiet reading room', logo_alt: 'StoryGuide reading book mark' },
};

function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabaseConfigured = Boolean(import.meta.env['VITE_SUPABASE_URL'] && import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']);
  const load = useServerFn(getAdminContent);
  const saveBookFn = useServerFn(saveBook);
  const deleteBookFn = useServerFn(deleteBook);
  const saveCategoryFn = useServerFn(saveCategory);
  const deleteCategoryFn = useServerFn(deleteCategory);
  const saveSiteFn = useServerFn(saveSiteContent);
  const [signedIn, setSignedIn] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [section, setSection] = useState('books');
  const [bookRows, setBookRows] = useState<Array<BookDraft & { id: string }>>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryDraft[]>([]);
  const [settings, setSettings] = useState<Record<ContentKey, Record<string, string>>>(defaults);
  const [book, setBook] = useState<BookDraft>(emptyBook());
  const [category, setCategory] = useState<CategoryDraft>({ slug: '', name: '', description: '', sort_order: 0, visible: true });

  async function refresh() {
    try {
      const data = await load();
      setBookRows(data.books.map(row => ({ ...row, themes: row.themes.join(', ') })));
      setCategoryRows(data.categories);
      const next = { ...defaults };
      for (const row of data.settings) next[row.key as ContentKey] = { ...defaults[row.key as ContentKey], ...row.content };
      setSettings(next);
      setAllowed(true);
    } catch (error) {
      setAllowed(false);
      setStatus(error instanceof Error ? error.message : 'Could not open the admin desk.');
    }
  }
  useEffect(() => {
    if (!supabaseConfigured) return;
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(Boolean(data.user));
      if (data.user) void refresh();
    });
    return () => { mounted = false; };
  }, [supabaseConfigured]);

  async function login() {
    setBusy(true); setStatus('');
    try {
      sessionStorage.setItem('storyguide-oauth-return', '/admin');
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/blog-editor` });
      if (result.error) throw result.error;
      if (!result.redirected) { setSignedIn(true); await refresh(); }
    } catch { setStatus('Sign-in did not finish. Please try again.'); }
    finally { setBusy(false); }
  }
  async function logout() { await supabase.auth.signOut(); setSignedIn(false); setAllowed(false); setBookRows([]); setStatus(''); await router.invalidate(); }
  function openBook(row?: BookDraft) { setBook(row ? { ...row } : emptyBook(categoryRows[0]?.slug ?? '')); setStatus(''); }
  function openCategory(row?: CategoryDraft) { setCategory(row ? { ...row } : { slug: '', name: '', description: '', sort_order: categoryRows.length + 1, visible: true }); setStatus(''); }
  async function submitBook(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('');
    try {
      const result = await saveBookFn({ data: { ...book, themes: book.themes.split(',').map(value => value.trim()).filter(Boolean), sort_order: Number(book.sort_order) } });
      await refresh(); await queryClient.invalidateQueries({ queryKey: ['public-catalog'] }); await router.invalidate(); setBook({ ...book, id: result.id }); setStatus(book.published ? 'Book published.' : 'Book saved as a draft.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save the book.'); }
    finally { setBusy(false); }
  }
  async function submitCategory(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('');
    try { await saveCategoryFn({ data: { ...category, sort_order: Number(category.sort_order) } }); await refresh(); await queryClient.invalidateQueries({ queryKey: ['public-catalog'] }); await router.invalidate(); setStatus('Category saved.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save the category.'); }
    finally { setBusy(false); }
  }
  async function uploadPdf(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size > 50 * 1024 * 1024) { setStatus('Choose a PDF smaller than 50 MB.'); return; }
    if (!book.slug) { setStatus('Save a book address before uploading its PDF.'); return; }
    setBusy(true); setStatus('Uploading PDF…');
    try {
      const client = supabase as unknown as SupabaseClient<CmsDatabase>;
      const path = `${book.slug}/${crypto.randomUUID()}.pdf`;
      const { error } = await client.storage.from('storyguide-pdfs').upload(path, file, { contentType: 'application/pdf', cacheControl: '31536000', upsert: false });
      if (error) throw error;
      setBook(current => ({ ...current, pdf_path: path }));
      setStatus('PDF uploaded. Save the book to publish the new file link.');
    } catch { setStatus('Could not upload the PDF. Check the storage migration and owner sign-in.'); }
    finally { setBusy(false); input.value = ''; }
  }
  async function removeCurrentBook() {
    if (!book.id || !window.confirm('Delete this book permanently?')) return;
    setBusy(true);
    try { await deleteBookFn({ data: { id: book.id } }); setBook(emptyBook(categoryRows[0]?.slug ?? '')); await refresh(); await queryClient.invalidateQueries({ queryKey: ['public-catalog'] }); await router.invalidate(); setStatus('Book deleted.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not delete the book.'); }
    finally { setBusy(false); }
  }
  async function removeCategory(slug: string) {
    if (!window.confirm('Delete this category?')) return;
    try { await deleteCategoryFn({ data: { slug } }); await refresh(); await queryClient.invalidateQueries({ queryKey: ['public-catalog'] }); await router.invalidate(); setStatus('Category deleted.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not delete the category.'); }
  }
  async function saveSettings(key: ContentKey, event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('');
    try { await saveSiteFn({ data: { key, content: settings[key] } }); await queryClient.invalidateQueries({ queryKey: ['public-catalog'] }); await router.invalidate(); setStatus('Page settings saved.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save page settings.'); }
    finally { setBusy(false); }
  }

  const nav: Array<[string, string]> = [['books', 'Books & PDFs'], ['categories', 'Categories'], ['home', 'Home page'], ['about', 'About page'], ['contact', 'Contact page'], ['branding', 'Branding'], ['journal', 'Journal']];
  return <div className="editorial-container content-page admin-page">
    <div className="page-intro"><p className="eyebrow">StoryGuide publishing</p><h1>Admin desk</h1><p>Manage the reading collection, public pages, and published PDFs.</p></div>
    {!supabaseConfigured ? <div className="editor-login"><h2>Connect Supabase to enable publishing.</h2><p>The public site is running with its starter catalogue. Add the Supabase URL and publishable key in Vercel before using the admin desk.</p></div> : !signedIn ? <div className="editor-login"><h2>Your publishing desk.</h2><p>Sign in with the verified StoryGuide owner Google account.</p><Button variant="editorial" onClick={login} disabled={busy}><PenLine />Continue with Google</Button></div> : <>
      <div className="admin-toolbar"><nav className="admin-nav" aria-label="Admin sections">{nav.map(([id, label]) => <Button key={id} type="button" variant="filter" data-active={section === id} onClick={() => { setSection(id); setStatus(''); }}>{label}</Button>)}</nav><Button type="button" variant="ghost" onClick={logout}><LogOut />Sign out</Button></div>
      {!allowed ? <div className="editor-login"><p>{status || 'Checking owner access…'}</p></div> : <>
        {section === 'books' && <div className="admin-layout"><aside className="admin-list"><div className="admin-list-heading"><h2>Books</h2><Button type="button" size="sm" variant="outline" onClick={() => openBook()}><Plus />New</Button></div>{bookRows.map(row => <Button type="button" key={row.id} variant="ghost" className="editor-post" aria-pressed={book.id === row.id} onClick={() => openBook(row)}><span>{row.title}</span><span className="small-label">{row.published ? 'Published' : 'Draft'}</span></Button>)}</aside>
          <form className="contact-form admin-form" onSubmit={submitBook}><div className="admin-form-heading"><h2>{book.id ? 'Edit book' : 'New book'}</h2>{book.id && <Button type="button" variant="ghost" onClick={() => openBook()}><Plus />New</Button>}</div>
            <div className="form-pair"><Field label="Title"><input required maxLength={180} value={book.title} onChange={event => setBook({ ...book, title: event.target.value, ...(!book.id ? { slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) })} /></Field><Field label="URL slug"><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={book.slug} onChange={event => setBook({ ...book, slug: event.target.value })} /></Field></div>
            <div className="form-pair"><Field label="Category"><select required value={book.category} onChange={event => setBook({ ...book, category: event.target.value })}>{categoryRows.map(row => <option key={row.slug} value={row.slug}>{row.name}</option>)}</select></Field><Field label="Sort order"><input type="number" min="0" value={book.sort_order} onChange={event => setBook({ ...book, sort_order: Number(event.target.value) })} /></Field></div>
            <Field label="Subtitle"><input maxLength={240} value={book.subtitle} onChange={event => setBook({ ...book, subtitle: event.target.value })} /></Field>
            <Field label="Description"><textarea maxLength={5000} value={book.description} onChange={event => setBook({ ...book, description: event.target.value })} /></Field>
            <Field label="Who this book is for"><textarea maxLength={1500} value={book.audience} onChange={event => setBook({ ...book, audience: event.target.value })} /></Field>
            <Field label="Themes (comma separated)"><input value={book.themes} onChange={event => setBook({ ...book, themes: event.target.value })} /></Field>
            <Field label="About this book"><textarea maxLength={2500} value={book.experience} onChange={event => setBook({ ...book, experience: event.target.value })} /></Field>
            <div className="form-pair"><Field label="Cover image URL"><input required={book.published} value={book.cover_url} onChange={event => setBook({ ...book, cover_url: event.target.value, small_cover_url: book.small_cover_url || event.target.value })} placeholder="/covers/book-cover.webp" /></Field><Field label="Small cover URL"><input value={book.small_cover_url} onChange={event => setBook({ ...book, small_cover_url: event.target.value })} placeholder="Optional — uses cover URL" /></Field></div>
            <div className="admin-upload"><div><label htmlFor="book-pdf">PDF publication</label><p className="small-label">PDF only · up to 50 MB</p></div><input id="book-pdf" type="file" accept="application/pdf,.pdf" onChange={uploadPdf} disabled={busy} />{book.pdf_path && <><span className="small-label">PDF attached</span><Button type="button" variant="ghost" onClick={() => setBook({ ...book, pdf_path: null })}>Remove PDF</Button></>}</div>
            <label className="publish-toggle"><input type="checkbox" checked={book.published} onChange={event => setBook({ ...book, published: event.target.checked })} />Publish this title on the website</label>
            <div className="admin-form-actions"><Button variant="editorial" disabled={busy}><Save />{busy ? 'Saving…' : book.published ? 'Save & publish' : 'Save draft'}</Button>{book.id && <Button type="button" variant="ghost" onClick={removeCurrentBook} disabled={busy}><Trash2 />Delete</Button>}</div>
          </form></div>}
        {section === 'categories' && <div className="admin-layout"><aside className="admin-list"><div className="admin-list-heading"><h2>Categories</h2><Button type="button" size="sm" variant="outline" onClick={() => openCategory()}><Plus />New</Button></div>{categoryRows.map(row => <Button type="button" key={row.slug} variant="ghost" className="editor-post" onClick={() => openCategory(row)}><span>{row.name}</span><span className="small-label">{row.visible ? 'Visible' : 'Hidden'}</span></Button>)}</aside><form className="contact-form admin-form" onSubmit={submitCategory}><h2>{category.slug ? 'Edit category' : 'New category'}</h2><div className="form-pair"><Field label="Name"><input required value={category.name} onChange={event => setCategory({ ...category, name: event.target.value, ...(!category.slug ? { slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) })} /></Field><Field label="URL slug"><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={category.slug} onChange={event => setCategory({ ...category, slug: event.target.value })} /></Field></div><Field label="Description"><textarea value={category.description} onChange={event => setCategory({ ...category, description: event.target.value })} /></Field><Field label="Sort order"><input type="number" min="0" value={category.sort_order} onChange={event => setCategory({ ...category, sort_order: Number(event.target.value) })} /></Field><label className="publish-toggle"><input type="checkbox" checked={category.visible} onChange={event => setCategory({ ...category, visible: event.target.checked })} />Show category on the website</label><div className="admin-form-actions"><Button variant="editorial" disabled={busy}><Save />Save category</Button>{category.slug && <Button type="button" variant="ghost" onClick={() => void removeCategory(category.slug)}><Trash2 />Delete</Button>}</div></form></div>}
        {section === 'journal' && <section className="admin-journal"><p>Journal articles have their own plain text editor and publish controls.</p><Button variant="editorial" asChild><Link to="/blog-editor"><PenLine />Open journal editor</Link></Button></section>}
        {(['home', 'about', 'contact', 'branding'] as ContentKey[]).includes(section as ContentKey) && <SettingsEditor contentKey={section as ContentKey} values={settings[section as ContentKey]} busy={busy} onChange={values => setSettings({ ...settings, [section]: values })} onSubmit={event => saveSettings(section as ContentKey, event)} />}
      </>}
    </>}
    {status && signedIn && allowed && <p className="form-status" role="status">{status}</p>}
    <p className="admin-view-link"><a href="/" target="_blank" rel="noreferrer">View public website <ExternalLink size={14} /></a></p>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
function SettingsEditor({ contentKey, values, busy, onChange, onSubmit }: { contentKey: ContentKey; values: Record<string, string>; busy: boolean; onChange: (value: Record<string, string>) => void; onSubmit: (event: FormEvent) => void }) {
  return <form className="contact-form admin-form settings-editor" onSubmit={onSubmit}><h2>Edit {contentKey === 'home' ? 'home page' : `${contentKey} page`}</h2>{contentFields[contentKey].map(([key, label]) => <Field key={key} label={label}>{key.includes('copy') || key === 'intro' || key === 'headline' || key === 'edition' ? <textarea value={values[key] ?? ''} onChange={event => onChange({ ...values, [key]: event.target.value })} /> : <input type={key === 'email' ? 'email' : key === 'instagram' ? 'url' : 'text'} value={values[key] ?? ''} onChange={event => onChange({ ...values, [key]: event.target.value })} />}</Field>)}<Button variant="editorial" disabled={busy}><Save />Save changes</Button></form>;
}

