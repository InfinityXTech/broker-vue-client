<script setup lang="ts">
import { onMounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import private_deals from './private_deals.vue'
import payouts from './payouts.vue'
import { useUserSession } from '/@src/stores/userSession'
import { checkBrokerAccess } from '/@src/utils/broker/access'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_billing = perm.is_allow('is_billing')

onMounted(() => {
    useViewWrapper().setPageTitle('Payouts Management')
    const api = useApi()
    api.get('/broker/' + props.id).then((response: any) => {
        checkBrokerAccess(response?.data)
        useViewWrapper().setPageTitle(
            'Broker: ' +
                response?.data?.partner_name_secure +
                (is_access_billing ? (' - Balance: $' + response?.data?.balance).replace('$-', '-$') : '') +
                ' - Payouts Management'
        )
    })
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