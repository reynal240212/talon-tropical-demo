import os
import math
import numpy as np
import scipy.ndimage as ndi
from PIL import Image, ImageFilter

os.makedirs('scratch/frames_3d', exist_ok=True)

def extract_clean_character(crop_img):
    arr = np.array(crop_img.convert('RGBA'), dtype=np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    min_rgb = np.minimum(np.minimum(r, g), b)
    alpha = np.clip((252.0 - min_rgb) / (252.0 - 235.0) * 255.0, 0, 255)
    
    a_norm = np.clip(alpha / 255.0, 0.001, 1.0)
    for c in range(3):
        arr[..., c] = np.clip((arr[..., c] - (1.0 - a_norm) * 255.0) / a_norm, 0, 255)
    arr[..., 3] = alpha
    
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

# Extract all 6 idle frames and 6 run frames
idle_raw = Image.open(r'C:\Users\INVESTIGACION 181\.gemini\antigravity\brain\3441fc4c-467b-49d1-ad60-09288d92c7ea\talon_idle_3d_sheet_v3_1795049979514.jpg')
idle_seams = [0, 259, 485, 695, 906, 1125, 1376]
idle_frames = []
for i in range(6):
    f = extract_clean_character(idle_raw.crop((idle_seams[i], 0, idle_seams[i+1], idle_raw.height)))
    idle_frames.append(f)
    f.save(f'scratch/frames_3d/idle_{i}.png')

run_raw = Image.open(r'C:\Users\INVESTIGACION 181\.gemini\antigravity\brain\3441fc4c-467b-49d1-ad60-09288d92c7ea\talon_3d_cgi_run_sheet_1795049972889.jpg')
run_seams = [0, 236, 475, 710, 901, 1125, 1376]
run_frames = []
for i in range(6):
    f = extract_clean_character(run_raw.crop((run_seams[i], 0, run_seams[i+1], run_raw.height)))
    run_frames.append(f)
    f.save(f'scratch/frames_3d/run_{i}.png')

print("All 12 base 3D frames extracted and saved.")

# -------------------------------------------------------------
# 1. JUMP SHEET (8 frames, width=2172, height=724)
# -------------------------------------------------------------
# Frame 0: Pre-jump crouch
# Frame 1: Ascent launch
# Frame 2: High leap upward
# Frame 3: Apex zenith
# Frame 4: Descent start
# Frame 5: Downward fall
# Frame 6: Pre-landing reach
# Frame 7: Landing compression
jump_canvas = Image.new("RGBA", (2172, 724), (0, 0, 0, 0))
jump_base_h = 550
slot_w = 2172 / 8

jump_configs = [
    # (source_frame, stretch_x, stretch_y, offset_y_from_foot)
    (idle_frames[0], 1.08, 0.85, 0),    # 0: crouch prep
    (run_frames[0],  0.92, 1.06, 0),    # 1: push off
    (run_frames[2],  0.96, 1.02, -15),  # 2: rising high
    (run_frames[5],  1.00, 1.00, -25),  # 3: apex
    (run_frames[1],  0.96, 1.02, -15),  # 4: falling
    (run_frames[3],  0.94, 1.05, -5),   # 5: diving down
    (run_frames[4],  0.96, 1.02, 0),    # 6: pre-touchdown
    (idle_frames[0], 1.10, 0.80, 0)     # 7: land squish
]

for i, (src_f, sx, sy, y_off) in enumerate(jump_configs):
    scale_y = (jump_base_h * sy) / src_f.height
    scale_x = scale_y * sx
    nw = max(1, int(round(src_f.width * scale_x)))
    nh = max(1, int(round(src_f.height * scale_y)))
    f_scaled = src_f.resize((nw, nh), Image.Resampling.LANCZOS)
    
    slot_cx = int((i + 0.5) * slot_w)
    px = slot_cx - nw // 2
    py = 660 - nh + y_off
    jump_canvas.paste(f_scaled, (px, py), f_scaled)

jump_canvas.save("assets/explorador_salto_master_v1.webp", "WEBP", quality=95, lossless=True)
print("Saved 3D Jump Sheet to assets/explorador_salto_master_v1.webp")

# -------------------------------------------------------------
# 2. DOUBLE JUMP SHEET (8 frames, width=2172, height=724)
# -------------------------------------------------------------
# Acrobatic somersault / 360-degree flip
dj_canvas = Image.new("RGBA", (2172, 724), (0, 0, 0, 0))
flip_base = run_frames[2].resize((int(run_frames[2].width * 1.1), int(run_frames[2].height * 1.1)), Image.Resampling.LANCZOS)

for i in range(8):
    angle = -i * 45  # 0, -45, -90, -135, -180, -225, -270, -315
    f_rot = flip_base.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    
    scale = 520.0 / max(f_rot.width, f_rot.height)
    nw = max(1, int(round(f_rot.width * scale)))
    nh = max(1, int(round(f_rot.height * scale)))
    f_scaled = f_rot.resize((nw, nh), Image.Resampling.LANCZOS)
    
    slot_cx = int((i + 0.5) * slot_w)
    px = slot_cx - nw // 2
    py = 520 - nh // 2  # centered in air
    dj_canvas.paste(f_scaled, (px, py), f_scaled)

dj_canvas.save("assets/explorador_doble_salto_master_v1.png", "PNG")
print("Saved 3D Double Jump Sheet to assets/explorador_doble_salto_master_v1.png")

# -------------------------------------------------------------
# 3. CROUCH SHEET (6 frames, width=1376, height=768)
# -------------------------------------------------------------
crouch_canvas = Image.new("RGBA", (1376, 768), (0, 0, 0, 0))
cr_slot_w = 1376 / 6
cr_base = idle_frames[0]
base_h = 560

for i in range(6):
    prog = min(1.0, i / 4.0)  # reaches full crouch by frame 4
    sy = 1.0 - (0.42 * prog)  # squashes down to 58% height
    sx = 1.0 + (0.16 * prog)  # widens by 16%
    
    scale_y = (base_h * sy) / cr_base.height
    scale_x = (base_h * sx) / cr_base.height
    nw = max(1, int(round(cr_base.width * scale_x)))
    nh = max(1, int(round(cr_base.height * scale_y)))
    f_scaled = cr_base.resize((nw, nh), Image.Resampling.LANCZOS)
    
    slot_cx = int((i + 0.5) * cr_slot_w)
    px = slot_cx - nw // 2
    py = 660 - nh
    crouch_canvas.paste(f_scaled, (px, py), f_scaled)

crouch_canvas.save("assets/explorador_agacharse_master_v1.png", "PNG")
print("Saved 3D Crouch Sheet to assets/explorador_agacharse_master_v1.png")

# -------------------------------------------------------------
# 4. SLEEP SHEET (6 frames, width=2172, height=724)
# -------------------------------------------------------------
sleep_canvas = Image.new("RGBA", (2172, 724), (0, 0, 0, 0))
sl_slot_w = 2172 / 6
sl_base = idle_frames[0].rotate(90, expand=True)  # lying on ground

for i in range(6):
    # Breathing motion in sleep
    breathe = math.sin(i * math.pi / 3.0) * 0.04
    sy = 1.0 + breathe
    
    scale = 480.0 / sl_base.width
    nw = max(1, int(round(sl_base.width * scale)))
    nh = max(1, int(round(sl_base.height * scale * sy)))
    f_scaled = sl_base.resize((nw, nh), Image.Resampling.LANCZOS)
    
    slot_cx = int((i + 0.5) * sl_slot_w)
    px = slot_cx - nw // 2
    py = 670 - nh  # on ground
    sleep_canvas.paste(f_scaled, (px, py), f_scaled)

sleep_canvas.save("assets/explorador_dormir_master_v1.png", "PNG")
print("Saved 3D Sleep Sheet to assets/explorador_dormir_master_v1.png")

# -------------------------------------------------------------
# 5. HANG & CLIMB SHEETS
# -------------------------------------------------------------
hang_canvas = Image.new("RGBA", (2172, 724), (0, 0, 0, 0))
hg_slot_w = 2172 / 8
hg_base = idle_frames[0]

for i in range(8):
    sway = math.sin(i * math.pi / 4.0) * 4  # swinging legs while hanging
    scale = 540.0 / hg_base.height
    nw = max(1, int(round(hg_base.width * scale)))
    nh = max(1, int(round(hg_base.height * scale)))
    f_scaled = hg_base.resize((nw, nh), Image.Resampling.LANCZOS)
    
    slot_cx = int((i + 0.5) * hg_slot_w)
    px = slot_cx - nw // 2 + int(sway)
    py = 340  # hanging below ledge
    hang_canvas.paste(f_scaled, (px, py), f_scaled)

hang_canvas.save("assets/explorador_colgado_personaje_v3.png", "PNG")
print("Saved 3D Hang Sheet to assets/explorador_colgado_personaje_v3.png")

climb_canvas = Image.new("RGBA", (2172, 724), (0, 0, 0, 0))
cl_slot_w = 2172 / 12

for i in range(12):
    prog = i / 11.0  # pulling up from py=340 to py=100
    py = int(340 - (prog * 240))
    scale = 540.0 / hg_base.height
    nw = max(1, int(round(hg_base.width * scale)))
    nh = max(1, int(round(hg_base.height * scale)))
    f_scaled = hg_base.resize((nw, nh), Image.Resampling.LANCZOS)
    
    slot_cx = int((i + 0.5) * cl_slot_w)
    px = slot_cx - nw // 2
    climb_canvas.paste(f_scaled, (px, py), f_scaled)

climb_canvas.save("assets/explorador_subir_personaje_v2.png", "PNG")
print("Saved 3D Climb Sheet to assets/explorador_subir_personaje_v2.png")

print("\n=== ALL 3D ACTIONS GENERATED SUCCESSFULLY ===")
