<script setup lang="ts">
import { isNumber } from '@vueuse/shared'
import { ref, watch } from 'vue'
import { LayoutSize } from '/@src/utils/layout-size'

export type InputFieldValue = string | number
export interface InputFieldEmits {
    (e: 'update:modelValue', value: InputFieldValue): void
}
export interface InputFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: InputFieldValue
    readonly?: boolean
    errors?: string[]
    classes?: string[]
    focus?: boolean
    required?: boolean
    placeholder?: string
    onlyDigits?: boolean
    default?: any
    minlength?: number
    maxlength?: number
    min?: number
    max?: number
    type?: string
    timeSilence?: boolean
    preSymbol?: string
}

const emit = defineEmits<InputFieldEmits>()
const props = withDefaults(defineProps<InputFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    readonly: false,
    focus: false,
    required: false,
    onlyDigits: false,
    default: undefined,
    minlength: undefined,
    maxlength: undefined,
    min: undefined,
    max: undefined,
    classes: undefined,
    placeholder: '',
    type: 'text',
    timeSilence: false,
    preSymbol: undefined,
})

const inputElement = ref<HTMLInputElement>()

const isNumberCode = (e: any): boolean => {
    var charCode = (e.which ? e.which : e.keyCode) as number
    if (!(charCode >= 65 && charCode <= 90) && !(charCode >= 97 && charCode <= 122) && charCode != 32 && charCode != 8 && !(charCode == 9)) {
        return true
    }
    return false
}

const onKeyPress = ($event: any) => {
    const input = $event?.target

    if (props.onlyDigits) {
        // const keyCode = ($event.keyCode ? $event.keyCode : $event.which) as number
        // const exclude = [46, 190, 1102, 13, 8, 37, 39, 9]
        // // if (keyCode > 31 && (keyCode < 48 || keyCode > 57) && !exclude.some((x: number) => x === keyCode)) {
        // if (!isNumberCode($event) && !exclude.some((x: number) => x === keyCode)) {
        //     $event.preventDefault()
        //     return
        // }
    }
    let value = parseFloat(input.value)
    const max = parseFloat(input.getAttribute('max'))
    const min = parseFloat(input.getAttribute('min'))
    // const minlength = parseInt(input.getAttribute('minlength'))
    const maxlength = parseFloat(input.getAttribute('maxlength'))

    if (props.default != undefined && isNaN(value)) {
        value = props.default
        onUpdate(value)
        $event.preventDefault()
        return
    }

    if (isNumber(maxlength) && maxlength > 0 && value.toString().length > maxlength) {
        value = input.value.slice(0, maxlength)
        onUpdate(value)
        $event.preventDefault()
        return
    }

    if (isNumber(min) && min >= 0 && (isNaN(value) || value < min)) {
        value = min
        onUpdate(value)
        $event.preventDefault()
        return
    }

    if (isNumber(max) && max > 0 && value > max) {
        value = max
        onUpdate(value)
        $event.preventDefault()
        return
    }
}

let timeoutSilence: any = null
const onUpdate = (value: string | number) => {
    value = props.onlyDigits ? parseFloat((value ?? props.default ?? null) as string) : value
    if (isNumber(value) && isNaN(value)) {
        value = ''
    }
    // emit('update:modelValue', value)

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

const onChange = (value: any) => {
    value = props.onlyDigits ? parseFloat((value ?? props.default ?? null) as string) : value
    if (isNumber(value) && isNaN(value)) {
        value = ''
    }

    if (props.timeSilence) {
        if (timeoutSilence != null) {
            clearTimeout(timeoutSilence)
        }
        if (value != props.modelValue) {
            emit('update:modelValue', value)
        }
    }
}

if (props.default != undefined && props.modelValue == undefined) {
    onUpdate(props.default)
}

watch([props, inputElement], () => {
    if (props.focus && inputElement.value) {
        setTimeout(() => {
            if (inputElement.value) {
                inputElement.value.focus()
            }
        }, 100)
    }
})
</script>

<template>
    <input
        v-if="props.type == 'hidden'"
        ref="inputElement"
        :value="props.modelValue"
        :required="props.required"
        :type="props.type"
        :class="['input', ...props.classes]"
        :placeholder="props.placeholder"
        :minlength="props.minlength"
        :maxlength="props.maxlength"
        :min="props.min"
        :max="props.max"
        autocomplete="off"
        :readonly="props.readonly"
        @keypress="onKeyPress($event)"
        @keydown="onKeyPress($event)"
        @keyup="onKeyPress($event)"
        @change="(ev: any) => onChange(ev.target.value)"
        @input="(ev: any) => onUpdate(ev.target.value)"
    />

    <VField
        v-else
        class="input-field column"
        :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout, props.preSymbol && 'is-pre-symbol']"
    >
        <label v-if="props.label">{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <span v-if="props.preSymbol != undefined" class="pre-symbol">{{ props.preSymbol }}</span>
            <input
                ref="inputElement"
                :value="props.modelValue"
                :required="props.required"
                :type="props.type"
                class="input"
                :placeholder="props.placeholder"
                :minlength="props.minlength"
                :maxlength="props.maxlength"
                :min="props.min"
                :max="props.max"
                autocomplete="off"
                :readonly="props.readonly"
                @keypress="onKeyPress($event)"
                @keydown="onKeyPress($event)"
                @keyup="onKeyPress($event)"
                @change="(ev: any) => onChange(ev.target.value)"
                @input="(ev: any) => onUpdate(ev.target.value)"
            />
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style scoped lang="scss">
.input-field {
    &.is-pre-symbol {
        position: relative;

        .pre-symbol {
            line-height: 39px;
            position: absolute;
            left: 10px;
            z-index: 1;
        }

        input {
            padding-left: 18px;
        }
    }
}

input {
    min-width: 180px;
}

input:read-only {
    background-color: var(--fade-grey);
}

.is-dark {
    input:read-only {
        background-color: var(--fade-grey-dark);
    }
}
</style>