import {GeometryBuilder} from "../../../chrona/index.mjs"
import V2 from "../../../chrona/math/v2.mjs"
import {Trajectory} from "../../../chrona/index.mjs"
import {Clock} from "../../../chrona/index.mjs"
import {canvas, ctx, setupCanvas} from "./canvas.mjs"
import {DebugRenderer} from "../../../chrona/engine/debug-renderer.mjs"
import Transform from "../../../chrona/math/transform.mjs"
import {PhysicsObject} from "../../../chrona/index.mjs"
import {CollisionGroup} from "../../../chrona/index.mjs"
import {CollisionRule} from "../../../chrona/index.mjs"
import {ToleranceProfile} from "../../../chrona/index.mjs"
import {ClockEvent} from "../../../chrona/index.mjs"
import {scheduleLoop} from "../../../chrona/index.mjs"

const
    boxSize = parseInt(prompt("Side length", "10")),
    zoom = 400 / boxSize,
    shapeCount = parseInt(prompt("Objects", "160")),
    shapeSpeed = boxSize / 10

const
    ringSize = 1,
    ringTime = 0.4

const clock = new Clock()

// Shapes

const shapeCollisionGroup = new CollisionGroup()

/** @type {Map<PhysicsObject, Shape>} */
const shapeMap = new Map()

class Shape {
    /**
     * @param {Geometry} geometry
     * @param {Trajectory} trajectory
     * @param {number} mass
     */
    constructor(geometry, trajectory, mass) {
        this.geometry = geometry
        this.trajectory = trajectory
        this.object = new PhysicsObject(clock, this.geometry, new Set([shapeCollisionGroup]), this.trajectory)
        this.mass = mass

        shapeMap.set(this.object, this)
    }
}

/** @type {Array<Shape>} */
const shapes = []

for(let i = 0; i < shapeCount; i++){
    const builder = new GeometryBuilder()
    const points = 3 + Math.floor(5 * Math.random())
    const start = Math.random() * 2 * Math.PI
    for(let point = 0; point < points; point ++){
        const dir = point / points * 2 * Math.PI
        builder.to(V2.fromPolar(Math.random(), start + dir))
    }
    builder.close()
    const geometry = builder.finish()

    shapes.push(new Shape(
        geometry,
        new Trajectory(
            clock,
            Transform.translateVals((1 - 2 * Math.random()) * (boxSize - 1), (1 - 2 * Math.random()) * (boxSize - 1)),
            Transform.new(0, 0, 0, 0, ...V2.fromPolar(shapeSpeed * (1 + Math.random()), 2 * Math.PI * Math.random()))
        ),
        Math.exp(4 * Math.random())
    ))
}

// Collision indicators

class CollisionIndicator {
    /**
     * @param {V2} pos
     * @param {number} time
     * @param {number} size
     * @param {V2} vel
     */
    constructor(pos, time, size, vel) {
        this.pos = pos
        this.time = time
        this.size = size
        this.vel = vel
    }
}

/** @type {Array<CollisionIndicator>} */
const collisions = []

// Border

const borderCollisionGroup = new CollisionGroup()

const border = new PhysicsObject(clock, new GeometryBuilder().polygon(...V2.multipleFromArray([
    -1, -1,
    -1, 1,
    1, 1,
    1, -1,
])).finish(), new Set([borderCollisionGroup]), new Trajectory(clock, Transform.scale(boxSize)))

// Collision logic

const toleranceProfile = new ToleranceProfile(0.1, 1e-2)

new CollisionRule(shapeCollisionGroup, borderCollisionGroup, toleranceProfile, collision => {
    const shape = shapeMap.get(collision.objA)
    collision.resolve(0, 1, 0, 1)
    collisions.push(new CollisionIndicator(collision.pos, collision.time, collision.relVel.mag, collision.weightedVel(0, 1)))
}, true)
new CollisionRule(shapeCollisionGroup, shapeCollisionGroup, toleranceProfile, collision => {
    const
        shapeA = shapeMap.get(collision.objA),
        shapeB = shapeMap.get(collision.objB)
    collision.resolve(0, 1, shapeA.mass, shapeB.mass)
    collisions.push(new CollisionIndicator(collision.pos, collision.time, collision.relVel.mag, collision.weightedVel(shapeA.mass, shapeB.mass)))
}, true)


// Rendering

setupCanvas()

const camera = Transform.scale(zoom).translateVals(innerWidth / 2, innerHeight / 2)

addEventListener("wheel", e => {
    camera.scale(2 ** (-0.01 * e.deltaY), V2.new(e.clientX, e.clientY))
    render()
})

const renderer = new DebugRenderer(ctx, camera, {velocityScale: 0 * 10})

function render(){


    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.resetTransform()
    ctx.scale(devicePixelRatio, devicePixelRatio)

    ctx.globalAlpha = 0.5
    ctx.fillStyle = "white"
    ctx.beginPath()
    for (const shape of shapes) {
        renderer.draw(shape.object)
    }

    ctx.globalAlpha = 1
    ctx.strokeStyle = "white"
    ctx.stroke()


    ctx.beginPath()

    renderer.draw(border)

    ctx.stroke()


    while(collisions[0] && collisions[0].time < clock.time - ringTime) collisions.shift()
    for(const collision of collisions){
        const
            dt = clock.time - collision.time,
            collisionPos = camera.applyVec(collision.pos.xy.addScaled(collision.vel, dt)),
            alpha = 1 - (clock.time - collision.time) / ringTime
        ctx.beginPath()
        ctx.arc(collisionPos.x, collisionPos.y, ringSize * collision.size * dt / ringTime, 0, 2 * Math.PI)
        ctx.globalAlpha = alpha
        ctx.fill()
    }

}

// Automatic time advancement

let playing = true

onkeydown = e => {
    if(e.code == "Space"){
        playing = !playing
        if(playing){
            loop()
        }
    }
}

let time = 0
function loop() {
    time += 1 / 60

    clock.runTo(time)

    render()

    if(!playing) return
    requestAnimationFrame(loop)
}

loop()