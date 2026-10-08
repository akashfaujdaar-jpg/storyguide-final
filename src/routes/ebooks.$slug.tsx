import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { categoryName } from '@/lib/catalog';
import { BookCard } from '@/components/book-card';
import { BookGallery } from '@/components/book-gallery';
import { BookOpen, Globe, ShoppingBag, ShoppingCart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/seo';
import { Route as RootRoute } from '@/routes/__root';
import { catalogQuery } from '@/lib/catalog.functions';

export const Route = createFileRoute('/ebooks/$slug')({
  loader: async ({ params, context }) => { const data = await context.queryClient.ensureQueryData(catalogQuery); const book = data.books.find(b => b.slug === params.slug); if (!book) throw notFound(); return { book }; },
  head: ({ loaderData }) => {
    if (!loaderData) return pageHead('Book Not Found | StoryGuide', 'Explore the StoryGuide reading collection.', '/ebooks');
    const b = loaderData.book;
    return { ...pageHead(`${b.title} | StoryGuide`, b.description, `/ebooks/${b.slug}`, true), scripts: [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: '/' }, { '@type': 'ListItem', position: 2, name: 'Ebooks', item: '/ebooks' }, { '@type': 'ListItem', position: 3, name: categoryName(b.category), item: `/ebooks?category=${b.category}` }, { '@type': 'ListItem', position: 4, name: b.title, item: `/ebooks/${b.slug}` }] }) }] };
  },
  component: BookPage,
});

function BookPage() {
  const { book } = Route.useLoaderData();
  const { books, categories } = RootRoute.useLoaderData();
  const bookCategory = categories.find(category => category.slug === book.category)?.name ?? categoryName(book.category);
  const related = books.filter(b => b.category === book.category && b.slug !== book.slug);
  const suggestions = related.length ? related : books.filter(b => b.slug !== book.slug).slice(0, 3);
   return <div className="editorial-container content-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>›</span><Link to="/ebooks" search={{}}>Ebooks</Link><span>›</span><Link to="/ebooks" search={{ category: book.category }}>{bookCategory}</Link><span>›</span><span aria-current="page">{book.title}</span></nav><div className="book-detail"><BookGallery book={book} /><div className="detail-copy"><Link to="/ebooks" search={{ category: book.category }} className="book-category">{bookCategory}</Link><h1>{book.title}</h1><p className="book-subtitle">{book.subtitle}</p><p>{book.description}</p><dl className="book-specs"><div><dt><BookOpen aria-hidden="true" />Edition</dt><dd>{book.pdfPath ? 'Digital PDF' : 'Reading edition'}</dd></div><div><dt><Globe aria-hidden="true" />Language</dt><dd>English</dd></div><div><dt>Availability</dt><dd>{book.pdfPath ? 'Available now' : 'Coming soon'}</dd></div></dl><div className="purchase-actions">{book.pdfUrl ? <Button variant="editorial" asChild><a href={book.pdfUrl} target="_blank" rel="noreferrer" download><Download />Download PDF</a></Button> : <Button variant="editorial" disabled><ShoppingBag />Coming soon</Button>}<Button variant="outline" disabled><ShoppingCart />Add to Cart</Button></div><p className="availability-note">{book.pdfPath ? 'The PDF publication is available to read and download.' : 'Publication details and ebook file are still to come.'}</p><div className="book-accordions"><details open><summary>About this book</summary><p>{book.experience}</p></details><details><summary>Who this read is for</summary><p>{book.audience}</p></details><details><summary>Between these pages</summary><ul className="theme-list">{book.themes.map(t => <li key={t}>{t}</li>)}</ul></details></div></div></div><section className="related-section"><div className="section-heading"><h2>{related.length ? 'On the same shelf' : 'A little more to explore'}</h2></div><div className="book-grid">{suggestions.map(b => <BookCard key={b.slug} book={b} />)}</div></section></div>;
}
