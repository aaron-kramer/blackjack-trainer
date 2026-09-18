// Duolingo-style lesson path definitions. Each lesson filters the master
// scenario list down to a teachable slice and declares which action
// buttons are available while it's active.

function inRange(n, lo, hi) { return n >= lo && n <= hi; }

const UNITS = [
  {
    id: 'u1',
    title: 'Hit or Stand',
    icon: '\u{1F0CF}',
    lessons: [
      {
        id: 'u1l1', title: 'Always Hit', count: 8, allowedActions: ['H', 'S'],
        filter: (s) => s.kind === 'hard' && inRange(s.key, 5, 8),
        blurb: 'Weak hands (5-8) are never good enough to stand on.',
      },
      {
        id: 'u1l2', title: 'Stand on High', count: 8, allowedActions: ['H', 'S'],
        filter: (s) => s.kind === 'hard' && inRange(s.key, 17, 20),
        blurb: 'Hard 17 and up: stop pushing your luck.',
      },
      {
        id: 'u1l3', title: 'Low Dealer, Stand', count: 10, allowedActions: ['H', 'S'],
        filter: (s) => s.kind === 'hard' && inRange(s.key, 12, 16) && s.upcard <= 6,
        blurb: 'Dealer showing 2-6? They bust a lot. Let them.',
      },
      {
        id: 'u1l4', title: 'High Dealer, Keep Hitting', count: 10, allowedActions: ['H', 'S'],
        filter: (s) => s.kind === 'hard' && inRange(s.key, 12, 16) && s.upcard >= 7,
        blurb: 'Dealer showing 7-A? You need to catch up.',
      },
      {
        id: 'u1l5', title: 'Review: Hard Totals', count: 12, allowedActions: ['H', 'S'],
        filter: (s) => s.kind === 'hard' && inRange(s.key, 5, 20),
        blurb: 'Mix it all together.',
      },
    ],
  },
  {
    id: 'u2',
    title: 'Doubling Down',
    icon: '\u{1F4B0}',
    lessons: [
      {
        id: 'u2l1', title: 'Double on 11', count: 8, allowedActions: ['H', 'D'],
        filter: (s) => s.kind === 'hard' && s.key === 11,
        blurb: 'Eleven is the best hand to double — almost always.',
      },
      {
        id: 'u2l2', title: 'Double on 10', count: 8, allowedActions: ['H', 'D'],
        filter: (s) => s.kind === 'hard' && s.key === 10,
        blurb: 'Ten doubles against almost everything, too.',
      },
      {
        id: 'u2l3', title: 'Double on 9', count: 8, allowedActions: ['H', 'D'],
        filter: (s) => s.kind === 'hard' && s.key === 9,
        blurb: 'Nine only doubles when the dealer looks weak.',
      },
      {
        id: 'u2l4', title: 'Review: Doubling', count: 10, allowedActions: ['H', 'D'],
        filter: (s) => s.kind === 'hard' && inRange(s.key, 9, 11),
        blurb: 'Nine, ten, or eleven — what\'s the move?',
      },
    ],
  },
  {
    id: 'u3',
    title: 'Soft Hands',
    icon: '♠️',
    lessons: [
      {
        id: 'u3l1', title: 'Soft 13-16', count: 10, allowedActions: ['H', 'D'],
        filter: (s) => s.kind === 'soft' && inRange(s.key, 13, 16),
        blurb: 'An Ace makes your hand flexible — you can\'t bust hitting these.',
      },
      {
        id: 'u3l2', title: 'Soft 17-18', count: 10, allowedActions: ['H', 'S', 'D'],
        filter: (s) => s.kind === 'soft' && inRange(s.key, 17, 18),
        blurb: 'Soft 18 is the trickiest hand in the game.',
      },
      {
        id: 'u3l3', title: 'Soft 19-20', count: 8, allowedActions: ['H', 'S', 'D'],
        filter: (s) => s.kind === 'soft' && inRange(s.key, 19, 20),
        blurb: 'Big soft hands mostly just stand.',
      },
      {
        id: 'u3l4', title: 'Review: Soft Totals', count: 12, allowedActions: ['H', 'S', 'D'],
        filter: (s) => s.kind === 'soft' && inRange(s.key, 13, 20),
        blurb: 'All the Ace hands, mixed up.',
      },
    ],
  },
  {
    id: 'u4',
    title: 'Splitting Pairs',
    icon: '✂️',
    lessons: [
      {
        id: 'u4l1', title: 'Always Split', count: 8, allowedActions: ['H', 'P'],
        filter: (s) => s.kind === 'pair' && (s.key === 'A' || s.key === 8),
        blurb: 'Aces and 8s: split them every single time.',
      },
      {
        id: 'u4l2', title: 'Never Split These', count: 8, allowedActions: ['H', 'S', 'D', 'P'],
        filter: (s) => s.kind === 'pair' && (s.key === 5 || s.key === 10),
        blurb: 'Some pairs are already great hands — don\'t break them up.',
      },
      {
        id: 'u4l3', title: 'Conditional Splits', count: 12, allowedActions: ['H', 'S', 'P'],
        filter: (s) => s.kind === 'pair' && [2, 3, 4, 6, 7, 9].includes(s.key),
        blurb: 'These pairs depend on what the dealer is showing.',
      },
      {
        id: 'u4l4', title: 'Review: Pairs', count: 12, allowedActions: ['H', 'S', 'D', 'P'],
        filter: (s) => s.kind === 'pair',
        blurb: 'Every pair in the deck.',
      },
    ],
  },
  {
    id: 'u5',
    title: 'Surrender',
    icon: '\u{1F3F3}️',
    lessons: [
      {
        id: 'u5l1', title: 'When to Bail', count: 10, allowedActions: ['H', 'S', 'R'],
        filter: (s) => s.kind === 'hard' && inRange(s.key, 15, 16),
        blurb: 'Sometimes losing half your bet beats playing the hand out.',
      },
      {
        id: 'u5l2', title: 'Review: Surrender', count: 10, allowedActions: ['H', 'S', 'D', 'R'],
        filter: (s) => s.kind === 'hard' && inRange(s.key, 12, 16),
        blurb: 'Know exactly when giving up is correct — and when it isn\'t.',
      },
    ],
  },
  {
    id: 'u6',
    title: 'Full Practice',
    icon: '\u{1F3C6}',
    lessons: [
      {
        id: 'u6l1', title: 'Full Table I', count: 14, allowedActions: ['H', 'S', 'D', 'P', 'R'],
        filter: () => true,
        blurb: 'Everything you\'ve learned, all at once.',
      },
      {
        id: 'u6l2', title: 'Full Table II', count: 16, allowedActions: ['H', 'S', 'D', 'P', 'R'],
        filter: () => true,
        blurb: 'Keep sharpening.',
      },
      {
        id: 'u6l3', title: 'Full Table III', count: 18, allowedActions: ['H', 'S', 'D', 'P', 'R'],
        filter: () => true,
        blurb: 'The final drill.',
      },
    ],
  },
];

const ALL_LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unitId: u.id, unitTitle: u.title })));

function lessonPool(lesson) {
  return window.Strategy.ALL_SCENARIOS
    .filter(lesson.filter)
    .map((s) => ({ ...s, correctAction: window.Strategy.resolveAction(s.raw, lesson.allowedActions) }));
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(lesson) {
  const pool = lessonPool(lesson);
  const out = [];
  let bag = shuffled(pool);
  while (out.length < lesson.count) {
    if (bag.length === 0) bag = shuffled(pool);
    const scenario = bag.pop();
    out.push({ ...scenario, hand: window.Strategy.generateHand(scenario) });
  }
  return out;
}

window.Lessons = { UNITS, ALL_LESSONS, buildQuestions };
