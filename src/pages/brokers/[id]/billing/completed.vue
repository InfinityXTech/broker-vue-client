<script setup lang="ts">
import { ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import SchemeList from '/@src/schemes/brokers/billing/paymentRequestsList.json'
import SchemeQueryList from '/@src/schemes/brokers/billing/paymentRequestViewCalculationList.json'
import SchemeFilesList from '/@src/schemes/brokers/billing/paymentRequestFilesList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import BillingRenders from '/@src/utils/datatable/billing-render'
import { useDownload } from '/@src/composable/useDownload'
import { useUserSession } from '/@src/stores/userSession'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_billing = perm.is_allow('is_billing')

let is_access_edit = perm.is_allow('all', 'edit') && userSession.roles().is('financial')
let is_access_add = perm.is_allow('all', 'add') && userSession.roles().is('financial')

if (userSession.roles().is('account_manager') && !perm.is_allow('allocate_am')) {
    is_access_add = is_access_edit = false
}

const api = useApi()
api.get('/broker/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle(
        'Broker: ' +
            response?.data?.partner_name_secure +
            (is_access_billing ? (' - Balance: $' + response?.data?.balance).replace('$-', '-$') : '') +
            ' - Billing Completed Transactions'
    )
)

const download = useDownload()

const custom = BillingRenders({
    calculations: (row) => (calculations.value = row._id),
    invoice: (row) => download.get(`/broker/${props.id}/billing/payment_requests/invoice/${row._id}`, 'Invoice.pdf'),
    files: (row) => (files.value = row._id),
})

const calculations = ref<string | false>(false)
const files = ref<string | false>(false)
const datatable = ref<DatatableMethods>()

// Use same scheme but without Actions column
const columns: any = Object.assign({}, SchemeList.columns)
delete columns.actions
</script>

<template>
    <LocalToolbar>
        <CurrencyConverter />
    </LocalToolbar>

    <Datatable :columns="columns" :uri="`/broker/${props.id}/billing/payment_requests/completed`" :custom="custom" @init="(value) => (datatable = value)" />

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
            <Datatable :columns="SchemeQueryList.columns" :uri="`/broker/${props.id}/billing/payment_requests/calculations/${calculations}`" :custom="custom" />
        </template>
    </VModal>

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable :columns="SchemeFilesList.columns" :uri="`/broker/${props.id}/billing/payment_requests/files/${files}`" :custom="custom" />
        </template>
    </VModal>
</template>
