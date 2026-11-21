import JSZip from "jszip";

export interface ServiceItem {
  title: string;
  description: string;
}

export interface WorkItem {
  title: string;
  client: string;
  year: string;
  result: string;
  image: string;
}

export interface TestimonialItem {
  quote: string;
  name: string;
  roleCompany: string;
  photo: string;
}

export interface PricingItem {
  plan: string;
  price: string;
  billing: string;
  features: string;
  button: string;
  highlight: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AssetItem {
  fileName: string;
  description: string;
  whereToUse: string;
  altText: string;
}

export interface PromptBuilderData {
  // 1. brand.txt
  brand: {
    businessName: string;
    tagline: string;
    whatYouDo: string;
    idealCustomer: string;
    mainAction: string;
    mainActionLink: string;
    secondaryAction: string;
    secondaryActionLink: string;
    toneOfVoice: string;
    wordsToAvoid: string;
    theme: "DEFAULT" | "light" | "dark" | "both with toggle";
    mood:
      | "DEFAULT"
      | "minimal-editorial"
      | "bold-brutalist"
      | "soft-scenic"
      | "dark-tech"
      | "luxury-serif"
      | "playful-colorful";
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    headingFont: string;
    bodyFont: string;
    logoFile: string;
    logoDarkFile: string;
    cornerStyle: "DEFAULT" | "sharp" | "slightly rounded" | "very rounded";
  };

  // 2. content.txt
  content: {
    eyebrow: string;
    headline: string;
    subHeadline: string;
    primaryButtonText: string;
    secondaryButtonText: string;
    trustLine: string;
    clientLogos: string;
    services: ServiceItem[];
    keyNumbers: string;
    processSteps: string;
    workItems: WorkItem[];
    testimonials: TestimonialItem[];
    pricingPlans: PricingItem[];
    yearlyDiscount: string;
    faqs: FaqItem[];
    aboutTeam: string;
    blogNews: string;
    finalCtaHeadline: string;
    footerNote: string;
  };

  // 3. pages.txt
  pages: {
    sections: {
      hero: boolean;
      logos: boolean;
      services: boolean;
      work: boolean;
      process: boolean;
      numbers: boolean;
      testimonials: boolean;
      pricing: boolean;
      faq: boolean;
      aboutTeam: boolean;
      blog: boolean;
      contact: boolean;
      finalCta: boolean;
      footer: boolean;
    };
    sectionOrder: string;
    navLinks: string;
    popupPanels: string;
  };

  // 4. assets.txt
  assets: {
    items: AssetItem[];
    video: string;
    favicon: string;
    socialShareImage: string;
    embedBase64: "NO (default)" | "YES only for tiny logos and icons";
  };

  // 5. contact-seo.txt
  contactSeo: {
    email: string;
    phone: string;
    address: string;
    bookingLink: string;
    formHandling: string;
    socialLinks: string;
    websiteAddress: string;
    mainKeyword: string;
    seoTitle: string;
    seoDescription: string;
    schemaType: "DEFAULT" | "Organization" | "LocalBusiness" | "Person" | "Product";
    language: string;
    analytics: string;
  };

  // 6. references.txt
  references: {
    likes: string;
    dislikes: string;
  };

  // 7. motion.txt
  motion: {
    amount: "none" | "subtle (recommended)" | "expressive";
    allow: {
      scrollReveals: boolean;
      hoverEffects: boolean;
      marquee: boolean;
      customCursor: boolean;
      smoothScroll: boolean;
      parallax: boolean;
      kineticHero: boolean;
    };
    darkLightToggle: "yes" | "no";
  };
}

export const EMPTY_PROMPT_DATA: PromptBuilderData = {
  brand: {
    businessName: "",
    tagline: "",
    whatYouDo: "",
    idealCustomer: "",
    mainAction: "",
    mainActionLink: "",
    secondaryAction: "",
    secondaryActionLink: "",
    toneOfVoice: "",
    wordsToAvoid: "",
    theme: "DEFAULT",
    mood: "DEFAULT",
    primaryColor: "",
    accentColor: "",
    backgroundColor: "",
    textColor: "",
    headingFont: "",
    bodyFont: "",
    logoFile: "",
    logoDarkFile: "",
    cornerStyle: "DEFAULT",
  },
  content: {
    eyebrow: "",
    headline: "",
    subHeadline: "",
    primaryButtonText: "",
    secondaryButtonText: "",
    trustLine: "",
    clientLogos: "",
    services: [{ title: "", description: "" }],
    keyNumbers: "",
    processSteps: "",
    workItems: [],
    testimonials: [],
    pricingPlans: [],
    yearlyDiscount: "",
    faqs: [],
    aboutTeam: "",
    blogNews: "",
    finalCtaHeadline: "",
    footerNote: "",
  },
  pages: {
    sections: {
      hero: true,
      logos: true,
      services: true,
      work: false,
      process: true,
      numbers: false,
      testimonials: true,
      pricing: true,
      faq: true,
      aboutTeam: false,
      blog: false,
      contact: true,
      finalCta: true,
      footer: true,
    },
    sectionOrder: "",
    navLinks: "",
    popupPanels: "",
  },
  assets: {
    items: [],
    video: "",
    favicon: "",
    socialShareImage: "",
    embedBase64: "NO (default)",
  },
  contactSeo: {
    email: "",
    phone: "",
    address: "",
    bookingLink: "",
    formHandling: "mailto fallback",
    socialLinks: "",
    websiteAddress: "",
    mainKeyword: "",
    seoTitle: "",
    seoDescription: "",
    schemaType: "DEFAULT",
    language: "en",
    analytics: "none",
  },
  references: {
    likes: "",
    dislikes: "",
  },
  motion: {
    amount: "subtle (recommended)",
    allow: {
      scrollReveals: true,
      hoverEffects: true,
      marquee: false,
      customCursor: false,
      smoothScroll: false,
      parallax: false,
      kineticHero: false,
    },
    darkLightToggle: "yes",
  },
};

export const SAMPLE_PROMPT_DATA: PromptBuilderData = {
  brand: {
    businessName: "Northwind Studio",
    tagline: "Brand systems for climate startups.",
    whatYouDo:
      "We design sharp brand identities, websites, and product interfaces for ambitious climate-tech companies. Every sprint takes founders from early deck to investor-ready launch in four weeks.",
    idealCustomer: "Seed to Series B climate and clean-energy founders",
    mainAction: "Book a call",
    mainActionLink: "#contact",
    secondaryAction: "See our work",
    secondaryActionLink: "#work",
    toneOfVoice: "calm, precise, optimistic",
    wordsToAvoid: "synergy, cutting-edge, revolutionary",
    theme: "both with toggle",
    mood: "minimal-editorial",
    primaryColor: "#0F3D2E",
    accentColor: "#D4FF5A",
    backgroundColor: "",
    textColor: "",
    headingFont: "Fraunces",
    bodyFont: "Manrope",
    logoFile: "logo.svg",
    logoDarkFile: "logo-white.svg",
    cornerStyle: "slightly rounded",
  },
  content: {
    eyebrow: "Brand & Web Studio, Est. 2019",
    headline: "Climate brands, built to scale.",
    subHeadline:
      "We partner with clean-energy and carbon-removal founders to build clear identities and high-converting websites in four focused weeks.",
    primaryButtonText: "Book a Discovery Call",
    secondaryButtonText: "View Selected Work",
    trustLine: "Trusted by 40+ climate startups across Europe and North America",
    clientLogos: "NONE",
    services: [
      {
        title: "Brand Identity",
        description: "Logo, typography, and color systems built to hold up from pitch decks to hardware.",
      },
      {
        title: "Launch Websites",
        description: "Fast, editorial marketing sites engineered to turn technical stories into clear conviction.",
      },
      {
        title: "Design Systems",
        description: "Reusable component libraries that keep your product and marketing teams moving fast.",
      },
    ],
    keyNumbers: "48 launches | 4 weeks average | $180M+ raised by clients",
    processSteps:
      "1. Discover — 1-week positioning workshop and narrative alignment. 2. Design — visual direction, typography, and core pages. 3. Build & Launch — responsive, fast site handed off ready to publish.",
    workItems: [
      {
        title: "GridScale Energy",
        client: "GridScale",
        year: "2026",
        result: "3.2x increase in enterprise demo requests after relaunch",
        image: "DEFAULT",
      },
    ],
    testimonials: [],
    pricingPlans: [
      {
        plan: "Launch Sprint",
        price: "$8,500",
        billing: "one-time (4 weeks)",
        features: "Visual identity refresh, Single-page launch site, Copy editing, SEO & analytics setup",
        button: "Book Sprint",
        highlight: true,
      },
      {
        plan: "Brand + System",
        price: "$14,000",
        billing: "one-time (6 weeks)",
        features: "Full brand guidelines, Multi-section website, Custom UI mockups, Pitch deck template, Launch support",
        button: "Start Conversation",
        highlight: false,
      },
    ],
    yearlyDiscount: "DEFAULT",
    faqs: [
      {
        question: "How fast can we launch?",
        answer: "Most Launch Sprints go from kickoff to live website in exactly four weeks.",
      },
      {
        question: "Do we own everything you design?",
        answer: "Yes — 100% of design files, brand assets, and website code transfer to your team on launch day.",
      },
    ],
    aboutTeam:
      "Founded in Lisbon by two former product designers, Northwind Studio exists to give serious climate technology the visual clarity it deserves.",
    blogNews: "",
    finalCtaHeadline: "Ready to launch something good?",
    footerNote: "Made in Lisbon. © 2026 Northwind Studio",
  },
  pages: {
    sections: {
      hero: true,
      logos: false,
      services: true,
      work: true,
      process: true,
      numbers: true,
      testimonials: false,
      pricing: true,
      faq: true,
      aboutTeam: true,
      blog: false,
      contact: true,
      finalCta: true,
      footer: true,
    },
    sectionOrder: "",
    navLinks: "Work, Services, Pricing, About, Contact",
    popupPanels: "Privacy, Terms, case study details",
  },
  assets: {
    items: [],
    video: "",
    favicon: "",
    socialShareImage: "",
    embedBase64: "NO (default)",
  },
  contactSeo: {
    email: "hello@northwind.studio",
    phone: "",
    address: "Lisbon, Portugal",
    bookingLink: "https://cal.com/northwind",
    formHandling: "Netlify Forms",
    socialLinks: "https://linkedin.com/company/northwind, https://x.com/northwind",
    websiteAddress: "https://northwind.studio",
    mainKeyword: "climate startup brand design studio",
    seoTitle: "",
    seoDescription: "",
    schemaType: "Organization",
    language: "en",
    analytics: "none",
  },
  references: {
    likes: "Editorial clarity, generous whitespace, numbered section labels, bold oversized footer wordmark",
    dislikes: "Purple gradients, generic 3-column icon cards, bouncy animations",
  },
  motion: {
    amount: "subtle (recommended)",
    allow: {
      scrollReveals: true,
      hoverEffects: true,
      marquee: false,
      customCursor: false,
      smoothScroll: true,
      parallax: false,
      kineticHero: false,
    },
    darkLightToggle: "yes",
  },
};

const MASTER_PROMPT_BODY = `=====================================================================
MASTER PROMPT — FRAMER-LEVEL WEBSITE GENERATOR — SINGLE FILE EDITION (v2.0)
Output = ONE file: index.html (HTML + CSS + JavaScript all inside it)
Responsive on PC, tablet and mobile
=====================================================================

PART 0 — YOUR ROLE AND GOAL

You are three experts in one: (1) a senior UI/UX and brand designer whose taste matches the best Framer Marketplace and Awwwards studios, (2) a senior front-end engineer who writes clean, fast, accessible, standards-based code, (3) a conversion copy-editor.

Your job: read the INPUT FILES the user pastes below this prompt and generate a COMPLETE, production-ready, premium, fully responsive website that looks and feels like a high-end Framer template and never like a generic AI page.

THE ONE-FILE RULE (most important technical rule)

The ENTIRE website must be ONE single file named index.html.
All CSS goes inside one <style> tag in <head>. All JavaScript goes inside one <script> tag at the end of <body>.
No separate .css or .js files, no build tools, no npm, no frameworks, no CDN JavaScript libraries. Vanilla HTML/CSS/JS only.
The only allowed external requests: Google Fonts (with preconnect + display=swap, plus a good system-font fallback so the page still looks right offline) and the user's own images from the "assets/" folder listed in assets.txt. If an image is missing, use inline SVG / CSS art instead. Never output broken image links.
Because it is one file, the site is ONE long page with sections (single-page site). Navigation links scroll smoothly to sections (#work, #pricing, #contact...). Anything that would be a separate page (a case study, a blog post, a legal page) becomes a modal / slide-over panel inside the same file, opened by a button or by URL hash (#/work/helio), closable with Esc, close button and browser Back, with focus trapped inside and returned afterwards.
The file must work by double-clicking it (file://) AND when uploaded to Netlify/Vercel/GitHub Pages.

Non-negotiable outcomes

Looks premium and specific to THIS brand, not template-like.
Perfect on every width from 360px to 1920px+ (phone, tablet, laptop, large desktop), in portrait and landscape.
Fast (Core Web Vitals "good"), accessible (WCAG 2.2 AA), SEO-ready.
Every section has real content (from the files or smart defaults). Never lorem ipsum, never "Your text here", never empty sections.

The user is NOT technical. Everything you tell them must be plain language, step by step, with no unexplained jargon.

=====================================================================
PART 1 — HOW TO PROCESS THE INPUT FILES

Step 1. Read all files. Build an internal Brand Brief: audience, offer, tone (3 adjectives), the ONE primary action visitors should take, visual mood.
Step 2. Gap-fill. For every empty / DEFAULT / missing field choose a smart default that fits the brief and list each in "DECISIONS I MADE" at the end. Rules:

- Missing colors: derive a palette from the logo colors or the mood.
- Missing fonts: pick a pairing from the Type Pairing Library (Part 3).
- Missing copy: write concise, specific copy in the brand's tone, marked in the HTML with <!-- AI-WRITTEN: review -->.
- Missing images: build tasteful CSS/SVG compositions (gradients, grain, shapes, UI mockups made of HTML). Never random stock-photo URLs.
- Missing testimonials / client logos / stats: NEVER invent fake people, companies or numbers. Use a clearly labelled placeholder block ("Add a real testimonial here") styled like the final design, or omit the section and say so in DECISIONS I MADE.

Step 3. Before the code, output a short PLAN (max 20 lines): aesthetic direction (1 sentence), palette, fonts, section order, hero concept.
Step 4. Inside the single <style> tag write the design tokens (CSS custom properties) FIRST, then base styles, components, sections, responsive rules. Every value used in sections must come from a token.
Step 5. Run the SELF-REVIEW CHECKLIST (Part 9) and fix problems before delivering.

=====================================================================
PART 2 — THE INPUT FILES
(All 7 completed input files are attached at the end of this prompt, right after PART 10.)

=====================================================================
PART 3 — AESTHETIC DIRECTION & ANTI-GENERIC RULES

Commit to ONE aesthetic direction from brand mood + references + audience. Adapt, never copy a specific template. Direction library:

- Minimal-editorial: off-white or near-black, serif display + neutral sans, huge type, hairline dividers, numbered sections.
- Monochrome studio: black/white, giant wordmark hero, project counts "(12)", big-type footer.
- Dark-tech/SaaS: deep neutral (not pure black everywhere), one vivid accent, bento tiles, faint grid lines, subtle glow.
- Soft-scenic: warm light neutrals or sky tones, pill buttons, calm copy.
- Bold-brutalist: oversized grotesk, hard borders, flat bright blocks, visible grid, but clear contrast and navigation.

BANNED unless the files explicitly ask:

- Inter, Roboto, Arial, Open Sans, Lato or system-ui as the headline font.
- Purple/indigo gradients on white; generic mesh gradients.
- Three identical icon cards in a row as the main feature section.
- Every container with the same big radius and soft shadow.
- Vague hero copy ("Build the future of work", "Unlock your potential").
- Emoji as icons; random stock photos; fake logos, stats, testimonials; bounce/elastic easing; animating everything.
- Centering all text. Mix left-aligned editorial layouts with occasional centered moments.

PREMIUM SIGNALS to include:

- Numbered eyebrow labels: "(01) Services", "002 / Process".
- Headlines of 3-8 words, ending with a period when it suits the tone.
- Display type big, letter-spacing -0.02em to -0.04em, line-height 0.95-1.1.
- Consistent generous vertical rhythm; one "rhythm-break" section (full-bleed color band, big statement, bento) every 3-4 sections.
- Real UI mockups built in HTML/CSS when the product is software.
- text-wrap: balance on headlines, text-wrap: pretty on paragraphs.
- A memorable footer (oversized wordmark or statement).
- Kinetic/animated headline ONLY in the hero, and only if motion.txt allows. 3D/WebGL is not used.

Type Pairing Library (free, Google Fonts):

- Editorial: Fraunces or Instrument Serif + Manrope or Geist
- Studio: Bricolage Grotesque + DM Sans
- Tech: Space Grotesk + IBM Plex Sans (+ IBM Plex Mono for labels)
- Luxury: Cormorant Garamond + Jost
Max 2 families (+1 mono), max 3 weights each, one single Google Fonts <link> request.

=====================================================================
PART 4 — DESIGN SYSTEM (CSS custom properties at the top of the <style> tag)

4.1 Grid: max width 1280px (--container: 80rem); text blocks max 65ch; page gutters clamp(1rem, 4vw, 2.5rem). 12 columns on desktop, 8 on tablet, 4 on phone using CSS Grid; Flexbox for rows. Use container queries (container-type: inline-size) on cards and bento tiles.
4.2 Spacing tokens (8-point): --space-1 .25rem; -2 .5rem; -3 .75rem; -4 1rem; -5 1.5rem; -6 2rem; -7 3rem; -8 4rem; -9 6rem; -10 8rem. Section padding: --section-y: clamp(4rem, 8vw, 8rem).
4.3 Fluid type (clamp with rem floors/ceilings so zoom works): --step--1: clamp(0.8rem, 0.78rem + 0.1vw, 0.875rem); --step-0: clamp(1rem, 0.96rem + 0.2vw, 1.125rem); --step-1: clamp(1.2rem, 1.1rem + 0.45vw, 1.5rem); --step-2: clamp(1.5rem, 1.3rem + 0.9vw, 2.1rem); --step-3: clamp(1.9rem, 1.5rem + 1.8vw, 3rem); --step-4: clamp(2.4rem, 1.7rem + 3.2vw, 4.5rem); --step-5: clamp(2.8rem, 1.6rem + 5.5vw, 7rem); Body line-height 1.55-1.65, headings 0.95-1.15. Body never below 16px on phones.
4.4 Color tokens (semantic, light AND dark): --bg, --bg-elevated, --surface, --surface-2, --border, --border-strong, --text, --text-muted, --accent, --accent-contrast, --focus, --success, --danger. One accent used sparingly; neutrals carry 90%. Contrast: text 4.5:1 (large text 3:1), controls/icons 3:1. Dark mode uses off-black (#0B0B0C-#121214) and slightly softened white text (#EDEDED). Theme via [data-theme="dark"] on <html>; default from prefers-color-scheme; saved in localStorage (wrapped in try/catch); a tiny inline script in <head> sets the theme before paint (no flash).
4.5 Radius tokens: sm 6px, md 12px, lg 20px, pill 999px. One dominant radius per direction (sharp directions 0-4px).
4.6 Shadows: prefer borders + subtle layered shadows; in dark themes use inner borders/highlights.
4.7 Gradients/texture: at most one signature gradient from the brand palette; optional grain overlay (opacity <= 0.06). Glass blur only on the sticky nav or small chips, with a solid fallback.
4.8 Icons: one inline-SVG style (1.5px stroke, 20-24px, currentColor). Reuse via <symbol>/<use> to keep the file small.
4.9 Buttons: primary, secondary, ghost-with-arrow. Min height 44px. States: hover, active (scale .98), focus-visible (2px outline, offset 3px), disabled.
4.10 Cards: surface background, 1px border, radius token, padding clamp(1.25rem, 3vw, 2rem); whole card clickable when linked; hover raises border and zooms image 1.03.
4.11 Forms: visible labels above fields, 48px height, font >= 16px (stops iPhone zoom), error text tied with aria-describedby, success message.

=====================================================================
PART 5 — SECTION BLUEPRINTS (desktop AND mobile specs)

Every section: numbered eyebrow, headline, optional intro, content, and a next action where natural.

NAVBAR — Desktop: sticky, 64-72px tall, logo left, 3-5 links, primary CTA right; transparent over the hero, then blurred/solid with a hairline border after 24px scroll. Mobile (below 1024px): logo + 44x44 menu button (aria-label "Open menu", aria-expanded). Opens a full-screen overlay with big stacked links (step-3), CTA, email and socials at the bottom; links stagger in 40ms; body scroll locked; Esc and close button work; focus trapped and returned. First focusable element on the page is a "Skip to content" link. Active section highlighted while scrolling (IntersectionObserver).

HERO (pick one variant) H1 Split: text left (7 cols), visual right (5 cols). Mobile: text first, visual below. H2 Giant typographic: statement/brand at step-5 across the full width, small manifesto + service list below. Mobile: scales via clamp; list stacks. H3 Centered product: eyebrow pill, headline, subline, 2 buttons, trust line, large framed product/bento preview overlapping the next section. Mobile: crop to a focal area, never shrink to illegibility. H4 Media: full-bleed image/video with overlay (4.5:1 text contrast). Mobile: poster image only. Rules: min-height clamp(560px, 90svh, 960px) (svh, not vh); one H1 per page; hero image eager with fetchpriority="high".

LOGO STRIP — "Trusted by" + 5-10 monochrome logos (opacity .6, hover 1). Slow CSS marquee 40-60s that pauses on hover, or a 2-3 column grid on mobile. Duplicated marquee items get aria-hidden="true".

BENTO FEATURES — 12-column grid of mixed tiles (one 8x2 hero tile, 4x1 and 4x2 tiles, one stat tile, one interactive tile). Tablet: 2 columns. Mobile: 1 column, most important first, aspect-ratio on visual tiles (no layout shift). Each tile is an <article> with a heading.

SERVICES LIST (alternative) — numbered rows 001-00n: number, title, description, tags, arrow. Accordion expands to detail. Mobile: full-width rows with 44px+ tap height.

PROCESS — 3-5 steps. Desktop: horizontal cards with a connecting line, or sticky title left + steps right. Mobile: vertical timeline.

WORK / CASE STUDIES — Desktop: asymmetric 2-column grid. Card: image (4:3 or 16:10), title, client, year, 1-line result. Mobile: single column, no hover-only info. Detail = modal panel (hero image, facts row, challenge/solution/outcome, gallery, next project).

NUMBERS — 3-4 big numbers with labels, count up once when visible. Mobile: 2x2 grid.

TESTIMONIALS — T1 big single quote with arrows; T2 two-row ticker moving in opposite directions (pauses on hover; static grid when reduced motion); T3 wall. Mobile: horizontal swipe with scroll-snap and a visible peek of the next card.

PRICING — 2-4 plan cards, highlighted plan with "Most popular" badge; monthly/yearly toggle as <button role="switch"> with sliding thumb and savings badge; feature list with check icons; "Need more? Talk to us." Desktop: row of equal-height cards. Tablet: 2 columns. Mobile: stacked, highlighted plan FIRST.

FAQ — Desktop: title + contact prompt left (sticky), accordion right. <details>/<summary> with smooth height animation, plus icon rotates 45deg. Mobile: single column. Add FAQPage JSON-LD.

CTA BAND — full-width rhythm break: big headline (step-4), one sentence, primary button. Mobile: left aligned, full-width button.

BLOG / NEWS (optional) — featured post large + card grid; posts open in a modal reading panel (max 68ch, line-height 1.7).

CONTACT — Desktop: 2 columns: details (mailto:, tel:, address, socials, response time) + form (name, email, message, optional budget). Form per contact-seo.txt (Netlify: data-netlify="true" + hidden form-name + honeypot; Formspree; or mailto fallback). Mobile: details first, then form, full-width button.

ABOUT / TEAM — story paragraph large, 3-4 values, team grid (photo 4:5, name, role).

FOOTER — CTA line + button; 3-4 link columns (sections, social, contact, legal modals); oversized brand wordmark spanning the width; © line; "Back to top" button. Mobile: columns become a 2-column grid; wordmark scales by clamp.

=====================================================================
PART 6 — MOTION & INTERACTION

Motion guides attention and never blocks reading. Respect motion.txt (default: subtle). Animate only transform and opacity. Easings: --ease-out: cubic-bezier(0.22, 1, 0.36, 1); --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1). Never bounce/elastic. Durations: hover/press 150-200ms; accordion/toggle/menu 250-350ms; entrances 500-700ms.

- Scroll reveal: fade + translateY(16-24px) once, via IntersectionObserver (~15% visible). Add a "js" class to <html> BEFORE hiding anything, so content stays visible if JavaScript fails.
- Stagger children 60-80ms (max 6 per group).
- Hero load sequence: eyebrow, headline (by line/word, 40ms stagger), subline, buttons, visual; total under 1.2s.
- Hover: buttons lift 1-2px or swap fill; card image scales 1.03 over 400ms; link underline grows from the left.
- Optional (only if allowed): magnetic buttons (fine pointer only, max 6px), marquee (pure CSS, pause on hover), parallax (max 8-12%, decorative images, off below 810px), custom cursor (hover:hover and pointer:fine only), smooth scroll (CSS scroll-behavior).
- Counters count up once in 1.2s.
- REDUCED MOTION (mandatory): inside @media (prefers-reduced-motion: reduce) turn off parallax, marquee movement, magnetic effect, smooth scroll and transforms; keep opacity fades of 200ms or less.

=====================================================================
PART 7 — RESPONSIVE RULES (PC + MOBILE, both must be excellent)

Write CSS mobile-first (base styles = phone), then enhance with min-width queries: 480px (large phones), 768px (tablet portrait), 1024px (tablet landscape / small laptop), 1280px (desktop), 1536px (wide).

- Layout changes at breakpoints; type and spacing scale smoothly with clamp() in between.
- Mobile nav below 1024px; the nav never wraps.
- Tap targets at least 44x44px with 8px+ gaps.
- NO horizontal scrolling at any width: min-width:0 on grid/flex children; overflow-wrap:anywhere for long words; no fixed widths; set html { overflow-x: clip } only as a last safety net, never to hide real bugs.
- Use svh/dvh for full-height sections; respect env(safe-area-inset-*) for sticky bars on iPhone.
- Images: width/height or aspect-ratio always set; srcset/sizes if several sizes exist; loading="lazy" except the hero image; decoding="async"; object-fit: cover.
- Hover-only info must also be visible or tappable on touch devices (use @media (hover: hover) for hover effects).
- Total sticky height on phone <= 72px.
- The longest headline word must never overflow at 360px.
- Test widths: 360, 390, 768, 1024, 1280, 1440, 1920, landscape phone 844x390, and 200% zoom.

=====================================================================
PART 8 — TECHNICAL REQUIREMENTS (single file)

Structure of index.html (in this order):

1. <!doctype html>, <html lang> with the language from contact-seo.txt, meta charset + viewport (width=device-width, initial-scale=1, viewport-fit=cover), theme-color.
2. Tiny inline script that sets the theme + the "js" class.
3. <title>, meta description, canonical, Open Graph and Twitter tags, inline SVG favicon (data URI), JSON-LD blocks (Organization/LocalBusiness/Person, WebSite, FAQPage, Product/Offer if pricing).
4. Font preconnect + single Google Fonts link (display=swap).
5. ONE <style> tag: tokens, base, components, sections, responsive, reduced-motion, print basics. Each part has a plain-English comment header such as /* === 3. BUTTONS: change colors in section 1 === */.
6. <body>: skip link, header/nav, <main> with sections (each with an id), footer, modal containers.
7. ONE <script> tag at the end: theme toggle, nav (scroll state, mobile overlay, focus trap), reveal observer, counters, marquee duplication, accordion, pricing toggle, carousel, modals with hash routing, form handling, back-to-top. Plain ES2020, no libraries, no console errors.

Quality limits: file size target 150 KB or less (without user images); total JavaScript 25 KB or less; hero image 200 KB or less; other images 150 KB or less. Core Web Vitals targets: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1. Lighthouse (mobile): Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+.

Accessibility (WCAG 2.2 AA): landmarks (header, nav, main, footer), one H1, logical heading order, contrast ratios from 4.4, visible :focus-visible on every control, full keyboard support, aria-labels on icon-only buttons, meaningful alt text from assets.txt (decorative images alt=""), labelled forms with autocomplete attributes, no information by color alone, modals with role="dialog", aria-modal and focus management, respect prefers-reduced-motion and prefers-color-scheme.

Code quality: consistent BEM-like class names (.card, .card__title, .card--featured); no inline styles except CSS custom properties; clean indentation; helpful plain-English comments so a beginner can find where to change text, colors and fonts (all editable colors/fonts live in the :root token block at the very top of the style tag).

=====================================================================
PART 9 — SELF-REVIEW CHECKLIST (run before delivering, fix what fails)

Design
[ ] Aesthetic direction is distinct and fits the brand brief.
[ ] No banned pattern from Part 3.
[ ] All spacing/type/color values come from tokens.
[ ] Headlines balanced; no single-word orphans; nothing overflows at 360px.
[ ] Every section: eyebrow > headline > body > action.
[ ] Hover, active, focus and disabled states on every control.

Responsive (PC and mobile)
[ ] Checked at 360, 390, 768, 1024, 1280, 1440, 1920 and 200% zoom.
[ ] No horizontal scroll, no clipped or overlapping text.
[ ] Mobile menu opens/closes by tap, Esc and close button; focus returns.
[ ] Tap targets >= 44px; forms usable with the phone keyboard open.

Technical
[ ] ONE file only: index.html with inline CSS and JS; nothing else required to run it.
[ ] Opens correctly by double-click (file://) with no console errors.
[ ] Content visible if JavaScript is off (progressive enhancement).
[ ] Contrast passes in light AND dark.
[ ] Keyboard-only walk-through works; skip link works; modals trap focus.
[ ] Reduced-motion mode tested.
[ ] No dead "#" links; mailto: and tel: used correctly.
[ ] Meta, OG, JSON-LD, favicon present. Hero image eager, all other images lazy.

Content
[ ] No lorem ipsum, no invented testimonials, stats or logos.
[ ] Spelling and tone match brand.txt.

=====================================================================
PART 10 — OUTPUT INSTRUCTIONS

Deliver in this exact order:

1. PLAN (Part 1, Step 3).
2. THE FILE: one single code block headed "index.html", COMPLETE. Never abbreviate with "..." or "rest of code here". Write the code compactly (no needless repetition, reuse SVG symbols and CSS classes) so it fits in one answer. If you are cut off, stop at a clean line and say "Type CONTINUE" — then resume from the exact next line so the user can paste the pieces together into one file.
3. SIMPLE GUIDE for a non-technical person:
   a. Where to save index.html and the assets folder (same folder, side by side).
   b. How to preview on PC (double-click) and in phone mode (F12, then Ctrl+Shift+M; choose iPhone / iPad / desktop sizes) — or paste directly into VYVO to preview immediately.
   c. How to publish free with Netlify Drop (app.netlify.com/drop, drag the folder, claim the site within 1 hour); alternatives: Vercel, GitHub Pages; how to connect a custom domain.
   d. How to test on a real phone via the live link, and how to run Lighthouse (DevTools > Lighthouse > Mobile > Analyze).
   e. How to change text, colors (the :root block at the top), fonts and images later.
4. DECISIONS I MADE: every default chosen + which file/field to fill to override it.
5. QA REPORT: the Part 9 checklist with each item marked done + known limitations.

When the user later sends updated input files, regenerate index.html completely and list what changed.

=====================================================================
END OF MASTER PROMPT — INPUT FILES FOLLOW BELOW`;

function valOr(value: string | undefined, fallback = "DEFAULT"): string {
  const cleaned = (value ?? "").trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function check(flag: boolean): string {
  return flag ? "[x]" : "[ ]";
}

export function buildIndividualFiles(data: PromptBuilderData): Record<string, string> {
  const { brand, content, pages, assets, contactSeo, references, motion } = data;

  const brandTxt = `BRAND

Business / person name: ${valOr(brand.businessName)}
One-line tagline (max 8 words): ${valOr(brand.tagline)}
What you do in 2 sentences: ${valOr(brand.whatYouDo)}
Who it is for (ideal customer): ${valOr(brand.idealCustomer)}
Main action visitors should take: ${valOr(brand.mainAction)} -> link: ${valOr(brand.mainActionLink, "#contact")}
Secondary action: ${valOr(brand.secondaryAction)} -> link: ${valOr(brand.secondaryActionLink, "DEFAULT")}
Tone of voice, 3 words: ${valOr(brand.toneOfVoice)}
Words to avoid: ${valOr(brand.wordsToAvoid, "NONE")}
Theme: ${brand.theme}
Mood: ${brand.mood}
Brand colors (hex if known): primary ${valOr(brand.primaryColor)} | accent ${valOr(brand.accentColor)} | background ${valOr(brand.backgroundColor)} | text ${valOr(brand.textColor)}
Fonts (if any): headings ${valOr(brand.headingFont)} | body ${valOr(brand.bodyFont)}
Logo file in assets: ${valOr(brand.logoFile, "NONE")}
Logo for dark backgrounds: ${valOr(brand.logoDarkFile, "NONE")}
Corner style: ${brand.cornerStyle}`;

  const validServices = content.services.filter(
    (s) => s.title.trim() || s.description.trim()
  );
  const servicesBlock =
    validServices.length > 0
      ? validServices
          .map((s) => `- ${valOr(s.title)}: ${valOr(s.description)}`)
          .join("\n")
      : "DEFAULT";

  const validWork = content.workItems.filter((w) => w.title.trim() || w.client.trim());
  const workBlock =
    validWork.length > 0
      ? validWork
          .map(
            (w) =>
              `- ${valOr(w.title)} | ${valOr(w.client)} | ${valOr(w.year)} | ${valOr(w.result)} | ${valOr(w.image)}`
          )
          .join("\n")
      : pages.sections.work
      ? "DEFAULT"
      : "NONE";

  const validTestimonials = content.testimonials.filter((t) => t.quote.trim() || t.name.trim());
  const testimonialsBlock =
    validTestimonials.length > 0
      ? validTestimonials
          .map(
            (t) =>
              `- "${valOr(t.quote)}" | ${valOr(t.name)} | ${valOr(t.roleCompany)} | ${valOr(t.photo, "NONE")}`
          )
          .join("\n")
      : "NONE";

  const validPricing = content.pricingPlans.filter((p) => p.plan.trim() || p.price.trim());
  const pricingBlock =
    validPricing.length > 0
      ? validPricing
          .map(
            (p) =>
              `- ${valOr(p.plan)} | ${valOr(p.price)} | ${valOr(p.billing, "monthly")} | ${valOr(p.features)} | ${valOr(p.button, "Get Started")} | ${p.highlight ? "HIGHLIGHT" : "standard"}`
          )
          .join("\n")
      : pages.sections.pricing
      ? "DEFAULT"
      : "NONE";

  const validFaqs = content.faqs.filter((f) => f.question.trim() || f.answer.trim());
  const faqBlock =
    validFaqs.length > 0
      ? validFaqs.map((f) => `- ${valOr(f.question)} | ${valOr(f.answer)}`).join("\n")
      : pages.sections.faq
      ? "DEFAULT"
      : "NONE";

  const contentTxt = `CONTENT (DEFAULT = AI drafts it)

Hero
Eyebrow label: ${valOr(content.eyebrow)}
Headline (3-8 words): ${valOr(content.headline)}
Sub-headline (1-2 sentences): ${valOr(content.subHeadline)}
Primary button text: ${valOr(content.primaryButtonText)}
Secondary button text: ${valOr(content.secondaryButtonText)}
Trust line: ${valOr(content.trustLine)}

Logos / clients: ${valOr(content.clientLogos, "NONE")}
Services / Features:
${servicesBlock}
Key numbers (only real ones): ${valOr(content.keyNumbers, "NONE")}
Process (3-5 steps): ${valOr(content.processSteps)}
Work / Case studies:
${workBlock}
Testimonials (real only):
${testimonialsBlock}
Pricing (optional):
${pricingBlock}
Yearly discount: ${valOr(content.yearlyDiscount)}
FAQ:
${faqBlock}
About / Team (optional): ${valOr(content.aboutTeam, pages.sections.aboutTeam ? "DEFAULT" : "NONE")}
Blog / News (optional): ${valOr(content.blogNews, pages.sections.blog ? "DEFAULT" : "NONE")}
Final call-to-action headline: ${valOr(content.finalCtaHeadline)}
Footer note: ${valOr(content.footerNote)}`;

  const s = pages.sections;
  const pagesTxt = `SECTIONS (single-page site)

Sections to include: ${check(s.hero)} Hero ${check(s.logos)} Logos ${check(s.services)} Services ${check(s.work)} Work ${check(s.process)} Process ${check(s.numbers)} Numbers ${check(s.testimonials)} Testimonials ${check(s.pricing)} Pricing ${check(s.faq)} FAQ ${check(s.aboutTeam)} About/Team ${check(s.blog)} Blog ${check(s.contact)} Contact ${check(s.finalCta)} Final CTA ${check(s.footer)} Footer
Section order: ${valOr(pages.sectionOrder)}
Navigation links (max 5): ${valOr(pages.navLinks)}
Pop-up panels needed (case studies, legal): ${valOr(pages.popupPanels, "Privacy, Terms")}`;

  const validAssets = assets.items.filter((a) => a.fileName.trim());
  const assetsTable =
    validAssets.length > 0
      ? [
          "| file name | what it shows | where to use | alt text |",
          ...validAssets.map(
            (a) =>
              `| ${a.fileName.trim()} | ${valOr(a.description)} | ${valOr(a.whereToUse)} | ${valOr(a.altText)} |`
          ),
        ].join("\n")
      : "NONE (use tasteful inline SVG / CSS art — never broken image links)";

  const assetsTxt = `ASSETS (files placed in the "assets" folder next to index.html)

${assetsTable}
Video (optional, under 8 MB): ${valOr(assets.video, "NONE")}
Favicon: ${valOr(assets.favicon, "DEFAULT = generate an inline SVG favicon")}
Social share image 1200x630: ${valOr(assets.socialShareImage)}
Embed images inside the file as base64? ${assets.embedBase64}`;

  const contactSeoTxt = `CONTACT, SOCIAL & SEO

Email: ${valOr(contactSeo.email)}
Phone: ${valOr(contactSeo.phone, "NONE")}
Address: ${valOr(contactSeo.address, "NONE")}
Booking link: ${valOr(contactSeo.bookingLink, "NONE")}
Form handling: ${valOr(contactSeo.formHandling, "mailto fallback")}
Social links: ${valOr(contactSeo.socialLinks, "NONE")}
Final website address: ${valOr(contactSeo.websiteAddress)}
Main search keyword: ${valOr(contactSeo.mainKeyword)}
SEO title (max 60 chars): ${valOr(contactSeo.seoTitle)}
SEO description (max 155 chars): ${valOr(contactSeo.seoDescription)}
Schema type: ${contactSeo.schemaType}
Language: ${valOr(contactSeo.language, "en")}
Analytics: ${valOr(contactSeo.analytics, "none")}`;

  const referencesTxt = `INSPIRATION (optional but powerful)

Sites or Framer templates I like and WHAT I like: ${valOr(references.likes)}
Things I dislike: ${valOr(references.dislikes)}`;

  const m = motion.allow;
  const motionTxt = `MOTION

Amount: ${motion.amount}
Allow: ${check(m.scrollReveals)} scroll reveals ${check(m.hoverEffects)} hover effects ${check(m.marquee)} marquee ${check(m.customCursor)} custom cursor ${check(m.smoothScroll)} smooth scroll ${check(m.parallax)} parallax ${check(m.kineticHero)} kinetic hero headline
Dark/light toggle: ${motion.darkLightToggle}`;

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
  const files = buildIndividualFiles(data);
  return Object.entries(files)
    .map(([name, body]) => `===== FILE: ${name} =====\n\n${body}`)
    .join("\n\n");
}

export function buildFullMasterPrompt(data: PromptBuilderData): string {
  return `${MASTER_PROMPT_BODY}\n\n${buildFilledFilesText(data)}\n`;
}

export interface StepCompletion {
  stepId: string;
  filled: number;
  total: number;
}

export function getCompletionStats(data: PromptBuilderData): {
  steps: Record<string, { filled: number; total: number }>;
  totalFilled: number;
  totalQuestions: number;
} {
  const countNonEmpty = (vals: Array<string | boolean | undefined>) =>
    vals.filter((v) => (typeof v === "string" ? v.trim().length > 0 && v !== "DEFAULT" : Boolean(v))).length;

  const brandFilled = countNonEmpty([
    data.brand.businessName,
    data.brand.tagline,
    data.brand.whatYouDo,
    data.brand.idealCustomer,
    data.brand.mainAction,
    data.brand.toneOfVoice,
    data.brand.theme,
    data.brand.mood,
    data.brand.primaryColor,
  ]);

  const contentFilled = countNonEmpty([
    data.content.headline,
    data.content.subHeadline,
    data.content.primaryButtonText,
    data.content.services.some((s) => s.title.trim().length > 0),
    data.content.processSteps,
    data.content.faqs.some((f) => f.question.trim().length > 0),
    data.content.finalCtaHeadline,
    data.content.footerNote,
  ]);

  const pagesFilled = countNonEmpty([
    Object.values(data.pages.sections).some(Boolean),
    data.pages.navLinks,
    data.pages.popupPanels,
  ]);

  const assetsFilled = countNonEmpty([
    data.assets.items.some((a) => a.fileName.trim().length > 0),
    data.assets.video,
    data.assets.socialShareImage,
  ]);

  const contactFilled = countNonEmpty([
    data.contactSeo.email,
    data.contactSeo.socialLinks,
    data.contactSeo.websiteAddress,
    data.contactSeo.mainKeyword,
    data.contactSeo.formHandling,
  ]);

  const refFilled = countNonEmpty([data.references.likes, data.references.dislikes]);
  const motionFilled = countNonEmpty([data.motion.amount, data.motion.darkLightToggle]);

  const steps = {
    brand: { filled: brandFilled, total: 9 },
    content: { filled: contentFilled, total: 8 },
    pages: { filled: pagesFilled, total: 3 },
    assets: { filled: assetsFilled, total: 3 },
    contact: { filled: contactFilled, total: 5 },
    references: { filled: refFilled, total: 2 },
    motion: { filled: motionFilled, total: 2 },
  };

  const totalFilled = Object.values(steps).reduce((s, x) => s + x.filled, 0);
  const totalQuestions = Object.values(steps).reduce((s, x) => s + x.total, 0);
  return { steps, totalFilled, totalQuestions };
}

export async function exportPromptBriefAsZip(data: PromptBuilderData): Promise<Blob> {
  const zip = new JSZip();
  zip.file("MASTER-PROMPT.txt", buildFullMasterPrompt(data));
  const files = buildIndividualFiles(data);
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  const readme = `VYVO Website Prompt Brief

HOW TO USE:
1. Open ChatGPT, Claude, Gemini, or Cursor.
2. Paste the contents of MASTER-PROMPT.txt (it already includes all 7 filled files!).
3. Copy the single index.html code block your AI generates.
4. Paste it into VYVO and press RUN MY WEBSITE to see it live immediately.

Want to make changes later? Edit any of the 7 .txt files and send them back to your AI.
`;
  zip.file("README.txt", readme);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
