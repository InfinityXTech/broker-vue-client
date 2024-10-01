<script setup lang="ts">
import { Dictionary, SelectOption, useDictionary } from '/@src/composable/useDictionary'
import { LayoutSize } from '/@src/utils/layout-size'
import { toArray } from '/@src/utils/helpers'
import { computed, watch } from 'vue'
import { VButtonColor, VIconProps } from '../../base/button/VButton.vue'

export interface TogglesFieldEmits {
    (e: 'update:modelValue', value: string[]): void
}
export interface FieldIcon {
    icon: string
    iconProps: VIconProps
}
export interface TogglesFieldProps {
    label?: string
    layout?: LayoutSize
    multiSelect?: boolean
    modelValue?: string[]
    errors?: string[]
    options: Dictionary
}

const emit = defineEmits<TogglesFieldEmits>()
const props = withDefaults(defineProps<TogglesFieldProps>(), {
    label: '',
    layout: '12',
    multiSelect: true,
    modelValue: undefined,
    errors: undefined,
})

const dictionary = useDictionary().load(props.options)

const modelValue = computed(() => toArray(props.modelValue))
const options = computed(() => dictionary.options)

const getColor = (opt: SelectOption) => {
    if (props.multiSelect === false && opt.value == '' && modelValue.value.length == 0) {
        return opt.color as VButtonColor
    }
    return modelValue.value.indexOf(opt.value) >= 0 ? (opt.color as VButtonColor) : undefined
}
const onSelect = (opt: SelectOption) => {
    let values = []
    if (props.multiSelect === false) {
        values.push(opt.value)
    } else {
        values = [...modelValue.value]
        const index = values.indexOf(opt.value)
        if (index < 0) {
            values.push(opt.value)
        } else {
            values.splice(index, 1)
        }
    }
    emit('update:modelValue', values)
}

const initialize = () => {
    if (props.modelValue === undefined && options.value.length > 0) {
        const values = options.value.filter((opt: SelectOption) => opt.default).map((opt: SelectOption) => opt.value)
        emit('update:modelValue', values)
    }
}
watch([dictionary.options, modelValue], initialize)
setTimeout(initialize, 0)
</script>

<template>
    <VField class="toggle-buttons column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <div class="columns is-mobile">
                <div v-for="opt in options" :key="opt.value" class="column item">
                    <VButton
                        :outlined="opt.outlined == undefined ? false : opt.outlined"
                        fullwidth
                        :class="['btn-' + opt.label?.trim().toLowerCase().replace(/ /g, '-'), modelValue.indexOf(opt.value) >= 0 ? 'active' : 'inactive']"
                        :icon="opt?.icon?.name"
                        :icon-props="opt?.icon?.iconProps"
                        :color="getColor(opt)"
                        @click="onSelect(opt)"
                        >{{ opt.label }}</VButton
                    >
                </div>
            </div>
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style scoped lang="scss">
.toggle-buttons {
    .item {
        &:not(:first-child) {
            padding-left: 2px;
        }

        &:not(:last-child) {
            padding-right: 0;
        }
    }

    .toggles-icon {
        font-size: 25px;
    }

    .button {
        display: flex !important;
        align-items: center;
        justify-content: center;
    }

    .button.is-outlined {
        background: none !important;
    }

    .button:focus,
    .button:hover {
        box-shadow: none !important;
        color: #363636 !important;
    }

    .button:not(.is-primary):not(.is-info):not(.is-success):not(.is-danger):not(.is-white):not(.is-dark):not(.is-light):not(.is-warning):not(.is-grey):focus {
        border-color: var(--border);
    }
}
</style>
