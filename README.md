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
