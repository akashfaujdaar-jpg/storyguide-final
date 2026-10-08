import { createFileRoute, Link } from '@tanstack/react-router';
import { BookCard } from '@/components/book-card';
import { Button } from '@/components/ui/button';
import { Route as RootRoute } from '@/routes/__root';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/ebooks/')({
  validateSearch: (search: Record<string, unknown>): { category?: string | undefined } => ({ category: typeof search['category'] === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(search['category']) ? search['category'] : undefined }),
  head: () => pageHead('Ebooks Online | Stories, Ideas & Practical Reads | StoryGuide', 'Explore English ebooks across fiction, psychology, personal growth, relationships, work and money. Find your next read on StoryGuide.', '/ebooks'),
  component: Ebooks,
});

function Ebooks() {
  const { books, categories } = RootRoute.useLoaderData();
  const { category } = Route.useSearch();
  const selected = categories.find(c => c.slug === category);
  const filtered = selected ? books.filter(b => b.category === selected.slug) : books;
  return <div className="editorial-container content-page"><div className="page-intro"><p className="eyebrow">The reading collection</p><h1>Explore Ebooks</h1><p>Discover stories, ideas and practical reads across different parts of life.</p></div><nav className="filter-row" aria-label="Filter ebooks by category"><Button variant="filter" asChild><Link to="/ebooks" search={{}} data-active={!category} aria-current={!category ? 'page' : undefined}>All reads</Link></Button>{categories.map(c => <Button key={c.slug} variant="filter" asChild><Link to="/ebooks" search={{ category: c.slug }} data-active={category === c.slug} aria-current={category === c.slug ? 'page' : undefined}>{c.name}</Link></Button>)}</nav><div className="collection-description"><p>{selected?.description ?? 'Some reads invite you into another world. Others help you see your own a little differently. Find a shelf that speaks to you.'}</p><span className="small-label">{filtered.length} {filtered.length === 1 ? 'title' : 'titles'}</span></div><div className="book-grid">{filtered.map(book => <BookCard key={book.slug} book={book} />)}</div></div>;
}
