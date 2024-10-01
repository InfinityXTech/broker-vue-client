<script setup lang="ts">
import { computed, h, provide, reactive, ref } from 'vue'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import { customDictionary, customSimpleDictionary } from '/@src/utils/dictionary'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { AxiosError } from 'axios'
import { reactiveReplace } from '/@src/utils/helpers'
import BillingRenders from '/@src/utils/datatable/billing-render'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeSearch from '/@src/schemes/masters/billing/paymentRequestSearch.json'
import SchemeNewPayment from '/@src/schemes/masters/billing/paymentRequestNewPayment.json'
import SchemeNewPrepayment from '/@src/schemes/masters/billing/paymentRequestNewPrepayment.json'
import SchemeNewWallet from '/@src/schemes/masters/billing/paymentMethodsNew.json'

import SchemeNewPaymentRequestSecondStep from '/@src/schemes/masters/billing/paymentRequestSecondStep.json'
import SchemeNewPaymentRequestThirdStep from '/@src/schemes/masters/billing/paymentRequestThirdStep.json'

import SchemeFinApprove from '/@src/schemes/masters/billing/paymentRequestFinApprove.json'
import SchemeRealIncome from '/@src/schemes/masters/billing/paymentRequestRealIncomeModal.json'
import SchemeMasterApprove from '/@src/schemes/masters/billing/paymentRequestMasterApprove.json'
import ShemeRealIncomeModal from '/@src/schemes/masters/billing/paymentRequestRealIncomeModal.json'
import SchemeList from '/@src/schemes/masters/billing/paymentRequestsList.json'
import SchemeQueryList from '/@src/schemes/masters/billing/paymentRequestViewCalculationList.json'
import SchemeFilesList from '/@src/schemes/masters/billing/paymentRequestFilesList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VDropdown from '/@src/components/base/dropdown/VDropdown.vue'
import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'
import { ApiFormValidate } from '/@src/components/partials/ApiForm.vue'

export interface MasterProps {
    id: string
}

const props = defineProps<MasterProps>()

const api = useApi()
const notif = useNotyf()

const custom = Object.assign(
    BillingRenders(
        {
            calculations: (row) => (calculations.value = row._id),
            // invoice: (row) => window.open(`/master/${props.id}/billing/payment_requests/invoice/${row._id}`),
            files: (row) => (files.value = row._id),
        },
        'master'
    ),
    {
        Actions() {
            return (value: any, row: any) => {
                let actions: any[] = []
                for (let i = 0; i < value?.length; i++) {
                    actions.push(
                        h('a', {
                            href: '#',
                            class: 'dropdown-item',
                            onClick: (ev: Event) => {
                                ev.preventDefault()
                                switch (value[i].name) {
                                    case 'approve': {
                                        approve.value = row._id
                                        break
                                    }
                                    case 'reject': {
                                        reject.value = row._id
                                        break
                                    }
                                    case 'archive_rejected': {
                                        archive.value = row._id
                                        break
                                    }
                                    case 'real_income': {
                                        real_income_approve.value = row._id
                                        init_real_income_approve.expected_income = row.total ?? 0
                                        init_real_income_approve.real_income = (row.total ?? 0) + (row.total_adjust ?? 0)
                                        break
                                    }
                                    case 'master_approve': {
                                        master_approve.value = row._id
                                        break
                                    }
                                    case 'final_approve': {
                                        fin_approve.value = row._id
                                        fin_approve_data.payment_method = row?.payment_method
                                        fin_approve_data.final_status_date_pay = new Date()
                                        break
                                    }
                                    case 'fin_reject': {
                                        fin_reject.value = row._id
                                        break
                                    }
                                }
                            },
                            innerHTML: value[i].title,
                        })
                    )
                }
                return actions?.length > 0
                    ? h(
                          VDropdown,
                          { title: 'Action', right: true },
                          {
                              content() {
                                  return actions
                              },
                          }
                      )
                    : ''
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
}

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
            (query.payment_request_type == 'payment' && leads.value?.length == 0) ||
            (initial.proof.proof_screenshots ?? []).length == 0 ||
            (initial.proof.master_approve_files ?? []).length == 0 ||
            (initial.proof.proof_description ?? '').length == 0
    )
    const step = ref(1)
    const new_wallet = ref(false)
    const initial = reactive({
        payment: {
            master: props.id,
            payment_request_type: 'payment',
            timeframe: DefaultTimeRange,
        },
        prepayment: {
            master: props.id,
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
            if (n != 'master' && n != 'timeframe') {
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

    const next = () => {
        if (step.value == 1 && !formEvents[query.payment_request_type]?.checkValidate()) {
            return
        }

        if (step.value == 2) {
            const item = payment_methods_data.value.find((x: any) => x._id == initial.wallet.payment_method)
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
                const data_request = {
                    __auth_code__: query.__auth_code__,
                    master: props.id,
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
                    form.append('master_approve_files[]', initial.proof.master_approve_files[n]._id)
                }
                for (var n in initial.proof.proof_screenshots ?? []) {
                    form.append('proof_screenshots[]', initial.proof.proof_screenshots[n]._id)
                }
                form.append('leads', JSON.stringify(leads.value))

                try {
                    const { data } = await api.post(`/master/${props.id}/billing/payment_requests/create`, form)
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

const approve = ref<string | false>(false)
const master_approve = ref<string | false>(false)
const reject = ref<string | false>(false)
const fin_approve = ref<any>(false)
const fin_approve_data = reactive({ payment_method: fin_approve?.value?.payment_method, final_status_date_pay: new Date() })
const fin_reject = ref<string | false>(false)
const real_income_approve = ref<string | false>(false)
const archive = ref<string | false>(false)
const calculations = ref<string | false>(false)
const files = ref<string | false>(false)
const datatable = ref<DatatableMethods>()

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

provide('master_billing_entities', customSimpleDictionary(`/master/${props.id}/billing/entities/all`, '_id', 'company_legal_name'))

const payment_method_has_fee: Record<string, boolean> = {}
const payment_methods_data = ref<any>([])
const payment_methods = ref()
const get_payment_methods = () => {
    payment_methods.value = customDictionary(`/master/${props.id}/billing/payment_methods/all`, (item) => {
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

provide('custom_payment_methods', () => payment_methods.value)

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

const RenderRow = (row: any): Record<string, any> => {
    return {
        class: [row.sub_status == 'archive' && 'payment_requests_bg_archive'],
    }
}

provide('get_row_sub_status', (row: any) => row.sub_status ?? 'active')
provide('payment_method_required', () => {
    return (fin_approve_data.payment_method ?? '').length == 0
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
        <VButton color="primary" icon="fas fa-plus" elevated @click="create.show"> Add Payment Request </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/master/${props.id}/billing/payment_requests/all`"
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
                    :store-data="`/master/${props.id}/billing/payment_requests/pre_create_query`"
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
                    (create.query.payment_request_type == 'payment' && create.leads.value?.length == 0)
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
        :open="create.gauth.value"
        :classes="['google_auth']"
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
        :store-data="`/master/${props.id}/billing/payment_methods/create`"
        @store-data="create.store_new_payment_request"
        @events="(value) => (create.formEvents['new_wallet'] = value)"
        @close="create.new_wallet.value = false"
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
            <Datatable :columns="SchemeQueryList.columns" :uri="`/master/${props.id}/billing/payment_requests/calculations/${calculations}`" :custom="custom" />
        </template>
    </VModal>

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable :columns="SchemeFilesList.columns" :uri="`/master/${props.id}/billing/payment_requests/files/${files}`" :custom="custom" />
        </template>
    </VModal>

    <ApiForm
        v-if="approve"
        :wrapper="VModal"
        title="Approval"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="put"
        :store-data="`/master/${props.id}/billing/payment_requests/approve/${approve}`"
        @store-data="datatable?.fetchData(), (approve = false)"
        @close="approve = false"
    />

    <ApiForm
        v-if="master_approve"
        :wrapper="VModal"
        :gauth="true"
        title="Master Approve"
        :fetch-data="`/master/${props.id}/billing/payment_requests/${master_approve}`"
        :scheme="SchemeMasterApprove"
        store-method="post"
        :store-data="`/master/${props.id}/billing/payment_requests/master_approve/${master_approve}`"
        @store-data="datatable?.fetchData(), (master_approve = false)"
        @close="master_approve = false"
    />

    <ApiForm
        v-if="reject"
        :wrapper="VModal"
        size="small"
        title="Reject"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reject the payment request?')"
        store-method="put"
        :store-data="`/master/${props.id}/billing/payment_requests/reject/${reject}`"
        @store-data="datatable?.fetchData(), (reject = false)"
        @close="reject = false"
    />

    <ApiForm
        v-if="archive"
        :wrapper="VModal"
        size="small"
        title="Archive"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to archive the payment request?')"
        store-method="put"
        :store-data="`/master/${props.id}/billing/payment_requests/archive/${archive}`"
        @store-data="datatable?.fetchData(), (archive = false)"
        @close="archive = false"
    />

    <ApiForm
        v-if="fin_approve"
        :wrapper="VModal"
        :classes="['final_approve']"
        title="Financial Approval"
        :model-value="fin_approve_data"
        :fetch-data="{ payment_method: fin_approve_data?.payment_method, final_status_date_pay: new Date() }"
        :scheme="SchemeFinApprove"
        store-method="post"
        :store-data="`/master/${props.id}/billing/payment_requests/fin_approve/${fin_approve}`"
        @store-data="
            (response) => {
                if (response?.error) {
                    notif.error(response?.error)
                } else {
                    datatable?.fetchData()
                    notif.success('Updated Successfully')
                }
                fin_approve = false
            }
        "
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
        :store-data="`/master/${props.id}/billing/payment_requests/fin_reject/${fin_reject}`"
        @store-data="datatable?.fetchData(), (fin_reject = false)"
        @close="fin_reject = false"
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
        :store-data="`/master/${props.id}/billing/payment_requests/real_income/${real_income_approve}`"
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
</template>
<style lang="scss">
form.columns.final_approve {
    display: block;
}

.modal.google_auth {
    z-index: 300 !important;
}
</style>
    