# Getting Started

This guide walks through the core concepts of Chrona and how they fit together. By the end, you'll have objects moving, colliding, and rendering on screen.

For a higher-level explanation of what Chrona is and who it’s for, see the [overview](./overview.md) document in this directory.

Chrona is a fairly unusual physics engine. While it’s conceptually deep, it’s also quite small. You will need to understand most of this document before you can do anything substantial with Chrona—but once you do, you understand almost the complete system, and you should be able to build just about anything with it.

## Setup

To include Chrona in a project, run `npm i @darcyvilkner/chrona-physics`.

You can then import Chrona components from the package:

```js
import {V2, Transform, Clock, PhysicsObject} from "@darcyvilkner/chrona-physics"
```

### Note on Browser Usage

Chrona can be used directly in the browser, however, There are some additional steps that must be taken.

First, Chrona uses npm's module naming system, which browsers don't natively understand. The easiest way of dealing with this is to expose the `node_modules` folder and use an import map:

```html
<script type = "importmap">
{
    "imports": {
        "@darcyvilkner/2d-geometry": "./node_modules/@darcyvilkner/2d-geometry/index.mjs",
        "@darcyvilkner/chrona-physics": "./node_modules/@darcyvilkner/chrona-physics/index.mjs"
    }
}
</script>
```

You can then import Chrona normally from your JavaScript modules.

Since Chrona uses JavaScript's [module system](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), all scripts that use it must be marked with `type="module"` and be served from a secure context (`https://` or a local server).

## Clocks

Before we can get to simulating objects, we need to talk about time, as it may work a little differently from what you might be used to from other systems.

Time does not automatically pass in Chrona. In fact, there's no background notion of time at all! Time only exists once you introduce a clock.

```js
const clk = new Clock()
```

A clock defines a self-contained notion of time. It is responsible for three things:

- Providing the current time for time-dependent calculations,
- Scheduling the execution of code,
- And, most importantly, controlling the progression of time itself.

In order to pass time, we use the method `Clock#runTo(time: number)`.

```js
const clk = new Clock()

constole.log(clk.time) // 0

clk.runTo(4)

console.log(clk.time) // 4
```

We've now advanced the clock to time `4`. But what exactly does `4` mean here? Four seconds? Four milliseconds? Four days?

Chrona doesn't impose a time scale, so a unit of time can represent whatever makes sense for your simulation. All that matters is how far you advance the clock with `runTo`. For the sake of explanation, I'll refer to one time unit as a second, but until we start displaying things in real time, the distinction is arbitrary.

Advancing time isn't very interesting if nothing happens, so let's schedule some events:

```js
const clk = new Clock()

schedule(clk, 1, () => console.log(`Fred asks Jeff what time it is.`))
schedule(clk, 3, () => console.log(`Startled, Fred responds, "1.5? Already?"`))
schedule(clk, 1.5, () => console.log(`Jeff says the time is ${clk.time}.`))

clk.runTo(4)
/*
Fred asks Jeff what time it is.
Jeff says the time is 1.5.
Startled, Fred responds, "1.5? Already?"
*/
```

Code is scheduled to run with `schedule(clock: Clock, time: number, callback: (function(Clock): void))`. The callback runs when the clock reaches the given time.

Notice that the callbacks execute in chronological order, not in the order they were scheduled. Also notice that the clock reads the exact time that the code was scheduled to occur at. This demonstrates two fundamental principles of Chrona:

- Events are always processed in chronological order.
- During callbacks, the world will be in the exact state it would be expected to be in at the time it was scheduled to occur.

With this out of the way, we can get started with physical entities.

## Physics Objects

Physics objects are the physical things that exist in the world and interact with one another. They reference three components:

- A **geometry**, which defines the shape of the object.
- A list of **collision groups**, which define how the object collides with other objects.
- A **trajectory**, which specifies how the object is positioned and how it moves through space.

I'll be covering all of these components in the following sections.

One important thing to note is that these components are not owned by the object. They are defined independently and can be reused across objects. This enables behavior to be defined once and shared across objects.

A physics object is created with it's constructor:

```js
const myObj = new PhysicsObject(
    clk,
    geometry,
    [collisionGroupA, collisionGroupB],
    trajectory,
)
```

You may have noticed that the physics object requires a reference to a clock. Any objects that implement time-dependent behavior require access to a clock. In the case of a physics object, it needs to be able to schedule code to run at the exact moment it collides with other objects.

## Debug Renderers

Before I elaborate on physics objects, I'd like to talk about how we can see the physics we're simulating.

Chrona is primarily a physics simulation library, and does not prescribe any particular rendering system. However, it does includes a debug renderer that can visualize physics objects using the 2d context of the [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API). This renderer is intended for development, experimentation, and debugging, but not as a full rendering solution.

This section will assume you have a basic understanding of the Canvas API.

### Debug Renderer Basics

A debug renderer is created by providing:

- A canvas rendering context, which all graphics will be drawn to.
- An optional transform applied to all objects, which is used to map simulation coordinates to screen space.

```js
const renderer = new DebugRenderer(ctx, Transform.identity())
```

Once you have a renderer, you can call `DebugRenderer#draw` to add objects to the current canvas path.

Note that the renderer *only* adds the objects to the path. You are in charge of calling `beginPath()`, setting drawing styles, and displaying the stroke using `stroke()` or `fill()`.

```js
ctx.beginPath()
renderer.draw(objA, objB)
ctx.stroke()
```

Below is a minimal complete example of displaying an object. Don't worry about what exactly transforms are yet, or how the geometry is created. All that will be covered in later sections.

```js
const
    canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d"),
    
    
    clk = new Clock(),

    geometry = new GeometryBuilder(),
        .polygon(...V2.multipleFromVals(
            -1, -1,
            1, -1,
            1, 1,
            -1, 1,
        ))
        .finish(),

    obj = new PhysicsObject(clk, geometry),

    renderer = new DebugRenderer(
        ctx,
        Transform
            .scale(canvas.height / 2)
            .translate(canvas.width / 2, canvas.height / 2),
    )

ctx.lineWidth = devicePixelRatio

// define path
ctx.beginPath()
renderer.draw(obj)

// display path
ctx.stroke()
```

## Vectors

Before we can continue, we need to understand the basics of Chrona's vector type.

Vectors have a variety of constructors, but the most commonly used one is `V2.new`, which can take 2 numbers and produce a vector. Often, it is useful to create vectors in bulk, so `V2.multipleFromVals` takes pairs of numbers and produces an array of vectors.

Here's a basic example:

```js
const zero = V2.new(0, 0)

const [i, j] = V2.multipleFromVals(
    1, 0,
    0, 1,
)
```

Once you have a vector, you can access its components with `v.x` and `v.y`.

There are many operations available on vectors, but the most common ones are:

- Addition with `a.add(b)` or `a.add(x, y)`
- Subtraction with `a.sub(b)` or `a.sub(x, y)`
- Scaling with `a.scale(s)`
- Scaled addition with `a.addScaled(b, s)`
- Crossing and dotting with `a.cross(b)` (which returns a scalar) and `a.dot(b)`.

It is important to note that all vector methods mutate the original vector. Vectors can be copied with `v.xy`.

Now, back to physics!

## Geometry

The first physics object component we'll be looking at is geometry, which describes the shape of an object independent of transformations. Geometry is represented with `Geometry` objects.

Geometry objects consist of oriented `Vertex` and `Edge` objects. While these can be constructed directly, doing so is tedious. In practice, geometry is almost always constructed using a `GeometryBuilder`.

This is an example of what using a GeometryBuilder might look like:

```js
const geometry = new GeometryBuilder()
    // Trace out the shape of the geometry
    .polygon(...V2.multipleFromVals(
        0, 0,
        1, 0,
        0, 1,
    ))
    // Generate the final geometry
    .finish()
```

First, the geometry builder is created, then the geometry is specified by tracing out it's outline, and then the geometry object is finally obtained with `finish()`.

Here are the methods used to trace out geometry:

- `to(...vertices)`—traces to each vertex provided.
- `break()`—leaves the current path open and begins a new one.
- `close()`—closes the current path and begins a new path.
- `polygon(...vertices)`—traces and closes a polygon in one step.

Notice that there aren't any curved surfaces available. This is intentional. Chrona keeps geometry linear to remain as fundamental as possible. If you want curved behavior, you should approximate it with linear geometry.

Geometry is specified in it's own coordinate system, which is later transformed into world space with trajectories, which we'll discuss later. This means that the object will be positioned and scaled however is convenient for describing the object, rather than matching it's final orientation. It is often useful to define geometry such that it's center of mass lies at the origin, as this makes transformations like rotation simpler to perform.

### Orientation

All geometry in Chrona is oriented. This means that the direction in which it is traced out affects it's behavior. Specifically, if you were to walk along the outline of a shape, the geometry will only interact with things on your right. This is often easier to think about in terms of winding:

- Counter-clockwise paths interact on the outside
- Clockwise paths interact on the inside

Below is a more complex example:

```js
const builder = new GeometryBuilder()

builder.polygon(...V2.multipleFromVals(
    0, 0,
    1, 0,
    0, 1,
))

for(let i = 0; i < 10; i++){
    const angle = -i / 10 * (2 * Math.PI)
    builder.to(
        V2.new(2 * Math.cos(angle), 2 * Math.sin(angle))
    )
}
builder.close()

const geometry = builder.finish()
```

This creates a decagon with a triangle inside it. The decagon will keep objects in, as it is wound clockwise, while the triangle will keep objects out, as it is wound counter clockwise.

## Transformations

Once again, we'll be needing to stop for a moment to talk about another math type: Affine Transformations. These are represented in Chrona with `Transform` objects.

An affine transformation represents a mapping from one set of points to another. Specifically, it is a mapping that preserves straight lines. Transforms can be nested and composed, which makes them useful for both changes of coordinates (such as used in debug renders), and for positioning (as we'll see shortly with trajectories).

Transformations are usually constructed with a composition of simpler transformations. They can then be applied to arbitrary vectors with `v.applyTransform(transform)`. For example:

```js
const myTransform = Transform
    .rotate(Math.PI / 2)
    .translateVals(100, 0)

const transformed = V2.new(2, 1).applyTransform(myTransform)

console.log(transformed.toString()) // (99, 2)
```

Here, the vector is first rotated by a quarter turn and then transformed 100 in x, and 0 in y.

### Capabilities

The most commonly used transforms are:

- Translation, with `.translateVals(x: number, y: number)` and `.translate(v: V2)`.
- Scaling, with `.scale(factor: number, center: ?V2)` and `.directionalScale(axis: V2, factor: number, center: ?V2)`.
- Rotation, with `.rotate(angle: number, center: ?V2)`.

You may omit the center parameter for all transformations, it defaults to the origin.

There also exists operations between transforms:

- Composition, with `a.append(b)`, which applies a then b.
- Addition, with `a.add(b)`, which applies both a and b and adds the result together. `a.addScaled(b, s)` is also provided.

Like with vectors, all of these methods mutate.

Finally there are two special transforms provided:

- `Transform.identity()`, which is the transformation that does nothing.
- `Transform.zero()`, which is the transform that maps all points to the origin. This may seem silly at the moment, but you'll see that it actually comes in handy when we're working with trajectories.

### Relationship to Matrices

If you are familiar with transformation matrices, Chrona's transforms are exactly that, just without the redundant bottom row. For cases where you want to apply only the affine portion, `v.applyTransformAffine` can be used.

For cases where you want full control, you can construct a transform explicitly with `Transform.new(ax, ay, bx, by, px, py)`, where the first four parameters correspond with the linear portion and the last two correspond with the translational portion.

Now, it's time we get things moving.

## Trajectories

The second component we'll be discussing is *trajectories*, represented by the `Trajectory` class.

Trajectories describe how objects are positioned, and how that position changes over time. More specifically, they define a time-dependent transform which defines how objects' geometry is converted to world space.

To construct one, we use the trajectory constructor, which takes a clock a starting transform:

```js
const trajectory = new Trajectory(clk, base)
```

Now that we have a trajectory, let's see what it does.

The method `trajectory.posOf(x, y)` takes a position in geometry space and converts it to world space:

```js
const clk = new Clock()

const trajectory = new Trajectory(
    clk,
    Transform
        .scale(50)
        .translateVals(200, 200),
)

console.log(
    trajectory.posOf(1, 1), // 250, 250
    trajectory.posOf(-1, -1), // 150, 150
)
```

At the moment, this seems like a glorified transform, but things get interesting once we start changing things over time.

The method `trajectory.impulse(x, y)` (or `trajectory.impulse(v)`) can be used to apply a world-space velocity to the trajectory's transform:

```js
// ...

trajectory.impulse(50, 0)

clk.runTo(2)

console.log(
    trajectory.posOf(1, 1), // 350, 250
    trajectory.posOf(-1, -1), // 250, 150
)
```

As you can see, the position the geometry has been translated to is now different, even though the geometry itself hasn't changed! This is ultimately how all motion in Chrona is achieved—through the modification of trajectories, not geometries.

Let's put this together with an object and visualize the movement:

```js
const
    canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d"

// Clock setup

const clk = new Clock()

let t = 0
onkeydown = () => {
    t ++
    clk.runTo(t)
    draw()
}

// Object setup

const trajectory = new Trajectory(
    clk,
    Transform
        .scale(0.2)
        .translateVals(-0.5, -0.5),
)

trajectory.impulse(0.1, 0.1)

const geometry = new GeometryBuilder()
    .polygon(...V2.multipleFromVals(
        -1, -1,
        1, -1,
        1, 1,
        -1, 1,
    ))
    .finish()

const obj = new PhysicsObject(clk, geometry, [], trajectory)

// Rendering

const renderer = new DebugRenderer(
    ctx,
    Transform
        .scale(canvas.height / 2)
        .translateVals(canvas.width / 2, canvas.height / 2),
)

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    ctx.beginPath()
    renderer.draw(obj)
    ctx.stroke()
}

draw()
```

Press space a few times, and you should see your new object moving across the screen!

### Trajectory Fundamentals

Trajectories are built upon a very general idea: The transform of a trajectory is modified linearly over time. This rate of change is referred to as the *motion* of the transform.

This leads to two important rules:

- Every point that makes up an object moves along a straight path.
- The transform at any moment remains affine, so straight lines within an object remain straight throughout motion.

*These laws are what enable Chrona to calculate all collisions exactly.*

### Simpler models

In almost all cases, it is unnecessary to think about motion directly. There exist a couple other ways of dealing with motion which can be used before resorting to direct motion modification.

When all motion is uniform, it is significantly easier to work with transforms. For these cases, a small set of convenience methods are available:

- `translate`—translate the transform.
- `setPos`—set the position of the origin.
- `impulse`—add a velocity to the transform.
- `setVel`—apply an impulse so the origin moves at a specific velocity.
- `stop`—halt all motion.

Of course, uniform motion isn't always enough. It is often beneficial to think about where you want a transformation to end up. For these cases, Chrona provides the `TransformTo(transform, time)` method. This sets the trajectory's motion so that its transform reaches the target transform after the specified amount of time.

Note that t`ransformTo` won't stop once the transformation time has been expended. The motion must be explicitly overwritten with another `transformTo` or a `stop` call.

Here's a simple rotation example that uses `transformTo`:

```js
const
    angularFreq = 1,
    dt = 0.1

let angle = 0

scheduleLoop(clk, 0, dt, clock => {
    angle += angularFreq * dt
    object.trajectory.transformTo(
        Transform.rotate(angle),
        dt,
    )
})
```

### Working with Motion Directly

Before I explain this, you should understand that `transformTo` is sufficient for almost all cases, and is equally capable to this method. With that said, this mechanism is fundamental to Chrona, so it's useful to understand it directly.

You can think of a trajectory's motion as a second transform that maps positions in geometry space to velocities in world space.

When I say that a trajectory’s transform is modified linearly over time, I mean that the motion is added to the transform as time advances. If you are comfortable with matrices, this could be written as:
$$
T(t) = T(t_0) + (t - t_0)M
$$
By default, a transform's motion maps all points to zero (`Transform.zero()`). This means that the velocity of all points is zero, resulting in no movement.

Applying a translation to the motion matrix offsets all velocities by that amount. This is exactly what `impulse` does.

Now consider a motion of `Transform.identity()`. In this case, the geometry position `(3, 1)` is mapped to a velocity of `(3, 1)`. If the current transformation was also `Transform.identity()`, that point would be moving away from the origin, along with all other points. This produces uniform expansion over time.

It is important to understand that motion always mapps *geometry space* to world space. If the transformation in the previous example was instead `Transform.rotate(0.5 * Math.PI)`, the geometry position `(3, 1)` would be transformed to `(-1, 3)`, but would still have velocity `(3, 1)`. This results in an immediate twisting effect.

Motion can be modified directly with:

- `trajectory.setMotion(motion)`
- `trajectory.setTransform(base, motion)`
- `new Trajectory(clock, base, motion)`

## Collision

The final component we'll be talking about is collision groups, which have collision rules set up between them.

### Collision Groups

In Chrona, collisions aren't set up between individual objects. Instead, they are set up between *collision groups*, which are collections of objects. This organization enables collision logic to be centralized and reused.

We can create collision groups with the constructor:

```js
const group = new CollisionGroup()
```

Often, we need a bunch of collision groups, so they can be created en masse with `collisionGroups()`.

```js
const [
    environment,
    physicalObject,
    player,
    enemy,
] = collisionGroups()
```

Once you have an group, any new physics objects can be added to it when they are constructed:

```js
const obj = new PhysicsObject(clk, trajectory, [physicalObject, enemy])
```

### Collision Rules

Collision rules are used to set up interactions between collision groups. They enable you to execute an arbitrary callback at the exact moment objects in one group collide with objects in another.

```js
const collisionRule = new CollisionRule(player, enemy, tolerances, collision => {
    console.log(`A player was hit at time ${clk.time}!`)
})
```

Don't worry about what tolerances are quite yet, I'll be covering them in a moment.

The order of the two collision groups in the collision rule is significant. It is used to identify which object is which. The object that belongs to the first group is referred to as the "a object", while the object that belongs to the second is referred to as the "b object".

Notice that the callback receives a collision object. This object provides information about the collision and assists with resolving it.

The easiest way to resolve a collision is with `collision.resolve`, which applies a normal impulse to the two objects to resolve the collision. This method is fairly general and can represent collisions anywhere from two bouncy balls bouncing off one another to a bowling ball falling to the floor and coming to rest immediately. Exactly how the collision is resolved is determined by 4 parameters:

- `additionalVelocity`—the velocity the objects will have away from each other after the collision. This is added to the reflected velocity. Should be greater than 0 unless `restitutionCoefficent` is 1 so that objects always have a significant velocity away from one another.
- `restitutionCoefficent`—how much of the velocity is reflected, or how bouncy the collision is. Takes a value from 0 to 1. Defaults to 1.
- `weightA` and `weightB`—The weights of the two objects. Weights are only used for resolving this collision and do not represent persistent physical masses. Defaults to 0 and 1.

Here's an example of how an object might be set up to yield to it's environment without bouncing:

```js
new CollisionRule(bowlingBall, floor, tolerances, collision => {
    collision.resolve(0.01 /* very small velocity */, 0 /* no elasticity */, 0 /* player has no weight compared to environment */, 1)
})
```

If you'd like to perform additional operations on the collision, or resolve the collision manually, the collision provides some useful information about the objects. Here are a couple particularly useful properties:

- `collision.objA` and `collision.objB` identify the specific objects in the two groups that were involved in the collision.
- `collision.tangent` specifies the tangent direction of object a. The normal vector can be calculated by rotating this back a quarter turn (`collision.tangent.xy.antiPerp()`).
- `collision.relVel` specifies the velocity of b relative to a at the point of the collision.
- `collision.pos` specifies the world position of the collision.

### Tolerances

Chrona computes collision times and contact geometry in closed form. However, because all calculations ultimately rely on floating-point arithmetic, small numerical errors are unavoidable.

To ensure robust behavior in the presence of these errors, every collision rule includes a `ToleranceProfile`, which specifies how these inaccuracies are handled. Since Chrona doesn't enforce any coordinate scale, it is necessary for these parameters to be tuned by the user.

These values are often determined empirically. When you observe the effects I'll be describing, consider returning the tolerances. Usually one set of parameters is sufficient for a whole project.

The first correction system is put into action when calculations are made when objects are extremely close to each other. Instead of calculating the time of the collision, Chrona will treat collisions as occurring instantly. This prevents objects from clipping through one another. The distance at which this begins occurring is referred to as the *close collision threshold*, and should be set to a value that is smaller than visible, but still significant compared to the precision of a float.

If the value is too low, objects would pass through the objects when collisions occur at a high frequency, such as when an object is pinned or wedged inside a sharp edge. If the value is too high, it may look like objects collide before they touch.

The second correction system relates to geometry calculations. When two objects collide, a test is done to check whether the edge's tangent is within the range accepted by the vertex. If isn't, the collision is rejected. Sometimes this calculation is incorrect and collisions are incorrectly rejected. To prevent this, there is a slight leniancy in this calculation, which is called the *directional tolerance*. This value takes a value from 0 to 1, where 0 is no tolerance and 1 is full tolerance. The default value of 0.02 is usually good enough for most applications.

If the value is too low, collisions might be missed when surfaces are nearly aligned. If the value is too high, objects may snag on vertices in physically implausible ways.

## Putting Everything Together

If you've made it this far, congratulations! You now understand everything you need to start using Chrona.

If you'd like, you can leave right here and start building things with Chrona, but it's also totally reasonable if you're still feeling a bit overwhelmed by all of Chrona's interlocking parts. This section hopes to help you put together the pieces we've explored separately up to this point.

This section guides you through how to build an x. I haven't figured out exactly what x is yet though, so you're going to have to just figure it out. I have a couple of examples available in the `/docs/examples` directory of the repository which you can through until then.

## Appendex: Preprocessing

So there's also this thingey called preprocesses, but they're not that important, so I'ma leave them out for now.
