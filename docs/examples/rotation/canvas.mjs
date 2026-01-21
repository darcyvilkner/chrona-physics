import {V2} from "../../../chrona/index.mjs"

let
    /**
     * The fullscreen canvas.
     *
     * @type {HTMLCanvasElement}
     */
    canvas,
    /**
     * A {@link CanvasRenderinContext2D} for the {@link canvas fullscreen canvas}.
     * @type {CanvasRenderingContext2D}
     */
    ctx,
    resolution = 1

function resize() {
    [canvas.width, canvas.height] = V2.fromVals(innerWidth, innerHeight).scale(devicePixelRatio * resolution);
}

/**
 * Sets up {@link canvas} and {@link ctx}, and sets up automatic scaling.
 */
function setupCanvas(){
    canvas = document.getElementById("canvas")
    ctx = canvas.getContext("2d")

    addEventListener("resize", resize)
    resize()
}

/**
 * Sets the resolution of the canvas.
 * Can be called at any time.
 *
 * @param {number} scale A value from 0 to 1.
 */
function setResolution(scale){
    resolution = scale
    if(canvas) resize()
}

export {setupCanvas, setResolution, canvas, ctx}