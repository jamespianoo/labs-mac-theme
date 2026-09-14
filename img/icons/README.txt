Desktop icons

Folders (shared base art + type glyph):
  sys9-folder.png   base folder shape, from a Mac OS 9 icon set
  glyph-*.webp / glyph-stream.svg   type marks (labs, maps, music, video, etc.)
  Folder name is shown via the normal .label under the icon.

Files (flat, front-on — folders are the only tilted/3D icons), hand-drawn
SVGs rather than the Mac OS 9 pixel art, kept deliberately plain:
  sys9-acrobat.svg                        about-me.pdf — paper + "PDF" text,
                                           no logo/ribbon graphic
  sys9-document.svg + glyph-at.svg badge  contact.me — paper + a big @, no
                                           other decoration

One shell image now covers both themes (no more light/dark swap) — these are
period pixel-art icons and don't invert well. Type glyph badges stay a fixed
dark ink color via CSS filter (brightness(0)) since they sit on the light
icon face in both themes — except multi-tone badges (the video/football
folder glyphs), which keep their own color instead of being crushed to a
black blob by that filter.

Folder badges are skewed (skewY) to match the folder art's own tilt, since
it's the only icon shape drawn in a 3D perspective.

Trash (single set, white-faced so it works unchanged in both themes):
  sys9-trash-empty.png
  sys9-trash-full.png

Base shells render with image-rendering:pixelated for a crisp period upscale.

All bitmap icons historically 128×128 WebP in one square slot
(--icon-size: 132px desk / 100px narrow).

Website favicons (img/icons/sites/) — used as file icons for lab / site links.

Personal UI homage — not Apple product branding.
