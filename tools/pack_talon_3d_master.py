import json
import numpy as np
import scipy.ndimage as ndi
from PIL import Image

def extract_clean_character(crop_img):
    arr = np.array(crop_img.convert('RGBA'), dtype=np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    min_rgb = np.minimum(np.minimum(r, g), b)
    # Alpha threshold
    alpha = np.clip((252.0 - min_rgb) / (252.0 - 235.0) * 255.0, 0, 255)
    
    # Defringe: unmultiply white background
    a_norm = np.clip(alpha / 255.0, 0.001, 1.0)
    for c in range(3):
        arr[..., c] = np.clip((arr[..., c] - (1.0 - a_norm) * 255.0) / a_norm, 0, 255)
    arr[..., 3] = alpha
    
    # Filter connected components: keep only major body components (> 2500 pixels)
    mask = (alpha > 20)
    labeled, num_features = ndi.label(mask)
    if num_features > 0:
        sizes = ndi.sum(mask, labeled, range(num_features + 1))
        keep_labels = set(np.where(sizes > 2500)[0])
        keep_labels.discard(0)
        clean_mask = np.isin(labeled, list(keep_labels))
        arr[..., 3] *= clean_mask
        
    rgba = Image.fromarray(arr.astype(np.uint8), mode='RGBA')
    bbox = rgba.getbbox()
    if bbox:
        return rgba.crop(bbox)
    return rgba

def pack_sheet(raw_sheet_path, seams, target_char_height, sheet_w=2172, sheet_h=724, foot_y=660):
    raw_img = Image.open(raw_sheet_path)
    n_frames = len(seams) - 1
    
    # Extract and clean frames
    clean_frames = []
    for i in range(n_frames):
        crop_f = raw_img.crop((seams[i], 0, seams[i+1], raw_img.height))
        f_clean = extract_clean_character(crop_f)
        clean_frames.append(f_clean)
        
    # Find median character height across frames to normalize scale
    heights = [f.height for f in clean_frames]
    med_h = np.median(heights)
    scale_factor = target_char_height / med_h
    print(f"Median frame height: {med_h}, scaling by: {scale_factor:.4f} to reach target height: {target_char_height}")
    
    # Create canvas
    canvas = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    slot_w = sheet_w / n_frames
    
    frame_defs = []
    
    for i, f in enumerate(clean_frames):
        # Resize frame
        new_w = max(1, int(round(f.width * scale_factor)))
        new_h = max(1, int(round(f.height * scale_factor)))
        f_scaled = f.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center inside slot
        slot_center_x = int((i + 0.5) * slot_w)
        paste_x = slot_center_x - new_w // 2
        paste_y = foot_y - new_h
        
        canvas.paste(f_scaled, (paste_x, paste_y), f_scaled)
        
        cx = slot_center_x - paste_x
        fy = foot_y
        frame_defs.append({
            "x": paste_x,
            "w": new_w,
            "cx": cx,
            "fy": fy
        })
        
    return canvas, frame_defs

# 1. IDLE SHEET
idle_raw = r'C:\Users\INVESTIGACION 181\.gemini\antigravity\brain\3441fc4c-467b-49d1-ad60-09288d92c7ea\talon_idle_3d_sheet_v3_1795049979514.jpg'
idle_seams = [0, 259, 485, 695, 906, 1125, 1376]
idle_canvas, idle_defs = pack_sheet(idle_raw, idle_seams, target_char_height=560, foot_y=660)
idle_canvas.save("assets/explorador_idle_master_v1.webp", "WEBP", quality=95, lossless=True)
print("Saved 3D idle sheet to assets/explorador_idle_master_v1.webp")

# 2. RUN SHEET
run_raw = r'C:\Users\INVESTIGACION 181\.gemini\antigravity\brain\3441fc4c-467b-49d1-ad60-09288d92c7ea\talon_3d_cgi_run_sheet_1795049972889.jpg'
run_seams = [0, 236, 475, 710, 901, 1125, 1376]
run_canvas, run_defs = pack_sheet(run_raw, run_seams, target_char_height=545, foot_y=660)
run_canvas.save("assets/explorador_correr_master_v1.webp", "WEBP", quality=95, lossless=True)
print("Saved 3D run sheet to assets/explorador_correr_master_v1.webp")

print("\n--- NEW FRAMES CONFIG FOR GAME.JS ---")
print("idle:", json.dumps(idle_defs))
print("run:", json.dumps(run_defs))
