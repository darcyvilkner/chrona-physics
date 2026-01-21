import {Clock, GeometryBuilder, PhysicsObject, Transform, V2} from "../../../chrona/index.mjs"
import {DebugRenderer} from "../../../chrona/engine/debug-renderer.mjs"


const
    canvas = document.getElementById("canvas"),
    /** @type {CanvasRenderingContext2D} */
    ctx = canvas.getContext("2d"),

    camera = Transform.scale(0.8 * canvas.height / 2).translateVals(canvas.width / 2, canvas.height / 2),

    clock = new Clock(),
    obj = new PhysicsObject(clock, new GeometryBuilder()
        .polygon(...V2.multipleFromVals(
            0, 0,
            0, 1,
            1, 0,
        ))
        .finish()),

    renderer = new DebugRenderer(ctx, camera)

ctx.lineWidth = 10
ctx.beginPath()
renderer.draw(obj)
ctx.stroke()