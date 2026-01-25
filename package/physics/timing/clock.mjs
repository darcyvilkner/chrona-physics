import {Heap} from "../../util/heap.mjs"
import {ClockEvent} from "./event.mjs"

/**
 * A clock schedules and executes timed events.
 *
 * Time advances by processing a sequence of cycles.
 * Each cycle comprises:
 *
 * 1. Running all queued preprocess callbacks.
 * 2. Identifying the next valid event.
 * 3. Advancing time and executing the event.
 *
 * Preprocesses are usually used to lazily recalculate derived state after a batch of modifications.
 *
 * Example usage:
 *
 * ```js
 *
 * const
 *     clock = new Clock(),
 *
 *     eventA = new ClockEvent(3, () => console.log("A")),
 *     eventB = new ClockEvent(0, () => console.log("B")),
 *     eventC = new ClockEvent(1, () => console.log("C")),
 *     eventD = new ClockEvent(2, () => console.log("D"))
 *
 * clock.schedule(eventA, eventB, eventC, eventD)
 *
 * clock.runTo(1) // B
 * eventD.valid = false
 * clock.runTo(4) // C, A
 *
 * ```
 */
class Clock {
    /**
     * The current time of the clock.
     *
     * This should not be modified directly.
     * Use {@link Clock#runTo} or {@link Clock#advance} to move time forward.
     *
     * @type {number}
     */
    time = 0
    /**
     * The maximum number of cycles that can be executed in a single {@link Clock#runTo} call.
     *
     * This limit exists to prevent infinite loops or excessively long computations.
     * 
     * @type {number}
     */
    runToCycleLimit
    /**
     * A priority queue of all scheduled events, including invalidated ones.
     *
     * Events are ordered by execution time.
     * Invalid events are skipped when encountered.
     * 
     * This should not be modified directly.
     * Use {@link Clock#schedule} to schedule events and set {@link ClockEvent#valid} to false to cancel them.
     * 
     * @type {Heap<ClockEvent>}
     */
    events = new Heap(
        /**
         * @param {ClockEvent} a
         * @param {ClockEvent} b
         * @returns {number}
         */
        (a, b) => a.time - b.time
    )
    /**
     * A list of preprocess callbacks which will be executed at the beginning of the next cycle.
     *
     * Preprocesses run before the next event is selected or executed and may safely modify events.
     * They are usually used to lazily recalculate derived state after a batch of modifications.
     *
     * Preprocesses receive the current clock cycle can safely add and remove events.
     *
     * @type {Array<function(number): void>}
     */
    preprocesses = []
    /**
     * The current cycle number of the clock.
     *
     * The cycle counter increases once each cycle and can be used as an id for the cycle.
     *
     * It can be used to avoid redundant preprocessing when no events have occurred since the last calculation.
     *
     * This should not be modified directly.
     *
     * @type {number}
     */
    cycle = 0
    
    /**
     * Creates a {@link Clock} starting at time 0 and cycle 0.
     *
     * @param {number} runToCycleLimit See {@link Clock#runToCycleLimit}
     */
    constructor(runToCycleLimit = 1e4){
        this.runToCycleLimit = runToCycleLimit
    }

    /**
     * Schedules one or more events to be executed when the clock reaches their specified time.
     * 
     * Events can be canceled by setting {@link ClockEvent#valid} to false.
     * 
     * @param {...ClockEvent} events The event(s) to add.
     */
    schedule(...events){
        for(const event of events) {
            if(event.time < this.time) continue
            this.events.push(event)
        }
    }

    /**
     * Schedules a preprocess callback which will be executed at the beginning of the next clock cycle.
     *
     * Preprocesses receive the current clock cycle can safely add and remove events.
     * 
     * @param {function(number): void} preprocesses The preprocess(es) to add.
     */
    addPreprocess(...preprocesses){
        for(const preprocess of preprocesses) {
            this.preprocesses.push(preprocess)
        }
    }

    /**
     * Runs the clock until the specified time is reached, executing all events that occur along the way.
     * Passes time until the time specified is reached, running all events at the time they occur. 
     * 
     * If this runs more than {@link Clock#runToCycleLimit} times, an error is thrown.
     * This limit exists to prevent infinite loops or excessively long computations.
     * 
     * @param {number} time The time to advance to.
     */
    runTo(time){
        if(time < this.time) throw "Time provided is before clock current time."

        let i = 0
        while(true){
            if(this.runToCycleLimit <= i){
                throw "Too many cycles from one runTo call. To increase the limit, modify clock.cycleLimit."
            }
            i++

            for(const preprocess of this.preprocesses){
                preprocess(this.cycle)
            }
            this.preprocesses.length = 0
            this.cycle++

            /** @type {ClockEvent | undefined} */ // WebStorm doesn't support JSDoc generics.
            const event = this.events.peek()

            if(!event || time <= event.time){
                this.time = time
                break
            }

            this.events.pop()

            if(!event.valid){
                continue
            }

            this.time = event.time
            event.callback(this)
        }


    }

    /**
     * Runs the clock to the next valid event.
     *
     * If no valid events exist, no time will pass.
     * 
     * @returns {boolean} Whether an event was executed.
     */
    advance(){
        while(true) {
            for (const preprocess of this.preprocesses) {
                preprocess(this.cycle)
            }
            this.preprocesses.length = 0
            this.cycle++

            /** @type {ClockEvent | undefined} */ // WebStorm doesn't support JSDoc generics.
            const event = this.events.peek()

            if (!event) {
                return false
            }

            this.events.pop()

            if (!event.valid) {
                continue
            }

            this.time = event.time
            event.callback(this)

            return true
        }
    }
}

export {Clock}