"""
BrandOS studio room, modelled in Blender from code (replaces the AI image->3D
conversion). Same layout and palette as the approved render
(public/worlds/studio/base-3.webp): bone walls, oak floor, Klein blue accents.
Aim: as photoreal as possible (Cycles path tracing, procedural PBR materials,
real window opening with sunlight, leaf-geometry plants).

Run:
  Blender -b -P scripts/blender/studio_room.py -- <outdir> [--eevee] [--samples N]   (builds + saves studio.blend)
  Blender -b <outdir>/studio.blend -P scripts/blender/render_stages.py -- <outdir> [stage]
  Blender    -P scripts/blender/studio_room.py -- <outdir> --watch   (builds live in the UI)

Objects live in one collection per build stage (the title-screen game):
  0_shell        floor slab, walls, window, slab LED
  1_foundation   desk, trestle legs, drawers, chair
  2_workstation  monitors, laptop, keyboard, mouse, lamp, mic, desk LED
  3_complete     art, shelves + books, plants, rug, coffee table, lounge chair
Renders <outdir>/studio-stage<N>.png (iso camera matching the 2D art) and
saves <outdir>/studio.blend.
"""
import bpy, bmesh, sys, math, os, random
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
WATCH = "--watch" in ARGS
EEVEE = "--eevee" in ARGS
SAMPLES = 256
if "--samples" in ARGS:
    SAMPLES = int(ARGS[ARGS.index("--samples") + 1])
    del ARGS[ARGS.index("--samples") : ARGS.index("--samples") + 2]
THEME = "base"
if "--theme" in ARGS:
    THEME = ARGS[ARGS.index("--theme") + 1]
    del ARGS[ARGS.index("--theme") : ARGS.index("--theme") + 2]
ARGS = [a for a in ARGS if not a.startswith("--")]

# Room themes (unlocked by XP level in the app; src/lib/studio-themes.ts). Same
# room and layout; each theme swaps materials, colours, lighting and (Japan) props.
DEFAULTS = dict(
    wall=("plain", "#F2EFE8"), wall_art=None, floor="oak", desk="oak", accent="#0047FF", pillow="#0039E6",
    led="#0040FF", screen=("#0030E0", "#0047FF", "#2E6BFF"), rug="jute", rug_a="#9A7444", rug_b="#F2EADC",
    lounge="#EEEAE2", throw="#2A2B2F", prints=("#0047FF", "#1C1C1E", "#F2EEE4"), night=False, japan=False,
)
THEMES = {
    "base": {},
    "signal-orange": dict(
        wall_art=("blocks", "#F2EFE8", "#0047FF", "#F07A1A"), accent="#F07A1A", pillow="#F07A1A", led="#FF7A1A",
        rug="checker", rug_a="#E8761E", rug_b="#F2EADC", prints=("#F07A1A", "#0047FF", "#F2EEE4"),
    ),
    "deep-navy": dict(
        wall=("pinstripe", "#0F1C40", "#1E3C8C"), floor="ash", desk="ash", accent="#2F7BFF", pillow="#2F7BFF",
        led="#2F7BFF", screen=("#1A5CFF", "#2F7BFF", "#7FB0FF"), rug="wool", rug_a="#16234D",
        lounge="#ECE6DA", prints=("#2F7BFF", "#ECE6DA", "#101A38"),
    ),
    "ultraviolet": dict(
        wall=("plain", "#D9CBEB"), floor="terrazzo", accent="#7A3FE0", pillow="#0047FF", led="#7A3FE0",
        screen=("#3B2BE0", "#5A3BFF", "#9A7BFF"), rug="wool", rug_a="#A98BDB", lounge="#8E62D6",
        prints=("#7A3FE0", "#0047FF", "#F2EEE4"),
    ),
    "blueprint-lab": dict(
        wall=("grid", "#F5F5F0", "#3B5BDB"), floor="concrete", desk="white", accent="#FFD60A", pillow="#FFD60A",
        led="#0047FF", rug="jute", rug_a="#C9A227", lounge="#F2F2EE", prints=("#F5F5F0", "#FFD60A", "#1E3FAE"),
    ),
    "japan": dict(
        wall=("plain", "#F1E8D8"), wall_art=("seigaiha", "#F1E8D8", "#1B2D6B"), floor="tatami", desk="hinoki",
        accent="#1B2D6B", pillow="#E8452C", led="#FFC98A", rug="igusa", prints=("#E8452C", "#1B2D6B", "#F4ECDD"),
        japan=True,
    ),
    "terminal-night": dict(
        wall=("termgrid", "#26272D", "#00FF88"), floor="smoked", desk="dark", accent="#0047FF", pillow="#0047FF",
        led="#00FF88", screen=("#00B85E", "#00E07A", "#7DFFC0"), rug="wool", rug_a="#1E1F24", lounge="#3A3B41",
        throw="#121316", prints=("#00FF88", "#0047FF", "#0E0F12"), night=True,
    ),
}
if THEME not in THEMES:
    raise SystemExit(f"unknown theme {THEME!r}; one of {sorted(THEMES)}")
P = {**DEFAULTS, **THEMES[THEME]}
print("theme", THEME)
OUT = ARGS[0] if ARGS else "/tmp/studio_room"
ONLY_STAGE = int(ARGS[1]) if len(ARGS) > 1 else None
os.makedirs(OUT, exist_ok=True)
random.seed(7)

if WATCH:
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
ORDER = []  # (stage, object) in build order: watch mode reveals them one by one


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
    nt = m.node_tree
    return m, nt, nt.nodes["Principled BSDF"]


def bump(nt, bsdf, height_socket, strength=0.2, distance=0.01):
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = distance
    nt.links.new(height_socket, b.inputs["Height"])
    nt.links.new(b.outputs["Normal"], bsdf.inputs["Normal"])
    return b


def noise(nt, scale, detail=6.0, rough=0.55, coord="Object"):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = rough
    nt.links.new(tc.outputs[coord], n.inputs["Vector"])
    return n


def ramp(nt, fac_socket, stops):
    r = nt.nodes.new("ShaderNodeValToRGB")
    els = r.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], lin(stops[0][1])
    els[1].position, els[1].color = stops[-1][0], lin(stops[-1][1])
    for pos, col in stops[1:-1]:
        e = els.new(pos)
        e.color = lin(col)
    nt.links.new(fac_socket, r.inputs["Fac"])
    return r


def flat(name, color, rough=0.6, metal=0.0, coat=0.0, bump_scale=0.0, bump_str=0.05, sheen=0.0, spec=0.5):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = lin(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Specular IOR Level"].default_value = spec
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.08
    if sheen:
        b.inputs["Sheen Weight"].default_value = sheen
        b.inputs["Sheen Roughness"].default_value = 0.4
    if bump_scale:
        n = noise(nt, bump_scale, detail=8)
        bump(nt, b, n.outputs["Fac"], strength=bump_str, distance=0.005)
    return m


def emissive(name, color, strength, base=None):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = lin(base or "#05060A")
    b.inputs["Roughness"].default_value = 0.25
    b.inputs["Emission Color"].default_value = lin(color)
    b.inputs["Emission Strength"].default_value = strength
    return m


def oak(name, scale_y=7.0, plank_scale=1.7, dark=False, planks=True, colors=None):
    """Oak planks: brick-texture planks, distorted wave grain, per-plank tone, grain bump."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1.0, scale_y, 1.0)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.offset = 0.37
    br.inputs["Scale"].default_value = plank_scale
    br.inputs["Mortar Size"].default_value = 0.0025
    br.inputs["Mortar Smooth"].default_value = 0.3
    br.inputs["Bias"].default_value = 0.0
    br.inputs["Color1"].default_value = (0.0, 0.0, 0.0, 1)
    br.inputs["Color2"].default_value = (1.0, 1.0, 1.0, 1)
    nt.links.new(mp.outputs["Vector"], br.inputs["Vector"])
    # grain: wave bands along the plank, warped by noise
    gmap = nt.nodes.new("ShaderNodeMapping")
    gmap.inputs["Scale"].default_value = (1.0, 0.18 * scale_y, 1.0)
    nt.links.new(tc.outputs["Object"], gmap.inputs["Vector"])
    wv = nt.nodes.new("ShaderNodeTexWave")
    wv.wave_type = "BANDS"
    wv.bands_direction = "X"
    wv.inputs["Scale"].default_value = 26.0
    wv.inputs["Distortion"].default_value = 7.0
    wv.inputs["Detail"].default_value = 4.0
    wv.inputs["Detail Scale"].default_value = 1.6
    nt.links.new(gmap.outputs["Vector"], wv.inputs["Vector"])
    lo, mid, hi = colors or (("#7A4E2A", "#9C6A3E", "#B9854F") if dark else ("#A86A33", "#C98C4D", "#DEA566"))
    grain = ramp(nt, wv.outputs["Fac"], [(0.0, mid), (0.5, hi), (1.0, lo)])
    # per-plank tone (brick colour fac) multiplies the grain slightly
    tone = nt.nodes.new("ShaderNodeMix")
    tone.data_type = "RGBA"
    tone.blend_type = "MULTIPLY"
    tone.inputs["Factor"].default_value = 0.18 if planks else 0.0
    nt.links.new(grain.outputs["Color"], tone.inputs[6])
    nt.links.new(br.outputs["Color"], tone.inputs[7])
    # darken the seams
    seam = nt.nodes.new("ShaderNodeMix")
    seam.data_type = "RGBA"
    seam.blend_type = "MIX"
    seam.inputs[7].default_value = lin("#5A3A20")
    if planks:  # brick Fac is the mortar mask (1 on the seams)
        nt.links.new(br.outputs["Fac"], seam.inputs["Factor"])
    else:
        seam.inputs["Factor"].default_value = 0.0
    nt.links.new(tone.outputs[2], seam.inputs[6])
    nt.links.new(seam.outputs[2], b.inputs["Base Color"])
    rough = ramp(nt, wv.outputs["Fac"], [(0.0, "#7A7A7A"), (1.0, "#9A9A9A")])
    nt.links.new(rough.outputs["Color"], b.inputs["Roughness"])
    b.inputs["Coat Weight"].default_value = 0.25
    b.inputs["Coat Roughness"].default_value = 0.2
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    nt.links.new(wv.outputs["Fac"], add.inputs[0])
    nt.links.new(br.outputs["Fac"], add.inputs[1])
    bump(nt, b, add.outputs[0], strength=0.12, distance=0.004)
    return m


def plaster(name, color):
    m, nt, b = new_mat(name)
    n = noise(nt, 60.0, detail=10, rough=0.6)
    col = nt.nodes.new("ShaderNodeMix")
    col.data_type = "RGBA"
    col.blend_type = "MULTIPLY"
    col.inputs["Factor"].default_value = 0.04
    col.inputs[6].default_value = lin(color)
    nt.links.new(n.outputs["Color"], col.inputs[7])
    nt.links.new(col.outputs[2], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.88
    bump(nt, b, n.outputs["Fac"], strength=0.05, distance=0.004)
    return m


def boucle(name, color):
    """Bouclé fabric: lumpy voronoi loops + fine noise, sheen."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.feature = "SMOOTH_F1"
    v.inputs["Scale"].default_value = 260.0
    nt.links.new(tc.outputs["Object"], v.inputs["Vector"])
    n = noise(nt, 600.0, detail=4)
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "MULTIPLY_ADD"
    add.inputs[1].default_value = 0.4
    nt.links.new(n.outputs["Fac"], add.inputs[0])
    nt.links.new(v.outputs["Distance"], add.inputs[2])
    col = ramp(nt, v.outputs["Distance"], [(0.0, color), (1.0, "#D9D3C8")])
    nt.links.new(col.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.95
    b.inputs["Sheen Weight"].default_value = 0.7
    b.inputs["Sheen Roughness"].default_value = 0.35
    bump(nt, b, add.outputs[0], strength=0.6, distance=0.003)
    return m


def knit(name, color):
    """Chunky knit throw: stretched wave ribs + noise."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wv = nt.nodes.new("ShaderNodeTexWave")
    wv.wave_type = "BANDS"
    wv.bands_direction = "Z"
    wv.inputs["Scale"].default_value = 70.0
    wv.inputs["Distortion"].default_value = 1.5
    nt.links.new(tc.outputs["Object"], wv.inputs["Vector"])
    b.inputs["Base Color"].default_value = lin(color)
    b.inputs["Roughness"].default_value = 0.95
    b.inputs["Sheen Weight"].default_value = 0.6
    bump(nt, b, wv.outputs["Fac"], strength=0.5, distance=0.004)
    return m


def jute(name):
    """Round jute rug: concentric braided rings + fibre noise."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wv = nt.nodes.new("ShaderNodeTexWave")
    wv.wave_type = "RINGS"
    wv.inputs["Scale"].default_value = 9.0
    wv.inputs["Distortion"].default_value = 1.4
    wv.inputs["Detail"].default_value = 6.0
    wv.inputs["Detail"].default_value = 3.0
    nt.links.new(tc.outputs["Object"], wv.inputs["Vector"])
    n = noise(nt, 300.0, detail=6)
    # fibre noise leads; the braid rings only modulate it (otherwise it reads as stripes)
    ring = nt.nodes.new("ShaderNodeMath")
    ring.operation = "MULTIPLY"
    ring.inputs[1].default_value = 0.28
    nt.links.new(wv.outputs["Fac"], ring.inputs[0])
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "ADD"
    nt.links.new(n.outputs["Fac"], mul.inputs[0])
    nt.links.new(ring.outputs[0], mul.inputs[1])
    col = ramp(nt, mul.outputs[0], [(0.45, "#5F4226"), (0.68, "#9A7444"), (0.95, "#C29C63")])
    nt.links.new(col.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.97
    b.inputs["Sheen Weight"].default_value = 0.3
    bump(nt, b, mul.outputs[0], strength=1.0, distance=0.01)
    return m


def leaf_mat(name, color, edge=None):
    """Leaf: waxy front, light passes through (translucency mixed in)."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["UV"], sep.inputs["Vector"])
    stops = [(0.0, color), (1.0, color)] if not edge else [(0.0, edge), (0.12, color), (0.88, color), (1.0, edge)]
    col = ramp(nt, sep.outputs["Y"], stops)
    nt.links.new(col.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.38
    b.inputs["Specular IOR Level"].default_value = 0.6
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    nt.links.new(col.outputs["Color"], tr.inputs["Color"])
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.22
    out = nt.nodes["Material Output"]
    nt.links.new(b.outputs["BSDF"], mix.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def screen_mat(name, strength=2.6, cols=("#0030E0", "#0047FF", "#2E6BFF")):
    """Monitor: Klein-blue gradient UI glow under a glossy panel."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    col = ramp(nt, sep.outputs["Z"], [(0.0, cols[0]), (0.6, cols[1]), (1.0, cols[2])])
    b.inputs["Base Color"].default_value = lin("#03040A")
    b.inputs["Roughness"].default_value = 0.12
    nt.links.new(col.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = strength
    return m


def glass(name):
    m, nt, b = new_mat(name)
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    gl = nt.nodes.new("ShaderNodeBsdfGlossy")
    gl.inputs["Roughness"].default_value = 0.03
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.08
    nt.links.new(tr.outputs["BSDF"], mix.inputs[1])
    nt.links.new(gl.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], nt.nodes["Material Output"].inputs["Surface"])
    return m


def outdoor(name, night=False):
    """What the window sees: soft sky over blurred greenery, or a night sky (emissive backdrop)."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    n = noise(nt, 4.0, detail=8, rough=0.65, coord="Generated")
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "MULTIPLY_ADD"
    add.inputs[1].default_value = 0.55
    nt.links.new(n.outputs["Fac"], add.inputs[0])
    nt.links.new(sep.outputs["Y"], add.inputs[2])
    stops = [(0.35, "#4F7A3C"), (0.62, "#8DB06A"), (0.78, "#DCE8EE"), (1.0, "#F4F7FA")]
    if night:
        stops = [(0.35, "#05070C"), (0.6, "#0B1226"), (0.85, "#16244A"), (1.0, "#22356B")]
    col = ramp(nt, add.outputs[0], stops)
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 0.8 if night else 1.6
    nt.links.new(col.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs["Emission"], nt.nodes["Material Output"].inputs["Surface"])
    return m


def paper_print(name, kind):
    """Abstract print on textured paper, drawn with shader masks (UV space)."""
    m, nt, b = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    # u = sep.X (width), v = sep.Z (height) on a box mapped by Generated coords
    blue, ink, paper = (lin(c) for c in P["prints"])

    def circle(cx, cz, r):
        d = nt.nodes.new("ShaderNodeVectorMath")
        d.operation = "DISTANCE"
        comb = nt.nodes.new("ShaderNodeCombineXYZ")
        nt.links.new(sep.outputs["X"], comb.inputs["X"])
        nt.links.new(sep.outputs["Z"], comb.inputs["Y"])
        nt.links.new(comb.outputs["Vector"], d.inputs[0])
        d.inputs[1].default_value = (cx, cz, 0)
        lt = nt.nodes.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = r
        nt.links.new(d.outputs["Value"], lt.inputs[0])
        return lt.outputs[0]

    def rect(x0, x1, z0, z1):
        out = None
        for sock, lo, hi in ((sep.outputs["X"], x0, x1), (sep.outputs["Z"], z0, z1)):
            a = nt.nodes.new("ShaderNodeMath")
            a.operation = "GREATER_THAN"
            a.inputs[1].default_value = lo
            nt.links.new(sock, a.inputs[0])
            c = nt.nodes.new("ShaderNodeMath")
            c.operation = "LESS_THAN"
            c.inputs[1].default_value = hi
            nt.links.new(sock, c.inputs[0])
            mm = nt.nodes.new("ShaderNodeMath")
            mm.operation = "MULTIPLY"
            nt.links.new(a.outputs[0], mm.inputs[0])
            nt.links.new(c.outputs[0], mm.inputs[1])
            if out is None:
                out = mm.outputs[0]
            else:
                m2 = nt.nodes.new("ShaderNodeMath")
                m2.operation = "MULTIPLY"
                nt.links.new(out, m2.inputs[0])
                nt.links.new(mm.outputs[0], m2.inputs[1])
                out = m2.outputs[0]
        return out

    layers = []
    if P["japan"]:  # hanging scrolls: red sun, waves, a mountain
        if kind == 0:
            layers = [(circle(0.5, 0.62, 0.2), blue)]
        elif kind == 1:
            layers = [(circle(0.32, 0.3, 0.2), ink), (circle(0.32, 0.3, 0.13), paper), (circle(0.68, 0.3, 0.2), ink), (circle(0.68, 0.3, 0.13), paper), (circle(0.5, 0.5, 0.2), ink), (circle(0.5, 0.5, 0.13), paper)]
        else:
            layers = [(rect(0.42, 0.58, 0.3, 0.62), ink), (rect(0.3, 0.7, 0.2, 0.42), ink), (rect(0.18, 0.82, 0.12, 0.26), ink), (rect(0.45, 0.55, 0.52, 0.62), paper)]
    elif kind == 0:
        layers = [(circle(0.42, 0.66, 0.17), blue), (rect(0.3, 0.75, 0.15, 0.42), ink), (rect(0.62, 0.75, 0.42, 0.55), ink)]
    elif kind == 1:
        layers = [(circle(0.5, 0.64, 0.2), ink), (rect(0.3, 0.7, 0.15, 0.64), ink), (rect(0.3, 0.5, 0.15, 0.55), blue)]
    else:
        layers = [(rect(0.44, 0.58, 0.14, 0.86), blue), (rect(0.62, 0.7, 0.3, 0.7), ink), (circle(0.34, 0.3, 0.09), ink)]
    cur = None
    base_rgb = nt.nodes.new("ShaderNodeRGB")
    base_rgb.outputs[0].default_value = paper
    cur = base_rgb.outputs[0]
    for mask, color in layers:
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.inputs[7].default_value = color
        nt.links.new(mask, mx.inputs["Factor"])
        nt.links.new(cur, mx.inputs[6])
        cur = mx.outputs[2]
    nt.links.new(cur, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.9
    n = noise(nt, 400, detail=4)
    bump(nt, b, n.outputs["Fac"], strength=0.08, distance=0.002)
    return m


def patterned_wall(name, spec):
    """Plaster wall + an optional pattern drawn in wall space (u = x + y along the wall, v = z)."""
    kind, base = spec[0], spec[1]
    m = plaster(name, base)
    if kind == "plain":
        return m
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    base_in = b.inputs["Base Color"].links[0].from_socket
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    u = nt.nodes.new("ShaderNodeMath")
    u.operation = "ADD"
    nt.links.new(sep.outputs["X"], u.inputs[0])
    nt.links.new(sep.outputs["Y"], u.inputs[1])

    def stripes(sock, period, width):
        """1 on thin lines every `period` metres."""
        md = nt.nodes.new("ShaderNodeMath")
        md.operation = "PINGPONG"
        md.inputs[1].default_value = period / 2
        nt.links.new(sock, md.inputs[0])
        lt = nt.nodes.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = width / 2
        nt.links.new(md.outputs[0], lt.inputs[0])
        return lt.outputs[0]

    def mix(col_sock, mask, color):
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.inputs[7].default_value = lin(color)
        nt.links.new(mask, mx.inputs["Factor"])
        nt.links.new(col_sock, mx.inputs[6])
        return mx.outputs[2]

    col = base_in
    if kind == "pinstripe":
        col = mix(col, stripes(u.outputs[0], 0.09, 0.008), spec[2])
    elif kind in ("grid", "termgrid"):
        per, w = (0.15, 0.006) if kind == "grid" else (0.12, 0.004)
        either = nt.nodes.new("ShaderNodeMath")
        either.operation = "MAXIMUM"
        nt.links.new(stripes(u.outputs[0], per, w), either.inputs[0])
        nt.links.new(stripes(sep.outputs["Z"], per, w), either.inputs[1])
        if kind == "termgrid":
            dim = nt.nodes.new("ShaderNodeMath")
            dim.operation = "MULTIPLY"
            dim.inputs[1].default_value = 0.35
            nt.links.new(either.outputs[0], dim.inputs[0])
            either = dim
        col = mix(col, either.outputs[0], spec[2])
    elif kind == "blocks":  # Klein blue + orange colour blocks, left part of the wall
        for (u0, u1, c) in ((-1.75, -0.95, spec[2]), (-0.95, -0.15, spec[3])):
            a = nt.nodes.new("ShaderNodeMath")
            a.operation = "GREATER_THAN"
            a.inputs[1].default_value = u0
            nt.links.new(u.outputs[0], a.inputs[0])
            c2 = nt.nodes.new("ShaderNodeMath")
            c2.operation = "LESS_THAN"
            c2.inputs[1].default_value = u1
            nt.links.new(u.outputs[0], c2.inputs[0])
            mm = nt.nodes.new("ShaderNodeMath")
            mm.operation = "MULTIPLY"
            nt.links.new(a.outputs[0], mm.inputs[0])
            nt.links.new(c2.outputs[0], mm.inputs[1])
            col = mix(col, mm.outputs[0], c)
    elif kind == "seigaiha":  # indigo wave frieze along the top of the wall
        wv = nt.nodes.new("ShaderNodeTexWave")
        wv.wave_type = "RINGS"
        wv.inputs["Scale"].default_value = 9.0
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (1.0, 1.0, 2.2)
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], wv.inputs["Vector"])
        band = nt.nodes.new("ShaderNodeMath")
        band.operation = "GREATER_THAN"
        band.inputs[1].default_value = 0.95  # Object z (box centred at mid-height): a frieze along the top
        nt.links.new(sep.outputs["Z"], band.inputs[0])
        lines = nt.nodes.new("ShaderNodeMath")
        lines.operation = "GREATER_THAN"
        lines.inputs[1].default_value = 0.6
        nt.links.new(wv.outputs["Fac"], lines.inputs[0])
        inv = nt.nodes.new("ShaderNodeMath")
        inv.operation = "SUBTRACT"
        inv.inputs[0].default_value = 1.0
        nt.links.new(lines.outputs[0], inv.inputs[1])
        mm = nt.nodes.new("ShaderNodeMath")
        mm.operation = "MULTIPLY"
        nt.links.new(band.outputs[0], mm.inputs[0])
        nt.links.new(inv.outputs[0], mm.inputs[1])
        col = mix(col, mm.outputs[0], spec[2])
    nt.links.new(col, b.inputs["Base Color"])
    return m


def floor_mat(kind):
    if kind == "oak":
        return oak("oak_floor", scale_y=7.0, plank_scale=1.7)
    if kind == "ash":  # pale ash, narrow planks (navy room)
        return oak("oak_floor", scale_y=11.0, plank_scale=2.4, colors=("#B9A58A", "#D3C3A8", "#E4D8C2"))
    if kind == "smoked":
        return oak("oak_floor", scale_y=7.0, plank_scale=1.7, colors=("#2A1C12", "#3D2A1C", "#52392A"))
    m, nt, b = new_mat("oak_floor")
    if kind == "terrazzo":
        tc = nt.nodes.new("ShaderNodeTexCoord")
        v = nt.nodes.new("ShaderNodeTexVoronoi")
        v.inputs["Scale"].default_value = 28.0
        v.inputs["Randomness"].default_value = 1.0
        nt.links.new(tc.outputs["Object"], v.inputs["Vector"])
        chips = nt.nodes.new("ShaderNodeMath")
        chips.operation = "LESS_THAN"
        chips.inputs[1].default_value = 0.16
        nt.links.new(v.outputs["Distance"], chips.inputs[0])
        pick = ramp(nt, v.outputs["Color"], [(0.0, "#7A3FE0"), (0.5, "#0047FF"), (1.0, "#C9B6EA")])
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.inputs[6].default_value = lin("#EDE7F1")
        nt.links.new(chips.outputs[0], mx.inputs["Factor"])
        nt.links.new(pick.outputs["Color"], mx.inputs[7])
        nt.links.new(mx.outputs[2], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.3
        b.inputs["Coat Weight"].default_value = 0.3
    elif kind == "concrete":
        n = noise(nt, 6.0, detail=10, rough=0.6)
        col = ramp(nt, n.outputs["Fac"], [(0.3, "#A7A9AC"), (0.7, "#C9CBCD")])
        nt.links.new(col.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.35
        b.inputs["Coat Weight"].default_value = 0.35
        bump(nt, b, n.outputs["Fac"], strength=0.05, distance=0.003)
    elif kind == "tatami":  # woven rush mats with dark cloth borders (0.9 x 1.8 m)
        tc = nt.nodes.new("ShaderNodeTexCoord")
        br = nt.nodes.new("ShaderNodeTexBrick")
        br.inputs["Scale"].default_value = 1.0
        br.inputs["Brick Width"].default_value = 0.9
        br.inputs["Row Height"].default_value = 1.8
        br.inputs["Mortar Size"].default_value = 0.03
        br.offset = 0.5
        br.inputs["Color1"].default_value = lin("#C9B98A")
        br.inputs["Color2"].default_value = lin("#BFAE7C")
        br.inputs["Mortar"].default_value = lin("#1F2A44")
        nt.links.new(tc.outputs["Object"], br.inputs["Vector"])
        wv = nt.nodes.new("ShaderNodeTexWave")
        wv.bands_direction = "X"
        wv.inputs["Scale"].default_value = 140.0
        nt.links.new(tc.outputs["Object"], wv.inputs["Vector"])
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.blend_type = "MULTIPLY"
        mx.inputs["Factor"].default_value = 0.12
        nt.links.new(br.outputs["Color"], mx.inputs[6])
        nt.links.new(wv.outputs["Color"], mx.inputs[7])
        nt.links.new(mx.outputs[2], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.85
        bump(nt, b, wv.outputs["Fac"], strength=0.25, distance=0.002)
    return m


def rug_mat(kind):
    if kind in ("jute", "igusa"):
        m = jute("jute")
        if kind == "igusa" or P["rug_a"] != DEFAULTS["rug_a"]:
            r = [n for n in m.node_tree.nodes if n.type == "VALTORGB"][0]
            a = P["rug_a"] if kind == "jute" else "#9C9A62"
            r.color_ramp.elements[1].color = lin(a)
        return m
    m, nt, b = new_mat("jute")
    if kind == "checker":
        tc = nt.nodes.new("ShaderNodeTexCoord")
        ck = nt.nodes.new("ShaderNodeTexChecker")
        ck.inputs["Scale"].default_value = 6.0
        ck.inputs["Color1"].default_value = lin(P["rug_a"])
        ck.inputs["Color2"].default_value = lin(P["rug_b"])
        nt.links.new(tc.outputs["Object"], ck.inputs["Vector"])
        nt.links.new(ck.outputs["Color"], b.inputs["Base Color"])
    else:  # plain wool
        b.inputs["Base Color"].default_value = lin(P["rug_a"])
    b.inputs["Roughness"].default_value = 0.95
    b.inputs["Sheen Weight"].default_value = 0.5
    n = noise(nt, 500.0, detail=4)
    bump(nt, b, n.outputs["Fac"], strength=0.4, distance=0.003)
    return m


def desk_mat(kind):
    if kind == "white":
        return flat("oak", "#F4F4F2", rough=0.35)
    if kind == "dark":
        return oak("oak", scale_y=1.0, plank_scale=0.6, planks=False, colors=("#2A1C12", "#3D2A1C", "#52392A"))
    cols = {"ash": ("#B9A58A", "#D3C3A8", "#E4D8C2"), "hinoki": ("#D8BE8C", "#E8D3A6", "#F2E3C0")}.get(kind)
    return oak("oak", scale_y=1.0, plank_scale=0.6, planks=False, colors=cols)


patterned_wall("wall", P["wall"])
patterned_wall("wall_art", P["wall_art"] or P["wall"])
plaster("wall_edge", "#FAF8F3")
flat("slab", "#E9E4DA", rough=0.85, bump_scale=80, bump_str=0.03)
flat("baseboard", "#F7F5F0", rough=0.55)
floor_mat(P["floor"])
desk_mat(P["desk"])
flat("powder_black", "#18181A", rough=0.42, bump_scale=900, bump_str=0.04)
flat("black_plastic", "#141416", rough=0.32, spec=0.5)
flat("graphite", "#2B2C31", rough=0.4)
flat("steel", "#B7B9BE", rough=0.22, metal=1.0)
flat("leather", "#121214", rough=0.5, bump_scale=300, bump_str=0.08, sheen=0.1)
flat("klein_fabric", P["accent"], rough=0.85, sheen=0.5, bump_scale=500, bump_str=0.15)
flat("klein", P["accent"], rough=0.5)
screen_mat("screen", strength=1.3 if P["night"] else 0.95, cols=P["screen"])
screen_mat("keys_glow", strength=1.5, cols=P["screen"])
emissive("led", P["led"], 1.6 if P["night"] else 0.95)
emissive("lamp_glow", "#FFD9A0", 18.0, base="#FFF5E0")
glass("glass")
outdoor("outdoor", night=P["night"])
boucle("boucle", P["lounge"])
knit("throw", P["throw"])
rug_mat(P["rug"])
flat("pillow_klein", P["pillow"], rough=0.9, sheen=0.6, bump_scale=700, bump_str=0.1)
flat("pillow_grey", "#3A3B40", rough=0.9, sheen=0.5, bump_scale=700, bump_str=0.1)
flat("ceramic", "#F3F1EC", rough=0.28, coat=0.3)
flat("ceramic_dark", "#2C2D30", rough=0.3, coat=0.3)
flat("soil", "#3B2A1E", rough=1.0, bump_scale=200, bump_str=0.4)
leaf_mat("leaf", "#285724")
leaf_mat("leaf_light", "#3B7230")
leaf_mat("leaf_deep", "#1E4A1D")
leaf_mat("leaf_snake", "#2E5A33", edge="#C9C26A")
leaf_mat("leaf_pothos", "#3A7A33")
leaf_mat("leaf_maple", "#B8321F")
flat("lacquer", "#1A0E0B", rough=0.15, coat=0.8)
flat("paper_lamp", "#F6EAD2", rough=0.9)
emissive("shoji", "#FFF4DE", 2.2, base="#F6EEDC")
flat("hinoki_wood", "#D9BE8A", rough=0.5)
flat("stem", "#3E5A2A", rough=0.6)
flat("frame_black", "#151517", rough=0.45)
flat("ink", "#1C1C1E", rough=0.9)
for i in range(3):
    paper_print(f"print{i}", i)
flat("book_bone", "#ECE7DC", rough=0.7)
flat("book_black", "#1B1C20", rough=0.6)
flat("book_blue", "#0B2E99", rough=0.6)
flat("book_grey", "#8D8F96", rough=0.6)
flat("brass", "#C7A36B", rough=0.28, metal=1.0)
flat("rubber", "#0E0E10", rough=0.8)


# ================================================================ build helpers
STAGES = []
for n in ["0_shell", "1_foundation", "2_workstation", "3_complete"]:
    c = bpy.data.collections.new(n)
    scene.collection.children.link(c)
    STAGES.append(c)


def place(o, m, stage, bevel=0.0, seg=3, sub=0, smooth=None):
    ORDER.append((stage, o))
    if m:
        o.data.materials.append(MATS[m])
    for c in list(o.users_collection):
        c.objects.unlink(o)
    STAGES[stage].objects.link(o)
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = seg
        mod.limit_method = "ANGLE"
        mod.harden_normals = not sub
    if sub:
        mod = o.modifiers.new("subsurf", "SUBSURF")
        mod.levels = sub
        mod.render_levels = sub
    sm = smooth if smooth is not None else bool(bevel or sub)
    for p in o.data.polygons:
        p.use_smooth = sm
    if bevel and not sub and hasattr(o.data, "use_auto_smooth"):
        o.data.use_auto_smooth = True
    return o


def link_light(o, stage):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    STAGES[stage].objects.link(o)
    ORDER.append((stage, o))
    return o


def box(name, c, s, m, stage, bevel=0.01, rot=(0, 0, 0), sub=0, seg=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=c, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = s
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return place(o, m, stage, bevel, seg=seg, sub=sub)


def cyl(name, c, r, h, m, stage, verts=48, bevel=0.0, rot=(0, 0, 0), r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=c, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=c, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return place(o, m, stage, bevel, smooth=True)


def sphere(name, c, s, m, stage, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1, location=c, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = s
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return place(o, m, stage, smooth=True)


def multibox(name, boxes, m, stage, bevel=0.0):
    """Many boxes as one mesh (keys, slats): [(centre, size), ...]."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    for c, s in boxes:
        mat = Matrix.Translation(c) @ Matrix.Diagonal((s[0], s[1], s[2], 1.0))
        bmesh.ops.create_cube(bm, size=1.0, matrix=mat)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return place(o, m, stage, bevel, seg=2)


def tube(name, pts, r, m, stage):
    """A bent rod through points (stems, lamp arms, cables)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 4
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    o = bpy.data.objects.new(name, cu)
    scene.collection.objects.link(o)
    o.data.materials.append(MATS[m])
    for c in list(o.users_collection):
        c.objects.unlink(o)
    STAGES[stage].objects.link(o)
    ORDER.append((stage, o))
    return o


def leaf_mesh(length, width, curl=0.25, fold=0.18, shape="oval", segs=10):
    """A curved, tapered leaf along +X (width on Y, face up +Z) with UVs."""
    me = bpy.data.meshes.new("leaf")
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    rows = []
    for i in range(segs + 1):
        t = i / segs
        if shape == "heart":
            w = width * (math.sin(math.pi * min(1, t * 1.15)) ** 0.7) * (1.0 - 0.15 * t)
        elif shape == "sword":
            w = width * (1.0 - t ** 3) * min(1, t * 6 + 0.35)
        else:
            w = width * math.sin(math.pi * t) ** 0.85
        x = t * length
        z = -curl * (t ** 2) * length
        row = []
        for j in (-1.0, -0.5, 0.0, 0.5, 1.0):
            y = j * w / 2
            zz = z + abs(j) * w * fold
            row.append(bm.verts.new((x, y, zz)))
        rows.append(row)
    for i in range(segs):
        for j in range(4):
            f = bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
            for k, (ii, jj) in enumerate(((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
                f.loops[k][uv].uv = (ii / segs, jj / 4)
    bm.to_mesh(me)
    bm.free()
    return me


def leaf(name, base, length, width, yaw, pitch, mat, stage, roll=0.0, curl=0.25, shape="oval"):
    k = random.uniform(0.85, 1.15)
    length, width = length * k, width * k
    yaw += random.uniform(-0.12, 0.12)
    pitch += random.uniform(-0.08, 0.08)
    curl *= random.uniform(0.8, 1.25)
    if mat in ("leaf", "leaf_light") and random.random() < 0.3:
        mat = "leaf_deep"
    me = leaf_mesh(length, width, curl=curl, shape=shape)
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    o.location = base
    o.rotation_euler = (roll, -pitch, yaw)
    place(o, mat, stage, sub=1, smooth=True)
    so = o.modifiers.new("thick", "SOLIDIFY")
    so.thickness = 0.002
    return o


# ================================================================ room
W = 1.75  # half width: floor x, y in [-W, W]
H = 2.75  # wall height
T = 0.12  # wall thickness
SLAB = 0.22
# walls on the back edges: y = +W (art wall), x = +W (window wall)

# ---------------------------------------------------------------- 0: shell
box("slab", (0, 0, -SLAB / 2), (2 * W, 2 * W, SLAB), "slab", 0, bevel=0.015)
box("floor", (-T / 2, -T / 2, 0.005), (2 * W - T - 0.004, 2 * W - T - 0.004, 0.01), "oak_floor", 0, bevel=0.002)
box("wall_art", (0, W - T / 2, H / 2), (2 * W, T, H), "wall_art", 0, bevel=0.006)
# window wall built around a real opening so sunlight comes through
WY0, WY1, WZ0, WZ1 = -1.3, -0.3, 0.85, 2.3
wx = W - T / 2
box("wall_win_a", (wx, (-W + WY0) / 2, H / 2), (T, WY0 + W, H), "wall", 0, bevel=0.006)
box("wall_win_b", (wx, (WY1 + W - T) / 2, H / 2), (T, W - T - WY1, H), "wall", 0, bevel=0.006)
box("wall_win_low", (wx, (WY0 + WY1) / 2, WZ0 / 2), (T, WY1 - WY0, WZ0), "wall", 0, bevel=0.0)
box("wall_win_high", (wx, (WY0 + WY1) / 2, (WZ1 + H) / 2), (T, WY1 - WY0, H - WZ1), "wall", 0, bevel=0.0)
box("base_art", (0, W - T - 0.008, 0.05), (2 * W - T, 0.016, 0.1), "baseboard", 0, bevel=0.003)
box("base_window", (W - T - 0.008, -T / 2, 0.05), (0.016, 2 * W - T, 0.1), "baseboard", 0, bevel=0.003)
# window: frame, mullion, glass, sill, the view outside
fx = W - T / 2
for i, y in enumerate((WY0 + 0.025, (WY0 + WY1) / 2, WY1 - 0.025)):
    box(f"win_mullion{i}", (fx, y, (WZ0 + WZ1) / 2), (0.06, 0.05, WZ1 - WZ0), "powder_black", 0, bevel=0.004)
for i, z in enumerate((WZ0 + 0.025, WZ1 - 0.025, (WZ0 + WZ1) / 2 + 0.25)):
    box(f"win_rail{i}", (fx, (WY0 + WY1) / 2, z), (0.06, WY1 - WY0, 0.05 if i < 2 else 0.035), "powder_black", 0, bevel=0.004)
g = box("win_glass", (fx, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2), (0.004, WY1 - WY0, WZ1 - WZ0), "glass", 0, bevel=0)
g.visible_shadow = False
box("win_sill", (W - T - 0.07, (WY0 + WY1) / 2, WZ0 - 0.02), (0.16, WY1 - WY0 + 0.12, 0.035), "baseboard", 0, bevel=0.006)
if P["japan"]:  # glowing paper panel with a fine wooden lattice, just inside the glass
    sx = W - T - 0.035
    box("shoji_paper", (sx, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2), (0.006, WY1 - WY0 - 0.04, WZ1 - WZ0 - 0.04), "shoji", 0, bevel=0)
    bars = []
    for k in range(1, 4):
        y = WY0 + (WY1 - WY0) * k / 4
        bars.append(((sx - 0.006, y, (WZ0 + WZ1) / 2), (0.012, 0.014, WZ1 - WZ0)))
    for k in range(1, 7):
        z = WZ0 + (WZ1 - WZ0) * k / 7
        bars.append(((sx - 0.006, (WY0 + WY1) / 2, z), (0.012, WY1 - WY0, 0.014)))
    multibox("shoji_lattice", bars, "hinoki_wood", 0)
bpy.ops.mesh.primitive_plane_add(size=1, location=(W + 0.04, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2), rotation=(0, math.pi / 2, 0))
view = bpy.context.active_object
view.name = "window_view"
view.scale = (WZ1 - WZ0 + 0.3, WY1 - WY0 + 0.3, 1)  # just past the opening: hidden behind the wall
place(view, "outdoor", 0)
view.visible_shadow = False
view.visible_diffuse = False
# Klein-blue LED strip along the two open (front) edges of the slab
box("led_front_x", (0, -W - 0.004, -0.165), (2 * W, 0.01, 0.03), "led", 0, bevel=0)
box("led_front_y", (-W - 0.004, 0, -0.165), (0.01, 2 * W, 0.03), "led", 0, bevel=0)

# ---------------------------------------------------------------- 1: foundation (desk + chair)
DZ = 0.76  # desk top height
DT = 0.04
DY = W - T - 0.36  # desk main centre line
box("desk_main", (-T / 2, DY, DZ - DT / 2), (2 * W - T - 0.002, 0.72, DT), "oak", 1, bevel=0.006)
box("desk_return", (W - T - 0.36, (DY - 0.36 - 0.1) / 2 - 0.001, DZ - DT / 2), (0.72, DY - 0.36 + 0.1, DT), "oak", 1, bevel=0.006)


def trestle(name, x, y, along_x):
    """Black powder-coated A-frame: two splayed legs, a cross bar, a top rail."""
    for k, off in enumerate((-1, 1)):
        for side in (-1, 1):
            dx, dy = (off * 0.13, side * 0.27) if along_x else (side * 0.27, off * 0.13)
            lean = 0.17 * off
            rot = (0, lean, 0) if along_x else (-lean, 0, 0)
            box(f"{name}_{k}{side}", (x + dx, y + dy, (DZ - DT) / 2), (0.04, 0.04, DZ - DT + 0.04), "powder_black", 1, bevel=0.004, rot=rot)
    sx, sy = (0.06, 0.6) if along_x else (0.6, 0.06)
    box(f"{name}_top", (x, y, DZ - DT - 0.02), (sx, sy, 0.035), "powder_black", 1, bevel=0.003)
    box(f"{name}_bar", (x, y, 0.3), (sx * 0.7, sy, 0.03), "powder_black", 1, bevel=0.003)


trestle("leg_corner", W - T - 0.36, 0.05, along_x=False)
trestle("leg_mid", 0.35, DY, along_x=True)
# drawer unit (3 drawers, recessed pulls)
box("drawers", (-1.3, DY, (DZ - DT) / 2 + 0.03), (0.48, 0.6, DZ - DT - 0.07), "powder_black", 1, bevel=0.006)
for i, z in enumerate((0.16, 0.38, 0.6)):
    box(f"drawer_front{i}", (-1.3, DY - 0.302, z), (0.46, 0.006, 0.2), "powder_black", 1, bevel=0.002)
    box(f"drawer_pull{i}", (-1.3, DY - 0.31, z + 0.07), (0.16, 0.01, 0.012), "steel", 1, bevel=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        sphere(f"drawer_wheel{sx}{sy}", (-1.3 + sx * 0.19, DY + sy * 0.24, 0.025), (0.022, 0.022, 0.022), "rubber", 1)

# gaming chair (ergonomic): star base, gas lift, sculpted seat and back
CX, CY = -0.45, 0.62
cyl("chair_lift", (CX, CY, 0.27), 0.028, 0.3, "steel", 1, verts=24)
cyl("chair_lift_cover", (CX, CY, 0.2), 0.04, 0.16, "black_plastic", 1, verts=24)
for i in range(5):
    a = i * 2 * math.pi / 5 + 0.3
    box(f"chair_leg{i}", (CX + 0.16 * math.cos(a), CY + 0.16 * math.sin(a), 0.085), (0.32, 0.055, 0.04), "black_plastic", 1, bevel=0.012, rot=(0, 0.08, a))
    sphere(f"chair_caster{i}", (CX + 0.31 * math.cos(a), CY + 0.31 * math.sin(a), 0.032), (0.03, 0.03, 0.03), "rubber", 1)
box("chair_seat", (CX, CY, 0.47), (0.52, 0.5, 0.1), "leather", 1, bevel=0.03, sub=2)
box("chair_seat_insert", (CX, CY + 0.01, 0.525), (0.3, 0.38, 0.02), "klein_fabric", 1, bevel=0.01, sub=1)
for s in (-1, 1):
    box(f"chair_bolster{s}", (CX + s * 0.22, CY, 0.53), (0.08, 0.46, 0.05), "leather", 1, bevel=0.02, sub=2)
box("chair_back", (CX, CY - 0.27, 0.95), (0.5, 0.11, 0.8), "leather", 1, bevel=0.04, sub=2, rot=(-0.14, 0, 0))
box("chair_back_insert", (CX, CY - 0.215, 0.92), (0.28, 0.02, 0.5), "klein_fabric", 1, bevel=0.01, sub=1, rot=(-0.14, 0, 0))
for s in (-1, 1):
    box(f"chair_wing{s}", (CX + s * 0.21, CY - 0.25, 1.02), (0.08, 0.1, 0.55), "leather", 1, bevel=0.03, sub=2, rot=(-0.14, 0, s * -0.15))
box("chair_headrest", (CX, CY - 0.225, 1.28), (0.26, 0.06, 0.13), "leather", 1, bevel=0.03, sub=2, rot=(-0.14, 0, 0))
for s in (-1, 1):
    box(f"chair_arm{s}", (CX + s * 0.3, CY - 0.02, 0.69), (0.07, 0.3, 0.035), "black_plastic", 1, bevel=0.012, sub=1)
    box(f"chair_arm_post{s}", (CX + s * 0.3, CY + 0.0, 0.58), (0.03, 0.05, 0.2), "black_plastic", 1, bevel=0.008)

# ---------------------------------------------------------------- 2: workstation
MY = W - T - 0.2
for i, x in enumerate((-0.84, -0.17)):
    box(f"monitor{i}", (x, MY, DZ + 0.37), (0.66, 0.03, 0.39), "black_plastic", 2, bevel=0.006)
    box(f"screen{i}", (x, MY - 0.0155, DZ + 0.38), (0.636, 0.002, 0.355), "screen", 2, bevel=0)
    box(f"monitor_neck{i}", (x, MY + 0.04, DZ + 0.14), (0.045, 0.025, 0.25), "steel", 2, bevel=0.006)
    box(f"monitor_foot{i}", (x, MY + 0.0, DZ + 0.007), (0.26, 0.17, 0.012), "steel", 2, bevel=0.005)
box("desk_mat", (-0.5, DY - 0.15, DZ + 0.002), (1.1, 0.36, 0.004), "graphite", 2, bevel=0.002)
# keyboard with individual keys + blue underglow
KX, KY, KZ = -0.52, DY - 0.17, DZ + 0.006
box("keyboard_case", (KX, KY, KZ + 0.012), (0.44, 0.14, 0.022), "black_plastic", 2, bevel=0.005)
box("keyboard_glow", (KX, KY, KZ + 0.024), (0.42, 0.125, 0.002), "keys_glow", 2, bevel=0)
keys = []
for r_ in range(5):
    for c_ in range(15):
        keys.append(((KX - 0.196 + c_ * 0.028, KY - 0.05 + r_ * 0.025, KZ + 0.031), (0.022, 0.02, 0.012)))
multibox("keycaps", keys, "black_plastic", 2, bevel=0.003)
sphere("mouse", (-0.1, KY, DZ + 0.016), (0.032, 0.054, 0.02), "black_plastic", 2)
# laptop on the return, opened toward the room
LX, LY = W - T - 0.36, 0.75
box("laptop_base", (LX, LY, DZ + 0.009), (0.3, 0.38, 0.014), "steel", 2, bevel=0.005)
lid_rot = (0, -0.22, 0)
box("laptop_lid", (LX + 0.17, LY, DZ + 0.14), (0.012, 0.38, 0.26), "steel", 2, bevel=0.004, rot=lid_rot)
box("laptop_screen", (LX + 0.162, LY, DZ + 0.145), (0.002, 0.35, 0.22), "screen", 2, bevel=0, rot=lid_rot)
# desk lamp: weighted base, two-part arm, cone head, warm bulb + light
LPX, LPY = -1.32, DY + 0.08
if P["japan"]:
    cyl("lamp_base", (LPX, LPY - 0.1, DZ + 0.012), 0.08, 0.024, "hinoki_wood", 2, bevel=0.004)
    cyl("lamp_head", (LPX, LPY - 0.1, DZ + 0.2), 0.085, 0.32, "shoji", 2, verts=48, bevel=0.01)
    for k, zz in enumerate((DZ + 0.04, DZ + 0.36)):
        cyl(f"lamp_ring{k}", (LPX, LPY - 0.1, zz), 0.088, 0.012, "hinoki_wood", 2, verts=48)
else:
    cyl("lamp_base", (LPX, LPY, DZ + 0.012), 0.075, 0.024, "powder_black", 2, bevel=0.004)
    tube("lamp_arm", [(LPX, LPY, DZ + 0.02), (LPX, LPY + 0.06, DZ + 0.36), (LPX, LPY - 0.14, DZ + 0.5)], 0.012, "powder_black", 2)
    cyl("lamp_head", (LPX, LPY - 0.18, DZ + 0.46), 0.065, 0.13, "powder_black", 2, r2=0.025, rot=(0.9, 0, 0))
    sphere("lamp_bulb", (LPX, LPY - 0.21, DZ + 0.42), (0.03, 0.03, 0.03), "lamp_glow", 2)
bpy.ops.object.light_add(type="SPOT", location=(LPX, LPY - 0.21, DZ + 0.42))
lamp = bpy.context.active_object
lamp.name = "lamp_light"
lamp.data.energy = 25
lamp.data.color = (1.0, 0.8, 0.55)
lamp.data.spot_size = math.radians(80)
lamp.data.spot_blend = 0.6
lamp.data.shadow_soft_size = 0.03
lamp.rotation_euler = (0.55, 0, 0)
link_light(lamp, 2)
# mic on a boom arm at the corner
MX, MYc = W - T - 0.1, W - T - 0.12
cyl("mic_clamp", (MX, MYc, DZ + 0.04), 0.02, 0.08, "powder_black", 2)
tube("mic_boom", [(MX, MYc, DZ + 0.06), (MX, MYc, DZ + 0.45), (MX - 0.38, MYc - 0.1, DZ + 0.66), (MX - 0.6, MYc - 0.2, DZ + 0.56)], 0.013, "powder_black", 2)
cyl("mic", (MX - 0.62, MYc - 0.21, DZ + 0.47), 0.03, 0.15, "graphite", 2, verts=32, bevel=0.004)
sphere("mic_grille", (MX - 0.62, MYc - 0.21, DZ + 0.56), (0.032, 0.032, 0.036), "steel", 2)
# Klein-blue LED under the desk front edges + soft wash light
box("led_desk", (-0.36, DY - 0.355, DZ - DT - 0.006), (2.54, 0.012, 0.01), "led", 2, bevel=0)
box("led_desk_return", (W - T - 0.715, 0.4, DZ - DT - 0.006), (0.012, 1.0, 0.01), "led", 2, bevel=0)
bpy.ops.object.light_add(type="AREA", location=(-0.25, DY - 0.2, DZ - DT - 0.02))
glow = bpy.context.active_object
glow.name = "desk_glow"
glow.data.shape = "RECTANGLE"
glow.data.size, glow.data.size_y = 2.6, 0.25
glow.data.energy = 45
LED_RGB = tuple(c / max(lin(P["led"])[:3]) for c in lin(P["led"])[:3])  # theme LED colour, full brightness
glow.data.color = LED_RGB
glow.data.energy = 120 if P["night"] else (45 if THEME == "base" else 22)
link_light(glow, 2)

# cables: monitors and laptop down behind the desk
for i, x in enumerate((-0.84, -0.17)):
    tube(f"cable{i}", [(x, MY + 0.06, DZ + 0.1), (x + 0.02, MY + 0.12, DZ - 0.02), (x + 0.05, MY + 0.14, 0.35), (x + 0.1, MY + 0.15, 0.02)], 0.004, "rubber", 2)
tube("cable_laptop", [(LX + 0.12, LY + 0.2, DZ + 0.01), (LX + 0.25, LY + 0.26, DZ - 0.02), (LX + 0.3, LY + 0.3, 0.3), (LX + 0.32, LY + 0.33, 0.02)], 0.003, "rubber", 2)
# coffee mug + notebook + pen
cyl("mug", (0.2, DY - 0.12, DZ + 0.05), 0.04, 0.095, "ceramic", 2, bevel=0.003)
cyl("mug_coffee", (0.2, DY - 0.12, DZ + 0.088), 0.034, 0.004, "soil", 2)
bpy.ops.mesh.primitive_torus_add(major_radius=0.025, minor_radius=0.007, location=(0.245, DY - 0.12, DZ + 0.05), rotation=(math.pi / 2, 0, 0))
mh = bpy.context.active_object
mh.name = "mug_handle"
place(mh, "ceramic", 2, smooth=True)
box("notebook", (0.42, DY - 0.08, DZ + 0.008), (0.16, 0.22, 0.014), "book_black", 2, bevel=0.003, rot=(0, 0, 0.18))
box("notebook_band", (0.45, DY - 0.07, DZ + 0.0155), (0.006, 0.22, 0.002), "klein", 2, bevel=0, rot=(0, 0, 0.18))
tube("pen", [(0.36, DY - 0.2, DZ + 0.018), (0.48, DY - 0.17, DZ + 0.018)], 0.004, "steel", 2)

# ---------------------------------------------------------------- 3: complete (decor)
# three framed prints above the desk, each lit by a small wall spot
for i, x in enumerate((-1.2, -0.42, 0.36)):
    z = 1.74
    if P["japan"]:  # hanging scroll: paper on a cloth backing, wooden rollers, a cord
        box(f"frame{i}", (x, W - T - 0.012, z - 0.05), (0.44, 0.006, 0.9), "book_bone", 3, bevel=0.001)
        box(f"print{i}", (x, W - T - 0.016, z - 0.02), (0.36, 0.002, 0.62), f"print{i}", 3, bevel=0)
        for k, zz in enumerate((z + 0.41, z - 0.51)):
            cyl(f"roller{i}{k}", (x, W - T - 0.02, zz), 0.012, 0.5, "hinoki_wood", 3, rot=(0, math.pi / 2, 0))
        tube(f"cord{i}", [(x - 0.2, W - T - 0.02, z + 0.41), (x, W - T - 0.01, z + 0.56), (x + 0.2, W - T - 0.02, z + 0.41)], 0.002, "ink", 3)
    else:
        box(f"frame{i}", (x, W - T - 0.018, z), (0.54, 0.03, 0.68), "frame_black", 3, bevel=0.003)
        box(f"mat{i}", (x, W - T - 0.034, z), (0.49, 0.002, 0.63), "book_bone", 3, bevel=0)
        box(f"print{i}", (x, W - T - 0.036, z), (0.4, 0.002, 0.52), f"print{i}", 3, bevel=0)
    box(f"spot_mount{i}", (x, W - T - 0.01, z + 0.5), (0.05, 0.02, 0.05), "powder_black", 3, bevel=0.004)
    cyl(f"spot{i}", (x, W - T - 0.06, z + 0.48), 0.028, 0.1, "powder_black", 3, rot=(math.pi / 2 + 0.7, 0, 0))
    bpy.ops.object.light_add(type="SPOT", location=(x, W - T - 0.09, z + 0.45))
    sp = bpy.context.active_object
    sp.name = f"art_light{i}"
    sp.data.energy = 18
    sp.data.color = (1.0, 0.86, 0.68)
    sp.data.spot_size = math.radians(55)
    sp.data.spot_blend = 0.7
    sp.data.shadow_soft_size = 0.02
    sp.rotation_euler = (0.32, 0, 0)
    link_light(sp, 3)

# floating shelves on the window wall, behind the desk return
BOOKS = ["book_black", "book_bone", "book_blue", "book_black", "book_grey", "book_bone", "book_black"]
for k, z in enumerate((1.55, 1.95)):
    box(f"shelf{k}", (W - T - 0.12, 0.85, z), (0.24, 0.86, 0.04), "oak", 3, bevel=0.004)
    y = 0.48
    for j in range(6 - k):
        th = 0.025 + 0.02 * random.random()
        tall = 0.18 + 0.08 * random.random()
        lean = 0.0 if j < 5 - k else 0.25
        box(f"book{k}_{j}", (W - T - 0.13, y + th / 2 + (0.04 if lean else 0), z + 0.02 + tall / 2 - (0.01 if lean else 0)), (0.17, th, tall), BOOKS[(j + k * 2) % len(BOOKS)], 3, bevel=0.002, rot=(lean, 0, 0))
        y += th + 0.003
    # small plant in a ceramic pot
    px, py, pz = W - T - 0.13, 1.12 - 0.05 * k, z + 0.02
    cyl(f"shelf_pot{k}", (px, py, pz + 0.05), 0.05, 0.1, "ceramic", 3, r2=0.04, bevel=0.003)
    cyl(f"shelf_soil{k}", (px, py, pz + 0.098), 0.045, 0.004, "soil", 3)
    for j in range(9):
        leaf(f"shelf_leaf{k}_{j}", (px, py, pz + 0.1), 0.08 + 0.02 * (j % 3), 0.04, j * 2.4, 0.5 + 0.3 * (j % 2), "leaf_light" if j % 2 else "leaf", 3, curl=0.5)
# brass object, ceramic vase, a candle on the shelves
cyl("candle", (W - T - 0.13, 0.4, 1.95 + 0.06), 0.035, 0.09, "book_bone", 3, bevel=0.004)
cyl("candle_jar", (W - T - 0.13, 0.4, 1.95 + 0.05), 0.04, 0.085, "glass", 3)
cyl("vase", (W - T - 0.13, 1.18, 1.95 + 0.11), 0.045, 0.18, "ceramic_dark", 3, r2=0.03, bevel=0.003)
sphere("brass_orb", (W - T - 0.13, 0.42, 1.55 + 0.06), (0.04, 0.04, 0.04), "brass", 3)


def pot(name, x, y, z0, r, h, m="ceramic"):
    cyl(f"{name}_pot", (x, y, z0 + h / 2), r, h, m, 3, r2=r * 0.8, bevel=0.006)
    cyl(f"{name}_soil", (x, y, z0 + h - 0.01), r * 0.92, 0.01, "soil", 3)
    return z0 + h - 0.01


def monstera(name, x, y, z0, scale=1.0):
    """Bushy plant: stems radiating from the pot, a big curved leaf on each."""
    top = pot(name, x, y, z0, 0.13 * scale, 0.24 * scale)
    for j in range(13):
        a = j * 2.39996 + 0.3
        el = 0.35 + 0.5 * ((j * 37) % 11) / 11
        ln = (0.18 + 0.2 * ((j * 13) % 7) / 7) * scale
        tip = (x + math.cos(a) * ln * math.cos(el), y + math.sin(a) * ln * math.cos(el), top + ln * math.sin(el) + 0.12 * scale)
        tube(f"{name}_stem{j}", [(x, y, top), (x + (tip[0] - x) * 0.5, y + (tip[1] - y) * 0.5, tip[2] + 0.03), tip], 0.005 * scale, "stem", 3)
        leaf(f"{name}_leaf{j}", tip, (0.2 + 0.08 * (j % 3)) * scale, (0.15 + 0.04 * (j % 2)) * scale, a, 0.25 - 0.15 * (j % 3), "leaf" if j % 3 else "leaf_light", 3, roll=0.2 * ((j % 2) * 2 - 1), curl=0.35)


def snake_plant(name, x, y, z0):
    top = pot(name, x, y, z0, 0.11, 0.28, m="ceramic_dark")
    for j in range(11):
        a = j * 2.4
        r = 0.035 * (j % 3)
        leaf(f"{name}_leaf{j}", (x + r * math.cos(a), y + r * math.sin(a), top), 0.55 + 0.35 * ((j * 7) % 5) / 5, 0.07, a, 1.35 - 0.06 * (j % 4), "leaf_snake", 3, roll=0.4 * (j % 3), curl=0.04, shape="sword")


def pothos(name, start, drop, stage=3):
    """Trailing vine: a hanging stem with small heart leaves along it."""
    x, y, z = start
    pts = []
    for j in range(12):
        t = j / 11
        pts.append((x + 0.04 * math.sin(t * 5), y - 0.05 * t, z - drop * t))
    tube(f"{name}_vine", pts, 0.0045, "stem", stage)
    for j, p in enumerate(pts[1:]):
        leaf(f"{name}_leaf{j}", p, 0.07, 0.055, j * 2.1, -0.2 + 0.3 * (j % 2), "leaf_pothos", stage, roll=0.6, curl=0.3, shape="heart")


def maple(name, x, y, z0):
    """Red maple bonsai: low dark pot, a twisting trunk, clouds of red leaves."""
    top = pot(name, x, y, z0, 0.2, 0.12, m="ceramic_dark")
    trunk = [(x, y, top), (x + 0.05, y - 0.02, top + 0.18), (x - 0.04, y + 0.03, top + 0.34), (x + 0.02, y, top + 0.48)]
    tube(f"{name}_trunk", trunk, 0.025, "lacquer", 3)
    for c, (cx, cy, cz, r) in enumerate(((x + 0.12, y - 0.06, top + 0.3, 0.16), (x - 0.12, y + 0.06, top + 0.44, 0.17), (x + 0.04, y, top + 0.58, 0.15))):
        tube(f"{name}_branch{c}", [trunk[1 + c], (cx, cy, cz)], 0.01, "lacquer", 3)
        for j in range(16):
            a = j * 2.4
            leaf(f"{name}_leaf{c}_{j}", (cx + r * 0.5 * math.cos(a), cy + r * 0.5 * math.sin(a), cz + 0.03 * (j % 3)), 0.07, 0.05, a, 0.2, "leaf_maple", 3, curl=0.3)


def bamboo(name, x, y, z0):
    top = pot(name, x, y, z0, 0.12, 0.26, m="ceramic_dark")
    for k in range(5):
        a = k * 1.3
        bx, by = x + 0.04 * math.cos(a), y + 0.04 * math.sin(a)
        hgt = 1.1 + 0.25 * (k % 3)
        tube(f"{name}_cane{k}", [(bx, by, top), (bx + 0.02 * math.cos(a), by + 0.02 * math.sin(a), top + hgt)], 0.012, "stem", 3)
        for j in range(4):
            leaf(f"{name}_leaf{k}_{j}", (bx, by, top + hgt * (0.55 + 0.12 * j)), 0.16, 0.035, a + j * 1.7, -0.3, "leaf_light", 3, curl=0.2, shape="sword")


if P["japan"]:
    maple("plant_front", -1.28, -1.3, 0.0)
    bamboo("plant_window", W - T - 0.2, -1.5, 0.0)
else:
    monstera("plant_front", -1.28, -1.3, 0.0, scale=1.35)
    snake_plant("plant_window", W - T - 0.2, -1.5, 0.0)
top = pot("plant_sill", W - T - 0.08, -0.85, WZ0 - 0.003, 0.055, 0.09)
for j in range(10):
    leaf(f"plant_sill_leaf{j}", (W - T - 0.08, -0.85, top), 0.09, 0.05, j * 2.4, 0.6 + 0.2 * (j % 2), "leaf_light", 3, curl=0.4)
top = pot("plant_desk", 0.72, W - T - 0.18, DZ, 0.05, 0.09)
for j in range(9):
    leaf(f"plant_desk_leaf{j}", (0.72, W - T - 0.18, top), 0.1, 0.05, j * 2.4, 0.7, "leaf", 3, curl=0.4)
pothos("pothos_desk", (-1.5, DY - 0.24, DZ + 0.05), 0.55)
pothos("pothos_shelf", (W - T - 0.22, 1.1, 1.95 + 0.05), 0.5)

# round jute rug + black coffee table + controller
cyl("rug", (0.0, -0.45, 0.018), 0.95, 0.016, "jute", 3, verts=128, bevel=0.006)
if P["japan"]:
    box("table_top", (0.0, -0.5, 0.3), (0.8, 0.55, 0.04), "lacquer", 3, bevel=0.01)
    for sx_ in (-1, 1):
        for sy_ in (-1, 1):
            box(f"table_leg{sx_}{sy_}", (sx_ * 0.34, -0.5 + sy_ * 0.22, 0.14), (0.05, 0.05, 0.28), "lacquer", 3, bevel=0.006)
    sphere("teapot", (0.12, -0.55, 0.38), (0.07, 0.07, 0.06), "ceramic_dark", 3)
    tube("teapot_spout", [(0.18, -0.55, 0.37), (0.24, -0.55, 0.41)], 0.008, "ceramic_dark", 3)
    for k, (cx_, cy_) in enumerate(((-0.08, -0.6), (-0.02, -0.4))):
        cyl(f"teacup{k}", (cx_, cy_, 0.345), 0.03, 0.05, "ceramic", 3, r2=0.024, bevel=0.003)
    top = pot("plant_table", -0.24, -0.42, 0.32, 0.045, 0.07)
else:
    cyl("table_top", (0.0, -0.5, 0.36), 0.34, 0.05, "powder_black", 3, verts=64, bevel=0.012)
    cyl("table_base", (0.0, -0.5, 0.17), 0.22, 0.33, "powder_black", 3, verts=64, bevel=0.01)
    box("controller", (0.04, -0.52, 0.4), (0.15, 0.1, 0.03), "black_plastic", 3, bevel=0.012, sub=1, rot=(0, 0, 0.4))
    top = pot("plant_table", -0.14, -0.4, 0.385, 0.045, 0.07)
for j in range(8):
    leaf(f"plant_table_leaf{j}", (-0.24 if P["japan"] else -0.14, -0.42 if P["japan"] else -0.4, top), 0.08, 0.04, j * 2.4, 0.6, "leaf_light", 3, curl=0.45)

# lounge chair: puffy bouclé seat + back cushion, pillows, a knit throw draped over the front
LCX, LCY, LR = 1.0, -0.85, 0.15


def puff(o, amount=0.012, cast=0.08):
    """Round the box toward a pillow (cast) + organic lumps (displace)."""
    cm = o.modifiers.new("round", "CAST")
    cm.cast_type = "SPHERE"
    cm.factor = cast
    tex = bpy.data.textures.new(o.name + "_lumps", "CLOUDS")
    tex.noise_scale = 0.25
    d = o.modifiers.new("lumps", "DISPLACE")
    d.texture = tex
    d.strength = amount
    d.mid_level = 0.5
    return o


def lounge_body(depth=0.86, width=0.88):
    """Upholstered L profile (seat + back) extruded across the width."""
    prof = [(-depth / 2, 0.0), (depth / 2, 0.0), (depth / 2 + 0.06, 0.82), (depth / 2 - 0.24, 0.8), (depth / 2 - 0.3, 0.36), (-depth / 2, 0.36)]
    me = bpy.data.meshes.new("lounge")
    bm = bmesh.new()
    left = [bm.verts.new((x, -width / 2, z)) for x, z in prof]
    right = [bm.verts.new((x, width / 2, z)) for x, z in prof]
    bm.faces.new(left[::-1])
    bm.faces.new(right)
    n = len(prof)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((left[i], left[j], right[j], right[i]))
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bm.to_mesh(me)
    bm.free()
    return me


if P["japan"]:
    # zaisu: a legless floor chair (indigo cushion, lacquer frame) + a vermilion cushion
    box("lounge_body", (LCX, LCY, 0.05), (0.62, 0.62, 0.08), "lacquer", 3, bevel=0.01, rot=(0, 0, LR))
    puff(box("lounge_seat", (LCX, LCY, 0.13), (0.56, 0.56, 0.08), "klein_fabric", 3, bevel=0.03, sub=2, rot=(0, 0, LR)), 0.006, cast=0.04)
    box("lounge_back", (LCX + 0.26, LCY + 0.04, 0.38), (0.06, 0.58, 0.55), "lacquer", 3, bevel=0.01, rot=(0, -0.35, LR))
    puff(box("lounge_back_pad", (LCX + 0.21, LCY + 0.04, 0.4), (0.05, 0.5, 0.46), "klein_fabric", 3, bevel=0.02, sub=2, rot=(0, -0.35, LR)), 0.005, cast=0.04)
    puff(box("pillow", (LCX + 0.05, LCY - 0.02, 0.27), (0.1, 0.32, 0.28), "pillow_klein", 3, bevel=0.05, sub=3, rot=(0, -0.3, LR + 0.1)), 0.01, cast=0.25)
else:
    lb = bpy.data.objects.new("lounge_body", lounge_body())
    scene.collection.objects.link(lb)
    lb.location = (LCX + 0.02, LCY, 0.0)
    lb.rotation_euler = (0, 0, LR)
    place(lb, "boucle", 3, bevel=0.09, seg=5, sub=2)
    puff(lb, 0.012, cast=0.0)
    puff(box("lounge_seat", (LCX - 0.1, LCY, 0.42), (0.6, 0.82, 0.14), "boucle", 3, bevel=0.06, sub=3, rot=(0, 0, LR)), 0.016, cast=0.06)
    puff(box("lounge_back", (LCX + 0.24, LCY + 0.04, 0.66), (0.18, 0.8, 0.46), "boucle", 3, bevel=0.07, sub=3, rot=(0, -0.22, LR)), 0.016, cast=0.06)
    puff(box("pillow_back", (LCX + 0.1, LCY + 0.17, 0.68), (0.13, 0.36, 0.34), "pillow_grey", 3, bevel=0.06, sub=3, rot=(0, -0.28, LR - 0.15)), 0.01, cast=0.25)
    puff(box("pillow", (LCX + 0.02, LCY - 0.06, 0.64), (0.13, 0.38, 0.36), "pillow_klein", 3, bevel=0.06, sub=3, rot=(0, -0.24, LR + 0.1)), 0.01, cast=0.25)


    def throw_mesh(width=0.44, length=0.78, nu=14, nv=30):
        """Blanket lying on the seat, then falling over the front edge in soft folds."""
        me = bpy.data.meshes.new("throw")
        bm = bmesh.new()
        rows = []
        for i in range(nv + 1):
            t = i / nv
            s_ = t * length
            if s_ < 0.28:  # on the seat
                x, z = -s_, 0.0
            else:  # over the edge and down
                a = min(1.0, (s_ - 0.28) / 0.14) * (math.pi / 2)
                x = -0.28 - 0.09 * math.sin(a) - max(0, s_ - 0.42) * 0.12
                z = -0.09 * (1 - math.cos(a)) - max(0, s_ - 0.42) * 0.98
            row = []
            for j in range(nu + 1):
                u = (j / nu - 0.5) * width
                fold = 0.018 * math.sin(j / nu * math.pi * 3 + t * 2) * min(1, t * 2)
                row.append(bm.verts.new((x + fold * 0.6, u, z + fold)))
            rows.append(row)
        for i in range(nv):
            for j in range(nu):
                bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
        bm.to_mesh(me)
        bm.free()
        return me


    th = bpy.data.objects.new("throw", throw_mesh())
    scene.collection.objects.link(th)
    th.location = (LCX - 0.12, LCY - 0.14, 0.5)
    th.rotation_euler = (0, 0, LR)  # lies on the seat, drapes over the front edge
    place(th, "throw", 3, sub=2, smooth=True)
    sol = th.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.014

# ================================================================ world + lights
# invisible ceiling: only casts shadows, so sun enters through the window alone
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, H + 0.01))
ceil = bpy.context.active_object
ceil.name = "ceiling_shadow"
ceil.scale = (2 * W, 2 * W, 1)
ceil.visible_camera = False
ceil.visible_diffuse = False
ceil.visible_glossy = False
ceil.visible_transmission = False
ceil.visible_volume_scatter = False

world = bpy.data.worlds.new("world")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = lin("#0A0E1A" if P["night"] else "#F3E8D8")
bg.inputs["Strength"].default_value = 0.09 if P["night"] else 0.14


def aim(o, direction):
    o.rotation_euler = Vector(direction).to_track_quat("-Z", "Y").to_euler()


# sun through the window (warm, low), soft fill from the viewer's side
bpy.ops.object.light_add(type="SUN", location=(0, 0, 10))
sun = bpy.context.active_object
sun.data.energy = 0.0 if P["night"] else 9.0
sun.data.color = (1.0, 0.9, 0.76)
sun.data.angle = math.radians(3)
aim(sun, (-0.75, 0.25, -0.6))
bpy.ops.object.light_add(type="AREA", location=(-6, -6, 6))
fill = bpy.context.active_object
fill.data.energy = 280 if P["night"] else 620
fill.data.size = 8
fill.data.color = (1.0, 0.94, 0.86)
aim(fill, (1, 1, -0.8))
# skylight bounce entering through the window
bpy.ops.object.light_add(type="AREA", location=(W + 0.1, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2))
sky = bpy.context.active_object
sky.data.shape = "RECTANGLE"
sky.data.size, sky.data.size_y = WZ1 - WZ0, WY1 - WY0
sky.data.energy = 45 if P["night"] else 160
if P["night"]:
    sky.data.color = (0.45, 0.55, 1.0)
    lamp.data.energy = 45
    for o in bpy.data.objects:
        if o.name.startswith("art_light"):
            o.data.energy = 26
sky.data.color = (1.0, 0.97, 0.92)
aim(sky, (-1, 0, 0))

# lights light the scene but are never seen by the camera (the big fill sits between camera and room)
for o in bpy.data.objects:
    if o.type == "LIGHT":
        o.visible_camera = False
        o.visible_glossy = False

for k, (loc, sx, sy, d) in enumerate((((0, -W - 0.03, -0.14), 2 * W, 0.04, (0, -0.4, -1)), ((-W - 0.03, 0, -0.14), 0.04, 2 * W, (-0.4, 0, -1)))):
    bpy.ops.object.light_add(type="AREA", location=loc)
    sl = bpy.context.active_object
    sl.name = f"slab_glow{k}"
    sl.data.shape = "RECTANGLE"
    sl.data.size, sl.data.size_y = sx, sy
    sl.data.energy = 110 if P["night"] else 60
    sl.data.color = LED_RGB
    sl.visible_camera = False
    aim(sl, d)
    link_light(sl, 0)

# ================================================================ camera: iso, orthographic
target = bpy.data.objects.new("target", None)
target.location = (0.1, 0.1, 1.05)
scene.collection.objects.link(target)
cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 6.2
cam = bpy.data.objects.new("cam", cam_data)
d = 12
cam.location = (target.location.x - d, target.location.y - d, target.location.z + d * math.sqrt(2) * math.tan(math.radians(30)))
c = cam.constraints.new("TRACK_TO")
c.target = target
c.track_axis = "TRACK_NEGATIVE_Z"
c.up_axis = "UP_Y"
scene.collection.objects.link(cam)
scene.camera = cam

# ================================================================ render settings
r = scene.render
r.resolution_x, r.resolution_y = 1000, 1250
r.film_transparent = True
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
r.image_settings.color_depth = "16"
looks = [i.identifier for i in scene.view_settings.bl_rna.properties["look"].enum_items]
vts = [i.identifier for i in scene.view_settings.bl_rna.properties["view_transform"].enum_items]
# Khronos PBR Neutral: photographic, but saturated brand colours stay true (AgX pushes Klein blue to violet)
scene.view_settings.view_transform = "Khronos PBR Neutral" if "Khronos PBR Neutral" in vts else "AgX"
scene.view_settings.look = "None"
scene.view_settings.exposure = 0.45
if EEVEE or WATCH:
    r.engine = "BLENDER_EEVEE"
    ee = scene.eevee
    ee.taa_render_samples = 64
    for attr, val in (("use_raytracing", True), ("use_shadows", True), ("use_gtao", True)):
        if hasattr(ee, attr):
            setattr(ee, attr, val)
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
    except Exception as e:  # fall back to CPU
        print("GPU unavailable:", e)
    cy.samples = SAMPLES
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.01
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.max_bounces = 10
    cy.diffuse_bounces = 5
    cy.glossy_bounces = 4
    cy.transparent_max_bounces = 12
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.blur_glossy = 1.0

# ================================================================ watch mode: build live in the UI
if WATCH:
    for _, o in ORDER:
        o.hide_set(True)
        o.hide_render = True
    queue = list(ORDER)
    state = {"prev": None}

    def setup_view():
        for win in bpy.context.window_manager.windows:
            for area in win.screen.areas:
                if area.type == "VIEW_3D":
                    sp = area.spaces.active
                    sp.shading.type = "RENDERED"
                    sp.overlay.show_overlays = False
                    sp.region_3d.view_perspective = "CAMERA"
        return None

    def reveal():
        if not queue:
            print("studio built")
            return None
        stage, o = queue.pop(0)
        o.hide_set(False)
        o.hide_render = False
        pause = 1.0 if state["prev"] is not None and stage != state["prev"] else 0.04
        state["prev"] = stage
        return pause

    bpy.app.timers.register(setup_view, first_interval=0.5)
    bpy.app.timers.register(reveal, first_interval=2.5)

# Save the scene; renders come from scripts/blender/render_stages.py in a fresh
# session (rendering here, in the session that built the scene, brightened the
# lower half of the frame).
if not WATCH:
    for col in STAGES:
        col.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "studio.blend"))
    print("saved", os.path.join(OUT, "studio.blend"))
