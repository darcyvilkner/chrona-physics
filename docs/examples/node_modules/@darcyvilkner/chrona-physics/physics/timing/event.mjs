/**
 * Events represent actions scheduled to occur when a {@link Clock} reaches a specific time.
 *
 * Events are added to clocks via {@link Clock#schedule}. They can later be canceled by setting {@link ClockEvent#valid} to false.
 */
class ClockEvent {
    /**
     * The time at which the event is scheduled to run.
     *
     * The clock will read exactly this time when the callback is executed.
     * 
     * @type {number}
     */
    time
    /**
     * The callback to run when the clock reaches {@link ClockEvent#time}.
     *
     * The callback receives the {@link Clock} which triggered the execution, which it may use to schedule further events.
     *
     * @type {function(Clock): void}
     */
    callback
    /**
     * Whether the event is valid.
     *
     * If false, the event will be ignored when reached by a clock.
     * An event may be made valid again after it has been invalidated.
     *
     * @type {boolean}
     */
    valid

    /**
     * @param {number} time
     * The time at which the event is scheduled to run.
     * See {@link ClockEvent#time} for more info.
     *
     * @param {function(Clock): void} callback
     * The callback to run when the clock reaches {@link ClockEvent#time}.
     * See {@link ClockEvent#callback} for more info.
     *
     * @param {?boolean} valid
     * Whether the event is valid.
     * See {@link ClockEvent#valid} for more info.
     */
    constructor(time, callback, valid = true){
        this.time = time
        this.callback = callback
        this.valid = valid
    }

    /**
     * Cancels this event.
     *
     * This event's callback will not be run when the clock reaches this event's trigger time.
     *
     * It is safe to cancel an event multiple times.
     */
    cancel(){
        this.valid = false
    }
}

export {ClockEvent}