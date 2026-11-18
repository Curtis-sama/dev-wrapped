// Each archetype: a score (>= 1 means "qualifies"), and a color palette used by the
// terminal and the browser story. The highest score wins.
export const ARCHETYPES = [
  {
    id: 'night-owl',
    icon: 'moon',
    emoji: '🦉',
    name: 'The Night Owl',
    tagline: 'The bugs come out at night. So do you.',
    description: 'Most of your code was written while the rest of the world was asleep.',
    palette: ['#1e1b4b', '#6d28d9', '#c084fc', '#f0abfc'],
    score: (s) => s.nightShare / 0.3,
  },
  {
    id: 'early-bird',
    icon: 'sunrise',
    emoji: '🌅',
    name: 'The Early Bird',
    tagline: 'Shipping before the coffee is even ready.',
    description: 'You do your best work at dawn, before the first Slack message lands.',
    palette: ['#7c2d12', '#ea580c', '#fbbf24', '#fef3c7'],
    score: (s) => s.earlyShare / 0.22,
  },
  {
    id: 'weekend-warrior',
    icon: 'weekend',
    emoji: '⚔️',
    name: 'The Weekend Warrior',
    tagline: 'Saturday? Never heard of her.',
    description: 'A huge chunk of your commits landed on Saturdays and Sundays.',
    palette: ['#450a0a', '#dc2626', '#fb7185', '#fecdd3'],
    score: (s) => s.weekendShare / 0.33,
  },
  {
    id: 'firefighter',
    icon: 'flame',
    emoji: '🚒',
    name: 'The Firefighter',
    tagline: 'Something is always on fire. You bring the hose.',
    description: 'Fixes, patches and hotfixes: you are the one everyone calls.',
    palette: ['#431407', '#f97316', '#facc15', '#fff7ed'],
    score: (s) => s.fixShare / 0.3,
  },
  {
    id: 'marathoner',
    icon: 'trend',
    emoji: '🏃',
    name: 'The Marathoner',
    tagline: 'Consistency is your superpower.',
    description: 'You kept a commit streak going for weeks. Relentless.',
    palette: ['#052e16', '#16a34a', '#4ade80', '#dcfce7'],
    score: (s) => s.longestStreak.length / 21,
  },
  {
    id: 'cleaner',
    icon: 'trash',
    emoji: '🧹',
    name: 'The Cleaner',
    tagline: 'The best code is no code.',
    description: 'You deleted more than you wrote. Every codebase needs someone like you.',
    palette: ['#083344', '#0891b2', '#67e8f9', '#ecfeff'],
    score: (s) => (s.removed > s.added && s.commits > 10 ? 1.2 + (s.removed - s.added) / (s.added + 1) : 0),
  },
  {
    id: 'architect',
    icon: 'cube',
    emoji: '🏗️',
    name: 'The Architect',
    tagline: 'Go big or go home.',
    description: 'Your commits are massive. Whole features, landed in one go.',
    palette: ['#172554', '#2563eb', '#60a5fa', '#dbeafe'],
    score: (s) => s.avgLines / 400,
  },
  {
    id: 'sniper',
    icon: 'scope',
    emoji: '🎯',
    name: 'The Sniper',
    tagline: 'Small commits. Surgical precision.',
    description: 'Tiny, focused commits — the kind reviewers dream about.',
    palette: ['#1a2e05', '#65a30d', '#bef264', '#f7fee7'],
    score: (s) => (s.commits >= 40 && s.avgLines > 0 ? 20 / s.avgLines : 0),
  },
  {
    id: 'tornado',
    icon: 'tornado',
    emoji: '🌪️',
    name: 'The Tornado',
    tagline: 'When you go, you GO.',
    description: 'Some days you commit like a machine gun. Your busiest day was legendary.',
    palette: ['#3b0764', '#a21caf', '#f472b6', '#fce7f3'],
    score: (s) => (s.busiest ? s.busiest.count / 25 : 0),
  },
  {
    id: 'nine-to-five',
    icon: 'briefcase',
    emoji: '💼',
    name: 'The Professional',
    tagline: 'Work-life balance: achieved.',
    description: 'Weekdays, office hours, clean exit. Your therapist is proud of you.',
    palette: ['#0f172a', '#334155', '#94a3b8', '#f1f5f9'],
    score: (s) => s.officeShare / 0.75,
  },
];

export const DEFAULT_ARCHETYPE = {
  id: 'builder',
    icon: 'stack',
  emoji: '🧑‍💻',
  name: 'The Steady Builder',
  tagline: 'Brick by brick, commit by commit.',
  description: 'No drama, no burnout: you just kept building, all year long.',
  palette: ['#022c22', '#0d9488', '#5eead4', '#f0fdfa'],
};

export function pickArchetype(stats) {
  let best = null;
  let bestScore = 1;
  for (const a of ARCHETYPES) {
    const sc = a.score(stats);
    if (sc >= bestScore) {
      best = a;
      bestScore = sc;
    }
  }
  const { score, ...rest } = best || DEFAULT_ARCHETYPE;
  return rest;
}
