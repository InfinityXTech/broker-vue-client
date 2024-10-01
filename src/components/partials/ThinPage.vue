<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'

export interface ThinPageProps {
    title?: string
}

const props = defineProps<ThinPageProps>()

if (props.title) {
    const viewWrapper = useViewWrapper()
    viewWrapper.setPageTitle(props.title)
}
</script>

<template>
    <div class="thin-page-wrapper">
        <template v-if="!!$slots.default">
            <slot></slot>
        </template>
        <template v-else>
            <slot name="content"></slot>

            <VButtons class="mt-6" align="centered">
                <slot name="action"></slot>
            </VButtons>
        </template>
    </div>
</template>

<style lang="scss">
.thin-page-wrapper {
    max-width: 1024px;
    margin: 0 auto;
}
</style>
