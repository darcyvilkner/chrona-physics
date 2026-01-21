# Overview

Chrona is a 2d, event-driven, affine-transform-based physics engine written in JavaScript. It is an engine that focuses on composability, control, and expressiveness. This document explains what chrona is at a high level. For learning how to use the engine see the [getting started](./getting-started) document.

## Composability

Chrona is intentionally small, but it is not incomplete.

Rather than providing a large collection of specialized features, Chrona focuses on a small number of fundamental mechanisms that can be composed to express a wide range of behavior. This keeps conceptual surface area small, and makes the engine easier to understand and reason about in full.

For example, Chrona only supports linear geometry. Curved surfaces are represented by approximating them with line segments. This is not a limitation in practice, but a way to avoid maintaining a long and uneven list of collider types—and the frustration of discovering that the one you need is missing.

Similarly, Chrona does not include rotation as a first-class concept. Instead, motion is described entirely using affine transformations, which are sufficient to represent rotation, scaling, and shearing without introducing additional structures or special cases. This reduces the number of concepts users need to learn, without losing expressiveness.

Finally, it hands you full control over how collisions are handled. You are able to handle anything from inelastic collisions to elastic collisions to collisions with friction to collisions that cause objects to spin. If you can describe it, you can implement it.

This combination of features ends up making Chrona more difficult to pick up at first, but once you've internalized its core ideas, you gain a great deal of expressive power.

## Performance

Chrona is not designed to maximize raw simulation throughput. Some of its core design choices trade performance for precision and determinism.

In return, Chrona provides strong guarantees about the behavior of collisions. When multiple collisions occur at the same time, they are always processed in a well-defined order. When many objects stack or interact simultaneously, the result is an exact set of collision events, rather than an approximation dependent on solver internals.

This makes Chrona particularly pleasant to develop with. There is rarely any ambiguity about why a collision occurred, or why objects ended up in a particular configuration. The behavior of the engine follows directly from its rules, rather than from implementation details.

## Timing

The most fundamental difference between Chrona and most physics engines is how it handles time.

In Chrona, there is *no such thing as a time step*. Instead, simulation is continuous, and all code is scheduled to execute at specific moments in time. When code runs, the state of the world reflects the exact state it should have at that moment.

This means that collision callbacks are executed at the precise instant objects are tangent, rather than an approximate time determined by a fixed update loop. In addition to making code more predictable, this also prevents objects from tunneling through one another at high speeds.

When an effect needs to occur continuously, like a force over time, the frequency of updates is explicit. For example, gravity might be implemented by periodically modifying an object's trajectory:

```js
scheduleLoop(/* start time */ 0, /* delay between iterations */ dt, () => {
    object.trajectory.impulse(0, -gravity * dt)
})
```

## Affine Movement

Positioning in Chrona is more expressive than in most physics engines. Rather than representing motion in terms of position, velocity, and rotation, objects are described by affine transformations that evolve linearly over time.

Because this evolution is linear, every point of an object always moves along a straight path, and straight lines within an object remain straight throughout motion. These constraints are what make the engine’s exact collision calculations possible.

Rotation and acceleration are therefore not first-class concepts. Instead, they are constructed explicitly by scheduling changes to an object's transformation over time. For example, rotation can be constructed by repeatedly interpolating between rotated transforms:

```js
const
    angularFreq = 1,
    dt = 0.1

let angle = 0

scheduleLoop(clk, 0, dt, clock => {
    angle += angularFreq * dt
    object.trajectory.transformTo(
        Transform.rotate(angle),
        /* time to transform */ dt,
    )
})
```

## Collision Structure

In Chrona, collision behavior is independent of the objects engaging in collisions.

Rather than defining collision logic on individual objects, Chrona defines interactions between collision groups. Objects are assigned to these groups when they are created, and automatically inherit the collision behavior defined between them.

This separation encourages centralized, reusable collision logic and keeps object construction simple. A typical structure might look like this:

```js
// Define collision logic

const [
    bouncyBalls,
    stressBalls,
    floor,
] = collisionGroups()

new CollisionRule(bouncyBalls, floor, tolerances, collision => {
    // bouncy balls bounce off the floor, and the floor doesn't move.
    collision.resolve(0, 1, 0, 1)
})
new CollisionRule(stressBalls, floor, tolerances, collision => {
    // stress balls stick to the floor, and the floor doesn't move.
    collision.resolve(0.1, 0, 0, 1)
})
new CollisionRule(bouncyBalls, stressBalls, tolerances, collision => {
    // stress balls stick to the bouncy balls, and their velocities are combined
    collision.resolve(0.1, 0, 1, 1)
})

// Later, when an object is instantiated

const myBouncyBall = new PhysicsObject(clk, ball, [bouncyBalls])
```

The important idea here is not the specifics of the API, but the structure: interaction rules are defined once up front, and objects remain lightweight and declarative.
