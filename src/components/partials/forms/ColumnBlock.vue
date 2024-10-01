<script setup lang="ts">
import { LayoutSize } from '/@src/utils/layout-size'

export interface ColumnBlockProps {
    layout?: LayoutSize
}
const props = defineProps<ColumnBlockProps>()
</script>

<template>
    <div class="column" :class="[props.layout && 'is-' + layout]">
        <div class="inv-column columns is-multiline">
            <slot></slot>
        </div>
    </div>
</template>