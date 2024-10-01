<script setup lang="ts">
export interface ToolbarItemProps {
    icon: string
    title?: string
    isLoading?: boolean
}

const props = withDefaults(defineProps<ToolbarItemProps>(), {
    title: undefined,
    isLoading: undefined,
})
</script>

<template>
    <VLoader :active="props.isLoading" size="small" :translucent="true">
        <a :class="['toolbar-link', 'right-panel-trigger', props.title?.trim().replace(/ /g, '-').toLowerCase()]" :aria-label="props.title" tabindex="0">
            <VIcon :icon="props.icon" :title="props.title" />
        </a>
    </VLoader>
</template>

<style lang="scss">
.toolbar-link.right-panel-trigger {
    font-size: 17px;
}
</style>