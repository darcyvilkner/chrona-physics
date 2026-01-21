import {Collision} from "./collision.mjs"
import V2 from "../../math/v2.mjs"
import Transform from "../../math/transform.mjs"

const
    v0 = V2.zero(),
    v1 = V2.zero(),
    v2 = V2.zero(),
    v3 = V2.zero(),
    v4 = V2.zero(),
    v5 = V2.zero(),
    v6 = V2.zero(),
    v7 = V2.zero(),
    v8 = V2.zero(),
    v9 = V2.zero(),
    v10 = V2.zero(),
    v11 = V2.zero(),
    v12 = V2.zero(),
    v13 = V2.zero(),
    v14 = V2.zero(),
    v15 = V2.zero()

const
    tr0 = Transform.zero(),
    tr1 = Transform.zero()

/**
 * @param {PhysicsObject} edgeObj
 * @param {PhysicsObject} vertexObj
 * @param {boolean} invert
 * @param {number} now
 * @param {ToleranceProfile} toleranceProfile
 */
function vertexEdge(edgeObj, vertexObj, invert, now, toleranceProfile){
    const
        invertScl = (1 - 2 * invert),
        baseTime = vertexObj.trajectory.time,
        edgeTime = baseTime - edgeObj.trajectory.time,
        eTr = edgeObj.trajectory,
        vTr = vertexObj.trajectory

    /** @type {Array<Collision>} */
    const collisions = []
    for(const vertex of vertexObj.geometry.vertices){
        for(const edge of edgeObj.geometry.edges){

            const
                e0av = eTr.motion.applyVec(edge.p0, v0),
                e0ap = eTr.base.applyVec(edge.p0, v1).addScaled(e0av, edgeTime),
                e1av = eTr.motion.applyVec(edge.p1, v2),
                e1ap = eTr.base.applyVec(edge.p1, v3).addScaled(e1av, edgeTime),
                vap = vTr.base.applyVec(vertex.p, v4),
                vav = vTr.motion.applyVec(vertex.p, v5),
                v0p = vTr.base.applyAffineVec(vertex.t0, v6),
                v0v = vTr.motion.applyAffineVec(vertex.t0, v7),
                v1p = vTr.base.applyAffineVec(vertex.t1, v8),
                v1v = vTr.motion.applyAffineVec(vertex.t1, v9),
                ev = e1av.sub(e0av), // expire e1av
                ep = e1ap.sub(e0ap), // expire e1ap
                vv = e0av.negate().add(vav), // expire e0av
                vp = e0ap.negate().add(vap), // expire e0ap

                // comes from expanding (ev * t + ep) cross (vv * t + vp)
                a = ev.cross(vv),
                b = ep.cross(vv) + ev.cross(vp),
                c = ep.cross(vp),
                disc = b ** 2 - 4 * a * c,

                nowRel = now - baseTime,
                epNow = v10.set(ep).addScaled(ev, nowRel),
                vpNow = v11.set(vp).addScaled(vv, nowRel)

            if(Math.abs(epNow.cross(vpNow)) <= epNow.mag * toleranceProfile.closeCollisionThresh){ // expire epNow and vpNow
                const collision = collisionAtTime(nowRel)
                if(collision){
                    collisions.push(collision)
                }
            }



            if(Math.abs(a) == 0){
                // only take the collision if it goes from negative to positive.
                if(b <= 0) continue

                const collision = collisionAtTime(-c / b)
                if(collision) collisions.push(collision)

                continue
            }

            if(disc < 0) continue

            // only take the collision that goes from negative to positive.
            const collision = collisionAtTime(2 * c / (-b - Math.sqrt(disc)))


            if(collision) collisions.push(collision)

            function collisionAtTime(t) {
                return verifyCollision(
                    tr0.set(edgeObj.trajectory.base).addScaled(edgeObj.trajectory.motion, t + baseTime - edgeObj.trajectory.time),
                    tr1.set(vertexObj.trajectory.base).addScaled(vertexObj.trajectory.motion, t),
                    v10.set(ep).addScaled(ev, t),
                    v11.set(vp).addScaled(vv, t),
                    v12.set(v0p).addScaled(v0v, t),
                    v13.set(v1p).addScaled(v1v, t),
                    v14.set(vap).addScaled(vav, t),
                    t,
                )
            }

            /**
             * @param {Transform} eTransform tr0
             * @param {Transform} vTransform tr1
             * @param {V2} ep v10
             * @param {V2} vp v11
             * @param {V2} v0p v12
             * @param {V2} v1p v13
             * @param {V2} pos v14
             * @param {number} t
             */
            function verifyCollision(eTransform, vTransform, ep, vp, v0p, v1p, pos, t){

                const s = ep.dot(vp) / ep.mag2 // expire vp (v11)

                if(s < 0 || 1 < s) return null

                const convex = 0 < v0p.cross(v1p)

                if(!convex) return null

                const correctDirection = v0p.cross(ep) * v1p.cross(ep) <= ep.mag2 * v0p.mag * v1p.mag * toleranceProfile.directionalTolerance

                if(!correctDirection) return null

                const
                    midDir = v11.set(v0p).scale(v1p.mag).addScaled(v1p, v0p.mag), // expire v0p, v1p
                    correctWinding = midDir.dot(ep) <= 0 // expire midDir

                if(!correctWinding) return null


                const
                    edgeVel = eTr.motion.applyVec(v11.set(edge.p0).lerp(edge.p1, s)),
                    relVel = v15.set(vav).sub(edgeVel)

                if(ep.cross(relVel) <= 0) return null

                const
                    a = invert ? vertexObj : edgeObj,
                    b = invert ? edgeObj : vertexObj,
                    aVel = invert ? vav : edgeVel

                // duplicate all vectors
                return new Collision(pos.xy, ep.xy.scale(invertScl), aVel.xy, relVel.xy.scale(invertScl), baseTime + t, vertex, edge, a, b)
            }
        }
    }

    return collisions
}

export {vertexEdge}