<script setup lang="ts">
import { computed, inject, reactive, ref, watch } from 'vue'
import { SearchFunc } from './Datatable.vue'
import { CustomOptions, Dictionary, DictionaryOptions, SelectOption, useDictionary } from '/@src/composable/useDictionary'
import { FormComponent } from '/@src/components/partials/Form.vue'
import { isArray, isFunction, isObject, isString } from '@vue/shared'
import { toArray } from '/@src/utils/helpers'

export type GetValueFunc = (row: any) => any
export type CollectOptionsFunc = (data: any[] | null) => SelectOption[]
export interface CollectOptions {
    field?: string
    key: string
    value: string
}

export interface DatatableSearchConfig {
    columns: SearchColumn[]
}
export type SearchColumn = SelectSearchColumn | InputSearchColumn | TogglesSearchColumn | StatusSearchColumn

export interface BaseSearchColumn {
    label?: string
    placeholder?: string
    value: string | GetValueFunc
}

export interface InputSearchColumn extends BaseSearchColumn {
    type: 'input'
    layout: 'narrow'
}
export interface SelectSearchColumn extends BaseSearchColumn {
    type: 'select'
    layout: 'narrow'
    options: Dictionary | CollectOptions | CollectOptionsFunc
}
export interface TogglesSearchColumn extends BaseSearchColumn {
    type: 'toggles'
    multiSelect?: boolean
    layout: 'narrow'
    options: Dictionary | CollectOptions | CollectOptionsFunc
}
export interface StatusSearchColumn extends BaseSearchColumn {
    type: 'status'
    layout: 'narrow'
    options: Dictionary | CollectOptions | CollectOptionsFunc
}

export interface DatatableSearchProps {
    config: DatatableSearchConfig | any
    data: any[] | null
    initial?: any
    layout?: string
}
export interface DatatableSearchEmits {
    (e: 'changed', value: SearchFunc): void
}

const emit = defineEmits<DatatableSearchEmits>()
const props = withDefaults(defineProps<DatatableSearchProps>(), {
    initial: undefined,
    layout: '12',
})

const data = reactive({})
const dictionary = useDictionary()

function flatten(items: any[], key: string) {
    const result: any[] = []
    items.forEach((item) => {
        // if ('_id' == key) {
        //     console.log(items)
        // }
        if (item[key] == null) {
            return
        }
        // console.log(key)
        if (isArray(item[key])) {
            result.push(...item[key])
        } else {
            result.push(item[key])
        }
    })
    return result.filter((v, i, a) => a.indexOf(v) === i)
}

function prepareForTextSearch(obj: any): string {
    if (isArray(obj)) {
        return obj.map(prepareForTextSearch).join('\t')
    }
    if (isObject(obj)) {
        return Object.keys(obj)
            .map((key) => prepareForTextSearch(obj[key]))
            .join('\t')
    }
    return obj?.toString() ?? ''
}

const getValueCache: Record<string, GetValueFunc> = {}
const getValue = (column: SearchColumn): GetValueFunc => {
    if (isString(column.value)) {
        let func = getValueCache[column.value]
        if (!func) {
            if (column.value == 'TEXT') {
                func = (row: any) => prepareForTextSearch(row)
            } else if (column.value.startsWith('inject:')) {
                func = inject(column.value.substring('inject:'.length)) as GetValueFunc
            } else {
                const keys = column.value.split('.')
                func = (row: any) => {
                    return keys.reduce(flatten, [row]) //.join('\t')
                }
            }
            getValueCache[column.value] = func
        }
        return func
    }
    return column.value as GetValueFunc
}

const getSelectOptionsCache: Record<string, CollectOptionsFunc> = {}
const getSelectOptions = (column: SelectSearchColumn, data: any[] | null): Dictionary => {
    const collect = column.options as CollectOptions
    if (collect.key && collect.value) {
        const cache = JSON.stringify(collect)
        const keys = collect.field ? collect.field.split('.') : []

        let func = getSelectOptionsCache[cache]
        if (!func) {
            func = (data: any) => {
                const hash: Record<string, string> = {}
                keys.reduce(flatten, data ?? []).forEach((item) => (hash[item[collect.key]] = item[collect.value]))

                const result = []
                for (const key in hash) {
                    result.push({ value: key, label: hash[key] })
                }
                result.sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))
                result.unshift({ value: '', label: 'All' })
                return result
            }
            getSelectOptionsCache[cache] = func
        }
        return func(data)
    }

    if (collect.key) {
        const dict = dictionary.load(column.options as Dictionary)
        const keys = collect.field ? collect.field.split('.') : []
        return {
            computed: {
                isLoading: computed(() => dict.isLoading),
                options: computed(() => {
                    const hash: Record<string, true> = {}
                    keys.reduce(flatten, data ?? []).forEach((item) => {
                        if (isArray(item[collect.key])) {
                            item[collect.key].forEach((v: string) => (hash[v] = true))
                        } else {
                            hash[item[collect.key]] = true
                        }
                    })
                    const result = computed<SelectOption[]>(() => dict.options).value.filter((opt) => hash[opt.value])
                    result.unshift({ value: '', label: 'All' })
                    return result
                }),
                map: computed(() => dict.map),
            },
        }
    }
    if (isArray(column.options)) {
        return column.options
    }
    if (isFunction(column.options)) {
        const func = column.options as CollectOptionsFunc
        return func(data)
    }
    const dict = column.options as DictionaryOptions
    if (dict.dictionary) {
        return dict
    }
    const custom = column.options as CustomOptions
    if (custom.custom) {
        return custom
    }
    throw new Error('Invalid options config')
}

const initScheme = (column: SearchColumn, index: number): FormComponent => {
    switch (column.type) {
        case 'select':
            return {
                component: 'SelectField',
                data: index.toString(),
                props: {
                    layout: '',
                    label: column.label,
                    placeholder: column.placeholder,
                    default: false,
                    options: getSelectOptions(column, props.data),
                },
            }
        case 'input':
            return {
                component: 'InputField',
                data: index.toString(),
                props: {
                    layout: '',
                    label: column.label,
                    placeholder: column.placeholder,
                },
            }
        case 'toggles':
            return {
                component: 'TogglesField',
                data: index.toString(),
                props: {
                    layout: 'narrow',
                    label: column.label,
                    multiSelect: column.multiSelect,
                    options: column.options,
                },
            }
        case 'status':
            return {
                component: 'StatusField',
                data: index.toString(),
                props: {
                    layout: 'narrow',
                    label: column.label,
                    options: column.options,
                },
            }
    }
}

const version = ref(0)
const scheme = ref(props.config.columns.map(initScheme))
watch(
    () => props.data,
    () => {
        version.value++
        scheme.value = props.config.columns.map(initScheme)
    }
)

const onChange = (search: any) => {
    const funcs: ((row: any) => boolean)[] = props.config.columns.map((column: SearchColumn, index: number) => {
        if (isArray(search[index]) && search[index].length == 0) {
            return () => false
        }
        const values = toArray(search[index])
        if (values.length == 0) {
            return () => true
        }
        return (row: any) => {
            const v = getValue(column)(row)
            const cr_value = isString(v) ? (v?.toString() ?? '').toLowerCase() : ''
            if (isArray(v)) {
                return values.some((value) => v.some((value2) => value2?.toString().toLowerCase() == value?.toLowerCase()))
            } else if (column.type == 'input') {
                return values.some((value) => cr_value.indexOf(value.toLowerCase()) >= 0)
            }
            return values.some((value) => cr_value == value.toLowerCase())
        }
    })
    emit('changed', (row: any) => funcs.every((func) => func(row)))
}
</script>

<template>
    <div :key="version" class="datatable-search list-flex-toolbar columns is-multiline">
        <div class="column" :class="[props.layout && 'is-' + props.layout]">
            <div class="columns">
                <Form :data="data" :children="scheme" :errors="{}" @update:data="onChange" />
                <VButtons>
                    <slot></slot>
                </VButtons>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.datatable-search {
    align-items: right;
    justify-content: right;
    flex-direction: row;
}

.datatable-search:not(.report) .columns .column {
    flex: none;
    width: unset;
}
.datatable-search:not(.report) input[type='text'].input,
.datatable-search:not(.report) input[data-v-5cb13f66] {
    width: 335px;
}
.datatable-search .control .multiSelect {
    max-width: 150px;
}

.datatable-search .buttons {
    align-items: flex-end;
    padding-bottom: 0.75rem;
    padding-right: 0.75rem;
}

.datatable-search {
    .list-flex-toolbar {
        .control {
            margin-right: 0;
        }

        & > .column {
            padding-top: 0;
            padding-bottom: 0;
        }

        .buttons {
            margin-top: 1rem !important;
            margin-right: 1rem !important;
        }
    }
}
</style>