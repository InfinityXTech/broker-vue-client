<script setup lang="ts">
import { ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import SchemeList from '/@src/schemes/masters/billing/paymentRequestsList.json'
import SchemeQueryList from '/@src/schemes/masters/billing/paymentRequestViewCalculationList.json'
import SchemeFilesList from '/@src/schemes/masters/billing/paymentRequestFilesList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import BillingRenders from '/@src/utils/datatable/billing-render'

export interface MasterProps {
    id: string
}

const props = defineProps<MasterProps>()

const custom = BillingRenders(
    {
        calculations: (row) => (calculations.value = row._id),
        // invoice: (row) => window.open(`/master/${props.id}/billing/payment_requests/invoice/${row._id}`),
        files: (row) => (files.value = row._id),
    },
    'master'
)

const calculations = ref<string | false>(false)
const files = ref<string | false>(false)
const datatable = ref<DatatableMethods>()

// Use same scheme but without Actions column
const columns: any = Object.assign({}, SchemeList.columns)
delete columns.actions
</script>

<template>
    <Datatable :columns="columns" :uri="`/master/${props.id}/billing/payment_requests/completed`" :custom="custom" @init="(value) => (datatable = value)" />

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
            <Datatable :columns="SchemeQueryList.columns" :uri="`/master/${props.id}/billing/payment_requests/calculations/${calculations}`" :custom="custom" />
        </template>
    </VModal>

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable :columns="SchemeFilesList.columns" :uri="`/master/${props.id}/billing/payment_requests/files/${files}`" :custom="custom" />
        </template>
    </VModal>
</template>
