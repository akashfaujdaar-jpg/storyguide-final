-- Public reading catalogue. All publishing mutations are performed by the
-- server-only service-role client after the signed StoryGuide admin session is
-- validated; public browser clients have read-only access through RLS.

create table if not exists public.storyguide_categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 100),
  description text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.storyguide_books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 180),
  category text not null references public.storyguide_categories(slug) on update cascade on delete restrict,
  subtitle text not null default '',
  description text not null default '',
  audience text not null default '',
  themes text[] not null default '{}',
  experience text not null default '',
  cover_url text not null default '',
  small_cover_url text not null default '',
  pdf_path text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists storyguide_books_public_order
  on public.storyguide_books (sort_order, created_at desc) where published;
create table if not exists public.storyguide_site_content (
  key text primary key check (key in ('home', 'about', 'contact', 'branding')),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

grant select on public.storyguide_categories, public.storyguide_books, public.storyguide_site_content to anon, authenticated;
alter table public.storyguide_categories enable row level security;
alter table public.storyguide_books enable row level security;
alter table public.storyguide_site_content enable row level security;

create policy "Public can read visible categories" on public.storyguide_categories
  for select to anon, authenticated using (visible);

create policy "Public can read published books" on public.storyguide_books
  for select to anon, authenticated using (published);

create policy "Public can read site content" on public.storyguide_site_content
  for select to anon, authenticated using (true);

-- PDFs are public once attached to a published title; only the verified editor can upload or remove them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('storyguide-pdfs', 'storyguide-pdfs', true, 52428800, array['application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = array['application/pdf'];

-- Publicly served, size-limited cover images. Only server-authorized admin sessions
-- can request the short-lived signed upload URLs used by the publishing desk.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('storyguide-covers', 'storyguide-covers', true, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

create policy "Public can view StoryGuide PDFs" on storage.objects
  for select to public using (bucket_id = 'storyguide-pdfs');
-- Uploads are minted server-side as signed URLs only after validating the
-- password-backed HttpOnly admin session. No public write policy is granted.

insert into public.storyguide_categories (slug, name, description, sort_order) values
  ('stories-fiction', 'Stories & Fiction', 'Stories that take you somewhere — or help you see where you are a little differently.', 1),
  ('mind-psychology', 'Mind & Psychology', 'Explore how we think, feel and understand ourselves and others.', 2),
  ('personal-growth', 'Personal Growth', 'Books for becoming more aware, confident and intentional about your life.', 3),
  ('relationships-life', 'Relationships & Life', 'Connection, communication and the complicated parts of being human.', 4),
  ('work-money', 'Work & Money', 'Practical reads about money, careers and building a better working life.', 5)
on conflict (slug) do nothing;

insert into public.storyguide_books
  (slug, title, category, subtitle, description, audience, themes, experience, cover_url, small_cover_url, published, sort_order)
values
  ('everyones-timeline', 'Why Everyone Else’s Timeline Looks Better', 'personal-growth', 'A field guide to borrowed clocks', 'It is easy to measure your life against someone else’s milestones. This reflective read asks what changes when you stop borrowing their clock and begin paying attention to your own.', 'Readers navigating comparison, changing plans or the feeling of being behind.', array['Comparison','Self-awareness','Finding your own pace'], 'A gentler perspective on progress, and space to think about what a meaningful life looks like to you.', '/covers/timeline-640.webp', '/covers/timeline-320.webp', true, 1),
  ('quiet-hours', 'The Quiet Hours', 'mind-psychology', 'Notes on attention and stillness', 'Between the noise of daily life, there are moments we barely notice. These reflections explore attention, everyday thought and the value of making a little room for quiet.', 'Curious readers interested in attention, reflection and everyday habits of thought.', array['Attention','Reflection','Everyday thought'], 'Ideas for noticing the ordinary moments you might otherwise pass by.', '/covers/quiet-hours-640.webp', '/covers/quiet-hours-320.webp', true, 2),
  ('own-money', 'A Room of One’s Own Money', 'work-money', 'Work, worth and a little freedom', 'Money is never only about numbers. This practical reading concept explores the relationship between earning, personal values and the freedom to make choices that fit your life.', 'Readers beginning to think more intentionally about their working life and money.', array['Personal values','Money habits','Working life'], 'Questions to help clarify what enough means to you, without promises of financial results.', '/covers/own-money-640.webp', '/covers/own-money-320.webp', true, 3),
  ('stay-in-touch', 'How to Stay in Touch', 'relationships-life', 'On connection and being human', 'Closeness is often built in small gestures: a question, a message, a moment of listening. This reading concept looks at the everyday work of keeping connections alive.', 'Anyone thinking about friendship, communication or showing up for the people they care about.', array['Friendship','Communication','Connection'], 'A thoughtful look at the small acts that make relationships feel more human.', '/covers/stay-in-touch-640.webp', '/covers/stay-in-touch-320.webp', true, 4),
  ('small-talks', 'The Cartography of Small Talks', 'stories-fiction', 'Stories of everyday encounters', 'A chance conversation can change the shape of an ordinary day. This fiction concept follows the quiet intersections between strangers, neighbours and people with more in common than they know.', 'Readers drawn to intimate fiction and stories about ordinary lives.', array['Everyday encounters','Belonging','Human connection'], 'A moment of escape, and a new way to notice the people around you.', '/covers/small-talks-640.webp', '/covers/small-talks-320.webp', true, 5),
  ('beginning-again', 'Notes on Beginning Again', 'personal-growth', 'Small steps. New chapters.', 'Starting over rarely arrives with a clear map. This reflective concept makes room for uncertainty, small steps and the possibility of a chapter that looks different from the last.', 'Readers at a crossroads, beginning something new or rethinking an old plan.', array['Life transitions','Uncertainty','Small steps'], 'A companion for thinking through change without rushing toward all the answers.', '/covers/beginning-again-640.webp', '/covers/beginning-again-320.webp', true, 6)
on conflict (slug) do nothing;

