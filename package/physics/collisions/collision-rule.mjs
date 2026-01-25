import {Collision} from "./collision.mjs"
import {generateCollisionCandidates} from "./collision-candidate-generation.mjs"

/**
 * Collision rules specify what happens when objects in collision groups collide.
 *
 * Collisions are only checked between collision groups that have collision rules between them.
 * This means that a collision rule with an empty callback can have a significant performance cost.
 *
 * Collision rules are not defined between individual objects.
 * Instead, they are defined between pairs of collision groups.
 * This allows collision behavior to be specified once and reused across objects.
 */
class CollisionRule {
    /**
     * One of the two groups this rule applies to.
     *
     * Objects in this group will be tested against objects in group b and will be referred to as the a object in callbacks.
     *
     * @type {CollisionGroup}
     */
    groupA
    /**
     * One of the two groups this rule applies to.
     *
     * Objects in this group will be tested against objects in group a and will be referred to as the b object in callbacks.
     *
     * @type {CollisionGroup}
     */
    groupB

    /**
     * The {@link ToleranceProfile} this collision rule uses when detecting collisions.
     *
     * Controls how numerical tolerances are applied when detecting collisions for this rule.
     *
     * @type {ToleranceProfile}
     */
    toleranceProfile

    /**
     * The callback invoked when a collision occurs.
     * A [collision]{@link Collision} object is passed into the callback, which provides information about the collision and assists with resolution.
     *
     * @type {function(Collision): void}
     */
    callback

    /**
     * @type {boolean}
     */
    recalculating

    /**
     * Creates a {@link CollisionRule} between two collision groups with the given callback.
     *
     * When created, the rule is immediately registered with both groups, and all objects belonging to group a will be recalculated.
     *
     * @param {CollisionGroup} groupA
     * One of the collision groups this rule applies to.
     * See {@link CollisionRule#groupA} for more info.
     *
     * @param {CollisionGroup} groupB
     * One of the collision groups this rule applies to.
     * See {@link CollisionRule#groupB} for more info.
     *
     * @param {ToleranceProfile} toleranceProfile
     * The tolerance profile used by this collision rule.
     * See {@link CollisionRule#toleranceProfile} for more info.
     *
     * @param {function(Collision): void} callback
     * The callback invoked when a collision occurs.
     * See {@link CollisionRule#callback} for more info.
     *
     * @param {boolean} recalculating
     * Indicates whether the callback will cause either object to change in a way requiring collision recalculation (changing trajectories, changing geometry, or modifying collision behavior).
     *
     * If this is false, the engine can apply optimizations based on the fact that this collision won't affect future collisions.
     */
    constructor(groupA, groupB, toleranceProfile, callback, recalculating = true){
        groupA.collisionRulesA.add(this)
        groupB.collisionRulesB.add(this)
        groupA.recalculateCollisions()
        this.groupA = groupA
        this.groupB = groupB
        this.toleranceProfile = toleranceProfile
        this.callback = callback
        this.recalculating = recalculating
    }

    /**
     * Disables this collision rule.
     *
     * This removes this rule from the both collision groups and recalculates collisions for objects belonging to either group.
     *
     * This rule can be garbage collected in this state, although it can also be re-enabled with {@link CollisionRule#enable}.
     *
     * There is no performance impact for a disabled collision rule.
     */
    disable(){
        this.groupA.collisionRulesA.delete(this)
        this.groupB.collisionRulesB.delete(this)
        this.groupA.recalculateCollisions()
        this.groupB.recalculateCollisions()
    }
    /**
     * Enables this collision rule.
     *
     * This adds this rule to the two collision groups and recalculates collisions for objects belonging to group a.
     */
    enable(){
        this.groupA.collisionRulesA.add(this)
        this.groupB.collisionRulesB.add(this)
        this.groupA.recalculateCollisions()
    }

    /**
     * Generates all collisions resulting from this collision rule for an object belonging to group a.
     *
     * This method is used internally by the collision system and should not be called directly.
     *
     * @param {PhysicsObject} a
     * @param {Clock} clock
     * @yields {CollisionCandidate}
     */
    *generateCandidatesForA(a, clock){
        for(const b of this.groupB.members){
            const candidate = this.generateCandidateBetween(a, b, clock)
            if(candidate) yield candidate
        }
    }
    /**
     * Generates all collisions resulting from this collision rule for an object belonging to group b.
     *
     * This method is used internally by the collision system and should not be called directly.
     *
     * @param {PhysicsObject} b
     * @param {Clock} clock
     * @yields {CollisionCandidate}
     */
    *generateCandidatesForB(b, clock){
        for(const a of this.groupA.members){
            const candidate = this.generateCandidateBetween(a, b, clock)
            if(candidate) yield candidate
        }
    }

    /**
     * Returns a collision candidate between two objects, if one exists.
     *
     * This method is used internally by the collision system and should not be called directly.
     *
     * @param {PhysicsObject} A
     * @param {PhysicsObject} B
     * @param {Clock} clock
     * @returns {CollisionCandidate | null}
     */
    generateCandidateBetween(A, B, clock){
        return generateCollisionCandidates(A, B, clock.time, this)
    }
}

export {CollisionRule}