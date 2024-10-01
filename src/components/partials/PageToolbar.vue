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
    <div class="page-toolbar list-flex-toolbar">
        <div class="column">
            <slot name="content"></slot>
        </div>

        <VButtons>
            <div class="field column">
                <label>&nbsp;</label>
                <div class="control">
                    <slot name="action"></slot>
                </div>
            </div>
        </VButtons>
    </div>
</template>

<style scoped lang="scss">
.list-flex-toolbar {
    align-items: center;
}

.list-flex-toolbar > .column {
    padding-top: 0;
    padding-left: 0;
    padding-bottom: 0;
}

.buttons > .column {
    padding-top: 0;
    padding-right: 0;
    padding-bottom: 0;

    > .control {
        margin-right: 0;
    }
}
</style>