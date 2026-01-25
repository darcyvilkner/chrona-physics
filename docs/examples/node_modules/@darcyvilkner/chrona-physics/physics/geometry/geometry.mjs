/**
 * Geometries provide shape data for physics objects.
 *
 * They comprise a list of {@link Geometry#vertices} and {@link Geometry#edges}, which can be modified using {@link Geometry#modify}.
 *
 * Usually, geometries are constructed through the {@link GeometryBuilder} class.
 */
class Geometry {
    /**
     * Stores the vertices that make up this geometry.
     *
     * Should not be modified outside a {@link Geometry#modify} call.
     *
     * @type {Array<Vertex>}
     */
    vertices
    /**
     * Stores the edges that make up this geometry.
     *
     * Should not be modified outside a {@link Geometry#modify} call.
     *
     * @type {Array<Edge>}
     */
    edges

    /**
     * The lower x-bound of the bounding box.
     *
     * @type {number}
     */
    minX
    /**
     * The greater x-bound of the bounding box.
     *
     * @type {number}
     */
    maxX

    /**
     * The lower y-bound of the bounding box.
     *
     * @type {number}
     */
    minY
    /**
     * The greater y-bound of the bounding box.
     *
     * @type {number}
     */
    maxY

    /**
     * All physics objects that use this geometry.
     *
     * This should not be modified directly.
     * Instead, use {@link PhysicsObject#setGeometry}.
     *
     * @type {Set<PhysicsObject>}
     */
    dependants = new Set()

    /**
     * Constructs a {@link Geometry} with the provided geometry.
     *
     * Usually, geometries are constructed with the {@link GeometryBuilder} class.
     *
     * @param {Array<Vertex>} vertices The {@link Vertex vertices} included in this geometry.
     * @param {Array<Edge>} edges The {@link Edge edges} included in this geometry.
     * @param {number} minX The lower x-bound of the bounding box.
     * @param {number} maxX The greater x-bound of the bounding box.
     * @param {number} minY The lower y-bound of the bounding box.
     * @param {number} maxY The greater y-bound of the bounding box.
     */
    constructor(vertices = [], edges = [], minX = 0, maxX = 0, minY = 0, maxY = 0){
        this.edges = edges
        this.vertices = vertices
        this.minX = minX
        this.maxX = maxX
        this.minY = minY
        this.maxY = maxY
    }

    /**
     * The properties {@link Geometry#edges} and {@link Geometry#vertices} can be modified safely within the callback.
     *
     * @param {function(): void} callback The callback which may modify the geometry.
     */
    modify(callback){
        callback()
        this.updateBounds()
        this.recalculateCollisions()
    }

    /**
     * Updates the bound properties of this geometry (
     * {@link Geometry#minX minX}, {@link Geometry#minX minX}, {@link Geometry#minY minY}, {@link Geometry#maxY maxY}
     * ).
     */
    updateBounds(){
        let
            minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity

        function point(p){
            minX = Math.min(minX, p.x)
            maxX = Math.max(maxX, p.x)
            minY = Math.min(minY, p.y)
            maxY = Math.max(maxY, p.y)
        }

        for(const vertex of this.vertices){
            point(vertex.p)
        }
        for(const edge of this.edges){
            point(edge.p0)
            point(edge.p1)
        }

        this.minX = minX
        this.maxX = maxX
        this.minY = minY
        this.maxY = maxY
    }

    /**
     * Queues collision recalculation for all dependants.
     *
     * This method is used internally by the collision system and should not be called directly.
     */
    recalculateCollisions(){
        for(const dependant of this.dependants){
            dependant.queueCollisionRecalculation()
        }
    }
}

export {Geometry}