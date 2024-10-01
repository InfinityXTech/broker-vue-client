import { isArray, isString } from '@vue/shared'
import { ComputedRef, inject, reactive, ref } from 'vue'
import { useApi } from './useApi'
import { isFunction } from '@vue/shared'

export interface SelectOption {
    value: string
    label: string
    default?: boolean
    disabled?: boolean
    color?: string
}
export interface DictionaryOptions {
    dictionary: string
}
export type CustomLoaderFunc = () => Promise<SelectOption[] | Record<string, string>>
export interface CustomOptions {
    custom: string | CustomLoaderFunc
}
export interface ComputedOptions {
    computed: {
        isLoading: ComputedRef<boolean>
        options: ComputedRef<SelectOption[]>
        map: ComputedRef<Record<string, string>>
    }
}

export type Dictionary = SelectOption[] | DictionaryOptions | CustomOptions | ComputedOptions

export interface CacheItem {
    request?: Promise<any>
    data: any
}

function remap(item: { key: string; value: string; default?: boolean; active?: boolean }) {
    return {
        value: item.key,
        label: item.value,
        default: item.default,
        active: item.active,
    }
}

function toMap(result: Record<string, string>, item: { key: string; value: string }) {
    result[item.key] = item.value
    return result
}

const cache: Record<string, CacheItem> = {}
const CacheTime = 500 // ms

export function useDictionary() {
    return {
        loadOptions(props: SelectOption[]) {
            return {
                isLoading: false,
                options: props,
                map: props.reduce((result, item) => {
                    result[item.value] = item.label
                    return result
                }, {} as Record<string, string>),
            }
        },
        loadDictionary(props: DictionaryOptions) {
            if (cache[props.dictionary]) {
                return cache[props.dictionary].data
            }
            const api = useApi()
            const isLoading = ref(true)
            const options = ref<SelectOption[]>([])
            const map = ref<Record<string, string>>({})

            setTimeout(() => {
                if (!cache[props.dictionary].request) {
                    const keys = Object.keys(cache).filter((key) => !cache[key].request)
                    const request = api.get('/dictionary', { params: { dictionaries: keys.join(',') } })
                    request.then(() => setTimeout(() => keys.forEach((key) => delete cache[key]), CacheTime))
                    keys.forEach((key) => (cache[key].request = request))
                }
                cache[props.dictionary].request?.then((response) => {
                    isLoading.value = false
                    options.value = response.data[props.dictionary].map(remap)
                    map.value = response.data[props.dictionary].reduce(toMap, {})
                })
            }, 0)

            cache[props.dictionary] = {
                data: reactive({
                    isLoading,
                    options,
                    map,
                }),
            }
            return cache[props.dictionary].data
        },
        loadCustom(props: CustomOptions) {
            const isLoading = ref(true)
            const options = ref<SelectOption[]>([])
            const map = ref<Record<string, string>>({})

            const func = isString(props.custom) ? (inject(props.custom) as CustomLoaderFunc) : props.custom
            console.assert(func != null, 'Custom options are not defined', props)

            const fillData = (result: any) => {
                if (isArray(result)) {
                    options.value = result
                    map.value = result.reduce((result, item) => {
                        result[item.value] = item.label
                        return result
                    }, {} as Record<string, string>)
                } else {
                    const opts = [] as SelectOption[]
                    for (const key in result) {
                        opts.push({ value: key, label: result[key] })
                    }
                    options.value = opts
                    map.value = result
                }
            }
            const f = func()
            // check Promise
            if (f && isFunction(f.then)) {
                f.then((result) => {
                    fillData(result)
                }).finally(() => {
                    isLoading.value = false
                })
            } else {
                fillData(f)
                isLoading.value = false
            }

            return reactive({
                isLoading,
                options,
                map,
            })
        },
        load(props: Dictionary) {
            if (isArray(props)) {
                return this.loadOptions(props)
            }
            const dictionary = props as DictionaryOptions
            if (dictionary.dictionary) {
                return this.loadDictionary(dictionary)
            }
            const custom = props as CustomOptions
            if (custom.custom) {
                return this.loadCustom(custom)
            }
            const computed = props as ComputedOptions
            if (computed.computed) {
                return reactive(computed.computed)
            }
            throw new Error('Invalid dictionary config')
        },
    }
}
