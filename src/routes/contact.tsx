import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/seo';
import { contactEmail, instagramUrl } from '@/lib/contact';
import { Route as RootRoute } from '@/routes/__root';

export const Route = createFileRoute('/contact')({
  head: () => pageHead('Get in Touch | StoryGuide', 'Have a question, feedback, a partnership idea or a reading suggestion? Get in touch with StoryGuide.', '/contact'),
  component: Contact,
});
function Contact() {
  const { settings } = RootRoute.useLoaderData();
  const email = settings.contact?.['email'] || contactEmail;
  const instagram = settings.contact?.['instagram'] || instagramUrl;
  const [status, setStatus] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = `${form.get('reason')} — ${form.get('name')}`;
    const body = `Name: ${form.get('name')}\nEmail: ${form.get('email')}\n\n${form.get('message')}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus('Send the prepared message in your email app. If it did not open, email StoryGuide directly.');
  }
   return <div className="editorial-container content-page"><div className="page-intro"><p className="eyebrow">A conversation starts here</p><h1>{settings.contact?.['headline'] || 'Get in touch.'}</h1><p>{settings.contact?.['intro'] || 'Have a question, feedback, idea, or something you’d like to share? We’d love to hear from you.'}</p></div><div className="contact-layout"><form className="contact-form" onSubmit={submit}><div className="form-pair"><div className="form-field"><label htmlFor="name">Name</label><input id="name" name="name" autoComplete="name" required maxLength={120} /></div><div className="form-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div></div><div className="form-field"><label htmlFor="reason">Reason for contacting</label><select id="reason" name="reason" defaultValue="" required><option value="" disabled>Select a reason</option>{['General question', 'Book-related question', 'Partnership', 'Content suggestion', 'Technical issue', 'Other'].map(r => <option key={r}>{r}</option>)}</select></div><div className="form-field"><label htmlFor="message">Message</label><textarea id="message" name="message" required maxLength={5000} /></div><Button variant="editorial" type="submit">Prepare email</Button>{status && <p className="form-status" role="status">{status}</p>}</form><aside className="contact-aside"><h2>Say hello</h2><a href={`mailto:${email}`} className="text-link">{email}</a><a href={instagram} target="_blank" rel="noopener noreferrer" className="text-link">Instagram · @storyguidebooks ↗</a><Link to="/blog" className="text-link">From the journal →</Link><Link to="/ebooks" search={{}} className="text-link">Explore the reading collection →</Link></aside></div></div>;
}
