"""
Render the saved studio scene (scripts/blender/studio_room.py writes studio.blend).
Rendering from a fresh session avoids a lighting artifact seen when Cycles renders
in the same session that built the scene.

Run: Blender -b <outdir>/studio.blend -P scripts/blender/render_stages.py -- <outdir> [stage] [--samples N]
"""
import bpy, sys, os

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
samples = None
if "--samples" in args:
    samples = int(args[args.index("--samples") + 1])
    del args[args.index("--samples") : args.index("--samples") + 2]
out = args[0]
only = int(args[1]) if len(args) > 1 else None
sc = bpy.context.scene
if samples:
    sc.cycles.samples = samples
stages = sorted([c for c in bpy.data.collections if c.name[:1].isdigit() and "_" in c.name], key=lambda c: c.name)
if not stages:  # single-model scenes (stations): one render
    sc.render.filepath = os.path.join(out, "render.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", sc.render.filepath)
for s in ([only] if only is not None else range(len(stages))):
    for i, c in enumerate(stages):
        c.hide_render = i > s
    sc.render.filepath = os.path.join(out, f"studio-stage{s}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", sc.render.filepath)
