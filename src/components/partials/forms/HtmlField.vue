<script setup lang="ts">
import { computed } from 'vue'
import { LayoutSize } from '/@src/utils/layout-size'

export interface HtmlFieldProps {
    html: string
    modelValue?: string
    label?: string
    layout?: LayoutSize
    errors?: undefined
}
const props = withDefaults(defineProps<HtmlFieldProps>(), {
    label: undefined,
    layout: '12',
    html: undefined,
    modelValue: undefined,
    errors: undefined,
})
const html = computed(() => props.html ?? props.modelValue)
</script>

<template>
    <VField v-if="props.label" class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <span v-html="html" />
        </VControl>
    </VField>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <span v-else v-html="html" />
</template>