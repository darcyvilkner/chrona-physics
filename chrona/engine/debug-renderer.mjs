import Transform from "../math/transform.mjs"
import V2 from "../math/v2.mjs"

/**
 * Assists in visualizing and debugging physics interactions via the {@link https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API Canvas API}.
 *
 * Example usage:
 *
 * ```js
 *
 * const
 *     canvas = document.getElementById("canvas"),
 *     ctx = canvas.getContext("2d"),
 *
 *     camera = Transform.scale(0.8 * canvas.height / 2).translateVals(canvas.width / 2, canvas.height / 2),
 *
 *     clock = new Clock(),
 *     obj = new PhysicsObject(clock,
 *         new GeometryBuilder()
 *             .polygon(...V2.multipleFromVals(
 *                 0, 0,
 *                 0, 1,
 *                 1, 0,
 *             ))
 *             .finish()
 *     ),
 *
 *     renderer = new DebugRenderer(ctx, camera)
 *
 * renderer.draw(obj)
 * ctx.stroke()
 *
 * ```
 */
class DebugRenderer {
    /**
     * The canvas's 2d rendering context, which will be used to draw objects.
     * @type {CanvasRenderingContext2D}
     */
    ctx
    /**
     * A transform which is applied after object transformations, converting world space to camera space.
     * @type {Transform}
     */
    camera
    /**
     * A scale for velocity indicators. Setting this to zero will hide the velocities.
     * @type {number}
     */
    velocityScale
    /**
     * The size of object origins in camera space. Setting this to zero will hide the origins.
     * @type {number}
     */
    originSize
    /**
     * The size of object vertices in camera space. Setting this to zero will hide the vertices.
     */
    vertexSize
    /**
     * Constructs a debug renderer with given parameters.
     *
     * @param {CanvasRenderingContext2D} ctx The canvas's 2d rendering context, which will be used to draw objects.
     * @param {Transform} camera A transform which is applied after object transformations, converting world space to camera space.
     * @param {number} velocityScale A scale for velocity indicators. Setting this to zero will hide the indicators.
     * @param {number} originSize The size of object origins in camera space. Setting this to zero will hide the origins.
     * @param {number} vertexSize The size of object vertices in camera space. Setting this to zero will hide the vertices.
     */
    constructor(ctx, camera = Transform.identity(), {
        velocityScale = 0,
        originSize = 0,
        vertexSize = 0
    } = {}) {
        this.ctx = ctx
        this.camera = camera
        this.velocityScale = velocityScale
        this.originSize = originSize
        this.vertexSize = vertexSize
    }

    /**
     * Adds the geometry of the objects specified to the {@link CanvasRenderingContext2D}'s path.
     *
     * This method does not directly render anything.
     * To draw the path onto a canvas, use the {@link CanvasRenderingContext2D#fill fill} or {@link CanvasRenderingContext2D#stroke stroke} methods.
     *
     * @param {...PhysicsObject} objects
     */
    draw(...objects){
        for(const object of objects){
            const
                transform = object.trajectory.getTransform().append(this.camera),
                center = V2.zero().applyTransform(transform),
                velVertex = center.xy.addScaled(object.trajectory.getMotion().p, this.velocityScale)
            // if(0 < this.velocityScale) {
            //     this.ctx.moveTo(center.x, center.y)
            //     this.ctx.lineTo(velVertex.x, velVertex.y)
            // }
            if(0 < this.originSize) {
                this.ctx.moveTo(center.x + 1, center.y)
                this.ctx.arc(center.x, center.y, this.originSize, 0, 2 * Math.PI)
            }
            let
                firstPos = true,
                lastPos = V2.zero()
            for(const edge of object.geometry.edges){
                if(firstPos || !edge.p0.equals(lastPos)){
                    firstPos = false
                    const p0 = edge.p0.xy.applyTransform(transform)
                    this.ctx.moveTo(p0.x, p0.y)
                }
                lastPos.set(edge.p1)
                const p1 = edge.p1.xy.applyTransform(transform)
                this.ctx.lineTo(p1.x, p1.y)
                console.log(p1.x, p1.y)
            }
            // for(const vertex of object.geometry.vertices){
            //     const
            //         p = vertex.p.xy.applyTransform(transform),
            //         v = object.trajectory.velOf(vertex.p),
            //         velVertex = p.xy.addScaled(v, this.velocityScale),
            //         p0 = V2.lerp(p, vertex.t0.xy.applyTransform(transform), this.vertexSize),
            //         p1 = V2.lerp(p, vertex.t1.xy.applyTransform(transform), this.vertexSize)
            //
            //
            //     this.ctx.moveTo(p0.x, p0.y)
            //     this.ctx.lineTo(p1.x, p1.y)
            //
            //     this.ctx.moveTo(p.x, p.y)
            //     this.ctx.lineTo(velVertex.x, velVertex.y)
            // }
        }
    }
}

export {DebugRenderer}