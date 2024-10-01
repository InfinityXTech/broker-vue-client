<route lang="yaml">
meta:
    requiresAuth: true
</route>
<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { checkBrokerAccess } from '/@src/utils/broker/access'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()
checkBrokerAccess(props.id)

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Billing')
</script>
<template>
    <SidemenuTabs menu-id="billing-tabs" />
    <RouterView />
</template>