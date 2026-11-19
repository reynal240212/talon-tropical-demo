import json
import numpy as np
import scipy.ndimage as ndi
from PIL import Image

def extract_frames_with_geodesic_watershed(raw_sheet_path, expected_n_frames, erosion_size=13):
    img = Image.open(raw_sheet_path)
    arr = np.array(img.convert('RGBA'), dtype=np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    min_rgb = np.minimum(np.minimum(r, g), b)
    # Defringe white background cleanly
    alpha = np.clip((252.0 - min_rgb) / (252.0 - 235.0) * 255.0, 0, 255)
    a_norm = np.clip(alpha / 255.0, 0.001, 1.0)
    for c in range(3):
        arr[..., c] = np.clip((arr[..., c] - (1.0 - a_norm) * 255.0) / a_norm, 0, 255)
    arr[..., 3] = alpha

    bin_mask = (alpha > 20)
    eroded = ndi.binary_erosion(bin_mask, structure=np.ones((erosion_size, erosion_size)))
    labeled, n = ndi.label(eroded)
    sizes = ndi.sum(eroded, labeled, range(n + 1))
    large_labels = [i for i in range(1, n + 1) if sizes[i] > 1000]

    assert len(large_labels) == expected_n_frames, f"Expected {expected_n_frames} components, got {len(large_labels)}"

    centers = ndi.center_of_mass(eroded, labeled, large_labels)
    # Sort labels left-to-right by center X
    sorted_labels = [lbl for _, lbl in sorted(zip([c[1] for c in centers], large_labels))]

    # Expand markers back to full binary mask using distance transform
    marker = np.zeros(bin_mask.shape, dtype=np.int32)
    for idx, lbl in enumerate(sorted_labels):
        marker[labeled == lbl] = idx + 1

    _, ind = ndi.distance_transform_edt(marker == 0, return_indices=True)
    expanded = marker[ind[0], ind[1]]

    extracted_frames = []
    foot_offsets = [] # Distance from top of crop to foot contact point
    for i in range(expected_n_frames):
        f_arr = arr.copy()
        # Include any small details belonging to this zone (like flying rock in frame 3)
        f_arr[..., 3] *= ((expanded == (i + 1)) & bin_mask)
        rgba = Image.fromarray(f_arr.astype(np.uint8), mode='RGBA')
        bbox = rgba.getbbox()
        f_crop = rgba.crop(bbox)
        extracted_frames.append(f_crop)
        # In the original image, all characters stand on the same ground line.
        # So the foot contact is at bbox[3] in the raw image, which corresponds to f_crop.height
        print(f"Frame {i}: bbox={bbox}, size={f_crop.size}")

    return extracted_frames

def build_master_sheet(frames, target_standing_height, is_crouch=False, sheet_w=2172, sheet_h=724, foot_y=660):
    n_frames = len(frames)
    slot_w = sheet_w / n_frames

    # Determine scaling factor
    # For crouch, frame 0 is standing upright, so scale frame 0 to target_standing_height
    if is_crouch:
        standing_h = frames[0].height
        scale_factor = target_standing_height / standing_h
    else:
        # For slingshot/action, use median height
        med_h = np.median([f.height for f in frames])
        scale_factor = target_standing_height / med_h

    print(f"Scale factor: {scale_factor:.4f} (target standing height: {target_standing_height})")

    canvas = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    frame_defs = []

    for i, f in enumerate(frames):
        new_w = max(1, int(round(f.width * scale_factor)))
        new_h = max(1, int(round(f.height * scale_factor)))
        f_scaled = f.resize((new_w, new_h), Image.Resampling.LANCZOS)

        slot_center_x = int((i + 0.5) * slot_w)
        paste_x = slot_center_x - new_w // 2
        # Feet firmly planted at foot_y
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

# 1. PROCESS CROUCH SHEET (6 frames)
crouch_raw = r'C:\Users\INVESTIGACION 181\.gemini\antigravity\brain\3441fc4c-467b-49d1-ad60-09288d92c7ea\talon_crouch_3d_spritesheet_final_1795113083020.jpg'
crouch_frames = extract_frames_with_geodesic_watershed(crouch_raw, expected_n_frames=6, erosion_size=13)
crouch_canvas, crouch_defs = build_master_sheet(crouch_frames, target_standing_height=560, is_crouch=True, sheet_w=2172, sheet_h=724, foot_y=660)

crouch_canvas.save("assets/explorador_agacharse_master_v1.webp", "WEBP", quality=95, lossless=True)
crouch_canvas.save("assets/explorador_agacharse_master_v1.png", "PNG")
print("Saved 3D crouch sheet to assets/explorador_agacharse_master_v1.webp and .png")

# 2. PROCESS SLINGSHOT SHEET (5 frames)
sling_raw = r'C:\Users\INVESTIGACION 181\.gemini\antigravity\brain\3441fc4c-467b-49d1-ad60-09288d92c7ea\talon_slingshot_3d_spritesheet_v2_1795113039600.jpg'
sling_frames = extract_frames_with_geodesic_watershed(sling_raw, expected_n_frames=5, erosion_size=13)
sling_canvas, sling_defs = build_master_sheet(sling_frames, target_standing_height=550, is_crouch=False, sheet_w=2172, sheet_h=724, foot_y=660)

sling_canvas.save("assets/explorador_resortera_master_v2.webp", "WEBP", quality=95, lossless=True)
sling_canvas.save("assets/explorador_resortera_master_v2.png", "PNG")
print("Saved 3D slingshot sheet to assets/explorador_resortera_master_v2.webp and .png")

print("\n--- JSON FOR GAME.JS ---")
print("crouch:", json.dumps(crouch_defs))
print("slingshot:", json.dumps(sling_defs))
