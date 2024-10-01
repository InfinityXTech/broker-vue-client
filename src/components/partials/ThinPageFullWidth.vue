<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'

export interface ThinPageFullWidthProps {
    title?: string
}

const props = defineProps<ThinPageFullWidthProps>()

if (props.title) {
    const viewWrapper = useViewWrapper()
    viewWrapper.setPageTitle(props.title)
}
</script>

<template>
    <template v-if="!!$slots.default">
        <slot></slot>
    </template>
    <template v-else>
        <slot name="content"></slot>

        <VButtons class="mt-6" align="centered">
            <slot name="action"></slot>
        </VButtons>
    </template>
</template>