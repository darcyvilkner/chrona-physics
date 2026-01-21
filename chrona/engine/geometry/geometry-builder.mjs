import V2 from "../../math/v2.mjs"
import {Geometry} from "./geometry.mjs"
import {Edge} from "./edge.mjs"
import {Vertex} from "./vertex.mjs"

/**
 * Geometry builders are used to assist in creating {@link Geometry} objects.
 *
 * The geometry is specified with {@link GeometryBuilder#to}, {@link GeometryBuilder#close}, {@link GeometryBuilder#break}, and {@link GeometryBuilder#polygon}.
 * A completed geometry object can be obtained by calling {@link GeometryBuilder#finish} once the construction is complete.
 *
 * Orientation matters for collision detection.
 * Walking along an object, collisions are made with objects coming in from the right.
 * This makes counter-clockwise polygons collide on the outside and clockwise polygons collide on the inside.
 *
 * Note that all vectors are stored as references, so modifying vectors that have been passed to a geometry builder should be avoided.
 *
 * Example usage:
 *
 * ```js
 *
 * // Create geometry builder
 * const builder = new GeometryBuilder()
 *
 * // Counter-clockwise octagon
 * for(let i = 0; i < 8; i++){
 *     builder.vertices(V2.fromPolar(1, 2 * Math.PI * i / 8))
 * }
 * builder.close()
 *
 * // Clockwise square
 * builder.polygon(V2.multipleFromVals(
 *     -2, -2,
 *     -2, 2,
 *     2, 2,
 *     2, -2,
 * ))
 *
 * // Generate geometry object
 * const geometry = builder.finish()
 *
 * ```
 */
class GeometryBuilder{
    /**
     * The position of the first vertex in this path.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     *
     * @type {V2}
     */
    pos0 = V2.zero()
    /**
     * The position of the second vertex in this path.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     *
     * @type {V2}
     */
    pos1 = V2.zero()
    /**
     * The position of the second-to-last vertex in this path.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     *
     * @type {V2}
     */
    prevPrev = V2.zero()
    /**
     * The position of the last vertex in this path.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     *
     * @type {V2}
     */
    prev = V2.zero()

    /**
     * The number of vertices in this path.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     * 
     * @type {number}
     */
    n = 0

    /**
     * Vertices that will be included in the final geometry.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     * 
     * @type {Array<Vertex>}
     */
    vertexArray = []
    /**
     * Edges that will be included in the final geometry.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     * 
     * @type {Array<Edge>}
     */
    edgeArray = []

    /**
     * The lower x-bound of the bounding box.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     * 
     * @type {number}
     */
    minX = Infinity
    /**
     * The greater x-bound of the bounding box.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     * 
     * @type {number}
     */
    maxX = -Infinity

    /**
     * The lower y-bound of the bounding box.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     * 
     * @type {number}
     */
    minY = Infinity
    /**
     * The greater y-bound of the bounding box.
     *
     * This field is used internally by the geometry builder and should not be accessed directly.
     *
     * @type {number}
     */
    maxY = -Infinity

    /**
     * Creates an empty {@link GeometryBuilder}.
     */
    constructor() {}

    /**
     * Adds one or more vertices to the current path.
     *
     * Edges and intermediate vertex structures are generated automatically as vertices are added.
     *
     * Note that returning to the beginning of the path won't generate a vertex closing the path.
     * To close a path, use {@link GeometryBuilder#close} or {@link GeometryBuilder#polygon}.
     *
     * @param {...V2} vertices The positions of the vertices being added.
     * @returns {GeometryBuilder} This geometry builder. Enables chaining.
     */
    to(...vertices){
        for(const p of vertices) {
            this.minX = Math.min(this.minX, p.x)
            this.maxX = Math.max(this.maxX, p.x)
            this.minY = Math.min(this.minY, p.y)
            this.maxY = Math.max(this.maxY, p.y)

            if (1 <= this.n) {
                this.edgeArray.push(new Edge(this.prev, p))

                if (2 <= this.n) {
                    this.vertexArray.push(new Vertex(this.prev, this.prev.xy.sub(this.prevPrev), p.xy.sub(this.prev)))
                } else {
                    this.pos1 = p
                }

                this.prevPrev = this.prev
            } else {
                this.pos0 = p
            }
            this.prev = p

            this.n++
        }

        return this
    }

    /**
     * Begins a new path without closing the previous one.
     *
     * @returns {GeometryBuilder} This geometry builder. Enables chaining.
     */
    break(){
        this.n = 0

        return this
    }

    /**
     * Closes the current path by connecting its final vertex to it's first.
     *
     * After closing, a new path is begun.
     *
     * @returns {GeometryBuilder} This geometry builder. Enables chaining.
     */
    close(){
        if(this.n < 2) return

        this.edgeArray.push(new Edge(this.prev, this.pos0))
        this.vertexArray.push(new Vertex(this.prev, this.prev.xy.sub(this.prevPrev), this.pos0.xy.sub(this.prev)))
        this.vertexArray.push(new Vertex(this.pos0, this.pos0.xy.sub(this.prev), this.pos1.xy.sub(this.pos0)))

        this.break()

        return this
    }

    /**
     * Begins a new path, adds the provided vertices, and closes the path.
     *
     * @param {...V2} vertices The positions of the polygon's vertices.
     * @returns {GeometryBuilder} This geometry builder. Enables chaining.
     */
    polygon(...vertices){
        this.break()
        for(const vertex of vertices){
            this.to(vertex)
        }
        this.close()

        return this
    }

    /**
     * Creates a {@link Geometry} based on the geometry described with this builder.
     *
     * This builder should not be modified after a geometry object has been created.
     *
     * @returns {Geometry} The completed geometry.
     */
    finish(){
        return new Geometry(this.vertexArray, this.edgeArray, this.minX, this.maxX, this.minY, this.maxY)
    }
}

export {GeometryBuilder}