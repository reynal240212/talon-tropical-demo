import json
import numpy as np
import scipy.ndimage as ndi
from PIL import Image

def extract_clean_character(crop_img):
    arr = np.array(crop_img.convert('RGBA'), dtype=np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    min_rgb = np.minimum(np.minimum(r, g), b)
    # Alpha threshold against solid white
    alpha = np.clip((252.0 - min_rgb) / (252.0 - 235.0) * 255.0, 0, 255)
    
    # Defringe: unmultiply white background
    a_norm = np.clip(alpha / 255.0, 0.001, 1.0)
    for c in range(3):
        arr[..., c] = np.clip((arr[..., c] - (1.0 - a_norm) * 255.0) / a_norm, 0, 255)
    arr[..., 3] = alpha
    
    # Filter connected components: keep only major body components (> 1500 pixels)
    mask = (alpha > 20)
    labeled, num_features = ndi.label(mask)
    if num_features > 0:
        sizes = ndi.sum(mask, labeled, range(num_features + 1))
        keep_labels = set(np.where(sizes > 1500)[0])
        keep_labels.discard(0)
        clean_mask = np.isin(labeled, list(keep_labels))
        arr[..., 3] *= clean_mask
        
    rgba = Image.fromarray(arr.astype(np.uint8), mode='RGBA')
    bbox = rgba.getbbox()
    if bbox:
        return rgba.crop(bbox)
    return rgba

def find_auto_seams(raw_img, n_frames):
    # Analyze vertical projection to find gaps between character frames
    arr = np.array(raw_img.convert('RGB'), dtype=np.float32)
    min_rgb = arr.min(axis=2)
    # White background has min_rgb > 240
    non_white_col = (min_rgb < 240).sum(axis=0)
    
    w = raw_img.width
    step = w / n_frames
    seams = [0]
    for i in range(1, n_frames):
        est = int(i * step)
        window = range(max(0, est - int(step * 0.25)), min(w, est + int(step * 0.25)))
        best_col = min(window, key=lambda c: non_white_col[c])
        seams.append(best_col)
    seams.append(w)
    return seams

def pack_action_sheet(raw_sheet_path, n_frames, target_char_height, sheet_w=2172, sheet_h=724, foot_y=660, is_crouch=False):
    raw_img = Image.open(raw_sheet_path)
    seams = find_auto_seams(raw_img, n_frames)
    print("Auto seams:", seams)
    
    clean_frames = []
    for i in range(n_frames):
        crop_f = raw_img.crop((seams[i], 0, seams[i+1], raw_img.height))
        f_clean = extract_clean_character(crop_f)
        clean_frames.append(f_clean)
        
    heights = [f.height for f in clean_frames]
    # For crouch, the first/last frame is standing/nearly standing, or max height represents full height
    ref_h = max(heights) if is_crouch else np.median(heights)
    scale_factor = target_char_height / ref_h
    print(f"Reference height: {ref_h}, scaling by: {scale_factor:.4f} for target: {target_char_height}")
    
    canvas = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    slot_w = sheet_w / n_frames
    frame_defs = []
    
    for i, f in enumerate(clean_frames):
        new_w = max(1, int(round(f.width * scale_factor)))
        new_h = max(1, int(round(f.height * scale_factor)))
        f_scaled = f.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        slot_center_x = int((i + 0.5) * slot_w)
        paste_x = slot_center_x - new_w // 2
        paste_y = foot_y - new_h
        
        canvas.paste(f_scaled, (paste_x, paste_y), f_scaled)
        
        frame_defs.append({
            "x": paste_x,
            "w": new_w,
            "cx": slot_center_x - paste_x,
            "fy": foot_y
        })
        
    return canvas, frame_defs

if __name__ == '__main__':
    print("pack_actions_3d helper ready")
