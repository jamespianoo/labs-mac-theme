Desktop icons

Folders (shared base art + type glyph):
  sys9-folder.png   base folder shape, from a Mac OS 9 icon set
  glyph-*.webp / glyph-stream.svg   type marks (labs, maps, music, video, etc.)
  Folder name is shown via the normal .label under the icon.

Files (shared base art + badge, same tilted 3D shape as the folder):
  sys9-generic.png + sys9-acrobat.png badge   about-me.pdf
  sys9-generic.png + glyph-at.svg badge       contact.me (@)

sys9-generic.png is the same isometric/tilted perspective as sys9-folder.png
(both come from the same Mac OS 9 icon set), so files and folders read as
one consistent 3D desktop. sys9-acrobat.png is a flat front-on icon, not
tilted, so it's used as a badge/overlay only, never as the file base art.

One shell image now covers both themes (no more light/dark swap) — these are
period pixel-art icons and don't invert well. Type glyph badges stay a fixed
dark ink color via CSS filter (brightness(0)) since they sit on the light
icon face in both themes — except multi-tone badges (sys9-acrobat, the
video/football glyphs), which keep their own color instead of being
crushed to a black blob by that filter.

Trash (single set, white-faced so it works unchanged in both themes):
  sys9-trash-empty.png
  sys9-trash-full.png

Base shells render with image-rendering:pixelated for a crisp period upscale.

All bitmap icons historically 128×128 WebP in one square slot
(--icon-size: 132px desk / 100px narrow).

Website favicons (img/icons/sites/) — used as file icons for lab / site links.

Personal UI homage — not Apple product branding.
