<script setup lang="ts">
import { computed } from 'vue'
import { toBoolean } from '/@src/utils/helpers'
import { LayoutSize } from '/@src/utils/layout-size'

export interface ToggleSwitchFieldEmits {
    (e: 'update:modelValue', value: boolean): void
}
export interface ToggleSwitchFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: any
    readonly?: boolean
    inline?: boolean
}

const emit = defineEmits<ToggleSwitchFieldEmits>()
const props = withDefaults(defineProps<ToggleSwitchFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    readonly: false,
    inline: false,
})

const modelValue = computed(() => toBoolean(props.modelValue))
const onUpdate = (value: boolean) => emit('update:modelValue', value)
</script>

<template>
    <VField class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label v-if="!inline">{{ props.label }}</label>
        <VControl>
            <VSwitchBlock v-if="!inline" :readonly="props.readonly" :model-value="modelValue" color="primary" @update:model-value="onUpdate" />
            <VSwitchSegment
                v-else
                :readonly="props.readonly"
                :label-false="props.label"
                :model-value="modelValue"
                color="primary"
                @update:model-value="onUpdate"
            />
        </VControl>
    </VField>
</template>
