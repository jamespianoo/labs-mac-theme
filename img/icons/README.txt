Desktop icons

Folders (shared base art + type glyph):
  folder.svg / folder-solid.svg   base folder shape — light / dark
  glyph-*.webp / glyph-stream.svg   type marks (labs, maps, music, video, etc.)
  Folder name is shown via the normal .label under the icon.

Files (shared base art + type glyph):
  file.svg / file-solid.svg   base file shape — light / dark
  glyph-pdf-note.svg   about-me.pdf
  glyph-at.svg         contact.me (@)

Light/dark: each icon renders two shell <img> (.ra-shell-light / .ra-shell-dark),
toggled by html[data-theme] in css/desktop.css. Type glyphs are a single image
whose color is set with a CSS filter (brightness(0) for light theme,
brightness(0) invert(1) for dark theme) rather than separate glyph assets.

Trash (same thick-outline graphic family, white-faced so it works unchanged in
both themes):
  trash-ra.svg          empty
  trash-ra-full.svg     full

Legacy Mac folder webps remain for reference but desktop uses the file/folder SVGs.

All bitmap icons historically 128×128 WebP in one square slot
(--icon-size: 132px desk / 100px narrow).

Website favicons (img/icons/sites/) — used as file icons for lab / site links.

Personal UI homage — not Apple product branding.
