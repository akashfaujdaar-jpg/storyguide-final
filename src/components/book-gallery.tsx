import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cover } from '@/components/book-card';
import { type Book } from '@/lib/catalog';
import { FileText } from 'lucide-react';

export function BookGallery({ book }: { book: Book }) {
  const [view, setView] = useState<'cover' | 'notes'>('cover');
  return <div className="book-gallery"><div className="gallery-thumbnails" aria-label="Book views"><Button variant="ghost" className="gallery-thumb" aria-label="View cover" aria-pressed={view === 'cover'} onClick={() => setView('cover')}><Cover book={book} /></Button><Button variant="ghost" className="gallery-thumb notes-thumb" aria-label="View reading notes" aria-pressed={view === 'notes'} onClick={() => setView('notes')}><FileText strokeWidth={1} /><span>Notes</span></Button></div><div className="gallery-main">{view === 'cover' ? <Cover book={book} priority /> : <div className="reading-notes"><span className="small-label">A note from StoryGuide</span><h2>{book.title}</h2><p>{book.experience}</p><hr /><ul>{book.themes.map(t => <li key={t}>{t}</li>)}</ul><p className="small-label">A short introduction to this title</p></div>}</div></div>;
}
