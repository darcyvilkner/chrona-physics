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
import {scheduleLoop} from "../../../chrona/index.mjs"


class Collision {
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

/** @type {Array<Collision>} */
const collisions = []

const
    boxSize = 20,
    zoom = 400 / boxSize,
    shapeCount = 100,
    shapeSpeed = 0,
    gravity = 0,
    ringSize = 0.1,
    cursorSize = 4,
    friction = 0

// const
//     boxSize = 40,
//     zoom = 400 / boxSize,
//     shapeCount = 100,
//     shapeSpeed = 2,
//     gravity = 0,
//     ringSize = 0.1,
//     cursorSize = 10

// const
//     boxSize = 20,
//     zoom = 400 / boxSize,
//     shapeCount = 200,
//     shapeSpeed = 0,
//     gravity = 2,
//     ringSize = 0.2

const ringTime = 0.4

const
    cursorSpeed = 1,
    cursorFriction = 0.89,
    cursorWeight = 10,
    restitutionCoefficient = 0.6

const clock = new Clock()

const
    shapeCollisionGroup = new CollisionGroup(),
    borderCollisionGroup = new CollisionGroup(),
    cursorCollision = new CollisionGroup()


const toleranceProfile = new ToleranceProfile(0.001, 1e-2)

new CollisionRule(shapeCollisionGroup, borderCollisionGroup, toleranceProfile, collision => {
    collision.resolve(0.1, restitutionCoefficient, 0, 1)
    collisions.push(new Collision(collision.pos, collision.time, collision.relVel.mag, collision.weightedVel(0, 1)))
})
new CollisionRule(shapeCollisionGroup, shapeCollisionGroup, toleranceProfile, collision => {
    const
        shapeA = shapeMap.get(collision.objA),
        shapeB = shapeMap.get(collision.objB)
    collision.resolve(0.1, restitutionCoefficient, shapeA.mass, shapeB.mass)
    collisions.push(new Collision(collision.pos, collision.time, collision.relVel.mag, collision.weightedVel(shapeA.mass, shapeB.mass)))
})

new CollisionRule(shapeCollisionGroup, cursorCollision, toleranceProfile, collision => {
    collision.resolve(0.1, restitutionCoefficient, 1, cursorWeight)
})

/** @type {Map<PhysicsObject, Shape>} */
const shapeMap = new Map()

class Shape {
    /**
     * @param {Geometry} geometry
     * @param {Trajectory} transform
     * @param {number} mass
     */
    constructor(geometry, transform, mass) {
        this.geometry = geometry
        this.transform = transform
        this.object = new PhysicsObject(clock, this.geometry, new Set([shapeCollisionGroup]), this.transform)
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

const dt = 0.1

if(0 != gravity) {
    for (let i = 0; i < shapes.length; i++) {
        scheduleLoop(clock, i / shapes.length * dt, dt, () => {
            shapes[i].trajectory.impulse(0, gravity * dt)
        })
    }
}
if(0 != friction){
    for (let i = 0; i < shapes.length; i++) {
        scheduleLoop(clock, i / shapes.length * dt, dt, () => {
            shapes[i].trajectory.impulse(shapes[i].trajectory.motion.p.xy.scale(-friction), gravity * dt)
        })
    }
}

const border = new PhysicsObject(clock, new GeometryBuilder().polygon(...V2.multipleFromArray([
    -1, -1,
    -1, 1,
    1, 1,
    1, -1,
])).finish(), new Set([borderCollisionGroup]), new Trajectory(clock, Transform.scale(boxSize)))

const cursorTransform = new Trajectory(clock, Transform.identity().scale(cursorSize))

const cursorGeometryBuilder = new GeometryBuilder()

const vertices = 14
for(let i = 0; i < vertices; i++){
    cursorGeometryBuilder.to(V2.fromPolar(1, 2 * Math.PI * i / vertices))
}
cursorGeometryBuilder.close()

const cursor = new PhysicsObject(clock, cursorGeometryBuilder.finish(), [cursorCollision], cursorTransform)

const mousePos = V2.new(innerWidth / 2, innerHeight / 2)
onmousemove = e => {
    mousePos.set(e.clientX, e.clientY)
}

const vel = V2.zero()
scheduleLoop(clock, 0, 0.01, () => {
    const world = camera.copy().invert().applyVec(mousePos.xy)
    vel.scale(cursorFriction)
    vel.add(world.xy.sub(cursorTransform.getTransform().p).scale(cursorSpeed))
    cursorTransform.setVel(vel)
})

let playing = false

onkeydown = e => {
    if(e.code == "Space"){
        // clock.advance()

        playing = !playing
        if(playing){
            loop()
        }
    }
}


setupCanvas()

const camera = Transform.scale(zoom).translateVals(innerWidth / 2, innerHeight / 2)

addEventListener("wheel", e => {
    camera.scale(2 ** (-0.01 * e.deltaY), V2.new(e.clientX, e.clientY))
})

const renderer = new DebugRenderer(ctx, camera, {velocityScale: 0 * 10})

let time = 0
function loop() {
    time += 1 / 60

    clock.runTo(time)


    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.resetTransform()
    ctx.scale(devicePixelRatio, devicePixelRatio)

    ctx.globalAlpha = 1
    ctx.strokeStyle = "white"
    ctx.beginPath()
    for (const shape of shapes) {
        renderer.draw(shape.object)
    }
    renderer.draw(
        border, cursor
    )

    ctx.stroke()


    while(collisions[0] && collisions[0].time < clock.time - ringTime) collisions.shift()
    for(const collision of collisions){
        const
            dt = clock.time - collision.time,
            collisionPos = camera.applyVec(collision.pos.xy.addScaled(collision.vel, dt))
        ctx.globalAlpha = 1 - (clock.time - collision.time) / ringTime
        ctx.beginPath()
        ctx.arc(collisionPos.x, collisionPos.y, ringSize * collision.size * dt / ringTime, 0, 2 * Math.PI)
        ctx.stroke()
    }

    if(!playing) return
    requestAnimationFrame(loop)
}