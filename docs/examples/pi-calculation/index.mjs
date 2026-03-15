import {canvas, ctx, setupCanvas} from "./canvas.mjs"
import {
    Clock,
    collisionGroups,
    CollisionRule, DebugRenderer,
    GeometryBuilder,
    PhysicsObject, ToleranceProfile,
} from "@darcyvilkner/chrona-physics"
import {Transform, V2} from "@darcyvilkner/2d-geometry"

/** @type {?number} */
let digits = NaN;
while(isNaN(digits)){
    digits = parseInt(prompt("How many digits?", "4"))
}

const clk = new Clock(1e3)


// Collision Logic

const toleranceProfile = new ToleranceProfile(1e-8)

const [
    wallCollisionGroup,
    bigBoxCollisionGroup,
    smallBoxCollisionGroup,
] = collisionGroups()

let collisionCount = 0

new CollisionRule(smallBoxCollisionGroup, wallCollisionGroup, toleranceProfile, collision => {
    collision.resolve()
    collisionCount ++

})
new CollisionRule(smallBoxCollisionGroup, bigBoxCollisionGroup, toleranceProfile, collision => {
    collision.resolve(0, 1, 1, 100 ** (digits - 1))
    collisionCount ++
})


// Geometry

const wallGeometry = new GeometryBuilder()
    .to(...V2.multipleFromArray([
        0, -2,
        0, 2,
    ]))
    .finish()

const boxGeometry = new GeometryBuilder()
    .polygon(...V2.multipleFromArray([
        0, 0,
        1, 0,
        1, 1,
        0, 1,
    ]))
    .finish()


// Objects

const wall = new PhysicsObject(clk, wallGeometry, [wallCollisionGroup])
wall.trajectory.setPos(-1, 0)

const bigBox = new PhysicsObject(clk, boxGeometry, [bigBoxCollisionGroup])
bigBox.trajectory.setTransform(
    Transform
        .translateVals(1, 0)
)
bigBox.trajectory.impulse(-1, 0)

const smallBox = new PhysicsObject(clk, boxGeometry, [smallBoxCollisionGroup])
smallBox.trajectory.setTransform(
    Transform
        .scale(0.5)
)


// Rendering

setupCanvas()

const camera = Transform
    .scale(innerHeight / 4)
    .translateVals(innerWidth / 2, innerHeight / 2)

addEventListener("wheel", e => {
    // Enables zooming
    camera.scale(2 ** (-0.01 * e.deltaY), V2.new(e.clientX, e.clientY))
})

const dr = new DebugRenderer(ctx, camera)

function draw() {
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.font = "40px Serif"
    ctx.fillText(collisionCount.toString(), 0, 40)
    ctx.beginPath()
    dr.draw(wall, bigBox, smallBox)
    ctx.stroke()
}

draw()


// Calculation over time

let
    t = 0,
    then
function loop(){
    const now = performance.now() / 1000
    if(then != undefined) t += now - then
    then = now
    try {
        // Throws an error when many calculations are performed.
        clk.runTo(t)
    } catch (e) {
        t = clk.time
    }

    draw()
    requestAnimationFrame(loop)
}

loop()
