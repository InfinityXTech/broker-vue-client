<script setup lang="ts">
import { h, reactive, ref, nextTick, VNode, computed, watch, watchEffect, onMounted, onUnmounted, render, createElementBlock } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { isFunction, isString, hasOwn, isArray } from '@vue/shared'
import { AxiosError, Method } from 'axios'
// import { isArray, isNumber } from '@vue/shared'
import { VLoaderSize } from '/@src/components/base/loader/VLoader.vue'
import VFlexTableSortColumn from '/@src/components/base/table/VFlexTableSortColumn.vue'
import * as SimpleRender from '/@src/utils/datatable/simple-render'
import * as SimpleCalc from '/@src/utils/datatable/simple-calc'
import { useSlots } from 'vue'
// import { isNumber, isObject } from '@vueuse/core'
// import { RowData } from '/@src/stores/performance'

export type VDatatableSize = 'small' | 'medium' | 'large' | 'big' | '3xl' | '4xl' | '5xl' | '6xl' | undefined

export type SearchFunc = (row: any, search: any) => boolean
export type CompareFunc = (a: any, b: any) => number

export type FreezeFunction = (row: any) => boolean
export type RenderRowFunction = (row: any) => Record<string, any>
export type RenderCellFunction = (value: any, row: any, column?: DatatableColumn, index?: number) => VNode | string | (VNode | string)[]
export type MapDataFunction = (data: any) => any

export interface TotalCalculator {
    initial: any
    add(state: any, value: any, row: any, column: DatatableColumn, index: number): void
    finalize?(state: any): any
    render?(state: any): VNode | string | (VNode | string)[]
}

export type CustomFunctions = Record<string, () => RenderCellFunction | TotalCalculator>

export interface DatatableConfig {
    title: string
    columns: Record<string, DatatableColumn>
}
export interface DatatableColumn {
    label: string
    classes?: string[]
    styles?: any[]
    key?: string | string[]
    sortable?: boolean
    sortField?: string
    default?: any
    renderCell?: string | RenderCellFunction
    totalCalc?: string | TotalCalculator
}
export interface DatatablePagination {
    page?: number
    count_in_page: number
    total_items?: number
}
export interface DatatableProps {
    size?: VDatatableSize
    columns: Record<string, DatatableColumn>
    uri?: string
    classes?: any
    header?: boolean
    method?: Method
    formData?: any
    modelValue?: any[]
    totalValue?: any
    pagination?: DatatablePagination
    search?: SearchFunc
    custom?: CustomFunctions
    renderRow?: RenderRowFunction
    freezeRow?: FreezeFunction
    mapData?: MapDataFunction
    download?: boolean
    loading?: boolean
    loaderSize?: VLoaderSize
    showOnlyScreenData?: boolean
    selectMode?: boolean
}
export interface DatatableMethods {
    fetchData(): void
}
export interface DatatableEmits {
    (e: 'init', value: DatatableMethods): void
    (e: 'changed', value: any[] | null): void
    (e: 'goToPage', value: number): void
    (e: 'selected', value: string[]): void
}

const api = useApi()
const notif = useNotyf()
const emit = defineEmits<DatatableEmits>()
const props = withDefaults(defineProps<DatatableProps>(), {
    size: undefined,
    uri: '',
    header: true,
    custom: undefined,
    classes: [],
    method: 'get',
    formData: [],
    search: undefined,
    modelValue: undefined,
    mapData: undefined,
    totalValue: undefined,
    renderRow: undefined,
    freezeRow: undefined,
    download: false,
    pagination: undefined,
    loading: false,
    loaderSize: 'xl',
    showOnlyScreenData: undefined,
    selectMode: undefined,
})
const datatable = ref<any[] | null>(null)
const tableElement = ref<HTMLElement>()
const modalElement = ref<HTMLElement>()

const page = ref(props.pagination?.page ?? 1)
const _total_items = ref<number>(props.pagination?.total_items ?? 0)
const total_items = computed<number>(() => (_total_items.value > 0 ? _total_items.value : props.pagination?.total_items ?? 0) as number)
const onGoToPage = async (currentPage: number) => {
    page.value = currentPage
    emit('goToPage', page.value)
    if (props.uri) {
        await fetchData()
    }
}

const isLoading = computed<boolean>(() => props.loading)

const selectedltems = ref<string[]>([])
const selectedAll = ref(false)
const selectedltem = (id: string): boolean => selectedltems.value?.some((x) => x == id)
const onSelectAll = (checked: boolean) => {
    if (checked) {
        selectedltems.value = datatable.value?.map<string>((x) => x._id ?? '') ?? []
    } else {
        selectedltems.value = []
    }
    emit('selected', selectedltems.value)
}
const onSelect = (item: { id: string; selected: boolean }) => {
    if (item.selected) {
        selectedltems.value.push(item.id)
    } else {
        selectedltems.value = selectedltems.value.filter((x) => x !== item.id)
    }
    emit('selected', selectedltems.value)
}

// const renderCellRefresh = ref(true)
// const renderCellRefreshKey = ref(1)
// const renderCellFns = ref()
// const elementRenderToHTML = ref<HTMLDivElement>()

const rows = computed(() => {
    if (datatable.value == null) {
        return null
    }
    if (sortFn.value) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        datatable.value.sort(sortFn.value)
    }
    if (props.freezeRow != undefined && datatable.value.length > 0) {
        const freezeRows = datatable.value.filter(props.freezeRow)
        freezeRows.forEach((row: any) => {
            const index = datatable.value?.indexOf(row)
            if (index != undefined && index >= 0) {
                datatable.value?.unshift(datatable.value?.splice(index, 1)[0])
            }
        })
    }
    return props.search
        ? datatable.value.filter((row: any, index: number) => {
              //   let r = { ...row }
              //   for (const key in props.columns) {
              //       const field = key
              //       const column = props.columns[key]
              //       r[field] = fetchValue(r, field, column, true) ?? ''
              //       if (column.renderCell /* && ((isString(r[field]) && r[field].length > 0) || (isNumber(r[field]) && r[field] > 0))*/) {
              //           const f = renderCell(column)
              //           if (isFunction(f)) {
              //               try {
              //                   //   console.log(r[field])
              //                   //   console.log(f)
              //                   nextTick(() => {
              //                       //   console.log(field)
              //                       r[field] = f(r[field], row, column, index)
              //                       //   console.log(r[field])
              //                       if (hasOwn(r[field], '__v_isVNode')) {
              //                           const vv = 'AAAA ' + (Math.random() * 1000).toString()
              //                           renderCellRefresh.value = false
              //                           renderCellFns.value = { render: () => [h('span', vv)] } //r[field]
              //                           nextTick(() => {
              //                               elementRenderToHTML.value?.innerHTML =
              //                                   '<component :is="renderCellFns" v-if="renderCellRefresh" :key="renderCellRefresh" />'
              //                               renderCellRefreshKey.value++
              //                               renderCellRefresh.value = true

              //                               //   console.log(r[field])
              //                               nextTick(() => {
              //                                   const v = (elementRenderToHTML.value?.textContent || elementRenderToHTML.value?.innerText || '').replace(/,/g, '')
              //                                   //   console.log(elementRenderToHTML.value)
              //                                   console.log(v)
              //                               })
              //                           })
              //                       }
              //                   })
              //               } catch (e) {
              //                   console.error(e)
              //               }
              //           }
              //       }
              //   }
              return props.search(row, index)
          })
        : [...datatable.value]

    // const result = props.search ? datatable.value.filter(props.search) : [...datatable.value]
    // if (sortFn.value) {
    //     result.sort(sortFn.value)
    // }
    // return result
})

const showOnlyScreenDataRows = computed<boolean>(
    () => props.showOnlyScreenData !== false && (props.showOnlyScreenData === true || (rows.value ?? []).length >= 500)
)

const sort = ref<string>()
const sortFn = ref<CompareFunc>()

const updateSort = (value: string, column: DatatableColumn) => {
    sort.value = value
    if (value) {
        let [field, dir] = value.split(':')

        const d = dir == 'desc' ? -1 : 1

        const collator = new Intl.Collator(['en', 'ru'], {
            numeric: true,
        })

        sortFn.value = function (a: any, b: any) {
            let A = fetchValue(a, field, column, true)
            let B = fetchValue(b, field, column, true)

            if (column.renderCell) {
                // TODO: make render and get html for sort
            }

            if (A && A['$date']) {
                A = A['$date']['$numberLong']
            }
            if (B && B['$date']) {
                B = B['$date']['$numberLong']
            }
            return d * collator.compare(A, B)
        }

        // datatable?.value?.sort(sortFn.value)
    } else {
        sortFn.value = undefined
    }
}

// const updateSort = (value: string, column: DatatableColumn) => {
//     sort.value = value

//     if (value) {
//         const [field, dir] = value.split(':')
//         const d = dir == 'desc' ? -1 : 1
//         sortFn.value = function (a: any, b: any) {
//             let A = a[field] ?? column.default
//             let B = b[field] ?? column.default
//             if (a[field] && a[field]['$date']) {
//                 A = a[field]['$date']['$numberLong']
//             }
//             if (b[field] && b[field]['$date']) {
//                 B = b[field]['$date']['$numberLong']
//             }
//             return A < B ? -d : A > B ? d : 0
//         }
//     } else {
//         sortFn.value = undefined
//     }
// }

let renderCellCache: Record<string, RenderCellFunction | undefined> = {}
const renderCell = (column: DatatableColumn): RenderCellFunction => {
    if (isString(column.renderCell)) {
        let fn = renderCellCache[column.renderCell]
        if (!fn) {
            const regex = /(simple|custom)\.(\w+)(\(([^)]*)\))?/
            const match = column.renderCell.match(regex)

            if (match) {
                const library = match[1]
                const functionName = match[2]
                const paramsStr = match[4] || '{}'
                const jsonString = paramsStr.replace(/'/g, '"')
                const fixedString = jsonString.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
                const paramsObj = JSON.parse(fixedString)

                switch (library) {
                    case 'simple':
                        if (Object.keys(paramsObj).length > 0) {
                            fn = (SimpleRender as any)?.[functionName]?.(paramsObj)
                        } else {
                            fn = (SimpleRender as any)?.[functionName]?.()
                        }
                        break
                    case 'custom':
                        if (Object.keys(paramsObj).length > 0) {
                            fn = (props.custom as any)?.[functionName]?.(paramsObj)
                        } else {
                            fn = (props.custom as any)?.[functionName]?.()
                        }
                        break
                    default:
                        fn = undefined
                        break
                }
                renderCellCache[column.renderCell] = fn
            }
        }
        if (!fn) {
            throw new Error('Function not found: ' + column.renderCell)
        }
        return fn
    }
    return column.renderCell as RenderCellFunction
}

let totalCalcCache: Record<string, TotalCalculator | undefined> = {}
const totalCalc = (column: DatatableColumn): TotalCalculator => {
    if (isString(column.totalCalc)) {
        let calc = totalCalcCache[column.totalCalc]
        if (!calc) {
            const tokens = column.totalCalc.split('.')
            switch (tokens.shift()) {
                case 'title':
                    calc = {
                        initial: tokens.join('.'),
                        add: (state) => state,
                    }
                    break
                case 'simple':
                    calc = (SimpleCalc as any)?.[tokens[0]]?.()
                    break
                case 'custom':
                    calc = (props.custom as any)?.[tokens[0]]?.()
                    break
                default:
                    calc = undefined
                    break
            }
            totalCalcCache[column.totalCalc] = calc
        }
        if (!calc) {
            throw new Error('Total Calculator not found: ' + column.totalCalc)
        }
        return calc
    }
    return column.totalCalc as TotalCalculator
}

const hasTotals = computed(() => {
    if (props.totalValue !== undefined) {
        return true
    }
    if (!rows.value || rows.value.length == 0) {
        return false
    }
    for (const key in props.columns) {
        if (props.columns[key].totalCalc) {
            return true
        }
    }
    return false
})

const totalRow = computed(() => {
    const result: any = {}

    if (props.totalValue !== undefined) {
        for (const key in props.columns) {
            const column = props.columns[key]
            result[key] = hasOwn(props.totalValue, key) ? props.totalValue[key] : ''
            if (column.renderCell) {
                result[key] = renderCell(column)(fetchValue(result, key, column), result[key], column, 0)
            }
        }
        return result
    }

    if (!rows.value || !hasTotals.value) {
        return result
    }
    for (const key in props.columns) {
        const initial = totalCalc(props.columns[key])?.initial
        result[key] = isFunction(initial) ? initial() : JSON.parse(JSON.stringify(initial ?? null))
    }
    rows.value.forEach((row, index) => {
        for (const key in props.columns) {
            const column = props.columns[key]
            const calc = totalCalc(column)
            if (calc) {
                result[key] = calc.add(result[key], fetchValue(row, key, column), row, column, index)
            }
        }
    })
    for (const key in props.columns) {
        const column = props.columns[key]
        const calc = totalCalc(column)
        if (!calc) continue
        if (calc.finalize) {
            result[key] = calc.finalize(result[key])
        }
        if (calc.render) {
            result[key] = calc.render(result[key])
        } else if (column.renderCell) {
            result[key] = renderCell(column)(fetchValue(result, key, column), result[key], column, rows.value.length)
        }
    }
    return result
})

const rowClasses = ref<Record<string, Record<string, string>>>({})
const rowClassesStr = computed(() => {
    let str = ''
    const pre = '.dataTable-wrapper .dataTable-container .dataTable-table'
    for (var className in rowClasses.value) {
        str += `${pre} .${className}{`
        for (var name in rowClasses.value[className]) {
            str += `${name}:${rowClasses.value[className][name]}`
        }
        str += '}'
    }
    return str + ''
})
const onRowAddClass = (value: { className: string; styles: Record<string, string> }): void => {
    rowClasses.value[value.className] = value.styles
}

const fetchValue = (row: any, key: string, column: DatatableColumn, for_sort: boolean = false) => {
    let _key = column.key
    if (for_sort && column.sortField) {
        _key = column.sortField
    } else if (!column.key) {
        column.key = _key = key
    }

    const _get_data = (keys: any) => {
        return keys?.reduce((value: any, key: any) => value?.[key], row) ?? column.default ?? ''
    }

    if (isString(_key)) {
        if (_key.indexOf(',') >= 0) {
            const parts = _key.split(',')
            let s = ''
            for (let i = 0; i < parts.length; i++) {
                s += _get_data(parts[i].trim().split('.'))
            }
            return s
        }
        _key = _key.split('.')
    }

    return _get_data(_key) //_key?.reduce((value, key) => value?.[key], row) ?? column.default ?? ''
}

const fetchData = async () => {
    try {
        datatable.value = null

        let url = props.uri
        let formData = { ...(props.formData ?? {}) }
        if (props.pagination != undefined) {
            formData.page = page.value
            formData.count_in_page = props.pagination.count_in_page
            url = url.replace('{page}', page.value.toString())
        }

        const { data } = await api.request({ method: props?.method ?? 'get', url: url, data: formData })

        let _data = null
        if (props.pagination != undefined) {
            _total_items.value = data?.count
            _data = data.items
        } else {
            _data = data
        }

        // if (props.method == 'post') {
        //     let { data } = await api.post(props.uri)
        // } else {
        //     let { data } = await api.get(props.uri)
        // }
        if (isFunction(props.mapData)) {
            datatable.value = props.mapData(_data)
        } else {
            datatable.value = _data
        }

        emit('changed', datatable.value)
    } catch (ex) {
        const error = ex as AxiosError
        notif.dismissAll()
        notif.error(error?.response?.data?.error ?? error.message)
        datatable.value = []
        selectedltems.value = []
        selectedAll.value = false
        emit('changed', datatable.value)
    }
}

function convertToCSV(array: any[]) {
    var str = ''

    for (var i = 0; i < array.length; i++) {
        var line = ''
        for (var key in array[i]) {
            if (line != '') line += ','
            const o = array[i][key]
            const column = props.columns[o.k] ?? {}
            if (i > 0 && column.renderCell && (column.renderCell == 'simple.MoneyColor' || column.renderCell == 'simple.Money')) {
                line += o.v.replace(/[^\d,.]+/g, '')
            } else {
                line += o.v
            }
        }

        str += line + '\r\n'
    }

    return str
}

const onDownloadCSV = () => {
    const exportedFileName = 'export.csv'

    const ths = tableElement.value?.querySelectorAll('thead th') ?? []
    const trs = tableElement.value?.querySelectorAll('tbody tr') ?? []

    var headers: Record<string, { k: string; v: string }> = {}
    for (let i = 0; i < ths?.length; i++) {
        const key = ths[i].getAttribute('data-key') ?? ''
        headers['v' + i] = {
            k: key,
            v: (ths[i].textContent || ths[i].innerText || '').replace(/,/g, '').toUpperCase(),
        }
    }

    var data: any[] = [headers]
    trs.forEach((row) => {
        const tds = row.querySelectorAll('td') ?? []
        let item: Record<string, { k: string; v: string }> = {}
        for (let i = 0; i < tds.length; i++) {
            const key = ths[i].getAttribute('data-key') ?? ''
            item['v' + i] = {
                k: key,
                v: (tds[i].textContent || tds[i].innerText || '').replace(/,/g, ''),
            }
        }
        data.push(item)
    })

    const csv = convertToCSV(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, exportedFileName)
    } else {
        const link = document.createElement('a')
        if (link.download !== undefined) {
            // feature detection
            // Browsers that support HTML5 download attribute
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', exportedFileName)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }
}

const slots = useSlots()
const hasSlot = (name: string) => {
    return !!slots[name]
}

if (props.uri != '') {
    watch(() => props.uri, fetchData)
    fetchData()
    emit('init', { fetchData })
} else {
    watchEffect(() => emit('changed', (datatable.value = props.modelValue)))
    setTimeout(() => emit('changed', (datatable.value = props.modelValue)), 0)
}

watch(datatable, () => {
    selectedltems.value = []
    selectedAll.value = false
    emit('selected', selectedltems.value)
})

onMounted(() => {
    const el = tableElement.value?.closest('.modal-card-body')
    modalElement.value = el ? (el as HTMLElement) : undefined
})

onUnmounted(() => {
    datatable.value == null
    renderCellCache = {}
    totalCalcCache = {}
})
</script>

<template>
    <div :class="['datatable', 'dataTable-wrapper', ...props.classes]">
        <div class="dataTable-top">
            <slot name="top"></slot>
        </div>
        <div class="dataTable-container" :class="['dataTable-container', size && `is-${size}`]">
            <div v-if="props.download" class="download">
                <button type="button" title="Download CSV" class="button is-outlined is-light" @click="onDownloadCSV">
                    <span class="icon">
                        <i class="fas fa-download"></i>
                    </span>
                </button>
            </div>
            <table ref="tableElement" :class="['dataTable-table', 'table', showOnlyScreenDataRows && 'show-only-screen-data-rows']">
                <thead v-if="props.header">
                    <tr>
                        <th v-if="props.selectMode && rows && rows?.length > 0">
                            <input v-model="selectedAll" type="checkbox" @change="(ev: any) => onSelectAll(ev.target.checked)" />
                        </th>
                        <th v-for="(column, key) in props.columns" :key="key" scope="col" :data-key="key">
                            <VFlexTableSortColumn
                                v-if="column.sortable ?? true"
                                :id="key"
                                :label="column.label"
                                :no-router="true"
                                :model-value="sort"
                                @update:model-value="(value) => updateSort(value, column)"
                            />
                            <template v-else>{{ column.label }}</template>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="rows === null || isLoading == true">
                        <td :colSpan="Object.keys(props.columns).length" :class="[props.loaderSize && 'is-' + props.loaderSize]">
                            <VLoader :active="true" :size="props.loaderSize">
                                <div class="loader-inner" />
                            </VLoader>
                        </td>
                    </tr>
                    <tr v-else-if="rows.length === 0">
                        <td :colSpan="Object.keys(props.columns).length">
                            <VPlaceholderSection title="No data to show" subtitle="There is currently no data to show in this list.">
                                <template #image>
                                    <slot v-if="hasSlot('emptyImage')" name="emptyImage" class=""></slot>
                                </template>
                            </VPlaceholderSection>
                        </td>
                    </tr>
                    <!-- <tr v-for="(row, index) in rows" v-else :key="row._id ?? index" v-bind="renderRow && renderRow(row)" :data-id="row._id ?? null">
                        <td v-for="(column, key) in props.columns" :key="key" :class="column.classes ?? []" :style="column.styles ?? []" :data-key="key">
                            <component :is="{ render: () => renderCell(column)(fetchValue(row, key, column), row, column, index) }" v-if="column.renderCell" />
                            <template v-else>{{ fetchValue(row, key, column) }}</template>
                        </td>
                    </tr> -->
                    <DatatableRow
                        v-for="(row, index) in rows"
                        v-else
                        :key="row._id ?? index"
                        :row="row"
                        :index="index"
                        :columns="columns"
                        :select-mode="props.selectMode"
                        :selected="selectedltem(row._id ?? index)"
                        :show-only-screen-data="showOnlyScreenDataRows"
                        :modal-element="modalElement"
                        :render-row="renderRow"
                        :render-cell="renderCell"
                        :fetch-value="fetchValue"
                        @selected="onSelect"
                        @add-class="onRowAddClass"
                    />
                </tbody>
                <tfoot v-if="hasTotals">
                    <tr>
                        <td v-for="(column, key) in props.columns" :key="key">
                            <component :is="{ render: () => totalRow[key] }" v-if="column.totalCalc || props.totalValue != undefined" />
                            <template v-else>{{ totalRow[key] }}</template>
                        </td>
                    </tr>
                </tfoot>
            </table>
            <!-- <div v-if="renderCellRefresh" ref="elementRenderToHTML">
                <component :is="renderCellFns" v-if="renderCellRefresh" :key="renderCellRefresh" />
            </div> -->
        </div>
        <div class="dataTable-bottom">
            <slot name="bottom"></slot>
            <VFlexPagination
                v-if="props.pagination && (Math.ceil(total_items / props.pagination.count_in_page) || 1) > 1"
                :item-per-page="props.pagination.count_in_page"
                :total-items="total_items"
                :current-page="page"
                :no-router="true"
                @update:current-page="(currentPage) => onGoToPage(currentPage)"
            ></VFlexPagination>
        </div>
    </div>
    <component :is="{ render: () => h('style', { type: 'text/css', innerHTML: rowClassesStr }) }" v-if="showOnlyScreenDataRows"> </component>
</template>

<style lang="scss">
.dataTable-wrapper {
    clear: both;

    .dataTable-container {
        .download {
            position: relative;
            // height: 36px;

            button {
                position: absolute;
                right: 0;
                background: whitesmoke;
                border-color: whitesmoke;
                color: rgba(0, 0, 0, 0.7);
            }

            button:hover {
                background: #5a99f1;
                color: white;
            }
        }

        .dataTable-table {
            width: 100%;

            .tfoot td,
            .tfoot th {
                border-width: 4px 0 0;
            }

            th a {
                color: var(--dark-text);
            }

            .is-xl .loader-inner {
                height: 15rem;
            }

            .is-large .loader-inner {
                height: 10rem;
            }

            .is-small .loader-inner {
                height: 8rem;
            }

            td > .field {
                padding: 0;
            }

            td > svg {
                vertical-align: inherit;
            }
        }
    }
}

.is-navbar {
    .datatable-toolbar {
        padding-top: 30px;
    }
}

.datatable-toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    &.is-reversed {
        flex-direction: row-reverse;
    }

    .field {
        margin-bottom: 0;

        .control {
            .button {
                color: var(--light-text);

                &:hover,
                &:focus {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: var(--primary--color-invert);
                }
            }
        }
    }

    .buttons {
        margin-left: auto;
        margin-bottom: 0;

        .v-button {
            margin-bottom: 0;
        }
    }
}

.is-dark {
    .datatable-toolbar {
        .field {
            .control {
                .button {
                    background: var(--dark-sidebar) !important;
                    color: var(--light-text);

                    &:hover,
                    &:focus {
                        background: var(--primary) !important;
                        border-color: var(--primary) !important;
                        color: var(--smoke-white) !important;
                    }
                }
            }
        }
    }
}

.dataTable-wrapper {
    .dataTable-top {
        margin-bottom: 1.5rem;
        padding-left: 0;
        padding-right: 0;

        .dataTable-dropdown {
            label {
                display: block;
                position: relative;
                font-family: var(--font);
                font-weight: 400;
                font-size: 0.9rem;
                color: var(--light-text);

                &::after {
                    position: absolute;
                    top: 1px;
                    right: 4px;
                    content: '';
                    font-family: 'Font Awesome 5 Free';
                    font-weight: 900;
                    font-size: 0.9rem;
                    color: var(--light-text);
                    height: 36px;
                    width: 36px;
                    border-radius: 0.5rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: var(--white);
                }
            }

            select {
                font-size: 1rem;
                background: var(--white);
                border: 1px solid var(--border);
                color: var(--dark-text);
                border-radius: 0.5rem;
                height: 38px;
                transition: box-shadow 0.3s;

                &:focus {
                    box-shadow: var(--light-box-shadow);
                }
            }
        }

        .dataTable-search {
            position: relative;

            &::after {
                position: absolute;
                top: 1px;
                right: 4px;
                content: '\f002';
                font-family: 'Font Awesome 5 Free';
                font-weight: 900;
                font-size: 0.9rem;
                color: var(--light-text);
                height: 36px;
                width: 36px;
                border-radius: 0.5rem;
                display: flex;
                justify-content: center;
                align-items: center;
                background: var(--white);
            }

            input {
                font-family: var(--font);
                font-size: 1rem;
                background: var(--white);
                border: 1px solid var(--border);
                color: var(--dark-text);
                border-radius: 0.5rem;
                height: 38px;
                transition: box-shadow 0.3s;

                &::placeholder {
                    color: var(--placeholder);
                }

                &:focus {
                    box-shadow: var(--light-box-shadow);
                }
            }
        }
    }

    .dataTable-container {
        background: var(--white);
        border: none !important;
        overflow-x: auto;

        &::-webkit-scrollbar {
            height: 8px !important;
        }

        &::-webkit-scrollbar-thumb {
            border-radius: 10px !important;
            background: rgb(0 0 0 / 20%) !important;
        }

        .dataTable-table {
            border: 1px solid var(--fade-grey);
            border-collapse: collapse;
            border-radius: 0.75rem;

            tfoot td {
                padding-top: 12px;
                padding-bottom: 12px;
            }

            th {
                padding: 16px 10px;
                font-family: var(--font-alt);
                font-size: 0.8rem;
                color: var(--dark-text);
                text-transform: uppercase;
                border: 1px solid var(--fade-grey);
                font-weight: 600;

                &:last-child {
                    -text-align: right;
                }

                span a {
                    white-space: nowrap;
                }
            }

            td {
                font-family: var(--font);
                vertical-align: middle;
                // padding: 12px 10px;
                padding: 4px 7px;
                font-size: 13px;
                border-bottom: 1px solid var(--fade-grey);

                &:last-child {
                    -text-align: right;
                }

                &.dataTables-empty {
                    opacity: 0;
                }
            }

            .light-text {
                color: var(--light-text);
            }

            .flex-media {
                display: flex;
                align-items: center;

                .meta {
                    margin-left: 10px;
                    line-height: 1.3;

                    span {
                        display: block;
                        font-size: 0.8rem;
                        color: var(--light-text);
                        font-family: var(--font);

                        &:first-child {
                            font-family: var(--font-alt);
                            color: var(--dark-text);
                        }
                    }
                }
            }

            .row-action {
                display: flex;
                justify-content: flex-end;
            }

            .checkbox {
                padding: 0;
            }

            .product-photo {
                width: 80px;
                height: 80px;
                object-fit: contain;
            }

            .file-icon {
                width: 46px;
                height: 46px;
                object-fit: contain;
            }

            .drinks-icon {
                display: block;
                max-width: 48px;
                border-radius: var(--radius-rounded);
                border: 1px solid var(--fade-grey);
            }

            .negative-icon,
            .positive-icon {
                svg {
                    height: 16px;
                    width: 16px;
                }
            }

            .positive-icon {
                .iconify {
                    color: var(--success);

                    * {
                        stroke-width: 4px;
                    }
                }
            }

            .negative-icon {
                &.is-danger {
                    .iconify {
                        color: var(--danger) !important;
                    }
                }

                .iconify {
                    color: var(--light-text);

                    * {
                        stroke-width: 4px;
                    }
                }
            }

            .price {
                color: var(--dark-text);
                font-weight: 500;

                &::before {
                    content: '$';
                }

                &.price-free {
                    color: var(--light-text);
                }
            }

            .status {
                display: flex;
                align-items: center;

                &.is-available {
                    i {
                        color: var(--success);
                    }
                }

                &.is-busy {
                    i {
                        color: var(--danger);
                    }
                }

                &.is-offline {
                    i {
                        color: var(--light-text);
                    }
                }

                i {
                    margin-right: 8px;
                    font-size: 8px;
                }

                span {
                    font-family: var(--font);
                    font-size: 0.9rem;
                    color: var(--light-text);
                }
            }
        }
    }

    .dataTable-bottom {
        .dataTable-info {
            font-family: var(--font);
            font-size: 0.9rem;
            color: var(--light-text);
        }

        .dataTable-pagination {
            li {
                &:not(.active) {
                    a:hover {
                        background: var(--white);
                    }
                }

                &.active {
                    a {
                        background: var(--primary);
                        box-shadow: var(--primary-box-shadow);
                        color: var(--primary--color-invert);
                    }
                }

                a {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: var(--font);
                    color: var(--light-text);
                    border-radius: var(--radius-rounded);
                    min-width: 34px;
                    min-height: 34px;
                    padding: 0;
                }
            }
        }
    }
}

.modal-card-body .dataTable-wrapper .dataTable-container {
    overflow-x: visible;
}

.is-dark {
    .dataTable-wrapper {
        .dataTable-top {
            .dataTable-dropdown {
                label {
                    &::after {
                        background: var(--dark-sidebar-light-6) !important;
                    }
                }

                select {
                    border-color: var(--dark-sidebar-light-12);
                    background: var(--dark-sidebar-light-6);
                    color: var(--white);
                }
            }

            .dataTable-search {
                &::after {
                    background: var(--dark-sidebar-light-6) !important;
                }

                input {
                    border-color: var(--dark-sidebar-light-12);
                    background: var(--dark-sidebar-light-6);
                    color: var(--white);
                }
            }
        }

        .dataTable-container {
            border-color: var(--dark-sidebar-light-12);
            background: var(--dark-sidebar-light-6);

            .dataTable-table {
                border-color: var(--dark-sidebar-light-12);

                th,
                td {
                    border-color: var(--dark-sidebar-light-12);
                    color: var(--dark-dark-text);
                }

                th {
                    .dataTable-sorter {
                        &::before {
                            border-top-color: var(--dark-dark-text);
                        }

                        &::after {
                            border-bottom-color: var(--dark-dark-text);
                        }
                    }
                }

                .drinks-icon {
                    border-color: var(--dark-sidebar-light-12);
                }
            }
        }
    }
}

.dataTable-container {
    &.is-6xl {
        width: 100%;
        max-width: 1620px;
    }

    &.is-5xl {
        width: 100%;
        max-width: 1440px;
    }

    &.is-4xl {
        width: 100%;
        max-width: 1280px;
    }

    &.is-3xl {
        width: 100%;
        max-width: 1024px;
    }

    &.is-big {
        width: 100%;
        max-width: 840px;
    }

    &.is-large {
        width: 100%;
        max-width: 720px;
    }

    &.is-medium {
        width: 100%;
        max-width: 640px;
    }

    &.is-small {
        width: 100%;
        max-width: 420px;
    }
}
</style>
