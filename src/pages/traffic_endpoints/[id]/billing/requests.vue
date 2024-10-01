<script setup lang="ts">
import { computed, h, provide, reactive, ref } from 'vue'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { useDownload } from '/@src/composable/useDownload'
import { useNotyf } from '/@src/composable/useNotyf'
import { customDictionary } from '/@src/utils/dictionary'
import { useApi } from '/@src/composable/useApi'
import { AxiosError } from 'axios'
import { reactiveReplace } from '/@src/utils/helpers'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import BillingRenders from '/@src/utils/datatable/billing-render'

import VButton from '/@src/components/base/button/VButton.vue'

import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'

import SchemeList from '/@src/schemes/traffic_endpoints/billing/paymentRequestList.json'

import SchemeSearch from '/@src/schemes/traffic_endpoints/billing/paymentRequestSearch.json'

import SchemeNewPayment from '/@src/schemes/traffic_endpoints/billing/paymentRequestNewPayment.json'
import SchemeNewPaymentRequestSecondStep from '/@src/schemes/traffic_endpoints/billing/paymentRequestSecondStep.json'
import SchemeNewPaymentRequestThirdStep from '/@src/schemes/traffic_endpoints/billing/paymentRequestThirdStep.json'
import SchemeNewPrepayment from '/@src/schemes/traffic_endpoints/billing/paymentRequestNewPrepayment.json'
import SchemeNewWallet from '/@src/schemes/traffic_endpoints/billing/paymentMethodsNew.json'

import ShemeViewCalculationList from '/@src/schemes/traffic_endpoints/billing/paymentRequestViewCalculationList.json'
import SchemeQueryList from '/@src/schemes/traffic_endpoints/billing/paymentRequestViewCalculationList.json'

import ShemeMasterApproveModal from '/@src/schemes/traffic_endpoints/billing/paymentRequestMasterApproveModal.json'
import ShemeFinalApproveModal from '/@src/schemes/traffic_endpoints/billing/paymentRequestFinalApproveModal.json'
import ShemeRealIncomeModal from '/@src/schemes/traffic_endpoints/billing/paymentRequestRealIncomeModal.json'

import SchemeFilesList from '/@src/schemes/brokers/billing/paymentRequestFilesList.json'

import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'

import VModal from '/@src/components/base/modal/VModal.vue'
import VTag from '/@src/components/base/tags/VTag.vue'
import VDropdown from '/@src/components/base/dropdown/VDropdown.vue'
import { ApiFormValidate } from '/@src/components/partials/ApiForm.vue'
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
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Billing Payment Requests')
)

const notif = useNotyf()
const download = useDownload()

const paymentRequestSelectId = ref('')

const custom = Object.assign(
    BillingRenders(
        {
            calculations: (row) => (calculations.value = row._id),
            invoice: (row) => download.get(`/traffic_endpoints/${props.id}/billing/payment_requests/invoice/${row._id}`, 'Invoice.pdf'),
            hasFiles: (row) => row.is_files,
            files: (row) => (files.value = row._id),
        },
        'endpoint'
    ),
    {
        ViewCalculation() {
            return (value: any, row: any) => {
                const loading = ref(false)
                if (row?.data?.type == 'payment') {
                    return h(
                        VButton,
                        {
                            title: 'View Calculation',
                            icon: 'fas fa-calculator',
                            loading: loading.value,
                            onClick: async () => {
                                loading.value = true
                                await viewCalculation.show(row._id)
                                loading.value = false
                            },
                        } //,
                        // () => 'View Calculation'
                    )
                }
                return h('span')
            }
        },
        Actions() {
            return (value: any, row: any) => {
                let actions: any[] = []
                for (let i = 0; i < value.length; i++) {
                    actions.push(
                        h('a', {
                            href: '#',
                            class: 'dropdown-item',
                            onClick: (ev: Event) => {
                                ev.preventDefault()
                                paymentRequestSelectId.value = row._id
                                switch (value[i].name) {
                                    case 'approve': {
                                        approve.value = true
                                        break
                                    }
                                    case 'reject': {
                                        reject.value = true
                                        break
                                    }
                                    case 'archive_rejected': {
                                        archive_rejected.value = true
                                        break
                                    }
                                    case 'real_income': {
                                        real_income_approve.value = true
                                        init_real_income_approve.expected_income = row.stat.total
                                        init_real_income_approve.real_income = row.stat.real_income
                                        break
                                    }
                                    case 'master_approve': {
                                        master_approve.value = true
                                        break
                                    }
                                    case 'final_approve': {
                                        final_approve.value = row
                                        final_approve_data.payment_method = row?.payment_method
                                        final_approve_data.date_pay = new Date()
                                        break
                                    }
                                    case 'final_reject': {
                                        final_reject.value = true
                                        break
                                    }
                                }
                            },
                            innerHTML: value[i].title,
                        })
                    )
                }
                return is_access_edit && actions.length > 0
                    ? h(
                          VDropdown,
                          { title: 'Action', right: true },
                          {
                              content() {
                                  return actions
                              },
                          }
                      )
                    : h('span')
            }
        },
    }
)

const custom_pre_request = {
    Nomination() {
        return (value: any) => {
            const items = []
            items.push(h('div', { innerHTML: value }))
            return items
        }
    },
    Exports() {
        return (value: any, row: any) => {
            return [
                h(
                    'a',
                    {
                        href: '#',
                        onClick: () =>
                            download.post(`/traffic_endpoint/${props.id}/billing/payment_requests/export_emails`, { emails: row.data?.emails ?? [] }),
                    },
                    value
                ),
            ]
        }
    },
}

const datatable = ref<DatatableMethods>()

const viewCalculation = (function () {
    const datatable = ref([])
    const isActive = ref(false)
    const loading = ref([])

    const show = async (paymentRequestSelectId: string) => {
        const { data } = await api.get(`/traffic_endpoint/${props.id}/billing/payment_requests/calculations/${paymentRequestSelectId}`)
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

const create = (function () {
    const isLoading = ref(false)
    const isActive = ref(false)
    const leads = ref([])
    const query = reactive<any>({})
    const errors = reactive<any>({})
    const gauth = ref(false)
    const timeframe = ref('')
    const isDisabled = computed(
        () =>
            (query.payment_request_type == 'payment' && leads.value.length == 0) ||
            (initial.proof.proof_screenshots ?? []).length == 0 ||
            (initial.proof.master_approve_files ?? []).length == 0 ||
            (initial.proof.proof_description ?? '').length == 0
    )
    const step = ref(1)
    const new_wallet = ref(false)
    const initial = reactive({
        payment: {
            TrafficEndpoint: props.id,
            payment_request_type: 'payment',
            timeframe: DefaultTimeRange,
        },
        prepayment: {
            TrafficEndpoint: props.id,
            payment_request_type: 'prepayment',
            amount: null,
        },
        wallet: {
            payment_method: null,
        },
        proof: {
            master_approve_files: null,
            proof_screenshots: null,
            proof_description: null,
        },
    })
    const formEvents: Record<string, any> = reactive({
        payment: null,
        prepayment: null,
        second_step: null,
        third_step: null,
    })

    const show = () => {
        isActive.value = true
        leads.value = []
        step.value = 1
        for (let n in query) {
            if (n != 'TrafficEndpoint' && n != 'timeframe') {
                query[n] = null
            }
        }
        Object.assign(query, { payment_request_type: 'payment' })
        Object.assign(errors, {})
        initial.wallet.payment_method = null
        initial.proof.master_approve_files = null
        initial.proof.proof_screenshots = null
        initial.proof.proof_description = null
        new_wallet.value = false
    }

    const store_new_payment_request = () => {
        get_payment_methods()
        formEvents['second_step']?.forceReRenderForm()
        create.new_wallet.value = false
    }

    const next = async () => {
        if (step.value == 1 && !formEvents[query.payment_request_type]?.checkValidate()) {
            return
        }

        if (step.value == 2) {
            const item = payment_methods_data.value.find((x: any) => x._id == initial.wallet.payment_method)
            const wallet_validate = await payment_method_validates['wallet'](item)
            if (wallet_validate == false) {
                alert("This Wallet doesn't have validate number. Please go to this Payment method and update information")
                return
            }
            if ((item?.files ?? []).length == 0) {
                alert("This Wallet doesn't have attachment files. Please go to this Payment method and attach proof files")
                return
            }
            if (!formEvents['second_step']?.checkValidate()) {
                return
            }
        }

        if (step.value == 3 && !formEvents['third_step']?.checkValidate()) {
            return
        }

        step.value++
    }

    return {
        isLoading,
        isActive,
        isDisabled,
        step,
        leads,
        query,
        gauth,
        errors,
        timeframe,
        new_wallet,
        formEvents,
        show,
        next,
        store_new_payment_request,
        initial: initial,
        onQuery(response: any) {
            leads.value = response.items
            timeframe.value = response.timeframe
        },
        async onCreate() {
            if (isLoading.value) {
                return
            }
            try {
                gauth.value = false
                isLoading.value = true
                const data_request: any = {
                    __auth_code__: query.__auth_code__,
                    TrafficEndpoint: props.id,
                    payment_request_type: query.payment_request_type,
                    adjustment_amount_sign: query.adjustment_amount_sign ?? 0,
                    adjustment_amount_value: query.adjustment_amount_value ?? 0,
                    adjustment_description: query.adjustment_description ?? '',
                    timeframe: query.timeframe,
                    amount: create.query.amount ?? null,
                    payment_method: initial.wallet.payment_method,
                    proof_description: initial.proof.proof_description ?? '',
                }

                const form = new FormData()
                for (var n in data_request) {
                    form.append(n, data_request[n])
                }
                for (var n in initial.proof.master_approve_files ?? []) {
                    form.append('master_approve_files[]', initial.proof?.master_approve_files[n]._id)
                }
                for (var n in initial.proof.proof_screenshots ?? []) {
                    form.append('proof_screenshots[]', initial.proof?.proof_screenshots[n]._id)
                }
                form.append('leads', JSON.stringify(leads.value))

                try {
                    const { data } = await api.post(`/traffic_endpoint/${props.id}/billing/payment_requests/create`, form)
                    if ((data.error ?? '').length > 0) {
                        if (data.error.__auth_code__) {
                            query.__auth_code__ = ''
                            notif.error(data.error.__auth_code__[0])
                            gauth.value = true
                            return
                        }

                        notif.error(data.error)
                    } else {
                        isActive.value = false
                        datatable?.value?.fetchData()
                    }
                } catch (ex) {
                    const error = ex as AxiosError
                    const response = error.response?.data

                    if (response.exception) {
                        notif.dismissAll()
                        notif.error({ message: error?.response?.data?.error ?? response.message, duration: 9000 })
                    }

                    if (response.__auth_code__) {
                        query.__auth_code__ = ''
                        notif.error(response.__auth_code__[0])
                        gauth.value = true
                    }
                }
            } catch (ex) {
                const error = ex as AxiosError
                const response = error.response?.data

                if (response.exception) {
                    notif.dismissAll()
                    notif.error({ message: response?.data?.error ?? response.message, duration: 9000 })
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

const init_real_income_approve = (function () {
    const expected_income = ref()
    const real_income = ref()
    return {
        expected_income,
        real_income,
    }
})()

const payment_method_validates: Record<string, ApiFormValidate> = {
    wallet: async (data: any): Promise<boolean> => {
        if (data.payment_method == 'crypto' && (data.currency_crypto_code == 'btc' || data.currency_crypto_code == 'usdt')) {
            let currency_crypto_code = data.currency_crypto_code
            if (data.currency_crypto_code == 'usdt') {
                if (data.currency_crypto_wallet_type == 'erc_20') {
                    currency_crypto_code = 'eth'
                } else if (data.currency_crypto_wallet_type == 'trc_20') {
                    currency_crypto_code = 'trx'
                } else {
                    currency_crypto_code = 'eth'
                }
            }
            if ((data.wallet ?? '').length == 0) {
                return false
            }
            const { data: validate } = await api.get(`/validate/cryptocurrency-address/${currency_crypto_code}/${data.wallet}`)
            return validate.validate
        }
        return true
    },
}

const payment_method_has_fee: Record<string, boolean> = {}
const payment_methods_data = ref<any>([])
const payment_methods = ref()
const get_payment_methods = () => {
    payment_methods.value = customDictionary(`/traffic_endpoint/${props.id}/billing/payment_methods/all`, (item) => {
        payment_methods_data.value.push(item)
        payment_method_has_fee[item._id] = item.payment_method == 'crypto'
        let _label = []
        if (item.payment_method == 'crypto') {
            _label = [
                item.payment_method?.toUpperCase(),
                item.currency_crypto_code?.toUpperCase(),
                item.currency_crypto_code == 'usdt' ? item.currency_crypto_wallet_type?.toUpperCase() : '',
                item.wallet,
                item.wallet2,
            ]
        } else {
            _label = [item.payment_method?.toUpperCase(), item.currency_code?.toUpperCase(), item.bank_name, item.account_name, item.account_number]
        }
        const label = _label
            .filter((x) => x)
            .join(' - ')
            .replace(' -  - ', ' - ')
        return { value: item._id, label, default: !!item.status }
    })()
}
get_payment_methods()

const approve = ref<boolean>(false)
const reject = ref<boolean>(false)
const master_approve = ref<boolean>(false)
const archive_rejected = ref<boolean>(false)
const final_approve = ref<any>(false)
const final_approve_data = reactive({ payment_method: final_approve?.value?.payment_method, date_pay: new Date() })
const final_reject = ref<boolean>(false)
const real_income_approve = ref<boolean>(false)

const calculations = ref<string | false>(false)
const files = ref<string | false>(false)

const crg_deal_details = ref<string | boolean>(false)

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

const RenderRow = (row: any): Record<string, any> => {
    return {
        class: [row.sub_status == 'archive' && 'payment_requests_bg_archive'],
    }
}

provide('get_row_sub_status', (row: any) => row.data.sub_status ?? 'active')
provide('traffic_endpoint_payment_methods', () => payment_methods.value)
provide('payment_method_has_fee', (value: string) => payment_method_has_fee[value])

provide('payment_method_required', () => {
    return (final_approve_data.payment_method ?? '').length == 0
})

provide('transaction_id_required', (value: number) => {
    const item = payment_methods_data.value.find((x: any) => x._id == value)
    return item && item.payment_method == 'crypto' && (item.currency_crypto_code == 'btc' || item.currency_crypto_code == 'usdt')
})

provide('hash_url_required', (value: number) => {
    const item = payment_methods_data.value.find((x: any) => x._id == value)
    return item && item.payment_method != 'crypto'
})

provide('add_new_vallet', () => (create.new_wallet.value = true))
</script>

<template>
    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create.show"> Add Payment Request </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/traffic_endpoint/${props.id}/billing/payment_requests/all`"
        :custom="custom"
        :classes="['padding-b-100-to-container']"
        :render-row="RenderRow"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <VModal :open="create.isActive.value" title="Add Payment Request" size="3xl" cancel-label="Close" actions="right" @close="create.isActive.value = false">
        <template #content>
            <template v-if="create.step.value == 1 && create.query.payment_request_type == 'prepayment'">
                <ApiForm
                    title=""
                    :wrapper="PageToolbarNoButton"
                    :errors="create.errors"
                    :fetch-data="create.initial.prepayment"
                    :model-value="create.query"
                    :scheme="SchemeNewPrepayment"
                    store-method="post"
                    store-data=""
                    @events="(value) => (create.formEvents['prepayment'] = value)"
                />
            </template>
            <template v-else-if="create.step.value == 1">
                <ApiForm
                    title=""
                    :wrapper="PageToolbarButtonDown"
                    :model-value="create.query"
                    :errors="create.errors"
                    :fetch-data="create.initial.payment"
                    :scheme="SchemeNewPayment"
                    store-label="Query"
                    store-method="post"
                    :store-data="`/traffic_endpoint/${props.id}/billing/payment_requests/pre_create_query`"
                    @events="(value) => (create.formEvents['payment'] = value)"
                    @store-data="create.onQuery"
                />
                <br />
                <Datatable :columns="SchemeQueryList.columns" :model-value="create.leads.value" :custom="custom_pre_request" />
            </template>
            <template v-else-if="create.step.value == 2">
                <ApiForm
                    title=""
                    :wrapper="PageToolbarNoButton"
                    :fetch-data="create.initial.wallet"
                    :model-value="create.initial.wallet"
                    :scheme="SchemeNewPaymentRequestSecondStep"
                    store-method="post"
                    store-data=""
                    @events="(value) => (create.formEvents['second_step'] = value)"
                />
            </template>
            <template v-else-if="create.step.value == 3">
                <ApiForm
                    title=""
                    :wrapper="PageToolbarNoButton"
                    :fetch-data="create.initial.proof"
                    :model-value="create.initial.proof"
                    :scheme="SchemeNewPaymentRequestThirdStep"
                    store-method="post"
                    store-data=""
                    @events="(value) => (create.formEvents['third_step'] = value)"
                />
            </template>
        </template>
        <template #action>
            <!-- <VButton :disabled="create.step.value <= 1" color="primary" elevated @click="() => create.step.value--">Previous</VButton> -->
            <VButton
                v-if="create.step.value <= 2"
                :disabled="
                    (create.step.value == 2 && (create.initial.wallet.payment_method ?? '').length == 0) ||
                    (create.query.payment_request_type == 'prepayment' && (create.query.amount ?? 0) == 0) ||
                    (create.query.payment_request_type == 'payment' && create.leads.value.length == 0)
                "
                color="primary"
                elevated
                @click="create.next"
            >
                Next
            </VButton>
            <VButton
                v-if="create.step.value == 3"
                :loading="create.isLoading.value"
                :disabled="create.isDisabled.value"
                color="primary"
                elevated
                @click=";(create.gauth.value = true), (create.query.__auth_code__ = '')"
            >
                Create Payment Request
            </VButton>
        </template>
    </VModal>

    <VModal
        v-if="create.gauth.value !== undefined"
        :classes="['google_auth']"
        :open="create.gauth.value"
        size="small"
        title="Confirm operation by Google authentication"
        actions="right"
        @close="create.gauth.value = false"
        @enter="create.onCreate"
    >
        <template #content>
            <InputField v-model="create.query.__auth_code__" :maxlength="6" :required="true" label="Enter Authentication Code" />
        </template>
        <template #action>
            <VButton color="primary" :disabled="create.query.__auth_code__?.length < 6" elevated @click="create.onCreate">Confirm</VButton>
        </template>
    </VModal>

    <!-- New Wallet -->
    <ApiForm
        v-if="create.new_wallet.value"
        :wrapper="VModal"
        title="Add Payment Method"
        :fetch-data="{}"
        :scheme="SchemeNewWallet"
        :validates="payment_method_validates"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/payment_methods/create`"
        @store-data="create.store_new_payment_request"
        @events="(value) => (create.formEvents['new_wallet'] = value)"
        @close="create.new_wallet.value = false"
    />

    <VModal
        :open="crg_deal_details != false"
        :tabs="true"
        title="CRG Details"
        size="3xl"
        cancel-label="Close"
        actions="right"
        @close="crg_deal_details = false"
    >
        <template #content>
            <div class="dataTable-wrapper">
                <div class="dataTable-container">
                    <table class="dataTable-table table">
                        <thead>
                            <tr>
                                <th scope="col">Key</th>
                                <th scope="col">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(column, key) in Object.keys(crg_deal_details)" :key="key" scope="col">
                                <td>{{ column }}</td>
                                <td>{{ crg_deal_details[column] }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <a
                        v-if="false && crg_deal_details['Deduced Leads'] > 0"
                        href="#"
                        class="small"
                        onclick="download_crg_deduction_report(\'' . $percentage_id . '\', \'' . $timeframe . '\')"
                        >Download deduction report</a
                    >
                </div>
            </div>
        </template>
    </VModal>

    <VModal
        :open="viewCalculation.isActive.value"
        :tabs="true"
        title="View Payment Request"
        size="3xl"
        cancel-label="Close"
        actions="right"
        @close="viewCalculation.isActive.value = false"
    >
        <template #content>
            <Datatable :columns="ShemeViewCalculationList.columns" :model-value="viewCalculation.datatable.value ?? []" :custom="custom_pre_request" />
        </template>
    </VModal>

    <!-- Approve -->
    <ApiForm
        v-if="approve"
        :wrapper="VModal"
        size="small"
        title="Approve"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to approve this record?')"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/payment_requests/approve/${paymentRequestSelectId}`"
        @store-data="
            (response) => {
                if (response.error) {
                    notif.error(response.error)
                } else {
                    datatable?.fetchData()
                    notif.success('Updated Successfully')
                }
                approve = false
            }
        "
        @close="approve = false"
    />

    <!-- Reject -->
    <ApiForm
        v-if="archive_rejected"
        :wrapper="VModal"
        size="small"
        title="Archive Reject"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to archive this record?')"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/payment_requests/archive/${paymentRequestSelectId}`"
        @store-data="
            (response) => {
                if (response.error) {
                    notif.error(response.error)
                } else {
                    datatable?.fetchData()
                    notif.success('Updated Successfully')
                }
                archive_rejected = false
            }
        "
        @close="archive_rejected = false"
    />

    <!-- Archive -->
    <ApiForm
        v-if="reject"
        :wrapper="VModal"
        size="small"
        title="Reject"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reject this record?')"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/payment_requests/reject/${paymentRequestSelectId}`"
        @store-data="datatable?.fetchData(), (reject = false)"
        @close="reject = false"
    />

    <!-- paymentRequestMasterApproveModal - Master Approve -->
    <ApiForm
        v-if="master_approve"
        :wrapper="VModal"
        :gauth="true"
        title="Master Approve"
        :fetch-data="{}"
        :scheme="ShemeMasterApproveModal"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/payment_requests/master_approve/${paymentRequestSelectId}`"
        @store-data="
            (response) => {
                if (response.error) {
                    notif.error(response.error)
                } else {
                    datatable?.fetchData()
                    notif.success('Updated Successfully')
                }
                master_approve = false
            }
        "
        @close="master_approve = false"
    />

    <!-- paymentRequestFinalApproveModal - Final Approve -->
    <ApiForm
        v-if="final_approve"
        :wrapper="VModal"
        :gauth="true"
        :classes="['final_approve']"
        title="Final Approve"
        :model-value="final_approve_data"
        :fetch-data="{ payment_method: final_approve_data?.payment_method, date_pay: new Date() }"
        :scheme="ShemeFinalApproveModal"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/payment_requests/final_approve/${paymentRequestSelectId}`"
        @store-data="
            (response) => {
                if (response.error) {
                    notif.error(response.error)
                } else {
                    datatable?.fetchData()
                    notif.success('Updated Successfully')
                }
                final_approve = false
            }
        "
        @close="final_approve = false"
    />

    <ApiForm
        v-if="final_reject"
        :wrapper="VModal"
        size="small"
        title="Financial Reject"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reject the payment request?')"
        store-method="put"
        :store-data="`/traffic_endpoint/${props.id}/billing/payment_requests/final_reject/${paymentRequestSelectId}`"
        @store-data="datatable?.fetchData(), (final_reject = false)"
        @close="final_reject = false"
    />

    <!-- paymentRequestRealIncomeModal - Real Income -->
    <ApiForm
        v-if="real_income_approve"
        :wrapper="VModal"
        :gauth="true"
        title="Real Income"
        :fetch-data="init_real_income_approve"
        :scheme="ShemeRealIncomeModal"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/payment_requests/real_income/${paymentRequestSelectId}`"
        @store-data="
            (response) => {
                if (response.error) {
                    notif.error(response.error)
                } else {
                    datatable?.fetchData()
                    notif.success('Updated Successfully')
                }
                real_income_approve = false
            }
        "
        @close="real_income_approve = false"
    />

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable :columns="SchemeFilesList.columns" :uri="`/traffic_endpoint/${props.id}/billing/payment_requests/files/${files}`" :custom="custom" />
        </template>
    </VModal>
</template>

<style lang="scss">
small.tag {
    margin: 0 5px 5px 0;
}

form.columns.final_approve {
    display: block;
}
</style>
