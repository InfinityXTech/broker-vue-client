
export function Sum() {
    return {
        initial: 0,
        add(prev: any, value: any) {
            return prev + (value ?? 0)
        }
    }
}

export function Avg() {
    return {
        initial: {
            sum: 0,
            count: 0
        },
        add(state: any, value: any) {
            state.sum += (value ?? 0)
            state.count++
            return state
        },
        finalize(state: any) {
            return state.sum / state.count
        }
    }
}