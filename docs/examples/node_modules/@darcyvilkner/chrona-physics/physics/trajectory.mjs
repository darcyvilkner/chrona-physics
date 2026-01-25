import {Transform} from "@darcyvilkner/2d-geometry"
import {V2} from "@darcyvilkner/2d-geometry"

/**
 * Trajectories control the position and motion of objects over time.
 *
 * Trajectories represent movement as a {@link Transform} (transformation matrix) changing linearly over time.
 * The rate at which the transform changes is referred to as the *motion* of the trajectory, and is also represented with a Transform.
 *
 * The transform and motion of a trajectory is modified through {@link Trajectory#setTransform} and {@link Trajectory#setMotion}.
 * A number of convenience methods are also provided for common operations like translation, velocity changing, and linear interpolation.
 * 
 * Any modification to a trajectory will trigger collision recalculations for all objects that use it.
 *
 * Example of continuous rotation:
 *
 * ```js
 *
 * const
 *     clk = new Clock(),
 *     trajectory = new Trajectory(clk, Transform.identity())
 *
 * let angle = 0
 * const
 *     angularFreq = 1,
 *     dt = 0.1
 *
 * scheduleLoop(clk, 0, dt, clock => {
 *     angle += angularFreq * dt
 *     trajectory.transformTo(Transform.rotate(angle), dt)
 * })
 *
 * ```
 */
class Trajectory {
    /**
     * The clock that drives the transform's time evolution.
     *
     * This reference is fixed for the lifetime of the trajectory.
     *
     * @type {Clock}
     */
    clock
    /**
     * The transform at the time specified by {@link Trajectory#time}.
     *
     * This field is used internally by the trajectory and should not be accessed directly.
     *
     * @type {Transform}
     */
    base
    /**
     * The rate of change of the transform over time.
     *
     * This field is used internally by the trajectory and should not be accessed directly.
     *
     * @type {Transform}
     */
    motion
    /**
     * All physics objects that use this trajectory.
     *
     * This should not be modified directly.
     * Instead, use {@link PhysicsObject#setTrajectory}.
     *
     * @type {Set<PhysicsObject>}
     */
    dependants
    /**
     * The time at which this trajectory's transform was {@link Trajectory#base}.
     *
     * This field is used internally by the trajectory and should not be accessed directly.
     *
     * @type {number}
     */
    time

    /**
     * Constructs a new {@link Trajectory}.
     * @param {Clock} clock The clock that drives the transform's time evolution.
     * @param {?Transform} base The initial transform.
     * @param {?Transform} motion The initial rate of change of the transform.
     */
    constructor(clock, base = Transform.identity(), motion = Transform.zero()){
        this.clock = clock
        this.base = base
        this.motion = motion
        /** @type {Set<PhysicsObject>} */
        this.dependants = new Set()
        this.time = clock.time
    }

    /**
     * Advances {@link Trajectory#base} to the current clock time.
     *
     * This method is used internally be the trajectory and should not be called directly.
     */
    updateToPresent(){
        const dt = this.clock.time - this.time
        this.base.addScaled(this.motion, dt)
        this.time = this.clock.time
    }

    /**
     * Safely modifies the transform state.
     *
     * The properties {@link Trajectory#base} and {@link Trajectory#motion} can be modified within this callback.
     *
     * This method is used internally by the trajectory and should not be called directly.
     * Instead, use {@link Trajectory#setTransform} and {@link Trajectory#setMotion}.
     *
     * @param {function(): void} callback
     */
    modify(callback){
        this.updateToPresent()
        callback()
        this.recalculateCollisions()
    }

    /**
     * Returns the {@link Transform} currently applied to objects.
     *
     * @returns {Transform}
     */
    getTransform(){
        return this.base.copy().addScaled(this.motion, this.clock.time - this.time)
    }
    /**
     * Sets the {@link Transform} of the trajectory.
     *
     * @param {Transform} base
     * The current transform.
     * @param {?Transform} motion
     * The change in the transform over time.
     * If not provided, the previous motion is used.
     */
    setTransform(base, motion){
        this.base.set(base)
        if(motion) this.motion.set(motion)
        this.recalculateCollisions()
    }
    /**
     * Returns the current rate of change of the transform.
     *
     * @returns {Transform}
     */
    getMotion(){
        return this.motion.copy()
    }
    /**
     * Sets the rate of change of the transform.
     *
     * @param {Transform} motion The new rate of change of the transform.
     */
    setMotion(motion){
        this.modify(() => {
            this.motion.set(motion)
        })
    }

    /**
     * Sets the motion of the trajectory so that transform reaches a given target at a certain time.
     *
     * Note that the motion won't stop once the target is reached.
     * To halt or change motion use {@link Trajectory#setMotion}, {@link Trajectory#setTransform}, {@link Trajectory#stop}, or another transformTo call.
     *
     * @param {Transform} transform
     * The target transform.
     * @param {number} time
     * The duration that it will take to reach the target transform.
     */
    transformTo(transform, time){
        this.setMotion(
            transform.copy().sub(this.getTransform()).scale(1 / time)
        )
    }
    stop(){
        this.modify(() => {
            this.motion.zero()
        })
    }

    /**
     * Translates the trajectory by the given vector.
     *
     * @param {...VectorConstructionType} args
     * Takes any arguments that can construct a V2 with {@link V2#new}.
     */
    translate(...args){
        this.modify(() => {
            this.base.p.add(V2.new(...args))
        })
    }
    /**
     * Sets the translation component of the transformation without affecting motion.
     *
     * @param {...VectorConstructionType} args
     * Takes any arguments that can construct a V2 with {@link V2#new}.
     *
     * @returns {Trajectory}
     * This trajectory. Enables chaining.
     */
    setPos(...args){
        this.modify(() => {
            this.base.p.set(V2.new(...args))
        })
        return this
    }
    /**
     * Adds to the current translational velocity of the trajectory.
     *
     * @param {...VectorConstructionType} args
     * Takes any arguments that can construct a V2 with {@link V2#new}.
     */
    impulse(...args){
        this.modify(() => {
            this.motion.p.add(V2.new(...args))
        })
    }
    /**
     * Sets the change over time of the translation component of the trajectory.
     * If an object has no affine motion, this is the same as setting the velocity of the trajectory.
     * 
     * @param {...VectorConstructionType} args
     * The new change over time of the translation component of the trajectory.
     *
     * Takes any arguments that can construct a V2 with {@link V2#new}.
     */
    setVel(...args){
        this.modify(() => {
            this.motion.p.set(V2.new(...args))
        })
    }

    /**
     * Computes the world-space position of a point in geometry space.
     *
     * @param {...VectorConstructionType} args
     * Takes any arguments that can construct a V2 with {@link V2#new}.
     *
     * @returns {V2}
     */
    posOf(...args){
        return V2.new(...args).applyTransform(this.base)
    }
    /**
     * Computes the world-space velocity of a point in geometry space.
     *
     * @param {...VectorConstructionType} args
     * Takes any arguments that can construct a V2 with {@link V2#new}.
     *
     * @returns {V2}
     */
    velOf(...args){
        return V2.new(...args).applyTransform(this.motion)
    }
    /**
     * Computes the relative world-space velocity between two points in geometry space.
     *
     * @param {V2} p0
     * @param {V2} p1
     * @returns {V2}
     */
    velDiff(p0, p1){
        return p1.xy.sub(p0).applyTransformAffine(this.motion)
    }

    /**
     * Queues collision recalculation for dependants.
     *
     * This method is used internally by the collision system and should not be called directly.
     */
    recalculateCollisions(){
        for(const dependant of this.dependants){
            dependant.queueCollisionRecalculation()
        }
    }
}

export {Trajectory}