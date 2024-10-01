<script setup lang="ts">
import { computed } from 'vue'
import { LayoutSize } from '/@src/utils/layout-size'

export type DateFieldValue = { $date: { $numberLong: number } }
export interface DateFieldEmits {
    (e: 'update:modelValue', value: DateFieldValue): void
}
export interface DateFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: DateFieldValue | Date
    readonly?: boolean
    errors?: string[]
}

const emit = defineEmits<DateFieldEmits>()
const props = withDefaults(defineProps<DateFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    readonly: false,
})

const onUpdate = (value: Date) => emit('update:modelValue', { $date: { $numberLong: +value } })
const date = computed(() => {
    if (props.modelValue instanceof Date) {
        return props.modelValue
    } else if (props.modelValue?.$date) {
        return new Date(+props.modelValue?.$date?.$numberLong)
    }
    return null
})

const Format = 'DD.MM.YYYY' //'YYYY-MM-DD'

const modelConfig = {
    // type: 'string',
    mask: Format, // Uses 'iso' if missing
    masks: {
        input: Format,
        L: Format,
    },
}
</script>

<template>
    <div class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <VDatePicker :model-value="date" color="green" trim-weeks :model-config="modelConfig" :masks="modelConfig.masks" @update:model-value="onUpdate">
            <template #default="{ inputValue, inputEvents }">
                <VField>
                    <label>{{ props.label }}</label>
                    <VControl icon="feather:calendar" :has-error="!!errors">
                        <input class="input" type="text" placeholder="Select a date" :value="inputValue" v-on="inputEvents" />
                        <span v-if="!!errors" class="help-text">
                            <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
                        </span>
                    </VControl>
                </VField>
            </template>
        </VDatePicker>
    </div>
</template>