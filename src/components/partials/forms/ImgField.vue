<script setup lang="ts">
import { LayoutSize } from '/@src/utils/layout-size'

export interface ImgFieldEmits {
    (e: 'update:modelValue', value: string): void
}
export interface ImgFieldProps {
    label?: string
    layout?: LayoutSize
    width?: number
    modelValue?: string
    squared?: boolean
    pictureDark?: boolean
    errors?: string[]
}

// const emit = defineEmits<ImgFieldEmits>()
const props = withDefaults(defineProps<ImgFieldProps>(), {
    label: '',
    layout: '12',
    width: undefined,
    modelValue: undefined,
    errors: undefined,
    readonly: false,
})
</script>

<template>
    <VField class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <img
                class="avatar"
                :class="[props.squared && 'is-squared', props.pictureDark && 'light-image']"
                :src="props.modelValue"
                alt=""
                :style="[props.width && 'width: ' + props.width + 'px']"
            />
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style scoped lang="scss">
</style>