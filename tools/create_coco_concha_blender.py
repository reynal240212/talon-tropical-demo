import math
import random
import os
import bpy
import bmesh
from mathutils import Vector, Euler, Matrix

random.seed(42)

# Limpiar escena por completo
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

for collection in (
    bpy.data.actions, bpy.data.meshes, bpy.data.materials,
    bpy.data.armatures, bpy.data.lights, bpy.data.cameras, bpy.data.images
):
    for block in list(collection):
        if block.users == 0:
            try:
                collection.remove(block)
            except Exception:
                pass


# =========================================================
# 1. TEXTURAS RICAS (COCO FIBROSO, CONCHA ESTRIADA, HOJAS CON NERVADURAS)
# =========================================================
def make_outline_mat():
    m = bpy.data.materials.new('Contorno_Tinta')
    m.use_backface_culling = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    emi = nt.nodes.new('ShaderNodeEmission')
    emi.inputs['Color'].default_value = (0.02, 0.008, 0.003, 1.0)
    emi.inputs['Strength'].default_value = 1.0
    nt.links.new(emi.outputs['Emission'], out.inputs['Surface'])
    return m


mat_outline = make_outline_mat()


def make_coco_fiber_mat(
    name='Coco_Fibra_Real',
    dark_col=(0.055, 0.018, 0.004),
    mid_col=(0.32, 0.125, 0.032),
    light_col=(0.64, 0.29, 0.082),
    scale_xy=26.0
):
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = 0.86

    tex_coord = nt.nodes.new('ShaderNodeTexCoord')
    mapping = nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (scale_xy, scale_xy, 2.0)

    wave = nt.nodes.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'X'
    wave.wave_profile = 'SAW'
    wave.inputs['Scale'].default_value = 4.2
    wave.inputs['Distortion'].default_value = 7.5
    wave.inputs['Detail'].default_value = 10.0
    wave.inputs['Detail Scale'].default_value = 3.0

    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 8.0
    noise.inputs['Detail'].default_value = 12.0
    noise.inputs['Roughness'].default_value = 0.85
    noise.inputs['Distortion'].default_value = 1.4

    mix_fac = nt.nodes.new('ShaderNodeMix')
    mix_fac.data_type = 'FLOAT'
    mix_fac.inputs['Factor'].default_value = 0.52

    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'LINEAR'
    e0 = ramp.color_ramp.elements[0]
    e0.position = 0.28
    e0.color = (*dark_col, 1.0)
    e1 = ramp.color_ramp.elements[1]
    e1.position = 0.52
    e1.color = (*mid_col, 1.0)
    e2 = ramp.color_ramp.elements.new(0.74)
    e2.color = (*light_col, 1.0)

    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 1.0
    bump.inputs['Distance'].default_value = 0.08

    nt.links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    nt.links.new(mapping.outputs['Vector'], wave.inputs['Vector'])
    nt.links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    nt.links.new(wave.outputs['Fac'], mix_fac.inputs[2])
    nt.links.new(noise.outputs['Fac'], mix_fac.inputs[3])
    nt.links.new(mix_fac.outputs[0], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(mix_fac.outputs[0], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def make_shell_mat():
    m = bpy.data.materials.new('Concha_Marfil_Texturizada')
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = 0.36

    tex_coord = nt.nodes.new('ShaderNodeTexCoord')
    mapping = nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (1.2, 1.2, 0.8)
    mapping.inputs['Rotation'].default_value = (0.0, math.radians(-18), 0.0)

    wave = nt.nodes.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'X'
    wave.wave_profile = 'SIN'
    wave.inputs['Scale'].default_value = 1.45
    wave.inputs['Distortion'].default_value = 1.2
    wave.inputs['Detail'].default_value = 2.0

    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 8.0
    noise.inputs['Detail'].default_value = 5.0
    noise.inputs['Roughness'].default_value = 0.55

    mix_val = nt.nodes.new('ShaderNodeMix')
    mix_val.data_type = 'FLOAT'
    mix_val.inputs['Factor'].default_value = 0.25

    ramp = nt.nodes.new('ShaderNodeValToRGB')
    e0 = ramp.color_ramp.elements[0]
    e0.position = 0.08
    e0.color = (0.64, 0.52, 0.39, 1.0)
    e1 = ramp.color_ramp.elements[1]
    e1.position = 0.35
    e1.color = (0.89, 0.83, 0.72, 1.0)
    e2 = ramp.color_ramp.elements.new(0.62)
    e2.color = (0.98, 0.96, 0.90, 1.0)

    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.45
    bump.inputs['Distance'].default_value = 0.03

    nt.links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    nt.links.new(mapping.outputs['Vector'], wave.inputs['Vector'])
    nt.links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    nt.links.new(wave.outputs['Fac'], mix_val.inputs[2])
    nt.links.new(noise.outputs['Fac'], mix_val.inputs[3])
    nt.links.new(mix_val.outputs[0], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(mix_val.outputs[0], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def make_leaf_vein_mat():
    m = bpy.data.materials.new('Hoja_Tropical_Nervaduras')
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = 0.52

    tex_coord = nt.nodes.new('ShaderNodeTexCoord')
    mapping = nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (18.0, 18.0, 3.5)

    wave = nt.nodes.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Z'
    wave.inputs['Scale'].default_value = 3.6
    wave.inputs['Distortion'].default_value = 3.5
    wave.inputs['Detail'].default_value = 6.0

    ramp = nt.nodes.new('ShaderNodeValToRGB')
    e0 = ramp.color_ramp.elements[0]
    e0.position = 0.22
    e0.color = (0.04, 0.19, 0.02, 1.0)
    e1 = ramp.color_ramp.elements[1]
    e1.position = 0.52
    e1.color = (0.14, 0.46, 0.07, 1.0)
    e2 = ramp.color_ramp.elements.new(0.78)
    e2.color = (0.34, 0.68, 0.12, 1.0)

    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.85
    bump.inputs['Distance'].default_value = 0.04

    nt.links.new(tex_coord.outputs['Generated'], mapping.inputs['Vector'])
    nt.links.new(mapping.outputs['Vector'], wave.inputs['Vector'])
    nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(wave.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def make_mat(name, color, roughness=0.72, bump_strength=0.0, bump_scale=20.0):
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    if bump_strength > 0:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        ns = nt.nodes.new('ShaderNodeTexNoise')
        ns.inputs['Scale'].default_value = bump_scale
        ns.inputs['Detail'].default_value = 8.0
        bp = nt.nodes.new('ShaderNodeBump')
        bp.inputs['Strength'].default_value = bump_strength
        bp.inputs['Distance'].default_value = 0.035
        nt.links.new(tc.outputs['Object'], ns.inputs['Vector'])
        nt.links.new(ns.outputs['Fac'], bp.inputs['Height'])
        nt.links.new(bp.outputs['Normal'], bsdf.inputs['Normal'])
    return m


mat_coco = make_coco_fiber_mat('Coco_Fibra_Real')
mat_skin = make_coco_fiber_mat(
    'Coco_Extremidad_Fibra',
    dark_col=(0.12, 0.045, 0.012),
    mid_col=(0.36, 0.15, 0.045),
    light_col=(0.56, 0.25, 0.078),
    scale_xy=20.0
)
mat_dark = make_mat('Coco_Interior_Oscuro', (0.015, 0.008, 0.005), roughness=0.95)
mat_paint = make_mat('Pintura_Guerra_Blanca', (0.95, 0.92, 0.84), roughness=0.62, bump_strength=0.25, bump_scale=28.0)
mat_tooth = make_mat('Dientes_Marfil', (0.97, 0.94, 0.86), roughness=0.40)
mat_shell = make_shell_mat()
mat_leaf = make_leaf_vein_mat()
mat_vine = make_coco_fiber_mat(
    'Liana_Trenzada',
    dark_col=(0.18, 0.26, 0.04),
    mid_col=(0.42, 0.54, 0.12),
    light_col=(0.62, 0.72, 0.22),
    scale_xy=30.0
)
mat_wood = make_coco_fiber_mat(
    'Madera_Rama_Vetas',
    dark_col=(0.14, 0.06, 0.015),
    mid_col=(0.36, 0.17, 0.055),
    light_col=(0.55, 0.28, 0.095),
    scale_xy=24.0
)
mat_stone = make_mat('Piedra_Tallada', (0.48, 0.50, 0.52), roughness=0.85, bump_strength=0.70, bump_scale=14.0)
mat_rope = make_coco_fiber_mat(
    'Cuerda_Fibra',
    dark_col=(0.42, 0.28, 0.10),
    mid_col=(0.74, 0.56, 0.24),
    light_col=(0.90, 0.74, 0.38),
    scale_xy=32.0
)


def finish_mesh(obj, mat, outline_thickness=0.012, subsurf=0):
    if obj.type != 'MESH':
        return obj
    for p in obj.data.polygons:
        p.use_smooth = True
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    if subsurf > 0:
        sub = obj.modifiers.new('Subsurf', 'SUBSURF')
        sub.levels = subsurf
        sub.render_levels = subsurf
    if outline_thickness > 0:
        obj.data.materials.append(mat_outline)
        sol = obj.modifiers.new('InkOutline', 'SOLIDIFY')
        sol.thickness = outline_thickness
        sol.offset = 1.0
        sol.use_flip_normals = True
        sol.material_offset = 1
    return obj


# =========================================================
# 2. ESQUELETO COMPLETO (ARMATURE) CON ARTICULACIONES ANATÓMICAS
# =========================================================
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm_obj = bpy.context.object
arm_obj.name = 'Coco_Concha_Rig'
arm_obj.show_in_front = True
arm_data = arm_obj.data
arm_data.name = 'Coco_Concha_Armature'

eb = arm_data.edit_bones
for b in list(eb):
    eb.remove(b)


def add_bone(name, head, tail, parent=None, connect=False):
    b = eb.new(name)
    b.head = Vector(head)
    b.tail = Vector(tail)
    b.roll = 0.0
    if parent:
        b.parent = eb[parent]
        b.use_connect = connect
    return b


# Jerarquía completa de huesos con pivotes exactos en cadera, tobillo, hombro, codo y cuello
add_bone('Root', (0, 0, 0.0), (0, 0, 0.25))
add_bone('Body', (0, 0, 0.38), (0, 0, 1.04), 'Root')
add_bone('Head', (0, 0, 1.04), (0, 0, 1.58), 'Body', connect=True)

# Piernas con pivote en la cadera (z=0.38) y tobillo (z=0.10)
add_bone('Leg.L', (0.18, 0, 0.38), (0.18, 0, 0.10), 'Root')
add_bone('Foot.L', (0.18, 0, 0.10), (0.18, -0.16, 0.04), 'Leg.L', connect=True)
add_bone('Leg.R', (-0.18, 0, 0.38), (-0.18, 0, 0.10), 'Root')
add_bone('Foot.R', (-0.18, 0, 0.10), (-0.18, -0.16, 0.04), 'Leg.R', connect=True)

# Brazo derecho (mazo) con hombro + codo articulado
add_bone('Arm.R', (-0.42, 0, 0.72), (-0.61, -0.06, 0.76), 'Body')
add_bone('Forearm.R', (-0.61, -0.06, 0.76), (-0.69, -0.11, 0.95), 'Arm.R', connect=True)

# Brazo izquierdo con pivote en el hombro
add_bone('Arm.L', (0.42, 0, 0.74), (0.56, -0.04, 0.39), 'Body')

bpy.ops.object.mode_set(mode='OBJECT')


def parent_to_bone(obj, bone_name):
    obj.parent = arm_obj
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name
    bone = arm_obj.data.bones[bone_name]
    tail_mat = bone.matrix_local.copy()
    tail_mat.translation = bone.tail_local
    obj.matrix_parent_inverse = (arm_obj.matrix_world @ tail_mat).inverted()


# =========================================================
# 3. CUERPO DE COCO CON SURCOS 3D REALES ESCULPIDOS EN MALLA
# =========================================================
bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=64, location=(0, 0, 0.74))
cuerpo = bpy.context.object
cuerpo.name = 'Coco_Cuerpo'
cuerpo.scale = (0.47, 0.41, 0.50)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

bm_coco = bmesh.new()
bm_coco.from_mesh(cuerpo.data)
for v in bm_coco.verts:
    co = v.co
    ang = math.atan2(co.y, co.x)
    groove1 = math.sin(ang * 26.0 + co.z * 5.5) * 0.010
    groove2 = math.cos(ang * 45.0 - co.z * 8.0) * 0.0065
    rough = math.sin(co.x * 55.0) * math.cos(co.z * 48.0) * 0.0045
    v.co += v.normal * (groove1 + groove2 + rough)
bmesh.ops.recalc_face_normals(bm_coco, faces=bm_coco.faces)
bm_coco.to_mesh(cuerpo.data)
bm_coco.free()

finish_mesh(cuerpo, mat_coco, outline_thickness=0.015)
parent_to_bone(cuerpo, 'Body')

tuft_specs = [
    (-0.46, -0.04, 0.74, (0, math.radians(-68), math.radians(10)), 0.022, 0.105),
    (-0.45, -0.06, 0.63, (0, math.radians(-58), math.radians(15)), 0.020, 0.095),
    (-0.42, -0.07, 0.53, (0, math.radians(-52), math.radians(12)), 0.018, 0.090),
    (-0.37, -0.08, 0.43, (0, math.radians(-42), math.radians(10)), 0.018, 0.085),
    (0.46, -0.04, 0.74, (0, math.radians(68), math.radians(-10)), 0.022, 0.105),
    (0.45, -0.06, 0.62, (0, math.radians(58), math.radians(-15)), 0.020, 0.095),
    (0.42, -0.07, 0.52, (0, math.radians(52), math.radians(-12)), 0.018, 0.090),
    (0.37, -0.08, 0.42, (0, math.radians(42), math.radians(-10)), 0.018, 0.085),
    (-0.07, -0.10, 0.25, (math.radians(18), math.radians(-14), 0), 0.016, 0.080),
    (0.05, -0.10, 0.24, (math.radians(18), math.radians(16), 0), 0.016, 0.080),
]
for idx, (tx, ty, tz, trot, r1, dp) in enumerate(tuft_specs):
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=r1, radius2=0.002, depth=dp, location=(tx, ty, tz), rotation=trot)
    tf = bpy.context.object
    tf.name = f'Fibra_Mechon_{idx}'
    finish_mesh(tf, mat_coco, outline_thickness=0.005)
    parent_to_bone(tf, 'Body')


# =========================================================
# 4. ROSTRO TRIBAL: 3 POROS + OJOS + BOCA COMPLETA CON COLMILLOS
# =========================================================
pore_coords = [
    ('Poro_Sup_L', (-0.075, -0.375, 1.035), (0.046, 0.028, 0.044)),
    ('Poro_Sup_R', (0.082, -0.375, 1.042), (0.044, 0.028, 0.042)),
    ('Poro_Centro', (0.012, -0.402, 0.955), (0.042, 0.028, 0.042)),
]
for pname, ploc, pscale in pore_coords:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, location=ploc)
    po = bpy.context.object
    po.name = pname
    po.scale = pscale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(po, mat_dark, outline_thickness=0.005)
    parent_to_bone(po, 'Body')

eye_specs = [
    ('L', -0.130, -0.406, 0.84, math.radians(15)),
    ('R', 0.145, -0.404, 0.84, math.radians(-15)),
]
for side, ex, ey, ez, tilt_z in eye_specs:
    bpy.ops.mesh.primitive_torus_add(
        major_segments=28, minor_segments=12,
        major_radius=0.084, minor_radius=0.023,
        location=(ex, ey, ez),
        rotation=(math.radians(82), 0, tilt_z)
    )
    ring = bpy.context.object
    ring.name = f'Pintura_Ojo_{side}'
    ring.scale = (1.02, 1.12, 0.72)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(ring, mat_paint, outline_thickness=0.006)
    parent_to_bone(ring, 'Body')

    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, location=(ex, ey - 0.004, ez))
    eye = bpy.context.object
    eye.name = f'Ojo_{side}'
    eye.scale = (0.068, 0.028, 0.075)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(eye, mat_dark, outline_thickness=0.0)
    parent_to_bone(eye, 'Body')


def build_scowl_mouth():
    mesh_bg = bpy.data.meshes.new('Boca_Fondo_Oscuro_Mesh')
    obj_bg = bpy.data.objects.new('Boca_Fondo_Oscuro', mesh_bg)
    bpy.context.collection.objects.link(obj_bg)

    bm_bg = bmesh.new()
    n_pts = 24
    ring_v = []
    center_v = bm_bg.verts.new((0.0, -0.418, 0.615))
    for i in range(n_pts):
        ang = (i / n_pts) * math.pi * 2.0
        ca, sa = math.cos(ang), math.sin(ang)
        x = 0.225 * ca
        arch = -0.042 * (ca * ca)
        z = 0.615 + 0.105 * sa + arch
        y = -0.418 + 0.022 * ((x / 0.22) ** 2)
        ring_v.append(bm_bg.verts.new((x, y, z)))
    for i in range(n_pts):
        bm_bg.faces.new((ring_v[i], ring_v[(i + 1) % n_pts], center_v))
    bmesh.ops.recalc_face_normals(bm_bg, faces=bm_bg.faces)
    bm_bg.to_mesh(mesh_bg)
    bm_bg.free()
    sol_bg = obj_bg.modifiers.new('BgThick', 'SOLIDIFY')
    sol_bg.thickness = 0.028
    sol_bg.offset = -1.0
    finish_mesh(obj_bg, mat_dark, outline_thickness=0.0)
    parent_to_bone(obj_bg, 'Body')

    mesh_frame = bpy.data.meshes.new('Boca_Marco_Tribal_Mesh')
    obj_frame = bpy.data.objects.new('Boca_Marco_Tribal', mesh_frame)
    bpy.context.collection.objects.link(obj_frame)

    bm = bmesh.new()
    outer_verts = []
    inner_verts = []
    for i in range(n_pts):
        ang = (i / n_pts) * math.pi * 2.0
        ca, sa = math.cos(ang), math.sin(ang)
        arch = -0.042 * (ca * ca)

        ix = 0.205 * ca
        iz = 0.615 + 0.092 * sa + arch
        iy = -0.426 + 0.022 * ((ix / 0.22) ** 2)

        spike = 1.0 + 0.14 * (abs(ca) ** 3.0)
        ox = 0.245 * ca * spike
        oz = 0.615 + (0.128 * sa) * spike + arch
        oy = -0.426 + 0.022 * ((ox / 0.22) ** 2)

        outer_verts.append(bm.verts.new((ox, oy, oz)))
        inner_verts.append(bm.verts.new((ix, iy, iz)))

    for i in range(n_pts):
        ni = (i + 1) % n_pts
        bm.faces.new((outer_verts[i], outer_verts[ni], inner_verts[ni], inner_verts[i]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh_frame)
    bm.free()
    sol = obj_frame.modifiers.new('Solidify', 'SOLIDIFY')
    sol.thickness = 0.022
    sol.offset = 1.0
    finish_mesh(obj_frame, mat_paint, outline_thickness=0.007, subsurf=1)
    parent_to_bone(obj_frame, 'Body')

    for side, sx in [('L', -0.145), ('R', 0.155)]:
        bpy.ops.mesh.primitive_cone_add(
            vertices=8, radius1=0.022, radius2=0.002, depth=0.075,
            location=(sx, -0.410, 0.475), rotation=(math.radians(170), 0, 0)
        )
        drip = bpy.context.object
        drip.name = f'Pintura_Pico_Boca_{side}'
        finish_mesh(drip, mat_paint, outline_thickness=0.005)
        parent_to_bone(drip, 'Body')

    top_teeth_x = [-0.14, -0.07, 0.0, 0.07, 0.14]
    for i, tx in enumerate(top_teeth_x):
        arch_z = -0.040 * ((tx / 0.21) ** 2)
        tz = 0.668 + arch_z
        ty = -0.424 + 0.022 * ((tx / 0.22) ** 2)
        bpy.ops.mesh.primitive_cone_add(
            vertices=10, radius1=0.032, radius2=0.002, depth=0.088,
            location=(tx, ty, tz), rotation=(math.radians(180), 0, 0)
        )
        t = bpy.context.object
        t.name = f'Colmillo_Sup_{i}'
        t.scale = (1.0, 0.45, 1.0)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        finish_mesh(t, mat_tooth, outline_thickness=0.005)
        parent_to_bone(t, 'Body')

    bot_teeth_x = [-0.105, -0.035, 0.035, 0.105]
    for i, tx in enumerate(bot_teeth_x):
        arch_z = -0.040 * ((tx / 0.21) ** 2)
        tz = 0.555 + arch_z
        ty = -0.424 + 0.022 * ((tx / 0.22) ** 2)
        bpy.ops.mesh.primitive_cone_add(
            vertices=10, radius1=0.030, radius2=0.002, depth=0.082,
            location=(tx, ty, tz), rotation=(0, 0, 0)
        )
        t = bpy.context.object
        t.name = f'Colmillo_Inf_{i}'
        t.scale = (1.0, 0.45, 1.0)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        finish_mesh(t, mat_tooth, outline_thickness=0.005)
        parent_to_bone(t, 'Body')


build_scowl_mouth()


# =========================================================
# 5. CASCO DE CARACOL MARINO CON GAJOS ESCULPIDOS Y TEXTURA
# =========================================================
def build_tiered_conch_helmet():
    segs = 64
    tiers = [
        (0.00, 1.04, 0.45, 0.05, 1.24, 0.34, True),
        (0.05, 1.21, 0.36, 0.11, 1.38, 0.26, False),
        (0.11, 1.35, 0.28, 0.17, 1.50, 0.19, False),
        (0.17, 1.48, 0.20, 0.22, 1.61, 0.11, False),
        (0.22, 1.59, 0.12, 0.27, 1.73, 0.015, False),
    ]

    for t_idx, (x0, z0, r0, x1, z1, r1, is_base) in enumerate(tiers):
        mesh = bpy.data.meshes.new(f'Concha_Espiral_{t_idx}_Mesh')
        obj = bpy.data.objects.new(f'Concha_Espiral_{t_idx}', mesh)
        bpy.context.collection.objects.link(obj)

        bm = bmesh.new()
        n_rings = 14
        ring_verts = []

        for r_i in range(n_rings):
            u = r_i / (n_rings - 1)
            cx = x0 + (x1 - x0) * u
            cz = z0 + (z1 - z0) * u
            bulge = math.sin(u * math.pi) * 0.052 * (1.0 - 0.14 * t_idx)
            rad = r0 + (r1 - r0) * u + bulge

            row = []
            for s_i in range(segs):
                ang = (s_i / segs) * math.pi * 2.0
                ca, sa = math.cos(ang), math.sin(ang)

                rib_wave = abs(math.sin(ang * 4.5 + t_idx * 0.55 + u * 0.45))
                flute = 0.082 * (rib_wave ** 0.65) - 0.035
                rx = rad * (1.0 + flute) * 1.04
                ry = rad * (1.0 + flute) * 0.94

                drape = 0.0
                if is_base:
                    w_base = 1.0 - u
                    if ca < 0:
                        drape -= 0.13 * ((-ca) ** 1.35) * w_base
                    if sa < 0:
                        drape += 0.065 * ((-sa) ** 1.6) * w_base
                    if u < 0.28:
                        rx += 0.048 * (1.0 - u / 0.28)

                spiral_z = -0.035 * ca * (1.0 - 0.15 * t_idx)
                vx = cx + rx * ca
                vy = -0.02 + ry * sa
                vz = cz + drape + spiral_z
                row.append(bm.verts.new((vx, vy, vz)))
            ring_verts.append(row)

        for r_i in range(n_rings - 1):
            for s_i in range(segs):
                ns = (s_i + 1) % segs
                bm.faces.new((
                    ring_verts[r_i][s_i],
                    ring_verts[r_i][ns],
                    ring_verts[r_i + 1][ns],
                    ring_verts[r_i + 1][s_i]
                ))

        if t_idx == len(tiers) - 1:
            tip = bm.verts.new((x1 + 0.02, -0.01, z1 + 0.03))
            for s_i in range(segs):
                ns = (s_i + 1) % segs
                bm.faces.new((ring_verts[-1][s_i], ring_verts[-1][ns], tip))

        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()

        sol = obj.modifiers.new('ShellThick', 'SOLIDIFY')
        sol.thickness = 0.024
        sol.offset = -1.0
        finish_mesh(obj, mat_shell, outline_thickness=0.013, subsurf=0)
        parent_to_bone(obj, 'Head')


build_tiered_conch_helmet()


# =========================================================
# 6. BRAZALETES Y TOBILLERAS DE HOJAS CON NERVADURAS Y BORDES INDIVIDUALES
# =========================================================
def build_tropical_cuff(name, loc, radius, leaf_count=8, leaf_len=0.145, rot_euler=(0, 0, 0), bone_name='Body'):
    rot_m = Euler(rot_euler, 'XYZ').to_matrix().to_4x4()
    for r_i, z_off in enumerate([0.024, 0.002]):
        p_world = Vector(loc) + (rot_m @ Vector((0, 0, z_off)))
        bpy.ops.mesh.primitive_torus_add(
            major_segments=24, minor_segments=10,
            major_radius=radius * 1.06, minor_radius=0.015,
            location=p_world, rotation=rot_euler
        )
        band = bpy.context.object
        band.name = f'{name}_Amarre_{r_i}'
        finish_mesh(band, mat_vine, outline_thickness=0.006)
        parent_to_bone(band, bone_name)

    for i in range(leaf_count):
        ang = (i / leaf_count) * math.pi * 2.0
        is_outer = (i % 2 == 0)
        r_offset = 0.008 if is_outer else 0.0

        mesh = bpy.data.meshes.new(f'{name}_Hoja_{i}_Mesh')
        leaf_obj = bpy.data.objects.new(f'{name}_Hoja_{i}', mesh)
        bpy.context.collection.objects.link(leaf_obj)
        leaf_obj.location = loc
        leaf_obj.rotation_euler = rot_euler

        bm = bmesh.new()
        ca, sa = math.cos(ang), math.sin(ang)
        px, py = -sa, ca
        w = 0.045 if is_outer else 0.040
        l_len = leaf_len * (1.05 if is_outer else 0.94)

        s0_r = radius * 0.96 + r_offset
        s1_r = radius + l_len * 0.36 + r_offset
        s2_r = radius + l_len * 0.62 + r_offset
        s3_r = radius + l_len * 0.50 + r_offset

        v0L = bm.verts.new((ca * s0_r + px * (w * 0.45), sa * s0_r + py * (w * 0.45), 0.0))
        v0C = bm.verts.new((ca * (s0_r + 0.008), sa * (s0_r + 0.008), 0.0))
        v0R = bm.verts.new((ca * s0_r - px * (w * 0.45), sa * s0_r - py * (w * 0.45), 0.0))

        v1L = bm.verts.new((ca * s1_r + px * w, sa * s1_r + py * w, -l_len * 0.34))
        v1C = bm.verts.new((ca * (s1_r + 0.018), sa * (s1_r + 0.018), -l_len * 0.32))
        v1R = bm.verts.new((ca * s1_r - px * w, sa * s1_r - py * w, -l_len * 0.34))

        v2L = bm.verts.new((ca * s2_r + px * (w * 0.58), sa * s2_r + py * (w * 0.58), -l_len * 0.70))
        v2C = bm.verts.new((ca * (s2_r + 0.016), sa * (s2_r + 0.016), -l_len * 0.68))
        v2R = bm.verts.new((ca * s2_r - px * (w * 0.58), sa * s2_r - py * (w * 0.58), -l_len * 0.70))

        v_tip = bm.verts.new((ca * s3_r, sa * s3_r, -l_len * 1.05))

        bm.faces.new((v0L, v1L, v1C, v0C))
        bm.faces.new((v0C, v1C, v1R, v0R))
        bm.faces.new((v1L, v2L, v2C, v1C))
        bm.faces.new((v1C, v2C, v2R, v1R))
        bm.faces.new((v2L, v_tip, v2C))
        bm.faces.new((v2C, v_tip, v2R))

        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()

        sol = leaf_obj.modifiers.new('LeafThick', 'SOLIDIFY')
        sol.thickness = 0.012
        finish_mesh(leaf_obj, mat_leaf, outline_thickness=0.006)
        parent_to_bone(leaf_obj, bone_name)


# =========================================================
# 7. DOS BRAZOS Y PIERNAS CON BRAZALETES DE HOJAS Y MAZO TALLADO
# =========================================================
# --- BRAZO DERECHO: Arm.R (hombro) + Forearm.R (codo + mano + mazo) ---
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.052, depth=0.28,
                                    location=(-0.50, -0.04, 0.72),
                                    rotation=(math.radians(10), math.radians(-68), math.radians(12)))
upper_arm_r = bpy.context.object
upper_arm_r.name = 'Brazo_R_Sup'
finish_mesh(upper_arm_r, mat_skin, outline_thickness=0.010)
parent_to_bone(upper_arm_r, 'Arm.R')

bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=14, location=(-0.61, -0.06, 0.76))
elbow_r = bpy.context.object
elbow_r.name = 'Codo_R'
elbow_r.scale = (0.054, 0.054, 0.054)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
finish_mesh(elbow_r, mat_skin, outline_thickness=0.009)
parent_to_bone(elbow_r, 'Forearm.R')

bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.050, depth=0.24,
                                    location=(-0.65, -0.08, 0.85),
                                    rotation=(math.radians(16), math.radians(-22), 0))
fore_arm_r = bpy.context.object
fore_arm_r.name = 'Brazo_R_Ant'
finish_mesh(fore_arm_r, mat_skin, outline_thickness=0.010)
parent_to_bone(fore_arm_r, 'Forearm.R')

build_tropical_cuff('Brazalete_Brazo_R', (-0.665, -0.09, 0.885), 0.054,
                    leaf_count=7, leaf_len=0.115, rot_euler=(math.radians(16), math.radians(-22), 0),
                    bone_name='Forearm.R')

bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=14, location=(-0.69, -0.11, 0.95))
hand_r = bpy.context.object
hand_r.name = 'Mano_R'
hand_r.scale = (0.072, 0.068, 0.068)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
finish_mesh(hand_r, mat_skin, outline_thickness=0.009)
parent_to_bone(hand_r, 'Forearm.R')

for fi, fz in enumerate([0.92, 0.955, 0.99]):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, location=(-0.645, -0.145, fz))
    fng = bpy.context.object
    fng.name = f'Dedo_Mano_R_{fi}'
    fng.scale = (0.036, 0.026, 0.022)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(fng, mat_skin, outline_thickness=0.006)
    parent_to_bone(fng, 'Forearm.R')

hammer_rot = (math.radians(6), math.radians(-16), math.radians(8))
bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.034, depth=0.68,
                                    location=(-0.715, -0.11, 1.09), rotation=hammer_rot)
handle = bpy.context.object
handle.name = 'Mazo_Mango'
finish_mesh(handle, mat_wood, outline_thickness=0.010)
parent_to_bone(handle, 'Forearm.R')

bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.155, location=(-0.76, -0.115, 1.25))
stone = bpy.context.object
stone.name = 'Mazo_Piedra_Tallada'
stone.scale = (1.35, 0.70, 0.80)
stone.rotation_euler = (math.radians(6), math.radians(14), math.radians(-10))
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bm_st = bmesh.new()
bm_st.from_mesh(stone.data)
for v in bm_st.verts:
    n = (math.sin(v.co.x * 25.0) * math.cos(v.co.y * 19.0) + math.sin(v.co.z * 23.0)) * 0.012
    v.co += v.normal * n
bm_st.to_mesh(stone.data)
bm_st.free()
dec = stone.modifiers.new('RockFacets', 'DECIMATE')
dec.ratio = 0.45
finish_mesh(stone, mat_stone, outline_thickness=0.012)
for p in stone.data.polygons:
    p.use_smooth = False
parent_to_bone(stone, 'Forearm.R')

for r_idx, (r_maj, r_loc, r_rot, r_sc) in enumerate([
    (0.132, (-0.76, -0.115, 1.25), (math.radians(58), math.radians(22), math.radians(18)), (0.95, 1.08, 1.05)),
    (0.132, (-0.76, -0.115, 1.25), (math.radians(-55), math.radians(-18), math.radians(-15)), (0.95, 1.08, 1.05)),
    (0.046, (-0.735, -0.112, 1.11), (math.radians(6), math.radians(-16), 0), (1.0, 1.0, 1.0)),
    (0.046, (-0.730, -0.112, 1.08), (math.radians(6), math.radians(-16), 0), (1.0, 1.0, 1.0)),
]):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=26, minor_segments=10,
        major_radius=r_maj, minor_radius=0.015,
        location=r_loc, rotation=r_rot
    )
    rp = bpy.context.object
    rp.name = f'Mazo_Amarre_{r_idx}'
    rp.scale = r_sc
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(rp, mat_rope, outline_thickness=0.006)
    parent_to_bone(rp, 'Forearm.R')


# --- BRAZO IZQUIERDO (+X en vista frontal) ---
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.054, depth=0.34,
                                    location=(0.47, -0.02, 0.62),
                                    rotation=(math.radians(8), math.radians(-22), 0))
arm_l = bpy.context.object
arm_l.name = 'Brazo_L'
finish_mesh(arm_l, mat_skin, outline_thickness=0.010)
parent_to_bone(arm_l, 'Arm.L')

build_tropical_cuff('Brazalete_Brazo_L', (0.53, -0.03, 0.51), 0.058,
                    leaf_count=8, leaf_len=0.135, rot_euler=(math.radians(8), math.radians(-22), 0),
                    bone_name='Arm.L')

bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=14, location=(0.56, -0.04, 0.39))
hand_l = bpy.context.object
hand_l.name = 'Mano_L'
hand_l.scale = (0.082, 0.075, 0.078)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
finish_mesh(hand_l, mat_skin, outline_thickness=0.010)
parent_to_bone(hand_l, 'Arm.L')

for fi, fx in enumerate([0.51, 0.54, 0.57]):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, location=(fx, -0.095, 0.38))
    fng = bpy.context.object
    fng.name = f'Dedo_Mano_L_{fi}'
    fng.scale = (0.024, 0.032, 0.030)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(fng, mat_skin, outline_thickness=0.005)
    parent_to_bone(fng, 'Arm.L')


# --- PIERNAS, BRAZALETES DE HOJAS EN TOBILLOS Y PIES DE 3 DEDOS ---
for side, sx, tilt_y, b_leg, b_foot in [
    ('R', -0.18, math.radians(8), 'Leg.R', 'Foot.R'),
    ('L', 0.18, math.radians(-8), 'Leg.L', 'Foot.L'),
]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.058, depth=0.32,
                                        location=(sx, 0, 0.24), rotation=(0, tilt_y, 0))
    leg = bpy.context.object
    leg.name = f'Pierna_{side}'
    finish_mesh(leg, mat_skin, outline_thickness=0.010)
    parent_to_bone(leg, b_leg)

    build_tropical_cuff(f'Brazalete_Tobillo_{side}', (sx * 1.05, 0, 0.16), 0.062,
                        leaf_count=8, leaf_len=0.12, rot_euler=(0, tilt_y * 0.5, 0),
                        bone_name=b_leg)

    foot_x = sx * 1.08
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=14, location=(foot_x, -0.055, 0.052))
    foot = bpy.context.object
    foot.name = f'Pie_{side}'
    foot.scale = (0.10, 0.145, 0.052)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(foot, mat_skin, outline_thickness=0.010)
    parent_to_bone(foot, b_foot)

    for ti, tx in enumerate([-0.055, 0.0, 0.055]):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10,
                                             location=(foot_x + tx, -0.17, 0.042))
        toe = bpy.context.object
        toe.name = f'Dedo_Pie_{side}_{ti}'
        toe.scale = (0.032, 0.048, 0.028)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        finish_mesh(toe, mat_skin, outline_thickness=0.007)
        parent_to_bone(toe, b_foot)


# =========================================================
# 8. ANIMACIÓN POR HUESOS (KEYFRAMES REALES EN BLENDER)
# =========================================================
def pose_bone_world(bname, rx=0.0, ry=0.0, rz=0.0, loc=(0.0, 0.0, 0.0)):
    pb = arm_obj.pose.bones[bname]
    pb.rotation_mode = 'QUATERNION'
    w_rot = Euler((rx, ry, rz), 'XYZ').to_matrix()
    b_mat = pb.bone.matrix_local.to_3x3()
    l_rot = b_mat.inverted() @ w_rot @ b_mat
    pb.rotation_quaternion = l_rot.to_quaternion()
    pb.location = Vector(loc)


def reset_all_bones():
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)


def keyframe_all_bones(frame_num):
    bpy.context.view_layer.update()
    for pb in arm_obj.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion', frame=frame_num)
        pb.keyframe_insert(data_path='location', frame=frame_num)


def set_walk_pose(phase, yaw_34=math.radians(38)):
    """
    Aplica una pose de caminata armónica de 2 pasos completos con sincronización
    entre piernas (Leg.L / Leg.R), pies (Foot.L / Foot.R), brazos en contrafase
    (Arm.L / Arm.R / Forearm.R), rebote del cuerpo y balanceo secundario del casco.
    """
    reset_all_bones()
    s = math.sin(phase)
    c = math.cos(phase)
    s2 = math.sin(2.0 * phase)
    c2 = math.cos(2.0 * phase)

    # Rebote vertical doble por cada ciclo de 2 pasos (baja en el contacto, sube en el paso)
    bob_z = -c2 * 0.055
    sway_x = c * 0.04

    # Root girado en perfil 3/4 hacia la derecha (+X pantalla)
    pose_bone_world('Root', rx=0.0, ry=0.0, rz=yaw_34, loc=(0.0, 0.0, bob_z))

    # Cuerpo con inclinación de marcha, balanceo y torsión de hombros
    pose_bone_world('Body', rx=math.radians(-7) + s2 * 0.07, ry=sway_x, rz=-s * 0.22)

    # Casco de concha con retraso secundario (overlap) bien visible
    pose_bone_world('Head', rx=c2 * 0.11, ry=-s * 0.10, rz=s * 0.14)

    # Piernas en contrafase: zancada amplia hacia adelante (-Y/+X) y atrás (+Y/-X)
    stride_angle = 0.92
    lift_l = max(0.0, c)   # Pierna L sube al avanzar hacia adelante
    lift_r = max(0.0, -c)  # Pierna R sube en la mitad opuesta del ciclo

    # En Armature space: rx > 0 mueve el pie hacia adelante (-Y), rx < 0 hacia atrás (+Y)
    leg_l_rx = s * stride_angle + lift_l * 0.18
    leg_r_rx = -s * stride_angle + lift_r * 0.18

    # Desplazar y levantar ligeramente la cadera de la pierna que avanza para que la zancada sea aún más clara
    pose_bone_world('Leg.L', rx=leg_l_rx, ry=s * 0.18, rz=0.0, loc=(s * 0.05, -s * 0.06, lift_l * 0.085))
    pose_bone_world('Leg.R', rx=leg_r_rx, ry=-s * 0.18, rz=0.0, loc=(-s * 0.05, s * 0.06, lift_r * 0.085))

    # Articulación de tobillo: talón apoya al frente, punta empuja atrás
    foot_l_rx = -s * 0.35 - lift_l * 0.30
    foot_r_rx = s * 0.35 - lift_r * 0.30
    pose_bone_world('Foot.L', rx=foot_l_rx)
    pose_bone_world('Foot.R', rx=foot_r_rx)

    # Brazos en contrafase con las piernas (cuando Leg.L va adelante, Arm.R con el mazo va adelante)
    pose_bone_world('Arm.L', rx=-s * 0.75, ry=s * 0.20, rz=s * 0.22)
    pose_bone_world('Arm.R', rx=s * 0.65, ry=-s * 0.22, rz=-s * 0.18)
    pose_bone_world('Forearm.R', rx=s * 0.45 - c2 * 0.18, ry=s * 0.15, rz=0.0)


def set_run_pose(phase, yaw_34=math.radians(42)):
    """Pose de carrera veloz (persecución): mayor inclinación, zancada agresiva y mazo listo."""
    reset_all_bones()
    s = math.sin(phase)
    c = math.cos(phase)
    c2 = math.cos(2.0 * phase)

    bob_z = -c2 * 0.095
    pose_bone_world('Root', rz=yaw_34, loc=(0.0, 0.0, bob_z))
    pose_bone_world('Body', rx=math.radians(-16) + c2 * 0.10, ry=c * 0.10, rz=-s * 0.28)
    pose_bone_world('Head', rx=math.radians(8) + c2 * 0.14, rz=s * 0.16)

    lift_l = max(0.0, c)
    lift_r = max(0.0, -c)
    pose_bone_world('Leg.L', rx=s * 1.15 + lift_l * 0.25, ry=s * 0.24, loc=(s * 0.07, -s * 0.08, lift_l * 0.11))
    pose_bone_world('Leg.R', rx=-s * 1.15 + lift_r * 0.25, ry=-s * 0.24, loc=(-s * 0.07, s * 0.08, lift_r * 0.11))
    pose_bone_world('Foot.L', rx=-s * 0.45 - lift_l * 0.35)
    pose_bone_world('Foot.R', rx=s * 0.45 - lift_r * 0.35)

    pose_bone_world('Arm.L', rx=-s * 0.95, ry=s * 0.25, rz=s * 0.28)
    pose_bone_world('Arm.R', rx=s * 0.85, ry=-s * 0.28, rz=-s * 0.25)
    pose_bone_world('Forearm.R', rx=s * 0.55 - 0.22)


def set_jump_pose(step_idx, yaw_34=math.radians(48)):
    """4 fases de salto: 0 agacho, 1 impulso, 2 cénit en el aire, 3 caída."""
    reset_all_bones()
    if step_idx == 0:
        pose_bone_world('Root', rz=yaw_34, loc=(0, 0, -0.08))
        pose_bone_world('Body', rx=math.radians(-16))
        pose_bone_world('Leg.L', rx=0.45, loc=(0, 0, 0.06))
        pose_bone_world('Leg.R', rx=-0.35, loc=(0, 0, 0.06))
        pose_bone_world('Arm.R', rx=0.35)
        pose_bone_world('Arm.L', rx=0.40)
    elif step_idx == 1:
        pose_bone_world('Root', rz=yaw_34, loc=(0, 0, 0.12))
        pose_bone_world('Body', rx=math.radians(8))
        pose_bone_world('Leg.L', rx=-0.55)
        pose_bone_world('Leg.R', rx=0.48)
        pose_bone_world('Arm.R', rx=-0.55)
        pose_bone_world('Forearm.R', rx=-0.35)
        pose_bone_world('Arm.L', rx=-0.65)
    elif step_idx == 2:
        pose_bone_world('Root', rz=yaw_34, loc=(0, 0, 0.18))
        pose_bone_world('Body', rx=math.radians(-6))
        pose_bone_world('Leg.L', rx=-0.72, loc=(0, 0, 0.06))
        pose_bone_world('Leg.R', rx=0.65, loc=(0, 0, 0.05))
        pose_bone_world('Foot.L', rx=0.35)
        pose_bone_world('Foot.R', rx=0.30)
        pose_bone_world('Arm.R', rx=-0.68)
        pose_bone_world('Arm.L', rx=-0.75)
    else:
        pose_bone_world('Root', rz=yaw_34, loc=(0, 0, 0.04))
        pose_bone_world('Body', rx=math.radians(-12))
        pose_bone_world('Leg.L', rx=-0.30)
        pose_bone_world('Leg.R', rx=0.35)
        pose_bone_world('Arm.R', rx=-0.25)
        pose_bone_world('Arm.L', rx=-0.30)


def set_attack_pose(step_idx, yaw_34=math.radians(52)):
    """4 fases de ataque con mazo: 0 carga atrás, 1 tajo descendente, 2 impacto bajo, 3 recuperación."""
    reset_all_bones()
    if step_idx == 0:
        # Carga: levanta el mazo muy alto hacia atrás
        pose_bone_world('Root', rz=yaw_34, loc=(0, 0, 0.03))
        pose_bone_world('Body', rx=math.radians(14), rz=math.radians(16))
        pose_bone_world('Head', rx=math.radians(10))
        pose_bone_world('Leg.L', rx=-0.45)
        pose_bone_world('Leg.R', rx=0.40)
        pose_bone_world('Arm.R', rx=math.radians(48), ry=math.radians(-20))
        pose_bone_world('Forearm.R', rx=math.radians(38))
        pose_bone_world('Arm.L', rx=math.radians(-35))
    elif step_idx == 1:
        # Tajo veloz hacia adelante
        pose_bone_world('Root', rz=yaw_34, loc=(0, 0, 0.01))
        pose_bone_world('Body', rx=math.radians(-18), rz=math.radians(-18))
        pose_bone_world('Leg.L', rx=0.52)
        pose_bone_world('Leg.R', rx=-0.48)
        pose_bone_world('Arm.R', rx=math.radians(-52), ry=math.radians(15))
        pose_bone_world('Forearm.R', rx=math.radians(-58))
        pose_bone_world('Arm.L', rx=math.radians(45))
    elif step_idx == 2:
        # Impacto contundente contra el suelo
        pose_bone_world('Root', rz=yaw_34, loc=(0, 0, -0.05))
        pose_bone_world('Body', rx=math.radians(-26), rz=math.radians(-24))
        pose_bone_world('Head', rx=math.radians(-12))
        pose_bone_world('Leg.L', rx=0.60, loc=(0, 0, 0.04))
        pose_bone_world('Leg.R', rx=-0.52)
        pose_bone_world('Arm.R', rx=math.radians(-78), ry=math.radians(22))
        pose_bone_world('Forearm.R', rx=math.radians(-75))
        pose_bone_world('Arm.L', rx=math.radians(55))
    else:
        # Recuperación
        pose_bone_world('Root', rz=yaw_34, loc=(0, 0, 0.0))
        pose_bone_world('Body', rx=math.radians(-8), rz=math.radians(-6))
        pose_bone_world('Leg.L', rx=0.25)
        pose_bone_world('Leg.R', rx=-0.22)
        pose_bone_world('Arm.R', rx=math.radians(-22))
        pose_bone_world('Forearm.R', rx=math.radians(-18))
        pose_bone_world('Arm.L', rx=math.radians(18))


def set_ko_pose(step_idx, yaw_34=math.radians(45)):
    """3 fases de K.O.: 0 impacto hacia atrás, 1 tumbado de espaldas, 2 mareado."""
    reset_all_bones()
    if step_idx == 0:
        pose_bone_world('Root', rx=math.radians(28), rz=yaw_34, loc=(0, 0, 0.08))
        pose_bone_world('Body', rx=math.radians(22))
        pose_bone_world('Head', rx=math.radians(18))
        pose_bone_world('Leg.L', rx=-0.65)
        pose_bone_world('Leg.R', rx=-0.45)
        pose_bone_world('Arm.R', rx=0.55, ry=-0.35)
        pose_bone_world('Arm.L', rx=0.60, ry=0.35)
    elif step_idx == 1:
        pose_bone_world('Root', rx=math.radians(68), ry=math.radians(-18), rz=yaw_34, loc=(0, 0, -0.18))
        pose_bone_world('Leg.L', rx=-0.45, ry=0.20)
        pose_bone_world('Leg.R', rx=-0.25, ry=-0.20)
        pose_bone_world('Arm.R', rx=0.40, ry=-0.45)
        pose_bone_world('Arm.L', rx=0.45, ry=0.40)
    else:
        pose_bone_world('Root', rx=math.radians(62), ry=math.radians(-12), rz=yaw_34 + 0.15, loc=(0, 0, -0.18))
        pose_bone_world('Head', rz=0.25, rx=-0.12)
        pose_bone_world('Leg.L', rx=-0.25, ry=0.25)
        pose_bone_world('Leg.R', rx=-0.50, ry=-0.15)
        pose_bone_world('Arm.R', rx=0.30, ry=-0.50)
        pose_bone_world('Arm.L', rx=0.35, ry=0.45)


def apply_frame_pose(f_num):
    """Aplica la pose exacta del fotograma f_num (1..32)."""
    if 1 <= f_num <= 16:
        ph = ((f_num - 1) / 16.0) * math.pi * 2.0
        set_walk_pose(ph, yaw_34=math.radians(38))
    elif 17 <= f_num <= 20:
        ph = ((f_num - 17) / 4.0) * math.pi * 2.0
        set_run_pose(ph, yaw_34=math.radians(42))
    elif 21 <= f_num <= 24:
        set_jump_pose(f_num - 21, yaw_34=math.radians(38))
    elif 25 <= f_num <= 28:
        set_attack_pose(f_num - 25, yaw_34=math.radians(42))
    elif 29 <= f_num <= 31:
        set_ko_pose(f_num - 29, yaw_34=math.radians(38))
    else:
        reset_all_bones()


# =========================================================
# 9. GRABAR KEYFRAMES EN LA LÍNEA DE TIEMPO DE BLENDER (FRAMES 1..32)
# =========================================================
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 16
scene.render.fps = 18

for f_num in range(1, 33):
    scene.frame_set(f_num)
    apply_frame_pose(f_num)
    keyframe_all_bones(f_num)


# =========================================================
# 10. ILUMINACIÓN, CÁMARA Y RENDER DE TODOS LOS FOTOGRAMAS
# =========================================================
bpy.ops.object.light_add(type='AREA', location=(2.6, -2.8, 3.0))
key = bpy.context.object
key.data.energy = 580
key.data.size = 2.2
key.data.color = (1.0, 0.94, 0.84)
key.rotation_euler = (math.radians(52), 0, math.radians(38))

bpy.ops.object.light_add(type='AREA', location=(-2.6, -2.2, 1.8))
fill = bpy.context.object
fill.data.energy = 185
fill.data.size = 3.0
fill.data.color = (0.88, 0.94, 1.0)
fill.rotation_euler = (math.radians(65), 0, math.radians(-45))

bpy.ops.object.light_add(type='POINT', location=(0.0, 2.4, 2.4))
rim = bpy.context.object
rim.data.energy = 340
rim.data.color = (1.0, 0.90, 0.72)

bpy.ops.object.camera_add(location=(0.06, -3.55, 0.92))
cam = bpy.context.object
cam.name = 'Camara_Sprites'
cam.data.lens = 52
direction = Vector((0.0, 0.0, 0.86)) - cam.location
cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam

scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'assets'))
frames_tmp_dir = os.path.join(out_dir, '_coco_concha_frames_tmp')
os.makedirs(frames_tmp_dir, exist_ok=True)

blend_path = os.path.join(out_dir, 'coco_concha_3d.blend')
glb_path = os.path.join(out_dir, 'coco_concha_3d.glb')
preview_path = os.path.join(out_dir, 'coco_concha_3d_preview.png')

# Guardar .blend y .glb con toda la animación 1..32
scene.frame_set(1)
apply_frame_pose(1)
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB', export_apply=True)

# Renderizar preview HD en pose de zancada dinámica (Frame 5)
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.frame_set(5)
apply_frame_pose(5)
bpy.context.view_layer.update()
scene.render.filepath = preview_path
bpy.ops.render.render(write_still=True)

# Renderizar los 31 fotogramas de acción (360x480)
scene.render.resolution_x = 360
scene.render.resolution_y = 480
for f_idx in range(1, 32):
    scene.frame_set(f_idx)
    apply_frame_pose(f_idx)
    bpy.context.view_layer.update()
    scene.render.filepath = os.path.join(frames_tmp_dir, f'frame_{f_idx:02d}.png')
    bpy.ops.render.render(write_still=True)

print("ALL_31_FRAMES_RENDERED:", frames_tmp_dir)
