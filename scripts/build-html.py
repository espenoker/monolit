#!/usr/bin/env python3
"""Regenerate index.html, injecting brand-asset SVG geometry verbatim.

The brand scribbles are filled outline paths (vectorized ink), so each one is
revealed by animating a white centerline stroke inside an SVG <mask>. The
centerline paths live in this template; the ink geometry is read from
src/assets/ so it never gets mis-transcribed.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "src" / "assets"


def path_ds(name: str) -> list[str]:
    """All path d attributes from an asset file, in document order."""
    svg = (ASSETS / name).read_text()
    return re.findall(r'<path d="([^"]+)"', svg)


def paths_markup(name: str, indent: str) -> str:
    """All paths as bare <path d> elements (fills inherited from CSS)."""
    return "\n".join(f'{indent}<path d="{d}" />' for d in path_ds(name))


hero_d = path_ds("scribble-hero.svg")[0]
ring_d = path_ds("scribble2.svg")[0]
arrow_d = path_ds("scribble4.svg")[1]  # [0] is the no-op luminance mask rect
bracket_l_d, bracket_r_d = path_ds("scribble5.svg")

logomark_paths = paths_markup("monolit_logosymbol.svg", "      ")
wordmark_paths = paths_markup("Monolit.svg", "      ")

# Centerline reveal strokes, hand-authored per asset viewBox.
RING_MASK = (
    "M 16 62 C 18 30 70 8 124 7 C 180 6 238 26 236 56 C 234 85 175 102 120 101 "
    "C 64 100 8 86 10 57 C 12 31 62 13 116 12 C 172 11 232 30 230 57 "
    "C 228 82 172 98 120 97 C 90 96.5 45 92 25 80"
)
HERO_MASK = (
    "M 20 78 C 22 38 92 12 165 10 C 240 8 320 32 318 72 C 316 110 240 133 162 131 "
    "C 88 129 10 110 12 72 C 14 38 85 16 160 14 C 236 12 312 36 310 73 "
    "C 308 106 238 126 163 124 C 92 122 22 104 24 73 C 26 46 80 27 140 23"
)
BRACKET_L_MASK = "M 25 5 C 13 7 9 11 9 19 L 9 68 C 9 76 14 80 27 82"
BRACKET_R_MASK = "M 211 8 C 225 8 229 12 229 20 L 229 67 C 229 75 225 79 212 80"
ARROW_MASK = (
    "M 247 7 C 160 40 60 130 22 250 C 8 295 4 345 35 378 C 78 408 150 392 185 350 "
    "C 208 318 196 274 150 256 C 102 238 30 262 16 302 C 30 372 95 422 163 432 "
    "C 230 424 280 403 335 382 C 400 357 470 330 535 312 C 585 303 625 302 652 309"
)
ARROW_HEAD_MASK = "M 630 288 C 648 299 658 305 662 309 C 648 322 636 333 624 343"


def ring(mask_id: str, duration: int, delay: int = 0) -> str:
    """A word-circling scribble instance revealed by its own mask."""
    delay_attr = f' data-delay="{delay}"' if delay else ""
    return (
        f'<svg data-scribble data-duration="{duration}"{delay_attr} viewBox="0 0 245 106" '
        f'preserveAspectRatio="none" aria-hidden="true">'
        f'<defs><mask id="{mask_id}"><path class="draw-path" pathLength="1" d="{RING_MASK}" '
        f'stroke="#fff" stroke-width="26" fill="none" /></mask></defs>'
        f'<g mask="url(#{mask_id})"><use href="#ring-scribble" /></g></svg>'
    )


UNDERLINE = (
    '<svg data-scribble data-duration="{dur}"{delay} viewBox="0 0 200 20" '
    'preserveAspectRatio="none" aria-hidden="true">'
    '<path class="draw-path ink" pathLength="1" d="M 4 12 C 50 6 122 14 196 7" /></svg>'
)


def underline(duration: int, delay: int = 0) -> str:
    d = f' data-delay="{delay}"' if delay else ""
    return UNDERLINE.format(dur=duration, delay=d)


MARK = '<svg class="mark" viewBox="0 0 108 80" aria-hidden="true"><use href="#logomark" /></svg>'

HTML = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Monolit — For those who build</title>
  <meta name="description" content="Monolit is a firm of serious builders designing quantitative trading systems that endure." />
  <link rel="icon" href="data:," />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/styles/main.css" />
</head>
<body>

  <!-- Shared brand geometry (referenced via <use>) -->
  <svg class="sprite" aria-hidden="true">
    <symbol id="logomark" viewBox="0 0 108 80">
{logomark_paths}
    </symbol>
    <symbol id="ring-scribble" viewBox="0 0 245 106">
      <path d="{ring_d}" />
    </symbol>
  </svg>

  <header class="nav">
    <a class="nav__wordmark" href="/" aria-label="Monolit">
      <svg viewBox="0 0 105 23" aria-hidden="true">
{wordmark_paths}
      </svg>
    </a>
  </header>

  <!-- ============ HERO ============ -->
  <section class="hero" id="hero" aria-label="For those who build">
    <h1 class="hero__title">
      For those<br />
      who&nbsp;<span class="annotate annotate--hero"><em>build</em><svg data-scribble="manual" data-duration="1100" viewBox="0 0 326 141" preserveAspectRatio="none" aria-hidden="true"><defs><mask id="m-hero"><path class="draw-path" pathLength="1" d="{HERO_MASK}" stroke="#fff" stroke-width="26" fill="none" /></mask></defs><g mask="url(#m-hero)"><path d="{hero_d}" /></g></svg></span>
    </h1>

    <div class="hero__mark">{MARK}</div>

    <p class="hero-hint" aria-hidden="true"><em>go on — scribble</em></p>
    <button class="hero-clear" type="button">clear</button>
  </section>

  <!-- ============ WE ARE MONOLIT ============ -->
  <section class="split">
    <p class="label">We are Monolit</p>
    <div class="split__body">
      <p>We are a firm of <em>serious</em> builders competing at a global benchmark, designing quantitative trading systems that <em>endure</em> and constructing an environment where exceptional talent <em>thrive</em>.</p>
    </div>
  </section>

  <!-- ============ MANIFESTO ============ -->
  <section class="manifesto" id="manifesto">
    <h2 class="manifesto__title">
      We stay <span class="annotate annotate--circle">open,{ring("m-open", 700)}</span> <span class="annotate annotate--underline">sharp,{underline(450, 320)}</span><br />
      and intellectually restless,<br />
      because that&rsquo;s how better<br />
      systems are <span class="annotate annotate--brackets">built.<svg data-scribble data-duration="650" data-delay="620" viewBox="0 0 236 86" preserveAspectRatio="none" aria-hidden="true"><defs><mask id="m-brackets"><path class="draw-path" pathLength="1" d="{BRACKET_L_MASK}" stroke="#fff" stroke-width="16" fill="none" /><path class="draw-path" pathLength="1" d="{BRACKET_R_MASK}" stroke="#fff" stroke-width="16" fill="none" /></mask></defs><g mask="url(#m-brackets)"><path d="{bracket_l_d}" /><path d="{bracket_r_d}" /></g></svg></span>
    </h2>
  </section>

  <!-- ============ HOW WE WORK ============ -->
  <section class="split split--how" id="how">
    <div class="split__aside">
      <p class="label annotate annotate--label">How we work{ring("m-how-label", 600)}</p>
      <svg class="arrow-sweep" data-scribble data-duration="1300" data-delay="450" viewBox="0 0 671 438" aria-hidden="true"><defs><mask id="m-arrow"><path class="draw-path" pathLength="1" d="{ARROW_MASK}" stroke="#fff" stroke-width="34" fill="none" /><path class="draw-path" data-w="0.12" pathLength="1" d="{ARROW_HEAD_MASK}" stroke="#fff" stroke-width="34" fill="none" /></mask></defs><g mask="url(#m-arrow)"><path d="{arrow_d}" /></g></svg>
    </div>
    <div class="split__body">
      <p>At Monolit, ownership is <em>real</em>. You&rsquo;re trusted with responsibility, you stay close to the systems you build, and you&rsquo;re part of the decisions that shape them.</p>
      <p>The thing is: We apply rigorous science to financial markets and compete at a global level, but we do it as builders. We go <em>deep</em>. We take problems apart. We develop, test, and refine <em>until the impact is real</em>.</p>
      <p>You&rsquo;ll work with people who raise the bar and share the responsibility. A culture built on <em>trust, autonomy, and serious craft</em>.</p>
      <p>Bring your ambition. Bring your <em>curiosity</em>. Bring your craft. Here, you&rsquo;ll get the trust, responsibility, and team mates to <em>take it further</em>.</p>
    </div>
  </section>

  <!-- ============ GLOBAL NETWORK ============ -->
  <section class="band band--network" id="network">
    <div class="split split--band">
      <p class="label">A part of a <em>global network</em></p>
      <div class="split__body">
        <p>We&rsquo;re <em>locally grounded</em>, but <em>globally connected</em>. We operate within a wider ecosystem of leading trading expertise, infrastructure, <em>and opportunity</em>. That gives us the freedom to build independently with the reach to think <em>much bigger</em>.</p>
      </div>
    </div>

    <img class="world-map" src="/map.svg" alt="" loading="lazy" width="1035" height="517" />

    <div class="offices">
      <div class="office">
        <p class="office__city">Oslo</p>
        <p class="office__addr">Haakon VIIs gate 2<br />0161 Oslo</p>
        <p class="office__clock" data-tz="Europe/Oslo">--:--</p>
      </div>
      <div class="office">
        <p class="office__city">London</p>
        <p class="office__addr">50 Pall Mall, St. James&rsquo;s<br />London SW1Y 5JH</p>
        <p class="office__clock" data-tz="Europe/London">--:--</p>
      </div>
      <div class="office">
        <p class="office__city">Zurich</p>
        <p class="office__addr">Brandschenkestrasse 2<br />8001 Zurich</p>
        <p class="office__clock" data-tz="Europe/Zurich">--:--</p>
      </div>
    </div>
  </section>

  <!-- ============ BUILD FOR IMPACT ============ -->
  <section class="impact" id="impact">
    <h2 class="impact__title">Build for impact<br />at your <em>real level</em></h2>

    <div class="impact__mark">{MARK}</div>

    <div class="impact__body">
      <p><span class="annotate annotate--lead"><svg data-scribble data-duration="400" viewBox="0 0 60 24" aria-hidden="true"><path class="draw-path ink" pathLength="1" d="M 2 13 C 18 11 34 12 52 12" /><path class="draw-path ink" pathLength="1" data-w="0.5" d="M 42 4 L 54 12 L 42 20" /></svg></span>&ensp;You shouldn&rsquo;t have to choose between world-class <span class="annotate annotate--underline">performance and a life that works{underline(500)}</span>. Between elite standards and long-term responsibility. Between ambition and durability.</p>

      <p>At <span class="annotate annotate--circle">Monolit{ring("m-monolit", 600)}</span>, we bring together<span class="annotate annotate--caret"><svg data-scribble data-duration="250" viewBox="0 0 24 16" aria-hidden="true"><path class="draw-path ink" pathLength="1" d="M 3 14 L 12 3 L 21 14" /></svg></span>people who are serious about their craft and serious about building something that lasts. You work on real systems, close to the impact, alongside others who raise the <em>level</em> around you. That means your ideas, decisions, and work show up in results that travel: From research to <span class="annotate annotate--circle">code{ring("m-code", 500)}</span>, from code to systems, from systems into <span class="annotate annotate--underline">markets that move every day{underline(500)}</span>.</p>

      <p>The way trading is built is changing.<br />We&rsquo;re changing it for the <em>better</em>.</p>
    </div>

    <svg class="signature" data-scribble data-duration="1400" viewBox="0 0 220 90" aria-hidden="true"><path class="draw-path ink" pathLength="1" d="M 14 58 C 30 22 52 14 56 34 C 60 54 38 74 28 62 C 18 50 60 28 88 30 C 116 32 96 64 76 62 C 56 60 96 24 132 28 C 168 32 150 66 130 60 C 110 54 150 30 186 38 C 200 41 207 50 200 58" /></svg>
  </section>

  <!-- ============ CTA ============ -->
  <section class="band band--cta" id="cta">
    <h2 class="cta__title">The future will be <em>shaped</em> by those capable of <em>building it</em>. We&rsquo;re bringing those people <em>together</em>.</h2>
  </section>

  <!-- ============ FOOTER ============ -->
  <footer class="footer" id="footer">
    <div class="checker" aria-hidden="true">
      <div class="checker__row checker__row--1"><i class="b"></i><i></i><i class="b"></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="checker__row checker__row--2"><i></i><i class="b"></i><i></i><i class="b"></i><i></i><i class="b"></i><i></i><i class="b"></i></div>
      <div class="checker__row checker__row--3"><i class="b"></i><i></i><i class="b"></i><i></i><i class="b"></i><i></i><i class="b"></i><i></i></div>
    </div>
    <div class="footer__bar">
      <div class="footer__col">
        <p>Monolit</p>
        <p>0047 99 99 99 00</p>
      </div>
      <div class="footer__col">
        <p>Haakon VIIs gate 2</p>
        <p>0161 Oslo</p>
      </div>
      <div class="footer__col footer__col--mark">{MARK}</div>
      <div class="footer__col">
        <p><a href="mailto:hello@monolit.com">hello@monolit.com</a></p>
        <p><a href="#" rel="noopener">LinkedIn</a></p>
      </div>
      <div class="footer__col footer__col--right">
        <p>Design: Studio Oker</p>
        <p>&copy; Monolit 2026</p>
      </div>
    </div>
  </footer>

  <script type="module" src="/src/js/main.js"></script>
</body>
</html>
"""

(ROOT / "index.html").write_text(HTML)
print(f"index.html written ({len(HTML)} bytes)")
