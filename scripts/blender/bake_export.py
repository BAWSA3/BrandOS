"""
Bake the studio (lighting, shadows and materials from Cycles) into one texture
and export a web model: <outdir>/web/studio.gltf + studio.bin + studio.jpg.
The browser then shows the render's look on plain unlit geometry.

Objects are baked separately (into one shared atlas) and only joined after the
bake, so procedural textures keep their own per-object coordinates.

Run: Blender -b <outdir>/studio.blend -P scripts/blender/bake_export.py -- <outdir> [--size 4096] [--samples 128]
"""
import bpy, bmesh, sys, os, math

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def opt(name, default):
    if name in args:
        v = args[args.index(name) + 1]
        del args[args.index(name) : args.index(name) + 2]
        return type(default)(v)
    return default


SIZE = opt("--size", 4096)
SAMPLES = opt("--samples", 128)
OUT = os.path.join(args[0], "web")
os.makedirs(OUT, exist_ok=True)

sc = bpy.context.scene
vl = bpy.context.view_layer
for c in bpy.data.collections:
    c.hide_render = False
    c.hide_viewport = False

SKIP = {"win_glass", "ceiling_shadow", "candle_jar"}  # glass/helpers: not in the web model
stage_cols = sorted([c for c in bpy.data.collections if c.name[:1].isdigit()], key=lambda c: c.name)
geo = [o for c in stage_cols for o in c.all_objects if o.type in ("MESH", "CURVE") and o.name not in SKIP]

# lighter geometry for the web: fewer subdivision levels
for o in geo:
    for m in o.modifiers:
        if m.type == "SUBSURF":
            m.levels = m.render_levels = 2 if m.render_levels > 2 else 1


def select_only(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.hide_set(False)
        o.select_set(True)
    vl.objects.active = active or objs[0]


# realise as plain meshes, still one object each
select_only(geo)
bpy.ops.object.convert(target="MESH")
objs = [o for o in vl.objects if o.select_get()]

# Drop faces no allowed view can see: the web viewer orbits within the room's
# open quadrant (camera on the -x/-y side, above), so faces pointing down, or
# pointing +x/+y without facing up (wall backs, monitor backs), are never seen.
def hidden(n):
    return n.z < -0.3 or (n.z < 0.2 and ((n.x > 0.05 and n.y > 0.05) or n.x > 0.9 or n.y > 0.9))


total = 0
for o in list(objs):
    if o.name == "window_view":  # seen from behind, through the window
        total += len(o.data.polygons)
        continue
    rot = o.matrix_world.to_3x3()
    bm = bmesh.new()
    bm.from_mesh(o.data)
    dead = [f for f in bm.faces if hidden((rot @ f.normal).normalized())]
    if o.name == "slab":  # its top sits entirely under the floor
        dead += [f for f in bm.faces if (rot @ f.normal).normalized().z > 0.9 and f not in dead]
    bmesh.ops.delete(bm, geom=dead, context="FACES")
    bm.to_mesh(o.data)
    bm.free()
    if not o.data.polygons:
        objs.remove(o)
        bpy.data.objects.remove(o, do_unlink=True)
        continue
    total += len(o.data.polygons)
print("objects", len(objs), "faces after cull", total)

# one shared atlas: a 'bake' UV map on every object, unwrapped and packed together
for o in objs:
    uv = o.data.uv_layers.new(name="bake")
    o.data.uv_layers.active = uv
select_only(objs)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0015, area_weight=0.6, scale_to_bounds=True)
bpy.ops.object.mode_set(mode="OBJECT")

# bake target in every material (shared by all objects)
img = bpy.data.images.new("studio_bake", SIZE, SIZE, alpha=False, float_buffer=True)
mats = {s.material for o in objs for s in o.material_slots if s.material}
for m in mats:
    nt = m.node_tree
    n = nt.nodes.new("ShaderNodeTexImage")
    n.image = img
    uvn = nt.nodes.new("ShaderNodeUVMap")
    uvn.uv_map = "bake"
    nt.links.new(uvn.outputs["UV"], n.inputs["Vector"])
    for x in nt.nodes:
        x.select = False
    n.select = True
    nt.nodes.active = n

sc.render.engine = "CYCLES"
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = False
bk = sc.render.bake
bk.margin = 6
select_only(objs)
print("baking", SIZE, "px,", SAMPLES, "samples,", len(objs), "objects")
bpy.ops.object.bake(type="COMBINED", pass_filter={"DIRECT", "INDIRECT", "DIFFUSE", "GLOSSY", "TRANSMISSION", "EMIT"})

# save through the scene's view transform (display-referred, like the renders)
sc.render.image_settings.file_format = "JPEG"
sc.render.image_settings.quality = 90
img.save_render(os.path.join(OUT, "studio.jpg"), scene=sc)
print("saved", os.path.join(OUT, "studio.jpg"))

# join, keep only the bake UVs, one material with the baked texture
select_only(objs)
bpy.ops.object.join()
studio = vl.objects.active
studio.name = "studio"
me = studio.data
for name in [l.name for l in me.uv_layers if l.name != "bake"]:
    me.uv_layers.remove(me.uv_layers[name])
web = bpy.data.materials.new("studio_baked")
web.use_nodes = True
nt = web.node_tree
tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = bpy.data.images.load(os.path.join(OUT, "studio.jpg"))
nt.links.new(tex.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
me.materials.clear()
me.materials.append(web)

select_only([studio])
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "studio.gltf"),
    export_format="GLTF_SEPARATE",
    use_selection=True,
    export_texcoords=True,
    export_normals=False,
    export_materials="EXPORT",
    export_image_format="JPEG",
    export_apply=True,
    export_yup=True,
)
for f in sorted(os.listdir(OUT)):
    print("web", f, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB")
