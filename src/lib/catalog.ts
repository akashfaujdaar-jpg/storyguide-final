const timeline = '/covers/timeline-640.webp';
const timelineSmall = '/covers/timeline-320.webp';
const quiet = '/covers/quiet-hours-640.webp';
const quietSmall = '/covers/quiet-hours-320.webp';
const money = '/covers/own-money-640.webp';
const moneySmall = '/covers/own-money-320.webp';
const touch = '/covers/stay-in-touch-640.webp';
const touchSmall = '/covers/stay-in-touch-320.webp';
const talks = '/covers/small-talks-640.webp';
const talksSmall = '/covers/small-talks-320.webp';
const beginning = '/covers/beginning-again-640.webp';
const beginningSmall = '/covers/beginning-again-320.webp';

export interface Category { slug: string; name: string; description: string; }
export const categories: Category[] = [
  { slug: 'stories-fiction', name: 'Stories & Fiction', description: 'Stories that take you somewhere — or help you see where you are a little differently.' },
  { slug: 'mind-psychology', name: 'Mind & Psychology', description: 'Explore how we think, feel and understand ourselves and others.' },
  { slug: 'personal-growth', name: 'Personal Growth', description: 'Books for becoming more aware, confident and intentional about your life.' },
  { slug: 'relationships-life', name: 'Relationships & Life', description: 'Connection, communication and the complicated parts of being human.' },
  { slug: 'work-money', name: 'Work & Money', description: 'Practical reads about money, careers and building a better working life.' },
];

export interface Book {
  slug: string; title: string; category: string; subtitle: string; image: string; small: string;
  description: string; audience: string; themes: string[]; experience: string;
  id?: string; pdfPath?: string | null; pdfUrl?: string | null; published?: boolean; sortOrder?: number;
}
export const books: Book[] = [
  { slug: 'everyones-timeline', title: 'Why Everyone Else’s Timeline Looks Better', category: 'personal-growth', subtitle: 'A field guide to borrowed clocks', image: timeline, small: timelineSmall, description: 'It is easy to measure your life against someone else’s milestones. This reflective read asks what changes when you stop borrowing their clock and begin paying attention to your own.', audience: 'Readers navigating comparison, changing plans or the feeling of being behind.', themes: ['Comparison', 'Self-awareness', 'Finding your own pace'], experience: 'A gentler perspective on progress, and space to think about what a meaningful life looks like to you.' },
  { slug: 'quiet-hours', title: 'The Quiet Hours', category: 'mind-psychology', subtitle: 'Notes on attention and stillness', image: quiet, small: quietSmall, description: 'Between the noise of daily life, there are moments we barely notice. These reflections explore attention, everyday thought and the value of making a little room for quiet.', audience: 'Curious readers interested in attention, reflection and everyday habits of thought.', themes: ['Attention', 'Reflection', 'Everyday thought'], experience: 'Ideas for noticing the ordinary moments you might otherwise pass by.' },
  { slug: 'own-money', title: 'A Room of One’s Own Money', category: 'work-money', subtitle: 'Work, worth and a little freedom', image: money, small: moneySmall, description: 'Money is never only about numbers. This practical reading concept explores the relationship between earning, personal values and the freedom to make choices that fit your life.', audience: 'Readers beginning to think more intentionally about their working life and money.', themes: ['Personal values', 'Money habits', 'Working life'], experience: 'Questions to help clarify what enough means to you, without promises of financial results.' },
  { slug: 'stay-in-touch', title: 'How to Stay in Touch', category: 'relationships-life', subtitle: 'On connection and being human', image: touch, small: touchSmall, description: 'Closeness is often built in small gestures: a question, a message, a moment of listening. This reading concept looks at the everyday work of keeping connections alive.', audience: 'Anyone thinking about friendship, communication or showing up for the people they care about.', themes: ['Friendship', 'Communication', 'Connection'], experience: 'A thoughtful look at the small acts that make relationships feel more human.' },
  { slug: 'small-talks', title: 'The Cartography of Small Talks', category: 'stories-fiction', subtitle: 'Stories of everyday encounters', image: talks, small: talksSmall, description: 'A chance conversation can change the shape of an ordinary day. This fiction concept follows the quiet intersections between strangers, neighbours and people with more in common than they know.', audience: 'Readers drawn to intimate fiction and stories about ordinary lives.', themes: ['Everyday encounters', 'Belonging', 'Human connection'], experience: 'A moment of escape, and a new way to notice the people around you.' },
  { slug: 'beginning-again', title: 'Notes on Beginning Again', category: 'personal-growth', subtitle: 'Small steps. New chapters.', image: beginning, small: beginningSmall, description: 'Starting over rarely arrives with a clear map. This reflective concept makes room for uncertainty, small steps and the possibility of a chapter that looks different from the last.', audience: 'Readers at a crossroads, beginning something new or rethinking an old plan.', themes: ['Life transitions', 'Uncertainty', 'Small steps'], experience: 'A companion for thinking through change without rushing toward all the answers.' },
];
export function categoryName(slug: string) { return categories.find(c => c.slug === slug)?.name ?? slug; }
