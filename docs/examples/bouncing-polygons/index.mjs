import {GeometryBuilder} from "../../../package/index.mjs"
import {V2} from "@darcyvilkner/2d-geometry"
import {Trajectory} from "../../../package/index.mjs"
import {Clock} from "../../../package/index.mjs"
import {canvas, ctx, setupCanvas} from "./canvas.mjs"
import {DebugRenderer} from "../../../package/tools/debug-renderer.mjs"
import {Transform} from "@darcyvilkner/2d-geometry"
import {PhysicsObject} from "../../../package/index.mjs"
import {CollisionGroup} from "../../../package/index.mjs"
import {CollisionRule} from "../../../package/index.mjs"
import {ToleranceProfile} from "../../../package/index.mjs"

const
    boxSize = parseInt(prompt("Side length", "10")),
    zoom = 400 / boxSize,
    polygonCount = parseInt(prompt("Objects", "160")),
    polygonSpeed = boxSize / 10

const clock = new Clock()


// Polygons

const polygonCollisionGroup = new CollisionGroup()


// Map from simulated objects to complete object representations
/** @type {Map<PhysicsObject, Polygon>} */
const polygonMap = new Map()

class Polygon {
    /**
     * @param {Geometry} geometry
     * @param {Trajectory} trajectory
     * @param {number} mass
     */
    constructor(geometry, trajectory, mass) {
        this.object = new PhysicsObject(clock, geometry, [polygonCollisionGroup], trajectory)
        this.mass = mass

        polygonMap.set(this.object, this)
    }
}

/**
 * @returns {Geometry}
 */
function createPolygonGeometry(){
    const builder = new GeometryBuilder()
    const points = 3 + Math.floor(5 * Math.random())
    const start = Math.random() * 2 * Math.PI
    for(let point = 0; point < points; point ++){
        const dir = point / points * 2 * Math.PI
        builder.to(V2.fromPolar(Math.random(), start + dir))
    }
    builder.close()

    return builder.finish()
}

/** @type {Array<Polygon>} */
const polygons = []

for(let i = 0; i < polygonCount; i++){

    polygons.push(new Polygon(
        createPolygonGeometry(),
        new Trajectory(
            clock,
            Transform.translateVals((1 - 2 * Math.random()) * (boxSize - 1), (1 - 2 * Math.random()) * (boxSize - 1)),
            Transform.new(0, 0, 0, 0, ...V2.fromPolar(polygonSpeed * (1 + Math.random()), 2 * Math.PI * Math.random()))
        ),
        Math.exp(4 * Math.random())
    ))
}


// Collision indicators

const
    indicatorSize = 1,
    indicatorLifetime = 0.4

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
])).finish(), [borderCollisionGroup], new Trajectory(clock, Transform.scale(boxSize)))


// Collision logic

const toleranceProfile = new ToleranceProfile(0.1, 1e-2)

// Polygon-border
new CollisionRule(polygonCollisionGroup, borderCollisionGroup, toleranceProfile, collision => {

    const polygon = polygonMap.get(collision.objA)
    collision.resolve(0, 1, 0, 1)
    collisions.push(new CollisionIndicator(collision.pos, collision.time, collision.relVel.mag, collision.weightedVel(0, 1)))

}, true)

// Polygon-polygon
new CollisionRule(polygonCollisionGroup, polygonCollisionGroup, toleranceProfile, collision => {

    const
        polygonA = polygonMap.get(collision.objA),
        polygonB = polygonMap.get(collision.objB)
    collision.resolve(0, 1, polygonA.mass, polygonB.mass)
    collisions.push(new CollisionIndicator(collision.pos, collision.time, collision.relVel.mag, collision.weightedVel(polygonA.mass, polygonB.mass)))

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

    // Draw Polygons
    ctx.beginPath()
    for (const polygon of polygons) {
        renderer.draw(polygon.object)
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = "white"
    ctx.stroke()

    // Draw border
    ctx.beginPath()
    renderer.draw(border)
    ctx.stroke()

    // Draw indicators
    while(collisions[0] && collisions[0].time < clock.time - indicatorLifetime) collisions.shift()
    ctx.fillStyle = "white"
    for(const collision of collisions){
        const
            dt = clock.time - collision.time,
            collisionPos = camera.applyVec(collision.pos.xy.addScaled(collision.vel, dt)),
            alpha = 1 - (clock.time - collision.time) / indicatorLifetime
        ctx.beginPath()
        ctx.arc(collisionPos.x, collisionPos.y, indicatorSize * collision.size * dt / indicatorLifetime, 0, 2 * Math.PI)
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