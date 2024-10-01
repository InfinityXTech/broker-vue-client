<script setup lang="ts">
import { computed } from 'vue'
import { LayoutSize } from '/@src/utils/layout-size'

export type DateTimeFieldValue = { $date: { $numberLong: number } }
export interface DateTimeFieldEmits {
    (e: 'update:modelValue', value: DateTimeFieldValue): void
}
export interface DateTimeFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: DateTimeFieldValue | Date
    readonly?: boolean
    errors?: string[]
}

const emit = defineEmits<DateTimeFieldEmits>()
const props = withDefaults(defineProps<DateTimeFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    readonly: false,
})

const onUpdate = (value: Date) => emit('update:modelValue', { $date: { $numberLong: +value } })
const datetime = computed<Date | null>(() => {
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
        <VDatePicker
            :model-value="datetime"
            color="green"
            mode="dateTime"
            trim-weeks
            is24hr
            :model-config="modelConfig"
            :masks="modelConfig.masks"
            @update:model-value="onUpdate"
        >
            <template #default="{ inputValue, inputEvents }">
                <VField>
                    <label>{{ props.label }}</label>
                    <VControl icon="feather:calendar" :has-error="!!errors">
                        <input class="input" type="text" placeholder="Select a date and time" :value="inputValue" v-on="inputEvents" />
                        <span v-if="!!errors" class="help-text">
                            <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
                        </span>
                    </VControl>
                </VField>
            </template>
        </VDatePicker>
    </div>
</template>