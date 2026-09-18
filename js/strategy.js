// Basic strategy data + resolution engine.
// Ruleset assumed: 4-8 decks, dealer stands on soft 17, double after split
// allowed, late surrender allowed, no re-splitting aces.
//
// Upcard order used by every table below: 2,3,4,5,6,7,8,9,10,A
const UPCARDS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const TEN_RANKS = ['10', 'J', 'Q', 'K'];
const SUITS = [
  { symbol: '♠', color: 'black' }, // spade
  { symbol: '♥', color: 'red' },   // heart
  { symbol: '♦', color: 'red' },   // diamond
  { symbol: '♣', color: 'black' }, // club
];

// Raw action codes:
//  H  = Hit                Ds = Double, else Stand
//  S  = Stand              Dh = Double, else Hit
//  D  = Double             Rh = Surrender, else Hit
//  P  = Split
const HARD = {
  5:  ['H','H','H','H','H','H','H','H','H','H'],
  6:  ['H','H','H','H','H','H','H','H','H','H'],
  7:  ['H','H','H','H','H','H','H','H','H','H'],
  8:  ['H','H','H','H','H','H','H','H','H','H'],
  9:  ['H','Dh','Dh','Dh','Dh','H','H','H','H','H'],
  10: ['Dh','Dh','Dh','Dh','Dh','Dh','Dh','Dh','H','H'],
  11: ['Dh','Dh','Dh','Dh','Dh','Dh','Dh','Dh','Dh','H'],
  12: ['H','H','S','S','S','H','H','H','H','H'],
  13: ['S','S','S','S','S','H','H','H','H','H'],
  14: ['S','S','S','S','S','H','H','H','H','H'],
  15: ['S','S','S','S','S','H','H','H','Rh','H'],
  16: ['S','S','S','S','S','H','H','Rh','Rh','Rh'],
  17: ['S','S','S','S','S','S','S','S','S','S'],
  18: ['S','S','S','S','S','S','S','S','S','S'],
  19: ['S','S','S','S','S','S','S','S','S','S'],
  20: ['S','S','S','S','S','S','S','S','S','S'],
};

// Keyed by total (Ace + X). 21 (blackjack) is not a decision point.
const SOFT = {
  13: ['H','H','H','Dh','Dh','H','H','H','H','H'],
  14: ['H','H','H','Dh','Dh','H','H','H','H','H'],
  15: ['H','H','Dh','Dh','Dh','H','H','H','H','H'],
  16: ['H','H','Dh','Dh','Dh','H','H','H','H','H'],
  17: ['H','Dh','Dh','Dh','Dh','H','H','H','H','H'],
  18: ['S','Dh','Dh','Dh','Dh','S','S','H','H','H'],
  19: ['S','S','S','S','Ds','S','S','S','S','S'],
  20: ['S','S','S','S','S','S','S','S','S','S'],
};

// Keyed by pair rank: 2-9, '10' (any ten-value pair), 'A'.
// 5,5 and 10,10 are famously NEVER split.
const PAIRS = {
  2:   ['P','P','P','P','P','P','H','H','H','H'],
  3:   ['P','P','P','P','P','P','H','H','H','H'],
  4:   ['H','H','H','P','P','H','H','H','H','H'],
  5:   ['D','D','D','D','D','D','D','D','H','H'], // treat as hard 10
  6:   ['P','P','P','P','P','H','H','H','H','H'],
  7:   ['P','P','P','P','P','P','H','H','H','H'],
  8:   ['P','P','P','P','P','P','P','P','P','P'],
  9:   ['P','P','P','P','P','S','P','P','S','S'],
  '10': ['S','S','S','S','S','S','S','S','S','S'],
  A:   ['P','P','P','P','P','P','P','P','P','P'],
};

function upcardIndex(upcardValue) {
  return UPCARDS.indexOf(upcardValue);
}

function upcardLabel(upcardValue) {
  return upcardValue === 11 ? 'A' : String(upcardValue);
}

// Reduce a raw table code to an actual action given which buttons the
// current lesson makes available.
function resolveAction(raw, allowedActions) {
  const has = (a) => allowedActions.includes(a);
  switch (raw) {
    case 'Dh': return has('D') ? 'D' : 'H';
    case 'Ds': return has('D') ? 'D' : 'S';
    case 'Rh': return has('R') ? 'R' : 'H';
    case 'D':  return has('D') ? 'D' : 'H';
    case 'P':  return has('P') ? 'P' : 'H';
    default:   return raw; // H or S already final
  }
}

const ACTION_INFO = {
  H: { label: 'Hit', color: '#5b6b73' },
  S: { label: 'Stand', color: '#2b6cb0' },
  D: { label: 'Double', color: '#d97706' },
  P: { label: 'Split', color: '#7c3aed' },
  R: { label: 'Surrender', color: '#c0392b' },
};

const ACTION_REASON = {
  H: 'Hit — your hand is too weak to stand on and not strong enough to double.',
  S: 'Stand — hitting risks busting for too little upside here.',
  D: 'Double Down — this is a strong spot to increase your bet for one more card.',
  P: 'Split — breaking the pair into two hands gives better long-run odds.',
  R: 'Surrender — the odds are bad enough that giving back half your bet beats playing on.',
};

// Build the master list of every scenario the game knows about.
// Each entry: { kind, key (total or pair rank), upcard, raw }
function buildAllScenarios() {
  const all = [];
  for (const totalStr of Object.keys(HARD)) {
    const total = Number(totalStr);
    HARD[totalStr].forEach((raw, i) => {
      all.push({ kind: 'hard', key: total, upcard: UPCARDS[i], raw });
    });
  }
  for (const totalStr of Object.keys(SOFT)) {
    const total = Number(totalStr);
    SOFT[totalStr].forEach((raw, i) => {
      all.push({ kind: 'soft', key: total, upcard: UPCARDS[i], raw });
    });
  }
  for (const rankKey of Object.keys(PAIRS)) {
    // Object keys are always strings; canonicalize back to a number so
    // lesson filters can compare against numeric ranks (e.g. === 8).
    const canonKey = rankKey === 'A' ? 'A' : Number(rankKey);
    PAIRS[rankKey].forEach((raw, i) => {
      all.push({ kind: 'pair', key: canonKey, upcard: UPCARDS[i], raw });
    });
  }
  return all;
}

const ALL_SCENARIOS = buildAllScenarios();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSuit(excludeSymbol) {
  let choice;
  do {
    choice = SUITS[randInt(0, SUITS.length - 1)];
  } while (excludeSymbol && choice.symbol === excludeSymbol);
  return choice;
}

function rankForValue(value) {
  if (value === 11) return 'A';
  if (value === 10) return TEN_RANKS[randInt(0, TEN_RANKS.length - 1)];
  return String(value);
}

function makeCard(rank) {
  const suit = randomSuit();
  return { rank, suit: suit.symbol, color: suit.color };
}

// Non-pair (a,b) combinations summing to a hard total, 2 <= a <= b <= 10.
// a === b is allowed only at 10 (two different ten-ranks, e.g. K,Q -
// not a true rank pair, still a "hard 20").
function hardCombos(total) {
  const combos = [];
  for (let a = 2; a <= 10; a++) {
    const b = total - a;
    if (b < a || b > 10) continue;
    if (a === b && a !== 10) continue;
    combos.push([a, b]);
  }
  return combos;
}

function generateHand(scenario) {
  if (scenario.kind === 'hard') {
    const combos = hardCombos(scenario.key);
    const [a, b] = combos[randInt(0, combos.length - 1)];
    if (a === 10 && b === 10) {
      const shuffled = [...TEN_RANKS].sort(() => Math.random() - 0.5);
      return [makeCard(shuffled[0]), makeCard(shuffled[1])];
    }
    return [makeCard(rankForValue(a)), makeCard(rankForValue(b))];
  }
  if (scenario.kind === 'soft') {
    return [makeCard('A'), makeCard(rankForValue(scenario.key - 11))];
  }
  // pair
  const rank = scenario.key === 10 ? null : String(scenario.key);
  if (rank === null) {
    const r1 = TEN_RANKS[randInt(0, TEN_RANKS.length - 1)];
    const r2 = TEN_RANKS[randInt(0, TEN_RANKS.length - 1)];
    return [makeCard(r1), makeCard(r2)];
  }
  const c1 = makeCard(rank);
  const c2 = makeCard(rank);
  // avoid drawing the identical suit twice for a literal duplicate card
  if (c1.suit === c2.suit) c2.suit = randomSuit(c1.suit).symbol;
  return [c1, c2];
}

function describeScenario(scenario) {
  if (scenario.kind === 'hard') return `Hard ${scenario.key}`;
  if (scenario.kind === 'soft') return `Soft ${scenario.key}`;
  const label = scenario.key === 'A' ? 'Aces' : `${scenario.key}s`;
  return `Pair of ${label}`;
}

window.Strategy = {
  UPCARDS,
  ALL_SCENARIOS,
  ACTION_INFO,
  ACTION_REASON,
  resolveAction,
  upcardIndex,
  upcardLabel,
  generateHand,
  describeScenario,
  HARD,
  SOFT,
  PAIRS,
};
