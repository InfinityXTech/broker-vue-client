
interface KeyboardHandlers {
    escape(): void
    enter(): void
}

interface KeyboardInstance {
    handlers: KeyboardHandlers
    enabled: boolean
    unmount(): void
}

let instances: KeyboardInstance[]

function handleKeydown(ev: KeyboardEvent) {
    if (ev.key == 'Escape' || ev.key == 'Esc') {
        for (const i in instances) {
            if (instances[i].enabled) {
                return instances[i].handlers.escape()
            }
        }
    }
    if (ev.key == 'Enter') {
        for (const i in instances) {
            if (instances[i].enabled) {
                return instances[i].handlers.enter()
            }
        }
    }
}

export function useKeyboard(handlers: KeyboardHandlers) {
    if (!instances) {
        document.addEventListener('keydown', handleKeydown)
        instances = []
    }
    const instance = {
        handlers,
        enabled: false,
        unmount: () => {
            const index = instances.indexOf(instance)
            if (index >= 0) {
                instances.splice(index, 1)
            }
        }
    }
    instances.unshift(instance)
    return instance
}