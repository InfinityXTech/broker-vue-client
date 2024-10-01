<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { Dictionary, SelectOption, useDictionary } from '/@src/composable/useDictionary'
import { LayoutSize } from '/@src/utils/layout-size'
import VButton from '/@src/components/base/button/VButton.vue'

export interface TwoSideMultiSelectEmit {
    (e: 'update:modelValue', data: string[]): void
}
export interface TwoSideMultiSelectProps {
    label?: string
    layout?: LayoutSize
    modelValue?: string[]
    errors?: string[]
    options: Dictionary
}

const emit = defineEmits<TwoSideMultiSelectEmit>()
const props = withDefaults(defineProps<TwoSideMultiSelectProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
})

const dictionary = useDictionary().load(props.options)

const selected = ref<string[]>([])

const dataEnabled = computed<SelectOption[]>(() => dictionary.options.filter((opt: SelectOption) => props.modelValue?.indexOf(opt.value) >= 0 ?? false))
const dataDisabled = computed<SelectOption[]>(() =>
    dictionary.options.filter((opt: SelectOption) => (props.modelValue ? props.modelValue?.indexOf(opt.value) < 0 : true))
)

const onDisable = async function () {
    const hash: Record<string, null> = {}
    props.modelValue?.forEach((x) => (hash[x] = null))
    selected.value.forEach((x) => delete hash[x])
    emit('update:modelValue', Object.keys(hash))
}

const onEnable = async function () {
    const hash: Record<string, null> = {}
    props.modelValue?.forEach((x) => (hash[x] = null))
    selected.value.forEach((x) => (hash[x] = null))
    emit('update:modelValue', Object.keys(hash))
}

onUnmounted(() => {
    selected.value = []
})
</script>

<template>
    <VField :class="['column', props.label?.trim().replace(/ /g, '-').toLowerCase(), props.layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <VField class="column is-4">
                <select v-model="selected" multiple class="input">
                    <option v-for="item in dataDisabled" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
            </VField>
            <VField class="column is-4" style="text-align: center">
                <div style="width: 65px; display: inline-block">
                    <VButton @click="onEnable" v-text="'>>'" />
                    <VButton @click="onDisable" v-text="'<<'" />
                </div>
            </VField>
            <VField class="column is-4">
                <select v-model="selected" multiple class="input">
                    <option v-for="item in dataEnabled" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
            </VField>
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style lang="scss">
.field.column {
    // display: inline-block;
    float: left;
}

.field.column select {
    height: 200px;
}

.field.column select option {
    padding: 5px;
    font-size: 14px;
}

.field.column button {
    display: block;
}
</style>