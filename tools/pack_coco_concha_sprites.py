import os
import shutil
from PIL import Image, ImageDraw

ASSETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'assets'))
TMP_DIR = os.path.join(ASSETS_DIR, '_coco_concha_frames_tmp')

WALK_SHEET_PATH = os.path.join(ASSETS_DIR, 'coco_concha_walk_16frames.png')
WALK_GIF_PATH = os.path.join(ASSETS_DIR, 'coco_concha_walk_fluida.gif')
SHOWCASE_PATH = os.path.join(ASSETS_DIR, 'coco_concha_16frames_showcase.png')
MASTER_PIRATAS_PATH = os.path.join(ASSETS_DIR, 'coco_piratas_master_v1.png')

# 1. Cargar los 31 fotogramas renderizados desde Blender (360x480)
raw_frames = []
bboxes = []
for i in range(1, 32):
    p = os.path.join(TMP_DIR, f'frame_{i:02d}.png')
    im = Image.open(p).convert('RGBA')
    raw_frames.append(im)
    bboxes.append(im.getbbox())

# Calcular la línea de suelo (máximo Y inferior de los pies durante el contacto en frames 1..16)
walk_bboxes = [b for b in bboxes[:16] if b is not None]
min_x = min(b[0] for b in walk_bboxes)
min_y = min(b[1] for b in walk_bboxes)
max_x = max(b[2] for b in walk_bboxes)
max_foot_y = max(b[3] for b in walk_bboxes)
center_x = (min_x + max_x) / 2.0

# Escalar para que la altura total del personaje quepa perfectamente en 180x240 con pies en Y=218
char_h = max_foot_y - min_y
target_h = 198.0
scale_walk = target_h / max(1.0, char_h)

# 2. Construir coco_concha_walk_16frames.png (2880 x 240, 16 frames de 180x240)
fw, fh = 180, 240
foot_line_y = 218
walk_sheet = Image.new('RGBA', (fw * 16, fh), (0, 0, 0, 0))
gif_frames = []

for idx in range(16):
    im = raw_frames[idx]
    nw = max(1, int(round(im.width * scale_walk)))
    nh = max(1, int(round(im.height * scale_walk)))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)

    # Alinear el centro horizontal y la línea base del suelo (manteniendo el rebote real entre frames)
    scaled_cx = center_x * scale_walk
    scaled_ground_y = max_foot_y * scale_walk

    paste_x = int(round(83 - scaled_cx))
    paste_y = int(round(foot_line_y - scaled_ground_y))

    cell = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
    cell.alpha_composite(resized, (paste_x, paste_y))
    walk_sheet.paste(cell, (idx * fw, 0))

    # Para el GIF con fondo oscuro suave de muestra
    gif_bg = Image.new('RGBA', (fw, fh), (18, 36, 42, 255))
    gif_bg.alpha_composite(cell, (0, 0))
    gif_frames.append(gif_bg.convert('RGB'))

walk_sheet.save(WALK_SHEET_PATH, optimize=True)
gif_frames[0].save(
    WALK_GIF_PATH,
    save_all=True,
    append_images=gif_frames[1:],
    duration=55,
    loop=0
)

# 3. Actualizar la Fila 0 (Coco Concha) en coco_piratas_master_v1.png (19 columnas de 140x160)
# Columnas:
# 0..3: Walk (frames 1, 5, 9, 13)
# 4..7: Run (frames 17, 18, 19, 20)
# 8..11: Jump (frames 21, 22, 23, 24)
# 12..15: Attack (frames 25, 26, 27, 28)
# 16..18: K.O. (frames 29, 30, 31)
col_frame_indices = [
    0, 4, 8, 12,       # Walk (4 fases simétricas)
    16, 17, 18, 19,    # Run (4 fases)
    20, 21, 22, 23,    # Jump (4 fases)
    24, 25, 26, 27,    # Attack (4 fases con mazo)
    28, 29, 30         # K.O. (3 fases)
]

if os.path.exists(MASTER_PIRATAS_PATH):
    master = Image.open(MASTER_PIRATAS_PATH).convert('RGBA')
    mw, mh = 140, 160
    # Limpiar fila 0 (y = 0..160)
    clear_row = Image.new('RGBA', (master.width, mh), (0, 0, 0, 0))
    master.paste(clear_row, (0, 0))

    scale_master = 132.0 / max(1.0, char_h)
    for col_i, f_i in enumerate(col_frame_indices):
        im = raw_frames[f_i]
        nw = max(1, int(round(im.width * scale_master)))
        nh = max(1, int(round(im.height * scale_master)))
        resized = im.resize((nw, nh), Image.Resampling.LANCZOS)

        scaled_cx = center_x * scale_master
        scaled_ground_y = max_foot_y * scale_master
        px = int(round(70 - scaled_cx))
        py = int(round(150 - scaled_ground_y))

        cell = Image.new('RGBA', (mw, mh), (0, 0, 0, 0))
        cell.alpha_composite(resized, (px, py))
        master.paste(cell, (col_i * mw, 0))

    master.save(MASTER_PIRATAS_PATH, optimize=True)

# 4. Crear lámina de exhibición (coco_concha_16frames_showcase.png) con las 16 fases + ataques
cols_sc, rows_sc = 8, 3
showcase = Image.new('RGBA', (cols_sc * fw, rows_sc * fh), (16, 32, 38, 255))
draw = ImageDraw.Draw(showcase)

# Filas 0 y 1: Los 16 fotogramas del ciclo de caminata
for idx in range(16):
    r = idx // 8
    c = idx % 8
    cell = walk_sheet.crop((idx * fw, 0, (idx + 1) * fw, fh))
    x0, y0 = c * fw, r * fh
    draw.line([(x0, y0 + foot_line_y), (x0 + fw, y0 + foot_line_y)], fill=(70, 130, 95, 160), width=2)
    showcase.alpha_composite(cell, (x0, y0))

# Fila 2: 4 poses de Carrera (frames 17..20) + 4 poses de Ataque con Mazo (frames 25..28)
extra_indices = [16, 17, 18, 19, 24, 25, 26, 27]
for c, f_i in enumerate(extra_indices):
    im = raw_frames[f_i]
    nw = max(1, int(round(im.width * scale_walk)))
    nh = max(1, int(round(im.height * scale_walk)))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    scaled_cx = center_x * scale_walk
    scaled_ground_y = max_foot_y * scale_walk
    px = int(round(83 - scaled_cx))
    py = int(round(foot_line_y - scaled_ground_y))
    cell = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
    cell.alpha_composite(resized, (px, py))
    x0, y0 = c * fw, 2 * fh
    draw.line([(x0, y0 + foot_line_y), (x0 + fw, y0 + foot_line_y)], fill=(180, 95, 70, 160), width=2)
    showcase.alpha_composite(cell, (x0, y0))

showcase.save(SHOWCASE_PATH, optimize=True)

# Limpiar carpeta temporal
shutil.rmtree(TMP_DIR, ignore_errors=True)
print("PACKED_WALK_SHEET:", WALK_SHEET_PATH)
print("PACKED_SHOWCASE:", SHOWCASE_PATH)
print("UPDATED_MASTER:", MASTER_PIRATAS_PATH)
