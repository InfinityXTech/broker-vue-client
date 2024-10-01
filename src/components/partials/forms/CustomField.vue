<script setup lang="ts">
import { computed, inject, VNode } from 'vue'
import { LayoutSize } from '/@src/utils/layout-size'

export type CustomFieldRenderFunc = (props: CustomFieldProps) => VNode
export interface CustomFieldEmits {
    (e: 'update:modelValue', value: any): void
}
export interface CustomFieldProps {
    renderFunc: string
    label?: string
    layout?: LayoutSize
    modelValue?: any
    readonly?: boolean
    errors?: string[]
}

const emit = defineEmits<CustomFieldEmits>()
const props = withDefaults(defineProps<CustomFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    readonly: false,
})

const renderFunc = computed(() => inject(props.renderFunc) as CustomFieldRenderFunc)
</script>

<template>
    <VField class="column" :class="[layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <component :is="renderFunc(props)" :model-value="props.modelValue" @update:model-value="(value: any) => emit('update:modelValue', value)" />
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style scoped lang="scss">
input:read-only {
    background-color: var(--fade-grey);
}

.is-dark {
    input:read-only {
        background-color: var(--fade-grey-dark);
    }
}
</style>