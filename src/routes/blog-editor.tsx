import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { PenLine, Save, Trash2, LogOut, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { getEditorPosts, saveBlogPost, deleteBlogPost } from '@/lib/blog.functions';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/blog-editor')({ head: () => pageHead('Editor’s Desk | StoryGuide', 'The StoryGuide journal publishing desk.', '/blog-editor', true), component: Editor });
const emptyPost = { title: '', slug: '', excerpt: '', body: '', published: false };
type Draft = typeof emptyPost & { id?: string };
type SavedPost = Awaited<ReturnType<typeof getEditorPosts>>[number];
function Editor() {
  const [signedIn, setSignedIn] = useState(false);
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyPost);
  const [status, setStatus] = useState('');
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useServerFn(getEditorPosts);
  const save = useServerFn(saveBlogPost);
  const remove = useServerFn(deleteBlogPost);
  const queryClient = useQueryClient();
  const router = useRouter();
  async function refresh() { try { const rows = await load(); setPosts(rows); setAllowed(true); } catch (e) { setStatus(e instanceof Error ? e.message : 'Could not open the publishing desk.'); setAllowed(false); } }
  useEffect(() => { let mounted = true; void supabase.auth.getUser().then(({ data }) => { if (!mounted) return; const destination = sessionStorage.getItem('storyguide-oauth-return'); if (data.user && destination === '/admin') { sessionStorage.removeItem('storyguide-oauth-return'); window.location.replace('/admin'); return; } setSignedIn(Boolean(data.user)); if (data.user) void refresh(); }); return () => { mounted = false; }; }, []);
  async function login() { setBusy(true); setStatus(''); try { const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/blog-editor` }); if (result.error) throw result.error; if (!result.redirected) { setSignedIn(true); await refresh(); } } catch { setStatus('Sign-in did not finish. Please try again.'); } finally { setBusy(false); } }
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setStatus(''); try { const result = await save({ data: draft }); setDraft({ ...draft, id: result.id }); await refresh(); await queryClient.invalidateQueries({ queryKey: ['published-blog'] }); setStatus(draft.published ? 'Article published.' : 'Draft saved.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save.'); } finally { setBusy(false); } }
  async function deletePost() { if (!draft.id || !window.confirm('Delete this article permanently?')) return; setBusy(true); try { await remove({ data: { id: draft.id } }); setDraft(emptyPost); await refresh(); await queryClient.invalidateQueries({ queryKey: ['published-blog'] }); setStatus('Article deleted.'); } catch { setStatus('Could not delete the article.'); } finally { setBusy(false); } }
  async function logout() { await supabase.auth.signOut(); queryClient.clear(); setPosts([]); setAllowed(false); setSignedIn(false); setDraft(emptyPost); setStatus(''); await router.invalidate(); }
  return <div className="editorial-container content-page"><div className="page-intro"><p className="eyebrow">StoryGuide publishing</p><h1>Editor’s desk</h1></div>{!signedIn ? <div className="editor-login"><h2>A place for your words.</h2><p>Sign in with the StoryGuide Google account to write and publish.</p><Button variant="editorial" onClick={login} disabled={busy}><PenLine />Continue with Google</Button></div> : <><div className="editor-toolbar"><Button variant="outline" onClick={() => { setDraft(emptyPost); setStatus(''); }} disabled={!allowed}><Plus />New article</Button><Button variant="ghost" onClick={logout}><LogOut />Sign out</Button></div>{allowed && <div className="editor-layout"><aside className="editor-posts"><h2>Your articles</h2>{posts.length ? posts.map(p => <Button key={p.id} variant="ghost" className="editor-post" aria-pressed={draft.id === p.id} onClick={() => { setDraft({ id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body, published: p.published }); setStatus(''); }}><span>{p.title}</span><span className="small-label">{p.published ? 'Published' : 'Draft'}</span></Button>) : <p>No articles yet.</p>}</aside><form className="contact-form" onSubmit={submit}><div className="form-field"><label htmlFor="post-title">Title</label><input id="post-title" value={draft.title} maxLength={180} required onChange={e => setDraft({ ...draft, title: e.target.value, ...(!draft.id ? { slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) })} /></div><div className="form-field"><label htmlFor="post-slug">Article address</label><input id="post-slug" value={draft.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={180} onChange={e => setDraft({ ...draft, slug: e.target.value })} /></div><div className="form-field"><label htmlFor="post-excerpt">Short introduction</label><textarea id="post-excerpt" value={draft.excerpt} maxLength={500} onChange={e => setDraft({ ...draft, excerpt: e.target.value })} /></div><div className="form-field"><label htmlFor="post-body">Article</label><textarea id="post-body" className="editor-body" value={draft.body} required maxLength={60000} onChange={e => setDraft({ ...draft, body: e.target.value })} /></div><label className="publish-toggle"><input type="checkbox" checked={draft.published} onChange={e => setDraft({ ...draft, published: e.target.checked })} />Publish on the journal</label><div className="editor-toolbar"><Button variant="editorial" disabled={busy}><Save />{busy ? 'Saving…' : draft.published ? 'Publish article' : 'Save draft'}</Button>{draft.id && <Button type="button" variant="ghost" onClick={deletePost} disabled={busy}><Trash2 />Delete</Button>}</div></form></div>}</>}{status && <p className="form-status" role="status">{status}</p>}</div>;
}
