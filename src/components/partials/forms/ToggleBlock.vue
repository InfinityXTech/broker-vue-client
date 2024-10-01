<script setup lang="ts">
import { computed, ref, watch, inject, watchEffect } from 'vue'
import { isString } from '@vue/shared'
import { forEachProperty, FormComponent, getFormVal, setFormVal } from '/@src/components/partials/Form.vue'
import { LayoutSize } from '/@src/utils/layout-size'
import { toBoolean } from '/@src/utils/helpers'

export type ToggleBlockFunc = (value: boolean) => any

export interface ToggleBlockProps {
    label?: string
    layout?: LayoutSize
    readonly?: boolean
    errors?: string[]
    big?: boolean
    change?: string | ToggleBlockFunc

    data: any
    scheme: FormComponent
}

const props = withDefaults(defineProps<ToggleBlockProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    scheme: undefined,
    readonly: false,
    big: false,
    change: undefined,
})

const dependencies = computed<string[]>(() => {
    const result: Record<string, boolean> = {}
    const queue = [props.scheme]
    while (queue.length > 0) {
        const item = queue.shift()
        forEachProperty(item?.data, (target: string) => (result[target] = true))
        queue.push(...(item?.children ?? []))
    }
    return Object.keys(result)
})

const expanded = ref(false)

const changeFunction = ref<ToggleBlockFunc>()

const onUpdate = (value: boolean) => {
    expanded.value = value
    // eslint-disable-next-line vue/no-mutating-props
    dependencies.value.forEach((x) => {
        // console.log(x)
        setFormVal(props.data, value ? undefined : null, x)
    }) //props.data[x] = value ? undefined : null

    if (props.change && changeFunction.value) {
        changeFunction.value(value)
    }
}

dependencies.value.forEach((x) => {
    if (props.data[x] === undefined) {
        // eslint-disable-next-line vue/no-mutating-props
        props.data[x] = null
    }
})

watchEffect(() => {
    if (props.change) {
        if (isString(props.change)) {
            changeFunction.value = inject(props.change) as ToggleBlockFunc
        } else {
            changeFunction.value = props.change as ToggleBlockFunc
        }
    } else {
        changeFunction.value = (value: boolean) => value

        if (props.data && !expanded.value) {
            expanded.value = dependencies.value.reduce((result: boolean, name: string) => {
                return result || toBoolean(getFormVal(props.data, name))
            }, false)
        }
    }
})

watch(
    () => [dependencies.value.map((x) => getFormVal(props.data, x)), props.errors], //props.data[x]
    () => {
        if (!expanded.value) {
            expanded.value = dependencies.value.reduce((result: boolean, name: string) => {
                return (props.errors ?? []).length > 0 || result || toBoolean(getFormVal(props.data, name)) //props.data[name]
            }, false)
        }
    }
)
</script>

<template>
    <div class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <VField class="inv-field">
            <label v-if="big">{{ props.label }}</label>
            <VControl>
                <VSwitchBlock v-if="big" :model-value="expanded" :readonly="props.readonly" color="primary" @update:model-value="onUpdate" />
                <VSwitchSegment
                    v-else
                    :label-false="props.label"
                    :readonly="props.readonly"
                    :model-value="expanded"
                    color="primary"
                    @update:model-value="onUpdate"
                />
            </VControl>
        </VField>
        <div v-show="expanded" class="inv-column columns is-multiline">
            <slot></slot>
        </div>
    </div>
</template>