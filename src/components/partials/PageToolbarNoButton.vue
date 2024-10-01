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
    <div>
        <div class="page-toolbar-no-button list-flex-toolbar">
            <div class="column">
                <slot name="content"></slot>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.list-flex-toolbar > .column {
    padding: 0;
}
</style>