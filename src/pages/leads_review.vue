<route lang="yaml">
meta:
    requiresAuth: true
</route>
<script setup lang="ts">
import { useViewWrapper } from '../stores/viewWrapper'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Leads Review')
</script>
<template>
    <SidebarLayout>
        <RouterView />
    </SidebarLayout>
</template>