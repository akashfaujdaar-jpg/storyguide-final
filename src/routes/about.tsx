import { createFileRoute, Link } from '@tanstack/react-router';
import { pageHead } from '@/lib/seo';
import { Route as RootRoute } from '@/routes/__root';

export const Route = createFileRoute('/about')({
  head: () => pageHead('Our Story | StoryGuide', 'StoryGuide is a space for stories, ideas and books that explore the many ways we experience life. A reading destination for every kind of reader.', '/about'),
  component: About,
});
function About() {
  const { settings } = RootRoute.useLoaderData();
  const content = settings.about;
  const copy = (value: string | undefined, fallback: string) => (value || fallback).split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>);
  return <div className="editorial-container content-page"><div className="page-intro"><p className="eyebrow">{content?.['eyebrow'] || 'The idea behind StoryGuide'}</p><h1>{content?.['headline'] || 'Stories for every kind of reader.'}</h1><p>{content?.['intro'] || 'A space for stories, ideas and books that explore the many different ways we experience life.'}</p></div><section className="prose-grid"><h2>{content?.['idea_heading'] || 'Our idea'}</h2><div>{copy(content?.['idea_copy'], 'Some stories make us feel understood. Some challenge the way we think. Some simply give us a few quiet minutes away from everything else.\n\nWe believe there is no single kind of reader — and no single kind of story worth telling.')}</div></section><section className="prose-grid"><h2>{content?.['collection_heading'] || 'What you’ll find here'}</h2><div>{copy(content?.['collection_copy'], 'From stories and fiction to ideas about how we live, StoryGuide brings different kinds of reading together.')}</div></section><section className="prose-grid"><h2>{content?.['closing_heading'] || 'For the many chapters of life'}</h2><div>{copy(content?.['closing_copy'], 'You might be looking for an escape. A fresh idea. A different way of understanding yourself or someone else. StoryGuide is for anyone who believes a good read is time well spent.')}<p><Link to="/ebooks" search={{}}>Find your next read →</Link></p></div></section></div>;
}
