# Wearable AI Explorer

Interactive companion to the BMEN 6367 paper presentation on: [Wearable AI Simulator](https://rittik047.github.io/WearableAI_Simulator/)

> Huang G, Chen X, Liao C. **AI-Driven Wearable Bioelectronics in Digital Healthcare.** *Biosensors* 2025, 15(7), 410. [doi:10.3390/bios15070410](https://doi.org/10.3390/bios15070410)

The page has three models built from numbers reported in the review:

| Section | Link anchor | What it shows |
|---|---|---|
| 1 · Episodic vs continuous sensing | `#sampling` | Chance of recording a paroxysmal episode with clinic ECGs, a Holter, a 14-day patch or a smartwatch. P(capture) = 1 − e^(−λ(T + d)) |
| 2 · What a positive alert means | `#screening` | Table 5 systems in ROC space; PPV and NPV as prevalence changes; a 1,000-person icon array |
| 3 · Power budget → battery life | `#power` | Runtime on one charge for the review's 100 mW, 5 mW, 1 mW and 10 µW power tiers |

It is a static site: plain HTML, CSS and JavaScript with no build step, no libraries and no data leaving the browser. The IBM Plex fonts load from Google Fonts. If they can't load, the page falls back to system fonts.

## Files

```
index.html               page markup
assets/style.css         colours, type and layout (same theme as the claude.ai version)
assets/explorer.js       the three interactive models and the theme switch
assets/favicon.svg       browser-tab icon (+ favicon-32.png, apple-touch-icon.png)
.nojekyll                tells GitHub Pages to serve the files as-is (optional)
README.md                this file
```

## Publish on GitHub Pages (browser only, about 5 minutes)

1. Sign in to GitHub and create a **new public repository**, for example `wearable-ai-explorer`. A free account can only publish Pages from a public repository.
2. On the empty repository page, click **uploading an existing file**.
3. Drag in the **contents** of this folder (`index.html`, the `assets` folder and `README.md`), not the folder itself. `index.html` must sit at the top level of the repository.
   - `.nojekyll` is hidden in macOS Finder. Press **Cmd + Shift + .** to show it and drag it in too. The site works without it.
4. Click **Commit changes**.
5. Open **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, then **Branch: `main`**, folder **`/ (root)`**, and click **Save**.
6. Wait 1–2 minutes and refresh the Pages settings screen. It shows the live address:

```
https://<your-username>.github.io/wearable-ai-explorer/
```

If you name the repository `<your-username>.github.io`, the site is served at `https://<your-username>.github.io/` instead.

### Or with git on the command line

```bash
cd wearable-ai-explorer
git init -b main
git add .
git commit -m "Wearable AI Explorer"
git remote add origin https://github.com/<your-username>/wearable-ai-explorer.git
git push -u origin main
```

Then do step 5 above.

## Deep links used by the slides

Link straight to a model by adding its anchor to the address:

- `https://<your-username>.github.io/wearable-ai-explorer/#sampling`: slide 2
- `https://<your-username>.github.io/wearable-ai-explorer/#power`: slide 9
- `https://<your-username>.github.io/wearable-ai-explorer/#screening`: slides 17–18 (QR code on slide 18)

The deck currently points to the claude.ai version of this page, on slides 2, 9, 18, 23 and 24 (with QR codes on 18 and 23). Once the GitHub address works, change those links and QR codes to it.

## Preview locally

Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Theme

Light and dark colours follow the operating system. The **Theme** button in the header cycles Auto → Light → Dark, and the browser remembers the choice.

## Notes

The models are simplified for teaching and are not clinical tools. Assumptions are stated under each model on the page. Table 5 values and power tiers are as reported in the review; the models themselves were written for this presentation.
