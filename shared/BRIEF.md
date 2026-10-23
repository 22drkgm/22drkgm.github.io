# Redesign brief — shared by all versions

Owner: Kumar Gaurav Mishra, 4th-year PhD candidate (aerosol / atmospheric chemistry, IIT (ISM) Dhanbad), applying for postdocs.
Goal: a portfolio that shows what a CV can't — the research story, the journey, the teaching — for PIs/hiring committees.

## Content sources (read them, do not invent facts)
- `../index.html` — bio, research focus, education, recognition & service
- `../publications.html` — papers, under review, in prep, conference talks
- `../teaching.html` — teaching, instruments, TA-ships, training
- `../contact.html` — email, address, links, supervisor
- `../cv_src/cv.tex` — skills, research experience (extra detail)
- `../shared/journey.js` — PhD timeline data (`window.JOURNEY`), MUST be loaded via `<script src="../shared/journey.js"></script>` and rendered by your own JS. Never hard-code the timeline items; the owner will add entries to that file later.
- Photo: `../img/kgm.jpeg` (960x1280 portrait). CV PDF: `../assets/CV_KumarGauravMishra.pdf`.

Use every fact from those pages; you may tighten wording but never add claims, numbers, awards or dates that are not in the sources. Keep chemical subscripts (PM<sub>2.5</sub>, δ<sup>13</sup>C) correct.

## Structure (single page, anchor nav)
1. Hero — name, role line, one-sentence research statement, "Open to postdoctoral positions" + buttons (CV PDF, email, Google Scholar).
2. Research — the coal-industrial airshed story; methods/toolkit (chemical, optical, isotopic, thermodynamic, source apportionment, transport).
3. PhD Journey — the road animation (see below) + metrics strip from `JOURNEY.metrics`.
4. Publications — peer-reviewed (with DOI links), under review, in preparation, conference presentations.
5. Teaching — highlights + TA list + instruments.
6. Recognition & Service, Education.
7. Contact — email, links (Scholar, ResearchGate, LinkedIn), address, supervisor.
Footer: © Kumar Gaurav Mishra.

## PhD Journey = "road" animation (required)
- Render `JOURNEY.semesters[].items[]` as milestones along a road (SVG or CSS): a road band with a dashed centre lane line; milestones are markers beside it.
- As the user scrolls, the road "builds"/draws forward (scroll-linked stroke-dashoffset or progressive reveal via IntersectionObserver) and milestones fade/slide in when reached. A small marker (dot/vehicle-less, abstract) may travel along the road to show progress. Keep it calm and professional — no cartoon cars, no bouncing, no neon.
- Semester labels act as road signs / mile-markers between groups.
- Each milestone: date, type tag (workshop / conference / publication / international), title, detail; publications show authors + DOI link; `highlight:true` item gets a subtle emphasis.
- Use a different, muted color per type, consistent with your palette.
- Last point of the road should feel open-ended ("more to come" / "Next: thesis submission Dec 2026" — that date IS in the sources).
- Mobile: road becomes a straight vertical line at the left with cards on the right. Must not overflow horizontally.
- Respect `prefers-reduced-motion: reduce` → show everything static, no animation.

## Hard requirements
- Plain static HTML/CSS/vanilla JS. No frameworks, no build step, no external JS libs. Google Fonts allowed.
- Files: `index.html`, `style.css`, `main.js` inside your version folder only. Do NOT touch any file outside your folder.
- Fully responsive: check mentally at 360px, 768px, 1024px, 1440px. No horizontal scroll at any width. 16px+ side gutter on phones. Mobile nav must work (simple toggle or horizontal scroll nav).
- Minimal & professional: generous whitespace, restrained palette (1 accent max + type colors in timeline), strong typography. AVOID: gradients, glassmorphism, emoji, big rounded "AI-template" cards with shadows, cream+terracotta "Claude" look, purple gradients, funky fonts.
- Accessible: semantic landmarks, alt text, visible focus states, color contrast AA.
- Include before `</body>`:
  `<script src="../shared/switcher.js" data-root=".." data-current="vN" defer></script>` (vN = your version id). Leave ~64px free at page bottom (the switcher adds body padding itself).
- `<title>` "Kumar Gaurav Mishra — Atmospheric Aerosol Chemistry" and a meta description.
