<script setup lang="ts">
import { isString } from '@vue/shared'
import { computed, inject, ref, watchEffect } from 'vue'
import { forEachProperty, FormComponent } from '/@src/components/partials/Form.vue'
import { toBoolean } from '/@src/utils/helpers'
import { isEmpty } from '/@src/utils/helpers'
import { LayoutSize } from '/@src/utils/layout-size'

export type CurrentValueFunc = (value: any, data: any) => any
export interface ConditionalBlockProps {
    function?: string | CurrentValueFunc
    values?: any[]
    not?: boolean
    layout?: LayoutSize
    modelValue?: any

    data: any
    scheme: FormComponent
}

const props = withDefaults(defineProps<ConditionalBlockProps>(), {
    layout: '12',
    function: undefined,
    values: undefined,
    modelValue: undefined,
})

const getCurrent = computed(() => {
    if (!props.function) {
        return (value: any) => value
    }
    if (isString(props.function)) {
        switch (props.function) {
            case 'toBoolean': {
                return toBoolean
            }
            case 'isEmpty': {
                return isEmpty
            }
            default: {
                return inject(props.function) as CurrentValueFunc
            }
        }
    }
    return props.function
})

const values = computed(() => props.values ?? [true])

const dependencies = computed<string[]>(() => {
    const result: Record<string, boolean> = {}
    const queue = [...(props.scheme.children ?? [])]
    while (queue.length > 0) {
        const item = queue.shift()
        forEachProperty(item?.data, (target) => (result[target] = true))
        queue.push(...(item?.children ?? []))
    }
    forEachProperty(props.scheme.data, (target) => delete result[target])
    return Object.keys(result)
})

const v = values.value.indexOf(getCurrent.value(props.modelValue, props.data))
const expanded = ref(props.not === true ? v < 0 : v >= 0)
watchEffect(() => {
    const v = values.value.indexOf(getCurrent.value(props.modelValue, props.data))
    expanded.value = props.not === true ? v < 0 : v >= 0

    if (!expanded.value) {
        // eslint-disable-next-line vue/no-mutating-props
        dependencies.value.forEach((x) => (props.data[x] = undefined))
    }
})
</script>

<template>
    <div v-show="expanded" class="column" :class="[layout && 'is-' + layout]">
        <div class="inv-column columns is-multiline">
            <slot></slot>
        </div>
    </div>
</template>