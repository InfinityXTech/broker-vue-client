<script setup lang="ts">
import { LayoutSize } from '/@src/utils/layout-size'
import { inject } from 'vue'
import { isString } from '@vue/shared'

export type AFieldFunc = () => void

export interface AFieldProps {
    label?: string
    title?: string
    layout?: LayoutSize
    modelValue?: string
    styles?: string[]
    target?: string
    click?: string
}

const props = withDefaults(defineProps<AFieldProps>(), {
    label: '',
    title: '',
    layout: '12',
    modelValue: undefined,
    styles: undefined,
    target: undefined,
    click: undefined,
})

const func = isString(props.click) ? (inject(props.click) as AFieldFunc) : props.click
// console.assert(func != null, 'click method is not defined', props)

const onClick = async () => {
    if (func) {
        func()
    }
}
</script>

<template>
    <VField class="column" :class="['a-field', props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]" :style="props.styles">
        <label>{{ props.label }}</label>
        <VControl>
            <a :href="props.modelValue" :style="props.styles" :target="props.target" @click="onClick()">{{ props.title }}</a>
        </VControl>
    </VField>
</template>

<style scoped lang="scss">
.field {
    &.column {
        &.a-field {
            a {
                color: var(--link);
                border-bottom: 1px dashed var(--link);
            }
        }
    }
}
</style>