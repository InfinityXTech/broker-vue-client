<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import SchemeBroker from '/@src/schemes/billings/brokerFinancialApprovesList.json'
import SchemeEndpoint from '/@src/schemes/billings/endpointFinancialApprovesList.json'
import SchemeForm from '/@src/schemes/billings/approvedForm.json'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const router = useRouter()
const userSession = useUserSession()
const perm = userSession.permissions('billings')

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
            if (row.broker_data?._id) {
                return h(
                    RouterLink,
                    { to: { name: 'brokers-id-billing-completed', params: { id: row.broker_data?._id } }, target: '_blank' },
                    () => row.broker_data.partner_name_secure
                )
            }
            return ''
        }
    },
    EndpointName() {
        return (value: string, row: any) => {
            if (row.traffic_endpoint_data?._id) {
                return h(
                    RouterLink,
                    { to: { name: 'traffic_endpoints-id-billing-completed', params: { id: row.traffic_endpoint_data?._id } }, target: '_blank' },
                    () => row.traffic_endpoint_data.token
                )
            }
            return ''
        }
    },
}

const dataValue = ref<any>({})

const onStored = (data: any) => {
    dataValue.value = data
}

onUnmounted(() => {
    dataValue.value = null
})
</script>
    
    <template>
    <SidemenuTabs />

    <div style="max-width: 300px">
        <ApiForm
            title=""
            :wrapper="PageToolbar"
            :scheme="SchemeForm"
            :fetch-data="{ timeframe: DefaultTimeRange }"
            store-label="Search"
            store-method="post"
            :store-data="'/billings/approved'"
            store-on="init"
            @store-data="onStored"
        />
    </div>

    <br />

    <div class="billings-approved">
        <div class="columns is-multiline is-mobile">
            <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                <h1 class="title">Broker Approves</h1>
                <Datatable
                    :columns="SchemeBroker.columns"
                    :custom="custom"
                    :model-value="dataValue.brokers_approved"
                    :download="true"
                    :show-only-screen-data="false"
                />
            </div>
            <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                <h1 class="title">Endpoint Approves</h1>
                <Datatable
                    :columns="SchemeEndpoint.columns"
                    :custom="custom"
                    :model-value="dataValue.endpoints_approved"
                    :download="true"
                    :show-only-screen-data="false"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss">
</style>