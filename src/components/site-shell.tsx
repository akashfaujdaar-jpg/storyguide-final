import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Menu, X, Instagram, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contactEmail, instagramUrl } from '@/lib/contact';
import type { SiteSettings } from '@/lib/catalog.functions';

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const siteName = settings.branding?.['site_name'] || 'StoryGuide';
  const edition = settings.branding?.['edition'] || 'The Publisher’s Desk — Stories, ideas & a little perspective';
  const nav = <><Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'active' }}>Home</Link><Link to="/ebooks" search={{}} activeProps={{ className: 'active' }}>Ebooks</Link><Link to="/blog" activeProps={{ className: 'active' }}>Blog</Link><Link to="/about" activeProps={{ className: 'active' }}>About</Link><Link to="/contact" activeProps={{ className: 'active' }}>Contact</Link></>;
  return <header className="site-header editorial-container"><div className="masthead"><Link to="/" className="brand"><img src="/storyguide-logo.svg" className="brand-mark" width={36} height={36} alt={settings.branding?.['logo_alt'] || ''} />{siteName}<span>Reading Room</span></Link><nav className="desktop-nav" aria-label="Main navigation">{nav}</nav><Button variant="ghost" size="icon" className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></div><p className="edition-label">{edition}</p>{open && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation" onClick={() => setOpen(false)}>{nav}</nav>}</header>;
}
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const siteName = settings.branding?.['site_name'] || 'StoryGuide';
  const email = settings.contact?.['email'] || contactEmail;
  const instagram = settings.contact?.['instagram'] || instagramUrl;
  return <footer className="site-footer"><div className="editorial-container footer-inner"><Link to="/" className="brand">{siteName}</Link><nav aria-label="Footer navigation"><Link to="/ebooks" search={{}}>Ebooks</Link><Link to="/blog">Blog</Link><Link to="/contact">Contact</Link></nav><div className="social-links"><Button variant="ghost" size="icon" asChild><a href={`mailto:${email}`} aria-label={`Email ${siteName}`} title={`Email ${siteName}`}><Mail strokeWidth={1.5} /></a></Button><Button variant="ghost" size="icon" asChild><a href={instagram} target="_blank" rel="noopener noreferrer" aria-label={`${siteName} on Instagram`} title={`${siteName} on Instagram`}><Instagram strokeWidth={1.5} /></a></Button></div><p>© {siteName} · {settings.branding?.['footer_note'] || 'A quiet reading room'}</p></div></footer>;
}
