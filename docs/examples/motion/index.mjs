import {setupCanvas, canvas, ctx} from "./canvas.mjs"
import {Transform, V2} from "@darcyvilkner/2d-geometry"
import {DebugRenderer, Clock, GeometryBuilder, PhysicsObject, Trajectory} from "@darcyvilkner/chrona-physics"

setupCanvas()

const clk = new Clock()

// Create geometry

const geometry = new GeometryBuilder()
    .polygon(...V2.multipleFromVals(
        -1, -1,
        1, -1,
        1, 1,
        -1, 1,
    ))
    .finish()

// Create trajectory

const trajectory = new Trajectory(
    clk,
    Transform
        .scale(0.2)
        .translateVals(-0.5, -0.5),
)

trajectory.impulse(0.1, 0.1)

// Create object

const obj = new PhysicsObject(clk, geometry, [], trajectory)

const renderer = new DebugRenderer(
    ctx,
    Transform
        .scale(canvas.height / 2)
        .translateVals(canvas.width / 2, canvas.height / 2),
)

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.beginPath()
    renderer.draw(obj)
    ctx.stroke()
}

draw()

let t = 0
onkeydown = () => {
    t ++
    clk.runTo(t)
    draw()
}