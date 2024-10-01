<script setup lang="ts">
import { h, provide, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { hasOwn } from '@vue/shared'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { customDictionary } from '/@src/utils/dictionary'
import { AxiosResponse } from 'axios'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/masters/billing/chargebacksList.json'
import SchemeEdit from '/@src/schemes/masters/billing/chargebackEdit.json'
import SchemeNew from '/@src/schemes/masters/billing/chargebackEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'

export interface MasterProps {
    id: string
}

const props = defineProps<MasterProps>()

const api = useApi()

const custom = {
    PaymentMethod() {
        return (value: any) => {
            switch (value.payment_method) {
                case 'crypto':
                    return `${value.payment_method} (${value.currency_crypto_code})`.toUpperCase()
                case 'wire':
                    return `${value.payment_method} (${value.currency_code}) `.toUpperCase() + value.bank_name
                default:
                    return value.payment_method?.toUpperCase()
            }
        }
    },
    Actions() {
        return (value: any, row: any) => {
            if (!hasOwn(row, 'payment_request')) {
                return [
                    h(VButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) }, () => 'Edit'),
                    ' ',
                    h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete'),
                ]
            }
            return ''
        }
    },
}

const promisePaymentMethodsRequest = api.get(`/master/${props.id}/billing/sprav/payment_methods`)
const promisePaymentMethods = promisePaymentMethodsRequest.then((response: AxiosResponse<any>) => response.data)
provide('custom_payment_methods', () => promisePaymentMethods)

const promisePaymentPaymentRequest = api.get(`/master/${props.id}/billing/sprav/payment_requests`)
const promisePaymentRequests = promisePaymentPaymentRequest.then((response: AxiosResponse<any>) => response.data)
provide('custom_payment_requests', () => promisePaymentRequests)

const update = ref<string | false>(false)
const remove = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const initial = async () => {
    const { data } = await api.get(`/master/${props.id}/billing/payment_methods/all`)
    const payment_method = data.find((item: any) => item.status)
    return {
        payment_method: payment_method?._id,
    }
}
</script>

<template>
    <div class="list-flex-toolbar">
        <VButtons>
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Chargeback </VButton>
        </VButtons>
    </div>

    <Datatable :columns="SchemeList.columns" :uri="`/master/${props.id}/billing/chargeback/all`" :custom="custom" @init="(value) => (datatable = value)" />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Chargeback"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/master/${props.id}/billing/chargeback/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Chargeback"
        :fetch-data="`/master/${props.id}/billing/chargeback/${update}`"
        :scheme="SchemeEdit"
        store-method="post"
        :store-data="`/master/${props.id}/billing/chargeback/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        size="small"
        title="Delete Chargeback"
        :fetch-data="{}"
        :gauth="true"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/master/${props.id}/billing/chargeback/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
