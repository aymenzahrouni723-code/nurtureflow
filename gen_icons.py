"""Generate Android icon sizes"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from PIL import Image
import os

img = Image.open('icon.png').convert('RGBA')
os.makedirs('icons', exist_ok=True)

sizes = [48, 72, 96, 128, 144, 192, 256, 384, 512]
for s in sizes:
    resized = img.resize((s, s), Image.LANCZOS)
    resized.save(f'icons/icon-{s}x{s}.png')
    print(f'  OK icons/icon-{s}x{s}.png')

# Maskable icon with padding
maskable = Image.new('RGBA', (512, 512), (244, 236, 238, 255))
icon_small = img.resize((410, 410), Image.LANCZOS)
offset = (512 - 410) // 2
maskable.paste(icon_small, (offset, offset), icon_small)
maskable.save('icons/icon-512x512-maskable.png')
print('  OK icons/icon-512x512-maskable.png')
print('All icons generated!')
