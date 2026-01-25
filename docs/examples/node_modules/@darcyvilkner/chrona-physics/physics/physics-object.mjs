import {Trajectory} from "./trajectory.mjs"
import {Heap} from "../util/heap.mjs"
import {ClockEvent} from "./timing/event.mjs"
import {Geometry} from "./geometry/geometry.mjs"

/**
 * A physics object represents a physical entity which can move and collide with other objects.
 *
 * Physics objects do not directly store anything, instead, they bind together three components:
 * - A {@link Geometry}, which defines the object's shape.
 * - A {@link Trajectory}, which controls the object's position and motion over time.
 * - One or more {@link CollisionGroup}s, which provide behavior when the object collides with other objects.
 *
 * These components may be shared across multiple objects.
 *
 * In most cases, it is preferable to create a new object than to mutate an existing one.
 *
 * Example usage:
 * ```js
 *
 * const
 *     clk = new Clock()
 *
 *     collisionGroupA = new CollisionGroup(),
 *     collisionGroupB = new CollisionGroup(),
 *
 *     geometry = new Geometry(
 *         new GeometryBuilder()
 *             .polygon(V2.multipleFromVals(
 *                 0, 0,
 *                 0, 1,
 *                 1, 0,
 *             ))
 *             .finish(),
 *     ),
 *
 *     trajectory = new Trajectory(clk),
 *
 *     obj = new PhysicsObject(
 *         clk,
 *         geometry,
 *         trajectory,
 *         [collisionGroupA, collisionGroupB],
 *     )
 *
 * ```
 */
class PhysicsObject {
    /**
     * The clock on which the object schedules collision calculations and collision events.
     *
     * This reference is fixed for the lifetime of the object.
     *
     * @type {Clock}
     */
    clock
    /**
     * The {@link Geometry} that provides this object's geometry.
     *
     * This geometry is later transformed into world space by {@link PhysicsObject#trajectory} when calculating interactions.
     *
     * This should not be modified directly.
     * Instead, use {@link PhysicsObject#setGeometry}
     *
     * @type {Geometry}
     */
    geometry
    /**
     * The {@link Trajectory} that controls how this object moves.
     *
     * This should not be modified directly.
     * Instead, use {@link PhysicsObject#setTrajectory}
     *
     * @type {Trajectory}
     */
    trajectory
    /**
     * The set of {@link CollisionGroup}s that govern this object's collision behavior.
     *
     * Collisions are only checked against the objects these collisions groups test against.
     *
     * This should not be modified directly.
     * Instead, use {@link PhysicsObject#addCollision} and {@link PhysicsObject#deleteCollision}
     *
     * @type {Set<CollisionGroup>}
     */
    collisionGroups

    /**
     * Whether this object is disabled.
     *
     * This should not be modified directly. Instead, use {@link PhysicsObject#disable} and {@link PhysicsObject#enable}
     *
     * @type {boolean}
     */
    disabled = true

    /**
     * Collision-related events currently scheduled due to this object's state.
     *
     * These events are invalidated whenever collisions are recalculated.
     *
     * This field is used internally by the collision system and should not be accessed directly.
     *
     * @type {Array<ClockEvent>}
     */
    relevantEvents = []
    /**
     * The last cycle in which a collision recalculation was queued for this object.
     *
     * Used to avoid redundant collision calculations.
     *
     * This field is used internally by the collision system and should not be accessed directly.
     *
     * @type {number}
     */
    lastCollisionRecalculationCycle = -Infinity
    /**
     * A heap of recalculating {@link CollisionCandidate}s which were on this object's trajectory at the time of the last recalculation.
     *
     * This field is used internally by the collision system and should not be accessed directly.
     *
     * @type {Heap<CollisionCandidate>}
     */
    recalculatingCollisionCandidates = new Heap(
        (a, b) => a.earliestTime - b.earliestTime
    )
    /**
     * A heap of non-recalculating {@link CollisionCandidate}s which were on this object's trajectory at the time of the last recalculation.
     *
     * This field is used internally by the collision system and should not be accessed directly.
     *
     * @type {Heap<CollisionCandidate>}
     */
    otherCollisionCandidates = new Heap(
        (a, b) => a.earliestTime - b.earliestTime
    )
    /**
     * The time of the earliest probable recalculation due to an external collision.
     *
     * This field is used internally by the collision system and should not be accessed directly.
     *
     * @type {number}
     */
    nextProbableRecalculation = Infinity

    /**
     * The time of the last time events were recalculated for this object, which is the same time as candidates were generated.
     *
     * This field is used internally by the collision system and should not be accessed directly.
     */
    lastRecalculation = -Infinity
    
    /**
     * Constructs a new {@link PhysicsObject}.
     *
     * @param {Clock} clock
     * The clock on which the PhysicsObject schedules collision calculations and collision events.
     * See {@link PhysicsObject#clock} for more info.
     *
     * @param {Geometry} geometry
     * The {@link Geometry} that provides this object's geometry.
     * See {@link PhysicsObject#geometry} for more info.
     *
     * The {@link Trajectory} that controls how this object moves.
     * See {@link PhysicsObject#trajectory} for more info.
     *
     * @param {Iterable<CollisionGroup>} collisionGroups
     * The set of {@link CollisionGroup}s that govern this object's collision behavior.
     * See {@link PhysicsObject#collisionGroups} for more info.
     * @param {Trajectory} trajectory
     * The {@link Trajectory} that controls how this object moves.
     * See {@link PhysicsObject#trajectory} for more info.
     * @param {boolean} disabled
     *
     * If not provided, a new Trajectory will be constructed which can be accessed with {@link PhysicsObject#trajectory}
     */
    constructor(clock, geometry = new Geometry(), collisionGroups = [], trajectory = new Trajectory(clock), disabled = false){
        this.clock = clock

        this.geometry = geometry

        this.trajectory = trajectory

        /** @type {Set<CollisionGroup>} */
        this.collisionGroups = new Set()
        for(const collisionGroup of collisionGroups){
            this.collisionGroups.add(collisionGroup)
        }

        if(!disabled) this.enable()
    }

    /**
     * Disables this physics object.
     *
     * This disconnects the object from its resources and invalidates the collisions it is involved in.
     *
     * The object will not be involved in collisions while it is disabled.
     * However, its trajectory will still evolve while it is inactive.
     *
     * This object can be garbage collected in this state, although it can also be re-enabled with {@link PhysicsObject#enable}.
     *
     * There is no performance impact for a disabled physics object.
     */
    disable(){
        this.geometry.dependants.delete(this)
        this.trajectory.dependants.delete(this)
        for(const group of this.collisionGroups){
            group.members.delete(this)
        }
        this.clearCollisions()
        this.disabled = true
    }

    /**
     * Enables this physics object.
     *
     * This reconnects the object to its resources and calculates new collisions.
     */
    enable(){
        this.geometry.dependants.add(this)
        this.trajectory.dependants.add(this)
        for(const group of this.collisionGroups){
            group.members.add(this)
        }
        this.queueCollisionRecalculation()
        this.disabled = false
    }

    /**
     * Sets this object's {@link PhysicsObject#geometry geometry}.
     *
     * Usually, an object should not change geometry during its lifetime.
     *
     * @param {Geometry} geometry
     */
    setGeometry(geometry){
        this.geometry.dependants.delete(this)
        geometry.dependants.add(this)
        this.geometry = geometry
        this.queueCollisionRecalculation()
    }

    /**
     * Sets this object's {@link PhysicsObject#trajectories trajectories}.
     *
     * Usually, an object should not change trajectories during its lifetime.
     *
     * @param {Trajectory} trajectory
     */
    setTrajectory(trajectory){
        this.trajectory.dependants.delete(this)
        trajectory.dependants.add(this)
        this.trajectory = trajectory
        this.queueCollisionRecalculation()
    }

    /**
     * Adds one or more collision groups to this object.
     *
     * Note that modifying an object's collision groups will trigger a *full* collision recalculation.
     * Usually, an object should not change collision groups during its lifetime.
     *
     * @param {...CollisionGroup} collisions
     */
    addCollision(...collisions){
        for(const collision of collisions){
            collision.members.add(this)
            this.collisionGroups.add(collision)
        }
        this.queueCollisionRecalculation()
    }
    /**
     * Removes one or more collision groups from an object.
     *
     * Note that modifying an object's collision groups will trigger a *full* collision recalculation.
     * Usually, an object should not change collision groups during its lifetime.
     *
     * @param {...CollisionGroup} collisions
     */
    deleteCollision(...collisions){
        for(const collision of collisions){
            collision.members.delete(this)
            this.collisionGroups.delete(collision)
        }
        this.queueCollisionRecalculation()
    }

    /**
     * Adds a preprocess to this object's clock which will recalculate collisions for this object.
     *
     * Should be called when any collision-related aspect of this object is modified.
     *
     * This method is used internally by the collision system and should not be called directly.
     */
    queueCollisionRecalculation(){
        if(this.lastCollisionRecalculationCycle == this.clock.cycle) return
        this.lastCollisionRecalculationCycle = this.clock.cycle

        this.clock.addPreprocess(cycle => {
            this.recalculateCollisions()
        })
    }

    /**
     * Invalidates all collision events.
     *
     * This method is used internally by the collision system and should not be called directly.
     */
    clearCollisions(){
        for(const event of this.relevantEvents){
            event.valid = false
        }
        this.relevantEvents.length = 0
    }

    /**
     * Evaluates one batch of collisions and adds them to the clock.
     *
     * This method is used internally by the collision system and should not be called directly.
     */
    addCollisions(){
        let earliestCollisionTime = this.nextProbableRecalculation
        this.nextProbableRecalculation = Infinity
        while(true){
            /** @type {CollisionCandidate | undefined} */
            const candidate = this.recalculatingCollisionCandidates.peek()

            if(!candidate) break

            if(earliestCollisionTime < candidate.earliestTime) {
                // The current earliest collision is the first to occur.
                // If it gets canceled, this calculation must resume.

                const event = new ClockEvent(candidate.earliestTime, clock => {
                    this.addCollisions()
                })
                this.relevantEvents.push(event)
                this.clock.schedule(event)
                break
            }
            
            this.recalculatingCollisionCandidates.pop()

            // Hackey way of checking if the other object was recalculated more recently
            if(this.lastRecalculation != Math.max(candidate.a.lastRecalculation, candidate.b.lastRecalculation)) continue

            const events = candidate.calculateExact(this.clock.time)

            for(const event of events) {
                if (event.time < this.clock.time) break
                earliestCollisionTime = event.time
                this.clock.events.push(event)
            }
        }

        while(true){
            const candidate = this.otherCollisionCandidates.pop()

            if(!candidate) break

            if(earliestCollisionTime < candidate.earliestTime) break

            const events = candidate.calculateExact(this.clock.time)
            for(const event of events){
                if(earliestCollisionTime < event.time) continue

                this.clock.events.push(event)
            }
        }
    }

    /**
     * Immediately clears all active collisions, generates candidates, and adds the first batch of collisions to the clock.
     *
     * This method is used internally by the collision system and should not be called directly.
     */
    recalculateCollisions(){
        this.lastRecalculation = this.clock.time
        if(this.disabled) return
        this.clearCollisions()
        this.nextProbableRecalculation = Infinity

        this.recalculatingCollisionCandidates.clear()
        this.otherCollisionCandidates.clear()

        for(const collisionGroup of this.collisionGroups){
            const candidates = collisionGroup.generateCollisionCandidates(this, this.clock)
            for(const candidate of candidates){
                if(candidate.collisionRule.recalculating){
                    this.recalculatingCollisionCandidates.push(candidate)
                }else{
                    this.otherCollisionCandidates.push(candidate)
                }
            }
        }

        this.addCollisions()
    }
}

export {PhysicsObject}