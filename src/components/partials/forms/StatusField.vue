<script lang="ts">
import { LayoutSize } from '/@src/utils/layout-size'
import { VRadioColor } from '/@src/components/base/form/VRadio.vue'
import { computed } from 'vue'

let instances = 0
</script>

<script setup lang="ts">
export interface StatusFieldEmits {
    (e: 'update:modelValue', value: string | number): void
}
export interface StatusFieldValue {
    value: any
    color?: VRadioColor
    label: string
}
export type StatusFieldValues = Array<StatusFieldValue>
export interface StatusFieldProps {
    label?: string
    layout?: LayoutSize
    default?: string | number
    modelValue?: string | number
    readonly?: boolean
    values?: StatusFieldValues
}

const emit = defineEmits<StatusFieldEmits>()
const props = withDefaults(defineProps<StatusFieldProps>(), {
    label: '',
    layout: '12',
    default: undefined,
    modelValue: undefined,
    readonly: false,
    values: () => [
        { value: '1', label: 'Active', color: 'primary' },
        { value: '0', label: 'Inactive', color: 'warning' },
        { value: '2', label: 'Archived' },
    ],
})

const modelValue = computed(() => props.modelValue ?? props.default)

const onUpdate = (value: string | number) => emit('update:modelValue', value)
const groupId = `status-field-${++instances}`

if (props.default != undefined) {
    onUpdate(props.default)
}
</script>

<template>
    <VField class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl>
            <VRadio
                v-for="(item, key) in props.values"
                :key="key"
                :name="groupId"
                :model-value="modelValue"
                :readonly="props.readonly"
                :value="item.value"
                :label="item.label"
                :color="item.color"
                square
                solid
                @update:model-value="onUpdate"
            />
            <!-- <VRadio :name="groupId" :model-value="modelValue" value="1" label="Active" color="primary" square solid @update:model-value="onUpdate" /> -->
            <!-- <VRadio :name="groupId" :model-value="modelValue" value="0" label="Inactive" color="warning" square solid @update:model-value="onUpdate" /> -->
            <!-- <VRadio :name="groupId" :model-value="modelValue" value="2" label="Archived" square solid @update:model-value="onUpdate" /> -->
        </VControl>
    </VField>
</template>
