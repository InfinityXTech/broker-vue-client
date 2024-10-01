<script setup lang="ts">
import { inject } from 'vue'
import { isString } from '@vue/shared'
import { VButtonColor, VButtonSize } from '/@src/components/base/button/VButton.vue'

export type ButtonFieldFunc = () => void

export interface ButtonFieldProps {
    label?: string
    layout?: string
    icon?: string
    click: string | ButtonFieldFunc
    color?: VButtonColor
    size?: VButtonSize
    tag?: 'button' | 'a'
}

const props = withDefaults(defineProps<ButtonFieldProps>(), {
    label: '',
    layout: '12',
    icon: undefined,
    color: 'primary',
    tag: 'button',
    size: undefined,
})

const func = isString(props.click) ? (inject(props.click) as ButtonFieldFunc) : props.click
console.assert(func != null, 'click method is not defined', props)

const onClick = async () => {
    if (func) {
        func()
    }
}
</script>

<template>
    <VField
        class="field button-field column"
        :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout, props.tag && 'tag-' + props.tag]"
    >
        <label v-if="props.label"></label>
        <VControl>
            <VButton :color="props.color" :icon="props.icon" elevated @click="onClick()">
                <slot></slot>
                {{ props.label }}
            </VButton>
        </VControl>
    </VField>
</template>

<style lang="scss">
.button-field {
    &.tag-a button {
        background: none;
        border: 0;
        padding: 0;
        border-radius: 0;
        box-shadow: none !important;
        display: inline-block !important;

        span {
            border-bottom: 1px dashed var(--light-text);
        }

        &.is-primary {
            color: var(--light-text);
        }

        &:hover {
            background: none;

            span {
                border-bottom: 1px dashed var(--light-text);
            }
        }
    }

    .button.mode-form {
        display: inline-block !important;
    }
}

html.is-dark body .app-wrapper {
    .api-button {
        &.tag-a button {
            background: none;
            box-shadow: none !important;
        }
    }
}
</style>
