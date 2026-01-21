/**
 * Represents an oriented edge in a {@link Geometry}.
 *
 * The edge blocks collisions incoming from the right.
 */
class Edge {
    /**
     * The position of the first vertex of the edge in geometry space.
     *
     * @type {V2}
     */
    p0
    /**
     * The position of the second vertex of the edge in geometry space.
     *
     * @type {V2}
     */
    p1
    /**
     * Constructs an {@link Edge} between the specified points.
     *
     * @param {V2} p0 The first vertex of the edge.
     * @param {V2} p1 The second vertex of the edge.
     */
    constructor(p0, p1){
        this.p0 = p0
        this.p1 = p1
    }
}

export {Edge}