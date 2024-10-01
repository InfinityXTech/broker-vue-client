<script setup lang="ts">
import { computed, h, provide, reactive, ref } from 'vue'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { hasOwn } from '@vue/shared'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import { customDictionary, customSimpleDictionary } from '/@src/utils/dictionary'
import { useDownload } from '/@src/composable/useDownload'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { AxiosError } from 'axios'
import { reactiveReplace } from '/@src/utils/helpers'
import BillingRenders from '/@src/utils/datatable/billing-render'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeNewPayment from '/@src/schemes/brokers/billing/paymentRequestNewPayment.json'
import SchemeNewPrepayment from '/@src/schemes/brokers/billing/paymentRequestNewPrepayment.json'
import SchemeApprove from '/@src/schemes/brokers/billing/paymentRequestApprove.json'
import SchemeFinApprove from '/@src/schemes/brokers/billing/paymentRequestFinApprove.json'
import SchemeRealIncome from '/@src/schemes/brokers/billing/paymentRequestRealIncome.json'
import SchemeChange from '/@src/schemes/brokers/billing/paymentRequestChange.json'
import SchemeList from '/@src/schemes/brokers/billing/paymentRequestsList.json'
import SchemeSearch from '/@src/schemes/brokers/billing/paymentRequestsSearch.json'
import SchemeQueryList from '/@src/schemes/brokers/billing/paymentRequestViewCalculationList.json'
import SchemeFilesList from '/@src/schemes/brokers/billing/paymentRequestFilesList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VDropdown from '/@src/components/base/dropdown/VDropdown.vue'
import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const api = useApi()
const notif = useNotyf()
const download = useDownload()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_billing = perm.is_allow('is_billing')

let is_access_edit = perm.is_allow('all', 'edit') && userSession.roles().is('financial')
let is_access_add = perm.is_allow('all', 'add') && userSession.roles().is('financial')

if (userSession.roles().is('account_manager') && !perm.is_allow('allocate_am')) {
    is_access_add = is_access_edit = false
}

const broker_info = ref('')

api.get('/broker/' + props.id).then((response: any) => {
    broker_info.value = response?.data.partner_name_secure
    viewWrapper.setPageTitle(
        'Broker: ' +
            response?.data?.partner_name_secure +
            (is_access_billing ? (' - Balance: $' + response?.data?.balance).replace('$-', '-$') : '') +
            ' - Billing Payment Requests'
    )
})

const custom = Object.assign(
    BillingRenders(
        {
            calculations: (row) => (calculations.value = row._id),
            invoice: (row) => {
                const d = new Date()
                const file_name = 'Invoice_' + broker_info.value + '_' + (d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()) + '.pdf'

                download.get(`/broker/${props.id}/billing/payment_requests/invoice/${row._id}`, file_name)
            },
            files: (row) => (files.value = row._id),
        },
        'broker'
    ),
    {
        Actions() {
            return (value: any, row: any) => {
                const actions: any[] = []

                if (!is_access_edit) {
                    return actions
                }

                const action = (title: string, click: () => void) => {
                    return h(
                        'a',
                        {
                            href: '#',
                            class: 'dropdown-item',
                            onClick: (ev: Event) => {
                                ev.preventDefault()
                                click()
                            },
                        },
                        [title]
                    )
                }
                if (!hasOwn(row, 'final_status') || row.final_status == 0) {
                    if (row.status == 0) {
                        actions.push(action('Approve', () => (approve.value = row._id)))
                        actions.push(action('Reject', () => (reject.value = row._id)))
                    }
                    if (row.status == 1) {
                        actions.push(action('Change Payment Details', () => (change.value = row._id)))
                    }
                    const is_financial = true
                    if (is_financial && row.status == 1) {
                        actions.push(action('Financial Approve', () => (fin_approve.value = row)))
                        actions.push(action('Financial Reject', () => (fin_reject.value = row._id)))
                    }
                }
                if (row.final_status == 1) {
                    if (!row.chargeback) {
                        actions.push(
                            action(
                                'Real Income',
                                () =>
                                    (real_income.value = {
                                        id: row._id,
                                        expected: row.total,
                                        income: row.total + row.total_adjust,
                                    })
                            )
                        )
                    }
                }
                if (!hasOwn(row, 'sub_status')) {
                    if (row.status == 2 || row.final_status == 2) {
                        actions.push(action('Archive', () => (archive.value = row._id)))
                    }
                }
                return actions.length > 0 ? h(VDropdown, { title: 'Action', right: true }, { content: () => actions }) : ''
            }
        },
    }
)

const create = (function () {
    const isLoading = ref(false)
    const isActive = ref(false)
    const leads = ref([])
    const query = reactive<any>({})
    const errors = reactive<any>({})
    const isDisabled = computed(() => query.payment_request_type == 'payment' && leads.value.length == 0)
    return {
        isLoading,
        isActive,
        isDisabled,
        leads,
        query,
        errors,
        initial: {
            payment() {
                leads.value = []
                return {
                    payment_request_type: 'payment',
                    timeframe: DefaultTimeRange,
                }
            },
            prepayment: {
                payment_request_type: 'prepayment',
            },
        },
        onQuery(response: any) {
            leads.value = response
        },
        async onCreate() {
            if (isLoading.value) {
                return
            }
            try {
                isLoading.value = true
                await api.post(`/broker/${props.id}/billing/payment_requests/create`, query)
                isActive.value = false
                datatable?.value?.fetchData()
            } catch (ex) {
                const error = ex as AxiosError
                const response = error.response?.data

                if (response.exception) {
                    notif.dismissAll()
                    notif.error({ message: error?.response?.data?.error ?? response.message, duration: 9000 })
                } else {
                    reactiveReplace(errors, response)
                    notif.dismissAll()
                    notif.error(error?.response?.data?.error ?? error.message)
                }
            } finally {
                isLoading.value = false
            }
        },
    }
})()

const approve = ref<string | false>(false)
const change = ref<string | false>(false)
const reject = ref<string | false>(false)
const fin_approve = ref<any | false>(false)
const fin_reject = ref<string | false>(false)
const archive = ref<string | false>(false)
const real_income = ref<{ id: string; expected: number; income: number } | false>(false)
const calculations = ref<string | false>(false)
const files = ref<string | false>(false)
const datatable = ref<DatatableMethods>()

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

const payment_method_has_fee: Record<string, boolean> = {}
const payment_methods = customDictionary(`/broker/${props.id}/billing/our_payment_methods/all`, (item) => {
    payment_method_has_fee[item._id] = item.payment_method == 'crypto'
    const label = [
        item.payment_method?.toUpperCase(),
        item.currency_code?.toUpperCase(),
        item.bank_name,
        item.account_name,
        item.account_number,

        item.currency_crypto_code?.toUpperCase(),
        item.wallet,
        item.wallet2,
    ]
        .filter((x) => x)
        .join(' - ')
        .replace(' -  - ', ' - ')
    return { value: item._id, label, default: !!item.status }
})()

const RenderRow = (row: any): Record<string, any> => {
    return {
        class: [row.sub_status == 'archive' && 'payment_requests_bg_archive'],
    }
}

provide('get_row_sub_status', (row: any) => row.sub_status ?? 'active')
provide('broker_billing_entities', customSimpleDictionary(`/broker/${props.id}/billing/entities/all`, '_id', 'company_legal_name'))
provide('broker_payment_methods', () => payment_methods)
provide('payment_method_has_fee', (value: string) => payment_method_has_fee[value])
</script>

<template>
    <LocalToolbar>
        <CurrencyConverter />
    </LocalToolbar>

    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create.isActive.value = true"> Add Payment Request </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/broker/${props.id}/billing/payment_requests/all`"
        :custom="custom"
        :classes="['padding-b-100-to-container']"
        :render-row="RenderRow"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <VModal
        v-if="create.isActive.value"
        :open="true"
        title="Add Payment Request"
        size="3xl"
        cancel-label="Close"
        actions="right"
        @close="create.isActive.value = false"
    >
        <template #content>
            <template v-if="create.query.payment_request_type == 'prepayment'">
                <ApiForm
                    title=""
                    :wrapper="PageToolbarNoButton"
                    :model-value="create.query"
                    :errors="create.errors"
                    :fetch-data="create.initial.prepayment"
                    :scheme="SchemeNewPrepayment"
                    store-method="post"
                    store-data=""
                />
            </template>
            <template v-else>
                <ApiForm
                    title=""
                    :wrapper="PageToolbarButtonDown"
                    :model-value="create.query"
                    :errors="create.errors"
                    :fetch-data="create.initial.payment"
                    :scheme="SchemeNewPayment"
                    store-label="Query"
                    store-method="post"
                    :store-data="`/broker/${props.id}/billing/payment_requests/pre_create_query`"
                    @store-data="create.onQuery"
                />
                <br />
                <Datatable :columns="SchemeQueryList.columns" :model-value="create.leads.value" :custom="custom" />
            </template>
        </template>
        <template #action>
            <VButton :loading="create.isLoading.value" :disabled="create.isDisabled.value" color="primary" elevated @click="create.onCreate">
                Create Payment Request
            </VButton>
        </template>
    </VModal>

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

    <ApiForm
        v-if="approve"
        :wrapper="VModal"
        title="Approval"
        :fetch-data="{}"
        :scheme="SchemeApprove"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/payment_requests/approve/${approve}`"
        @store-data="datatable?.fetchData(), (approve = false)"
        @close="approve = false"
    />

    <ApiForm
        v-if="change"
        :wrapper="VModal"
        title="Change Payment Details"
        :fetch-data="`/broker/${props.id}/billing/payment_requests/${change}`"
        :scheme="SchemeChange"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/payment_requests/change/${change}`"
        @store-data="datatable?.fetchData(), (change = false)"
        @close="change = false"
    />

    <ApiForm
        v-if="reject"
        :wrapper="VModal"
        size="small"
        title="Reject"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reject the payment request?')"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/payment_requests/reject/${reject}`"
        @store-data="datatable?.fetchData(), (reject = false)"
        @close="reject = false"
    />

    <ApiForm
        v-if="fin_approve"
        :wrapper="VModal"
        title="Financial Approval"
        :fetch-data="{ date_pay: new Date(), is_request_transaction_id: fin_approve.is_request_transaction_id }"
        :scheme="SchemeFinApprove"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/payment_requests/fin_approve/${fin_approve._id}`"
        @store-data="datatable?.fetchData(), (fin_approve = false)"
        @close="fin_approve = false"
    />

    <ApiForm
        v-if="fin_reject"
        :wrapper="VModal"
        size="small"
        title="Financial Reject"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reject the payment request?')"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/payment_requests/fin_reject/${fin_reject}`"
        @store-data="datatable?.fetchData(), (fin_reject = false)"
        @close="fin_reject = false"
    />

    <ApiForm
        v-if="archive"
        :wrapper="VModal"
        size="small"
        title="Archive"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to archive the payment request?')"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/payment_requests/archive/${archive}`"
        @store-data="datatable?.fetchData(), (archive = false)"
        @close="archive = false"
    />

    <ApiForm
        v-if="real_income"
        :wrapper="VModal"
        title="Real Income"
        :fetch-data="real_income"
        :scheme="SchemeRealIncome"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/payment_requests/real_income/${real_income.id}`"
        @store-data="datatable?.fetchData(), (real_income = false)"
        @close="real_income = false"
    />
</template>
