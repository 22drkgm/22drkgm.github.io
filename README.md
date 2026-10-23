# Portfolio site — Kumar Gaurav Mishra

Plain static site (no build step). Structure:

    index.html         home / bio / research focus / education / recognition
    publications.html  peer-reviewed, under review, in preparation, talks
    teaching.html       TA-ships, guest lectures, training
    cv.html             embedded + downloadable CV PDF
    contact.html        email / affiliation / links
    assets/styles.css   shared stylesheet (all design tokens at the top)
    assets/CV_KumarGauravMishra.pdf
    cv_src/cv.tex       LaTeX source for the CV — edit this, then rebuild the PDF:
                        pdflatex cv.tex && pdflatex cv.tex (run twice for refs)
                        and copy cv.pdf over assets/CV_KumarGauravMishra.pdf
    courses/            drop future course-materials subfolders here (see courses/README.md)

## Photos
- Your photo: replace `assets/profile.svg` with `assets/profile.jpg` (square, 140×140 or larger) and change the `src` in index.html.
- Right-hand pictures: `assets/scenes.svg` and the banner `assets/filters.svg` are drawn placeholders; swap in your own field/lab photos with the same names or update the `src`.

## To-do when you have time
- Replace the "KGM" monogram in index.html (.avatar div) with a real photo.
- Decide whether to publish a phone number on contact.html (left out by default).

## Publishing to GitHub Pages
1. `git init && git add -A && git commit -m "Portfolio site"`
2. Create a GitHub repo (e.g. `mkrgaurav.github.io` for a user site, or any
   name for a project site) and push.
3. In the repo's Settings → Pages, set the source to the `main` branch, root.
4. For a project-site repo the URL will be `https://<user>.github.io/<repo>/`;
   for a `<user>.github.io` repo it's the bare domain.

## Site versions (switcher pill at the bottom of every page)
- Original — root `*.html` (unchanged apart from the switcher script line)
- `v1/` Editorial — white, serif, centred road timeline
- `v2/` Grid — Swiss grid, sidebar nav, horizontal scroll-driven road on desktop
- `v3/` Mono — neutral greys, light/dark toggle, winding S-curve road
- `shared/journey.js` — PhD timeline data used by all three new versions. Add milestones here once; every version updates.
- `shared/switcher.js` — the version toggle. Remove the `<script ... switcher.js>` line from a page to hide it.
- Preview locally: `python3 -m http.server 8765` then open http://localhost:8765/
