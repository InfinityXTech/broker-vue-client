<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'
import { checkBrokerAccess } from '/@src/utils/broker/access'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const api = useApi()
api.get('/traffic_endpoint/' + props.id).then((response: any) => {
    checkBrokerAccess(response?.data)
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Support Tickets')
})
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />
    <SupportTickets :filter="{ traffic_endpoint: props.id }" />
</template>
