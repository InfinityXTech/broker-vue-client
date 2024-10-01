<script setup lang="ts">
import { computed, reactive, ref, watch, onUnmounted } from 'vue'
import { SelectOption, useDictionary } from '/@src/composable/useDictionary'
import { useApi } from '/@src/composable/useApi'
import { LayoutSize } from '/@src/utils/layout-size'

export interface CapAllocationValue {
    endpoint: string[]
    daily_cap: number[]
    sub_publisher_list: Array<string[]>
}
export interface CapAllocationRow {
    endpoint?: string
    daily_cap?: number
    sub_publisher_list?: string[]
    options?: SelectOption[]
    sub_publisher_options?: SelectOption[]
}
export interface CapAllocationTableEmits {
    (e: 'update:modelValue', value: CapAllocationValue | null): void
}
export interface CapAllocationTableProps {
    layout?: LayoutSize
    totalCap?: number | string
    title?: string
    modelValue?: CapAllocationValue | null
}

const emit = defineEmits<CapAllocationTableEmits>()
const props = withDefaults(defineProps<CapAllocationTableProps>(), {
    layout: '12',
    title: undefined,
    totalCap: undefined,
    modelValue: undefined,
})

const dictionary = useDictionary().load({ dictionary: 'traffic_endpoints' })

const rows = reactive<CapAllocationRow[]>([])
const error = ref<string>()

const api = useApi()
const dataSubPublisherList = ref<Record<string, SelectOption[]>>({})
const getSubPublisherList = (traffic_endpoints: string[]) => {
    const keys = Object.keys(dataSubPublisherList.value) ?? []
    const _traffic_endpoints = traffic_endpoints.filter((f) => keys.indexOf(f) < 0)
    if (_traffic_endpoints.length > 0) {
        api.post('/traffic_endpoint/sprav/sub_publisher_tokens', {
            traffic_endpoints: traffic_endpoints,
            hide_traffic_endpoint_name: true,
            group_by_traffic_endpoint: true,
        }).then((response) => {
            for (let endpoint in response?.data) {
                dataSubPublisherList.value[endpoint] = response?.data[endpoint]
            }
        })
    }
}

function getModelValue() {
    if (rows.length == 0) {
        return null
    }
    const result: CapAllocationValue = {
        endpoint: [],
        daily_cap: [],
        sub_publisher_list: [],
    }
    rows.forEach((row) => {
        result.endpoint.push(row.endpoint ?? '')
        result.sub_publisher_list.push(row.sub_publisher_list ?? [])
        result.daily_cap.push(row.daily_cap ?? 0)
    })
    return result
}

const addRow = () => {
    const row: CapAllocationRow = {}
    row.options = computed(() =>
        dictionary.options.filter((opt: SelectOption) => opt.value == row.endpoint || !rows.some((row) => row.endpoint == opt.value))
    ) as any
    row.sub_publisher_options = []
    rows.push(row)
}
const removeRow = (index: number) => {
    rows.splice(index, 1)
    emit('update:modelValue', getModelValue())
}
const onUpdate = (index: number, value: any) => {
    if (value.endpoint) {
        getSubPublisherList([value.endpoint])
        Object.assign(rows[index], { sub_publisher_list: [] })
        rows[index].sub_publisher_options = computed<SelectOption[]>(() => {
            if (dataSubPublisherList?.value && dataSubPublisherList?.value[value?.endpoint]) {
                return (dataSubPublisherList?.value[value?.endpoint] ?? []) as SelectOption[]
            }
            return [] as SelectOption[]
        })
    }
    Object.assign(rows[index], value)
    emit('update:modelValue', getModelValue())
}

watch(
    () => [props.modelValue, props.totalCap],
    () => {
        const count = props.modelValue?.endpoint?.length ?? 0
        rows.splice(count, rows.length - count)

        for (let i = rows.length; i < count; i++) {
            addRow()
        }

        let totalCap = 0
        getSubPublisherList(props.modelValue?.endpoint ?? [])
        for (let i = 0; i < count; i++) {
            const endpoint = props.modelValue?.endpoint?.[i]
            const daily_cap = props.modelValue?.daily_cap?.[i]
            const sub_publisher_list = props.modelValue?.sub_publisher_list?.[i]
            const row = rows[i] as any
            row.endpoint = endpoint
            row.daily_cap = daily_cap
            row.sub_publisher_list = sub_publisher_list

            if (endpoint) {
                row.sub_publisher_options = computed<SelectOption[]>(() => {
                    if (dataSubPublisherList?.value && dataSubPublisherList?.value[endpoint]) {
                        return (dataSubPublisherList?.value[endpoint] ?? []) as SelectOption[]
                    }
                    return [] as SelectOption[]
                })
            }

            totalCap += parseInt(daily_cap as any) || 0
        }

        if (totalCap > props.totalCap) {
            error.value = 'Sum of allocated caps exceeds total daily cap value by ' + (totalCap - +props.totalCap) + ' caps.'
        } else {
            error.value = undefined
        }
    }
)

onUnmounted(() => {})
</script>

<template>
    <div class="cap-allocation-table column" :class="[layout && 'is-' + layout]">
        <h2 v-if="props.title" class="title is-6 is-narrow is-thin" style="margin: 5px 0">{{ props.title }}</h2>
        <div class="dataTable-wrapper">
            <div class="dataTable-container">
                <table class="dataTable-table table">
                    <thead>
                        <tr>
                            <th scope="col">Traffic Endpoint</th>
                            <th scope="col">Daily Cap</th>
                            <th scope="col">Sub Publishers</th>
                            <th scope="col" style="width: 0"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in rows" :key="index">
                            <td>
                                <Multiselect
                                    :model-value="row.endpoint"
                                    :loading="dictionary.isLoading"
                                    :options="row.options"
                                    :searchable="true"
                                    placeholder="Select Some Option"
                                    @update:model-value="(value: string) => onUpdate(index, {endpoint: value})"
                                />
                            </td>
                            <td>
                                <input
                                    :value="row.daily_cap"
                                    type="text"
                                    class="input"
                                    placeholder=""
                                    autocomplete="off"
                                    @input="(ev: any) => onUpdate(index, {daily_cap: ev.target.value})"
                                />
                            </td>
                            <td>
                                <Multiselect
                                    :model-value="row.sub_publisher_list"
                                    :loading="dictionary.isLoading"
                                    :options="row.sub_publisher_options"
                                    :searchable="true"
                                    :mode="'tags'"
                                    placeholder="Select Some Option"
                                    @update:model-value="(value: string) => onUpdate(index, {sub_publisher_list: value})"
                                />
                            </td>
                            <td style="text-align: right">
                                <VIconButton icon="fas fa-trash" title="Remove" @click="removeRow(index)" />
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3">
                                <span class="error">{{ error }}</span>
                            </td>
                            <td style="text-align: right">
                                <VButton icon="fas fa-plus" title="Add" @click="addRow"></VButton>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.error {
    color: var(--danger);
}
</style>