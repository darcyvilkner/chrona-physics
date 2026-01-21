import {ClockEvent} from "../timing/event.mjs"
import {vertexEdge} from "./vertex-edge-collision.mjs"

/**
 *
 */
class CollisionCandidate {
    /**
     * @param {PhysicsObject} a
     * @param {PhysicsObject} b
     * @param {number} earliestTime
     * @param {CollisionRule} collisionRule
     */
    constructor(a, b, earliestTime, collisionRule){
        this.a = a
        this.b = b
        this.earliestTime = earliestTime
        this.collisionRule = collisionRule
    }

    /**
     * @param {number} now
     */
    calculateExact(now){

        /** @type {Array<ClockEvent>} */
        const events = []
        const createEvents = (collisions) => {
            for(const collision of collisions){
                if(collision.time < now) continue
                const event = new ClockEvent(collision.time, () => {
                    this.collisionRule.callback(collision)
                })
                this.a.relevantEvents.push(event)
                this.b.relevantEvents.push(event)
                events.push(event)

                if(this.collisionRule.recalculating){
                    this.a.nextProbableRecalculation = Math.min(this.a.nextProbableRecalculation, event.time)
                    this.b.nextProbableRecalculation = Math.min(this.b.nextProbableRecalculation, event.time)
                }
            }
        }

            createEvents(vertexEdge(this.a, this.b, false, now, this.collisionRule.toleranceProfile))
        createEvents(vertexEdge(this.b, this.a, true, now, this.collisionRule.toleranceProfile))

        return events
    }
}

/**
 * @param {PhysicsObject} a
 * @param {PhysicsObject} b
 * @param {number} now
 * @param {CollisionRule} collisionRule
 * @returns {null | CollisionCandidate}
 */
function generateCollisionCandidates(a, b, now, collisionRule){
    if(a == b) return null

    /**
     * @param {PhysicsObject} obj
     */
    function generateBox(obj){
        const
            {minX: vMinX, maxX: vMaxX, minY: vMinY, maxY: vMaxY} = obj.geometry,
            {a: {x: vax, y: vay}, b: {x: vbx, y: vby}, p: {x: vpx, y: vpy}} = obj.trajectory.motion,
            v0x = vax * vMinX + vbx * vMinY + vpx,
            v0y = vay * vMinX + vby * vMinY + vpy,
            v1x = vax * vMaxX + vbx * vMinY + vpx,
            v1y = vay * vMaxX + vby * vMinY + vpy,
            v2x = vax * vMinX + vbx * vMaxY + vpx,
            v2y = vay * vMinX + vby * vMaxY + vpy,
            v3x = vax * vMaxX + vbx * vMaxY + vpx,
            v3y = vay * vMaxX + vby * vMaxY + vpy,

            dt = now - obj.trajectory.time,
            transform = obj.trajectory.base,
            pax = transform.a.x + vax * dt,
            pay = transform.a.y + vay * dt,
            pbx = transform.b.x + vbx * dt,
            pby = transform.b.y + vby * dt,
            ppx = transform.p.x + vpx * dt,
            ppy = transform.p.y + vpy * dt,
            p0x = pax * vMinX + pbx * vMinY + ppx,
            p0y = pay * vMinX + pby * vMinY + ppy,
            p1x = pax * vMaxX + pbx * vMinY + ppx,
            p1y = pay * vMaxX + pby * vMinY + ppy,
            p2x = pax * vMinX + pbx * vMaxY + ppx,
            p2y = pay * vMinX + pby * vMaxY + ppy,
            p3x = pax * vMaxX + pbx * vMaxY + ppx,
            p3y = pay * vMaxX + pby * vMaxY + ppy
        return [
            Math.min(p0x, p1x, p2x, p3x), Math.min(v0x, v1x, v2x, v3x),
            Math.max(p0x, p1x, p2x, p3x), Math.max(v0x, v1x, v2x, v3x),
            Math.min(p0y, p1y, p2y, p3y), Math.min(v0y, v1y, v2y, v3y),
            Math.max(p0y, p1y, p2y, p3y), Math.max(v0y, v1y, v2y, v3y),
        ]
    }

    const
        [
            al, alv, ar, arv,
            ab, abv, at, atv,
        ] = generateBox(a),
        [
            bl, blv, br, brv,
            bb, bbv, bt, btv,
        ] = generateBox(b)

    let
        max = Infinity,
        min = 0

    /**
     * Constrains the range such that 0 <= mx + b.
     * @param {number} m
     * @param {number} b
     */
    function constrain(m, b){
        if(m == 0){
            if(b < 0){
                min = Infinity
                max = -Infinity
            }
            return
        }
        const x = -b / m
        if(0 < m){
            min = Math.max(min, x)
        }else{
            max = Math.min(max, x)
        }
    }

    // al + alv * t <= br + brv * t
    constrain(brv - alv, br - al)

    // bl + blv * t <= ar + arv * t
    constrain(arv - blv, ar - bl)

    // ab + abv * t <= bt + btv * t
    constrain(btv - abv, bt - ab)

    // bb + bbv * t <= at + atv * t
    constrain(atv - bbv, at - bb)

    if(max < min) return null

    return new CollisionCandidate(a, b, now + min, collisionRule)
}

export {generateCollisionCandidates}