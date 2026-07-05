/**
 * ONBOARDING — CONTENT CONFIG (the cheap-iteration surface)
 * =====================================================================
 * EVERY user-facing string, question, option, AI-level card, tour block and
 * gif slot lives here as DATA — never hardcoded in JSX. Steps render from this
 * config, so iterating (reword, reorder, swap a gif, add a tour block, add an
 * option) is an edit to data, not surgery on components.
 *
 * GIF SLOTS: every `gif` field is the single swap point for a screen-capture of
 * the real platform (which doesn't exist yet). Leave it `null` and a clean,
 * on-brand labelled placeholder renders; set it to a URL later and the real
 * media drops straight in. Do NOT fabricate fake UI — the placeholder reads as
 * "gif goes here".
 */

import type {
  AiLevel,
  FinanceDepth,
  FinanceField,
  InvestingExperience,
  InvestingStyle,
  TermComfort,
  LedgerFlags,
} from "./onboarding-types";
import type { IconName } from "@/lib/icons";

/* ---- Versions (stamped into meta on completion) ------------------------ */
export const ONBOARDING_VERSION = "2026.07-v1";
export const DISCLAIMER_TEXT_VERSION = "disclaimer-v1";

/** Fallback delivery preference — aiLevel is never plain/technical by default. */
export const DEFAULT_AI_LEVEL: AiLevel = "balanced";

/* =======================================================================
   PART 0 — WELCOME
   ======================================================================= */
export const welcomeConfig = {
  eyebrow: "Welcome to Vytal",
  /** Rendered word-group by word-group with a stagger. */
  headline: ["The market,", "made", "legible."],
  headlineAccentIndex: 2, // which word-group gets the gradient
  subhead:
    "Vytal reads a company's health the way an analyst would — then explains it in your language. Let's tune it to you. Takes about a minute.",
  cta: "Get Started",
  footnote: "No forms to dread. Four quick taps and you're in.",
  /** Looping platform gifs that make the first screen feel alive. */
  gifs: [
    { id: "health", label: "Health Score demo", aspect: "16/10", gif: null as string | null },
    { id: "analysis", label: "Deep analysis demo", aspect: "4/3", gif: null as string | null },
    { id: "compare", label: "Comparison demo", aspect: "4/3", gif: null as string | null },
  ],
} as const;

/* =======================================================================
   PART 1 — STEP 1 · "About You"
   ======================================================================= */

/** The AI-level cards. Labels describe OUTPUT STYLE, never the user.
 *  The gif is the SAME sample exchange answered at this level (identical
 *  question, three different answers — that's what makes the choice honest);
 *  `sampleAnswer` is shown as an honest caption until the real gif drops in. */
export interface AiLevelCard {
  id: AiLevel;
  name: string;
  tagline: string;
  /** one-word feel, sits on the card as a chip */
  chip: string;
  icon: IconName;
  gif: string | null;
  sampleAnswer: string;
}

export const aboutConfig = {
  eyebrow: "Step 1 · About you",
  title: "Let's get you set up",
  subtitle: "A name we'll greet you by, and how you'd like Vytal to explain things.",

  displayName: {
    label: "What should we call you?",
    placeholder: "Your name",
    hint: "This is just how we'll greet you.",
    required: true,
  },

  aiLevel: {
    label: "How should Vytal explain things?",
    /** The single shared question all three cards answer differently. */
    sampleQuestion: "“Is HDFC Bank's valuation expensive right now?”",
    reassurance:
      "This just sets how we explain things — change it anytime in Settings.",
    cards: [
      {
        id: "plain",
        name: "Plain",
        tagline: "Explain things simply, minimal jargon.",
        chip: "Everyday language",
        icon: "compass",
        gif: null,
        sampleAnswer:
          "It's pricier than usual — people are paying more for each rupee the bank earns than they normally would.",
      },
      {
        id: "balanced",
        name: "Balanced",
        tagline: "Some terms, with context.",
        chip: "Terms + context",
        icon: "scales",
        gif: null,
        sampleAnswer:
          "It trades at a P/E of ~19 — above its 5-year average near 16 — so the market is pricing in premium growth.",
      },
      {
        id: "technical",
        name: "Technical",
        tagline: "Full depth, assume I know the terms.",
        chip: "Full depth",
        icon: "brain",
        gif: null,
        sampleAnswer:
          "P/E 19.2x vs 5y mean 16.1x (+19%), P/B 2.8x. The re-rating implies the Street is underwriting sustained mid-teens ROE.",
      },
    ] satisfies AiLevelCard[],
    defaultHighlight: "balanced" as AiLevel,
  },
} as const;

/* =======================================================================
   PART 2 — STEP 2 · "Finance & Investing"  (4 select questions → ledger)
   ======================================================================= */

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  sublabel: string;
  icon: IconName;
}

export interface FinanceQuestion {
  /** which ledger field this writes */
  field: FinanceField;
  eyebrow: string;
  title: string;
  options: SelectOption<string>[];
}

export const financeConfig = {
  eyebrow: "Step 2 · Finance & investing",
  title: "How you think about markets",
  subtitle: "Four quick reads. There are no wrong answers — this just tunes the fit.",
  questions: [
    {
      field: "financeDepth",
      eyebrow: "Finance exposure",
      title: "How close are you to finance day-to-day?",
      options: [
        { value: "casual", label: "Casual", sublabel: "I follow markets out of interest.", icon: "eye" },
        { value: "formal", label: "Formal", sublabel: "I've studied it or use it in my work.", icon: "graph" },
        { value: "professional", label: "Professional", sublabel: "It's my field — I work in or around it.", icon: "building" },
      ] satisfies SelectOption<FinanceDepth>[],
    },
    {
      field: "termComfort",
      eyebrow: "Comfort with terms",
      title: "When a financial term comes up…",
      options: [
        { value: "explain", label: "Explain it", sublabel: "Define terms as we go.", icon: "question" },
        { value: "follow", label: "Follow most", sublabel: "Only define the unusual ones.", icon: "check" },
        { value: "assume", label: "Assume I know", sublabel: "Skip the definitions.", icon: "bolt" },
      ] satisfies SelectOption<TermComfort>[],
    },
    {
      field: "investingExperience",
      eyebrow: "Investing experience",
      title: "How long have you been investing?",
      options: [
        { value: "starting", label: "Just starting", sublabel: "New to it, or about to begin.", icon: "spark" },
        { value: "few_years", label: "A few years", sublabel: "I've been at it a while.", icon: "clock" },
        { value: "experienced", label: "Experienced", sublabel: "Many years across cycles.", icon: "crown" },
      ] satisfies SelectOption<InvestingExperience>[],
    },
    {
      field: "investingStyle",
      eyebrow: "Investing style",
      title: "How do you mostly invest?",
      options: [
        { value: "long_term", label: "Long-term", sublabel: "Buy and hold for years.", icon: "shield" },
        { value: "mix", label: "A mix", sublabel: "Some core, some tactical.", icon: "scales" },
        { value: "active", label: "Active", sublabel: "Short-term, hands-on trades.", icon: "pulse" },
      ] satisfies SelectOption<InvestingStyle>[],
    },
  ] satisfies FinanceQuestion[],
} as const;

/* =======================================================================
   PART 2.5 — ADAPTIVE FOLLOW-UP  (fires AT MOST ONE, priority 1→2→3)
   ======================================================================= */

/** Each option either sets a flag to `true` or sets no flag (null). Answering
 *  writes FACTS to ledger.flags — it never overwrites a raw Step-2 answer.
 *  The trigger *conditions* live in the state machine (evaluateAdaptive); the
 *  *content* (question + option labels + resulting flag) lives here. */
export interface AdaptiveOption {
  label: string;
  sublabel: string;
  /** flag to set true, or null for "no flag" */
  flag: keyof LedgerFlags | null;
  icon: IconName;
}

export interface AdaptiveTrigger {
  id: "t1" | "t2" | "t3";
  eyebrow: string;
  question: string;
  options: AdaptiveOption[];
}

export const adaptiveConfig = {
  eyebrow: "One more thing",
  triggers: {
    t1: {
      id: "t1",
      eyebrow: "One more thing",
      question: "You'd like full-depth explanations — how'd you learn finance?",
      options: [
        {
          label: "Self-taught",
          sublabel: "I know more than tests would show.",
          flag: "selfTaught",
          icon: "rocket",
        },
        {
          label: "Still learning",
          sublabel: "But I want the real thing, not the watered-down version.",
          flag: "aspirationalTechnical",
          icon: "trendUp",
        },
      ],
    },
    t2: {
      id: "t2",
      eyebrow: "One more thing",
      question: "Want me to keep it genuinely simple, or skip the basics and stay brief?",
      options: [
        {
          label: "Keep it simple",
          sublabel: "Plain explanations, take your time.",
          flag: null,
          icon: "compass",
        },
        {
          label: "Skip basics, stay brief",
          sublabel: "I know the fundamentals — just be concise.",
          flag: "concisePro",
          icon: "bolt",
        },
      ],
    },
    t3: {
      id: "t3",
      eyebrow: "One more thing",
      question: "Should I lean toward explaining as we go?",
      options: [
        {
          label: "Yes, explain as you go",
          sublabel: "A little context never hurts.",
          flag: "explainLeaning",
          icon: "question",
        },
        {
          label: "No, I mostly follow",
          sublabel: "I'll ask if I need a term defined.",
          flag: "trustCredential",
          icon: "check",
        },
      ],
    },
  } satisfies Record<AdaptiveTrigger["id"], AdaptiveTrigger>,
} as const;

/* =======================================================================
   PART 3 — HANDOFF · Capability tour + disclaimer gate
   ======================================================================= */

export interface TourBlock {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: IconName;
  aspect: string;
  gif: string | null;
  /** condition scale accent for the block (matches design tokens) */
  accent: "pristine" | "p-found" | "p-mom" | "p-mkt" | "p-own";
}

export const handoffConfig = {
  eyebrow: "Here's what Vytal can do",
  title: "A quick tour before you dive in",
  subtitle: "Scroll through — then you're in. Health Score is where most people start.",
  /** ~5 blocks, in order. Health Score leads (the differentiator). */
  tour: [
    {
      id: "health-score",
      eyebrow: "The differentiator",
      title: "Health Score",
      description:
        "One 0–100 number that reads a company's fundamentals, momentum, market posture and ownership — the whole story, at a glance.",
      icon: "health",
      aspect: "16/9",
      gif: null,
      accent: "pristine",
    },
    {
      id: "deep-analysis",
      eyebrow: "Go deeper",
      title: "Deep stock analysis",
      description:
        "Every figure behind the score — statements, ratios, trends and flags — laid out so the 'why' is never a black box.",
      icon: "chartLine",
      aspect: "16/9",
      gif: null,
      accent: "p-found",
    },
    {
      id: "comparison",
      eyebrow: "Side by side",
      title: "Comparison",
      description:
        "Put two names head-to-head across every pillar and see exactly where one pulls ahead of the other.",
      icon: "compare",
      aspect: "16/9",
      gif: null,
      accent: "p-mom",
    },
    {
      id: "portfolio",
      eyebrow: "Stay on top of it",
      title: "Portfolio tracking",
      description:
        "Watch the health of what you hold change over time, with alerts when a score starts to drift.",
      icon: "portfolio",
      aspect: "16/9",
      gif: null,
      accent: "p-own",
    },
    {
      id: "ai-explains",
      eyebrow: "In your language",
      title: "AI that explains",
      description:
        "Ask anything and get an answer pitched exactly how you asked us to — the delivery level you just picked, applied everywhere.",
      icon: "brain",
      aspect: "16/9",
      gif: null,
      accent: "p-mkt",
    },
  ] satisfies TourBlock[],

  /** The legal beat — its own deliberate, slightly heavier moment. */
  disclaimer: {
    eyebrow: "Before you enter",
    heading: "One thing to be clear about",
    body: "Vytal is an analysis platform, not an advisory service. It shows you data and explains it — it never tells you what to buy or sell. All investment decisions are yours. Vytal is not responsible for any financial decision you make.",
    checkboxLabel: "I understand Vytal is an analysis tool, not investment advice.",
    button: "Enter Vytal",
    lockedHint: "Scroll through the tour and tick the box to continue.",
  },
} as const;

/* =======================================================================
   PROGRESS RAIL — milestone labels (branch-aware; adaptive is optional)
   ======================================================================= */
export const milestoneLabels: Record<string, string> = {
  about: "About you",
  finance: "Finance",
  adaptive: "Follow-up",
  handoff: "Explore",
};

/* ---- Shared nav labels ------------------------------------------------- */
export const navLabels = {
  back: "Back",
  continue: "Continue",
  finish: "Continue",
} as const;
