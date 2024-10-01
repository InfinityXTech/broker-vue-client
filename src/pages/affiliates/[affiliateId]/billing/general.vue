<script setup lang="ts">
import { h, provide, reactive, ref } from 'vue'
import { Money, RenderLogs } from '/@src/utils/datatable/simple-render'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { AxiosError } from 'axios'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatablePagination } from '/@src/components/partials/tables/Datatable.vue'
import SchemeLogList from '/@src/schemes/affiliates/billing/generalLogList.json'
import SchemeBalanceLogList from '/@src/schemes/affiliates/billing/generalBalanceLogList.json'
import SchemeLogForm from '/@src/schemes/affiliates/billing/generalLogForm.json'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import VLoader from '/@src/components/base/loader/VLoader.vue'
import HtmlField from '/@src/components/partials/forms/HtmlField.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface AffiliateProps {
    affiliateId: string
}

const props = defineProps<AffiliateProps>()

const viewWrapper = useViewWrapper()

const notif = useNotyf()
const api = useApi()
api.get('/affiliates/' + props.affiliateId).then((response: any) => viewWrapper.setPageTitle('Affiliate: #' + response?.data?.token + ' - Billing General'))

const userSession = useUserSession()
const is_financial = userSession.roles().is('financial')

const isLoading = ref(false)

const balanceData = ref({
    balance: 0,
    status: '',
    manual_status: '',
    manual_statuses: [],
    desc: '',
    history: { items: [] },
    color: undefined,
})

const renderMoney = Money(true)

const isFetching = ref(true)
setTimeout(async () => {
    const { data } = await api.get(`/affiliates/${props.affiliateId}/billing/general_balances/feed`)
    isFetching.value = false
    balanceData.value = data
}, 10)

const custom = {
    Html() {
        return (value: any) => {
            return h(HtmlField, {
                html: value,
            })
        }
    },
}

const stylesBalance = { 'font-size': '36px', 'font-weight': 'bold', color: undefined }
if (balanceData.value.color) {
    stylesBalance.color = balanceData.value.color
}

const log_collections = reactive([])
provide('log_collections', async () => log_collections)

const logModalData = ref([])
const logModalActive = ref(false)
const logModalLoading = ref(false)
const logModal = {
    initial: {
        collection: 'all',
    },
    openModal: async () => {
        isLoading.value = true
        await logModal.onLoad()
        logModalActive.value = true
        isLoading.value = false
    },
    onLoad: async () => {
        logModalLoading.value = true
        const { data } = await api.post(`/affiliates/${props.affiliateId}/billing/general_balances/history_log`, {})
        logModalData.value = data.items
        Object.assign(log_collections, data.collections)
        logModalActive.value = true
        logModalLoading.value = false
    },
    onStored: (data: any) => {
        logModalData.value = data.items
    },
}

const RenderGeneralLogs = (row: any) => {
    return { class: row.action.value && 'logs-' + row.action.value.toLowerCase() }
}

logModalActive.value = false
logModalLoading.value = false

const balanceLog = (function () {
    const isActive = ref(false)
    const isLoading = ref<boolean>(false)
    const data = ref<any[]>([])
    const pagination = ref<DatatablePagination>({ page: 1, count_in_page: 20, total_items: 0 })

    const custom = {
        RealBalance() {
            return (value: any, row: any) => {
                if (!is_financial) {
                    return h('span', { innerHTML: value })
                } else {
                    return h('input', {
                        type: 'number',
                        class: 'input',
                        style: 'width:90px;height: 100%;',
                        value: value,
                        onChange: async (e: any) => {
                            const value = parseInt(e.target.value)
                            await api
                                .put(`/affiliates/${props.affiliateId}/billing/general_balances/balances_log/update/${row._id?.$oid ?? row._id}`, {
                                    real_balance: value,
                                })
                                .then(() => notif.success('Updated Successfully'))
                        },
                    })
                }
            }
        },
    }

    const fetch_data = async () => {
        try {
            isLoading.value = true
            const { data: response } = await api.post(`/affiliates/${props.affiliateId}/billing/general_balances/balances_log`, {
                page: pagination.value.page,
                count_in_page: pagination.value.count_in_page,
            })
            pagination.value.total_items = response.count
            data.value = response.items
            isActive.value = true
        } catch (ex) {
            const error = ex as AxiosError
            notif.dismissAll()
            notif.error(error?.response?.data?.error ?? error.message)
        } finally {
            isLoading.value = false
        }
    }
    const go_to_page = async (page: number) => {
        pagination.value.page = page
        await fetch_data()
    }

    return {
        isActive,
        isLoading,
        data,
        pagination,
        custom,
        hide() {
            isActive.value = false
            data.value = []
        },
        async show() {
            pagination.value = { page: 1, count_in_page: 20, total_items: 0 }
            await fetch_data()
        },
        go_to_page,
    }
})()

const onChangeManualStatus = async (val: string) => {
    await api.put(`/affiliates/${props.affiliateId}/billing/manual_status`, { billing_manual_status: val })
    notif.success('Updated Successfully')
}
</script>

<template>
    <div class="endpoint-billing-general-page">
        <LocalToolbar>
            <ToolbarItem icon="fas fa-file-alt" title="Show balances log" @click="balanceLog.show" />
        </LocalToolbar>

        <VLoader :active="isFetching" size="xl">
            <div style="padding-bottom: 40px">
                <div style="font-size: 28px; font-weight: bold">
                    Balance:
                    <span class="big-text balance" :class="balanceData.balance < 0 ? 'money-negative' : 'money-positive'">{{
                        renderMoney(balanceData.balance)
                    }}</span>
                    <!-- <span :style="stylesBalance">{{ balanceData.balance }}</span> -->
                    <span class="balance-status" style="margin-left: 20px; font-size: 36px; font-weight: bold; color: green">({{ balanceData.status }})</span>
                    &nbsp;
                    <div v-if="balanceData.manual_status" class="manual-status" style="display: inline-block; width: 200px">
                        <Multiselect
                            :model-value="balanceData.manual_status"
                            :options="balanceData.manual_statuses"
                            :searchable="false"
                            :allow-empty="false"
                            :can-clear="false"
                            :can-deselect="false"
                            :mode="'single'"
                            :placeholder="'Select Some Option'"
                            :no-options-text="'The listName is empty'"
                            :no-results-text="'No results found'"
                            @update:model-value="(val) => onChangeManualStatus(val)"
                        />
                    </div>
                </div>
                <div style="color: gray">[{{ balanceData.desc }}]</div>
            </div>
            <div style="font-size: 28px; font-weight: bold">Log</div>
            <Datatable :columns="SchemeLogList.columns" :model-value="balanceData.history.items" :custom="custom" :render-row="RenderGeneralLogs" />
            <br />
            <VButton :loading="logModalLoading" :color="'danger'" @click="logModal.openModal">See All</VButton>

            <VModal :open="logModalActive" :title="'History log'" size="big" cancel-label="Close" actions="right" @close="logModalActive = false">
                <template #content>
                    <ApiForm
                        title=""
                        :wrapper="PageToolbar"
                        :scheme="SchemeLogForm"
                        :fetch-data="logModal.initial"
                        store-label="Search"
                        store-method="post"
                        :store-data="`/affiliates/${props.affiliateId}/billing/general_balances/history_log`"
                        @store-data="logModal.onStored"
                    />

                    <Datatable :columns="SchemeLogList.columns" :model-value="logModalData" :custom="custom" :render-row="RenderLogs" />
                </template>
            </VModal>

            <VModal
                :open="balanceLog.isActive.value"
                :title="'Balances Log'"
                size="medium"
                cancel-label="Close"
                actions="right"
                @close="balanceLog.isActive.value = false"
            >
                <template #content>
                    <Datatable
                        :columns="SchemeBalanceLogList.columns"
                        :pagination="balanceLog.pagination.value"
                        :model-value="balanceLog.data.value"
                        :loading="balanceLog.isLoading.value"
                        :custom="balanceLog.custom"
                        loader-size="large"
                        @go-to-page="(page) => balanceLog.go_to_page(page)"
                    />
                </template>
            </VModal>
        </VLoader>
    </div>
</template>
<style lang="scss">
.endpoint-billing-crg-logs {
    padding: 10px;
    min-height: 500px;

    .log-crg-bg-true {
        background-color: var(--success);

        * {
            color: var(--white) !important;
        }
    }

    .log-crg-bg-false {
        background-color: var(--danger);

        * {
            color: var(--white) !important;
        }
    }
}

.endpoint-billing-general-page {
    .modal-card .dataTable-wrapper {
        overflow: auto !important;
        max-height: 368px;
    }

    .big-text {
        font-size: 36px;
        font-weight: bold;
        margin-right: 20px;
    }

    .status-active,
    .money-positive {
        color: var(--primary);
    }

    .status-inactive,
    .money-negative {
        color: var(--danger);
    }
}
</style>
