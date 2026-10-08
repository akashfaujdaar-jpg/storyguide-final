import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Save, Trash2, LogOut, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';
import { getAdminSession, loginAdmin, logoutAdmin } from '@/lib/admin-auth.functions';
import { getAdminContent, saveBook, deleteBook, createPdfUpload, createCoverUpload } from '@/lib/admin.functions';

export const Route = createFileRoute('/admin')({
  head: () => pageHead('StoryGuide Admin', 'Add and publish ebooks, book details, covers, and PDFs.', '/admin', true),
  component: AdminPage,
});

type CategoryDraft = { slug: string; name: string; description: string; sort_order: number; visible: boolean };
type BookDraft = { id?: string; slug: string; title: string; category: string; subtitle: string; description: string; audience: string; themes: string; experience: string; cover_url: string; small_cover_url: string; pdf_path: string | null; published: boolean; sort_order: number };
const emptyBook = (category = ''): BookDraft => ({ slug: '', title: '', category, subtitle: '', description: '', audience: '', themes: '', experience: '', cover_url: '', small_cover_url: '', pdf_path: null, published: false, sort_order: 0 });

function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabaseConfigured = Boolean(import.meta.env['VITE_SUPABASE_URL'] && import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']);
  const load = useServerFn(getAdminContent);
  const saveBookFn = useServerFn(saveBook);
  const deleteBookFn = useServerFn(deleteBook);
  const checkSessionFn = useServerFn(getAdminSession);
  const loginFn = useServerFn(loginAdmin);
  const logoutFn = useServerFn(logoutAdmin);
  const createPdfUploadFn = useServerFn(createPdfUpload);
  const createCoverUploadFn = useServerFn(createCoverUpload);
  const [signedIn, setSignedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [bookRows, setBookRows] = useState<Array<BookDraft & { id: string }>>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryDraft[]>([]);
  const [book, setBook] = useState<BookDraft>(emptyBook());

  async function refresh() {
    setLoading(true);
    setStatus('');
    try {
      const data = await load();
      setBookRows(data.books.map(row => ({ ...row, themes: row.themes.join(', ') })));
      setCategoryRows(data.categories);
      setAllowed(true);
    } catch (error) {
      setAllowed(false);
      setStatus(error instanceof Error ? error.message : 'Could not open the admin desk.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let mounted = true;
    void checkSessionFn().then(({ authenticated }) => {
      if (!mounted) return;
      setSignedIn(authenticated);
      if (authenticated) void refresh();
    });
    return () => { mounted = false; };
  }, [checkSessionFn]);

  async function login() {
    setBusy(true); setStatus('');
    try {
      await loginFn({ data: { password } });
      setPassword(''); setSignedIn(true); await refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Sign-in did not finish. Please try again.'); }
    finally { setBusy(false); }
  }
  async function logout() { await logoutFn(); setSignedIn(false); setAllowed(false); setBookRows([]); setStatus(''); await router.invalidate(); }
  function openBook(row?: BookDraft) { setBook(row ? { ...row } : emptyBook(categoryRows[0]?.slug ?? '')); setStatus(''); }
  async function submitBook(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('');
    try {
      const result = await saveBookFn({ data: { ...book, themes: book.themes.split(',').map(value => value.trim()).filter(Boolean), sort_order: Number(book.sort_order) } });
      await refresh(); await queryClient.invalidateQueries({ queryKey: ['public-catalog'] }); await router.invalidate(); setBook({ ...book, id: result.id }); setStatus(book.published ? 'Book published.' : 'Book saved as a draft.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save the book.'); }
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
      const { path, token } = await createPdfUploadFn({ data: { slug: book.slug, fileName: file.name } });
      const { error } = await supabase.storage.from('storyguide-pdfs').uploadToSignedUrl(path, token, file, { contentType: 'application/pdf', cacheControl: '31536000' });
      if (error) throw error;
      setBook(current => ({ ...current, pdf_path: path }));
      setStatus('PDF uploaded. Save the book to publish the new file link.');
    } catch { setStatus('Could not upload the PDF. Check the storage migration and owner sign-in.'); }
    finally { setBusy(false); input.value = ''; }
  }
  async function uploadCover(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/webp', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) { setStatus('Choose a WebP, JPEG, or PNG cover smaller than 10 MB.'); return; }
    if (!book.slug) { setStatus('Enter a book URL slug before uploading its cover.'); return; }
    setBusy(true); setStatus('Uploading cover…');
    try {
      const { path, token, publicUrl } = await createCoverUploadFn({ data: { slug: book.slug, contentType: file.type as 'image/webp' | 'image/jpeg' | 'image/png' } });
      const { error } = await supabase.storage.from('storyguide-covers').uploadToSignedUrl(path, token, file, { contentType: file.type, cacheControl: '31536000' });
      if (error) throw error;
      setBook(current => ({ ...current, cover_url: publicUrl, small_cover_url: publicUrl }));
      setStatus('Cover uploaded. Save the book to publish the new cover.');
    } catch { setStatus('Could not upload the cover. Check the Supabase storage migration and project settings.'); }
    finally { setBusy(false); input.value = ''; }
  }
  async function removeCurrentBook() {
    if (!book.id || !window.confirm('Delete this book permanently?')) return;
    setBusy(true);
    try { await deleteBookFn({ data: { id: book.id } }); setBook(emptyBook(categoryRows[0]?.slug ?? '')); await refresh(); await queryClient.invalidateQueries({ queryKey: ['public-catalog'] }); await router.invalidate(); setStatus('Book deleted.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not delete the book.'); }
    finally { setBusy(false); }
  }
  return <div className="editorial-container content-page admin-page">
    <div className="page-intro"><p className="eyebrow">StoryGuide publishing</p><h1>Admin desk</h1><p>Add and manage ebooks, book details, covers, and PDFs.</p></div>
    {!signedIn ? <form className="editor-login" onSubmit={event => { event.preventDefault(); void login(); }}><h2>Your publishing desk.</h2><p>Enter the admin password to continue.</p><Field label="Admin password"><input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></Field><Button variant="editorial" type="submit" disabled={busy}><PenLine />{busy ? 'Signing in…' : 'Sign in'}</Button>{status && <p className="form-status" role="status">{status}</p>}</form> : !supabaseConfigured ? <div className="editor-login"><h2>Connect your Supabase project to publish.</h2><p>Your password was accepted. The database connection is still missing. Add the Supabase URL, publishable key, and server-only service-role key in Vercel, then apply the StoryGuide CMS migration.</p></div> : <>
      <div className="admin-toolbar"><h2>Books &amp; PDFs</h2><Button type="button" variant="ghost" onClick={logout}><LogOut />Sign out</Button></div>
      {!allowed ? <div className="editor-login"><p>{loading ? 'Loading your ebook collection…' : status}</p>{!loading && <Button type="button" variant="outline" onClick={() => void refresh()}>Try again</Button>}</div> : <>
        <div className="admin-layout"><aside className="admin-list"><div className="admin-list-heading"><h2>Books</h2><Button type="button" size="sm" variant="outline" onClick={() => openBook()}><Plus />New</Button></div>{bookRows.map(row => <Button type="button" key={row.id} variant="ghost" className="editor-post" aria-pressed={book.id === row.id} onClick={() => openBook(row)}><span>{row.title}</span><span className="small-label">{row.published ? 'Published' : 'Draft'}</span></Button>)}</aside>
          <form className="contact-form admin-form" onSubmit={submitBook}><div className="admin-form-heading"><h2>{book.id ? 'Edit book' : 'New book'}</h2>{book.id && <Button type="button" variant="ghost" onClick={() => openBook()}><Plus />New</Button>}</div>
            <div className="form-pair"><Field label="Title"><input required maxLength={180} value={book.title} onChange={event => setBook({ ...book, title: event.target.value, ...(!book.id ? { slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) })} /></Field><Field label="URL slug"><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={book.slug} onChange={event => setBook({ ...book, slug: event.target.value })} /></Field></div>
            <div className="form-pair"><Field label="Category"><select required value={book.category} onChange={event => setBook({ ...book, category: event.target.value })}>{categoryRows.map(row => <option key={row.slug} value={row.slug}>{row.name}</option>)}</select></Field><Field label="Sort order"><input type="number" min="0" value={book.sort_order} onChange={event => setBook({ ...book, sort_order: Number(event.target.value) })} /></Field></div>
            <Field label="Subtitle"><input maxLength={240} value={book.subtitle} onChange={event => setBook({ ...book, subtitle: event.target.value })} /></Field>
            <Field label="Description"><textarea maxLength={5000} value={book.description} onChange={event => setBook({ ...book, description: event.target.value })} /></Field>
            <Field label="Who this book is for"><textarea maxLength={1500} value={book.audience} onChange={event => setBook({ ...book, audience: event.target.value })} /></Field>
            <Field label="Themes (comma separated)"><input value={book.themes} onChange={event => setBook({ ...book, themes: event.target.value })} /></Field>
            <Field label="About this book"><textarea maxLength={2500} value={book.experience} onChange={event => setBook({ ...book, experience: event.target.value })} /></Field>
            <div className="form-pair"><Field label="Cover image URL"><input required={book.published} value={book.cover_url} onChange={event => setBook({ ...book, cover_url: event.target.value, small_cover_url: book.small_cover_url || event.target.value })} placeholder="/covers/book-cover.webp" /></Field><Field label="Small cover URL"><input value={book.small_cover_url} onChange={event => setBook({ ...book, small_cover_url: event.target.value })} placeholder="Optional — uses cover URL" /></Field></div>
            <Field label="Or upload a cover image"><input type="file" accept="image/webp,image/jpeg,image/png" onChange={uploadCover} disabled={busy} /><span className="small-label">WebP, JPEG, or PNG · up to 10 MB. The file is served from Supabase Storage.</span></Field>
            <div className="admin-upload"><div><label htmlFor="book-pdf">PDF publication</label><p className="small-label">PDF only · up to 50 MB</p></div><input id="book-pdf" type="file" accept="application/pdf,.pdf" onChange={uploadPdf} disabled={busy} />{book.pdf_path && <><span className="small-label">PDF attached</span><Button type="button" variant="ghost" onClick={() => setBook({ ...book, pdf_path: null })}>Remove PDF</Button></>}</div>
            <label className="publish-toggle"><input type="checkbox" checked={book.published} onChange={event => setBook({ ...book, published: event.target.checked })} />Publish this title on the website</label>
            <div className="admin-form-actions"><Button variant="editorial" disabled={busy}><Save />{busy ? 'Saving…' : book.published ? 'Save & publish' : 'Save draft'}</Button>{book.id && <Button type="button" variant="ghost" onClick={removeCurrentBook} disabled={busy}><Trash2 />Delete</Button>}</div>
          </form></div>
      </>}
    </>}
    {status && signedIn && allowed && <p className="form-status" role="status">{status}</p>}
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="form-field"><span>{label}</span>{children}</label>; }

