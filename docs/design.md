# St. Angella Nursery & Primary School — Design Specification

**Status:** Approved visual direction; implementation specification v1.0  
**Concept:** Modern Academic Heritage  
**Reference:** Second approved homepage mockup (`st-angella-homepage-reference.png`)  
**Brand source:** User-provided school crest and uniform photograph.

## 1. Experience goals

Create a polished, welcoming, credible school website that feels contemporary without losing its academic heritage. Prioritize admissions discovery, accessible school information, authentic imagery, excellent mobile usability, and easy school-managed publishing. The reference mockup is visual guidance, **not a verified source for news, dates, metrics, school facilities, contact details, or claims**.

## 2. Visual identity

| Token | Hex | Role |
| --- | --- | --- |
| `--brand-900` | `#103E2F` | Dark sections, navigation, footer |
| `--brand-800` | `#174D38` | Primary actions, emphasis |
| `--brand-logo` | `#00A651` | School crest green; restrained accent |
| `--accent-gold` | `#C8A64B` | Accent rules, highlighted words, select CTAs |
| `--background` | `#FFFFFF` | Main surface |
| `--background-warm` | `#F7F5ED` | Alternating sections |
| `--background-soft` | `#EDF3ED` | Quiet supporting panels |
| `--foreground` | `#202923` | Primary text |
| `--muted-foreground` | `#56635A` | Secondary text |
| `--border` | `#DCE4DD` | Hairline dividers and outlines |

Colors other than the crest's bright green are design approximations inspired by the uniform, not official school brand standards. Validate against original brand assets if available. Do not recolor or redraw the crest. Use gold sparingly; check WCAG contrast for every text/background pairing (especially gold on white).

## 3. Typography

- **Display and headings:** Plus Jakarta Sans, weights 600–800.
- **Body and interface:** Inter, weights 400–600.
- **Never use serif headings** in the approved direction.
- Use sentence case for major headings. Reserve uppercase with modest letter spacing for small eyebrow labels.
- Desktop hero: `clamp(2.6rem, 5vw, 4.5rem)`, weight 700–800, line-height 1.08–1.15.
- Section heading: `clamp(2rem, 3.2vw, 3rem)`, weight 700, line-height 1.15–1.25.
- Card heading: 1.25–1.5rem, weight 650–700.
- Body: 1rem–1.125rem, line-height 1.6–1.75.
- Navigation: 0.875–0.9375rem, weight 500–600.
- Buttons: 0.875rem, weight 600–700.
- Maintain comfortable line lengths (about 55–75 characters for body text).

Use `next/font/google` for both families, with fallback fonts and no layout shift.

## 4. Non-negotiable geometry

**Every visible component has sharp square corners.** `border-radius: 0 !important` as a defensive global override, plus shadcn theme `--radius: 0rem`. Applies to buttons, fields, images, cards, menus, drawers, modals, tabs, badges, tooltips, skeletons, and mobile navigation. Do not use circular avatars, pill chips, or rounded icon backgrounds. The school crest retains its original outline because it is a brand asset, not a UI component.

Prefer 1px borders, straight rules, clean alignment, and very restrained shadows. Avoid glassmorphism, glows, gradients for decoration, and excessive ornaments.

## 5. Layout and spacing

- Max content width: 1200–1280px, with consistent horizontal gutters.
- Gutters: mobile 20–24px; tablet 32px; desktop 48–64px.
- Section vertical padding: mobile 64–80px; desktop 96–120px.
- Spacing system: multiples of 4px, favoring 8, 16, 24, 32, 48, 64, 96.
- Image treatments: authentic school photography, sharp edges, appropriate crops and accessible alt text.
- Desktop grid: 12 columns; collapse to 6 then 4 or single column based on available width.
- Avoid mockup's compressed vertical density; give real sections more whitespace.

## 6. Global components

### Header
- Optional slim army-green utility bar with verified contact/location only.
- Main white header with original crest, school name, accessible primary navigation, and rectangular gold or green admissions CTA.
- Mobile: compact logo and accessible square-corner menu drawer; keyboard operable, focus-visible, scroll-safe.
- Sticky header is optional; avoid oversized persistent chrome on small screens.

### Buttons
- Primary: dark green background, white text; secondary: outlined dark green; gold accent CTA only where contrast is verified.
- Rectangular, min-height 44px, generous horizontal padding.
- Hover, focus-visible, active, disabled, and loading states; respect reduced motion.

### Cards
- Flat surfaces, subtle borders, no radius; clear content hierarchy and consistent spacing.
- Entire-card links only where semantic and accessible; avoid nested interactive controls.

### Forms
- Labels above inputs; accessible errors, validation, success feedback, spam protection, and privacy-conscious data collection.

### Footer
- Deep green, school identity and motto, quick links, verified contact details, social links only if confirmed, legal links.

## 7. Homepage information architecture

1. Utility bar and navigation.
2. Hero: authentic pupils/campus image, strong sans-serif headline, concise school introduction, Discover and Admissions CTAs.
3. Four-value strip: academic foundation, holistic development, caring environment, self-reliance (confirm wording with school).
4. About section: photograph, introduction, learn-more link, school crest and verified vision statement.
5. Academic programmes: Nursery and Primary (P1–P7) cards with imagery and clear navigation.
6. School life: classroom, sports, clubs, creativity, wellbeing (only supported activities).
7. Achievements/metrics: **do not publish numeric claims without evidence**.
8. News and events: CMS-driven entries with genuine dates and photos; meaningful empty state before content exists.
9. Admissions call-to-action: inquiry link and verified process.
10. Footer.

Suggested *draft* hero headline: **“Nurturing Confident Learners for a Brighter Future.”** This is marketing copy pending school approval. School motto: **“Never Give Up.”**

## 8. Other pages

- `/about`: story, mission/vision, values, leadership (verified).
- `/academics`: nursery and primary, approach, curriculum (verified).
- `/admissions`: eligibility, steps, documents, fees only if authorized, enquiry form.
- `/school-life`: activities, pastoral care, clubs, school experience.
- `/gallery`: categorized photographs, consent-aware publishing.
- `/news`: articles, event listings, detail pages.
- `/contact`: verified contact, location, hours, map, accessible enquiry form.
- Optional `/parents`: term dates, circulars, downloads when content is available.

## 9. Content administration

Future secure `/admin` area with authenticated school staff roles. Initial content modules: news, events, gallery albums, homepage highlights, and basic page content. Separate drafts from published content; include image alt text, audit trails, media constraints, and appropriate permissions. Do not expose admin routes as public navigation. Choose final auth/storage/database architecture during backend planning; avoid installing backend dependencies until required.

## 10. Motion and interaction

Use subtle fades/translations and brief hover changes (150–300ms). Never gate essential content behind animation. Respect `prefers-reduced-motion`, keyboard navigation, visible focus states, and mobile performance. No autoplaying distracting carousels.

## 11. Accessibility, performance, and SEO

- Target WCAG 2.2 AA; semantic headings, landmarks, accessible forms and menus.
- Mobile-first layout, 44px touch targets, sufficient contrast.
- Next.js optimized images, explicit dimensions, lazy loading below fold, prioritized hero image.
- Descriptive page titles, metadata, Open Graph images, canonical URLs, sitemap and robots configuration.
- Avoid publishing identifiable child photographs without school authorization and appropriate consent.
- Avoid invented testimonials, PLE results, experience counts, contact details, events, or staff identities.

## 12. Implementation conventions

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui.
- `src/app` routes, `src/components/layout`, `src/components/home`, `src/components/ui`, `src/lib`, `src/data`.
- Centralize brand tokens in global CSS; no ad hoc colors or radius values.
- Build reusable SectionHeading, CTA, FeatureCard, ProgrammeCard, NewsCard, Header, Footer components.
- Keep initial public content in clearly marked typed fixtures until CMS is ready.
- Test desktop, tablet, and mobile; verify keyboard and reduced-motion behavior.
- Run targeted checks during implementation and a consolidated lint/typecheck/build at the end of each major milestone.

## 13. Phase plan and acceptance criteria

**Phase 1 — Foundation:** fonts, tokens, global zero-radius, app shell, responsive navigation/footer, components. Acceptance: responsive shell and consistent design tokens.

**Phase 2 — Homepage:** approved composition implemented with authorized images and provisional copy labeled for review. Acceptance: polished responsive homepage, functional links, no unsupported public claims.

**Phase 3 — Interior pages:** page content and admissions enquiry flow. Acceptance: all routes complete and accessible.

**Phase 4 — CMS and launch:** staff auth, publishing workflow, media management, SEO, performance, privacy and deployment. Acceptance: tested permissions, content governance, production readiness.

## 14. Assets

- `public/brand/st-angella-crest.png` — original user-provided crest, do not alter.
- `public/images/st-angella-uniform-reference.jpeg` — reference photo, not necessarily approved for public publishing.
- `docs/st-angella-homepage-reference.png` — approved **second** mockup, for visual comparison only; generated imagery/text are illustrative.

Before publication, obtain authorized high-resolution photographs, approved school text, and confirmed contact details.
