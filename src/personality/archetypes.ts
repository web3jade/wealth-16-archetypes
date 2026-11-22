export type HorizonLetter = 'E' | 'L'
export type RiskLetter = 'S' | 'V'
export type LifestyleLetter = 'M' | 'A'
export type StyleLetter = 'P' | 'F'

export type TypeCode = `${HorizonLetter}${RiskLetter}${LifestyleLetter}${StyleLetter}`

export interface Archetype {
  code: TypeCode
  title: string
  tagline: string
  blurb: string
  strength: string
  blindSpot: string
  shareHook: string
}

export const ARCHETYPES: Record<TypeCode, Archetype> = {
  ESMP: {
    code: 'ESMP',
    title: 'The Fortress',
    tagline: 'Early out, protected, lean, mapped.',
    blurb: 'You want freedom soon, without drama. A clear plan and a lean lifestyle are your moat.',
    strength: 'Discipline under pressure',
    blindSpot: 'May under-invest in growth and joy',
    shareHook: "I'm an ESMP — The Fortress",
  },
  ESMF: {
    code: 'ESMF',
    title: 'The Escape Hatch',
    tagline: 'Early out, protected, lean, improvise.',
    blurb: 'You keep a safe buffer and a simple life so you can leave when the timing feels right.',
    strength: 'Optionality with downside protection',
    blindSpot: 'Vague timelines can delay the exit',
    shareHook: "I'm an ESMF — The Escape Hatch",
  },
  ESAP: {
    code: 'ESAP',
    title: 'The Soft Launch',
    tagline: 'Early out, protected, upgraded life, mapped.',
    blurb: 'You want an earlier finish and a nicer life — with rails, not roulette.',
    strength: 'Balanced ambition with a plan',
    blindSpot: 'Comfort goals can stretch the runway',
    shareHook: "I'm an ESAP — The Soft Launch",
  },
  ESAF: {
    code: 'ESAF',
    title: 'The Lucky Exit',
    tagline: 'Early out, protected, upgraded life, flexible.',
    blurb: 'You hope to leave early into a richer life, keeping risk low and plans loose.',
    strength: 'Optimistic resilience',
    blindSpot: 'Luck is not a strategy forever',
    shareHook: "I'm an ESAF — The Lucky Exit",
  },
  EVMP: {
    code: 'EVMP',
    title: 'The Compounder',
    tagline: 'Early out, growth, lean, mapped.',
    blurb: 'You chase compounding hard, live light, and track every year shaved off work.',
    strength: 'Aggressive saving with focus',
    blindSpot: 'Volatility can rattle a tight timeline',
    shareHook: "I'm an EVMP — The Compounder",
  },
  EVMF: {
    code: 'EVMF',
    title: 'The Opportunist',
    tagline: 'Early out, growth, lean, flexible.',
    blurb: 'You hunt upside, keep costs low, and stay ready to pivot when markets open a door.',
    strength: 'Speed and adaptability',
    blindSpot: 'Opportunism without rails drifts',
    shareHook: "I'm an EVMF — The Opportunist",
  },
  EVAP: {
    code: 'EVAP',
    title: 'The Rocket',
    tagline: 'Early out, growth, abundant, mapped.',
    blurb: 'Big goals, early exit, growth assets — and a checklist to match the ambition.',
    strength: 'High-agency vision',
    blindSpot: 'Ambition stacks risk on a short clock',
    shareHook: "I'm an EVAP — The Rocket",
  },
  EVAF: {
    code: 'EVAF',
    title: 'The Free Agent',
    tagline: 'Early out, growth, abundant, flexible.',
    blurb: 'You want freedom, upside, and a rich life — and you trust yourself to figure it out.',
    strength: 'Bold energy',
    blindSpot: 'Bold without a map burns runway',
    shareHook: "I'm an EVAF — The Free Agent",
  },
  LSMP: {
    code: 'LSMP',
    title: 'The Steward',
    tagline: 'Long run, protected, lean, mapped.',
    blurb: 'You’re playing the long game carefully — steady contributions, modest needs, clear books.',
    strength: 'Reliability and patience',
    blindSpot: 'May leave growth on the table',
    shareHook: "I'm an LSMP — The Steward",
  },
  LSMF: {
    code: 'LSMF',
    title: 'The Coast Guard',
    tagline: 'Long run, protected, lean, flexible.',
    blurb: 'You keep things simple and safe, coasting toward a later finish without overthinking.',
    strength: 'Low-stress consistency',
    blindSpot: 'Coast mode can hide a quiet gap',
    shareHook: "I'm an LSMF — The Coast Guard",
  },
  LSAP: {
    code: 'LSAP',
    title: 'The Legacy Builder',
    tagline: 'Long run, protected, abundant, mapped.',
    blurb: 'You’re building a comfortable later life with care, structure, and staying power.',
    strength: 'Long-horizon stewardship',
    blindSpot: 'Conservatism can slow the legacy goal',
    shareHook: "I'm an LSAP — The Legacy Builder",
  },
  LSAF: {
    code: 'LSAF',
    title: 'The Soft Landing',
    tagline: 'Long run, protected, abundant, flexible.',
    blurb: 'You want a gentle, comfortable landing later — not a scramble, not a sprint.',
    strength: 'Calm lifestyle vision',
    blindSpot: 'Soft plans need hard numbers',
    shareHook: "I'm an LSAF — The Soft Landing",
  },
  LVMP: {
    code: 'LVMP',
    title: 'The Patient Hunter',
    tagline: 'Long run, growth, lean, mapped.',
    blurb: 'Time is your edge. You invest for growth, live lean, and let decades do the work.',
    strength: 'Compounding patience',
    blindSpot: 'May delay enjoyment too long',
    shareHook: "I'm an LVMP — The Patient Hunter",
  },
  LVMF: {
    code: 'LVMF',
    title: 'The Wave Rider',
    tagline: 'Long run, growth, lean, flexible.',
    blurb: 'You’re comfortable riding markets over a long career while keeping life costs light.',
    strength: 'Market temperament',
    blindSpot: 'Waves without a course still drift',
    shareHook: "I'm an LVMF — The Wave Rider",
  },
  LVAP: {
    code: 'LVAP',
    title: 'The Dynasty Architect',
    tagline: 'Long run, growth, abundant, mapped.',
    blurb: 'You’re designing a long, rich chapter with growth engines and a blueprint.',
    strength: 'Strategic abundance',
    blindSpot: 'Complexity can outrun execution',
    shareHook: "I'm an LVAP — The Dynasty Architect",
  },
  LVAF: {
    code: 'LVAF',
    title: 'The Wild Card',
    tagline: 'Long run, growth, abundant, flexible.',
    blurb: 'Big life, growth bias, long runway — and a willingness to rewrite the plan mid-flight.',
    strength: 'Expansive possibility',
    blindSpot: 'Wild cards need checkpoints',
    shareHook: "I'm an LVAF — The Wild Card",
  },
}

export const ALL_TYPE_CODES = Object.keys(ARCHETYPES) as TypeCode[]

export function getArchetype(code: TypeCode): Archetype {
  return ARCHETYPES[code]
}
