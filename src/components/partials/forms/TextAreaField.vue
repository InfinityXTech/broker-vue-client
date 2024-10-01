<script setup lang="ts">
import { LayoutSize } from '/@src/utils/layout-size'

export interface TextAreaFieldEmits {
    (e: 'update:modelValue', value: string): void
}
export interface TextAreaFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: string
    readonly?: boolean
    required?: boolean
    rows?: number
    placeholder?: string
    errors?: string[]
    timeSilence?: boolean
}

const emit = defineEmits<TextAreaFieldEmits>()
const props = withDefaults(defineProps<TextAreaFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    readonly: false,
    required: false,
    placeholder: '',
    rows: 1,
    timeSilence: false,
})

let timeoutSilence: any = null
const onChange = (value: any) => {
    if (props.timeSilence) {
        if (timeoutSilence != null) {
            clearTimeout(timeoutSilence)
        }
        if (value != props.modelValue) {
            emit('update:modelValue', value)
        }
    }
}
const onInputChange = (value: any) => {
    if (props.timeSilence) {
        if (timeoutSilence != null) {
            clearTimeout(timeoutSilence)
        }
        timeoutSilence = setTimeout(() => {
            if (value != props.modelValue) {
                emit('update:modelValue', value)
            }
        }, 2000)
    } else {
        emit('update:modelValue', value)
    }
}
</script>

<template>
    <VField class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <textarea
                :value="props.modelValue"
                type="text"
                class="textarea"
                :placeholder="props.placeholder"
                autocomplete="off"
                :readonly="props.readonly"
                :required="props.required"
                :rows="props.rows"
                @input="(ev: any) => onInputChange(ev.target.value)"
                @change="(ev: any) => onChange(ev.target.value)"
            ></textarea>
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style scoped lang="scss">
textarea {
    resize: vertical;
}

textarea:read-only {
    background-color: var(--fade-grey);
}

.is-dark {
    textarea:read-only {
        background-color: var(--fade-grey-dark);
    }
}
</style>
