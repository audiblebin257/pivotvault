import os
from PIL import Image

def compress_and_convert():
    base_path = r"c:\Users\Rehan\OneDrive\Desktop\hacakathon\hackverse\1st demo\pivotvault\frontend\public"
    
    # 1. Compress and convert all-peeps.png -> all-peeps.webp
    peeps_path = os.path.join(base_path, "images", "peeps", "all-peeps.png")
    peeps_webp_path = os.path.join(base_path, "images", "peeps", "all-peeps.webp")
    if os.path.exists(peeps_path):
        print(f"Compressing {peeps_path}...")
        img = Image.open(peeps_path)
        img.save(peeps_webp_path, "WEBP", quality=80)
        print(f"Saved to {peeps_webp_path} (Size: {os.path.getsize(peeps_webp_path) / 1024:.2f} KB)")
        
    # 2. Compress and resize quibi.webp
    quibi_path = os.path.join(base_path, "logos", "quibi.webp")
    if os.path.exists(quibi_path):
        print(f"Compressing {quibi_path}...")
        img = Image.open(quibi_path)
        # If it's too large, resize to a reasonable logo size (e.g. max 400px width/height)
        if img.width > 400 or img.height > 400:
            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
        img.save(quibi_path, "WEBP", quality=75)
        print(f"Saved optimized {quibi_path} (Size: {os.path.getsize(quibi_path) / 1024:.2f} KB)")

    # 3. Compress and convert color lab.png -> color lab.webp
    color_path = os.path.join(base_path, "logos", "color lab.png")
    color_webp_path = os.path.join(base_path, "logos", "color lab.webp")
    if os.path.exists(color_path):
        print(f"Compressing {color_path}...")
        img = Image.open(color_path)
        if img.width > 400 or img.height > 400:
            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
        img.save(color_webp_path, "WEBP", quality=80)
        print(f"Saved to {color_webp_path} (Size: {os.path.getsize(color_webp_path) / 1024:.2f} KB)")

if __name__ == "__main__":
    compress_and_convert()
