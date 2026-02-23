import { Link } from 'react-router-dom';

const NEWS_ITEMS = [
  {
    id: '1',
    title: 'Gundam Forge Beta Launch',
    date: 'February 22, 2026',
    tag: 'Announcement',
    summary: 'Welcome to the Gundam Forge beta! Build and test your Gundam TCG decks with our free online deck builder. We are excited to bring the community a professional-grade tool for deck construction and testing.',
    content: 'Gundam Forge is now live in beta. The platform supports full deck building with validation, a solo goldfish simulator, deck analytics, and community deck sharing. We are actively developing new features based on community feedback.',
  },
  {
    id: '2',
    title: 'Deck Import Feature Now Live',
    date: 'February 22, 2026',
    tag: 'Feature',
    summary: 'You can now import deck lists from text format directly into the Forge. Paste your list and start playing immediately.',
    content: 'The new import feature allows you to paste deck lists in a simple format (e.g., "4x Strike Gundam") and automatically match them against our card database. Unrecognized cards are flagged for review.',
  },
  {
    id: '3',
    title: 'Card Database Expansion Coming',
    date: 'Coming Soon',
    tag: 'Upcoming',
    summary: 'We are working on expanding the card database with the latest set releases, updated pricing data, and higher resolution card images.',
    content: 'Our next major update will include an expanded card database covering all released sets. We are also integrating market pricing data to help you track the value of your decks.',
  },
  {
    id: '4',
    title: 'Community Deck Sharing',
    date: 'Coming Soon',
    tag: 'Upcoming',
    summary: 'Share your decks publicly, browse top community builds, and discover new strategies from other pilots.',
    content: 'Public deck sharing is in development. Soon you will be able to publish your decks, receive views and engagement, and browse the most popular builds in the community.',
  },
  {
    id: '5',
    title: 'Tournament Mode Preview',
    date: 'In Development',
    tag: 'Roadmap',
    summary: 'We are exploring tournament bracket features that will allow organizers to run events directly through Gundam Forge.',
    content: 'Tournament mode is on our roadmap. This will include bracket generation, deck submission, round timers, and results tracking for competitive events.',
  },
];

const TAG_STYLES: Record<string, string> = {
  Announcement: 'bg-gf-blue-light text-gf-blue',
  Feature: 'bg-green-50 text-green-700',
  Upcoming: 'bg-yellow-50 text-yellow-700',
  Roadmap: 'bg-purple-50 text-purple-700',
};

export function NewsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-gf-text">News & Updates</h1>
        <p className="text-sm text-gf-text-secondary mt-1">
          Stay up to date with Gundam Forge development and the Gundam TCG community
        </p>
      </div>

      <div className="space-y-4">
        {NEWS_ITEMS.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-gf-border bg-white p-6 hover:border-gf-blue/20 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TAG_STYLES[item.tag] || 'bg-gray-100 text-gray-600'}`}>
                {item.tag}
              </span>
              <span className="text-[10px] text-gf-text-muted">{item.date}</span>
            </div>
            <h2 className="text-base font-bold text-gf-text mb-2">{item.title}</h2>
            <p className="text-sm text-gf-text-secondary leading-relaxed mb-3">{item.summary}</p>
            <p className="text-xs text-gf-text-secondary leading-relaxed">{item.content}</p>
          </article>
        ))}
      </div>

      {/* Subscribe CTA */}
      <div className="mt-10 rounded-xl border border-dashed border-gf-border bg-gf-light/50 p-8 text-center">
        <h3 className="text-sm font-bold text-gf-text mb-1">Stay in the loop</h3>
        <p className="text-xs text-gf-text-secondary mb-4">
          Follow development updates as we build the ultimate Gundam TCG platform.
        </p>
        <Link to="/forge" className="gf-btn gf-btn-primary text-xs py-2 px-4">
          Start Building
        </Link>
      </div>
    </div>
  );
}
