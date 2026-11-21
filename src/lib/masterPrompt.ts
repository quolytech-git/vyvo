import JSZip from "jszip";
import { MASTER_PROMPT_BODY } from "./masterPromptText";

/* =====================================================================
   Simple questionnaire -> 7 input files -> complete Master Prompt.
   Everything is optional: any skipped answer becomes DEFAULT so the AI
   chooses a smart value and lists it under "DECISIONS I MADE".
   ===================================================================== */

export type SectionKey =
  | "hero"
  | "logos"
  | "services"
  | "work"
  | "process"
  | "numbers"
  | "testimonials"
  | "pricing"
  | "faq"
  | "aboutTeam"
  | "blog"
  | "contact"
  | "finalCta"
  | "footer";

export interface Option {
  value: string;
  label: string;
}

export const SECTION_LABELS: Array<{ key: SectionKey; label: string }> = [
  { key: "hero", label: "Hero (top banner)" },
  { key: "services", label: "Services / Features" },
  { key: "work", label: "Work / Projects" },
  { key: "process", label: "How it works" },
  { key: "numbers", label: "Key numbers" },
  { key: "testimonials", label: "Testimonials" },
  { key: "pricing", label: "Pricing" },
  { key: "faq", label: "FAQ" },
  { key: "aboutTeam", label: "About / Team" },
  { key: "logos", label: "Client logos" },
  { key: "blog", label: "Blog / News" },
  { key: "contact", label: "Contact form" },
  { key: "finalCta", label: "Final call-to-action" },
  { key: "footer", label: "Footer" },
];

export const WEBSITE_TYPES: Array<Option & { sections: SectionKey[] }> = [
  {
    value: "business",
    label: "Business / Services",
    sections: ["hero", "services", "process", "testimonials", "faq", "contact", "finalCta", "footer"],
  },
  {
    value: "agency",
    label: "Agency / Studio",
    sections: ["hero", "services", "work", "process", "testimonials", "pricing", "faq", "contact", "finalCta", "footer"],
  },
  {
    value: "restaurant",
    label: "Restaurant / Café / Bakery",
    sections: ["hero", "services", "aboutTeam", "testimonials", "faq", "contact", "finalCta", "footer"],
  },
  {
    value: "portfolio",
    label: "Portfolio / Personal site",
    sections: ["hero", "work", "services", "aboutTeam", "contact", "footer"],
  },
  {
    value: "saas",
    label: "App / Software product",
    sections: ["hero", "services", "process", "numbers", "testimonials", "pricing", "faq", "finalCta", "footer"],
  },
  {
    value: "store",
    label: "Shop / Products",
    sections: ["hero", "services", "testimonials", "faq", "contact", "finalCta", "footer"],
  },
  {
    value: "coach",
    label: "Coach / Consultant / Freelancer",
    sections: ["hero", "services", "process", "testimonials", "pricing", "faq", "contact", "footer"],
  },
  {
    value: "event",
    label: "Event / Launch / Waitlist",
    sections: ["hero", "process", "faq", "finalCta", "contact", "footer"],
  },
  {
    value: "other",
    label: "Something else",
    sections: ["hero", "services", "process", "faq", "contact", "finalCta", "footer"],
  },
];

export const MAIN_GOALS: Option[] = [
  { value: "DEFAULT", label: "Let AI choose" },
  { value: "Contact us", label: "Contact us" },
  { value: "Book a call", label: "Book a call" },
  { value: "Buy now", label: "Buy now" },
  { value: "Order or reserve a table", label: "Order / Reserve" },
  { value: "Sign up", label: "Sign up" },
  { value: "Join the waitlist", label: "Join the waitlist" },
  { value: "Hire me", label: "Hire me" },
  { value: "Download", label: "Download" },
];

export const TONES: Option[] = [
  { value: "DEFAULT", label: "Let AI choose" },
  { value: "friendly, warm, clear", label: "Friendly & warm" },
  { value: "professional, precise, trustworthy", label: "Professional & precise" },
  { value: "bold, confident, direct", label: "Bold & confident" },
  { value: "calm, minimal, thoughtful", label: "Calm & minimal" },
  { value: "playful, fun, energetic", label: "Playful & fun" },
  { value: "luxurious, refined, elegant", label: "Luxurious & elegant" },
];

export const MOODS: Option[] = [
  { value: "DEFAULT", label: "Let AI choose" },
  { value: "minimal-editorial", label: "Minimal & editorial" },
  { value: "dark-tech", label: "Dark & techy" },
  { value: "soft-scenic", label: "Soft & warm" },
  { value: "luxury-serif", label: "Luxury & elegant" },
  { value: "bold-brutalist", label: "Bold & loud" },
  { value: "playful-colorful", label: "Playful & colorful" },
];

export const COLOR_PRESETS: Array<Option & { primary?: string; accent?: string }> = [
  { value: "DEFAULT", label: "Let AI choose" },
  { value: "forest", label: "Forest green + lime", primary: "#0F3D2E", accent: "#D4FF5A" },
  { value: "ocean", label: "Ocean blue + sky", primary: "#0B3B5C", accent: "#38BDF8" },
  { value: "mono", label: "Black & white + orange", primary: "#0A0A0A", accent: "#FF5A1F" },
  { value: "terracotta", label: "Terracotta + sand", primary: "#7A2E1D", accent: "#F4B860" },
  { value: "rose", label: "Deep rose + blush", primary: "#4A1D2F", accent: "#F9A8D4" },
  { value: "gold", label: "Charcoal + gold", primary: "#1C1C1E", accent: "#C9A227" },
  { value: "custom", label: "My own colors…" },
];

export const FONT_STYLES: Array<Option & { heading?: string; body?: string }> = [
  { value: "DEFAULT", label: "Let AI choose" },
  { value: "editorial", label: "Elegant serif (Fraunces + Manrope)", heading: "Fraunces", body: "Manrope" },
  { value: "studio", label: "Modern & friendly (Bricolage + DM Sans)", heading: "Bricolage Grotesque", body: "DM Sans" },
  { value: "tech", label: "Techy (Space Grotesk + IBM Plex)", heading: "Space Grotesk", body: "IBM Plex Sans" },
  { value: "luxury", label: "Luxury (Cormorant + Jost)", heading: "Cormorant Garamond", body: "Jost" },
];

export const THEMES: Option[] = [
  { value: "DEFAULT", label: "Let AI choose" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "both with toggle", label: "Both (with a switch)" },
];

export const CORNERS: Option[] = [
  { value: "DEFAULT", label: "Let AI choose" },
  { value: "sharp", label: "Sharp" },
  { value: "slightly rounded", label: "Slightly rounded" },
  { value: "very rounded", label: "Very rounded" },
];

export const MOTION_LEVELS: Option[] = [
  { value: "subtle (recommended)", label: "Subtle (recommended)" },
  { value: "none", label: "No animation" },
  { value: "expressive", label: "Lively" },
];

export const FORM_OPTIONS: Option[] = [
  { value: "mailto fallback", label: "Open the visitor's email app" },
  { value: "Netlify Forms", label: "Netlify Forms (free with Netlify)" },
  { value: "Formspree", label: "Formspree" },
];

export const LANGUAGES: Option[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "ar", label: "Arabic" },
  { value: "tr", label: "Turkish" },
  { value: "hi", label: "Hindi" },
];

export interface PromptBuilderData {
  // 1. Basics
  businessName: string;
  whatYouDo: string;
  websiteType: string;
  mainGoal: string;
  // 2. Look & feel
  mood: string;
  colorPreset: string;
  primaryColor: string;
  accentColor: string;
  fontStyle: string;
  theme: string;
  tone: string;
  corners: string;
  motion: string;
  // 3. Content
  headline: string;
  details: string;
  sections: Record<SectionKey, boolean>;
  // 4. Contact
  email: string;
  phone: string;
  location: string;
  socialLinks: string;
  formHandling: string;
  language: string;
  // More options (optional)
  mainGoalLink: string;
  audience: string;
  websiteAddress: string;
  likes: string;
  dislikes: string;
}

export function sectionsForType(type: string): Record<SectionKey, boolean> {
  const preset = WEBSITE_TYPES.find((t) => t.value === type) ?? WEBSITE_TYPES[0];
  const result = {} as Record<SectionKey, boolean>;
  for (const { key } of SECTION_LABELS) result[key] = preset.sections.includes(key);
  return result;
}

export const EMPTY_PROMPT_DATA: PromptBuilderData = {
  businessName: "",
  whatYouDo: "",
  websiteType: "business",
  mainGoal: "DEFAULT",
  mood: "DEFAULT",
  colorPreset: "DEFAULT",
  primaryColor: "",
  accentColor: "",
  fontStyle: "DEFAULT",
  theme: "DEFAULT",
  tone: "DEFAULT",
  corners: "DEFAULT",
  motion: "subtle (recommended)",
  headline: "",
  details: "",
  sections: sectionsForType("business"),
  email: "",
  phone: "",
  location: "",
  socialLinks: "",
  formHandling: "mailto fallback",
  language: "en",
  mainGoalLink: "",
  audience: "",
  websiteAddress: "",
  likes: "",
  dislikes: "",
};

export const SAMPLE_PROMPT_DATA: PromptBuilderData = {
  ...EMPTY_PROMPT_DATA,
  businessName: "Northwind Studio",
  whatYouDo: "Brand identities and launch websites for climate startups, delivered in 4 weeks.",
  websiteType: "agency",
  mainGoal: "Book a call",
  mood: "minimal-editorial",
  colorPreset: "forest",
  fontStyle: "editorial",
  theme: "both with toggle",
  tone: "calm, minimal, thoughtful",
  corners: "slightly rounded",
  headline: "Climate brands, built to scale.",
  details:
    "Services: Brand identity, Launch websites, Design systems.\nPricing: Launch Sprint $8,500 (4 weeks), Brand + System $14,000 (6 weeks).\nFAQ: How fast? Most projects go live in 4 weeks. Do we own the files? Yes, 100%.",
  sections: sectionsForType("agency"),
  email: "hello@northwind.studio",
  location: "Lisbon, Portugal",
  socialLinks: "https://linkedin.com/company/northwind",
  formHandling: "Netlify Forms",
};

function valOr(value: string | undefined, fallback = "DEFAULT"): string {
  const cleaned = (value ?? "").trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function check(flag: boolean): string {
  return flag ? "[x]" : "[ ]";
}

function labelOf(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function buildIndividualFiles(d: PromptBuilderData): Record<string, string> {
  const typeLabel = labelOf(WEBSITE_TYPES, d.websiteType);
  const goal = d.mainGoal && d.mainGoal !== "DEFAULT" ? d.mainGoal : "DEFAULT";

  let primary = "DEFAULT";
  let accent = "DEFAULT";
  if (d.colorPreset === "custom") {
    primary = valOr(d.primaryColor);
    accent = valOr(d.accentColor);
  } else {
    const preset = COLOR_PRESETS.find((c) => c.value === d.colorPreset);
    if (preset?.primary) {
      primary = preset.primary;
      accent = preset.accent ?? "DEFAULT";
    }
  }
  const font = FONT_STYLES.find((f) => f.value === d.fontStyle);
  const s = d.sections;
  const year = new Date().getFullYear();

  const schema =
    d.websiteType === "portfolio" || d.websiteType === "coach"
      ? "Person"
      : d.websiteType === "saas"
      ? "Product"
      : (d.websiteType === "restaurant" || d.websiteType === "store" || d.websiteType === "business") &&
        d.location.trim()
      ? "LocalBusiness"
      : "Organization";

  const brandTxt = `BRAND

Business / person name: ${valOr(d.businessName)}
Website type: ${typeLabel}
One-line tagline (max 8 words): DEFAULT
What you do in 2 sentences: ${valOr(d.whatYouDo)}
Who it is for (ideal customer): ${valOr(d.audience)}
Main action visitors should take: ${goal} -> link: ${valOr(d.mainGoalLink, "#contact")}
Secondary action: DEFAULT -> link: DEFAULT
Tone of voice, 3 words: ${d.tone || "DEFAULT"}
Words to avoid: NONE
Theme: ${d.theme || "DEFAULT"}
Mood: ${d.mood || "DEFAULT"}
Brand colors (hex if known): primary ${primary} | accent ${accent} | background DEFAULT | text DEFAULT
Fonts (if any): headings ${font?.heading ?? "DEFAULT"} | body ${font?.body ?? "DEFAULT"}
Logo file in assets: NONE (create a clean typographic wordmark)
Logo for dark backgrounds: NONE
Corner style: ${d.corners || "DEFAULT"}`;

  const contentTxt = `CONTENT (DEFAULT = AI drafts it)

Hero
Eyebrow label: DEFAULT
Headline (3-8 words): ${valOr(d.headline)}
Sub-headline (1-2 sentences): DEFAULT
Primary button text: ${goal}
Secondary button text: DEFAULT
Trust line: DEFAULT

OWNER NOTES — real facts to use exactly (services, products, menu, prices, FAQs, hours, team). Never invent numbers, client logos or testimonials:
${valOr(d.details, "NONE — draft tasteful, specific copy for every section and mark it <!-- AI-WRITTEN: review -->")}

Logos / clients: NONE unless listed in the owner notes
Services / Features (3-8): DEFAULT (use the owner notes if they list any)
Key numbers (only real ones): NONE unless listed in the owner notes
Process (3-5 steps): DEFAULT
Work / Case studies: ${s.work ? "DEFAULT (clearly labelled placeholders unless listed in the owner notes)" : "NONE"}
Testimonials (real only): NONE — use a clearly labelled "Add a real testimonial here" placeholder
Pricing (optional): ${s.pricing ? "Use the owner notes if they include prices, otherwise DEFAULT" : "NONE"}
FAQ (4-8): DEFAULT (use the owner notes if they include questions)
About / Team (optional): ${s.aboutTeam ? "DEFAULT" : "NONE"}
Blog / News (optional): ${s.blog ? "DEFAULT" : "NONE"}
Final call-to-action headline: DEFAULT
Footer note: © ${year} ${valOr(d.businessName, "DEFAULT")}`;

  const pagesTxt = `SECTIONS (single-page site)

Sections to include: ${check(s.hero)} Hero ${check(s.logos)} Logos ${check(s.services)} Services ${check(s.work)} Work ${check(s.process)} Process ${check(s.numbers)} Numbers ${check(s.testimonials)} Testimonials ${check(s.pricing)} Pricing ${check(s.faq)} FAQ ${check(s.aboutTeam)} About/Team ${check(s.blog)} Blog ${check(s.contact)} Contact ${check(s.finalCta)} Final CTA ${check(s.footer)} Footer
Section order: DEFAULT
Navigation links (max 5): DEFAULT
Pop-up panels needed (case studies, legal): Privacy, Terms${s.work ? ", case study details" : ""}`;

  const assetsTxt = `ASSETS (files placed in the "assets" folder next to index.html)

NONE — build tasteful inline SVG / CSS visuals instead. Never output broken image links.
Video (optional, under 8 MB): NONE
Favicon: DEFAULT = generate an inline SVG favicon
Social share image 1200x630: DEFAULT
Embed images inside the file as base64? NO (default)`;

  const contactSeoTxt = `CONTACT, SOCIAL & SEO

Email: ${valOr(d.email, "NONE (use a clearly labelled placeholder)")}
Phone: ${valOr(d.phone, "NONE")}
Address: ${valOr(d.location, "NONE")}
Booking link: ${d.mainGoal === "Book a call" && d.mainGoalLink.trim() ? d.mainGoalLink.trim() : "NONE"}
Form handling: ${d.formHandling || "mailto fallback"}
Social links: ${valOr(d.socialLinks, "NONE")}
Final website address: ${valOr(d.websiteAddress)}
Main search keyword: DEFAULT
SEO title (max 60 chars): DEFAULT
SEO description (max 155 chars): DEFAULT
Schema type: ${schema}
Language: ${d.language || "en"}
Analytics: none`;

  const referencesTxt = `INSPIRATION (optional but powerful)

Sites or Framer templates I like and WHAT I like: ${valOr(d.likes)}
Things I dislike: ${valOr(d.dislikes)}`;

  const none = d.motion === "none";
  const lively = d.motion === "expressive";
  const motionTxt = `MOTION

Amount: ${d.motion || "subtle (recommended)"}
Allow: ${check(!none)} scroll reveals ${check(!none)} hover effects ${check(lively && s.logos)} marquee [ ] custom cursor ${check(!none)} smooth scroll ${check(lively)} parallax ${check(lively)} kinetic hero headline
Dark/light toggle: ${d.theme === "both with toggle" ? "yes" : "no"}`;

  return {
    "brand.txt": brandTxt,
    "content.txt": contentTxt,
    "pages.txt": pagesTxt,
    "assets.txt": assetsTxt,
    "contact-seo.txt": contactSeoTxt,
    "references.txt": referencesTxt,
    "motion.txt": motionTxt,
  };
}

export function buildFilledFilesText(data: PromptBuilderData): string {
  return Object.entries(buildIndividualFiles(data))
    .map(([name, body]) => `===== FILE: ${name} =====\n\n${body}`)
    .join("\n\n");
}

export function buildFullMasterPrompt(data: PromptBuilderData): string {
  return `${MASTER_PROMPT_BODY}\n\n${buildFilledFilesText(data)}\n`;
}

/** How many of the main questions were answered (purely informational). */
export function getCompletionStats(d: PromptBuilderData): { answered: number; total: number } {
  const checks = [
    d.businessName.trim(),
    d.whatYouDo.trim(),
    d.mainGoal !== "DEFAULT",
    d.mood !== "DEFAULT",
    d.colorPreset !== "DEFAULT",
    d.fontStyle !== "DEFAULT",
    d.theme !== "DEFAULT",
    d.tone !== "DEFAULT",
    d.headline.trim(),
    d.details.trim(),
    d.email.trim(),
  ];
  return { answered: checks.filter(Boolean).length, total: checks.length };
}

export async function exportPromptBriefAsZip(data: PromptBuilderData): Promise<Blob> {
  const zip = new JSZip();
  zip.file("MASTER-PROMPT.txt", buildFullMasterPrompt(data));
  for (const [name, content] of Object.entries(buildIndividualFiles(data))) {
    zip.file(name, content);
  }
  zip.file(
    "README.txt",
    `VYVO Website Prompt

HOW TO USE:
1. Open ChatGPT, Claude, Gemini, or Cursor.
2. Paste everything from MASTER-PROMPT.txt (it already includes your 7 filled files).
3. Copy the index.html code the AI gives you.
4. Paste it into VYVO and press RUN MY WEBSITE.
`
  );
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
