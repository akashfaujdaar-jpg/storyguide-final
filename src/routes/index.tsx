import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { BookCard, Cover } from '@/components/book-card';
import { books, categories } from '@/lib/catalog';
import { pageHead } from '@/lib/seo';
import { CategoryIcon } from '@/components/category-icon';
import { Route as RootRoute } from '@/routes/__root';

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    ...pageHead('StoryGuide | Stories, Ideas & Books Worth Reading', 'Discover books to read online, from fiction and psychology to personal growth, relationships, work and money. Stories worth spending time with.', '/'),
    scripts: [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'StoryGuide', description: 'Stories worth spending time with.', url: '/' }) }],
  }),
});

function Home() {
  const { books, categories, settings } = RootRoute.useLoaderData();
  const featured = books[0];
  return <>
    <section className="editorial-container home-opening">
      <div className="opening-copy"><p className="eyebrow">{settings.home?.['eyebrow'] || '— A note from the editor'}</p><h1>{settings.home?.['headline'] || 'Stories worth spending time with.'}</h1><p>{settings.home?.['intro'] || 'Fiction, ideas, perspectives and practical reads for the many chapters of life.'}</p><div className="opening-actions"><Button variant="editorial" asChild><Link to="/ebooks" search={{}}>Explore Ebooks</Link></Button><span className="small-label">A little perspective · No rush</span></div></div>
      {featured && <div className="opening-feature"><Link to="/ebooks/$slug" params={{ slug: featured.slug }} className="feature-cover-link"><Cover book={featured} priority /></Link><div className="feature-caption"><Link to="/ebooks/$slug" params={{ slug: featured.slug }}><h2>{featured.title}</h2></Link><p className="small-label">{featured.subtitle}</p></div></div>}
    </section>
    <section className="category-band" id="categories"><div className="editorial-container category-inner"><div className="category-heading"><h2>Categories</h2><span className="small-label">Five shelves</span></div><div className="category-links">{categories.map(c => <Link key={c.slug} to="/ebooks" search={{ category: c.slug }}><CategoryIcon category={c.slug} />{c.name}<span aria-hidden="true">→</span></Link>)}</div></div></section>
    <section className="editorial-container selected-section" id="explore"><div className="section-heading"><h2>Selected this season</h2><span className="small-label">{settings.home?.['featured_note'] || `${books.length} titles`}</span></div><div className="book-grid">{books.map(book => <BookCard key={book.slug} book={book} />)}</div></section>
    <section className="publication-note"><div className="editorial-container note-inner"><h2>{settings.home?.['closing_heading'] || 'A note on the desk'}</h2><div><p>{settings.home?.['closing_copy'] || 'Some books give you an escape. Others give you a different way of looking at your own life. StoryGuide brings both together — stories and ideas for every kind of reader, and every chapter of life.'}</p><Link to="/about" className="text-link">Our story →</Link></div></div></section>
  </>;
}
