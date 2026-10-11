"""
Clickable zones for the web studio: the world-space bounding box of each
interactive object group, converted to glTF axes (Y up), written as JSON next
to the exported model. The web model is one baked mesh, so the viewer lays
invisible boxes over these zones for hover/click.

Run: Blender -b <outdir>/studio.blend -P scripts/blender/hotspots.py -- <out.json>
"""
import bpy, sys, json
from mathutils import Vector

out = sys.argv[sys.argv.index("--") + 1]

# hotspot id -> object name prefixes (see studio_room.py)
GROUPS = {
    "monitors": ["monitor0", "monitor1", "screen0", "screen1", "monitor_neck", "monitor_foot"],
    "laptop": ["laptop_"],
    "art": ["frame", "mat", "print", "spot_mount", "spot"],
}
# glTF exporter's Blender-node offset: the same Center() wraps model + zones in the viewer,
# so raw coordinates in the exported space are all that's needed.
deps = bpy.context.evaluated_depsgraph_get()
zones = {}
for zid, prefixes in GROUPS.items():
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    hit = 0
    for o in bpy.data.objects:
        if o.type not in ("MESH", "CURVE") or not any(o.name.startswith(p) for p in prefixes):
            continue
        if o.name.startswith("spot") and not o.name.startswith(("spot_mount", "spot")):
            continue
        ev = o.evaluated_get(deps)
        for c in ev.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
        hit += 1
    pad = 0.02
    lo -= Vector((pad, pad, pad))
    hi += Vector((pad, pad, pad))
    # Blender (x, y, z) -> glTF (x, z, -y)
    zones[zid] = {
        "min": [lo.x, lo.z, -hi.y],
        "max": [hi.x, hi.z, -lo.y],
        "objects": hit,
    }
json.dump(zones, open(out, "w"), indent=1)
print(json.dumps({k: v["objects"] for k, v in zones.items()}))
