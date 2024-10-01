import { isArray, isString } from '@vue/shared'

export function reactiveReplace(target: any, source: any) {
    Object.keys(target).forEach((key) => delete target[key])
    Object.assign(target, source ?? {})
}

export function toBoolean(value: any) {
    if (value == undefined || value == null || value == '') {
        return false
    }
    if (isArray(value)) {
        return value.length > 0
    }
    if (isString(value)) {
        return isNaN(+value) || !!+value
    }
    return !!value
}

export function isEmpty(value: any) {
    return value == null || value == '' || value == undefined
}

export function toArray(value: any): any[] {
    if (value == undefined || value == null || value == '') {
        return []
    }
    if (isArray(value)) {
        return value
    }
    return [value]
}
