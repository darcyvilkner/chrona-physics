import {Transform, V2} from "@darcyvilkner/2d-geometry"
import {Clock, GeometryBuilder, PhysicsObject, DebugRenderer} from "@darcyvilkner/chrona-physics"


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