import { Link } from '@tanstack/react-router';
import { type Book, categoryName } from '@/lib/catalog';

export function Cover({ book, priority = false }: { book: Book; priority?: boolean }) {
  return <img className="book-cover" src={book.image} srcSet={`${book.small} 320w, ${book.image} 640w`} sizes="(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 340px" alt={`${book.title} — illustrated book cover`} width={640} height={960} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />;
}
export function BookCard({ book }: { book: Book }) {
  return <article className="book-card"><Link to="/ebooks/$slug" params={{ slug: book.slug }} className="book-link"><Cover book={book} /><h3>{book.title}</h3></Link><Link className="book-category" to="/ebooks" search={{ category: book.category }}>{categoryName(book.category)}</Link></article>;
}