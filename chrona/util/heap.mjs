/**
 * @template T
 */
class Heap {
    /**
     * @param {(function(a: T, b: T): number)?} comparator Positive value indicates that a should come after b. Defaults to ascending numeric order.
     */
    constructor(comparator = (a, b) => a - b) {
        this.compareFn = comparator

        /** @type {Array<T>} */
        this.values = []
    }

    /**
     * @param {...T} values
     */
    push(...values) {
        for(const value of values) {
            let index = this.values.length
            this.values.push(value)

            while (index > 0) {
                const
                    parentIndex = Heap.#parent(index),
                    parent = this.values[parentIndex]
                if (this.compareFn(parent, value) <= 0) break

                this.values[index] = parent
                index = parentIndex
            }
            this.values[index] = value
        }

        return this
    }

    /**
     */
    peek() {
        return /** @type {T | undefined} */ this.values[0]
    }

    /**
     */
    pop() {
        if(this.values.length == 0) return undefined

        const last = this.values.pop()

        if(this.values.length == 0) return last

        const root = this.values[0]
        let index = 0

        while(Heap.#childA(index) < this.values.length){
            const
                childAIndex = Heap.#childA(index),
                childBIndex = Heap.#childB(index)
            let lesserIndex
            if(
                childBIndex < this.values.length &&
                this.compareFn(this.values[childAIndex], this.values[childBIndex]) >= 0
            ){
                lesserIndex = childBIndex
            }else{
                lesserIndex = childAIndex
            }
            const lesserChild = this.values[lesserIndex]

            if(this.compareFn(last, lesserChild) <= 0) break

            this.values[index] = lesserChild
            index = lesserIndex
        }

        this.values[index] = last

        return root
    }

    /**
     */
    clear(){
        this.values.length = 0
    }

    /**
     */
    get size() {
        return this.values.length
    }

    /**
     * @param {number} index
     */
    static #childA(index) {
        return 2 * index + 1
    }
    /**
     * @param {number} index
     */
    static #childB(index) {
        return 2 * index + 2
    }
    /**
     * @param {number} index
     */
    static #parent(index) {
        return Math.floor((index - 1) / 2)
    }
}

export {Heap}