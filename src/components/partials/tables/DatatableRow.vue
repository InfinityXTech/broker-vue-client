<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref } from 'vue'
import { DatatableColumn, RenderCellFunction, RenderRowFunction } from './Datatable.vue'
import Comment from '/@src/components/partials/general/Comment.vue'

export interface DatatableRowProps {
    row: any
    index: number
    columns: Record<string, DatatableColumn>
    showOnlyScreenData: boolean
    modalElement?: HTMLElement
    selectMode?: boolean
    selected?: boolean
    renderRow?: RenderRowFunction
    renderCell: (column: DatatableColumn) => RenderCellFunction
    fetchValue: (row: any, key: string, column: DatatableColumn) => any
}

export interface DatatableEmits {
    (e: 'selected', value: any): void
    (e: 'addClass', value: { className: string; styles: Record<string, string> }): void
}

const props = defineProps<DatatableRowProps>()

const emit = defineEmits<DatatableEmits>()

const DEFAULT_ROW_HEIGHT = 48

const holder = ref<any>()
const element = ref<HTMLTableRowElement>()
const height = ref(DEFAULT_ROW_HEIGHT)
const heightClass = ref('')
const isVisible = ref(!props.showOnlyScreenData)
const selected = computed(() => props.selected == true)

let outputClassNames: string[] = []

let requestId: number | undefined = undefined
function onScroll() {
    // clearTimeout(requestId)
    // requestId = setTimeout(onRecalculate, 0)
    if (requestId) {
        cancelAnimationFrame(requestId)
    }
    requestId = requestAnimationFrame(onRecalculate)
}

function isElementVisibleInModal(rect: DOMRect, holder: any) {
    const holderRect = holder.getBoundingClientRect()
    return rect.top <= holderRect.top ? holderRect.top - rect.top <= height.value : rect.bottom - holderRect.bottom <= rect.height
}

function onRecalculate() {
    if (element.value) {
        const rect = element.value.getBoundingClientRect()
        if (props.modalElement) {
            isVisible.value = isElementVisibleInModal(rect, holder.value || document.body)
        } else {
            const wrapHeight = window.innerHeight
            isVisible.value = -1.25 * wrapHeight < rect.top && rect.bottom < 1.25 * wrapHeight
        }
        height.value = rect.height ? rect.height : DEFAULT_ROW_HEIGHT

        if (props.showOnlyScreenData) {
            const className = 'h' + height.value.toString().replace('.', '')
            if (outputClassNames.indexOf(className) < 0) {
                emit('addClass', { className: className, styles: { height: height.value + 'px' } })
                outputClassNames.push(className)
            }
            heightClass.value = className
        }

        // const tds = element.value.querySelectorAll('td')
        // tds.forEach((td: any, index: number) => {
        //     const rect = td.getBoundingClientRect()
        //     width.value[index] = rect.width as number
        // })
    }
}

// const getStyles = (column: DatatableColumn, index: number): Ref<string[]> => {
//     let styles = ref<string[]>(column.styles ?? [])
//     const styleWidth = computed<number>(() => width.value[index])
//     if (styleWidth.value) {
//         styles.value = [...styles.value, `width: ${styleWidth.value}px`]
//     }
//     return styles
// }

if (props.showOnlyScreenData) {
    onUpdated(onScroll)
}

const onSelect = (id: string, selected: boolean) => {
    emit('selected', { id: id, selected: selected })
}

onMounted(() => {
    if (props.showOnlyScreenData) {
        holder.value = props.modalElement ?? window
        holder.value.addEventListener('scroll', onScroll)
        onScroll()
    }
})

onUnmounted(() => {
    if (props.showOnlyScreenData) {
        holder.value.removeEventListener('scroll', onScroll)
        isVisible.value = false
    }
})
//:style="props.showOnlyScreenData ? { height: height + 'px' } : undefined"
</script>

<template>
    <tr ref="element" v-bind="renderRow && renderRow(row)" :class="[props.showOnlyScreenData && heightClass]">
        <template v-if="isVisible">
            <Comment :content="`ID: ${row._id}`" />
            <td v-if="props.selectMode">
                <input v-model="selected" type="checkbox" @change="(ev: any) => onSelect(row._id, ev.target.checked)" />
            </td>
            <td v-for="(column, key) in props.columns" :key="key" :class="column.classes ?? []" :style="column.styles ?? []" :data-key="key">
                <component :is="{ render: () => renderCell(column)(fetchValue(row, key, column), row, column, index) }" v-if="column.renderCell" />
                <template v-else>{{ fetchValue(row, key, column) }}</template>
            </td>
        </template>
    </tr>
</template>
