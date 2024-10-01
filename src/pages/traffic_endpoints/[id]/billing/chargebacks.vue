<script setup lang="ts">
import { h, ref, provide } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { hasOwn } from '@vue/shared'
import { useApi } from '/@src/composable/useApi'
import { AxiosResponse } from 'axios'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { MoneyColor } from '/@src/utils/datatable/simple-render'
import VButton from '/@src/components/base/button/VButton.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeList from '/@src/schemes/traffic_endpoints/billing/chargebackList.json'
import SchemeEdit from '/@src/schemes/traffic_endpoints/billing/chargebackEdit.json'
import SchemeNew from '/@src/schemes/traffic_endpoints/billing/chargebackEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import HtmlField from '/@src/components/partials/forms/HtmlField.vue'
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
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Billing Chargebacks')
)

const renderMoneyColor = MoneyColor()

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
    // Screenshots() {
    //     return (value: any) => {
    //         let html = ''
    //         for (let i = 0; i < value.length; i++) {
    //             html += `<a href="${apiUrl}/storage/download/${value[i]._id}" target="_blank">${value[i].original_file_name}</a>`
    //         }
    //         return h(HtmlField, {
    //             html: html,
    //         })
    //     }
    // },
    Actions() {
        return (value: any, row: any) => {
            if (
                (is_access_edit && !hasOwn(row, 'payment_request')) ||
                (hasOwn(row, 'payment_request') && !row.payment_request?.value) ||
                row.payment_request?.value == ''
            ) {
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

const update = ref<string | false>(false)
const remove = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const promisePaymentMethodsRequest = api.get(`/traffic_endpoint/${props.id}/billing/sprav/payment_methods`)
const promisePaymentMethods = promisePaymentMethodsRequest.then((response: AxiosResponse<any>) => response.data)

const promisePaymentRequestsRequest = api.get(`/traffic_endpoint/${props.id}/billing/chargeback/sprav/payment_requests`)
const promisePaymentRequests = promisePaymentRequestsRequest.then((response: AxiosResponse<any>) => response.data)

provide('custom_payment_methods', () => promisePaymentMethods)
provide('custom_payment_requests', () => promisePaymentRequests)

const initial = async () => {
    const { data } = await api.get(`/traffic_endpoint/${props.id}/billing/payment_methods/all`)
    const payment_method = data.find((item: any) => item.status)
    return {
        payment_method: payment_method?._id,
    }
}

const totalSum = ref(0)
const onChanged = (data: any[] | null) => (totalSum.value = data?.reduce((sum, row) => sum + row.amount, 0) ?? 0)
</script>

<template>
    <div class="list-flex-toolbar">
        <div>
            <VCard>Total: <component :is="{ render: () => renderMoneyColor(totalSum) }" /></VCard>
        </div>
        <VButtons>
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Chargeback </VButton>
        </VButtons>
    </div>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/traffic_endpoint/${props.id}/billing/chargeback/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
        @changed="onChanged"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        :gauth="true"
        title="Add Chargeback"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/chargeback/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :gauth="true"
        :wrapper="VModal"
        title="Update Chargeback"
        :fetch-data="`/traffic_endpoint/${props.id}/billing/chargeback/${update}`"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-method="put"
        :store-data="`/traffic_endpoint/${props.id}/billing/chargeback/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :gauth="true"
        :wrapper="VModal"
        size="small"
        title="Delete Chargeback"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/traffic_endpoint/${props.id}/billing/chargeback/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
