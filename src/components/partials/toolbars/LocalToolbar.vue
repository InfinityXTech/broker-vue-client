<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const mounted = ref(false)
onMounted(() => (mounted.value = true))
onUnmounted(() => (mounted.value = false))
</script>

<template>
    <Teleport v-if="mounted" to="#toolbar">
        <slot></slot>
    </Teleport>
</template>