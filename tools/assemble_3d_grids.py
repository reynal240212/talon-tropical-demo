import os
import cv2
import json
import numpy as np
from PIL import Image

def process_grid(grid_path, prefix, rows=2, cols=3):
    img = Image.open(grid_path)
    w, h = img.size
    row_splits = np.linspace(0, h, rows + 1, dtype=int)
    col_splits = np.linspace(0, w, cols + 1, dtype=int)
    
    extracted = []
    foot_centers = []
    for r in range(rows):
        for c in range(cols):
            idx = r * cols + c
            cell = img.crop((col_splits[c], row_splits[r], col_splits[c+1], row_splits[r+1]))
            cell_np = np.array(cell)
            
            min_rgb = np.minimum(np.minimum(cell_np[..., 0], cell_np[..., 1]), cell_np[..., 2])
            fg_mask = (min_rgb < 235).astype(np.uint8)
            
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(fg_mask, connectivity=8)
            cell_h, cell_w = cell_np.shape[:2]
            
            char_mask = np.zeros_like(fg_mask)
            for lbl in range(1, num_labels):
                area = stats[lbl, cv2.CC_STAT_AREA]
                if area > 100:
                    char_mask[labels == lbl] = 1
            
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            dilated_mask = cv2.dilate(char_mask, kernel, iterations=2)
            
            alpha = np.zeros((cell_h, cell_w), dtype=np.float32)
            active_pixels = (dilated_mask > 0)
            alpha[active_pixels] = np.clip((250.0 - min_rgb[active_pixels]) / (250.0 - 225.0) * 255.0, 0, 255)
            
            rgba = np.zeros((cell_h, cell_w, 4), dtype=np.uint8)
            a_norm = np.clip(alpha / 255.0, 0.001, 1.0)
            for ch in range(3):
                col_ch = cell_np[..., ch].astype(np.float32)
                defringed = np.clip((col_ch - (1.0 - a_norm) * 255.0) / a_norm, 0, 255)
                rgba[..., ch] = defringed.astype(np.uint8)
            rgba[..., 3] = alpha.astype(np.uint8)
            
            pil_rgba = Image.fromarray(rgba, mode='RGBA')
            bbox = pil_rgba.getbbox()
            cropped = pil_rgba.crop(bbox) if bbox else pil_rgba
            
            # Compute foot center
            c_arr = np.array(cropped)
            c_alpha = c_arr[..., 3]
            ch_h, ch_w = c_alpha.shape
            foot_region = c_alpha[int(ch_h * 0.8):, :]
            col_density = np.sum(foot_region > 100, axis=0)
            if col_density.sum() > 0:
                fc_x = float(np.average(np.arange(ch_w), weights=col_density))
            else:
                fc_x = ch_w / 2.0
                
            extracted.append(cropped)
            foot_centers.append(fc_x)
            
    return extracted, foot_centers

def build_aligned_sheet(frames, foot_centers, target_standing_h, prefix, is_crouch=False, slot_w=1000, sheet_h=724, foot_y=660):
    n_frames = len(frames)
    sheet_w = n_frames * slot_w
    
    if is_crouch:
        standing_h = frames[0].height
        scale = target_standing_h / standing_h
    else:
        standing_h = np.median([f.height for f in frames])
        scale = target_standing_h / standing_h
        
    print(f"{prefix}: scale={scale:.4f}, standing_h={standing_h}")
    
    canvas = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    frame_defs = []
    
    for i, (f, fc_x) in enumerate(zip(frames, foot_centers)):
        new_w = max(1, int(round(f.width * scale)))
        new_h = max(1, int(round(f.height * scale)))
        f_scaled = f.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        slot_center_x = i * slot_w + (slot_w // 2)
        paste_x = slot_center_x - int(round(fc_x * scale))
        paste_y = foot_y - new_h
        
        slot_start = i * slot_w
        slot_end = (i + 1) * slot_w
        assert paste_x >= slot_start, f"Frame {i} clipped on left! paste_x={paste_x} < {slot_start}"
        assert paste_x + new_w <= slot_end, f"Frame {i} clipped on right! paste_x+new_w={paste_x+new_w} > {slot_end}"
        
        canvas.paste(f_scaled, (paste_x, paste_y), f_scaled)
        
        frame_defs.append({
            "x": slot_start,
            "w": slot_w,
            "cx": slot_w // 2,
            "fy": foot_y
        })
        
    return canvas, frame_defs, scale

if __name__ == '__main__':
    crouch_grid_path = r'C:\Users\INVESTIGACION 181\.gemini\antigravity\brain\3441fc4c-467b-49d1-ad60-09288d92c7ea\talon_crouch_grid_2x3_v3_1795114095756.jpg'
    sling_grid_path = r'C:\Users\INVESTIGACION 181\.gemini\antigravity\brain\3441fc4c-467b-49d1-ad60-09288d92c7ea\talon_slingshot_2x3_cgi_v3_1795114146405.jpg'
    
    crouch_frames, crouch_fcs = process_grid(crouch_grid_path, 'crouch')
    sling_frames, sling_fcs = process_grid(sling_grid_path, 'sling')
    
    crouch_canvas, crouch_defs, _ = build_aligned_sheet(
        crouch_frames, crouch_fcs, target_standing_h=550, prefix="Crouch", is_crouch=True, slot_w=1000
    )
    sling_canvas, sling_defs, _ = build_aligned_sheet(
        sling_frames, sling_fcs, target_standing_h=550, prefix="Sling", is_crouch=False, slot_w=1000
    )
    
    os.makedirs('assets', exist_ok=True)
    crouch_canvas.save("assets/explorador_agacharse_master_v1.webp", "WEBP", quality=95, lossless=True)
    crouch_canvas.save("assets/explorador_agacharse_master_v1.png", "PNG")
    
    sling_canvas.save("assets/explorador_resortera_master_v2.webp", "WEBP", quality=95, lossless=True)
    sling_canvas.save("assets/explorador_resortera_master_v2.png", "PNG")
    
    print("\nSUCCESS! Saved both master sheets.")
    print("crouch_defs =", json.dumps(crouch_defs))
    print("slingshot_defs =", json.dumps(sling_defs))
