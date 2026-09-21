#!/usr/bin/env python3
"""Rasterize the PWA install icons from the Voidwake/Nullharbor X avatar.

Prefers dist/branding/x-profile.png or dist/branding/x-profile.svg (Social
Media Manager X profile). Non-square PNGs are center-cropped to a square
before resize. Falls back to the voidwake-site favicon SVG only if no
x-profile file is present.
"""
from __future__ import annotations

from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
BRANDING = DIST / "branding"
OUT_SIZES = (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180))

VOIDWAKE_SVG = """\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Voidwake Studios">
  <rect width="32" height="32" rx="8" fill="#0b0d12"/>
  <circle cx="16" cy="16" r="10" fill="none" stroke="#c9a36a" stroke-width="1.4"/>
  <path d="M8 16h11" stroke="#c9a36a" stroke-width="1.4"/>
  <circle cx="22" cy="11" r="2.2" fill="none" stroke="#7eb8c9" stroke-width="1.2"/>
</svg>
"""

PNG_WRAP_SVG = """\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Voidwake Studios">
  <image href="icon-512.png" width="512" height="512"/>
</svg>
"""


def square_crop(image):
    from PIL import Image
    w, h = image.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return image.crop((left, top, left + side, top + side))


def write_pngs(image, dest_dir: Path) -> None:
    from PIL import Image

    dest_dir.mkdir(parents=True, exist_ok=True)
    rgb = square_crop(image.convert("RGBA"))
    for name, size in OUT_SIZES:
        resized = rgb.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(dest_dir / name, "PNG")
        print(f"wrote {dest_dir / name} ({size}x{size})")


def from_svg(svg: str | bytes, dest_dir: Path) -> None:
    import cairosvg
    from PIL import Image

    png = cairosvg.svg2png(bytestring=svg if isinstance(svg, bytes) else svg.encode("utf-8"), output_width=512, output_height=512)
    write_pngs(Image.open(BytesIO(png)), dest_dir)


def from_png(path: Path, dest_dir: Path) -> None:
    from PIL import Image

    write_pngs(Image.open(path), dest_dir)


def main() -> None:
    png = BRANDING / "x-profile.png"
    svg = BRANDING / "x-profile.svg"
    if png.is_file():
        print(f"using X profile PNG {png}")
        from_png(png, DIST)
        from_png(png, DIST / "classic")
        (DIST / "icon.svg").write_text(PNG_WRAP_SVG)
        source_note = png
    elif svg.is_file():
        print(f"using X profile SVG {svg}")
        text = svg.read_text()
        from_svg(text, DIST)
        from_svg(text, DIST / "classic")
        (DIST / "icon.svg").write_text(text)
        source_note = svg
    else:
        print("no dist/branding/x-profile.(png|svg); using Voidwake Studios site mark")
        (DIST / "icon.svg").write_text(VOIDWAKE_SVG)
        from_svg(VOIDWAKE_SVG, DIST)
        from_svg(VOIDWAKE_SVG, DIST / "classic")
        source_note = "voidwake-site favicon.svg"
    (DIST / "classic" / "icon.svg").write_text((DIST / "icon.svg").read_text())
    print(f"done; source={source_note}")


if __name__ == "__main__":
    main()
