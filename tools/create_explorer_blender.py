import bpy
import math

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name, color, roughness=.78):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bsdf=m.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value=(*color,1); bsdf.inputs['Roughness'].default_value=roughness
    return m

skin=mat('Piel',(.92,.47,.30)); hair=mat('Cabello',(.22,.09,.045)); band=mat('Panuelo verde',(.48,.62,.08)); shirt=mat('Camisa',(.82,.75,.58)); vest=mat('Chaleco',(.18,.28,.10)); pants=mat('Pantalon',(.19,.12,.08)); boot=mat('Botas',(.16,.08,.04)); pack=mat('Mochila',(.28,.13,.07)); strap=mat('Correas',(.10,.07,.035)); gold=mat('Hebillas',(.78,.46,.08),.55); grass=mat('Cesped',(.28,.68,.08))

def uv(name, loc, scale, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(material); return o

def cube(name, loc, scale, material, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        b=o.modifiers.new('Suavizado','BEVEL'); b.width=bevel; b.segments=2
    o.data.materials.append(material); return o

def cyl(name, loc, radius, depth, material, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=radius, depth=depth, location=loc, rotation=rot)
    o=bpy.context.object; o.name=name; o.data.materials.append(material); b=o.modifiers.new('Suavizado','BEVEL'); b.width=.035; b.segments=2; return o

root=cube('Explorador_Root',(0,0,1.0),(.01,.01,.01),strap,0)
cube('Torso',(0,0,1.12),(.30,.20,.40),vest,.08).parent=root
uv('Camisa',(0,-.005,1.38),(.31,.21,.29),shirt).parent=root
uv('Cabeza',(0,0,1.78),(.28,.25,.30),skin).parent=root
uv('Cabello',(0,.02,2.00),(.31,.27,.16),hair).parent=root
cube('Cinta_Cabeza',(0,-.24,1.84),(.30,.025,.055),band,.025).parent=root
uv('Mochila',(-.34,.06,1.22),(.23,.20,.42),pack).parent=root
cyl('Rollo_Mochila',(-.48,.02,1.40),.105,.18,strap,(0,math.radians(90),0)).parent=root
for side in (-1,1):
    x=.38*side; cyl(f'Brazo_{side}',(x,0,1.28),.105,.43,shirt,(0,math.radians(90),0)).parent=root; uv(f'Mano_{side}',(x+.02*side,-.01,1.06),(.12,.11,.12),skin).parent=root
    x=.16*side; cyl(f'Pierna_{side}',(x,0,.67),.13,.58,pants).parent=root; cyl(f'Bota_{side}',(x-.03*side,-.08,.25),.16,.42,boot).parent=root; cube(f'Vendas_{side}',(x,-.01,.48),(.145,.15,.08),shirt,.025).parent=root
cube('Cinturon',(0,-.225,1.02),(.34,.035,.055),strap,.02).parent=root
cube('Hebilla',(0,-.265,1.02),(.07,.025,.07),gold,.015).parent=root
cube('Suelo_Referencia',(0,0,-.08),(3,2,.08),grass,.02)

bpy.ops.object.light_add(type='AREA', location=(3,-5,5)); light=bpy.context.object; light.data.energy=800; light.data.size=5
bpy.ops.object.camera_add(location=(3.8,-6.5,3.0)); cam=bpy.context.object; cam.name='Camara_Tercera_Persona'; cam.data.lens=48; cam.rotation_euler=(math.radians(72),0,math.radians(30)); bpy.context.scene.camera=cam
scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=768; scene.render.resolution_y=768; scene.render.resolution_percentage=100; scene.world.color=(.025,.08,.10)
scene['master_height']=2.0; scene['master_width']=.72; scene['camera_mode']='fixed_automatic_third_person'; scene['purpose']='Prototipo 3D del explorador basado en sprite maestro'
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath('//assets/explorador_3d_maestro.blend'))
bpy.ops.export_scene.gltf(filepath=bpy.path.abspath('//explorador_3d_maestro.glb'), export_format='GLB', export_apply=True)
