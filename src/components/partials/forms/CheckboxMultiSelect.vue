<script setup lang="ts">
import { computed, ref } from 'vue'
import { Dictionary, SelectOption, useDictionary } from '/@src/composable/useDictionary'
import { LayoutSize } from '/@src/utils/layout-size'

export interface CheckboxMultiSelectEmit {
    (e: 'update:modelValue', data: string[]): void
}
export interface CheckboxMultiSelectProps {
    label?: string
    layout?: LayoutSize
    modelValue?: string[]
    errors?: string[]
    options: Dictionary
    columns: number
    canSearch?: boolean
    canSelectAll?: boolean
}

const emit = defineEmits<CheckboxMultiSelectEmit>()
const props = withDefaults(defineProps<CheckboxMultiSelectProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    canSearch: true,
    canSelectAll: true,
})

const dictionary = useDictionary().load(props.options)
const options = computed<SelectOption[]>(() => dictionary.options)
const width = computed(() => 'width: ' + 100 / props.columns + '%')
const search = ref('')

const selectAll = computed({
    get: () => (options.value.every((opt) => props.modelValue.indexOf(opt.value) >= 0) ? ['all'] : []),
    set: (value) => emit('update:modelValue', value.length ? options.value.map((opt) => opt.value) : []),
})
</script>

<template>
    <VField class="column" :class="[layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <div class="columns is-multiline">
                <input v-if="canSearch" v-model="search" type="text" class="input column is-12" placeholder="Search for column" autocomplete="off" />
                <VCheckbox
                    v-if="canSelectAll"
                    v-model="selectAll"
                    class="column is-12 py-3 mb-3 checkbox-select-all"
                    value="all"
                    color="primary"
                    label="Select All"
                />
            </div>
            <div class="columns is-multiline">
                <VCheckbox
                    v-for="option in options"
                    v-show="option.label.toLowerCase().indexOf(search.toLowerCase()) >= 0"
                    :key="option.value"
                    class="column is-narrow py-1"
                    :style="width"
                    color="primary"
                    :value="option.value"
                    :label="option.label"
                    :model-value="props.modelValue"
                    @update:model-value="(value) => emit('update:modelValue', value as string[])"
                />
            </div>
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style lang="scss">
.checkbox-select-all {
    border-bottom: 1px solid var(--fade-grey-dark-3);
}

.is-dark {
    .checkbox-select-all {
        border-color: var(--dark-sidebar-light-12);
    }
}
</style>