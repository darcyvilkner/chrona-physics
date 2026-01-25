/**
 * Contains information about a collision between two objects and assists in resolving the collision.
 *
 * A collision will always be between a vertex and an edge.
 */
class Collision {
    /**
     * The position at which the collision occurred.
     * @type {V2}
     */
    pos
    /**
     * The tangent vector of object a.
     * The direction of this vector will be based on the winding direction of object a.
     * This means that the normal vector of a can always be calculated with `tangent.xy.antiPerp()`.
     * No assumptions about the magnitude of this vector may be made.
     * @type {V2}
     */
    tangent
    /**
     * The velocity of object a at the point of the collision.
     * @type {V2}
     */
    vel
    /**
     * The relative velocity of the two objects at the point of the collision.
     * Calculated as [velocity of b] - [velocity of a] .
     * @type {V2}
     */
    relVel
    /**
     * The time at which the collision occurred.
     * @type {number}
     */
    time
    /**
     * The vertex involved in the collision.
     * @type {Vertex}
     */
    vertex
    /**
     * The edge involved in the collision.
     * @type {Edge}
     */
    edge
    /**
     * The object specified first in the collision rule describing this collision.
     * @type {PhysicsObject}
     */
    objA
    /**
     * The object specified second in the collision rule describing this collision.
     * @type {PhysicsObject}
     */
    objB

    /**
     * Constructs a collision.
     *
     * This method is used internally by the collision system and should not be called directly.
     *
     * @param {V2} pos
     * @param {V2} tangent
     * @param {V2} vel
     * @param {V2} relVel
     * @param {number} time
     * @param {Vertex} vertex
     * @param {Edge} edge
     * @param {PhysicsObject} objA
     * @param {PhysicsObject} objB
     */
    constructor(pos, tangent, vel, relVel, time, vertex, edge, objA, objB) {
        this.pos = pos
        this.tangent = tangent
        this.vel = vel
        this.relVel = relVel
        this.time = time
        this.vertex = vertex
        this.edge = edge
        this.objA = objA
        this.objB = objB
    }

    /**
     * Resolves the collision by applying an impulse to the two objects in opposite directions normal to the collision.
     * No tangential impulses are applied.
     * @param {number} additionalVel
     * In addition to the reflected velocity, the objects will have this velocity away from each other added.
     * It is generally a good idea to set this value to be greater than 0 if the coefficient of restitution is less than 1 to ensure the objects end up moving away from one another.
     * @param {number} restitutionCoefficient
     * What portion of the velocity is reflected.
     * Inelastic collisions have a coefficient of restitution of 0, and elastic collisions have 1.
     * @param {number} weightA
     * How much object a will resist its velocity being changed.
     * @param {number} weightB
     * How much object b will resist its velocity being changed.
     */
    resolve(additionalVel = 0, restitutionCoefficient = 1, weightA = 0, weightB = 1){
        const
            perpDir = this.tangent.xy.perp().normalize(),
            perpVel = this.relVel.xy.project(perpDir).addScaled(perpDir, additionalVel)

        if(weightB != 0) {
            const impulseA = perpVel.xy.scale((1 + restitutionCoefficient) * weightB / (weightA + weightB))
            this.objA.trajectory.impulse(impulseA)
        }
        if(weightA != 0){
            const impulseB = perpVel.xy.scale(-(1 + restitutionCoefficient) * weightA / (weightA + weightB))
            this.objB.trajectory.impulse(impulseB)
        }
    }

    /**
     * Returns the weighted average velocity of the two objects at the point of collision.
     * @param {number} weightA The weight of object a's velocity.
     * @param {number} weightB The weight of object b's velocity.
     * @returns {V2}
     */
    weightedVel(weightA = 0, weightB = 1){
        return this.vel.xy.addScaled(this.relVel, weightB / (weightA + weightB))
    }
}

export {Collision}