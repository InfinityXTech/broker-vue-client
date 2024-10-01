<route lang="yaml">
meta:
    requiresAuth: true
</route>
<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'

export interface MasterProps {
    id: string
}

defineProps<MasterProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Billing')
</script>
<template>
    <SidemenuTabs menu-id="billing-tabs" />
    <RouterView />
</template>