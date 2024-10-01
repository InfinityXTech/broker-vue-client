<script setup lang="ts">
import { LayoutSize } from '/@src/utils/layout-size'

export interface WideVerticalBlockProps {
    title: string
    layout?: LayoutSize,
    style?: string
}

const props = withDefaults(defineProps<WideVerticalBlockProps>(), {
    layout: '12',
})
</script>

<template>
    <div class="column" :class="[props.title?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <h2>{{ props.title }}</h2>
        <div class="wide-vertical-block" :style="props.style">
            <div class="columns is-multiline">
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@import '../../../scss/abstracts/mixins';

h2 {
    font-family: var(--font-alt);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--dark-text);
    margin-bottom: 1rem;

    &:not(:first-child) {
        margin-top: 2rem;
    }
}

.wide-vertical-block {
    @include vuero-s-card;

    .field {
        margin: 0;

        > label {
            display: inline-block;
            width: 30%;
            font-family: var(--font-alt);
            font-size: 1rem;
            color: var(--dark-text) !important;
            vertical-align: top;
            padding: 0.6em 0;
        }

        > .control {
            display: inline-block;
            width: 70%;
        }

        .radio {
            padding: 0.6em 2em 0.6em 0;
        }

        .form-switch {
            padding: 5px 0;
        }
    }
}

.is-dark {
    .wide-vertical-block {
        @include vuero-card--dark;
    }
}
</style>