<script setup lang="ts">
import { computed, h, ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import SchemeEndpoint from '/@src/schemes/billings/endpointBalancesList.json'
import SchemeSearch from '../../schemes/billings/endpointBalancesSearch.json'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import VTag from '/@src/components/base/tags/VTag.vue'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'

const router = useRouter()
const userSession = useUserSession()
const perm = userSession.permissions('billings')

const isLoading = ref(true)

if (!perm.is_allow('endpoint_balances')) {
    router.push({ name: '403' })
}

const custom = {
    BrokerName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'brokers-id-billing-general', params: { id: row.id } }, target: '_blank' }, () => value)
        }
    },
    EndpointName() {
        return (value: string, row: any) => {
            if (row.probation == 2) {
                return [
                    h(RouterLink, { to: { name: 'traffic_endpoints-id-billing-general', params: { id: row.id } }, target: '_blank' }, () => value),
                    h('span', { innerHTML: ' ' }),
                    h(VTag, { color: 'black', size: 'tiny' }, () => 'probation'),
                ]
            }
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

const onFetched = (data: any) => {
    datatable.value = data
    data.value = data
    isLoading.value = false
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

const datatable = ref<DatatableMethods>([])
const data = ref<any[]>([])
const datatable_minus = computed(() => data.value?.filter((item) => item.balance <= -10))
const datatable_plus = computed(() => data.value?.filter((item) => item.balance >= 10))
onUnmounted(() => {
    data.value = []
})
</script>

<template>
    <SidemenuTabs />
    <div class="endpoint_balances">
        <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)" />

        <div class="columns is-multiline is-mobile">
            <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                <h1 class="title">Traffic Endpoints</h1>
                <Datatable :columns="SchemeEndpoint.columns" method="post" uri="/billings/endpoint_balances" :search="searchFunc"  @init="onFetched" @changed="(value) => (searchData = value)" :custom="custom" :download="true" :show-only-screen-data="false" />
            </div>
            <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                <h1 class="title">Traffic Endpoints (minus)</h1>
                <Datatable :columns="SchemeEndpoint.columns" :model-value="datatable_minus" :custom="custom" :download="true" />
            </div>
            <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                <h1 class="title">Traffic Endpoints (plus)</h1>
                <Datatable :columns="SchemeEndpoint.columns" :model-value="datatable_plus" :custom="custom" :download="true" />
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.endpoint_balances table {
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