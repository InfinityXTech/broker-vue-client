<script setup lang="ts">
import { Dictionary, SelectOption, useDictionary } from '/@src/composable/useDictionary'
import { LayoutSize } from '/@src/utils/layout-size'
import { toArray } from '/@src/utils/helpers'
import { computed, watch, ref } from 'vue'
import Multiselect from '@vueform/multiselect'

export interface SelectFieldEmits {
    (e: 'update:modelValue', value: SelectFieldValue): void
}
export interface SelectFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: SelectFieldValue
    errors?: string[]
    options: Dictionary
    mode?: 'single' | 'multiple' | 'tags'
    default?: boolean
    readonly?: boolean
    required?: boolean
    only_active?: boolean
}
export type SelectFieldValue = number | string | string[]

const emit = defineEmits<SelectFieldEmits>()
const props = withDefaults(defineProps<SelectFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    mode: 'single',
    default: true,
    readonly: false,
    required: false,
    only_active: false,
})

const dictionary = useDictionary().load(props.options)

const modelValue = computed(() => (props.mode != 'single' ? toArray(props.modelValue) : props.modelValue))
const options = computed(() => {
    if (props.mode == 'tags') {
        return toArray(props.modelValue).map((x: string) => {
            return { label: x, value: x }
        })
    }
    if (props.only_active) {
        return dictionary.options.filter((item: any) => item.active || props.modelValue == item.value)
    }
    return dictionary.options
})
const onUpdate = (value: SelectFieldValue) => {
    emit('update:modelValue', value)
    if (props.mode == 'tags' || props.mode == 'multiple') {
        setTimeout(() => {
            selectElement.value?.focus()
            // selectElement.value?.input?.focus()
        }, 10)
    }
}

const selectElement = ref<any>()

if (props.mode == 'single' && !props.default) {
    const initialize = () => {
        if (modelValue.value === undefined && options.value?.length > 0) {
            const option = options.value?.find((opt: SelectOption) => opt.default) ?? options.value[0]
            emit('update:modelValue', option.value)
        }
    }
    watch([options, modelValue], initialize)
    setTimeout(initialize, 0)
}
</script>

<template>
    <VField class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <Multiselect
                ref="selectElement"
                :model-value="modelValue"
                :loading="dictionary.isLoading"
                :options="options"
                :disabled="props.readonly"
                :searchable="true"
                :can-clear="props.default"
                :can-deselect="props.default"
                :allow-empty="!props.required"
                :mode="props.mode == 'single' ? 'single' : 'tags'"
                :create-tag="props.mode == 'tags'"
                :placeholder="props.mode == 'single' ? 'Select Some Option' : 'Select Some Options'"
                :no-options-text="props.mode == 'tags' ? '' : 'The list is empty'"
                :no-results-text="props.mode == 'tags' ? '' : 'No results found'"
                @update:model-value="onUpdate"
            />
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style lang="scss">
.multiselect {
    min-width: 180px !important;
    min-height: 38px !important;
}
</style>