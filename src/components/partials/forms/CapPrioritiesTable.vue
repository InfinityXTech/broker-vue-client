<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { SelectOption, useDictionary } from '/@src/composable/useDictionary'
import { LayoutSize } from '/@src/utils/layout-size'
import { toArray } from '/@src/utils/helpers'

export interface CapPriorityValue {
    [priority: string]: string[]
}

export interface CapPriorityRow {
    priority: string
    endpoints: string[]
    priority_options?: SelectOption[]
    endpoints_options?: SelectOption[]
}

export interface CapPriorityTableEmits {
    (e: 'update:modelValue', value: CapPriorityValue | null): void
}

export interface CapPriorityTableProps {
    layout?: LayoutSize
    title?: string
    modelValue?: CapPriorityValue | null
}

const emit = defineEmits<CapPriorityTableEmits>()
const props = withDefaults(defineProps<CapPriorityTableProps>(), {
    layout: '12',
    title: undefined,
    modelValue: undefined,
})

const dictionary = useDictionary().load({ dictionary: 'traffic_endpoints' })

const options_priorities = [
    { value: '0', label: 'General' },
    { value: '1', label: '1 - Lowest' },
    { value: '2', label: '2 - Low' },
    { value: '3', label: '3 - Medium' },
    { value: '4', label: '4 - High' },
    { value: '5', label: '5 - Highest' },
]

const rows = reactive<CapPriorityRow[]>([])

function getModelValue() {
    if (rows.length == 0) {
        return null
    }
    const result: CapPriorityValue = {}
    rows.forEach((row) => {
        result[row.priority] = row.endpoints ?? []
    })
    return result
}

const get_priority_options = () => options_priorities.filter((opt: SelectOption) => !rows.some((c) => c.priority == opt.value))
// const get_selected_endpoints = (endpoints: string[]) =>
//     computed(() => dictionary.options.filter((opt: SelectOption) => endpoints.some((c) => c == opt?.value)) as any)

const addRow = (init?: CapPriorityRow) => {
    const row: CapPriorityRow = { priority: '0', endpoints: [] }

    row.priority_options = get_priority_options()
    row.priority = init?.priority ? init?.priority : row.priority_options.length > 0 ? row.priority_options[0]?.value : ''
    row.endpoints = init?.endpoints ?? []

    row.endpoints_options = computed(() => {
        let target: SelectOption[] = []
        if (dictionary.options.length > 0) {
            const source = dictionary.options.filter(
                (opt: SelectOption) =>
                    row.endpoints.some((x) => x == opt.value) || !rows.some((r) => r.endpoints && opt?.value && r.endpoints.some((c) => c == opt?.value))
            )
            Object.assign(target, source)
        }
        return target
    }) as any

    if (row.priority != '') {
        rows.push(row)
    }
}
const removeRow = (index: number) => {
    rows.splice(index, 1)
    emit('update:modelValue', getModelValue())
}

const priorityUpdate = ref(1000)
const onUpdate = (index: number, value: CapPriorityRow) => {
    if (rows[index].priority != value.priority) {
        if (!rows.some((c) => rows[index] != c && c.priority == value.priority)) {
            rows[index].priority = value.priority
        } else {
            alert('You already have this priority')
            priorityUpdate.value++
            return false
        }
    }
    rows[index].endpoints = value.endpoints
    emit('update:modelValue', getModelValue())
}

const init = () => {
    for (let priority in props.modelValue) {
        if (!rows.some((x) => x.priority == priority)) {
            addRow({ priority: priority, endpoints: props.modelValue[priority] })
        }
    }
}

watch(
    () => [props.modelValue, dictionary.isLoading],
    () => {
        if (props.modelValue != null && !dictionary.isLoading && dictionary.options.length > 0) {
            init()
        }
    }
)
</script>

<template>
    <div class="cap-priority-table column" :class="[layout && 'is-' + layout]">
        <h2 v-if="props.title" class="title is-6 is-narrow is-thin" style="margin: 5px 0">{{ props.title }}</h2>
        <div class="dataTable-wrapper">
            <div class="dataTable-container">
                <table class="dataTable-table table">
                    <thead>
                        <tr>
                            <th scope="col">Prioryty</th>
                            <th scope="col">Traffic Endpoints</th>
                            <th scope="col" style="width: 0"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in rows" :key="index">
                            <td>
                                <Multiselect
                                    :key="priorityUpdate"
                                    :model-value="row.priority"
                                    :options="row.priority_options"
                                    :searchable="true"
                                    placeholder="Select Some Option"
                                    :can-clear="false"
                                    :can-deselect="false"
                                    @update:model-value="(value: string) => onUpdate(index, {priority: value, endpoints: row.endpoints})"
                                />
                            </td>
                            <td>
                                <Multiselect
                                    :model-value="row.endpoints"
                                    :loading="dictionary.isLoading"
                                    :options="row.endpoints_options"
                                    :searchable="true"
                                    mode="tags"
                                    placeholder="Select Some Option"
                                    no-options-text=""
                                    no-results-text=""
                                    @update:model-value="(value: string[]) => onUpdate(index, {priority: row.priority, endpoints: value})"
                                />
                            </td>
                            <td style="text-align: right">
                                <VIconButton icon="fas fa-trash" title="Remove" @click="removeRow(index)" />
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2"></td>
                            <td style="text-align: right">
                                <VButton v-if="get_priority_options().length > 0" icon="fas fa-plus" title="Add" @click="addRow"></VButton>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.cap-priority-table .error {
    color: var(--danger);
}
</style>