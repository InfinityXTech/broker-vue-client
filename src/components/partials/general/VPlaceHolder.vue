<script setup lang="ts">
export interface VPlaceHolderProps {
    title: string
    content: string
}

const props = defineProps<VPlaceHolderProps>()
</script>

<template>
    <span class="placeholder-container">
        <Tippy interactive>
            <span>
                {{ props.title }}
            </span>
            <template #content>
                {{ props.content }}
            </template>
        </Tippy>
    </span>
</template>
<style lang="scss">
.placeholder-container {
    div * {
        color: black !important;
    }
}
</style>
