import {setupCanvas, canvas, ctx} from "./canvas.mjs"
import {Transform, V2} from "@darcyvilkner/2d-geometry"
import {Clock, GeometryBuilder, PhysicsObject, scheduleLoop, Trajectory, DebugRenderer} from "@darcyvilkner/chrona-physics"

setupCanvas()

const
    clk = new Clock(),
    trajectory = new Trajectory(clk, Transform.identity())

let angle = 0
const
    angularFreq = 1,
    dt = 0.2

scheduleLoop(clk, 0, dt, clock => {
    angle += angularFreq * dt
    trajectory.transformTo(Transform.rotate(angle), dt)
})




const
    boxGeometry = new GeometryBuilder()
        .polygon(...V2.multipleFromArray([
            -1, -1,
            1, -1,
            1, 1,
            -1, 1,
        ]))
        .finish(),
    obj = new PhysicsObject(clk, boxGeometry, [], trajectory)

const
    camera = Transform.scale(100).translateVals(innerWidth / 2, innerHeight / 2),
    renderer = new DebugRenderer(ctx, camera)

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.resetTransform()
    ctx.scale(devicePixelRatio, devicePixelRatio)

    ctx.beginPath()
    renderer.draw(obj)
    ctx.stroke()
}

let
    t = 0,
    then = performance.now()
function loop(now){
    let dt = (now - then) / 1000
    if(dt < 0 || 1 < dt) dt = 0
    then = now

    t += dt
    clk.runTo(t)

    draw()

    requestAnimationFrame(loop)
}

draw()

requestAnimationFrame(loop)