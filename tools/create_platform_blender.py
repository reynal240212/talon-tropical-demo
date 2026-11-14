import bpy
import math
from mathutils import Vector

# Limpieza de la escena.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, roughness=0.8):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.roughness = roughness
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return m

grass = material('Cesped tropical', (0.28, 0.68, 0.08))
grass_dark = material('Borde de cesped', (0.12, 0.38, 0.04))
stone = material('Piedra calida', (0.42, 0.27, 0.14))
stone_light = material('Piedra iluminada', (0.58, 0.38, 0.20))
accent = material('Relieve antiguo', (0.72, 0.48, 0.20), 0.6)
vine_mat = material('Lianas', (0.12, 0.42, 0.07))

def cube(name, location, scale, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Bordes suaves', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
    obj.data.materials.append(mat)
    return obj

# Plataforma base: 6 x 2.6 x 1.5 Blender units.
cube('Plataforma_Piedra_Base', (0, 0, -0.55), (3.0, 1.3, 0.75), stone, 0.12)
cube('Plataforma_Cesped_Superior', (0, 0, 0.28), (3.12, 1.38, 0.16), grass, 0.10)
cube('Plataforma_Borde_Cesped', (0, 0, 0.08), (3.15, 1.42, 0.10), grass_dark, 0.06)

# Bloques frontales que dan volumen y lectura 3D.
for row, z in enumerate((-0.35, -0.95)):
    for col, x in enumerate((-2.25, -0.75, 0.75, 2.25)):
        y = -1.34
        offset = 0.38 if row else 0.0
        cube(f'Bloque_Frontal_{row}_{col}', (x + offset, y, z), (0.64, 0.16, 0.30), stone_light if (row + col) % 2 else stone, 0.07)

# Relieve central sencillo, inspirado en los bloques de la imagen de referencia.
cube('Relieve_Central', (0, -1.53, -0.25), (0.34, 0.06, 0.32), accent, 0.04)
cube('Relieve_Central_Interior', (0, -1.60, -0.25), (0.15, 0.03, 0.14), stone, 0.02)

# Lianas curvas en el frente.
for x in (-2.0, 1.65):
    curve = bpy.data.curves.new(f'Liana_{x}', 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = 0.045
    curve.bevel_resolution = 3
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(3)
    points = [(x, -1.48, 0.05), (x + 0.15, -1.52, -0.45), (x - 0.10, -1.52, -0.85), (x + 0.08, -1.50, -1.15)]
    for bp, co in zip(spline.bezier_points, points):
        bp.co = co
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(f'Liana_{x}', curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(vine_mat)

# Iluminación y cámara de referencia para abrir el .blend.
bpy.ops.object.light_add(type='AREA', location=(0, -5, 6))
light = bpy.context.object
light.name = 'Luz_Suave'
light.data.energy = 900
light.data.shape = 'DISK'
light.data.size = 5
light.rotation_euler = (math.radians(25), 0, 0)

bpy.ops.object.camera_add(location=(7, -10, 6), rotation=(math.radians(67), 0, math.radians(34)))
camera = bpy.context.object
camera.name = 'Camara_Parallax_Referencia'
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1024
scene.render.resolution_y = 576
scene.render.resolution_percentage = 100
scene.world.color = (0.025, 0.08, 0.10)

scene['collision_width'] = 6.0
scene['collision_depth'] = 2.6
scene['collision_height'] = 1.5
scene['collision_top'] = 0.44
scene['purpose'] = 'Prototipo de plataforma tropical 3D para parallax y colision volumetrica'

blend_path = bpy.path.abspath('//assets/plataforma_tropical_prototipo.blend')
gltf_path = bpy.path.abspath('//assets/plataforma_tropical_prototipo.glb')
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
bpy.ops.export_scene.gltf(filepath=gltf_path, export_format='GLB', export_apply=True)

