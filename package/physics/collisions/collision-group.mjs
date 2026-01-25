/**
 * Collision groups specify what {@link PhysicsObject}s collide with and how they respond.
 *
 * Collision rules are not defined between individual objects.
 * Instead, they are defined between pairs of collision groups.
 * This allows collision behavior to be specified once and reused across objects.
 *
 * Example usage:
 *
 * ```js
 * const
 *     // Create collision groups
 *     physicalObjectCollision = new CollisionGroup(),
 *     environmentCollision = new CollisionGroup(),
 *     playerCollision = new CollisionGroup(),
 *     enemyCollision = new CollisionGroup(),
 *
 *     // Establish collision rules
 *     environmentCollisionRule = new CollisionRule(
 *         physicalObjectCollisionGroup, environmentCollisionGroup,
 *         collision => {
 *             // Inelastically stop the physical object
 *             collision.resolve(0.01, 0)
 *         },
 *     ),
 *     playerEnemyCollisionRule = new CollisionRule(
 *         playerCollisionGroup, enemyCollisionGroup,
 *         collision => {
 *             // Player-enemy collision logic
 *         },
 *     ),
 *
 *     // Create objects that use collision groups
 *     playerObj = new PhysicsObject(
 *         clock, playerGeometry, playerTrajectory, [physicalObjectCollision, playerCollision],
 *     ),
 *     enemyAObj = new PhysicsObject(
 *         clock, enemyGeometry, enemyATrajectory, [physicalObjectCollision, enemyCollision],
 *     ),
 *     enemyBObj = new PhysicsObject(
 *         clock, enemyGeometry, enemyBTrajectory, [physicalObjectCollision, enemyCollision],
 *     )
 *
 * ```
 */
class CollisionGroup {
    /**
     * All physics objects that belong to this group.
     *
     * This should not be modified directly.
     * Instead, use {@link PhysicsObject#addCollision} and {@link PhysicsObject#deleteCollision}.
     *
     * @type {Set<PhysicsObject>}
     */
    members = new Set()

    /**
     * All associated collision rules use objects belonging to this group as the "a" object.
     *
     * This should not be modified directly.
     * Instead, create collision rules with the {@link CollisionRule} constructor and delete them with {@link CollisionRule#disable}.
     *
     * @type {Set<CollisionRule>}
     */
    collisionRulesA = new Set()
    /**
     * All associated collision rules use objects belonging to this group as the "b" object.
     *
     * This should not be modified directly.
     * Instead, create collision rules with the {@link CollisionRule} constructor and delete them with {@link CollisionRule#disable}.
     *
     * @type {Set<CollisionRule>}
     */
    collisionRulesB = new Set()

    /**
     * Creates a blank {@link Geometry}.
     */
    constructor(){}

    /**
     * Removes this collision group from all members and deletes all associated collision rules.
     *
     * This will trigger *full* collision recalculations for all of this object's members.
     * Usually, collision groups aren't deleted during the lifetime of its members.
     */
    delete(){
        for(const member of this.members){
            member.deleteCollision(this)
        }
        for(const collisionRuleA of this.collisionRulesA){
            collisionRuleA.disable()
        }
        for(const collisionRuleB of this.collisionRulesB){
            collisionRuleB.disable()
        }
    }

    /**
     * Yields all collision candidates resulting from this collision group for an object.
     *
     * This method is used internally by the collision system and should not be called directly.
     *
     * @param {PhysicsObject} object
     * @param {Clock} clock
     */
    *generateCollisionCandidates(object, clock){
        for(const collisionRule of this.collisionRulesA){
            yield* collisionRule.generateCandidatesForA(object, clock)
        }
        for(const collisionRule of this.collisionRulesB){
            yield* collisionRule.generateCandidatesForB(object, clock)
        }
    }

    /**
     * Queues collision recalculation for all members of this group.
     *
     * This method is used internally by the collision system and should not be called directly.
     */
    recalculateCollisions(){
        for(const member of this.members){
            member.queueCollisionRecalculation()
        }
    }
}

/**
 * Generates an arbitrary number of collision groups.
 *
 * Example usage:
 * ```js
 *
 * const [groupA, groupB, groupC] = collisionGroups()
 *
 * ```
 *
 * @returns {Generator<CollisionGroup, void, *>}
 */
function* collisionGroups(){
    while(true){
        yield new CollisionGroup()
    }
}

export {CollisionGroup, collisionGroups}