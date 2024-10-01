<route lang="yaml">
    meta:
    requiresAuth: true
</route>
<script setup lang="ts">
</script>
<template>
    <SidebarLayout :open-on-mounted="false">
        <RouterView />
    </SidebarLayout>
</template>