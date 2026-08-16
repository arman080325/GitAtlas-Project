# GitAtlas

A searchable field guide to Git and GitHub. **381 commands** across 26 sections, each with a
plain-English description, the situation you would actually use it in, and one-tap copy.

Built with nothing but HTML, CSS and JavaScript — no framework, no build step, no dependencies.

---

## Files

```
gitatlas/
├── index.html     page shell — header, hero, layout, footer
├── styles.css     blueprint theme, both colour modes, responsive rules
├── data.js        the command database (edit this to add commands)
├── app.js         rendering, search, copy, navigation, theme
├── vercel.json    static hosting config
└── README.md
```

## Run it locally

Open `index.html` in a browser. That is the whole setup.

If you prefer a local server (clipboard API is happiest on `localhost`):

```bash
cd gitatlas
python -m http.server 5173
# open http://localhost:5173
```

## Deploy to Vercel

**Option A — Git (recommended)**

```bash
git init
git add .
git commit -m "feat: GitAtlas command reference"
git branch -M main
git remote add origin git@github.com:arman080325/gitatlas.git
git push -u origin main
```

Then on vercel.com: **Add New → Project → import the repo**, and use these settings:

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Build Command | *(leave empty)* |
| Output Directory | *(leave empty / root)* |
| Install Command | *(leave empty)* |

**Option B — CLI**

```bash
npm i -g vercel
cd gitatlas
vercel --prod
```

Every push to `main` redeploys automatically.

## Link it from your portfolio

Add it as a project card, and put a link back in this site's footer (already stubbed in
`index.html` → `.footer-links`).

```html
<a class="project-card" href="https://gitatlas.vercel.app" target="_blank" rel="noopener">
  <h3>GitAtlas</h3>
  <p>A searchable field guide to 381 Git &amp; GitHub commands — plain-English
     descriptions, real use cases, one-tap copy. Vanilla HTML/CSS/JS.</p>
  <span>HTML · CSS · JavaScript</span>
</a>
```

If you want it on a subdomain instead: in Vercel → Project → Settings → Domains, add
`git.arman-portfolio.online`, then create the matching CNAME record wherever your DNS lives.

## Adding or editing commands

Everything lives in `data.js`. A section looks like this:

```js
{
  id: "stash",                    // becomes the URL anchor (#stash)
  label: "Stashing",              // heading and rail label
  tag: "rescue",                  // groups it in the sidebar
  blurb: "One line under the heading.",
  commands: [
    {
      c: 'git stash',                        // the command (copied on click)
      d: 'What it does, in plain English.',  // description
      e: 'When you would reach for it.',     // use case
      x: 'optional\nmulti-line\nexample'     // optional, shows under "Example"
    }
  ]
}
```

Rules the app applies automatically, so you do not have to tag anything by hand:

- **Copy buttons** appear only on runnable commands. Entries that are concepts or error
  messages (the *Team workflows* and *Common errors* sections) render as headings instead.
- **Risk badges** — commands matching known destructive patterns get *Destroys work*;
  history-rewriting ones get *Rewrites history*. Both live in `riskOf()` in `app.js`.
- **Search** indexes the command, description, use case, example and section name.

Group names used by `tag` are defined at the top of `app.js` in `GROUPS`.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` or `Ctrl`/`Cmd` + `K` | Focus the search box |
| `Esc` | Clear the search, or close the mobile section list |

## Theme

Colours follow GitHub's Primer palette — `#0d1117` / `#2f81f7` in dark, `#ffffff` / `#0969da` in light.

The site **follows your system setting by default**. The button in the header cycles
**System → Light → Dark → System**; anything other than System is remembered in `localStorage`
and wins over the system preference. While on System, the page re-themes live if you change
your OS setting mid-session.

A tiny inline script in `<head>` resolves the theme before first paint, so there is no flash
of the wrong colours on load.

## Motion

| Where | What happens |
|---|---|
| Wordmark | Letters rise in one by one, then a slow wave crosses them; a terminal caret blinks after the last letter |
| Hero description | Fades in word by word |
| Section headers | Slide up as you reach them |
| Section explainers | A small SVG in every section header acts out what those commands do — a branch splitting, commits lifting onto a new base, work dropping into the stash. 16 scenes mapped across the 26 sections in `SCENE_FOR` (`app.js`) |
| Commands | A `$` prompt brightens and a block caret blinks on hover |
| Risk badges | The dot pulses |
| Copy | The button pops and turns green, the card's left edge lights up |

Section animations are **paused until the section scrolls into view**, so nothing runs off screen.
All of it is disabled under *prefers-reduced-motion*.

## Notes

- Fonts load from Google Fonts and degrade to system fonts if blocked.
- No `localStorage` is used for anything except the theme choice.