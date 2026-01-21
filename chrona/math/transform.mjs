import V2 from "./v2.mjs"

export default class Transform {
    /** @type {Float32Array} */
    arr
    /** @type {V2} */
    a
    /** @type {V2} */
    b
    /** @type {V2} */
    p

    //#region Constants

    static DIMENSION = 2
    static ELEMENTS = (1 + Transform.DIMENSION) * Transform.DIMENSION
    static BYTES_PER_ELEMENT = Float32Array.BYTES_PER_ELEMENT
    static BYTE_LENGTH = Transform.ELEMENTS * Transform.BYTES_PER_ELEMENT

    //#endregion


    //#region Constructors

    /**
     * @param {...(number | V2 | Transform | Iterable | Generator<number> | ArrayBuffer | Float32Array)} args
     */
    static new(...args){
        if(args[0] instanceof Object){
            if(args[0] instanceof V2){
                switch(args.length){
                    case 1:
                        return Transform.translation(args[0])
                    case 2:
                        return Transform.orthogonal(args[0], args[1])
                    case 3:
                        return Transform.fromVecs(args[0], args[1], args[2])
                }
            }else if(args[0] instanceof Transform){
                return Transform.fromTransform(args[0])
            }else if(args[0] instanceof ArrayBuffer){
                return Transform.fromArrayBuffer(args[0], args[1])
            }else if(args[0] instanceof Float32Array){
                return Transform.fromFloat32Array(args[0], args[1])
            }else if(Symbol.iterator in args[0]){
                return Transform.fromIterable(args[0], args[1])
            }else if(typeof args[0].next == "function"){
                return Transform.fromGenerator(args[0])
            }
        }else{
            switch(args.length){
                case 0:
                    return Transform.identity()
                case 2:
                    return Transform.translationVals(args[0], args[1])
                case 4:
                    return Transform.orthogonalVals(args[0], args[1], args[2], args[3])
                case 6:
                    return Transform.fromVals(
                        args[0], args[1],
                        args[2], args[3],
                        args[4], args[5],
                    )
            }
        }
    }
    /**
     * Keeps reference
     * @param {ArrayBuffer} arrayBuffer
     * @param {number} byteOffset
     */
    static fromArrayBuffer(arrayBuffer = new ArrayBuffer(Transform.BYTE_LENGTH), byteOffset = 0){
        const transform = new Transform()
        transform.arr = new Float32Array(arrayBuffer, byteOffset, Transform.ELEMENTS)
        transform.a = V2.fromFloat32Array(transform.arr, 0)
        transform.b = V2.fromFloat32Array(transform.arr, 2)
        transform.p = V2.fromFloat32Array(transform.arr, 4)
        return transform
    }
    /**
     * Keeps reference
     * @param {Float32Array} float32Array
     * @param {number} offset
     */
    static fromFloat32Array(float32Array = new Float32Array(Transform.ELEMENTS), offset = 0){
        const transform = new Transform()
        transform.arr = new Float32Array(
            float32Array.buffer,
            float32Array.byteOffset + offset*Float32Array.BYTES_PER_ELEMENT,
            Transform.ELEMENTS
        )
        transform.a = V2.fromFloat32Array(transform.arr, 0)
        transform.b = V2.fromFloat32Array(transform.arr, 2)
        transform.p = V2.fromFloat32Array(transform.arr, 4)
        return transform
    }

    /**
     * @param {number} ax
     * @param {number} ay
     * @param {number} bx
     * @param {number} by
     * @param {number} px
     * @param {number} py
     */
    static fromVals(
        ax = 1, ay = 0,
        bx = 0, by = 1,
        px = 0, py = 0,
    ){
        const
            transform = new Transform(),
            arr = new Float32Array(Transform.ELEMENTS)
        arr[0] = ax
        arr[1] = ay
        arr[2] = bx
        arr[3] = by
        arr[4] = px
        arr[5] = py
        transform.arr = arr
        transform.a = V2.fromFloat32Array(transform.arr, 0)
        transform.b = V2.fromFloat32Array(transform.arr, 2)
        transform.p = V2.fromFloat32Array(transform.arr, 4)
        return transform
    }
    /**
     * Creates new Float32Array.
     * @param {V2} a
     * @param {V2} b
     * @param {V2} p
     */
    static fromVecs(a = V2.i(), b = V2.j(), p = V2.zero()){
        return Transform.fromVals(
            a.arr[0], a.arr[1],
            b.arr[0], b.arr[1],
            p.arr[0], p.arr[1],
        )
    }
    /**
     * Creates new Float32Array.
     * @param {Transform} transform
     */
    static fromTransform(transform){
        return Transform.fromVals(
            transform.arr[0], transform.arr[1],
            transform.arr[2], transform.arr[3],
            transform.arr[4], transform.arr[5],
        )
    }

    /**
     * @param {Generator<number>} gen
     */
    static fromGenerator(gen){
        return Transform.fromVals(
            gen.next().value, gen.next().value,
            gen.next().value, gen.next().value,
            gen.next().value, gen.next().value,
        )
    }
    /**
     * @param {Iterable<number>} iterable
     * @param {number} offset
     */
    static fromIterable(iterable = [], offset = 0){
        const gen = iterable[Symbol.iterator]()
        for(let i = 0; i < offset; i++){
            gen.next()
        }
        return Transform.fromVals(
            gen.next().value, gen.next().value,
            gen.next().value, gen.next().value,
            gen.next().value, gen.next().value,
        )
    }

    /**
     * This should be called in the constructor of all subclasses.
     */
    init(){
        this.arr = new Float32Array(Transform.ELEMENTS)
        this.a = V2.fromFloat32Array(this.arr, 0)
        this.b = V2.fromFloat32Array(this.arr, 2)
        this.p = V2.fromFloat32Array(this.arr, 4)
    }

    //#endregion

    //#region Transform Constructors

    /**
     */
    static zero(){
        const transform = new Transform()
        transform.arr = new Float32Array(Transform.ELEMENTS)
        transform.a = V2.fromFloat32Array(transform.arr, 0)
        transform.b = V2.fromFloat32Array(transform.arr, 2)
        transform.p = V2.fromFloat32Array(transform.arr, 4)
        return transform
    }
    /**
     */
    static identity(){
        return Transform.fromVals(
            1, 0,
            0, 1,
            0, 0,
        )
    }

    /**
     * @param {V2} v2
     */
    static translate(v2 = V2.zero()){
        return Transform.fromVals(
            1, 0,
            0, 1,
            v2.arr[0], v2.arr[1],
        )
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    static translateVals(x = 0, y = 0){
        return Transform.fromVals(
            1, 0,
            0, 1,
            x, y,
        )
    }

    /**
     * @param {number} angle
     * @param {V2} center
     */
    static rotate(angle = 0, center = V2.zero()){
        const
            s = Math.sin(angle),
            c = Math.cos(angle)
        return Transform.fromVals(
            c, s,
            -s, c,
            -c * center.arr[0] + s * center.arr[1] + center.arr[0],
            -s * center.arr[0] - c * center.arr[1] + center.arr[1],
        )
    }
    /**
     * @param {number} angle
     */
    static originRotate(angle = 0){
        const
            s = Math.sin(angle),
            c = Math.cos(angle)
        return Transform.fromVals(
            c, s,
            -s, c,
            0, 0,
        )
    }

    /**
     * @param {number} factor
     * @param {V2} center
     */
    static scale(factor = 1, center = V2.zero()){
        return Transform.fromVals(
            factor, 0,
            0, factor,
            -center.arr[0] * factor + center.arr[0],
            -center.arr[1] * factor + center.arr[1],
        )
    }
    /**
     * @param {number} factor
     */
    static originScale(factor = 1){
        return Transform.fromVals(
            factor, 0,
            0, factor,
            0, 0,
        )
    }

    /**
     * @param {V2} axis
     * @param {number} factor
     * @param {V2} center
     */
    static directionalScale(axis, factor = 1, center = V2.zero()){
        const multiplier = (factor - 1) / (axis.arr[0] ** 2 + axis.arr[1] ** 2)
        return Transform.fromVals(
            multiplier * axis.arr[0] * axis.arr[0] + 1,
            multiplier * axis.arr[1] * axis.arr[0],
            multiplier * axis.arr[0] * axis.arr[1],
            multiplier * axis.arr[1] * axis.arr[1] + 1,
            -multiplier * axis.arr[0] * (axis.arr[0] * center.arr[0] + axis.arr[1] * center.arr[1]),
            -multiplier * axis.arr[1] * (axis.arr[0] * center.arr[0] + axis.arr[1] * center.arr[1]),
        )
    }
    /**
     * @param {V2} axis
     * @param {number} factor
     */
    static originDirectionalScale(axis, factor = 1){
        const multiplier = (factor - 1) / (axis.arr[0] ** 2 + axis.arr[1] ** 2)
        return Transform.fromVals(
            multiplier * axis.arr[0] * axis.arr[0] + 1,
            multiplier * axis.arr[1] * axis.arr[0],
            multiplier * axis.arr[0] * axis.arr[1],
            multiplier * axis.arr[1] * axis.arr[1] + 1,
            0, 0,
        )
    }

    /**
     * @param {V2} primaryAxis
     * @param {V2} origin
     */
    static orthogonal(primaryAxis = V2.i(), origin = V2.zero()){
        return Transform.fromVals(
            primaryAxis.arr[0], primaryAxis.arr[1],
            -primaryAxis.arr[1], primaryAxis.arr[0],
            origin.arr[0], origin.arr[1],
        )
    }
    /**
     * @param {number} primaryAxisX
     * @param {number} primaryAxisY
     * @param {number} originX
     * @param {number} originY
     */
    static orthogonalVals(
        primaryAxisX = 1, primaryAxisY = 0,
        originX = 0, originY = 0,
    ){
        return Transform.fromVals(
            primaryAxisX, primaryAxisY,
            -primaryAxisY, primaryAxisX,
            originX, originY,
        )
    }
    /**
     * @param {V2} primaryAxis
     */
    static originOrthogonal(primaryAxis = V2.i()){
        return Transform.fromVals(
            primaryAxis.arr[0], primaryAxis.arr[1],
            -primaryAxis.arr[1], primaryAxis.arr[0],
            0, 0,
        )
    }
    /**
     * @param {number} primaryAxisX
     * @param {number} primaryAxisY
     */
    static originOrthogonalVals(primaryAxisX, primaryAxisY){
        return Transform.fromVals(
            primaryAxisX, primaryAxisY,
            -primaryAxisY, primaryAxisX,
            0, 0,
        )
    }

    //#endregion

    //#region Constructors from Operations

    /**
     * @param {...Transform} addends
     */
    static sum(...addends){
        const sum = Transform.zero()
        for(let i = 0; i < addends.length; i++){
            sum.arr[0] += addends[i].arr[0]
            sum.arr[1] += addends[i].arr[1]
            sum.arr[2] += addends[i].arr[2]
            sum.arr[3] += addends[i].arr[3]
            sum.arr[4] += addends[i].arr[4]
            sum.arr[5] += addends[i].arr[5]
        }
        return sum
    }

    /**
     * @param {...Transform} transformations
     */
    static compose(...transformations){
        const transform = Transform.identity()
        for(let i = 0; i < transformations.length; i++){
            transform.append(transformations[i])
        }
        return transform
    }

    /**
     * @param {Transform} a
     * @param {Transform} b
     * @param {number} t
     * @param {Transform} dst
     */
    static lerp(a = Transform.zero(), b = a, t = 0, dst = Transform.zero()){
        dst.setVals(
            a.arr[0] * (1 - t) + b.arr[0] * t,
            a.arr[1] * (1 - t) + b.arr[1] * t,
            a.arr[2] * (1 - t) + b.arr[2] * t,
            a.arr[3] * (1 - t) + b.arr[3] * t,
            a.arr[4] * (1 - t) + b.arr[4] * t,
            a.arr[5] * (1 - t) + b.arr[5] * t,
        )
        return dst
    }

    //#endregion


    //#region Memory Mapping

    /**
     * @param {ArrayBuffer} arrayBuffer
     * @param {number} byteOffset
     */
    setArrayBuffer(arrayBuffer, byteOffset = 0){
        this.arr = new Float32Array(arrayBuffer, byteOffset, Transform.ELEMENTS)
        this.a = this.a.setFloat32Array(this.arr, 0)
        this.b = this.b.setFloat32Array(this.arr, 2)
        this.p = this.p.setFloat32Array(this.arr, 4)
        return this
    }

    /**
     * @param {Float32Array} float32Array
     * @param {number} offset
     */
    setFloatArray(float32Array, offset = 0){
        this.arr = new Float32Array(
            float32Array.buffer,
            float32Array.byteOffset + offset*Float32Array.BYTES_PER_ELEMENT,
            Transform.ELEMENTS
        )
        this.a = this.a.setFloat32Array(this.arr, 0)
        this.b = this.b.setFloat32Array(this.arr, 2)
        this.p = this.p.setFloat32Array(this.arr, 4)
        return this
    }

    //#endregion

    //#region Getters and Setters

    /**
     */
    get det(){
        return this.arr[0] * this.arr[3] - this.arr[1] * this.arr[2]
    }

    /**
     * @param {number} det
     */
    set det(det){
        const factor = Math.sqrt(det / (this.arr[0] * this.arr[3] - this.arr[1] * this.arr[2]))
        this.arr[0] *= factor
        this.arr[1] *= factor
        this.arr[2] *= factor
        this.arr[3] *= factor
    }

    // Enables Chaining
    /**
     * @param {number} det
     * @param {V2} center
     */
    setDet(det, center = this.p){
        const factor = Math.sqrt(det / (this.arr[0] * this.arr[3] - this.arr[1] * this.arr[2]))
        this.arr[0] *= factor
        this.arr[1] *= factor
        this.arr[2] *= factor
        this.arr[3] *= factor
        this.arr[4] = (this.arr[4] - center.arr[0]) * factor + center.arr[0]
        this.arr[5] = (this.arr[5] - center.arr[1]) * factor + center.arr[1]
        return this
    }

    //#endregion

    //#region Bulk Setting

    /**
     * @param {Transform} transform
     */
    set(transform = this){
        this.arr[0] = transform.arr[0]
        this.arr[1] = transform.arr[1]
        this.arr[2] = transform.arr[2]
        this.arr[3] = transform.arr[3]
        this.arr[4] = transform.arr[4]
        this.arr[5] = transform.arr[5]

        return this
    }
    /**
     * @param {number} ax
     * @param {number} ay
     * @param {number} bx
     * @param {number} by
     * @param {number} px
     * @param {number} py
     */
    setVals(
        ax = this.arr[0], ay = this.arr[1],
        bx = this.arr[2], by = this.arr[3],
        px = this.arr[4], py = this.arr[5],
    ){
        this.arr[0] = ax
        this.arr[1] = ay
        this.arr[2] = bx
        this.arr[3] = by
        this.arr[4] = px
        this.arr[5] = py

        return this
    }

    /**
     * @param {V2} a
     * @param {V2} b
     */
    setAffine(a = this.a, b = this.b){
        this.arr[0] = a.arr[0]
        this.arr[1] = a.arr[1]
        this.arr[2] = b.arr[0]
        this.arr[3] = b.arr[1]

        return this
    }
    /**
     * @param {number} ax
     * @param {number} ay
     * @param {number} bx
     * @param {number} by
     */
    setAffineVals(
        ax = this.arr[0], ay = this.arr[1],
        bx = this.arr[2], by = this.arr[3],
    ){
        this.arr[0] = ax
        this.arr[1] = ay
        this.arr[2] = bx
        this.arr[3] = by

        return this
    }

    /**
     * @param {V2} v2
     */
    setTranslation(v2 = this.p){
        this.arr[4] = v2.arr[0]
        this.arr[5] = v2.arr[1]

        return this
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    setTranslationVals(x, y){
        this.arr[4] = x
        this.arr[5] = y

        return this
    }

    //#endregion


    /**
     */
    copy() {
        return Transform.fromVals(
            this.arr[0], this.arr[1],
            this.arr[2], this.arr[3],
            this.arr[4], this.arr[5],
        )
    }


    //#region Vector Operations

    /**
     * @param {number} x
     * @param {number} y
     * @param {V2} dst
     */
    applyVals(x, y, dst = V2.zero()){
        dst.arr[0] = this.arr[0] * x + this.arr[2] * y + this.arr[4]
        dst.arr[1] = this.arr[1] * x + this.arr[3] * y + this.arr[5]
        return dst
    }
    /**
     * @param {V2} v2
     * @param {V2} dst
     */
    applyVec(v2, dst = v2){
        const x = v2.arr[0]
        dst.arr[0] = this.arr[0] * x + this.arr[2] * v2.arr[1] + this.arr[4]
        dst.arr[1] = this.arr[1] * x + this.arr[3] * v2.arr[1] + this.arr[5]
        return dst
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {V2} dst
     */
    applyAffineVals(x, y, dst = V2.zero()){
        dst.arr[0] = this.arr[0] * x + this.arr[2] * y
        dst.arr[1] = this.arr[1] * x + this.arr[3] * y
        return dst
    }
    /**
     * @param {V2} v2
     * @param {V2} dst
     */
    applyAffineVec(v2, dst = v2){
        const x = v2.arr[0]
        dst.arr[0] = this.arr[0] * x + this.arr[2] * v2.arr[1]
        dst.arr[1] = this.arr[1] * x + this.arr[3] * v2.arr[1]
        return dst
    }

    //#endregion

    //#region Transform Operations

    /**
     * @param {Transform} transform
     */
    add(transform = Transform.zero()){
        this.arr[0] += transform.arr[0]
        this.arr[1] += transform.arr[1]
        this.arr[2] += transform.arr[2]
        this.arr[3] += transform.arr[3]
        this.arr[4] += transform.arr[4]
        this.arr[5] += transform.arr[5]

        return this
    }
    /**
     * @param {Transform} transform
     * @param {number} scale
     */
    addScaled(transform = Transform.zero(), scale = 0){
        this.arr[0] += scale * transform.arr[0]
        this.arr[1] += scale * transform.arr[1]
        this.arr[2] += scale * transform.arr[2]
        this.arr[3] += scale * transform.arr[3]
        this.arr[4] += scale * transform.arr[4]
        this.arr[5] += scale * transform.arr[5]

        return this
    }

    /**
     * @param {Transform} transform
     */
    sub(transform = Transform.zero()){
        this.arr[0] -= transform.arr[0]
        this.arr[1] -= transform.arr[1]
        this.arr[2] -= transform.arr[2]
        this.arr[3] -= transform.arr[3]
        this.arr[4] -= transform.arr[4]
        this.arr[5] -= transform.arr[5]

        return this
    }

    /**
     * @param {Transform} transform
     * @param {number} t
     */
    lerp(transform = this, t = 0){
        this.arr[0] = this.arr[0] * (1 - t) + transform.arr[0] * t
        this.arr[1] = this.arr[1] * (1 - t) + transform.arr[1] * t
        this.arr[2] = this.arr[2] * (1 - t) + transform.arr[2] * t
        this.arr[3] = this.arr[3] * (1 - t) + transform.arr[3] * t
        this.arr[4] = this.arr[4] * (1 - t) + transform.arr[4] * t
        this.arr[5] = this.arr[5] * (1 - t) + transform.arr[5] * t

        return this
    }

    /**
     * @param {Transform} transform
     */
    append(transform = Transform.identity()){
        this.setVals(
            this.arr[0] * transform.arr[0] + this.arr[1] * transform.arr[2],
            this.arr[0] * transform.arr[1] + this.arr[1] * transform.arr[3],
            this.arr[2] * transform.arr[0] + this.arr[3] * transform.arr[2],
            this.arr[2] * transform.arr[1] + this.arr[3] * transform.arr[3],
            this.arr[4] * transform.arr[0] + this.arr[5] * transform.arr[2] + transform.arr[4],
            this.arr[4] * transform.arr[1] + this.arr[5] * transform.arr[3] + transform.arr[5],
        )

        return this
    }
    /**
     * @param {V2} a
     * @param {V2} b
     * @param {V2} p
     */
    appendVecs(a, b, p){
        this.setVals(
            this.arr[0] * a.arr[0] + this.arr[1] * b.arr[0],
            this.arr[0] * a.arr[1] + this.arr[1] * b.arr[1],
            this.arr[2] * a.arr[0] + this.arr[3] * b.arr[0],
            this.arr[2] * a.arr[1] + this.arr[3] * b.arr[1],
            this.arr[4] * a.arr[0] + this.arr[5] * b.arr[0] + p.arr[0],
            this.arr[4] * a.arr[1] + this.arr[5] * b.arr[1] + p.arr[1],
        )

        return this
    }
    /**
     * @param {number} ax
     * @param {number} ay
     * @param {number} bx
     * @param {number} by
     * @param {number} px
     * @param {number} py
     */
    appendVals(
        ax, ay,
        bx, by,
        px, py,
    ){
        this.setVals(
            this.arr[0] * ax + this.arr[1] * bx,
            this.arr[0] * ay + this.arr[1] * by,
            this.arr[2] * ax + this.arr[3] * bx,
            this.arr[2] * ay + this.arr[3] * by,
            this.arr[4] * ax + this.arr[5] * bx + px,
            this.arr[4] * ay + this.arr[5] * by + py,
        )

        return this
    }

    /**
     * @param {V2} a
     * @param {V2} b
     */
    appendAffine(a, b){
        this.setVals(
            this.arr[0] * a.arr[0] + this.arr[1] * b.arr[0],
            this.arr[0] * a.arr[1] + this.arr[1] * b.arr[1],
            this.arr[2] * a.arr[0] + this.arr[3] * b.arr[0],
            this.arr[2] * a.arr[1] + this.arr[3] * b.arr[1],
            this.arr[4] * a.arr[0] + this.arr[5] * b.arr[0],
            this.arr[4] * a.arr[1] + this.arr[5] * b.arr[1],
        )

        return this
    }
    /**
     * @param {number} ax
     * @param {number} ay
     * @param {number} bx
     * @param {number} by
     */
    appendAffineVals(
        ax, ay,
        bx, by,
    ){
        this.setVals(
            this.arr[0] * ax + this.arr[1] * bx,
            this.arr[0] * ay + this.arr[1] * by,
            this.arr[2] * ax + this.arr[3] * bx,
            this.arr[2] * ay + this.arr[3] * by,
            this.arr[4] * ax + this.arr[5] * bx,
            this.arr[4] * ay + this.arr[5] * by,
        )

        return this
    }
    /**
     * @param {V2} a
     * @param {V2} b
     * @param {V2} center
     */
    appendAffineOffset(a, b, center){
        this.setVals(
            this.arr[0] * a.arr[0] + this.arr[1] * b.arr[0],
            this.arr[0] * a.arr[1] + this.arr[1] * b.arr[1],
            this.arr[2] * a.arr[0] + this.arr[3] * b.arr[0],
            this.arr[2] * a.arr[1] + this.arr[3] * b.arr[1],
            (this.arr[4] - center.arr[0]) * a.arr[0] + (this.arr[5] - center.arr[1]) * b.arr[0] + center.arr[0],
            (this.arr[4] - center.arr[0]) * a.arr[1] + (this.arr[5] - center.arr[1]) * b.arr[1] + center.arr[1],
        )

        return this
    }
    /**
     * @param {number} ax
     * @param {number} ay
     * @param {number} bx
     * @param {number} by
     * @param {number} centerX
     * @param {number} centerY
     */
    appendAffineOffsetVals(
        ax, ay,
        bx, by,
        centerX, centerY,
    ){
        this.setVals(
            this.arr[0] * ax + this.arr[1] * bx,
            this.arr[0] * ay + this.arr[1] * by,
            this.arr[2] * ax + this.arr[3] * bx,
            this.arr[2] * ay + this.arr[3] * by,
            (this.arr[4] - centerX) * ax + (this.arr[5] - centerY) * bx + centerX,
            (this.arr[4] - centerX) * ay + (this.arr[5] - centerY) * by + centerY,
        )

        return this
    }

    //#endregion

    //#region Transform Operations

    /**
     */
    zero(){
        this.arr[0] = 0
        this.arr[1] = 0
        this.arr[2] = 0
        this.arr[3] = 0
        this.arr[4] = 0
        this.arr[5] = 0

        return this
    }

    /**
     * @param {V2} v2
     */
    translate(v2){
        this.arr[4] += v2.arr[0]
        this.arr[5] += v2.arr[1]

        return this
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    translateVals(x, y){
        this.arr[4] += x
        this.arr[5] += y

        return this
    }

    /**
     * @param {number} angle
     * @param {V2} center
     */
    rotate(angle = 0, center = V2.zero()){
        const
            s = Math.sin(angle),
            c = Math.cos(angle)

        this.setVals(
            c * this.arr[0] - s * this.arr[1],
            s * this.arr[0] + c * this.arr[1],
            c * this.arr[2] - s * this.arr[3],
            s * this.arr[2] + c * this.arr[3],
            c * (this.arr[4] - center.arr[0]) - s * (this.arr[5] - center.arr[1]) + center.arr[0],
            s * (this.arr[4] - center.arr[0]) + c * (this.arr[5] - center.arr[1]) + center.arr[1],
        )

        return this
    }
    /**
     * @param {number} angle
     */
    originRotate(angle = 0){
        const
            s = Math.sin(angle),
            c = Math.cos(angle)

        this.setVals(
            c * this.arr[0] - s * this.arr[1],
            s * this.arr[0] + c * this.arr[1],
            c * this.arr[2] - s * this.arr[3],
            s * this.arr[2] + c * this.arr[3],
            c * this.arr[4] - s * this.arr[5],
            s * this.arr[4] + c * this.arr[5],
        )

        return this
    }

    /**
     * @param {number} factor
     * @param {V2} center
     */
    scale(factor = 1, center = V2.zero()){
        this.arr[0] *= factor
        this.arr[1] *= factor
        this.arr[2] *= factor
        this.arr[3] *= factor
        this.arr[4] = (this.arr[4] - center.arr[0]) * factor + center.arr[0]
        this.arr[5] = (this.arr[5] - center.arr[1]) * factor + center.arr[1]

        return this
    }
    /**
     * @param {number} factor
     */
    originScale(factor = 1){
        this.arr[0] *= factor
        this.arr[1] *= factor
        this.arr[2] *= factor
        this.arr[3] *= factor
        this.arr[4] *= factor
        this.arr[5] *= factor

        return this
    }

    /**
     * @param {V2} axis
     * @param {number} factor
     * @param {V2} center
     */
    directionalScale(axis, factor = 1, center = V2.zero()){
        const multiplier = (factor - 1) / (axis.arr[0] ** 2 + axis.arr[1] ** 2)
        this.appendAffineOffsetVals(
            multiplier * axis.arr[0] * axis.arr[0] + 1,
            multiplier * axis.arr[1] * axis.arr[0],
            multiplier * axis.arr[0] * axis.arr[1],
            multiplier * axis.arr[1] * axis.arr[1] + 1,
            center.arr[0], center.arr[1],
        )

        return this
    }
    /**
     * @param {V2} axis
     * @param {number} factor
     */
    originDirectionalScale(axis, factor = 1){
        const multiplier = (factor - 1) / (axis.arr[0] ** 2 + axis.arr[1] ** 2)
        this.appendAffineVals(
            multiplier * axis.arr[0] * axis.arr[0] + 1,
            multiplier * axis.arr[1] * axis.arr[0],
            multiplier * axis.arr[0] * axis.arr[1],
            multiplier * axis.arr[1] * axis.arr[1] + 1,
        )

        return this
    }

    /**
     * @param {V2} primaryAxis
     * @param {V2} origin
     */
    orthogonal(primaryAxis = V2.i(), origin = V2.zero()){
        this.appendAffineOffsetVals(
            primaryAxis.arr[0], primaryAxis.arr[1],
            -primaryAxis.arr[1], primaryAxis.arr[0],
            origin.arr[0], origin.arr[1],
        )

        return this
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} originX
     * @param {number} originY
     */
    orthogonalVals(x = 1, y = 0, originX = 0, originY = 0){
        this.appendAffineOffsetVals(
            x, y,
            -y, x,
            originX, originY,
        )

        return this
    }
    /**
     * @param {V2} primaryAxis
     */
    originOrthogonal(primaryAxis = V2.i()){
        this.appendAffineVals(
            primaryAxis.arr[0], primaryAxis.arr[1],
            -primaryAxis.arr[1], primaryAxis.arr[0],
        )

        return this
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    originOrthogonalVals(x = 1, y = 0){
        this.appendAffineVals(
            x, y,
            -y, x,
        )

        return this
    }


    //#endregion

    //#region Additional Operations

    /**
     */
    invert() {
        const
            ax = this.arr[0],
            ay = this.arr[1],
            bx = this.arr[2],
            by = this.arr[3],
            px = this.arr[4],
            py = this.arr[5],

            invDet = 1 / (ax * by - ay * bx),

            iax =  by * invDet,
            iay = -ay * invDet,
            ibx = -bx * invDet,
            iby =  ax * invDet

        this.setVals(
            iax, iay,
            ibx, iby,
            -(iax * px + ibx * py),
            -(iay * px + iby * py),
        )

        return this
    }

    //#endregion

    /**
     */
    toString() {
        return `Transform(${this.arr[0]}, ${this.arr[1]}, ${this.arr[2]}, ${this.arr[3]}, ${this.arr[4]}, ${this.arr[5]})`
    }

    /**
     */
    toStringPretty(){
        return `Transform(\n\t${this.arr[0]}, ${this.arr[1]},\n\t${this.arr[2]}, ${this.arr[3]},\n\t${this.arr[4]}, ${this.arr[5]}\n)`
    }

    /**
     * @yields {number}
     */
    *[Symbol.iterator]() {
        yield this.arr[0]
        yield this.arr[1]
        yield this.arr[2]
        yield this.arr[3]
        yield this.arr[4]
        yield this.arr[5]
    }
}

window["Transform" + ""] = Transform // Prevents IDE from confusing the globally defined version with the module version