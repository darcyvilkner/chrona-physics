/**
 * @typedef {V2 | Iterable | Generator<number> | number | ArrayBuffer | Float32Array} VectorConstructionType
 */

/**
 * @implements {Iterable}
 */
export default class V2 {
    /** @type {Float32Array} */
    arr

    //#region Constants

    static ELEMENTS = 2
    static BYTES_PER_ELEMENT = Float32Array.BYTES_PER_ELEMENT
    static BYTE_LENGTH = V2.ELEMENTS * V2.BYTES_PER_ELEMENT

    //#endregion


    //#region Constructors

    /**
     * @param {...VectorConstructionType} args
     * @returns {V2}
     */
    static new(...args){
        if(args[0] instanceof Object){
            if(args[0] instanceof V2){
                return V2.fromVals(args[0].arr[0], args[0].arr[1])
            }else if(args[0] instanceof ArrayBuffer){
                return V2.fromArrayBuffer(args[0], args[1])
            }else if(args[0] instanceof Float32Array){
                return V2.fromFloat32Array(args[0], args[1])
            }else if(Symbol.iterator in args[0]){
                return V2.fromIterable(args[0], args[1])
            }else if(typeof args[0].next == "function"){
                return V2.fromGenerator(args[0])
            }else{
                throw "Unknown arguments"
            }
        }else{
            return V2.fromVals(args[0], args[1] ?? args[0])
        }
    }
    /**
     * @param {number} x
     * @param {number} y
     * @returns {V2}
     */
    static fromVals(x = 0, y = 0) {
        const v2 = new V2()
        v2.arr = new Float32Array(V2.ELEMENTS)
        v2.arr[0] = x
        v2.arr[1] = y
        return v2
    }

    /**
     * @param {...number} vals
     */
    static multipleFromVals(...vals){
        const
            count = vals.length / 2,
            /** @type {Array<V2>} */
            arr = new Array(count),
            float32Array = new Float32Array(V2.ELEMENTS * count)
        for(let i = 0; i < count; i++){
            const v2 = new V2()
            v2.arr = new Float32Array(
                float32Array.buffer,
                i*V2.ELEMENTS*Float32Array.BYTES_PER_ELEMENT,
                V2.ELEMENTS
            )
            v2.arr[0] = vals[V2.ELEMENTS*i]
            v2.arr[1] = vals[V2.ELEMENTS*i + 1]
            arr[i] = v2
        }
        return arr
    }
    /**
     * @param {number} r
     * @param {number} angle
     */
    static fromPolar(r = 0, angle = 0) {
        const v2 = new V2()
        v2.arr = new Float32Array(V2.ELEMENTS)
        v2.arr[0] = r*Math.cos(angle)
        v2.arr[1] = r*Math.sin(angle)
        return v2
    }
    /**
     */
    static zero() {
        const v2 = new V2()
        v2.arr = new Float32Array(2)
        return v2
    }
    /**
     */
    static i() {
        const v2 = new V2()
        v2.arr = new Float32Array(2)
        v2.arr[0] = 1
        v2.arr[1] = 0
        return v2
    }
    /**
     */
    static j() {
        const v2 = new V2()
        v2.arr = new Float32Array(2)
        v2.arr[0] = 0
        v2.arr[1] = 1
        return v2
    }
    /**
     */
    static one() {
        const v2 = new V2()
        v2.arr = new Float32Array(2)
        v2.arr[0] = 1
        v2.arr[1] = 1
        return v2
    }

    // Factories from buffers / arrays
    /**
     * Keeps reference
     * @param {ArrayBuffer} arrayBuffer
     * @param {?number} byteOffset
     */
    static fromArrayBuffer(arrayBuffer = new ArrayBuffer(V2.BYTE_LENGTH), byteOffset = 0) {
        const v2 = new V2()
        v2.arr = new Float32Array(arrayBuffer, byteOffset, V2.ELEMENTS)
        return v2
    }
    /**
     * Keeps reference
     * @param {ArrayBuffer} arrayBuffer
     * @param {?number} count
     * @param {?number} byteOffset
     */
    static multipleFromArrayBuffer(
        arrayBuffer = new ArrayBuffer(V2.BYTE_LENGTH),
        count = Math.floor(arrayBuffer.byteLength/V2.BYTE_LENGTH),
        byteOffset = 0,
    ) {
        /** @type {Array<V2>} */
        const arr = new Array(count)
        for(let i = 0; i < count; i++){
            const v2 = new V2()
            v2.arr = new Float32Array(arrayBuffer, byteOffset + i*V2.BYTES_PER_ELEMENT, V2.ELEMENTS)
            arr[i] = v2
        }
        return arr
    }
    /**
     * Keeps reference
     * @param {Float32Array} float32Array
     * @param {?number} offset
     */
    static fromFloat32Array(float32Array = new Float32Array(V2.ELEMENTS), offset = 0) {
        const v2 = new V2()
        v2.arr = new Float32Array(
            float32Array.buffer,
            float32Array.byteOffset + offset*Float32Array.BYTES_PER_ELEMENT,
            V2.ELEMENTS
        )
        return v2
    }
    /**
     * Keeps reference
     * @param {Float32Array} float32Array
     * @param {?number} count
     * @param {?number} offset
     */
    static multipleFromFloat32Array(
        float32Array = new Float32Array(V2.ELEMENTS),
        count = Math.floor(float32Array.length/V2.ELEMENTS),
        offset = 0,
    ) {
        /** @type {Array<V2>} */
        const arr = new Array(count)
        for(let i = 0; i < count; i++){
            const v2 = new V2()
            v2.arr = new Float32Array(
                float32Array.buffer,
                float32Array.byteOffset + (offset + i)*Float32Array.BYTES_PER_ELEMENT,
                V2.ELEMENTS
            )
            arr[i] = v2
        }
        return arr
    }
    /**
     * @param {Array<number>} arr
     * @param {number} offset
     */
    static fromArray(
        arr = [0, 0,],
        offset = 0,
    ){
        const v2 = new V2()
        v2.arr = new Float32Array(V2.ELEMENTS)
        v2.arr[0] = arr[offset]
        v2.arr[1] = arr[offset + 1]
        return v2
    }
    /**
     * Copies by value
     * @param {Array<number>} srcArray
     * @param {?number} count
     * @param {?number} offset
     */
    static multipleFromArray(
        srcArray = [],
        count = srcArray.length/2,
        offset = 0,
    ){
        const
            /** @type {Array<V2>} */
            arr = new Array(count),
            float32Array = new Float32Array(V2.ELEMENTS * count)
        for(let i = 0; i < count; i++){
            const v2 = new V2()
            v2.arr = new Float32Array(
                float32Array.buffer,
                i*V2.ELEMENTS*Float32Array.BYTES_PER_ELEMENT,
                V2.ELEMENTS
            )
            v2.arr[0] = srcArray[offset + V2.ELEMENTS*i]
            v2.arr[1] = srcArray[offset + V2.ELEMENTS*i + 1]
            arr[i] = v2
        }
        return arr
    }
    /**
     * @param {Generator<number>} gen
     */
    static fromGenerator(gen){
        const v2 = new V2()
        v2.arr = new Float32Array(V2.ELEMENTS)
        v2.arr[0] = gen.next().value
        v2.arr[1] = gen.next().value
        return v2
    }
    /**
     * Copies by value
     * @param {Iterable<number>} iterable
     * @param {?number} offset
     */
    static fromIterable(
        iterable = [],
        offset = 0,
    ){
        const gen = iterable[Symbol.iterator]()
        for(let i = 0; i < offset; i++){
            gen.next()
        }
        const v2 = new V2()
        v2.arr = new Float32Array(V2.ELEMENTS)
        v2.arr[0] = gen.next().value
        v2.arr[1] = gen.next().value
        return v2
    }
    /**
     * Copies by value
     * @param {Iterable} iterable
     * @param {number} count
     * @param {?number} offset
     */
    static multipleFromIterable(
        iterable = [],
        count = 0,
        offset = 0,
    ){
        const gen = iterable[Symbol.iterator]()
        for(let i = 0; i < offset; i++){
            gen.next()
        }
        /** @type {Array<V2>} */
        const arr = new Array(count)
        for(let i = 0; i < count; i++){
            const v2 = new V2()
            v2.arr = new Float32Array(V2.ELEMENTS)
            v2.arr[0] = gen.next().value
            v2.arr[1] = gen.next().value
            arr[i] = v2
        }
        return arr
    }

    //#endregion

    //#region Constructors From Operations

    /**
     * @param {V2} a
     * @param {V2} b
     * @param {number} t
     */
    static lerp(a, b, t){
        const v2 = new V2()
        v2.arr = new Float32Array(V2.ELEMENTS)
        v2.arr[0] = a.arr[0] * (1 - t) + b.arr[0] * t
        v2.arr[1] = a.arr[1] * (1 - t) + b.arr[1] * t
        return v2
    }
    /**
     * @param {...V2} addends
     */
    static sum(...addends) {
        const arr = new Float32Array(2)
        for(let i = 0; i < addends.length; i++) {
            arr[0] += addends[i].arr[0]
            arr[1] += addends[i].arr[1]
        }
        const sum = new V2()
        sum.arr = arr
        return sum
    }
    /**
     * @param {...V2} factors
     */
    static prod(...factors) {
        const arr = new Float32Array(2)
        for(let i = 0; i < factors.length; i++) {
            arr[0] *= factors[i].arr[0]
            arr[1] *= factors[i].arr[1]
        }
        const prod = new V2()
        prod.arr = arr
        return prod
    }

    //#endregion


    //#region Memory Mapping

    /**
     * @param {ArrayBuffer} arrayBuffer
     * @param {number} byteOffset
     */
    setArrayBuffer(arrayBuffer, byteOffset = 0){
        this.arr = new Float32Array(arrayBuffer, byteOffset, V2.ELEMENTS)
        return this
    }

    /**
     * @param {Float32Array} float32Array
     * @param {number} offset
     */
    setFloat32Array(float32Array, offset){
        this.arr = new Float32Array(
            float32Array.buffer,
            float32Array.byteOffset + offset*Float32Array.BYTES_PER_ELEMENT,
            V2.ELEMENTS
        )
        return this
    }

    //#endregion

    //#region Getters and Setters

    get x() {
        return this.arr[0]
    }
    /**
     * @param {number | Iterable<number>} val
     */
    set x(val) {
        const itr = val[Symbol.iterator]
        if(itr){
            this.arr[0] = itr().next().value
        }else{
            this.arr[0] = val
        }
    }
    get y() {
        return this.arr[1]
    }
    /**
     * @param {number | Iterable<number>} val
     */
    set y(val) {
        const itr = val[Symbol.iterator]
        if(itr){
            this.arr[1] = itr().next().value
        }else{
            this.arr[1] = val
        }
    }

    // Swizzling
    /**
     * Can be used as shorthand for {@link V2#copy()}.
     * @returns {V2}
     */
    get xy() {
        const v2 = new V2()
        v2.arr = new Float32Array(V2.ELEMENTS)
        v2.arr[0] = this.arr[0]
        v2.arr[1] = this.arr[1]
        return v2
    }
    /**
     * @param {V2 | Iterable<number> | number} arg
     */
    set xy(arg) {
        let x, y
        if(arg instanceof V2){
            x = arg.arr[0]
            y = arg.arr[1]
        }else if(typeof arg == "object" && Symbol.iterator in arg){
            const gen = arg[Symbol.iterator]()
            x = gen.next().value ?? this.arr[0]
            y = gen.next().value ?? this.arr[1]
        }else{
            x = arg
            y = arg
        }
        this.arr[0] = x
        this.arr[1] = y
    }
    get yx() {
        const v2 = new V2()
        v2.arr = new Float32Array(V2.ELEMENTS)
        v2.arr[0] = this.arr[1]
        v2.arr[1] = this.arr[0]
        return v2
    }
    /**
     * @param {V2 | Iterable<number> | number} arg
     */
    set yx(arg) {
        let y, x
        if(arg instanceof V2){
            y = arg.arr[0]
            x = arg.arr[1]
        }else if(typeof arg == "object" && Symbol.iterator in arg){
            const gen = arg[Symbol.iterator]()
            y = gen.next().value ?? this.arr[0]
            x = gen.next().value ?? this.arr[1]
        }else{
            y = arg
            x = arg
        }
        this.arr[1] = y
        this.arr[0] = x
    }

    // Polar
    get mag() {
        return Math.sqrt(this.arr[0]**2 + this.arr[1]**2)
    }
    /**
     * @param {number} mag
     */
    set mag(mag) {
        const factor = mag/Math.sqrt(this.arr[0]**2 + this.arr[1]**2)
        this.arr[0] *= factor
        this.arr[1] *= factor
    }
    get mag2() {
        return this.arr[0]**2 + this.arr[1]**2
    }
    /**
     * @param {number} mag2
     */
    set mag2(mag2) {
        const factor = Math.sqrt(mag2/(this.arr[0]**2 + this.arr[1]**2))
        this.arr[0] *= factor
        this.arr[1] *= factor
    }

    // Enables chaining
    /**
     */
    normalize() {
        const len = Math.sqrt(this.arr[0]**2 + this.arr[1]**2)
        if(len !== 0) {
            this.arr[0] /= len
            this.arr[1] /= len
        }
        return this
    }
    /**
     * @param {number} mag
     */
    setMag(mag) {
        const scale = mag / Math.sqrt(this.arr[0]**2 + this.arr[1]**2)
        if(scale != Infinity) {
            this.arr[0] *= scale
            this.arr[1] *= scale
        }
        return this
    }

    get angle() {
        return Math.atan2(this.arr[1], this.arr[0])
    }
    /**
     * @param {number} angle
     */
    set angle(angle) {
        const mag = Math.sqrt(this.arr[0]**2 + this.arr[1]**2)
        this.arr[0] = mag*Math.sin(angle)
        this.arr[1] = mag*Math.cos(angle)
    }

    //#endregion

    //#region Bulk Set

    /**
     * @param {...(V2 | Iterable | number)} args
     */
    set(...args){
        let x, y
        if(args.length == 1){
            const arg = args[0]
            if(arg instanceof V2){
                x = arg.arr[0]
                y = arg.arr[1]
            }else if(typeof arg == "object" && Symbol.iterator in arg){
                const gen = arg[Symbol.iterator]()
                x = gen.next().value ?? 0
                y = gen.next().value ?? 0
            }else {
                x = arg
                y = arg
            }
        }else if(args.length == 2){
            x = args[0]
            y = args[1]
        }else {
            throw new TypeError("Unsupported argument count")
        }
        this.arr[0] = x
        this.arr[1] = y
        return this
    }
    /**
     * @param {V2} v2
     */
    setVec(v2 = this) {
        this.arr[0] = v2.arr[0]
        this.arr[1] = v2.arr[1]
        return this
    }
    /**
     * @param {Iterable} itr
     */
    setItr(itr){
        const gen = itr[Symbol.iterator]()
        this.arr[0] = gen.next().value ?? this.arr[0]
        this.arr[1] = gen.next().value ?? this.arr[1]
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    setVals(x = this.arr[0], y = this.arr[1]) {
        this.arr[0] = x
        this.arr[1] = y
        return this
    }
    /**
     * @param {number} num
     */
    setNum(num = 0) {
        this.arr[0] = num
        this.arr[1] = num
        return this
    }

    //#endregion

    //#region Additional Properties

    /**
     */
    greatestComponent() {
        return Math.max(this.arr[0], this.arr[1])
    }
    /**
     */
    leastComponent() {
        return Math.min(this.arr[0], this.arr[1])
    }

    /**
     */
    isNaN() {
        return Number.isNaN(this.arr[0]) || Number.isNaN(this.arr[1])
    }

    /**
     * @param {V2} v2
     */
    equals(v2){
        return this.arr[0] == v2.arr[0] && this.arr[1] == v2.arr[1]
    }

    //#endregion


    /**
     * @returns {V2}
     */
    copy() {
        const v2 = new V2()
        v2.arr = new Float32Array(this.arr)
        return v2
    }


    // Mutating Operations

    //#region Basic Operators

    /**
     * @param {...VectorConstructionType} args
     */
    add(...args){
        const vec = V2.new(...args)
        this.arr[0] += vec.arr[0]
        this.arr[1] += vec.arr[1]
        return this
    }
    /**
     * @param {V2} addend
     */
    addVec(addend = V2.zero()) {
        this.arr[0] += addend.arr[0]
        this.arr[1] += addend.arr[1]
        return this
    }
    /**
     * @param {Iterable} addend
     */
    addItr(addend = [0, 0]) {
        const gen = addend[Symbol.iterator]()
        this.arr[0] += gen.next().value ?? 0
        this.arr[1] += gen.next().value ?? 0
        return this
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    addVals(x = 0, y = 0) {
        this.arr[0] += x
        this.arr[1] += y
        return this
    }
    /**
     * @param {number} addend
     */
    addNum(addend = 0) {
        this.arr[0] += addend
        this.arr[1] += addend
        return this
    }

    /**
     * @param {...VectorConstructionType} args
     */
    sub(...args){
        const vec = V2.new(...args)
        this.arr[0] -= vec.arr[0]
        this.arr[1] -= vec.arr[1]
        return this
    }
    /**
     * @param {V2} subtrahend
     */
    subVec(subtrahend = V2.zero()) {
        this.arr[0] -= subtrahend.arr[0]
        this.arr[1] -= subtrahend.arr[1]
        return this
    }
    /**
     * @param {Iterable} subtrahend
     */
    subItr(subtrahend = [0, 0]) {
        const gen = subtrahend[Symbol.iterator]()
        this.arr[0] -= gen.next().value ?? 0
        this.arr[1] -= gen.next().value ?? 0
        return this
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    subVals(x = 0, y = 0) {
        this.arr[0] -= x
        this.arr[1] -= y
        return this
    }
    /**
     * @param {number} subtrahend
     */
    subNum(subtrahend = 0) {
        this.arr[0] -= subtrahend
        this.arr[1] -= subtrahend
        return this
    }

    /**
     */
    negate() {
        this.arr[0] = -this.arr[0]
        this.arr[1] = -this.arr[1]
        return this
    }

    /**
     * @param {...VectorConstructionType} args
     */
    mult(...args){
        const vec = V2.new(...args)
        this.arr[0] *= vec.arr[0]
        this.arr[1] *= vec.arr[1]
        return this
    }
    /**
     * @param {V2} factor
     */
    multVec(factor = V2.one()) {
        this.arr[0] *= factor.arr[0]
        this.arr[1] *= factor.arr[1]
        return this
    }
    /**
     * @param {Iterable} factor
     */
    multItr(factor = [0, 0]) {
        const gen = factor[Symbol.iterator]()
        this.arr[0] *= gen.next().value ?? 0
        this.arr[1] *= gen.next().value ?? 0
        return this
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    multVals(x = 1, y = 1) {
        this.arr[0] *= x
        this.arr[1] *= y
        return this
    }
    /**
     * @param {number} factor
     */
    multNum(factor = 1) {
        this.arr[0] *= factor
        this.arr[1] *= factor
        return this
    }
    /**
     * @param {number} factor
     */
    scale(factor = 1) {
        this.arr[0] *= factor
        this.arr[1] *= factor
        return this
    }

    /**
     * @param {...VectorConstructionType} args
     */
    div(...args){
        const vec = V2.new(...args)
        this.arr[0] /= vec.arr[0]
        this.arr[1] /= vec.arr[1]
        return this
    }
    /**
     * @param {V2} divisor
     */
    divVec(divisor = V2.one()) {
        this.arr[0] /= divisor.arr[0]
        this.arr[1] /= divisor.arr[1]
        return this
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    divVals(x = 1, y = 1) {
        this.arr[0] /= x
        this.arr[1] /= y
        return this
    }
    /**
     * @param {number} divisor
     */
    divNum(divisor = 1) {
        this.arr[0] /= divisor
        this.arr[1] /= divisor
        return this
    }

    /**
     * @param {V2} vec
     * @param {number} scale
     */
    addScaled(vec, scale){
        this.arr[0] += scale * vec.arr[0]
        this.arr[1] += scale * vec.arr[1]
        return this
    }

    //#endregion

    //#region Linear Transformations

    /**
     * @param {number} angle
     */
    rotate(angle = 0) {
        const
            x = this.arr[0],
            y = this.arr[1],
            s = Math.sin(angle),
            c = Math.cos(angle)

        this.arr[0] = x*c - y*s
        this.arr[1] = x*s + y*c
        return this
    }
    /**
     */
    perp() {
        const oldX = this.arr[0]
        this.arr[0] = -this.arr[1]
        this.arr[1] = oldX
        return this
    }
    /**
     */
    antiPerp() {
        const oldX = this.arr[0]
        this.arr[0] = this.arr[1]
        this.arr[1] = -oldX
        return this
    }
    /**
     * @param {V2} axis
     * @param {number} scale
     */
    directionalScale(axis, scale = axis.arr[0]**2 + axis.arr[1]**2){
        const
            dot = this.arr[0]*axis.arr[0] + this.arr[1]*axis.arr[1],
            mag2 = axis.arr[0]**2 + axis.arr[1]**2,
            factor = (scale - 1) * dot / mag2

        this.arr[0] = this.arr[0] + factor * axis.arr[0]
        this.arr[1] = this.arr[1] + factor * axis.arr[1]

        return this
    }
    /**
     * @param {V2} axis
     */
    project(axis){
        const
            dot = this.arr[0]*axis.arr[0] + this.arr[1]*axis.arr[1],
            mag2 = axis.arr[0]**2 + axis.arr[1]**2,
            t = dot / mag2

        this.arr[0] = t * axis.arr[0]
        this.arr[1] = t * axis.arr[1]

        return this
    }
    /**
     * @param {V2} axis
     */
    reduce(axis){
        const
            dot = this.arr[0]*axis.arr[0] + this.arr[1]*axis.arr[1],
            mag2 = axis.arr[0]**2 + axis.arr[1]**2,
            factor = - dot / mag2

        this.arr[0] = this.arr[0] + factor * axis.arr[0]
        this.arr[1] = this.arr[1] + factor * axis.arr[1]

        return this

    }
    /**
     * @param {V2} axis
     */
    projectMag(axis){
        const
            dot = this.arr[0]*axis.arr[0] + this.arr[1]*axis.arr[1],
            mag = Math.sqrt(axis.arr[0]**2 + axis.arr[1]**2)

        return dot / mag
    }
    /**
     * @param {V2} v2
     */
    setInDirection(v2){
        const
            dot = this.arr[0] * v2.arr[0] + this.arr[1] * v2.arr[1],
            mag2 = v2.arr[0] ** 2 + v2.arr[1] ** 2,
            factor = 1 - dot / mag2

        this.arr[0] = this.arr[0] + factor * v2.arr[0]
        this.arr[1] = this.arr[1] + factor * v2.arr[1]

        return this
    }
    /**
     */
    swapComponents() {
        const origX = this.arr[0]
        this.arr[0] = this.arr[1]
        this.arr[1] = origX
        return this
    }

    /**
     * @param {V2} b
     * @param {number} t
     */
    lerp(b, t){
        this.arr[0] = this.arr[0] * (1 - t) + b.arr[0] * t
        this.arr[1] = this.arr[1] * (1 - t) + b.arr[1] * t
        return this
    }
    // /**
    //  * @param {M3} m3
    //  */
    // applyTransform(m3 = M3.identity()) {
    //     const
    //         b0 = this.arr[0],
    //         b1 = this.arr[1]
    //     this.arr[0] = m3.arr[0]*b0 + m3.arr[4]*b1 + m3.arr[8]
    //     this.arr[1] = m3.arr[1]*b0 + m3.arr[5]*b1 + m3.arr[9]
    //     return this
    // }
    // /**
    //  * @param {M3} m3
    //  */
    // applyTransformLinear(m3 = M3.identity()){
    //     const
    //         b0 = this.arr[0],
    //         b1 = this.arr[1]
    //     this.arr[0] = m3.arr[0]*b0 + m3.arr[4]*b1
    //     this.arr[1] = m3.arr[1]*b0 + m3.arr[5]*b1
    //     return this
    // }
    /**
     * @param {Transform} transform
     */
    applyTransform(transform) {
        const
            x = this.arr[0]
        this.arr[0] = transform.arr[0] * x + transform.arr[2] * this.arr[1] + transform.arr[4]
        this.arr[1] = transform.arr[1] * x + transform.arr[3] * this.arr[1] + transform.arr[5]
        return this
    }
    /**
     * @param {Transform} transform
     */
    applyTransformAffine(transform) {
        const
            x = this.arr[0]
        this.arr[0] = transform.arr[0] * x + transform.arr[2] * this.arr[1]
        this.arr[1] = transform.arr[1] * x + transform.arr[3] * this.arr[1]
        return this
    }

    //#endregion

    //#region Component Operations

    /**
     */
    floor(){
        this.arr[0] = Math.floor(this.arr[0])
        this.arr[1] = Math.floor(this.arr[1])
        return this
    }
    /**
     */
    abs() {
        this.arr[0] = Math.abs(this.arr[0])
        this.arr[1] = Math.abs(this.arr[1])
        return this
    }
    /**
     */
    invert() {
        this.arr[0] = 1/this.arr[0]
        this.arr[1] = 1/this.arr[1]
    }

    //#endregion

    //#region Polar

    /**
     * Mutates vector.
     */
    toPolar() {
        this.arr[0] = Math.sqrt(this.arr[0]**2 + this.arr[1]**2)
        this.arr[1] = Math.atan2(this.arr[1], this.arr[0])
        return this
    }
    /**
     * Mutates vector.
     */
    fromPolar() {
        this.arr[0] = this.arr[0]*Math.cos(this.arr[1])
        this.arr[1] = this.arr[0]*Math.sin(this.arr[1])
        return this
    }

    //#endregion


    //#region Vector Products

    /**
     * @param {...VectorConstructionType} args
     */
    dot(...args){
        const vec = V2.new(...args)
        return this.arr[0]*vec.arr[0] + this.arr[1]*vec.arr[1]
    }
    /**
     * @param {V2} v2
     */
    dotVec(v2 = this) {
        return this.arr[0]*v2.arr[0] + this.arr[1]*v2.arr[1]
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    dotVals(x = this.arr[0], y = this.arr[1]) {
        return this.arr[0]*x + this.arr[1]*y
    }

    /**
     * @param {...VectorConstructionType} args
     */
    cross(...args){
        const vec = V2.new(...args)
        return this.arr[0]*vec.arr[1] - this.arr[1]*vec.arr[0]
    }
    /**
     * @param {V2} v2
     */
    crossVec(v2 = this) {
        return this.arr[0]*v2.arr[1] - this.arr[1]*v2.arr[0]
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    crossVals(x = this.arr[0], y = this.arr[1]) {
        return this.arr[0]*y - this.arr[1]*x
    }

    //#endregion

    //#region relative calculations

    /**
     * @param {V2} vec
     */
    distance(vec) {
        return Math.sqrt((this.arr[0] - vec.arr[0])**2 + (this.arr[1] - vec.arr[1])**2)
    }
    /**
     * @param {V2} vec
     */
    distance2(vec){
        return (this.arr[0] - vec.arr[0])**2 + (this.arr[1] - vec.arr[1])**2
    }
    /**
     * @param {V2} vec
     */
    angleTo(vec){
        const
            x = vec.arr[0] * this.arr[0] + vec.arr[1] * this.arr[1],
            y = - vec.arr[0] * this.arr[1] + vec.arr[1] * this.arr[0]
        return Math.atan2(y, x)
    }

    //#endregion

    /**
     */
    toString() {
        return `(${this.arr[0]}, ${this.arr[1]})`
    }

    /**
     * @yields {number}
     */
    *[Symbol.iterator]() {
        yield this.arr[0]
        yield this.arr[1]
    }
}

window["V2" + ""] = V2 // Prevents IDE from confusing the globally defined version with the module version