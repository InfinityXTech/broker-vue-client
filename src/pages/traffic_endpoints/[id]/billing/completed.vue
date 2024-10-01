<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import { useDownload } from '/@src/composable/useDownload'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/traffic_endpoints/billing/completedTransactionsList.json'
import SchemeQueryList from '/@src/schemes/traffic_endpoints/billing/paymentRequestViewCalculationList.json'
import SchemeFilesList from '/@src/schemes/traffic_endpoints/billing/paymentRequestFilesList.json'
import ShemeViewCalculationList from '/@src/schemes/traffic_endpoints/billing/paymentRequestViewCalculationList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VTag from '/@src/components/base/tags/VTag.vue'
import BillingRenders from '/@src/utils/datatable/billing-render'
import { useUserSession } from '/@src/stores/userSession'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const viewWrapper = useViewWrapper()
const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_billing = perm.is_allow('is_billing')
let is_access_edit = perm.is_allow('all', 'edit') && userSession.roles().is('financial')
let is_access_add = perm.is_allow('all', 'add') && userSession.roles().is('financial')

if (userSession.roles().is('account_manager') && !perm.is_allow('allocate_am')) {
    is_access_add = is_access_edit = false
}

const api = useApi()
api.get('/traffic_endpoint/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Billing Completed Transactions')
)

const download = useDownload()

const custom = Object.assign(
    BillingRenders({
        calculations: (row) => (calculations.value = row._id),
        invoice: (row) => download.get(`/traffic_endpoints/${props.id}/billing/payment_requests/invoice/${row._id}`, 'Invoice.pdf'),
        files: (row) => (files.value = row._id),
    }),
    {
        ViewCalculation() {
            return (value: any, row: any) => {
                const loading = ref(false)
                return h(
                    VButton,
                    {
                        loading: loading.value,
                        title: 'View Calculation',
                        icon: 'fas fa-calculator',
                        onClick: async () => {
                            loading.value = true
                            await viewCalculation.show(row.data._id)
                            loading.value = false
                        },
                    }
                    /*() => 'View Calculation'*/
                )
            }
        },
        Statuses() {
            return (value: any, row: any) => {
                let statuses = []

                const get_render_status = (status: any) => {
                    let color = ''
                    if (status != null) {
                        switch (status.status) {
                            case 'active': {
                                color = 'success'
                                break
                            }
                            case 'inactive': {
                                color = 'danger'
                                break
                            }
                            case 'processing': {
                                color = 'warning'
                                break
                            }
                        }
                        if (status?.title?.length > 0) {
                            return h(VTag, { color: color }, () => status.title)
                        }
                    }
                    return null
                }

                const arr = ['status', 'affiliate_status', 'master_status', 'final_status', 'chargeback_status']
                for (var i = 0; i < arr.length; i++) {
                    const status = get_render_status(row.statuses[arr[i]])
                    if (status != null) {
                        statuses.push(status)
                        statuses.push(h('span', { style: 'margin-right:5px' }))
                    }
                }

                return statuses
            }
        },
        // Files() {
        //     return (value: any, row: any) => {
        //         return h(VButton, {}, () => 'Files')
        //     }
        // },
    }
)

const viewCalculation = (function () {
    const datatable = ref([])
    const isActive = ref(false)
    const loading = ref([])

    const show = async (paymentRequestApproveId: string) => {
        const api = useApi()
        const { data } = await api.get(`/traffic_endpoint/${props.id}/billing/payment_requests/calculations/${paymentRequestApproveId}`)
        datatable.value = data.items
        isActive.value = true
    }
    return {
        datatable,
        isActive,
        loading,
        show,
    }
})()

const custom_view_calculation = {
    Nomination() {
        return (value: any) => {
            const items = []
            items.push(h('div', { innerHTML: value }))
            return items
        }
    },
}

const calculations = ref<string | false>(false)
const files = ref<string | false>(false)
const datatable = ref<DatatableMethods>()

// Use same scheme but without Actions column
const columns: any = Object.assign({}, SchemeList.columns)
delete columns.actions
</script>

<template>
    <Datatable
        :columns="columns"
        :uri="`/traffic_endpoint/${props.id}/billing/completed_transactions/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
    />
    <VModal
        v-if="calculations"
        :open="true"
        :tabs="true"
        title="View Payment Request"
        size="3xl"
        cancel-label="Close"
        actions="right"
        @close="calculations = false"
    >
        <template #content>
            <Datatable
                :columns="SchemeQueryList.columns"
                :uri="`/traffic_endpoint/${props.id}/billing/payment_requests/calculations/${calculations}`"
                :custom="custom"
            />
        </template>
    </VModal>

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable :columns="SchemeFilesList.columns" :uri="`/traffic_endpoint/${props.id}/billing/payment_requests/files/${files}`" :custom="custom" />
        </template>
    </VModal>

    <VModal
        :open="viewCalculation.isActive.value"
        :title="'View Payment Request'"
        size="big"
        cancel-label="Close"
        actions="right"
        @close="viewCalculation.isActive.value = false"
    >
        <template #content>
            <Datatable :columns="ShemeViewCalculationList.columns" :model-value="viewCalculation.datatable.value ?? []" :custom="custom_view_calculation" />
        </template>
    </VModal>
</template>
