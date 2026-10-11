"""
Render the station loop (station.py --anim writes station.blend with keyframes).
Run: Blender -b <outdir>/station.blend -P scripts/blender/render_anim.py -- <outdir> [--samples N] [--frames A-B]
Writes <outdir>/frames/0001.png ... (encode to video afterwards).
"""
import bpy, sys, os

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
sc = bpy.context.scene
if "--samples" in args:
    sc.cycles.samples = int(args[args.index("--samples") + 1])
if "--frames" in args:
    a, b = args[args.index("--frames") + 1].split("-")
    sc.frame_start, sc.frame_end = int(a), int(b)
out = os.path.join(args[0], "frames")
os.makedirs(out, exist_ok=True)
sc.render.filepath = os.path.join(out, "")
sc.render.use_persistent_data = True  # keep the scene on the GPU between frames
sc.render.use_overwrite = False  # resume: skip frames already on disk
sc.render.use_placeholder = True
bpy.ops.render.render(animation=True)
print("frames done", sc.frame_start, sc.frame_end)
