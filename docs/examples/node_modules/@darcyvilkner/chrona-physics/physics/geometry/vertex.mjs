/**
 * Represents an oriented vertex in a {@link Geometry}.
 *
 * A vertex represents a point on a surface where the boundary changes direction.
 * It can be thought of as an infinitesimal curved surface that smoothly transitions from the tangent direction {@link Vertex#t0 t0} to {@link Vertex#t1 t1}.
 * This means that it only interacts with surfaces with tangents directly opposite the region between t0 and t1.
 *
 * For example, the vertex that would be placed between the edges
 * `((0, -1), (0, 0))` and `((0, 0), (-1, 0))`
 * would span tangents from `(0, 1)` to `(-1, 0)`.
 *
 */
class Vertex {
    /**
     * The position of the vertex in geometry space.
     *
     * @type {V2}
     */
    p
    /**
     * The initial tangent direction of the vertex.
     *
     * @type {V2}
     */
    t0
    /**
     * The final tangent direction of the vertex.
     *
     * @type {V2}
     */
    t1
    /**
     * Constructs a {@link Vertex} at the specified point covering the given region.
     * @param {V2} p The location of the vertex.
     * @param {V2} t0 The initial tangent vector.
     * @param {V2} t1 The final tangent vector.
     */
    constructor(p, t0, t1){
        this.p = p
        this.t0 = t0
        this.t1 = t1
    }
}

export {Vertex}