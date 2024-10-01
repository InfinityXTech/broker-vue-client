<script setup lang="ts">
import { ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
// import { useViewWrapper } from '/@src/stores/viewWrapper'
// import { useApi } from '/@src/composable/useApi'
import SchemeList from '/@src/schemes/advertisers/billing/paymentRequestsList.json'
import SchemeQueryList from '/@src/schemes/advertisers/billing/paymentRequestViewCalculationList.json'
import SchemeFilesList from '/@src/schemes/advertisers/billing/paymentRequestFilesList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import BillingRenders from '/@src/utils/datatable/billing-render'
import { useDownload } from '/@src/composable/useDownload'
// import { useUserSession } from '/@src/stores/userSession'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface AdvertiserProps {
    advertiserId: string
}

const props = defineProps<AdvertiserProps>()

// const viewWrapper = useViewWrapper()

// const userSession = useUserSession()
// const perm = userSession.permissions('marketing_advertisers')
// const is_access_marketing_advertiser_name = perm.is_allow('marketing_advertiser_name')

// const api = useApi()
// api.get('/advertisers/' + props.advertiserId).then((response: any) =>
//     viewWrapper.setPageTitle('Advertiser: ' + response?.data?.name + ' - Billing Completed Transactions')
// )

const download = useDownload()

const custom = BillingRenders({
    calculations: (row) => (calculations.value = row._id),
    invoice: (row) => download.get(`/advertisers/${props.advertiserId}/billing/payment_requests/invoice/${row._id}`, 'Invoice.pdf'),
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
    <AdvertiserHeader :advertiser-id="props.advertiserId" title="Billing Completed Transactions"></AdvertiserHeader>
    <LocalToolbar>
        <CurrencyConverter />
    </LocalToolbar>

    <Datatable
        :columns="columns"
        :uri="`/advertisers/${props.advertiserId}/billing/payment_requests/completed`"
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
                :uri="`/advertisers/${props.advertiserId}/billing/payment_requests/calculations/${calculations}`"
                :custom="custom"
            />
        </template>
    </VModal>

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable
                :columns="SchemeFilesList.columns"
                :uri="`/advertisers/${props.advertiserId}/billing/payment_requests/files/${files}`"
                :custom="custom"
            />
        </template>
    </VModal>
</template>
