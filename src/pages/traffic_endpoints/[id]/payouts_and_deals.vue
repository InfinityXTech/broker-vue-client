<script setup lang="ts">
import { onMounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import private_deals from './private_deals.vue'
import payouts from './payouts.vue'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

onMounted(() => {
    const api = useApi()
    api.get('/traffic_endpoint/' + props.id).then((response: any) =>
        useViewWrapper().setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Payouts Management')
    )
})
</script>

<template>
    <payouts v-bind="props" />

    <div class="page-title has-text-centered mt-6">
        <div class="title-wrap">
            <h1 class="title is-4">Private Deals Management</h1>
        </div>
    </div>

    <private_deals v-bind="props" />
</template>