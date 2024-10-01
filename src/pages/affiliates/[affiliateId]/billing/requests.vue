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

import SchemeList from '/@src/schemes/affiliates/billing/paymentRequestList.json'

import SchemeSearch from '/@src/schemes/affiliates/billing/paymentRequestSearch.json'

import SchemeNewPayment from '/@src/schemes/affiliates/billing/paymentRequestNewPayment.json'
import SchemeNewPrepayment from '/@src/schemes/affiliates/billing/paymentRequestNewPrepayment.json'

import ShemeViewCalculationList from '/@src/schemes/affiliates/billing/paymentRequestViewCalculationList.json'
import SchemeQueryList from '/@src/schemes/affiliates/billing/paymentRequestViewCalculationList.json'

import ShemeMasterApproveModal from '/@src/schemes/affiliates/billing/paymentRequestMasterApproveModal.json'
import ShemeFinalApproveModal from '/@src/schemes/affiliates/billing/paymentRequestFinalApproveModal.json'
import ShemeRealIncomeModal from '/@src/schemes/affiliates/billing/paymentRequestRealIncomeModal.json'

import SchemeFilesList from '/@src/schemes/brokers/billing/paymentRequestFilesList.json'

import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'

import VModal from '/@src/components/base/modal/VModal.vue'
import VTag from '/@src/components/base/tags/VTag.vue'
import VDropdown from '/@src/components/base/dropdown/VDropdown.vue'

export interface AffiliateProps {
    affiliateId: string
}

const props = defineProps<AffiliateProps>()

const viewWrapper = useViewWrapper()

const api = useApi()
api.get('/affiliates/' + props.affiliateId).then((response: any) =>
    viewWrapper.setPageTitle('Affiliate: #' + response?.data?.token + ' - Billing Payment Requests')
)

const notif = useNotyf()
const download = useDownload()

const paymentRequestSelectId = ref('')

const custom = Object.assign(
    BillingRenders(
        {
            calculations: (row) => (calculations.value = row._id),
            invoice: (row) => download.get(`affiliates${props.affiliateId}/billing/payment_requests/invoice/${row._id}`, 'Invoice.pdf'),
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
        // Statuses() {
        //     return (value: any, row: any) => {
        //         let statuses = []

        //         const get_render_status = (status: any) => {
        //             let color = ''
        //             if (status != null) {
        //                 switch (status.status) {
        //                     case 'active': {
        //                         color = 'success'
        //                         break
        //                     }
        //                     case 'inactive': {
        //                         color = 'danger'
        //                         break
        //                     }
        //                     case 'processing': {
        //                         color = 'warning'
        //                         break
        //                     }
        //                 }
        //                 if (status?.title?.length > 0) {
        //                     return h(VTag, { color: color }, () => status.title)
        //                 }
        //             }
        //             return null
        //         }

        //         const arr = ['status', 'affiliate_status', 'master_status', 'final_status', 'chargeback_status']
        //         for (var i = 0; i < arr.length; i++) {
        //             const status = get_render_status(row.statuses[arr[i]])

        //             if (status != null) {
        //                 statuses.push(status)
        //                 // statuses.push(h('span', { style: 'margin:0px 5px 5px 0px' }))
        //             }
        //         }

        //         return statuses
        //     }
        // },
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
                                        final_approve.value = true
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
                return actions.length > 0
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
        return (value: any, row: any) => {
            const items = []
            items.push(h('div', { innerHTML: value }))
            // if (row?.data?.crg_percentage_id?.length > 0) {
            //     items.push(
            //         h('a', {
            //             style: 'border-bottom: 1px dashed var(--light-text);',
            //             innerHTML: 'details',
            //             onClick: async () => {
            //                 const { data } = await api.post(
            //                     `/affiliates/${props.affiliateId}/billing/payment_requests/crg_details/${row.data.crg_percentage_id}`,
            //                     {
            //                         timeframe: create.timeframe.value,
            //                     }
            //                 )
            //                 crg_deal_details.value = data
            //             },
            //         })
            //     )
            // }
            return items
        }
    },
}

const datatable = ref<DatatableMethods>()

const viewCalculation = (function () {
    const datatable = ref([])
    const isActive = ref(false)
    const loading = ref([])

    const show = async (paymentRequestSelectId: string) => {
        const { data } = await api.get(`/affiliates/${props.affiliateId}/billing/payment_requests/calculations/${paymentRequestSelectId}`)
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
    const timeframe = ref('')
    const isDisabled = computed(() => query.payment_request_type == 'payment' && leads.value.length == 0)

    const show = () => {
        isActive.value = true
        leads.value = []
    }

    return {
        isLoading,
        isActive,
        isDisabled,
        leads,
        query,
        errors,
        timeframe,
        show,
        initial: {
            payment() {
                leads.value = []
                return {
                    affiliate: props.affiliateId,
                    payment_request_type: 'payment',
                    timeframe: DefaultTimeRange,
                }
            },
            prepayment: {
                affiliate: props.affiliateId,
                payment_request_type: 'prepayment',
            },
        },
        onQuery(response: any) {
            leads.value = response.items
            timeframe.value = response.timeframe
        },
        async onCreate() {
            if (isLoading.value) {
                return
            }
            try {
                isLoading.value = true
                const { data } = await api.post(`/affiliates/${props.affiliateId}/billing/payment_requests/create`, query)
                if (data.error) {
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

const payment_method_has_fee: Record<string, boolean> = {}
const payment_methods_data = ref<any>([])
const payment_methods = customDictionary(`/affiliates/${props.affiliateId}/billing/payment_methods/all`, (item) => {
    payment_methods_data.value.push(item)
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

const approve = ref<boolean>(false)
const reject = ref<boolean>(false)
const master_approve = ref<boolean>(false)
const archive_rejected = ref<boolean>(false)
const final_approve = ref<boolean>(false)
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
provide('traffic_endpoint_payment_methods', () => payment_methods)
provide('payment_method_has_fee', (value: string) => payment_method_has_fee[value])

provide('transaction_id_required', (value: number) => {
    const item = payment_methods_data.value.find((x: any) => x._id == value)
    return item && item.payment_method == 'crypto' && (item.currency_crypto_code == 'btc' || item.currency_crypto_code == 'usdt')
})
</script>

<template>
    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton color="primary" icon="fas fa-plus" elevated @click="create.show"> Add Payment Request </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/affiliates/${props.affiliateId}/billing/payment_requests/all`"
        :custom="custom"
        :classes="['padding-b-100-to-container']"
        :render-row="RenderRow"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <VModal :open="create.isActive.value" title="Add Payment Request" size="3xl" cancel-label="Close" actions="right" @close="create.isActive.value = false">
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
                    :store-data="`/affiliates/${props.affiliateId}/billing/payment_requests/pre_create_query`"
                    @store-data="create.onQuery"
                />
                <br />
                <Datatable :columns="SchemeQueryList.columns" :model-value="create.leads.value" :custom="custom_pre_request" />
            </template>
        </template>
        <template #action>
            <VButton :loading="create.isLoading.value" :disabled="create.isDisabled.value" color="primary" elevated @click="create.onCreate">
                Create Payment Request
            </VButton>
        </template>
    </VModal>

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
        :store-data="`/affiliates/${props.affiliateId}/billing/payment_requests/approve/${paymentRequestSelectId}`"
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
        :store-data="`/affiliates/${props.affiliateId}/billing/payment_requests/archive/${paymentRequestSelectId}`"
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
        :store-data="`/affiliates/${props.affiliateId}/billing/payment_requests/reject/${paymentRequestSelectId}`"
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
        :store-data="`/affiliates/${props.affiliateId}/billing/payment_requests/master_approve/${paymentRequestSelectId}`"
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
        :fetch-data="{ date_pay: new Date() }"
        :scheme="ShemeFinalApproveModal"
        store-method="post"
        :store-data="`/affiliates/${props.affiliateId}/billing/payment_requests/final_approve/${paymentRequestSelectId}`"
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
        :store-data="`/affiliates/${props.affiliateId}/billing/payment_requests/final_reject/${paymentRequestSelectId}`"
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
        :store-data="`/affiliates/${props.affiliateId}/billing/payment_requests/real_income/${paymentRequestSelectId}`"
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
            <Datatable :columns="SchemeFilesList.columns" :uri="`/affiliates/${props.affiliateId}/billing/payment_requests/files/${files}`" :custom="custom" />
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
