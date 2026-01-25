/**
 * Tolerance profiles group together numerical tolerances used during collision.
 * They are provided to collision rules and can be reused across a project or tuned for specific collisions.
 */
class ToleranceProfile {
    /**
     * Distance threshold for immediate execution of nearby collisions.
     *
     * If two objects are within this distance of one another during a collision recalculation, the collision is executed immediately.
     *
     * This resolves cases where an object is unable to return to the correct side of an object after a collision time is overestimated because it is immediately pushed further into the object.
     *
     * - If too low, objects may miss high-frequency collisions, such as those spawned when an object is pinned or wedged between sharp edges.
     * - If too high, objects may collide notably before they touch.
     *
     * @type {number}
     */
    closeCollisionThresh

    /**
     * Directional tolerance for collisions.
     *
     * This tolerance relaxes the directional constraints used to determine whether an edge can collide with a vertex.
     * It allows collisions to occur when the edge tangent is slightly outside the directional range expected by the vertex.
     *
     * Valid range: 0 to 1.
     *
     * - If too low, collisions may be missed when surfaces are nearly aligned.
     * - If too high, objects may catch on mostly smooth surfaces in ways that should be impossible.
     *
     * Because of how this is checked, the added range ends up being slightly larger when the range is very large or very small.
     * To see the effects of different values, see {@link https://www.desmos.com/calculator/inqgmew7mj this Desmos graph}.
     *
     * The exact calculation used is as follows:
     *
     * `(vertexBoundA × edgeTangent) * (vertexBoundB × edgeTangent) <= edgeTangent.mag2 * vertexBoundA.mag * vertexBoundB.mag * rangeThresh`
     *
     * @type {number}
     */
    directionalTolerance

    /**
     * Creates a {@link ToleranceProfile} with the specified parameters.
     *
     * @param {number} closeCollisionThresh
     * Distance threshold for immediate execution of nearby collisions.
     * See {@link ToleranceProfile#closeCollisionThresh} for more info.
     *
     * @param {number} directionalTolerance
     * Directional tolerance for collisions.
     * See {@link ToleranceProfile#directionalTolerance} for more info.
     */
    constructor(closeCollisionThresh, directionalTolerance = 0.02) {
        this.closeCollisionThresh = closeCollisionThresh
        this.directionalTolerance = directionalTolerance
    }
}

export {ToleranceProfile}