<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { RouterLink } from 'vue-router'
import SchemeBroker from '/@src/schemes/billings/brokerPendingPaymentsList.json'
import SchemeEndpoint from '/@src/schemes/billings/endpointPendingPaymentsList.json'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const api = useApi()
const router = useRouter()
const userSession = useUserSession()
const perm = userSession.permissions('billings')

if (!perm.is_allow('pending_payments')) {
    if (perm.is_allow('brokers_balances')) {
        location.href = '/billings/brokers_balances'
    } else {
        if (perm.is_allow('endpoint_balances')) {
            location.href = '/billings/endpoint_balances'
        } else {
            router.push({ name: '403' })
        }
    }
}

const custom = {
    BrokerName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'brokers-id-billing-requests', params: { id: row.broker._id } }, target: '_blank' }, () => value)
        }
    },
    EndpointName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'traffic_endpoints-id-billing-requests', params: { id: row.endpoint._id } }, target: '_blank' }, () => value)
        }
    },
}
const isLoading = ref<boolean>(true)
const dataValue = ref<any>({
    brokers_pending_payments: { items: [] },
    endpoints_pending_payments: { items: [] },
})
const request = api.get('/billings/pending_payments')
request.then((response: any) => {
    dataValue.value = response.data
    isLoading.value = false
})
onUnmounted(() => {
    dataValue.value = null
})
</script>

<template>
    <SidemenuTabs />

    <VLoader :active="isLoading" size="xl">
        <div class="columns is-multiline is-mobile">
            <div class="column inv-column" :class="['is-one-quarter-fullhd', 'is-helf-desktop']">
                <h1 class="title">Brokers</h1>
                <Datatable
                    :columns="SchemeBroker.columns"
                    :model-value="dataValue.brokers_pending_payments.items"
                    :show-only-screen-data="false"
                    :custom="custom"
                    :download="true"
                />
            </div>
            <div class="column inv-column" :class="['is-one-quarter-fullhd', 'is-helf-desktop']">
                <h1 class="title">Traffic Endpoints</h1>
                <Datatable
                    :columns="SchemeEndpoint.columns"
                    :model-value="dataValue.endpoints_pending_payments.items"
                    :show-only-screen-data="false"
                    :custom="custom"
                    :download="true"
                />
            </div>
        </div>
    </VLoader>
</template>
