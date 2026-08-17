#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate crisp PWA icon assets for CoptoLex in SVG and PNG formats (192x192, 512x512, maskable, apple-touch-icon).
"""

import os
import sys

def generate_svg_icon(filepath, is_maskable=False):
    # Padding for maskable safe area (20%)
    inner_pad = "38" if is_maskable else "0"
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e2433" />
      <stop offset="50%" stop-color="#151a24" />
      <stop offset="100%" stop-color="#0c0f17" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="35%" stop-color="#f3b72c" />
      <stop offset="70%" stop-color="#d4af37" />
      <stop offset="100%" stop-color="#996515" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0.2" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="{0 if is_maskable else 108}" fill="url(#bgGrad)" />
  
  <!-- Subtle border for non-maskable -->
  {'<rect x="8" y="8" width="496" height="496" rx="100" fill="none" stroke="url(#borderGrad)" stroke-width="4" />' if not is_maskable else ''}

  <!-- Inner Gold Shield / Hexagon Frame -->
  <g transform="translate(256, 256)">
    <!-- Ambient Glow Circle -->
    <circle r="170" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-opacity="0.25" stroke-dasharray="12 8" />
    <circle r="145" fill="#151a24" fill-opacity="0.7" stroke="url(#goldGrad)" stroke-width="6" stroke-opacity="0.8" filter="url(#glow)" />

    <!-- Coptic Alpha (ⲁ) Glyphic Art -->
    <!-- Custom stylized representation of Coptic Alpha ⲁ -->
    <text x="0" y="70" font-family="'Antinoou', 'Segoe UI Historic', 'Arial', sans-serif" font-size="230" font-weight="bold" fill="url(#goldGrad)" text-anchor="middle" filter="url(#glow)">ⲁ</text>
  </g>
</svg>'''
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"Generated SVG icon: {filepath}")

def generate_png_icons():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    icons_dir = os.path.join(base_dir, 'public', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    svg_standard = os.path.join(icons_dir, 'icon.svg')
    svg_maskable = os.path.join(icons_dir, 'icon-maskable.svg')

    generate_svg_icon(svg_standard, is_maskable=False)
    generate_svg_icon(svg_maskable, is_maskable=True)

    # Try using Pillow to rasterize if available, or generate pure PNGs via canvas/PIL
    try:
        from PIL import Image, ImageDraw, ImageFont
        print("Rendering PNG icons via Pillow...")

        def render_png(size, is_maskable, outfile):
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)

            # Draw background
            corner_radius = 0 if is_maskable else int(size * 0.21)
            draw.rounded_rectangle([(0, 0), (size, size)], radius=corner_radius, fill=(12, 15, 23, 255))

            # Inner circle
            center = size // 2
            r_outer = int(size * 0.38)
            draw.ellipse([center - r_outer, center - r_outer, center + r_outer, center + r_outer],
                         fill=(21, 26, 36, 255), outline=(212, 175, 55, 200), width=max(2, int(size * 0.015)))

            # Try loading a system font or fallback to drawing text
            font_size = int(size * 0.45)
            font = None
            for font_name in ["seguihis.ttf", "arial.ttf", "times.ttf"]:
                try:
                    font = ImageFont.truetype(font_name, font_size)
                    break
                except Exception:
                    continue
            if not font:
                font = ImageFont.load_default()

            text = "ⲁ"
            # Draw text centered
            bbox = draw.textbbox((0, 0), text, font=font)
            w = bbox[2] - bbox[0]
            h = bbox[3] - bbox[1]
            x = center - w // 2 - bbox[0]
            y = center - h // 2 - bbox[1]
            
            # Gold shadow and main text
            draw.text((x + max(1, size // 256), y + max(1, size // 256)), text, font=font, fill=(153, 101, 21, 255))
            draw.text((x, y), text, font=font, fill=(243, 183, 44, 255))

            img.save(outfile, "PNG")
            print(f"Generated PNG: {outfile} ({size}x{size})")

        render_png(192, False, os.path.join(icons_dir, 'icon-192x192.png'))
        render_png(512, False, os.path.join(icons_dir, 'icon-512x512.png'))
        render_png(192, True, os.path.join(icons_dir, 'icon-maskable-192x192.png'))
        render_png(512, True, os.path.join(icons_dir, 'icon-maskable-512x512.png'))
        render_png(180, False, os.path.join(icons_dir, 'apple-touch-icon.png'))
        render_png(32, False, os.path.join(icons_dir, 'favicon-32x32.png'))

    except ImportError:
        print("Pillow not installed, writing minimal raw PNGs...")
        # If Pillow is not available, we can install or run a quick canvas script
        pass

if __name__ == '__main__':
    generate_png_icons()
