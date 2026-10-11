"""
BrandOS brand station as a photoreal collectible miniature, modelled from code.
BUILD.EXE first (matches public/worlds/stations/build-exe-day.png); the kit
(plinth, panel blocks, windows, roof props) is shared so the other archetypes
can reuse it.

Run:
  Blender -b -P scripts/blender/station.py -- <outdir> [--night]           (builds + saves station.blend)
  Blender -b <outdir>/station.blend -P scripts/blender/render_stages.py -- <outdir>
  Blender    -P scripts/blender/station.py -- <outdir> [--night] --watch   (builds live in the UI)
"""
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
WATCH = "--watch" in ARGS
ANIM = "--anim" in ARGS  # keyframe the 6s seamless loop (render with render_anim.py)
NIGHT = "--night" in ARGS
ARCH = "build-exe"
if "--archetype" in ARGS:
    ARCH = ARGS[ARGS.index("--archetype") + 1]
    del ARGS[ARGS.index("--archetype") : ARGS.index("--archetype") + 2]
ARCHES = ("build-exe", "arc", "entropy", "foresight", "freq", "null", "relay", "source")
if ARCH not in ARCHES:
    raise SystemExit(f"unknown archetype {ARCH!r}; one of {ARCHES}")
print("archetype", ARCH)
SAMPLES = 256
if "--samples" in ARGS:
    SAMPLES = int(ARGS[ARGS.index("--samples") + 1])
    del ARGS[ARGS.index("--samples") : ARGS.index("--samples") + 2]
ARGS = [a for a in ARGS if not a.startswith("--")]
OUT = ARGS[0] if ARGS else "/tmp/station"
os.makedirs(OUT, exist_ok=True)
DECALS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "decals")

if WATCH:
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
ORDER = []


# ================================================================ materials
def lin(h):
    h = h.lstrip("#")
    s = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in s) + (1,)


MATS = {}


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    MATS[name] = m
    return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]


def noise_bump(nt, b, scale, strength):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = 8
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = strength
    bp.inputs["Distance"].default_value = 0.002
    nt.links.new(n.outputs["Fac"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])


def plastic(name, color, rough=0.32, coat=0.15, grain=0.0):
    """Moulded plastic (satin, faint texture), like a premium toy."""
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = lin(color)
    b.inputs["Roughness"].default_value = rough
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.2
    if grain:
        noise_bump(nt, b, 900, grain)
    wear(nt, b, color)
    return m


def wear(nt, b, color, amount=1.0):
    """Corners catch light scuffs, recesses collect soft grime (convexity from Pointiness)."""
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    grime = nt.nodes.new("ShaderNodeMapRange")  # 1 in cavities
    grime.inputs["From Min"].default_value = 0.5
    grime.inputs["From Max"].default_value = 0.44
    nt.links.new(geo.outputs["Pointiness"], grime.inputs["Value"])
    scuff = nt.nodes.new("ShaderNodeMapRange")  # 1 on sharp convex edges
    scuff.inputs["From Min"].default_value = 0.53
    scuff.inputs["From Max"].default_value = 0.6
    nt.links.new(geo.outputs["Pointiness"], scuff.inputs["Value"])
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 60
    n.inputs["Detail"].default_value = 10
    breakup = nt.nodes.new("ShaderNodeMath")
    breakup.operation = "MULTIPLY"
    nt.links.new(scuff.outputs["Result"], breakup.inputs[0])
    nt.links.new(n.outputs["Fac"], breakup.inputs[1])
    base = lin(color)
    c1 = nt.nodes.new("ShaderNodeMix")
    c1.data_type = "RGBA"
    c1.inputs[6].default_value = base
    c1.inputs[7].default_value = tuple(v * 0.62 for v in base[:3]) + (1,)
    g = nt.nodes.new("ShaderNodeMath")
    g.operation = "MULTIPLY"
    g.inputs[1].default_value = 0.55 * amount
    nt.links.new(grime.outputs["Result"], g.inputs[0])
    nt.links.new(g.outputs[0], c1.inputs["Factor"])
    c2 = nt.nodes.new("ShaderNodeMix")
    c2.data_type = "RGBA"
    c2.inputs[7].default_value = tuple(min(1, v * 1.25 + 0.06) for v in base[:3]) + (1,)
    nt.links.new(c1.outputs[2], c2.inputs[6])
    w = nt.nodes.new("ShaderNodeMath")
    w.operation = "MULTIPLY"
    w.inputs[1].default_value = 0.9 * amount
    nt.links.new(breakup.outputs[0], w.inputs[0])
    nt.links.new(w.outputs[0], c2.inputs["Factor"])
    nt.links.new(c2.outputs[2], b.inputs["Base Color"])


def metal(name, color, rough=0.28, brushed=False):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = lin(color)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Roughness"].default_value = rough
    if brushed:
        b.inputs["Anisotropic"].default_value = 0.6
        noise_bump(nt, b, 300, 0.02)
    return m


def glow(name, color, strength, base="#05060A"):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = lin(base)
    b.inputs["Roughness"].default_value = 0.2
    b.inputs["Emission Color"].default_value = lin(color)
    b.inputs["Emission Strength"].default_value = strength
    return m


def screen(name, strength):
    """CRT screen: Klein-blue glow with a soft vignette, under glossy glass."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    gr = nt.nodes.new("ShaderNodeTexGradient")
    gr.gradient_type = "SPHERICAL"
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (0.5, 0.5, 0.5)
    mp.inputs["Scale"].default_value = (1.4, 1.4, 1.4)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], gr.inputs["Vector"])
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].color = lin("#001E9C")
    r.color_ramp.elements[1].color = lin("#1A55FF")
    nt.links.new(gr.outputs["Fac"], r.inputs["Fac"])
    # code on the screen: a tall strip of text, scrolled through a window of the screen
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(sep.outputs["X"], comb.inputs["X"])
    nt.links.new(sep.outputs["Z"], comb.inputs["Y"])
    scroll = nt.nodes.new("ShaderNodeMapping")
    scroll.name = "code_scroll"
    scroll.inputs["Scale"].default_value = (0.92, 0.3, 1.0)
    scroll.inputs["Location"].default_value = (0.04, 0.35, 0.0)
    nt.links.new(comb.outputs["Vector"], scroll.inputs["Vector"])
    code = nt.nodes.new("ShaderNodeTexImage")
    code.image = bpy.data.images.load(os.path.join(DECALS, "crt_code.png"))
    code.extension = "REPEAT"
    nt.links.new(scroll.outputs["Vector"], code.inputs["Vector"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    nt.links.new(r.outputs["Color"], mix.inputs[6])
    nt.links.new(code.outputs["Color"], mix.inputs[7])
    a = nt.nodes.new("ShaderNodeMath")
    a.operation = "MULTIPLY"
    a.inputs[1].default_value = 0.85
    nt.links.new(code.outputs["Alpha"], a.inputs[0])
    nt.links.new(a.outputs[0], mix.inputs["Factor"])
    nt.links.new(mix.outputs[2], b.inputs["Emission Color"])
    # scanlines: fine horizontal bands modulate the glow
    wv = nt.nodes.new("ShaderNodeTexWave")
    wv.bands_direction = "Z"
    wv.inputs["Scale"].default_value = 90.0
    nt.links.new(tc.outputs["Generated"], wv.inputs["Vector"])
    sl = nt.nodes.new("ShaderNodeMapRange")
    sl.inputs["To Min"].default_value = strength * 0.72
    sl.inputs["To Max"].default_value = strength
    nt.links.new(wv.outputs["Fac"], sl.inputs["Value"])
    nt.links.new(sl.outputs["Result"], b.inputs["Emission Strength"])
    b.inputs["Base Color"].default_value = lin("#02040A")
    b.inputs["Roughness"].default_value = 0.05
    b.inputs["Coat Weight"].default_value = 0.25
    b.inputs["Coat Roughness"].default_value = 0.05
    return m


def glass(name):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = (1, 1, 1, 1)
    b.inputs["Transmission Weight"].default_value = 1.0
    b.inputs["IOR"].default_value = 1.45
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 14
    n.inputs["Detail"].default_value = 12
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 0.45
    mr.inputs["From Max"].default_value = 0.75
    mr.inputs["To Min"].default_value = 0.01
    mr.inputs["To Max"].default_value = 0.07
    nt.links.new(n.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
    return m


def pegboard(name):
    """Perforated steel: a grid of dark holes."""
    m, nt, b = new_mat(name)
    b.inputs["Metallic"].default_value = 0.8
    b.inputs["Roughness"].default_value = 0.4
    tc = nt.nodes.new("ShaderNodeTexCoord")
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.inputs["Scale"].default_value = 30.0
    br.inputs["Brick Width"].default_value = 1.0
    br.inputs["Row Height"].default_value = 1.0
    br.inputs["Mortar Size"].default_value = 0.0
    br.offset = 0.0
    nt.links.new(tc.outputs["Object"], br.inputs["Vector"])
    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.inputs["Scale"].default_value = 30.0
    v.inputs["Randomness"].default_value = 0.0
    nt.links.new(tc.outputs["Object"], v.inputs["Vector"])
    hole = nt.nodes.new("ShaderNodeMath")
    hole.operation = "LESS_THAN"
    hole.inputs[1].default_value = 0.16
    nt.links.new(v.outputs["Distance"], hole.inputs[0])
    mx = nt.nodes.new("ShaderNodeMix")
    mx.data_type = "RGBA"
    mx.inputs[6].default_value = lin("#B9BBC2")
    mx.inputs[7].default_value = lin("#101218")
    nt.links.new(hole.outputs[0], mx.inputs["Factor"])
    nt.links.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def decal_mat(name, file, rough=0.45, metallic=0.0):
    """Printed label: image colour + alpha over whatever is behind."""
    m, nt, b = new_mat(name)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(DECALS, file))
    tex.interpolation = "Cubic"
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    return m


if NIGHT:  # Terminal OS: graphite shell, steel, green + blue glow
    SHELL, SHADE, SEAM, ACC, GLOW, GLOW2 = "#2A3240", "#1E2531", "#0B0F16", "#0047FF", "#0A84FF", "#00FF88"
else:  # BrandOS day: off-white shell, Klein blue
    SHELL, SHADE, SEAM, ACC, GLOW, GLOW2 = "#E4E4E8", "#BFC0C7", "#4A4B52", "#0047FF", "#2F6BFF", "#2F6BFF"
plastic("shell", SHELL, rough=0.4, grain=0.015)
plastic("shell_shade", SHADE, grain=0.015)
plastic("seam", SEAM, rough=0.6, coat=0)
plastic("key", "#F4F4F6" if not NIGHT else "#3A4352", rough=0.38, grain=0.02)
plastic("interior", "#2A3046" if not NIGHT else "#0C111A", rough=0.7, coat=0)
plastic("rubber", "#121316", rough=0.75, coat=0)
plastic("crate_grey", "#9A9CA6" if not NIGHT else "#3D4D61", rough=0.45)
metal("klein", ACC, rough=0.3)  # anodised aluminium
metal("steel", "#C4C6CC", rough=0.22, brushed=True)
metal("screw", "#A9ABB2", rough=0.3)
glow("led", ACC, 3.0 if NIGHT else 1.2)
glow("led2", GLOW2, 4.0 if NIGHT else 1.2)
glow("lamp", "#FFE2B0", 8.0, base="#FFF4DE")
glow("signface", "#F4F7FF", 2.5 if NIGHT else 1.0, base="#F4F4F6")
screen("crt", 2.8 if NIGHT else 2.0)
glass("glass")
pegboard("pegboard")
for i in range(12):
    decal_mat(f"keylegend{i}", f"{ARCH}/key{i}.png", rough=0.5)
decal_mat("plate", f"{ARCH}/plate.png", rough=0.35)
decal_mat("checker", "checker.png", rough=0.25)
decal_mat("rack", "rack.png", rough=0.4)
decal_mat("shield", "shield.png", rough=0.4, metallic=0.3)
plastic("book_ink", "#22252B", rough=0.6, coat=0)
plastic("book_bone", "#E6E1D6", rough=0.6, coat=0)
plastic("book_blue", "#0B2E99", rough=0.6, coat=0)
plastic("beige", "#D8D0BC", rough=0.45)
plastic("wood", "#8A5A34", rough=0.5)
metal("mirror", "#E8EAF0", rough=0.08)
glow("bulb", "#FFE9B8", 6.0 if NIGHT else 3.0, base="#FFF6DD")
glow("stars", "#BFD3FF", 1.5, base="#0A1230")


def leaf_mat(name, color):
    """Waxy leaf with light passing through (translucency mixed in)."""
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = lin(color)
    b.inputs["Roughness"].default_value = 0.38
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    tr.inputs["Color"].default_value = lin(color)
    mx = nt.nodes.new("ShaderNodeMixShader")
    mx.inputs["Fac"].default_value = 0.22
    nt.links.new(b.outputs["BSDF"], mx.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mx.inputs[2])
    nt.links.new(mx.outputs["Shader"], nt.nodes["Material Output"].inputs["Surface"])
    return m


leaf_mat("leaf", "#2F6B2C")
leaf_mat("leaf_light", "#4A8A3A")
plastic("soil", "#3B2A1E", rough=1.0, coat=0)
decal_mat("serial", "serial.png", rough=0.5)
decal_mat("chevron", "chevron.png", rough=0.5)

# ================================================================ build helpers
COL = bpy.data.collections.new("station")
scene.collection.children.link(COL)


def place(o, m, bevel=0.0, seg=3, sub=0, smooth=None):
    ORDER.append(o)
    if m:
        o.data.materials.append(MATS[m])
    for c in list(o.users_collection):
        c.objects.unlink(o)
    COL.objects.link(o)
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = seg
        mod.limit_method = "ANGLE"
        mod.harden_normals = not sub
    if sub:
        mod = o.modifiers.new("subsurf", "SUBSURF")
        mod.levels = mod.render_levels = sub
    sm = smooth if smooth is not None else bool(bevel or sub)
    for p in o.data.polygons:
        p.use_smooth = sm
    return o


def box(name, x0, x1, y0, y1, z0, z1, m, bevel=0.02, sub=0, rot=(0, 0, 0)):
    """Box by extents (pilot convention)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = (x1 - x0, y1 - y0, z1 - z0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return place(o, m, bevel, sub=sub)


def cyl(name, c, r, h, m, rot=(0, 0, 0), verts=40, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=c, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return place(o, m, bevel, smooth=True)


def rod(name, a, b, r, m):
    va, vb = Vector(a), Vector(b)
    d = vb - va
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=r, depth=d.length, location=(va + vb) / 2)
    o = bpy.context.active_object
    o.name = name
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    return place(o, m, smooth=True)


def tube(name, pts, r, m):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 4
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        bp = sp.bezier_points[i]
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    o = bpy.data.objects.new(name, cu)
    scene.collection.objects.link(o)
    o.data.materials.append(MATS[m])
    for c in list(o.users_collection):
        c.objects.unlink(o)
    COL.objects.link(o)
    ORDER.append(o)
    return o


def cut(target, x0, x1, y0, y1, z0, z1):
    """Boolean an opening into a block (windows, garage)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    c = bpy.context.active_object
    c.scale = (x1 - x0, y1 - y0, z1 - z0)
    c.name = target.name + "_cutter"
    c.hide_render = True
    c.hide_set(True)
    mod = target.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = c
    mod.solver = "EXACT"
    # boolean before the bevel so the opening edges get rounded too
    target.modifiers.move(len(target.modifiers) - 1, 0)
    return c


def screws(face, pts, r=0.035):
    """Pan-head screws on a face: face = ('-y', y) or ('+x', x)."""
    axis, v = face
    for i, (a, z) in enumerate(pts):
        if axis == "-y":
            cyl(f"screw_{len(ORDER)}", (a, v - 0.012, z), r, 0.024, "screw", rot=(math.pi / 2, 0, 0), verts=16, bevel=0.008)
        else:
            cyl(f"screw_{len(ORDER)}", (v + 0.012, a, z), r, 0.024, "screw", rot=(0, math.pi / 2, 0), verts=16, bevel=0.008)


def decal(name, m, center, w, h, facing):
    """A thin label plane: facing '+z' (keycap tops), '-y' (front face) or '+x' (right face)."""
    rot = {"+z": (0, 0, 0), "-y": (math.pi / 2, 0, 0), "+x": (math.pi / 2, 0, math.pi / 2)}[facing]
    bpy.ops.mesh.primitive_plane_add(size=1, location=center, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return place(o, m, smooth=False)


def seam_h(name, y, x0, x1, z):  # horizontal panel seam on the front face
    box(name, x0, x1, y - 0.012, y + 0.004, z - 0.012, z + 0.012, "seam", bevel=0)


def seam_v_side(name, x, y0, y1, z0, z1):  # vertical seam on the right face
    box(name, x - 0.004, x + 0.012, y0 - 0.012 + (y1 - y0) / 2, y0 + 0.012 + (y1 - y0) / 2, z0, z1, "seam", bevel=0)


# ================================================================ dimensions (match the 2D art: a slim tower on a plinth)
PL = 1.85  # plinth half width
X0, X1, Y0, Y1 = -0.75, 1.45, -0.45, 1.55  # tower footprint (front face at Y0, right face at X1), set back-right
Z0, Z1, Z2 = 0.5, 2.55, 4.45  # ground floor, upper floor, roof

# ================================================================ archetype modules
# Every station shares the kit (plinth, keycaps, garage, window, cubby, sign, CRT);
# these fill the garage, the window, the right-side cubby and the roof per archetype.
ROLE = {
    "arc": dict(garage="library", window="study", cubby="rocket", roof="crane"),
    "entropy": dict(garage="desk", window="trading", cubby="locker", roof="lamp"),
    "foresight": dict(garage="maptable", window="charts", cubby="orrery", roof="dome"),
    "freq": dict(garage="stage", window="arcade", cubby="speaker", roof="disco"),
    "null": dict(garage="closed", window="blinds", cubby="shield", roof="turret"),
    "relay": dict(garage="diner", window="servers", cubby="crates", roof="dishes"),
    "source": dict(garage="library", window="library", cubby="cabinet", roof="lamp_plant"),
}.get(ARCH, {})


def shelf_of_books(tag, x0, x1, y_back, depth, z, n):
    """A shelf board with a row of books of varied height and colour."""
    box(f"{tag}_board", x0, x1, y_back - depth, y_back, z - 0.012, z, "wood", bevel=0.004)
    x = x0 + 0.02
    cols = ("book_ink", "book_bone", "book_blue", "book_ink", "klein")
    for k in range(n):
        w = 0.035 + 0.02 * ((k * 7) % 3) / 2
        if x + w > x1 - 0.02:
            break
        h = 0.14 + 0.05 * ((k * 5) % 4) / 3
        box(f"{tag}_book{k}", x, x + w, y_back - depth + 0.02, y_back - 0.01, z, z + h, cols[k % 5], bevel=0.003)
        x += w + 0.006


def bookcase(tag, x0, x1, y_back, z0, z1, depth=0.2):
    for k, z in enumerate([z0 + 0.03 + i * (z1 - z0) / 3.2 for i in range(3)]):
        shelf_of_books(f"{tag}{k}", x0, x1, y_back, depth, z, 14)


def monitor(tag, cx, cy, z, w=0.22, h=0.14, face="-y"):
    box(f"{tag}_case", cx - w / 2, cx + w / 2, cy - 0.015, cy + 0.015, z, z + h, "rubber", bevel=0.006)
    box(f"{tag}_scr", cx - w / 2 + 0.012, cx + w / 2 - 0.012, cy - 0.018, cy - 0.015, z + 0.012, z + h - 0.012, "crt", bevel=0)
    box(f"{tag}_stand", cx - 0.012, cx + 0.012, cy - 0.01, cy + 0.01, z - 0.06, z, "steel", bevel=0)


def desk(tag, x0, x1, y0, y1, z, legs=True):
    box(f"{tag}_top", x0, x1, y0, y1, z - 0.04, z, "shell_shade", bevel=0.006)
    if legs:
        for x in (x0 + 0.04, x1 - 0.04):
            box(f"{tag}_leg{x}", x - 0.018, x + 0.018, y0 + 0.03, y1 - 0.03, z - 0.04 - (z - 0.04 - floor_z(z)), z - 0.04, "steel", bevel=0.003)


def floor_z(z):
    return WZ0 if z > Z1 else Z0


def chair(tag, cx, cy, z0):
    box(f"{tag}_seat", cx - 0.09, cx + 0.09, cy - 0.09, cy + 0.09, z0 + 0.2, z0 + 0.24, "klein", bevel=0.015)
    box(f"{tag}_back", cx - 0.09, cx + 0.09, cy + 0.07, cy + 0.1, z0 + 0.24, z0 + 0.45, "klein", bevel=0.015)
    rod(f"{tag}_post", (cx, cy, z0), (cx, cy, z0 + 0.2), 0.015, "steel")


def garage_interior():
    kind = ROLE["garage"]
    gy0, gy1 = Y0 + 0.02, Y0 + 0.4  # usable depth
    if kind == "library":
        bookcase("g_books", GX0 + 0.05, GX1 - 0.05, gy1, Z0 + 0.02, GZ1 - 0.1)
        desk("g_desk", GX0 + 0.35, GX1 - 0.35, gy0 + 0.05, gy0 + 0.22, Z0 + 0.42)
    elif kind == "desk":
        desk("g_desk", GX0 + 0.1, GX1 - 0.1, gy0 + 0.15, gy1 - 0.02, Z0 + 0.45)
        monitor("g_mon", (GX0 + GX1) / 2, gy1 - 0.08, Z0 + 0.52, 0.32, 0.2)
        chair("g_chair", (GX0 + GX1) / 2, gy0 + 0.05, Z0)
    elif kind == "maptable":
        box("g_table", GX0 + 0.15, GX1 - 0.15, gy0 + 0.05, gy1 - 0.05, Z0 + 0.4, Z0 + 0.45, "wood", bevel=0.008)
        box("g_map", GX0 + 0.2, GX1 - 0.2, gy0 + 0.08, gy1 - 0.08, Z0 + 0.45, Z0 + 0.455, "crt", bevel=0)
        for x in (GX0 + 0.2, GX1 - 0.2):
            box(f"g_tleg{x}", x - 0.02, x + 0.02, gy0 + 0.1, gy1 - 0.1, Z0, Z0 + 0.4, "wood", bevel=0.004)
        bookcase("g_books", GX0 + 0.05, GX1 - 0.05, gy1 + 0.0, Z0 + 0.7, GZ1 - 0.05, depth=0.12)
    elif kind == "stage":
        decal("g_checker", "checker", ((GX0 + GX1) / 2, (gy0 + gy1) / 2, Z0 + 0.025), GX1 - GX0, gy1 - gy0, "+z")
        box("g_stage", GX0 + 0.1, GX1 - 0.1, gy1 - 0.2, gy1, Z0 + 0.02, Z0 + 0.12, "rubber", bevel=0.01)
        rod("g_micstand", ((GX0 + GX1) / 2, gy0 + 0.15, Z0 + 0.02), ((GX0 + GX1) / 2, gy0 + 0.15, Z0 + 0.62), 0.008, "steel")
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.03, location=((GX0 + GX1) / 2, gy0 + 0.15, Z0 + 0.65))
        place(bpy.context.active_object, "steel", smooth=True)
        for x in (GX0 + 0.15, GX1 - 0.15):
            box(f"g_amp{x}", x - 0.1, x + 0.1, gy1 - 0.18, gy1 - 0.02, Z0 + 0.12, Z0 + 0.42, "rubber", bevel=0.01)
    elif kind == "diner":
        box("g_counter", GX0 + 0.08, GX1 - 0.08, gy1 - 0.16, gy1, Z0, Z0 + 0.42, "shell_shade", bevel=0.01)
        box("g_counter_top", GX0 + 0.05, GX1 - 0.05, gy1 - 0.19, gy1, Z0 + 0.42, Z0 + 0.45, "klein", bevel=0.008)
        for k in range(3):
            x = GX0 + 0.3 + k * 0.32
            rod(f"g_stool{k}", (x, gy0 + 0.1, Z0), (x, gy0 + 0.1, Z0 + 0.3), 0.012, "steel")
            cyl(f"g_stool_top{k}", (x, gy0 + 0.1, Z0 + 0.31), 0.07, 0.03, "klein", bevel=0.01)
            cyl(f"g_cup{k}", (x, gy1 - 0.1, Z0 + 0.48), 0.025, 0.06, "key", bevel=0.004)
    elif kind == "closed":
        pass  # NULL keeps its secrets: the door is closed (garage_front)


def garage_front():
    kind = ROLE["garage"]
    if kind == "closed":  # ribbed steel door + keypad
        box("g_door", GX0, GX1, Y0 - 0.01, Y0 + 0.03, Z0 + 0.02, GZ1, "steel", bevel=0.01)
        for k in range(8):
            z = Z0 + 0.12 + k * (GZ1 - Z0 - 0.2) / 7
            box(f"g_door_rib{k}", GX0 + 0.04, GX1 - 0.04, Y0 - 0.022, Y0 - 0.008, z - 0.01, z + 0.01, "seam", bevel=0)
        box("g_keypad", GX1 + 0.05, GX1 + 0.15, Y0 - 0.03, Y0, Z0 + 0.7, Z0 + 0.85, "rubber", bevel=0.01)
        box("g_keypad_led", GX1 + 0.08, GX1 + 0.12, Y0 - 0.035, Y0 - 0.028, Z0 + 0.8, Z0 + 0.82, "led2", bevel=0)
        return
    for i in range(5):  # rolled shutter
        box(f"shutter_slat{i}", GX0, GX1, Y0 - 0.06, Y0 + 0.0, GZ1 - 0.32 + i * 0.065, GZ1 - 0.27 + i * 0.065, "klein", bevel=0.01)
    if kind == "stage":  # marquee bulbs around the opening
        n = 9
        for k in range(n):
            x = GX0 + 0.02 + k * (GX1 - GX0 - 0.04) / (n - 1)
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.028, location=(x, Y0 - 0.05, GZ1 - 0.36))
            place(bpy.context.active_object, "bulb", smooth=True).name = f"bulb_top{k}"
        for side in (GX0 - 0.05, GX1 + 0.05):
            for k in range(6):
                z = Z0 + 0.12 + k * 0.17
                bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.028, location=(side, Y0 - 0.03, z))
                place(bpy.context.active_object, "bulb", smooth=True).name = f"bulb_side{side:.2f}_{k}"


def window_interior():
    kind = ROLE["window"]
    wy0, wy1 = Y0 + 0.03, Y0 + 0.46
    zf = WZ0 + 0.02
    if kind in ("study", "library"):
        bookcase("w_books", WX0 + 0.08, WX0 + 0.75, wy1, zf, WZ1 - 0.08)
        desk("w_desk", WX0 + 0.8, WX1 - 0.08, wy0 + 0.12, wy1 - 0.02, zf + 0.4)
        if kind == "library":  # retro beige computer
            box("w_pc", WX0 + 0.9, WX1 - 0.2, wy1 - 0.2, wy1 - 0.04, zf + 0.4, zf + 0.48, "beige", bevel=0.01)
            box("w_pc_mon", WX0 + 0.95, WX1 - 0.25, wy1 - 0.19, wy1 - 0.06, zf + 0.48, zf + 0.68, "beige", bevel=0.02)
            box("w_pc_scr", WX0 + 0.98, WX1 - 0.28, wy1 - 0.195, wy1 - 0.19, zf + 0.51, zf + 0.65, "crt", bevel=0.01)
        else:
            monitor("w_mon", (WX0 + 0.8 + WX1 - 0.08) / 2, wy1 - 0.08, zf + 0.47, 0.26, 0.16)
            rod("w_lamp", (WX1 - 0.15, wy1 - 0.08, zf + 0.4), (WX1 - 0.2, wy1 - 0.15, zf + 0.7), 0.01, "steel")
        chair("w_chair", (WX0 + 0.8 + WX1 - 0.08) / 2, wy0 + 0.02, zf)
    elif kind == "trading":
        desk("w_desk", WX0 + 0.08, WX1 - 0.08, wy0 + 0.12, wy1 - 0.02, zf + 0.4)
        cx = (WX0 + WX1) / 2
        for r in range(2):
            for c in range(3):
                monitor(f"w_mon{r}{c}", cx + (c - 1) * 0.3, wy1 - 0.08, zf + 0.47 + r * 0.2, 0.28, 0.17)
        chair("w_chair", cx, wy0 + 0.02, zf)
    elif kind == "charts":
        cyl("w_chart", ((WX0 + WX1) / 2 - 0.25, wy1 - 0.01, (WZ0 + WZ1) / 2 + 0.15), 0.38, 0.01, "stars", rot=(math.pi / 2, 0, 0), verts=64)
        box("w_chart2", WX1 - 0.45, WX1 - 0.1, wy1 - 0.02, wy1 - 0.01, WZ0 + 0.55, WZ1 - 0.2, "stars", bevel=0)
        desk("w_desk", WX0 + 0.1, WX1 - 0.1, wy0 + 0.1, wy0 + 0.3, zf + 0.38)
        rod("w_scope", (WX0 + 0.35, wy0 + 0.2, zf + 0.38), (WX0 + 0.5, wy0 + 0.25, zf + 0.62), 0.03, "klein")
    elif kind == "arcade":
        ax = (WX0 + WX1) / 2
        box("w_cab", ax - 0.2, ax + 0.2, wy1 - 0.3, wy1 - 0.02, zf, zf + 0.95, "klein", bevel=0.02)
        box("w_cab_scr", ax - 0.15, ax + 0.15, wy1 - 0.305, wy1 - 0.29, zf + 0.55, zf + 0.82, "crt", bevel=0.01)
        box("w_cab_panel", ax - 0.2, ax + 0.2, wy1 - 0.42, wy1 - 0.28, zf + 0.42, zf + 0.48, "rubber", bevel=0.01)
        rod("w_cab_stick", (ax - 0.08, wy1 - 0.36, zf + 0.48), (ax - 0.08, wy1 - 0.36, zf + 0.56), 0.008, "steel")
        for side in (WX0 + 0.18, WX1 - 0.18):
            box(f"w_spk{side}", side - 0.13, side + 0.13, wy1 - 0.25, wy1 - 0.02, zf, zf + 0.6, "rubber", bevel=0.015)
            for z in (zf + 0.18, zf + 0.42):
                cyl(f"w_cone{side}{z}", (side, wy1 - 0.255, z), 0.08, 0.02, "seam", rot=(math.pi / 2, 0, 0), verts=32)
    elif kind == "blinds":
        for k in range(16):
            z = WZ0 + 0.05 + k * (WZ1 - WZ0 - 0.1) / 15
            box(f"w_slat{k}", WX0 + 0.02, WX1 - 0.02, Y0 + 0.04, Y0 + 0.06, z - 0.025, z + 0.025, "shell_shade", bevel=0.004, rot=(0.35, 0, 0))
    elif kind == "servers":
        for k in range(3):
            x = WX0 + 0.12 + k * 0.42
            box(f"w_rack{k}", x, x + 0.36, wy1 - 0.3, wy1 - 0.02, zf, WZ1 - 0.1, "rubber", bevel=0.01)
            decal(f"w_rack_face{k}", "rack", (x + 0.18, wy1 - 0.305, (zf + WZ1 - 0.1) / 2), 0.32, WZ1 - 0.1 - zf - 0.06, "-y")
            for j in range(10):
                box(f"w_rack_led{k}{j}", x + 0.04, x + 0.07, wy1 - 0.31, wy1 - 0.305, zf + 0.12 + j * 0.11, zf + 0.14 + j * 0.11, "led2" if (j + k) % 3 else "led", bevel=0)


def cubby():
    kind = ROLE["cubby"]
    if kind == "locker":  # ENTROPY: a closed double locker door instead of a cubby
        box("locker", X1, X1 + 0.03, Y0 + 0.2, Y0 + 1.05, Z1 + 0.25, Z2 - 0.25, "shell_shade", bevel=0.012)
        box("locker_split", X1 + 0.03, X1 + 0.035, Y0 + 0.62, Y0 + 0.63, Z1 + 0.25, Z2 - 0.25, "seam", bevel=0)
        for y in (Y0 + 0.55, Y0 + 0.7):
            rod(f"locker_handle{y}", (X1 + 0.05, y, Z1 + 0.85), (X1 + 0.05, y, Z1 + 1.1), 0.01, "steel")
        return
    if kind == "shield":  # NULL: an embossed shield emblem
        box("shield_plate", X1, X1 + 0.02, Y0 + 0.3, Y0 + 0.95, Z1 + 0.4, Z1 + 1.05, "shell_shade", bevel=0.02)
        decal("shield", "shield", (X1 + 0.022, Y0 + 0.625, Z1 + 0.725), 0.58, 0.58, "+x")
        return
    cut(U, X1 - 0.45, X1 + 0.1, Y0 + 0.2, Y0 + 1.05, Z1 + 0.35, Z1 + 1.35)
    box("cubby_back", X1 - 0.47, X1 - 0.43, Y0 + 0.2, Y0 + 1.05, Z1 + 0.35, Z1 + 1.35, "interior", bevel=0)
    box("balcony_box", X1, X1 + 0.42, Y0 + 0.15, Y0 + 1.1, Z1 + 0.05, Z1 + 0.45, "shell", bevel=0.03)
    for y in (Y0 + 0.17, Y0 + 0.62, Y0 + 1.08):
        rod(f"bal_post{y}", (X1 + 0.4, y, Z1 + 0.45), (X1 + 0.4, y, Z1 + 0.95), 0.02, "steel")
    rod("bal_rail", (X1 + 0.4, Y0 + 0.17, Z1 + 0.95), (X1 + 0.4, Y0 + 1.08, Z1 + 0.95), 0.025, "steel")
    cx, cy, cz = X1 + 0.05, Y0 + 0.62, Z1 + 0.45
    if kind == "rocket":
        cyl("rocket_body", (cx, cy, cz + 0.32), 0.1, 0.5, "key", verts=40, bevel=0.01)
        cyl("rocket_nose", (cx, cy, cz + 0.68), 0.1, 0.22, "klein", verts=40, rot=(0, 0, 0))
        bpy.data.objects["rocket_nose"].modifiers.clear()
        bpy.ops.object.select_all(action="DESELECT")
        for k in range(3):
            a = k * 2 * math.pi / 3
            box(f"rocket_fin{k}", cx + 0.1 * math.cos(a) - 0.01, cx + 0.1 * math.cos(a) + 0.01, cy + 0.1 * math.sin(a) - 0.06, cy + 0.1 * math.sin(a) + 0.06, cz, cz + 0.18, "klein", bevel=0.005, rot=(0, 0, a))
        cyl("rocket_window", (cx - 0.1, cy, cz + 0.42), 0.04, 0.01, "crt", rot=(0, math.pi / 2, 0), verts=24)
    elif kind == "orrery":
        cyl("orrery_base", (cx, cy, cz + 0.04), 0.1, 0.08, "wood", bevel=0.01)
        rod("orrery_post", (cx, cy, cz + 0.08), (cx, cy, cz + 0.4), 0.01, "steel")
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.07, location=(cx, cy, cz + 0.42))
        place(bpy.context.active_object, "bulb", smooth=True).name = "orrery_sun"
        for k, (r, ang) in enumerate(((0.18, 0.3), (0.26, 2.2), (0.32, 4.1))):
            bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.004, location=(cx, cy, cz + 0.42), rotation=(0.25, 0, 0))
            place(bpy.context.active_object, "steel", smooth=True).name = f"orrery_ring{k}"
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.03 + 0.01 * k, location=(cx + r * math.cos(ang), cy + r * math.sin(ang), cz + 0.42))
            place(bpy.context.active_object, "klein" if k % 2 else "crate_grey", smooth=True).name = f"orrery_planet{k}"
    elif kind == "speaker":
        box("spk_box", cx - 0.2, cx + 0.15, cy - 0.32, cy + 0.32, cz, cz + 0.7, "rubber", bevel=0.02)
        for z in (cz + 0.2, cz + 0.5):
            cyl(f"spk_cone{z}", (cx + 0.155, cy, z), 0.12, 0.02, "seam", rot=(0, math.pi / 2, 0), verts=40)
            cyl(f"spk_cap{z}", (cx + 0.165, cy, z), 0.04, 0.02, "steel", rot=(0, math.pi / 2, 0), verts=24)
    elif kind == "crates":
        box("crate_a", X1 - 0.3, X1 + 0.08, Y0 + 0.28, Y0 + 0.62, cz, cz + 0.33, "crate_grey", bevel=0.03)
        box("crate_b", X1 - 0.25, X1 + 0.1, Y0 + 0.66, Y0 + 0.98, cz, cz + 0.27, "klein", bevel=0.03)
    elif kind == "cabinet":
        box("cab", cx - 0.25, cx + 0.12, cy - 0.22, cy + 0.22, cz, cz + 0.62, "crate_grey", bevel=0.012)
        for k in range(3):
            z = cz + 0.1 + k * 0.2
            box(f"cab_drawer{k}", cx + 0.12, cx + 0.13, cy - 0.2, cy + 0.2, z - 0.08, z + 0.08, "shell_shade", bevel=0.004)
            box(f"cab_pull{k}", cx + 0.13, cx + 0.15, cy - 0.06, cy + 0.06, z + 0.03, z + 0.045, "steel", bevel=0.002)


def leaf(tag, base, length, width, yaw, pitch, mat, curl=0.3):
    """Curved, tapered leaf along +X (face up), placed at base and aimed by yaw/pitch."""
    me = bpy.data.meshes.new(tag)
    bm = bmesh.new()
    rows = []
    segs = 10
    for i in range(segs + 1):
        t = i / segs
        w = width * math.sin(math.pi * t) ** 0.85
        z = -curl * (t ** 2) * length
        rows.append([bm.verts.new((t * length, j * w / 2, z + abs(j) * w * 0.18)) for j in (-1, -0.5, 0, 0.5, 1)])
    for i in range(segs):
        for j in range(4):
            bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(tag, me)
    scene.collection.objects.link(o)
    o.location = base
    o.rotation_euler = (0, -pitch, yaw)
    place(o, mat, sub=1, smooth=True)
    so = o.modifiers.new("thick", "SOLIDIFY")
    so.thickness = 0.003
    return o


def potted_plant(tag, x, y, z0, scale=1.0):
    """Ceramic pot (Klein blue), soil, and a fountain of arching leaves."""
    cyl(f"{tag}_pot", (x, y, z0 + 0.08 * scale), 0.1 * scale, 0.16 * scale, "klein", bevel=0.01)
    cyl(f"{tag}_rim", (x, y, z0 + 0.165 * scale), 0.107 * scale, 0.02 * scale, "klein", bevel=0.006)
    cyl(f"{tag}_soil", (x, y, z0 + 0.155 * scale), 0.092 * scale, 0.01, "soil")
    for k in range(14):
        a = k * 2.39996
        pitch = 0.9 - 0.45 * ((k * 7) % 5) / 4
        leaf(f"{tag}_leaf{k}", (x + 0.02 * math.cos(a), y + 0.02 * math.sin(a), z0 + 0.16 * scale), (0.2 + 0.08 * ((k * 3) % 4) / 3) * scale, 0.07 * scale, a, pitch, "leaf_light" if k % 3 == 0 else "leaf", curl=0.55)


def dish_mesh(tag, radius=0.42, depth=0.13, segs=48, rings=14):
    """Parabolic reflector (opening +Z, vertex at the origin) with a rolled rim."""
    me = bpy.data.meshes.new(tag)
    bm = bmesh.new()
    rings_v = []
    centre = bm.verts.new((0, 0, 0))
    for i in range(1, rings + 1):
        r = radius * i / rings
        z = depth * (r / radius) ** 2
        rings_v.append([bm.verts.new((r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), z)) for k in range(segs)])
    for k in range(segs):
        bm.faces.new((centre, rings_v[0][k], rings_v[0][(k + 1) % segs]))
    for i in range(rings - 1):
        for k in range(segs):
            a, b_ = rings_v[i][k], rings_v[i][(k + 1) % segs]
            c, d = rings_v[i + 1][(k + 1) % segs], rings_v[i + 1][k]
            bm.faces.new((a, d, c, b_))
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(tag, me)
    scene.collection.objects.link(o)
    return o


def satellite_dish(tag, x, y, z0, aim_dir, radius=0.42):
    """Post + yoke + parabolic dish aimed along aim_dir, with three struts to a feed horn."""
    d = Vector(aim_dir).normalized()
    rod(f"{tag}_post", (x, y, z0), (x, y, z0 + 0.5), 0.035, "steel")
    hub = Vector((x, y, z0 + 0.62))
    box(f"{tag}_yoke", x - 0.05, x + 0.05, y - 0.05, y + 0.05, z0 + 0.48, z0 + 0.6, "shell_shade", bevel=0.01)
    o = dish_mesh(f"{tag}_reflector", radius=radius)
    o.location = hub
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    place(o, "shell", smooth=True)
    so = o.modifiers.new("thick", "SOLIDIFY")
    so.thickness = 0.018
    bpy.context.view_layer.update()
    focus = hub + d * (radius * radius / (4 * 0.13))
    q = o.rotation_quaternion
    for k in range(3):
        a = k * 2 * math.pi / 3
        rim = hub + q @ Vector((radius * 0.92 * math.cos(a), radius * 0.92 * math.sin(a), 0.12))
        rod(f"{tag}_strut{k}", tuple(rim), tuple(focus), 0.008, "steel")
    cyl(f"{tag}_feed", tuple(focus), 0.035, 0.09, "klein", bevel=0.008)
    feed = bpy.data.objects[f"{tag}_feed"]
    feed.rotation_mode = "QUATERNION"
    feed.rotation_quaternion = q


def antenna(tag, x, y, h=0.9):
    rod(f"{tag}", (x, y, Z2 + 0.12), (x, y, Z2 + 0.12 + h), 0.012, "steel")
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, radius=0.035, location=(x, y, Z2 + 0.14 + h))
    place(bpy.context.active_object, "klein", smooth=True)


def roof_props():
    kind = ROLE["roof"]
    R = Z2 + 0.12
    if kind == "crane":  # scaffolding over the front + a tower crane holding a crate
        for x in (X0 + 0.1, X0 + 0.75, X1 - 0.1):
            for y in (Y0 + 0.1, Y0 + 0.8):
                rod(f"scaf{x}{y}", (x, y, R), (x, y, R + 0.75), 0.02, "steel")
        for z in (R + 0.38, R + 0.75):
            rod(f"scaf_f{z}", (X0 + 0.1, Y0 + 0.1, z), (X1 - 0.1, Y0 + 0.1, z), 0.018, "steel")
            rod(f"scaf_b{z}", (X0 + 0.1, Y0 + 0.8, z), (X1 - 0.1, Y0 + 0.8, z), 0.018, "steel")
        box("scaf_plank", X0 + 0.1, X1 - 0.1, Y0 + 0.1, Y0 + 0.8, R + 0.74, R + 0.77, "wood", bevel=0.005)
        mx, my = X1 - 0.3, Y0 + 1.15
        box("crane_mast", mx - 0.07, mx + 0.07, my - 0.07, my + 0.07, R, R + 1.6, "klein", bevel=0.01)
        for k in range(8):
            z = R + 0.1 + k * 0.19
            rod(f"crane_lace{k}", (mx - 0.075, my - 0.075, z), (mx + 0.075, my - 0.075, z + 0.17), 0.008, "steel")
        # jib runs along +x/-y (toward the viewer's right), counterweight behind
        box("crane_jib", mx - 0.05, mx + 0.05, my - 1.25, my + 0.4, R + 1.6, R + 1.7, "klein", bevel=0.01)
        box("crane_cab", mx - 0.1, mx + 0.1, my - 0.1, my + 0.1, R + 1.48, R + 1.62, "shell", bevel=0.02)
        box("crane_weight", mx - 0.08, mx + 0.08, my + 0.25, my + 0.4, R + 1.48, R + 1.62, "crate_grey", bevel=0.01)
        rod("crane_cable", (mx, my - 1.05, R + 1.6), (mx, my - 1.05, R + 1.02), 0.006, "rubber")
        box("crane_crate", mx - 0.12, mx + 0.12, my - 1.17, my - 0.93, R + 0.78, R + 1.02, "klein", bevel=0.02)
    elif kind in ("lamp", "lamp_plant"):  # a desk lamp, an antenna, a little equipment box
        rod("roof_lamp_arm1", (X0 + 0.3, Y0 + 0.3, R), (X0 + 0.38, Y0 + 0.3, R + 0.4), 0.018, "steel")
        rod("roof_lamp_arm2", (X0 + 0.38, Y0 + 0.3, R + 0.4), (X0 + 0.62, Y0 + 0.3, R + 0.52), 0.016, "steel")
        cyl("roof_lamp_head", (X0 + 0.66, Y0 + 0.3, R + 0.46), 0.07, 0.11, "klein", rot=(0, 0.6, 0))
        antenna("roof_antenna", X1 - 0.15, Y1 - 0.15)
        box("roof_box", X1 - 0.55, X1 - 0.15, Y0 + 0.15, Y0 + 0.5, R, R + 0.25, "shell_shade", bevel=0.02)
        for k in range(3):
            cyl(f"roof_box_led{k}", (X1 - 0.45 + k * 0.08, Y0 + 0.148, R + 0.15), 0.014, 0.01, "led2", rot=(math.pi / 2, 0, 0), verts=16)
        if kind == "lamp_plant":
            potted_plant("roof_plant", X1 - 0.4, Y1 - 0.3, R, scale=1.3)
    elif kind == "dome":  # observatory with a telescope poking out
        dx, dy = X1 - 0.5, Y0 + 0.55
        cyl("dome_drum", (dx, dy, R + 0.15), 0.42, 0.3, "shell", bevel=0.02, verts=64)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=0.42, location=(dx, dy, R + 0.3))
        dm = bpy.context.active_object
        dm.name = "dome"
        bm = bmesh.new()
        bm.from_mesh(dm.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.001], context="VERTS")
        bm.to_mesh(dm.data)
        bm.free()
        place(dm, "shell", smooth=True)
        box("dome_slit", dx - 0.06, dx + 0.06, dy - 0.44, dy, R + 0.3, R + 0.74, "interior", bevel=0.01, rot=(0.0, 0, 0))
        rod("telescope", (dx, dy - 0.1, R + 0.45), (dx - 0.05, dy - 0.62, R + 0.9), 0.07, "klein")
        antenna("roof_antenna", X0 + 0.15, Y1 - 0.15, 0.7)
    elif kind == "disco":  # disco ball on a bent arm + a giant joystick
        rod("disco_post", (X0 + 0.15, Y0 + 0.15, R), (X0 + 0.15, Y0 + 0.15, R + 1.0), 0.025, "steel")
        rod("disco_arm", (X0 + 0.15, Y0 + 0.15, R + 1.0), (X0 - 0.2, Y0 + 0.15, R + 1.0), 0.02, "steel")
        rod("disco_string", (X0 - 0.2, Y0 + 0.15, R + 1.0), (X0 - 0.2, Y0 + 0.15, R + 0.85), 0.005, "rubber")
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.17, location=(X0 - 0.2, Y0 + 0.15, R + 0.68))
        place(bpy.context.active_object, "mirror", smooth=False).name = "disco_ball"
        jx, jy = X1 - 0.35, Y1 - 0.4
        box("joy_base", jx - 0.22, jx + 0.22, jy - 0.22, jy + 0.22, R, R + 0.16, "rubber", bevel=0.04)
        rod("joy_stick", (jx, jy, R + 0.16), (jx + 0.05, jy - 0.05, R + 0.75), 0.03, "steel")
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.1, location=(jx + 0.05, jy - 0.05, R + 0.8))
        place(bpy.context.active_object, "klein", smooth=True).name = "joy_knob"
        cyl("joy_button", (jx + 0.12, jy - 0.15, R + 0.17), 0.04, 0.04, "led", verts=24, bevel=0.01)
    elif kind == "turret":  # a sealed vent turret, antenna, a box
        cyl("turret", (X1 - 0.4, Y1 - 0.45, R + 0.22), 0.2, 0.44, "steel", bevel=0.02, verts=48)
        cyl("turret_cap", (X1 - 0.4, Y1 - 0.45, R + 0.48), 0.26, 0.06, "shell", bevel=0.02, verts=48)
        for k in range(6):
            a = k * math.pi / 3
            box(f"turret_slot{k}", X1 - 0.4 + 0.2 * math.cos(a) - 0.01, X1 - 0.4 + 0.2 * math.cos(a) + 0.01, Y1 - 0.45 + 0.2 * math.sin(a) - 0.05, Y1 - 0.45 + 0.2 * math.sin(a) + 0.05, R + 0.15, R + 0.35, "seam", bevel=0, rot=(0, 0, a))
        antenna("roof_antenna", X1 - 0.12, Y0 + 0.2)
        box("roof_box", X0 + 0.2, X0 + 0.6, Y0 + 0.2, Y0 + 0.55, R, R + 0.22, "shell_shade", bevel=0.02)
    elif kind == "dishes":  # two satellite dishes + thick cables down the side
        satellite_dish("dish0", X0 + 0.4, Y0 + 0.45, R, (-0.45, -0.6, 0.65))
        satellite_dish("dish1", X1 - 0.4, Y0 + 0.5, R, (0.55, -0.55, 0.65), radius=0.36)
        for k, off in enumerate((0.0, 0.07)):
            tube(f"relay_cable{k}", [(X1 - 0.3, Y1 - 0.3 + off, R + 0.05), (X1 + 0.06, Y1 - 0.35 + off, R - 0.1), (X1 + 0.08, Y1 - 0.35 + off, Z0 + 0.4), (X1 + 0.25, Y1 - 0.2 + off, Z0 + 0.03), (X1 + 0.3, Y0 - 0.4 + off, Z0 + 0.03)], 0.03, "klein" if k else "rubber")
        antenna("roof_antenna", X0 + 0.15, Y1 - 0.15, 1.0)


def extras():
    if ARCH == "entropy":  # Klein-blue patterned band between floors + dice on the plinth
        for o in ("band_front", "band_right"):
            if o in bpy.data.objects:
                bpy.data.objects[o].data.materials[0] = MATS["klein"]
        for k, (dx, dy, rz) in enumerate(((X1 + 0.15, Y0 - 0.55, 0.3), (X1 - 0.1, Y0 - 0.85, 0.9))):
            box(f"die{k}", dx - 0.12, dx + 0.12, dy - 0.12, dy + 0.12, Z0, Z0 + 0.24, "key", bevel=0.04, sub=1, rot=(0, 0, rz))
            for j in range(3):
                bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=0.025, location=(dx - 0.06 + j * 0.06, dy - 0.06 + j * 0.06, Z0 + 0.245))
                place(bpy.context.active_object, "klein", smooth=True)


# ================================================================ plinth + keycap step
box("plinth", -PL, PL, -PL, PL, 0.0, 0.38, "shell_shade", bevel=0.08)
box("plinth_top", -PL + 0.1, PL - 0.1, -PL + 0.1, PL - 0.1, 0.38, Z0, "shell", bevel=0.05)
box("plinth_led_front", -PL + 0.1, PL - 0.1, -PL - 0.02, -PL + 0.01, 0.15, 0.22, "led", bevel=0.008)
box("plinth_led_right", PL - 0.01, PL + 0.02, -PL + 0.1, PL - 0.1, 0.15, 0.22, "led", bevel=0.008)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f"foot{sx}{sy}", (sx * (PL - 0.25), sy * (PL - 0.25), -0.04), 0.12, 0.08, "rubber", bevel=0.02)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f"plinth_screw{sx}{sy}", (sx * (PL - 0.22), sy * (PL - 0.22), Z0 + 0.008), 0.045, 0.02, "screw", verts=20, bevel=0.008)
# keycap step: two rows in front of the garage
for row in range(2):
    for i in range(6):
        x0 = -1.7 + i * 0.44
        y0 = -1.72 + row * 0.42
        box(f"key{row}{i}", x0, x0 + 0.39, y0, y0 + 0.37, Z0, Z0 + 0.24, "key", bevel=0.05, sub=1)
        idx = i if row == 1 else 6 + i  # back row: B U I L D .  front row: E X E ⌘ ↵ ⇧
        decal(f"keylegend{row}{i}", f"keylegend{idx}", (x0 + 0.195, y0 + 0.185, Z0 + 0.2415), 0.2, 0.2, "+z")

# ================================================================ ground floor: garage (front), door + port (right)
G = box("ground", X0, X1, Y0, Y1, Z0, Z1, "shell", bevel=0.045)
GX0, GX1, GZ1 = X0 + 0.12, X0 + 1.3, Z0 + 1.35
cut(G, GX0, GX1, Y0 - 0.1, Y0 + 0.42, Z0 + 0.02, GZ1)
box("garage_back", GX0, GX1, Y0 + 0.4, Y0 + 0.44, Z0, GZ1, "interior", bevel=0)
box("garage_floor", GX0, GX1, Y0, Y0 + 0.42, Z0, Z0 + 0.02, "shell_shade", bevel=0)
if ARCH == "build-exe":
    box("bench_top", GX0 + 0.12, GX1 - 0.12, Y0 + 0.1, Y0 + 0.38, Z0 + 0.48, Z0 + 0.53, "shell_shade", bevel=0.008)
    for x in (GX0 + 0.16, GX1 - 0.16):
        box(f"bench_leg{x}", x - 0.025, x + 0.025, Y0 + 0.12, Y0 + 0.36, Z0, Z0 + 0.48, "steel", bevel=0.004)
    box("bot_body", GX0 + 0.42, GX0 + 0.68, Y0 + 0.14, Y0 + 0.34, Z0 + 0.53, Z0 + 0.75, "key", bevel=0.035, sub=1)
    for k, dx in enumerate((0.5, 0.6)):
        cyl(f"bot_eye{k}", (GX0 + dx, Y0 + 0.135, Z0 + 0.66), 0.03, 0.02, "led", rot=(math.pi / 2, 0, 0), verts=20)
    box("toolbox", GX0 + 0.05, GX0 + 0.33, Y0 + 0.08, Y0 + 0.3, Z0 + 0.02, Z0 + 0.18, "klein", bevel=0.02)
    box("toolbox2", GX1 - 0.32, GX1 - 0.06, Y0 + 0.12, Y0 + 0.34, Z0 + 0.02, Z0 + 0.15, "klein", bevel=0.02)
else:
    garage_interior()
cyl("garage_lamp", (GX0 + 0.2, Y0 + 0.4, GZ1 - 0.18), 0.07, 0.06, "klein", rot=(math.pi / 2, 0, 0))
bpy.ops.object.light_add(type="POINT", location=((GX0 + GX1) / 2, Y0 + 0.2, GZ1 - 0.2))
gl = bpy.context.active_object
gl.data.energy = 18 if NIGHT else 3
gl.data.color = (1.0, 0.85, 0.65)
gl.data.shadow_soft_size = 0.08
ORDER.append(gl)
if ARCH == "build-exe":
    # rolled shutter (Klein-blue slats) + awning over the garage
    for i in range(5):
        box(f"shutter_slat{i}", GX0, GX1, Y0 - 0.06, Y0 + 0.0, GZ1 - 0.32 + i * 0.065, GZ1 - 0.27 + i * 0.065, "klein", bevel=0.01)
else:
    garage_front()
box("awning", GX0 - 0.1, GX1 + 0.1, Y0 - 0.62, Y0, GZ1 + 0.1, GZ1 + 0.16, "shell", bevel=0.02)
box("awning_edge", GX0 - 0.1, GX1 + 0.1, Y0 - 0.66, Y0 - 0.58, GZ1 + 0.04, GZ1 + 0.16, "klein", bevel=0.012)
for x in (GX0 - 0.05, GX1 + 0.05):
    rod(f"awning_strut{x}", (x, Y0, GZ1 - 0.2), (x, Y0 - 0.55, GZ1 + 0.1), 0.014, "steel")
# indicator column right of the garage
box("indicator", GX1 + 0.18, GX1 + 0.4, Y0 - 0.05, Y0 + 0.01, Z0 + 0.25, GZ1 + 0.1, "klein", bevel=0.02)
for i in range(4):
    box(f"indicator_lamp{i}", GX1 + 0.22, GX1 + 0.36, Y0 - 0.07, Y0 - 0.04, Z0 + 0.35 + i * 0.27, Z0 + 0.55 + i * 0.27, "led2", bevel=0.01)
seam_h("seam_g1", Y0, X0, X1, Z1)
screws(("-y", Y0), [(X0 + 0.08, Z0 + 0.12), (X0 + 0.08, Z1 - 0.12), (X1 - 0.08, Z0 + 0.12), (X1 - 0.08, Z1 - 0.12)])
# right face: door panel, vents, port + cable, grille
box("side_door", X1, X1 + 0.03, Y0 + 0.95, Y1 - 0.2, Z0 + 0.1, Z1 - 0.35, "shell_shade", bevel=0.01)
box("side_door_seam", X1 + 0.03, X1 + 0.035, Y0 + 0.95, Y1 - 0.2, Z0 + 1.05, Z0 + 1.07, "seam", bevel=0)
for i in range(4):
    box(f"vent{i}", X1, X1 + 0.04, Y0 + 0.25, Y0 + 0.75, Z1 - 0.35 - i * 0.1, Z1 - 0.31 - i * 0.1, "seam", bevel=0.005)
box("port_plate", X1, X1 + 0.04, Y0 + 0.25, Y0 + 0.75, Z0 + 0.25, Z0 + 0.75, "shell_shade", bevel=0.01)
for j, z in enumerate((Z0 + 0.38, Z0 + 0.62)):
    cyl(f"port{j}", (X1 + 0.06, Y0 + 0.42, z), 0.05, 0.05, "klein", rot=(0, math.pi / 2, 0), verts=24, bevel=0.01)
tube("cable", [(X1 + 0.08, Y0 + 0.42, Z0 + 0.38), (X1 + 0.3, Y0 + 0.5, Z0 + 0.2), (X1 + 0.32, Y0 + 0.85, Z0 + 0.06), (X1 + 0.15, Y0 + 1.1, Z0 + 0.04)], 0.032, "rubber")
for i in range(4):
    box(f"grille{i}", X1, X1 + 0.04, Y1 - 0.75 + i * 0.1, Y1 - 0.7 + i * 0.1, Z0 + 0.1, Z0 + 0.18, "seam", bevel=0)
seam_v_side("seam_s1", X1, Y0, Y1, Z0, Z1)
screws(("+x", X1), [(Y0 + 0.08, Z0 + 0.12), (Y0 + 0.08, Z1 - 0.12), (Y1 - 0.08, Z0 + 0.12), (Y1 - 0.08, Z1 - 0.12)])

# divider band between the floors (front + right faces)
box("band_front", X0 - 0.02, X1 + 0.02, Y0 - 0.025, Y0 + 0.02, Z1 - 0.05, Z1 + 0.05, "shell_shade", bevel=0.015)
box("band_right", X1 - 0.02, X1 + 0.025, Y0 - 0.02, Y1 + 0.02, Z1 - 0.05, Z1 + 0.05, "shell_shade", bevel=0.015)
seam_v_side("seam_s_mid", X1, Y0 + 0.9, Y0 + 0.92, Z0, Z1)
# serial sticker beside the port + chevron kick plate along the right base
decal("serial", "serial", (X1 + 0.004, Y0 + 0.86, Z0 + 0.9), 0.18, 0.09, "+x")
decal("chevron", "chevron", (X1 + 0.004, (Y0 + Y1) / 2, Z0 + 0.05), Y1 - Y0 - 0.2, 0.06, "+x")

# ================================================================ upper floor: workshop window (front), balcony cubby + sign (right)
U = box("upper", X0, X1, Y0, Y1, Z1, Z2, "shell", bevel=0.045)
WX0, WX1, WZ0, WZ1 = X0 + 0.15, X0 + 1.5, Z1 + 0.22, Z2 - 0.2
cut(U, WX0, WX1, Y0 - 0.1, Y0 + 0.5, WZ0, WZ1)
box("win_back", WX0, WX1, Y0 + 0.48, Y0 + 0.52, WZ0, WZ1, "interior", bevel=0)
box("win_floor", WX0, WX1, Y0, Y0 + 0.5, WZ0, WZ0 + 0.02, "shell_shade", bevel=0)
WF = box("win_frame", WX0 - 0.1, WX1 + 0.1, Y0 - 0.07, Y0 + 0.01, WZ0 - 0.1, WZ1 + 0.1, "klein", bevel=0.1)
cut(WF, WX0, WX1, Y0 - 0.2, Y0 + 0.1, WZ0, WZ1)
box("win_glass", WX0, WX1, Y0 + 0.0, Y0 + 0.01, WZ0, WZ1, "glass", bevel=0)
if ARCH == "build-exe":
    box("pegboard", WX0 + 0.12, WX1 - 0.12, Y0 + 0.46, Y0 + 0.48, WZ0 + 0.55, WZ1 - 0.12, "pegboard", bevel=0)
    for i in range(6):
        x = WX0 + 0.22 + i * 0.17
        box(f"tool{i}", x, x + 0.06, Y0 + 0.44, Y0 + 0.46, WZ0 + 0.75 + 0.05 * (i % 2), WZ0 + 1.15 - 0.06 * (i % 3), "klein" if i % 2 else "steel", bevel=0.01)
    box("desk_up", WX0 + 0.08, WX1 - 0.08, Y0 + 0.12, Y0 + 0.44, WZ0 + 0.38, WZ0 + 0.43, "shell_shade", bevel=0.008)
    for x in (WX0 + 0.12, WX1 - 0.12):
        box(f"desk_up_leg{x}", x - 0.02, x + 0.02, Y0 + 0.15, Y0 + 0.4, WZ0, WZ0 + 0.38, "steel", bevel=0.004)
    box("bot2", WX0 + 0.45, WX0 + 0.72, Y0 + 0.16, Y0 + 0.38, WZ0 + 0.43, WZ0 + 0.66, "key", bevel=0.035, sub=1)
    for k, dx in enumerate((0.53, 0.64)):
        cyl(f"bot2_eye{k}", (WX0 + dx, Y0 + 0.155, WZ0 + 0.56), 0.028, 0.02, "led", rot=(math.pi / 2, 0, 0), verts=20)
    box("crate_in", WX1 - 0.42, WX1 - 0.14, Y0 + 0.16, Y0 + 0.38, WZ0 + 0.43, WZ0 + 0.6, "klein", bevel=0.02)
else:
    window_interior()
bpy.ops.object.light_add(type="POINT", location=((WX0 + WX1) / 2, Y0 + 0.25, WZ1 - 0.15))
wl = bpy.context.active_object
wl.data.energy = 20 if NIGHT else 3
wl.data.color = (0.85, 0.9, 1.0)
wl.data.shadow_soft_size = 0.12
ORDER.append(wl)
seam_h("seam_u1", Y0, X0, X1, Z2)
# station ID plate (brushed steel, printed) on the front, right of the window
box("plate_back", X1 - 0.6, X1 - 0.08, Y0 - 0.02, Y0 + 0.002, Z1 + 0.3, Z1 + 0.5, "steel", bevel=0.01)
decal("plate", "plate", ((X1 - 0.6 + X1 - 0.08) / 2, Y0 - 0.023, Z1 + 0.4), 0.48, 0.18, "-y")
screws(("-y", Y0), [(X0 + 0.08, Z1 + 0.12), (X0 + 0.08, Z2 - 0.12), (X1 - 0.08, Z1 + 0.12), (X1 - 0.08, Z2 - 0.12)])
if ARCH == "build-exe":
    # right face: a cubby with a little balcony of crates + railing
    cut(U, X1 - 0.45, X1 + 0.1, Y0 + 0.2, Y0 + 1.05, Z1 + 0.35, Z1 + 1.35)
    box("cubby_back", X1 - 0.47, X1 - 0.43, Y0 + 0.2, Y0 + 1.05, Z1 + 0.35, Z1 + 1.35, "interior", bevel=0)
    box("balcony_box", X1, X1 + 0.42, Y0 + 0.15, Y0 + 1.1, Z1 + 0.05, Z1 + 0.45, "shell", bevel=0.03)
    for i in range(5):
        for j in range(2):
            cyl(f"balc_hole{i}{j}", (X1 + 0.425, Y0 + 0.35 + i * 0.13, Z1 + 0.17 + j * 0.12), 0.02, 0.02, "seam", rot=(0, math.pi / 2, 0), verts=12)
    box("crate_a", X1 - 0.3, X1 + 0.08, Y0 + 0.28, Y0 + 0.62, Z1 + 0.45, Z1 + 0.78, "crate_grey", bevel=0.03)
    box("crate_b", X1 - 0.25, X1 + 0.1, Y0 + 0.66, Y0 + 0.98, Z1 + 0.45, Z1 + 0.72, "klein", bevel=0.03)
    box("crate_c", X1 - 0.22, X1 + 0.05, Y0 + 0.32, Y0 + 0.58, Z1 + 0.78, Z1 + 1.0, "klein", bevel=0.03)
    for y in (Y0 + 0.17, Y0 + 0.62, Y0 + 1.08):
        rod(f"bal_post{y}", (X1 + 0.4, y, Z1 + 0.45), (X1 + 0.4, y, Z1 + 0.95), 0.02, "steel")
    rod("bal_rail", (X1 + 0.4, Y0 + 0.17, Z1 + 0.95), (X1 + 0.4, Y0 + 1.08, Z1 + 0.95), 0.025, "steel")
else:
    cubby()
# vertical lightbox sign on the right face, toward the back
box("sign_bracket", X1, X1 + 0.22, Y1 - 0.42, Y1 - 0.36, Z1 + 1.45, Z1 + 1.5, "steel", bevel=0.008)
box("sign_frame", X1 + 0.14, X1 + 0.28, Y1 - 0.62, Y1 - 0.16, Z1 + 0.25, Z1 + 1.6, "klein", bevel=0.06)
box("sign_face", X1 + 0.27, X1 + 0.3, Y1 - 0.56, Y1 - 0.22, Z1 + 0.32, Z1 + 1.53, "signface", bevel=0.03)
seam_v_side("seam_s2", X1, Y0, Y1, Z1, Z2)
screws(("+x", X1), [(Y0 + 0.08, Z1 + 0.12), (Y0 + 0.08, Z2 - 0.12), (Y1 - 0.08, Z1 + 0.12), (Y1 - 0.08, Z2 - 0.12)])

# ================================================================ panel detail
def outline_front(name, x0, x1, z0, z1, y=None):
    """Recessed panel outline on the front face (four thin seams)."""
    y = Y0 if y is None else y
    box(f"{name}_t", x0, x1, y - 0.008, y + 0.004, z1 - 0.01, z1 + 0.01, "seam", bevel=0)
    box(f"{name}_b", x0, x1, y - 0.008, y + 0.004, z0 - 0.01, z0 + 0.01, "seam", bevel=0)
    box(f"{name}_l", x0 - 0.01, x0 + 0.01, y - 0.008, y + 0.004, z0, z1, "seam", bevel=0)
    box(f"{name}_r", x1 - 0.01, x1 + 0.01, y - 0.008, y + 0.004, z0, z1, "seam", bevel=0)


def outline_right(name, y0, y1, z0, z1):
    box(f"{name}_t", X1 - 0.004, X1 + 0.008, y0, y1, z1 - 0.01, z1 + 0.01, "seam", bevel=0)
    box(f"{name}_b", X1 - 0.004, X1 + 0.008, y0, y1, z0 - 0.01, z0 + 0.01, "seam", bevel=0)
    box(f"{name}_l", X1 - 0.004, X1 + 0.008, y0 - 0.01, y0 + 0.01, z0, z1, "seam", bevel=0)
    box(f"{name}_r", X1 - 0.004, X1 + 0.008, y1 - 0.01, y1 + 0.01, z0, z1, "seam", bevel=0)


outline_front("pnl_f_up", WX1 + 0.16, X1 - 0.06, Z1 + 0.12, Z2 - 0.12)
outline_front("pnl_f_lo", GX1 + 0.48, X1 - 0.06, Z0 + 0.12, Z1 - 0.12)
for i in range(4):  # vent slots above the ID plate
    box(f"vent_f{i}", X1 - 0.55, X1 - 0.13, Y0 - 0.01, Y0 + 0.002, Z1 + 0.66 + i * 0.07, Z1 + 0.69 + i * 0.07, "seam", bevel=0.003)
outline_right("pnl_r_up", Y0 + 1.15, Y1 - 0.08, Z2 - 0.85, Z2 - 0.1)
# corner guards (L-section steel) on the two front corners
for cx, sgn in ((X1, -1), (X0, 1)):
    box(f"guard_f{cx}", min(cx, cx + sgn * 0.07), max(cx, cx + sgn * 0.07), Y0 - 0.014, Y0 + 0.002, Z0 + 0.04, Z2 - 0.04, "steel", bevel=0.004)
box("guard_r", X1 - 0.002, X1 + 0.014, Y0, Y0 + 0.07, Z0 + 0.04, Z2 - 0.04, "steel", bevel=0.004)
# conduit up the right side with clamps
rod("conduit", (X1 + 0.05, Y1 - 0.12, Z0 + 0.06), (X1 + 0.05, Y1 - 0.12, Z2 - 0.06), 0.032, "steel")
for z in (Z0 + 0.5, Z0 + 1.3, Z1 + 0.5, Z1 + 1.3):
    box(f"clamp{z}", X1, X1 + 0.09, Y1 - 0.17, Y1 - 0.07, z - 0.03, z + 0.03, "shell_shade", bevel=0.01)
# junction box with status LEDs
box("jbox", X1, X1 + 0.1, Y1 - 0.5, Y1 - 0.24, Z1 - 0.62, Z1 - 0.3, "shell_shade", bevel=0.02)
for i in range(3):
    cyl(f"jbox_led{i}", (X1 + 0.104, Y1 - 0.43 + i * 0.06, Z1 - 0.38), 0.016, 0.012, "led2", rot=(0, math.pi / 2, 0), verts=16)
# second vent bank (right, upper) + a small hatch with a handle
for i in range(4):
    box(f"vent_r{i}", X1, X1 + 0.035, Y0 + 0.22, Y0 + 0.8, Z2 - 0.42 + i * 0.07, Z2 - 0.39 + i * 0.07, "seam", bevel=0.003)
box("hatch", X1, X1 + 0.025, Y0 + 1.18, Y0 + 1.42, Z2 - 0.78, Z2 - 0.52, "shell_shade", bevel=0.01)
rod("hatch_handle", (X1 + 0.05, Y0 + 1.24, Z2 - 0.65), (X1 + 0.05, Y0 + 1.36, Z2 - 0.65), 0.012, "steel")

if ARCH != "build-exe":
    extras()

# ================================================================ roof: CRT monitor, robot arm, railing, crates
box("roof", X0 - 0.05, X1 + 0.05, Y0 - 0.05, Y1 + 0.05, Z2, Z2 + 0.12, "shell_shade", bevel=0.045)
for x in (X0 + 0.05, X0 + 0.75, X1 - 0.05):
    rod(f"rail_post_f{x}", (x, Y0 + 0.05, Z2 + 0.12), (x, Y0 + 0.05, Z2 + 0.52), 0.022, "steel")
rod("rail_front", (X0 + 0.05, Y0 + 0.05, Z2 + 0.52), (X1 - 0.05, Y0 + 0.05, Z2 + 0.52), 0.026, "steel")
for y in (Y0 + 0.05, Y0 + 0.9):
    rod(f"rail_post_l{y}", (X0 + 0.05, y, Z2 + 0.12), (X0 + 0.05, y, Z2 + 0.52), 0.022, "steel")
rod("rail_left", (X0 + 0.05, Y0 + 0.05, Z2 + 0.52), (X0 + 0.05, Y0 + 0.9, Z2 + 0.52), 0.026, "steel")
# CRT monitor on two posts, back-left
MX0, MX1, MY = X0 + 0.15, X0 + 1.45, Y1 - 0.45
for x in (MX0 + 0.35, MX1 - 0.35):
    box(f"mon_post{x}", x - 0.06, x + 0.06, MY - 0.06, MY + 0.06, Z2 + 0.12, Z2 + 0.85, "steel", bevel=0.015)
box("mon_case", MX0, MX1, MY - 0.2, MY + 0.22, Z2 + 0.8, Z2 + 1.85, "shell", bevel=0.13)
box("mon_bezel", MX0 + 0.08, MX1 - 0.08, MY - 0.24, MY - 0.18, Z2 + 0.88, Z2 + 1.77, "shell_shade", bevel=0.08)
box("mon_screen", MX0 + 0.17, MX1 - 0.17, MY - 0.26, MY - 0.23, Z2 + 0.97, Z2 + 1.68, "crt", bevel=0.06)
for i in range(4):
    box(f"mon_vent{i}", MX1 - 0.28, MX1 - 0.1, MY - 0.25, MY - 0.23, Z2 + 1.0 + i * 0.07, Z2 + 1.03 + i * 0.07, "seam", bevel=0)
if ARCH == "build-exe":
    # robot arm, back-right
    AX, AY = X1 - 0.35, Y1 - 0.4
    cyl("arm_base", (AX, AY, Z2 + 0.22), 0.26, 0.2, "klein", bevel=0.03)
    cyl("arm_base_cap", (AX, AY, Z2 + 0.35), 0.16, 0.06, "shell", bevel=0.02)
    # arm works in the x-z plane, reaching out past the right edge (as in the 2D art)
    J1 = (AX - 0.12, AY, Z2 + 1.55)
    J2 = (AX + 0.7, AY, Z2 + 1.72)
    TIP = (AX + 0.76, AY, Z2 + 1.4)
    rod("arm_1", (AX, AY, Z2 + 0.38), J1, 0.085, "shell")
    cyl("arm_joint1", J1, 0.14, 0.22, "klein", rot=(math.pi / 2, 0, 0), bevel=0.03)
    rod("arm_2", J1, J2, 0.072, "shell")
    cyl("arm_joint2", J2, 0.11, 0.2, "klein", rot=(math.pi / 2, 0, 0), bevel=0.02)
    rod("arm_3", J2, TIP, 0.05, "shell")
    rod("grip_l", TIP, (TIP[0] + 0.02, AY - 0.1, TIP[2] - 0.24), 0.025, "klein")
    rod("grip_r", TIP, (TIP[0] + 0.02, AY + 0.1, TIP[2] - 0.24), 0.025, "klein")
    tube("arm_hose", [(AX - 0.16, AY + 0.12, Z2 + 0.4), (AX - 0.24, AY + 0.1, Z2 + 1.0), (AX - 0.14, AY + 0.08, Z2 + 1.55)], 0.024, "rubber")
    # rooftop crates, front-left
    box("roof_crate_a", X0 + 0.2, X0 + 0.62, Y0 + 0.2, Y0 + 0.6, Z2 + 0.12, Z2 + 0.48, "klein", bevel=0.03)
    box("roof_crate_b", X0 + 0.68, X0 + 1.05, Y0 + 0.22, Y0 + 0.58, Z2 + 0.12, Z2 + 0.42, "crate_grey", bevel=0.03)
    # AC unit with a fan grille, front-right of the roof
    box("ac_unit", X1 - 0.7, X1 - 0.15, Y0 + 0.12, Y0 + 0.62, Z2 + 0.12, Z2 + 0.4, "shell_shade", bevel=0.03)
    cyl("ac_fan", (X1 - 0.425, Y0 + 0.37, Z2 + 0.405), 0.19, 0.012, "seam", verts=48)
    cyl("ac_ring", (X1 - 0.425, Y0 + 0.37, Z2 + 0.412), 0.2, 0.01, "steel", verts=48)
    for k_ in range(4):
        box(f"ac_spoke{k_}", X1 - 0.62, X1 - 0.23, Y0 + 0.36, Y0 + 0.38, Z2 + 0.41, Z2 + 0.42, "steel", bevel=0, rot=(0, 0, k_ * math.pi / 4))
    cyl("ac_hub", (X1 - 0.425, Y0 + 0.37, Z2 + 0.42), 0.04, 0.02, "klein", verts=24)
    # antenna + vent caps
    rod("antenna", (X0 + 0.12, Y1 - 0.12, Z2 + 0.12), (X0 + 0.12, Y1 - 0.12, Z2 + 1.05), 0.012, "steel")
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.04, location=(X0 + 0.12, Y1 - 0.12, Z2 + 1.07))
    place(bpy.context.active_object, "klein", smooth=True)
    for vx, vy in ((X0 + 1.15, Y1 - 0.2), (X0 + 1.35, Y1 - 0.2)):
        cyl(f"ventcap_stem{vx}", (vx, vy, Z2 + 0.2), 0.03, 0.16, "steel", verts=20)
        cyl(f"ventcap{vx}", (vx, vy, Z2 + 0.3), 0.07, 0.04, "shell", verts=32, bevel=0.015)
else:
    roof_props()
# ================================================================ studio lighting
world = bpy.data.worlds.new("world")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = lin("#0A0E16" if NIGHT else "#E8E8ED")
bg.inputs["Strength"].default_value = 0.1 if NIGHT else 0.18


def aim(o, direction):
    o.rotation_euler = Vector(direction).to_track_quat("-Z", "Y").to_euler()


def area(name, loc, size, energy, color, target=(0, 0, 2.6)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.active_object
    l.name = name
    l.data.size = size
    l.data.energy = energy
    l.data.color = color
    aim(l, Vector(target) - Vector(loc))
    l.visible_camera = False
    return l


k = 0.26 if NIGHT else 1.0
area("key", (-5, -10, 9), 5, 2200 * k, (1.0, 0.96, 0.9))
area("fill", (10, -6, 4), 8, 500 * k, (0.92, 0.95, 1.0))
area("rim", (4, 9, 9), 4, 1500 * (0.7 if NIGHT else 1.0), (0.85, 0.9, 1.0) if not NIGHT else (0.2, 1.0, 0.6))
# soft shadow under the miniature (shadow catcher keeps the background transparent)
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -0.08))
catcher = bpy.context.active_object
catcher.name = "shadow_catcher"
catcher.is_shadow_catcher = True

# ================================================================ camera: iso, orthographic (matches the 2D art)
target = bpy.data.objects.new("target", None)
target.location = (0.2, 0.2, 2.75)
scene.collection.objects.link(target)
cd = bpy.data.cameras.new("cam")
cd.type = "ORTHO"
cd.ortho_scale = 7.6
cam = bpy.data.objects.new("cam", cd)
d = 20
cam.location = (target.location.x + d, target.location.y - d, target.location.z + d * math.sqrt(2) * math.tan(math.radians(30)))
c = cam.constraints.new("TRACK_TO")
c.target = target
c.track_axis = "TRACK_NEGATIVE_Z"
c.up_axis = "UP_Y"
scene.collection.objects.link(cam)
scene.camera = cam

# ================================================================ animation: 6 s seamless loop (frames 1-180; 181 == 1)
def fcurves_of(idb):
    ad = idb.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    try:
        return list(act.fcurves)
    except Exception:
        pass
    out = []
    for layer in getattr(act, "layers", []):
        for strip in layer.strips:
            for cb in getattr(strip, "channelbags", []):
                out += list(cb.fcurves)
    return out


def interp(idb, kind):
    for fc in fcurves_of(idb):
        for kp in fc.keyframe_points:
            kp.interpolation = kind


def parent_keep(child, parent):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


if ANIM:
    import random as _r

    _r.seed(11)
    scene.frame_start, scene.frame_end = 1, 180
    scene.render.fps = 30
    OB = bpy.data.objects
    bpy.context.view_layer.update()

    # CRT: the code scrolls one full strip per loop (linear, so it wraps seamlessly)
    crt_nt = MATS["crt"].node_tree
    loc = crt_nt.nodes["code_scroll"].inputs["Location"]
    for f, v in ((1, 0.35), (181, 1.35)):
        loc.default_value[1] = v
        loc.keyframe_insert("default_value", index=1, frame=f)
    interp(crt_nt, "LINEAR")

    def pivot(name, at, rot=(0, 0, 0)):
        e = bpy.data.objects.new(name, None)
        e.location = at
        e.rotation_euler = rot
        scene.collection.objects.link(e)
        bpy.context.view_layer.update()
        return e

    def group(prefixes):
        return [o for o in OB if o.type in ("MESH", "CURVE") and any(o.name.startswith(p) for p in prefixes)]

    def keys(obj, path, frames_values, index=-1):
        for f, v in frames_values:
            setattr(obj, path, v)
            obj.keyframe_insert(path, frame=f, index=index)

    def wave(amp, period, n_keys=None, phase=0.0):
        """Keys for a seamless sine over the loop (period divides 180)."""
        step = 6
        return [(f, amp * math.sin(2 * math.pi * ((f - 1) / period + phase))) for f in range(1, 182, step)]

    def blink(obj_names, base_mat, pattern):
        """Give each object its own copy of an emissive material; pattern(i, f) -> 0..1."""
        for i, n in enumerate(obj_names):
            if n not in OB:
                continue
            m = MATS[base_mat].copy()
            m.name = f"{base_mat}_{n}"
            OB[n].data.materials[0] = m
            es = m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
            base = es.default_value
            for f in range(1, 182, 3):
                es.default_value = base * pattern(i, f)
                es.keyframe_insert("default_value", frame=f)
            interp(m.node_tree, "CONSTANT")

    if ARCH == "build-exe":  # robot arm: shoulder -> elbow -> wrist pivots
        sh = pivot("arm_shoulder", (AX, AY, Z2 + 0.38))
        el = pivot("arm_elbow", J1)
        wr = pivot("arm_wrist", J2)
        bpy.context.view_layer.update()
        parent_keep(el, sh)
        parent_keep(wr, el)
        for n in ("arm_1", "arm_joint1", "arm_hose"):
            parent_keep(OB[n], sh)
        for n in ("arm_2", "arm_joint2"):
            parent_keep(OB[n], el)
        for n in ("arm_3", "grip_l", "grip_r"):
            parent_keep(OB[n], wr)
        for e, keys in (
            (sh, [(1, (0, 0, 0)), (45, (0, 0.12, 0.5)), (90, (0, 0.0, 0.1)), (135, (0, -0.1, -0.35)), (181, (0, 0, 0))]),
            (el, [(1, (0, 0, 0)), (45, (0, 0.4, 0)), (90, (0, -0.2, 0)), (135, (0, 0.25, 0)), (181, (0, 0, 0))]),
            (wr, [(1, (0, 0, 0)), (45, (0, -0.35, 0)), (90, (0, 0.2, 0)), (135, (0, -0.15, 0)), (181, (0, 0, 0))]),
        ):
            for f, rot in keys:
                e.rotation_euler = rot
                e.keyframe_insert("rotation_euler", frame=f)

    # indicator column: a light chases up every second
    for i in range(4):
        lamp = OB[f"indicator_lamp{i}"]
        m = MATS["led2"].copy()
        m.name = f"chase{i}"
        lamp.data.materials[0] = m
        es = m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
        base = es.default_value
        for f in range(1, 182, 2):
            ph = ((f - 1) / 30.0 - i / 4.0) % 1.0
            es.default_value = base * (0.25 + 0.75 * max(0.0, math.cos(ph * 2 * math.pi)) ** 6)
            es.keyframe_insert("default_value", frame=f)

    # the little robots (BUILD.EXE): blink, and turn their heads
    for body, eyes, t0 in ([] if ARCH != "build-exe" else []) or ((("bot_body", ("bot_eye0", "bot_eye1"), 50), ("bot2", ("bot2_eye0", "bot2_eye1"), 118)) if ARCH == "build-exe" else ()):
        pass
    for body, eyes, t0 in ((("bot_body", ("bot_eye0", "bot_eye1"), 50), ("bot2", ("bot2_eye0", "bot2_eye1"), 118)) if ARCH == "build-exe" else ()):
        b_ = OB[body]
        for en in eyes:
            parent_keep(OB[en], b_)
            e = OB[en]
            for f, sy in ((1, 1), (t0 - 2, 1), (t0, 0.1), (t0 + 2, 1), (t0 + 8, 1), (t0 + 10, 0.1), (t0 + 12, 1), (181, 1)):
                e.scale = (1, sy, 1)
                e.keyframe_insert("scale", frame=f)
        for f, rz in ((1, 0), (t0 + 20, 0), (t0 + 30, 0.3), (t0 + 50, 0.3), (t0 + 60, 0), (181, 0)):
            b_.rotation_euler = (0, 0, rz)
            b_.keyframe_insert("rotation_euler", frame=f)

    # sign hums (a couple of flickers), garage lamp breathes
    sf = MATS["signface"].node_tree
    es = sf.nodes["Principled BSDF"].inputs["Emission Strength"]
    base = es.default_value
    for f, v in ((1, 1), (76, 1), (77, 0.55), (78, 1), (80, 0.75), (81, 1), (149, 1), (150, 0.6), (152, 1), (181, 1)):
        es.default_value = base * v
        es.keyframe_insert("default_value", frame=f)
    interp(sf, "CONSTANT")
    e0 = gl.data.energy
    for f in range(1, 182, 6):
        gl.data.energy = e0 * (1.0 if f in (1, 181) else _r.uniform(0.9, 1.06))
        gl.data.keyframe_insert("energy", frame=f)

    # ---- per-archetype motion
    R = Z2 + 0.12
    if ARCH == "arc":  # crane slews; the crate swings on its cable
        mx, my = X1 - 0.3, Y0 + 1.15
        slew = pivot("crane_slew", (mx, my, R + 1.55))
        for o in group(("crane_jib", "crane_cab", "crane_weight")):
            parent_keep(o, slew)
        hook = pivot("crane_hook", (mx, my - 1.05, R + 1.6))
        parent_keep(hook, slew)
        for o in group(("crane_cable", "crane_crate")):
            parent_keep(o, hook)
        keys(slew, "rotation_euler", [(f, (0, 0, v)) for f, v in wave(0.38, 180)])
        keys(hook, "rotation_euler", [(f, (v, 0, 0)) for f, v in wave(0.12, 60, phase=0.25)])
    elif ARCH == "entropy":  # roof equipment lights blink out of step
        blink([f"roof_box_led{k}" for k in range(3)], "led2", lambda i, f: 1.0 if ((f // 9) + i * 2) % 3 else 0.15)
    elif ARCH == "foresight":  # the dome turns; the orrery's planets orbit
        dx, dy = X1 - 0.5, Y0 + 0.55
        dome = pivot("dome_pivot", (dx, dy, R))
        for o in group(("dome", "telescope")):
            if o.name != "dome_drum":
                parent_keep(o, dome)
        keys(dome, "rotation_euler", [(f, (0, 0, v)) for f, v in wave(0.6, 180)])
        sun = OB.get("orrery_sun")
        if sun:
            for k in range(3):
                orb = pivot(f"orbit{k}", tuple(sun.location), rot=(0.25, 0, 0))
                parent_keep(OB[f"orrery_planet{k}"], orb)
                turns = (3, 2, 1)[k]
                keys(orb, "rotation_euler", [(1, (0.25, 0, 0)), (181, (0.25, 0, turns * 2 * math.pi))])
                interp(orb, "LINEAR")
    elif ARCH == "freq":  # disco ball spins, bulbs chase, speakers thump, joystick wiggles
        ball = OB["disco_ball"]
        keys(ball, "rotation_euler", [(1, (0, 0, 0)), (181, (0, 0, 2 * math.pi))])
        interp(ball, "LINEAR")
        bulbs = sorted(o.name for o in OB if o.name.startswith("bulb_"))
        blink(bulbs, "bulb", lambda i, f: 1.0 if ((f // 6) + i) % 2 else 0.2)
        for o in group(("spk_cap",)):
            x0_ = o.location.x
            keys(o, "location", [(f, (x0_ + (0.012 if (f // 5) % 2 else 0.0), o.location.y, o.location.z)) for f in range(1, 182, 5)])
        jx, jy = X1 - 0.35, Y1 - 0.4
        stick = pivot("joy_pivot", (jx, jy, R + 0.16))
        for o in group(("joy_stick", "joy_knob")):
            parent_keep(o, stick)
        keys(stick, "rotation_euler", [(f, (v, v * 0.6, 0)) for f, v in wave(0.18, 45)])
    elif ARCH == "null":  # the turret turns; the keypad light blinks
        tur = pivot("turret_pivot", (X1 - 0.4, Y1 - 0.45, R))
        for o in group(("turret",)):
            parent_keep(o, tur)
        keys(tur, "rotation_euler", [(1, (0, 0, 0)), (181, (0, 0, 2 * math.pi))])
        interp(tur, "LINEAR")
        blink(["g_keypad_led"], "led2", lambda i, f: 1.0 if (f // 15) % 2 else 0.1)
    elif ARCH == "relay":  # dishes sweep; server lights flicker
        for k, (dx, dy) in enumerate(((X0 + 0.4, Y0 + 0.45), (X1 - 0.4, Y0 + 0.5))):
            dp = pivot(f"dish_pivot{k}", (dx, dy, R + 0.5))
            for o in group((f"dish{k}_reflector", f"dish{k}_strut", f"dish{k}_feed", f"dish{k}_yoke")):
                parent_keep(o, dp)
            keys(dp, "rotation_euler", [(f, (0, 0, v)) for f, v in wave(0.35, 180, phase=0.5 * k)])
        rnd = _r.Random(5)
        table = {}
        racks = sorted(o.name for o in OB if o.name.startswith("w_rack_led"))
        blink(racks, "led2", lambda i, f: table.setdefault((i, f // 6), 1.0 if rnd.random() > 0.35 else 0.1) if f < 181 else table.get((i, 0), 1.0))
    elif ARCH == "source":  # plant sways; a drawer slides out and back
        for o in group(("roof_plant_leaf",)):
            r0 = tuple(o.rotation_euler)
            ph = (hash(o.name) % 100) / 100
            keys(o, "rotation_euler", [(f, (r0[0] + v, r0[1] + v * 0.5, r0[2])) for f, v in wave(0.06, 90, phase=ph)])
        for n in ("cab_drawer1", "cab_pull1"):
            o = OB.get(n)
            if o:
                x0_ = o.location.x
                keys(o, "location", [(f, (x0_ + dxv, o.location.y, o.location.z)) for f, dxv in ((1, 0), (60, 0), (80, 0.13), (120, 0.13), (140, 0), (181, 0))])

    # camera: a slow drift around the station and back
    tgt = Vector(target.location)
    base_loc = Vector(cam.location)
    for f, ang in ((1, 0.0), (91, math.radians(3.0)), (181, 0.0)):
        off = base_loc - tgt
        off.rotate(Matrix.Rotation(ang, 3, "Z"))
        cam.location = tgt + off
        cam.keyframe_insert("location", frame=f)
    cam.location = base_loc
    scene.frame_set(1)

# ================================================================ render settings
r = scene.render
r.resolution_x, r.resolution_y = 1000, 1250
r.film_transparent = True
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
vts = [i.identifier for i in scene.view_settings.bl_rna.properties["view_transform"].enum_items]
scene.view_settings.view_transform = "Khronos PBR Neutral" if "Khronos PBR Neutral" in vts else "AgX"
scene.view_settings.look = "None"
scene.view_settings.exposure = 0.0
if WATCH:
    r.engine = "BLENDER_EEVEE"
    for attr, val in (("use_raytracing", True), ("use_shadows", True)):
        if hasattr(scene.eevee, attr):
            setattr(scene.eevee, attr, val)
else:
    r.engine = "CYCLES"
    cy = scene.cycles
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for dev in prefs.devices:
            dev.use = True
        cy.device = "GPU"
    except Exception as e:
        print("GPU unavailable:", e)
    cy.samples = SAMPLES
    cy.use_adaptive_sampling = True
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.max_bounces = 10
    cy.transparent_max_bounces = 16
    cy.caustics_reflective = False
    cy.caustics_refractive = False

# ================================================================ watch mode: build live in the UI
if WATCH:
    for o in ORDER:
        o.hide_set(True)
        o.hide_render = True
    queue = list(ORDER)

    def setup_view():
        for win in bpy.context.window_manager.windows:
            for area_ in win.screen.areas:
                if area_.type == "VIEW_3D":
                    sp = area_.spaces.active
                    sp.shading.type = "RENDERED"
                    sp.overlay.show_overlays = False
                    sp.region_3d.view_perspective = "CAMERA"
        return None

    def reveal():
        if not queue:
            print("station built")
            return None
        o = queue.pop(0)
        o.hide_set(False)
        o.hide_render = False
        return 0.06

    bpy.app.timers.register(setup_view, first_interval=0.5)
    bpy.app.timers.register(reveal, first_interval=2.5)
else:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "station.blend"))
    print("saved", os.path.join(OUT, "station.blend"))
