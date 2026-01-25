import {canvas, ctx, setupCanvas} from "./canvas.mjs"
import {Transform, V2} from "@darcyvilkner/2d-geometry"
import {
    Clock,
    CollisionGroup,
    CollisionRule,
    GeometryBuilder, PhysicsObject,
    ToleranceProfile,
    DebugRenderer,
} from "@darcyvilkner/chrona-physics"

setupCanvas()

const clk = new Clock()

const
    collisionGroup = new CollisionGroup(),

    toleranceProfile = new ToleranceProfile(0, 0),
    rule = new CollisionRule(collisionGroup, collisionGroup, toleranceProfile, collision => {
        // Fully elastic collision
        collision.resolve(0, 1, 1, 1)
    })

const boxGeometry = new GeometryBuilder()
    .polygon(...V2.multipleFromArray([
        -1, -1,
        1, -1,
        1, 1,
        -1, 1,
    ]))
    .finish()

const
    objA = new PhysicsObject(clk, boxGeometry, [collisionGroup]),
    objB = new PhysicsObject(clk, boxGeometry, [collisionGroup])

objA.trajectory.setPos(-2, 0)
objA.trajectory.setVel(1, 0)

objB.trajectory.setPos(2, 0)
objB.trajectory.setVel(-1, 0)

const
    camera = Transform.scale(100).translateVals(innerWidth / 2, innerHeight / 2),
    renderer = new DebugRenderer(ctx, camera)

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.resetTransform()
    ctx.scale(devicePixelRatio, devicePixelRatio)

    ctx.beginPath()
    renderer.draw(objA, objB)
    ctx.stroke()
}

draw()

let t = 0
onkeydown = e => {
    t += 0.2
    clk.runTo(t)

    draw()
}