import {ClockEvent} from "../physics/timing/event.mjs"

/**
 * Schedules a callback on a {@link Clock}.
 *
 * Can be canceled by passing the {@link ClockEvent} returned by this function into {@link cancel}.
 *
 * @param {Clock} clock The clock being scheduled on.
 * @param {number} time The time at which the callback will be executed.
 * @param {function(Clock): void} callback The callback to be executed.
 * @returns {ClockEvent} The event generated, which can be canceled with {@link cancel}
 */
function schedule(clock, time, callback){
    const event = new ClockEvent(time, callback)
    clock.schedule(event)

    return event
}

/**
 * Cancels a callback scheduled with {@link schedule}.
 *
 * It is safe to cancel a callback multiple times.
 *
 * @param {ClockEvent} event
 * The event to cancel.
 * Returned from {@link schedule}.
 */
function cancel(event){
    event.valid = false
}

/** @type {Set<number>} */
const loops = new Set()

let id = 0

/**
 * Schedules a callback to be periodically run on a {@link Clock}.
 *
 * Can be stopped by passing the id returned by this function into {@link cancelLoop}.
 * 
 * @param {Clock} clock The clock the events are being scheduled on.
 * @param {number} startTime The time at which the callback is run for the first time.
 * @param {number} delay The delay between each iteration.
 * @param {function(Clock): void} callback The callback being periodically run.
 * @returns {number} An id associated with this loop used for cancelling.
 */
function scheduleLoop(clock, startTime, delay, callback){
    const thisId = id
    loops.add(thisId)
    id++

    function iteration(time) {
        schedule(clock, time, clock => {
            if (!loops.has(thisId)) return

            callback(clock)
            iteration(time + delay)
        })
    }

    iteration(startTime)

    return id
}

/**
 * Cancels a loop scheduled with {@link scheduleLoop}.
 *
 * @param {number} id
 * The id of the loop being canceled.
 * Returned from {@link scheduleLoop}.
 */
function cancelLoop(id){
    loops.delete(id)
}

export {schedule, cancel, scheduleLoop, cancelLoop}