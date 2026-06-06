## Contact Optimization

Remember contacts after collisions,
enabling immediate collisions to be triggered without any checks.
When time passes, all contacts are forgotten.

Phases:
 - Check known contacts
 - Find narrow-phase contacts
 - Evaluate broad-phase calculations
 - Find narrow-phase collisions


## Spatial partitioning

Difficult because collisions need to be detected over all time,
rather than a fixed time frame, which most algorithms are designed for.

A k-dimensional tree could potentially be used.
Space would be partitioned based on the position and velocity of each axis-aligned boundary.
This structure would be very difficult to maintain.


## Multiple Collision Callbacks

Right now, each collision group on an object is scanned through and the collisions are immediately evaluated.
Instead of doing this, first determine the relevant collisions, collapse them based on object pairs,
and evaluate them as a group.


## Renaming

"Collision group" is long and is ambiguous when shortened to "group".
"Layer", "behavior", "class", and "material" are potential alternatives.

"Physics object" is also long and has a conflict with the programming concept when shortened to "object".
Perhaps "entity" or "body" can be used instead?