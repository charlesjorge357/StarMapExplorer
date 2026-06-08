export type CultureArchetype = 'imperial' | 'republic' | 'corporate' | 'dominion' | 'alliance' | 'generic';

// ─── Phoneme palettes ────────────────────────────────────────────────────────

interface Phonemes {
  starts: string[];  // word-initial clusters
  mids:   string[];  // optional middle bridges
  ends:   string[];  // word-final clusters / suffixes
}

const PHONEMES: Record<CultureArchetype, Phonemes> = {
  imperial: {
    starts: ['Val', 'Cor', 'Mal', 'Aug', 'Aur', 'Gal', 'Tri', 'Prae', 'Flav', 'Cas', 'Ves', 'Sev', 'Oth', 'Luc'],
    mids:   ['a', 'i', 'u', 'an', 'in', 'ald', 'ert', 'orn', 'ul'],
    ends:   ['us', 'or', 'ax', 'ar', 'is', 'um', 'on', 'ius', 'ix', 'atus'],
  },
  republic: {
    starts: ['Krat', 'Hel', 'Dem', 'Pol', 'Arch', 'Aeg', 'Eth', 'Ath', 'Eph', 'Pan', 'Lek', 'Prax', 'Syn'],
    mids:   ['a', 'o', 'ae', 'ia', 'ith', 'an', 'eo'],
    ends:   ['os', 'is', 'on', 'ia', 'as', 'eia', 'ikos', 'alis'],
  },
  corporate: {
    starts: ['Nex', 'Vex', 'Syn', 'Gen', 'Hex', 'Triv', 'Prod', 'Ax', 'Lex', 'Zor', 'Flux', 'Cert'],
    mids:   ['a', 'e', 'i', 'al', 'el', 'or', 'ul'],
    ends:   ['ex', 'ix', 'on', 'um', 'ax', 'tec', 'sys', 'corp', 'net'],
  },
  dominion: {
    starts: ['Drax', 'Grak', 'Kvol', 'Zrak', 'Vrak', 'Skar', 'Kral', 'Brak', 'Gol', 'Thrum', 'Vorg'],
    mids:   ['u', 'a', 'ork', 'urk', 'akh', 'og'],
    ends:   ['ek', 'ak', 'ur', 'oth', 'org', 'ard', 'ulk', 'orm', 'az'],
  },
  alliance: {
    starts: ['Lyr', 'Ael', 'Eld', 'Ily', 'Ther', 'Fael', 'Vel', 'Aev', 'Lum', 'Yel', 'Cael', 'Mirel'],
    mids:   ['a', 'ia', 'ae', 'ie', 'in', 'il', 'yn'],
    ends:   ['a', 'ia', 'eth', 'iel', 'ara', 'ath', 'elle', 'ene', 'ith', 'or'],
  },
  generic: {
    starts: ['Sar', 'Cor', 'Vel', 'Nor', 'Zan', 'Rex', 'Kar', 'Myr', 'Lux', 'Tor', 'Vol', 'Nyx'],
    mids:   ['a', 'e', 'i', 'an', 'or', 'ar', 'on'],
    ends:   ['on', 'ar', 'ix', 'us', 'an', 'ex', 'ion', 'id'],
  },
};

// ─── Culture vocabulary ───────────────────────────────────────────────────────

export const GOVERNMENTS: Record<CultureArchetype, string[]> = {
  imperial:  ['Empire', 'Imperium', 'Kingdom', 'Tsardom', 'Hegemony', 'Dominion', 'Regency', 'Realm'],
  republic:  ['Republic', 'Federation', 'Assembly', 'Senate', 'Democracy', 'Commonwealth', 'Council', 'Coalition'],
  corporate: ['Syndicate', 'Corporation', 'Conglomerate', 'Consortium', 'Guild', 'Cartel', 'Exchange', 'Combine'],
  dominion:  ['Dominion', 'Collective', 'Directorate', 'Order', 'Regime', 'Junta', 'Union', 'Pact'],
  alliance:  ['Alliance', 'Covenant', 'League', 'Accord', 'Compact', 'Concord', 'Fellowship', 'Pact'],
  generic:   ['Authority', 'Territory', 'Protectorate', 'Sector', 'Frontier', 'Coalition', 'Systems'],
};

export const PREFIXES: Record<CultureArchetype, string[]> = {
  imperial:  ['Imperial', 'Grand', 'Royal', 'Sovereign', 'Supreme', 'Eternal', 'Glorious'],
  republic:  ['United', 'Free', 'Democratic', 'Federal', 'Open', 'Greater', 'New'],
  corporate: ['Global', 'Galactic', 'Trans-', 'Omni', 'Hyper', 'Ultra', 'Pan-'],
  dominion:  ['Iron', 'Eternal', 'Supreme', 'Total', 'Absolute', 'Unified', 'Central'],
  alliance:  ['United', 'Mutual', 'Shared', 'Joint', 'Common', 'Free', 'Open'],
  generic:   ['Outer', 'New', 'Greater', 'Solar', 'Far', 'Deep', 'Old'],
};

export const LEADER_TITLES: Record<CultureArchetype, string[]> = {
  imperial:  ['Emperor', 'Empress', 'Consul', 'Praetor', 'Legate', 'Imperator', 'Warlord', 'Admiral'],
  republic:  ['President', 'Senator', 'Archon', 'Chancellor', 'Tribune', 'Delegate', 'Speaker'],
  corporate: ['Director', 'Executive', 'Chairman', 'Commissioner', 'Controller', 'Principal', 'Manager'],
  dominion:  ['Overseer', 'Marshal', 'Commissar', 'Warlord', 'Commander', 'Regent', 'Warden'],
  alliance:  ['Coordinator', 'Ambassador', 'Envoy', 'Speaker', 'Steward', 'Mediator', 'Liaison'],
  generic:   ['Governor', 'Administrator', 'Commander', 'Minister', 'Prefect', 'Custodian'],
};

// ─── Archetype detection ──────────────────────────────────────────────────────

// Weighted pool: more appearances = higher probability
const PLANET_ARCHETYPE_WEIGHTS: Record<string, CultureArchetype[]> = {
  jungle_world:    ['republic', 'alliance', 'republic', 'alliance', 'generic'],
  grassland_world: ['republic', 'alliance', 'generic', 'republic', 'imperial'],
  ocean_world:     ['alliance', 'republic', 'alliance', 'generic', 'corporate'],
  marshy_world:    ['alliance', 'republic', 'generic', 'dominion', 'alliance'],
  tundra_world:    ['dominion', 'alliance', 'generic', 'imperial', 'dominion'],
  snowy_world:     ['dominion', 'alliance', 'generic', 'imperial', 'dominion'],
  arid_world:      ['imperial', 'dominion', 'generic', 'imperial', 'corporate'],
  dusty_world:     ['imperial', 'dominion', 'generic', 'imperial', 'corporate'],
  sandy_world:     ['imperial', 'corporate', 'generic', 'dominion', 'imperial'],
  martian_world:   ['dominion', 'imperial', 'dominion', 'generic', 'corporate'],
  barren_world:    ['dominion', 'corporate', 'generic', 'dominion', 'imperial'],
  nuclear_world:   ['dominion', 'corporate', 'dominion', 'dominion', 'imperial'],
  methane_world:   ['corporate', 'dominion', 'generic', 'corporate', 'dominion'],
  gas_giant:       ['corporate', 'corporate', 'generic', 'dominion', 'corporate'],
  frost_giant:     ['dominion', 'corporate', 'generic', 'dominion', 'alliance'],
};

// ─── PRNG ─────────────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed + 1;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

export function idToSeed(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return (h >>> 0) + 1;
}

function pick<T>(arr: T[], random: () => number): T {
  return arr[Math.floor(random() * arr.length)];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Deterministically maps a planet type + seed to a cultural archetype. */
export function getArchetype(planetType: string, seed: number): CultureArchetype {
  const random = seededRandom(seed);
  const pool = PLANET_ARCHETYPE_WEIGHTS[planetType] ?? ['generic', 'imperial', 'republic', 'corporate', 'dominion', 'alliance'];
  return pick(pool, random);
}

/**
 * Generates a pronounceable proper noun in the style of the given archetype.
 * Same seed always returns the same name.
 */
export function generateCultureName(archetype: CultureArchetype, seed: number): string {
  const random = seededRandom(seed);
  const p = PHONEMES[archetype];

  const start = pick(p.starts, random);
  const useMid = random() > 0.45;
  const mid  = useMid ? pick(p.mids, random) : '';
  const end  = pick(p.ends, random);

  const raw = start + mid + end;
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/** Returns a culture-appropriate government term, seeded. */
export function getGovernmentTerm(archetype: CultureArchetype, seed: number): string {
  return pick(GOVERNMENTS[archetype], seededRandom(seed));
}

/** Returns a culture-appropriate leader title, seeded. */
export function getLeaderTitle(archetype: CultureArchetype, seed: number): string {
  return pick(LEADER_TITLES[archetype], seededRandom(seed));
}

/** Returns a culture-appropriate prefix, seeded. */
export function getCulturePrefix(archetype: CultureArchetype, seed: number): string {
  return pick(PREFIXES[archetype], seededRandom(seed));
}
