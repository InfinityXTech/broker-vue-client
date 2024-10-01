<script setup lang="ts">
export interface SidebarLinkProps {
    to: any
    tooltip?: string
}

const props = defineProps<SidebarLinkProps>()
</script>

<template>
    <Tippy placement="right">
        <RouterLink v-bind="props">
            <slot></slot>
        </RouterLink>
        <template v-if="props.tooltip" #content>{{ tooltip }}</template>
    </Tippy>
</template>