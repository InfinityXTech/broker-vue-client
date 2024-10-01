<script setup lang="ts">
import { computed, h, ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import SchemeBroker from '/@src/schemes/billings/brokerBalancesList.json'
import SchemeBrokerForm from '../../schemes/billings/brokerBalancesForm.json'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const router = useRouter()
const userSession = useUserSession()
const perm = userSession.permissions('billings')

const isLoading = ref(true)

if (!perm.is_allow('brokers_balances')) {
    if (perm.is_allow('endpoint_balances')) {
        location.href = '/billings/endpoint_balances'
    } else {
        router.push({ name: '403' })
    }
}

const custom = {
    BrokerName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'brokers-id-billing-general', params: { id: row.id } }, target: '_blank' }, () => value)
        }
    },
    EndpointName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'traffic_endpoints-id-billing-general', params: { id: row.id } }, target: '_blank' }, () => value)
        }
    },
    Collection() {
        return (value: string) => {
            return h('span', { innerHTML: value ? 'collection' : 'active' })
        }
    },
    Status() {
        return (value: string) => {
            return h('span', { innerHTML: value ? 'active' : 'inactive' })
        }
    },
}

const onStored = (data: any) => {
    datatable.value = data
    isLoading.value = false
}

const datatable = ref<any[]>([])
const datatable_minus = computed(() => datatable.value?.filter((item) => item.balance <= -10))
const datatable_plus = computed(() => datatable.value?.filter((item) => item.balance >= 10))
onUnmounted(() => {
    datatable.value = []
})
</script>

<template>
    <SidemenuTabs />

    <div class="broker_balances">
        <div style="max-width: 300px">
            <ApiForm
                title=""
                :wrapper="PageToolbar"
                :scheme="SchemeBrokerForm"
                :fetch-data="{ collection: true }"
                store-method="post"
                store-data="/billings/brokers_balances"
                store-on="change"
                @before-store="isLoading = true"
                @store-data="onStored"
            />
        </div>

       

        <VLoader :active="isLoading" size="large">
            <div v-if="!isLoading" class="columns is-multiline is-mobile">
                <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                    <h1 class="title">Brokers</h1>
                    <Datatable :columns="SchemeBroker.columns" :model-value="datatable" :custom="custom" :download="true" :show-only-screen-data="false" />
                </div>
                <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                    <h1 class="title">Brokers (minus)</h1>
                    <Datatable :columns="SchemeBroker.columns" :model-value="datatable_minus" :custom="custom" :download="true" />
                </div>
                <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                    <h1 class="title">Brokers (plus)</h1>
                    <Datatable :columns="SchemeBroker.columns" :model-value="datatable_plus" :custom="custom" :download="true" />
                </div>
            </div>
            <div v-else style="height: 100px"></div>
        </VLoader>
    </div>
</template>
<style lang="scss">
.broker_balances table {
    th[data-key='is_collection'],
    td[data-key='is_collection'],
    th[data-key='status'],
    td[data-key='status'],
    th[data-key='account_manager.account_email'],
    td[data-key='account_manager.account_email'] {
        display: none;
    }

    tfoot {
        td:nth-child(1),
        td:nth-child(2),
        td:nth-child(3) {
            display: none;
        }
    }
}
</style>