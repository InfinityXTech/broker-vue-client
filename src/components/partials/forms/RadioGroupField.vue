<script setup lang="ts">
import { Dictionary, useDictionary } from '/@src/composable/useDictionary'
import { LayoutSize } from '/@src/utils/layout-size'

export interface RadioGroupFieldEmits {
    (e: 'update:modelValue', value: string | number | boolean): void
}
export interface RadioGroupFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: string | number
    options?: Dictionary
    readonly?: boolean
    inline?: boolean
}

let instances = 0

const emit = defineEmits<RadioGroupFieldEmits>()
const props = withDefaults(defineProps<RadioGroupFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    options: undefined,
    readonly: false,
    inline: false,
})

const dictionary = useDictionary().load(props.options)
const onUpdate = (value: string | number) => emit('update:modelValue', value)
const groupId = `radio-group-field-${++instances}`
</script>

<template>
    <VField :class="['radio-group-field', 'column', props.label?.trim().replace(/ /g, '-').toLowerCase(), props.inline && 'is-inline']">
        <label>{{ props.label }}</label>
        <VControl>
            <div v-for="(item, index) in dictionary.options" :key="index" class="radio-item">
                <VField class="" :class="[item.color && 'is-' + item.color]">
                    <VRadio
                        :name="groupId"
                        :model-value="
                            props.modelValue != undefined ? props.modelValue : typeof item.default == 'boolean' ? item.default.toString() : item.default
                        "
                        :label="item.label"
                        :color="item.color"
                        :value="item.value"
                        :disabled="item.disabled"
                        :readonly="props.readonly"
                        square
                        solid
                        @update:model-value="onUpdate"
                    />
                </VField>
            </div>
        </VControl>
    </VField>
</template>
<style lang="scss">
.radio-group-field {
    &.is-inline {
        .radio-item {
            display: inline-block;

            .field > label {
                width: auto;
            }
        }
    }
}
</style>