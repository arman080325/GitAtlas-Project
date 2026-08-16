<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,100:2f81f7&height=220&section=header&text=GitAtlas&fontSize=70&fontColor=ffffff&fontAlignY=38&desc=A%20searchable%20field%20guide%20to%20Git%20%26%20GitHub&descAlignY=58&descSize=18&animation=fadeIn" width="100%"/>

<a href="https://gitatlas.vercel.app">
  <img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=24&duration=2500&pause=800&color=2F81F7&center=true&vCenter=true&width=600&lines=381+commands.+26+sections.+One+tap+copy.;Stop+googling+%22how+to+git+revert%22.;Built+for+devs%2C+by+a+dev+who+got+tired+of+tabs." alt="Typing SVG" />
</a>

<br/>

[![Live Demo](https://img.shields.io/badge/Live-gitatlas.vercel.app-2F81F7?style=for-the-badge&logo=vercel&logoColor=white)](https://gitatlas.vercel.app)
[![GitHub Repo stars](https://img.shields.io/github/stars/arman080325/GitAtlas-Project?style=for-the-badge&logo=github&color=0d1117&labelColor=2F81F7)](https://github.com/arman080325/GitAtlas-Project/stargazers)
[![Made by](https://img.shields.io/badge/Made%20by-Arman%20Ahemad%20Khan-0d1117?style=for-the-badge&logo=vercel&logoColor=2F81F7)](https://arman-portfolio.online)
[![License](https://img.shields.io/badge/License-MIT-blueviolet?style=for-the-badge)](#license)

<img src="https://profile-counter.glitch.me/gitatlas-project/count.svg" alt="visitor badge" />

</div>

<br/>

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="900">
</div>

<br/>

## 💡 Why this repo matters

Every developer has been mid-merge, mid-rebase, or mid-panic and typed **"how do I undo a git commit"** into a search engine for the hundredth time. GitAtlas exists to end that loop.

> It's not another cheat sheet. It's the command you needed, with the *plain-English reason* you needed it, sitting one tap away from your clipboard.

**GitAtlas is genuinely useful to the developer community because it:**

- 🧠 **Removes the "which flag was it again?" tax** — every one of the 381 commands ships with a real description and a real use case, not just syntax.
- ⚡ **Saves keystrokes that matter under pressure** — one-tap copy means no retyping a rebase command with shaky hands at 2 AM.
- 🎓 **Teaches while you use it** — juniors learn *why* a command exists, not just *that* it exists, because every entry explains the situation you'd reach for it in.
- 🛡️ **Warns before you self-destruct** — destructive and history-rewriting commands are flagged automatically, so `git push --force` doesn't ruin someone's afternoon.
- 🔍 **Is fast to search** — everything is indexed: command, description, use case, example, and section — find it in seconds, not scrolls.
- 🌐 **Works everywhere, instantly** — no build step, no install, no account. Open `index.html` and you're done.

<br/>

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📚 Command Coverage
- **381 commands** across **26 sections**
- Plain-English **description** for every command
- Real-world **use case** for every command
- Optional multi-line **example** blocks
- Concepts and error messages render as clean headings instead of runnable cards

</td>
<td width="50%" valign="top">

### 🔎 Search & Navigation
- Instant search across command, description, use case, example, and section name
- `/` or `Ctrl`/`Cmd` + `K` to jump straight into search
- `Esc` clears search or closes the mobile section rail
- Sidebar grouped by tag for fast scanning

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🚨 Smart Risk Badges
- Commands matching destructive patterns are auto-flagged **"Destroys work"**
- History-rewriting commands are auto-flagged **"Rewrites history"**
- Detection logic lives centrally in `riskOf()` — no manual tagging needed
- Risk dot **pulses** so it can't be missed

</td>
<td width="50%" valign="top">

### 🎨 Theming
- Follows your **system theme** by default
- Header button cycles **System → Light → Dark → System**
- Manual choice persists in `localStorage` and overrides the OS
- Live re-theme if your OS preference changes mid-session
- Zero flash-of-wrong-theme — resolved pre-paint in `<head>`

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🎬 Motion Design
- Wordmark in **Syne ExtraBold** with a letter-by-letter rise + wave + blinking caret
- Hero description fades in word by word
- 16 hand-mapped **SVG scenes** act out what each section's commands actually do
- Commit graph in the hero **resolves into the GitHub logo**
- Copy buttons pop green with a lighting card edge
- Everything respects `prefers-reduced-motion`
- Section animation is scroll-gated — nothing runs off-screen

</td>
<td width="50%" valign="top">

### 🖋️ Typography System
| Role | Typeface |
|---|---|
| Wordmark | Syne 800 |
| Headings | IBM Plex Sans Condensed 700 |
| Body | IBM Plex Sans |
| Commands / data | IBM Plex Mono |

Fonts degrade gracefully to system fonts if Google Fonts is blocked.

</td>
</tr>
</table>

<br/>

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="900">
</div>

<br/>

## 🗂️ Project structure

```
gitatlas/
├── index.html     page shell — header, hero, layout, footer
├── styles.css     blueprint theme, both colour modes, responsive rules
├── data.js        the command database (edit this to add commands)
├── app.js         rendering, search, copy, navigation, theme
├── vercel.json    static hosting config
└── README.md
```

<br/>

## 🚀 Quick start

**No build. No install. No config.** Just open it.

```bash
git clone https://github.com/arman080325/GitAtlas-Project.git
cd GitAtlas-Project
```

Open `index.html` directly in your browser — that's the whole setup.

Prefer a local server (clipboard API behaves best on `localhost`):

```bash
python -m http.server 5173
# then open http://localhost:5173
```

<br/>

## ☁️ Deploy to Vercel

<table>
<tr>
<td width="50%" valign="top">

**Option A — Git (recommended)**

```bash
git init
git add .
git commit -m "feat: GitAtlas command reference"
git branch -M main
git remote add origin git@github.com:arman080325/gitatlas.git
git push -u origin main
```

Then on **vercel.com** → **Add New → Project** → import the repo:

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Build Command | *(empty)* |
| Output Directory | *(root)* |
| Install Command | *(empty)* |

</td>
<td width="50%" valign="top">

**Option B — CLI**

```bash
npm i -g vercel
cd gitatlas
vercel --prod
```

Every push to `main` redeploys automatically. 🔁

</td>
</tr>
</table>

<br/>

## 🧩 Adding or editing commands

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

The app handles the rest automatically:

- **Copy buttons** appear only on runnable commands — concept/error entries become plain headings.
- **Risk badges** are computed, not tagged, via `riskOf()` in `app.js`.
- **Search** indexes every field for free.
- Group names for `tag` live in `GROUPS` at the top of `app.js`.

<br/>

## ⌨️ Keyboard shortcuts

| Key | Action |
|---|---|
| `/` or `Ctrl` / `Cmd` + `K` | Focus the search box |
| `Esc` | Clear the search, or close the mobile section list |

<br/>

## 🎨 Colour system

Colours follow GitHub's Primer palette:

| Mode | Background | Accent |
|---|---|---|
| Dark | `#0d1117` | `#2f81f7` |
| Light | `#ffffff` | `#0969da` |

<br/>

## 🔗 Add it to your portfolio

```html
<a class="project-card" href="https://gitatlas.vercel.app" target="_blank" rel="noopener">
  <h3>GitAtlas</h3>
  <p>A searchable field guide to 381 Git &amp; GitHub commands — plain-English
     descriptions, real use cases and one-tap copy, in a GitHub-native interface.</p>
  <span>Developer tooling · Reference</span>
</a>
```

Want it on a subdomain? In **Vercel → Project → Settings → Domains**, add `git.arman-portfolio.online`, then point a matching CNAME at it from your DNS.

<br/>

## 🛠️ Built with

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Google Fonts](https://img.shields.io/badge/Google%20Fonts-4285F4?style=for-the-badge&logo=googlefonts&logoColor=white)

</div>

<br/>

## 🤝 Contributing

Found a command that's missing, wrong, or explained badly? Pull requests are very welcome.

1. Fork the repo
2. Add/edit an entry in `data.js`
3. Open a PR with a short note on what changed and why

<br/>

## 📌 Notes

- No `localStorage` is used for anything except the theme choice.
- Fonts load from Google Fonts and degrade to system fonts if blocked.

<br/>

## 📄 License

Released under the **MIT License** — use it, fork it, ship your own version.

<br/>

<div align="center">

### If GitAtlas saved you a Google search, consider starring it ⭐

<a href="https://github.com/arman080325/GitAtlas-Project/stargazers">
  <img src="https://img.shields.io/badge/⭐_Star_this_repo-2F81F7?style=for-the-badge" />
</a>

Maintained by **[Arman Ahemad Khan](https://arman-portfolio.online)**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2f81f7,100:0d1117&height=120&section=footer" width="100%"/>

</div>