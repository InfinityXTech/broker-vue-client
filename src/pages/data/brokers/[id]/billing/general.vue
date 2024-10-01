<script setup lang="ts">
import { provide, reactive, ref, h } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { Money, RenderLogs } from '/@src/utils/datatable/simple-render'
import { useNotyf } from '/@src/composable/useNotyf'
import { AxiosError } from 'axios'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import { reactiveReplace } from '/@src/utils/helpers'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatablePagination } from '/@src/components/partials/tables/Datatable.vue'
import SchemeLogList from '/@src/schemes/brokers/billing/generalLogList.json'
import SchemeBalanceLogList from '/@src/schemes/brokers/billing/generalBalanceLogList.json'
import SchemeCRGLogList from '/@src/schemes/brokers/billing/generalCRGLogList.json'
import SchemeCRGLogForm from '/@src/schemes/brokers/billing/generalCRGLogForm.json'
import SchemeLogForm from '/@src/schemes/traffic_endpoints/billing/generalLogForm.json'
import SchemeCreditForm from '/@src/schemes/brokers/billing/generalCreditForm.json'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import RadioGroupField from '/@src/components/partials/forms/RadioGroupField.vue'
import Multiselect from '@vueform/multiselect'
import VLoader from '/@src/components/base/loader/VLoader.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const api = useApi()
const notif = useNotyf()
const renderMoney = Money(true)

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_billing_leave_running = perm.is_custom_allow('billing_leave_running')
const is_financial = userSession.roles().is('financial')

api.get('/broker/' + props.id).then((response: any) => viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - Billing General'))

const isFetching = ref(true)

const general: any = reactive({})

const fetchBalance = () => {
    api.get(`/broker/${props.id}/billing/general/balance`).then((response: any) => {
        isFetching.value = true
        reactiveReplace(general, response.data)
        negativeBalance.action.value = general.action_on_negative_balance
        isFetching.value = false
    })
}
fetchBalance()

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
                                .put(`/broker/${props.id}/billing/general/balance/logs/update/${row._id?.$oid ?? row._id}`, {
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
            const { data: response } = await api.post(`/broker/${props.id}/billing/general/balance/logs`, {
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

const crgLog = (function () {
    const isActive = ref(false)
    const isLoading = ref<boolean>(false)
    const data = ref<any[]>([])
    const fetchData = ref<{
        timeframe?: string
        action_by?: string
        country_code?: string
        crg?: boolean
    }>({ timeframe: DefaultTimeRange })
    const pagination = ref<DatatablePagination>({ page: 1, count_in_page: 20, total_items: 0 })

    const custom = {}

    const fetchLogData = async () => {
        try {
            isLoading.value = true
            const { data: response } = await api.post(`/broker/${props.id}/billing/recalculate/logs`, {
                page: pagination.value.page,
                count_in_page: pagination.value.count_in_page,
                ...fetchData.value,
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
    const goToPage = async (page: number) => {
        pagination.value.page = page
        await fetchLogData()
    }

    const onFormData = (response: any) => {
        fetchData.value = response
        fetchLogData()
    }

    const renderRow = (row: any): Record<string, any> => {
        return {
            class: [row.active ? 'log-recalculate-bg-true' : 'log-recalculate-bg-false'],
        }
    }

    return {
        isActive,
        isLoading,
        data,
        pagination,
        custom,
        onFormData,
        renderRow,
        hide() {
            isActive.value = false
            data.value = []
        },
        async show() {
            pagination.value = { page: 1, count_in_page: 20, total_items: 0 }
            await fetchLogData()
        },
        goToPage,
    }
})()

const log_collections = reactive([])
provide('log_collections', async () => log_collections)

const changeLog = (function () {
    const isActive = ref(false)
    const isLoading = ref(false)
    const data = ref<any[]>([])
    return {
        isActive,
        isLoading,
        data,
        hide() {
            isActive.value = false
            data.value = []
        },
        async show() {
            try {
                isLoading.value = true
                const { data: response } = await api.post(`/broker/${props.id}/billing/general/logs`, { extended: true })
                Object.assign(log_collections, response.collections)
                data.value = response.items
                isActive.value = true
            } catch (ex) {
                const error = ex as AxiosError
                notif.dismissAll()
                notif.error(error?.response?.data?.error ?? error.message)
            } finally {
                isLoading.value = false
            }
        },
        onData(response: any) {
            Object.assign(log_collections, response.collections)
            data.value = response.items
        },
    }
})()

const negativeBalance = (function () {
    general.action_on_negative_balance ??= ''
    let prev = reactive(general.action_on_negative_balance)
    const action = ref<string | number>()
    const changeTo = ref<string | number | false>(false)

    const options = [
        {
            color: 'primary',
            value: 'leave_running',
            label: 'Leave Running',
            disabled: !is_access_billing_leave_running,
        },
        {
            color: 'danger',
            value: 'stop',
            label: 'Stop if negative balance',
        },
    ]

    return {
        options: options,
        changeTo,
        action,
        cancel() {
            action.value = prev
            changeTo.value = false
        },
        tryChange(value: string | number) {
            prev = action.value
            action.value = value
            changeTo.value = value
        },
        async onStore() {
            changeTo.value = false
            reactiveReplace(general, (await api.get(`/broker/${props.id}/billing/general/balance`)).data)
        },
    }
})()

const credits = (function () {
    const amount = ref(general.credit)
    const isActive = ref(false)
    return {
        amount,
        isActive,
    }
})()

const onChangeManualStatus = async (val: string) => {
    await api.put(`/broker/${props.id}/billing/manual_status`, { billing_manual_status: val })
    notif.success('Updated Successfully')
}
</script>

<template>
    <div class="broker-billing-general-page">
        <LocalToolbar>
            <ToolbarItem icon="fas fa-file-alt" title="Show balances log" @click="balanceLog.show" />
            <ToolbarItem
                icon="fas fa fa-recycle"
                :is-loading="!crgLog.isActive.value && crgLog.isLoading.value"
                title="Show Recalculate Log"
                @click="crgLog.show"
            />
            <CurrencyConverter />
        </LocalToolbar>

        <VLoader :active="isFetching" size="xl">
            <div class="block">
                <h2>
                    Balance:
                    <span class="big-text balance" :class="general.balance < 0 ? 'money-negative' : 'money-positive'">{{ renderMoney(general.balance) }}</span>
                    <span class="big-text balance-status" :class="'status-' + general.status?.toLowerCase()">({{ general.status }})</span>

                    <div v-if="general.manual_status" class="manual-status" style="display: inline-block; width: 200px">
                        <Multiselect
                            :model-value="general.manual_status"
                            :options="general.manual_statuses"
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
                </h2>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div class="text-muted" v-html="general.desc"></div>
            </div>

            <div class="block settings-negative-balance">
                <h2>Settings Negative Balance</h2>
                <RadioGroupField
                    :model-value="negativeBalance.action.value"
                    :options="negativeBalance.options"
                    @update:model-value="negativeBalance.tryChange"
                />
                <ApiForm
                    v-if="negativeBalance.changeTo.value"
                    title="Set broker's settings negative ballance"
                    :wrapper="VModal"
                    :gauth="true"
                    :scheme="schemeConfirm('Are you sure you want to save the broker\'s negative ballance?')"
                    :fetch-data="{ action: negativeBalance.changeTo.value }"
                    store-method="put"
                    :store-data="`/broker/${props.id}/billing/general/settings/negative_balance`"
                    @store-data="negativeBalance.onStore"
                    @close="negativeBalance.cancel"
                />
                <!-- $is_financial && $action_on_negative_balance == 'stop' && $result < 0 -->
                <VButton
                    v-if="is_financial && general.action_on_negative_balance == 'stop' && general.balance < 0"
                    icon="fas fa-dollar-sign"
                    @click="credits.isActive.value = true"
                >
                    Change Credit
                </VButton>
                <ApiForm
                    v-if="credits.isActive.value"
                    title="Change Credit"
                    :wrapper="VModal"
                    size="small"
                    :scheme="SchemeCreditForm"
                    :fetch-data="{ amount: credits.amount.value }"
                    store-method="put"
                    :store-data="`/broker/${props.id}/billing/general/settings/credit_amount`"
                    @store-data="credits.isActive.value = false"
                    @close="credits.isActive.value = false"
                />
            </div>

            <div class="block block-log" style="clear: both">
                <h2>Log</h2>
                <Datatable :columns="SchemeLogList.columns" :uri="`/broker/${props.id}/billing/general/logs`" :render-row="RenderLogs" />
                <br />
                <VButton :loading="changeLog.isLoading.value" color="danger" @click="changeLog.show">See All</VButton>
            </div>

            <VModal :open="changeLog.isActive.value" title="History log" size="big" cancel-label="Close" actions="right" @close="changeLog.hide">
                <template #content>
                    <ApiForm
                        title=""
                        :wrapper="PageToolbar"
                        :scheme="SchemeLogForm"
                        :fetch-data="{ extended: true }"
                        store-label="Search"
                        store-method="post"
                        :store-data="`/broker/${props.id}/billing/general/logs`"
                        @store-data="changeLog.onData"
                    />
                    <Datatable :columns="SchemeLogList.columns" :model-value="changeLog.data.value" :render-row="RenderLogs" />
                </template>
            </VModal>

            <VModal
                :open="balanceLog.isActive.value"
                :tabs="true"
                title="Balances Log"
                size="medium"
                cancel-label="Close"
                actions="right"
                @close="balanceLog.hide"
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

            <VModal :open="crgLog.isActive.value" :tabs="true" title="Recalculate Log" size="4xl" cancel-label="Close" actions="right" @close="crgLog.hide">
                <template #content>
                    <div class="broker-billing-recalculate-logs">
                        <ApiForm
                            title=""
                            :wrapper="PageToolbar"
                            :scheme="SchemeCRGLogForm"
                            :fetch-data="{ timeframe: DefaultTimeRange }"
                            store-label="Search"
                            store-on="delay"
                            :store-data="crgLog.onFormData"
                        />
                        <Datatable
                            :columns="SchemeCRGLogList.columns"
                            :pagination="crgLog.pagination.value"
                            :model-value="crgLog.data.value"
                            :loading="crgLog.isLoading.value"
                            :custom="crgLog.custom"
                            :render-row="crgLog.renderRow"
                            loader-size="large"
                            @go-to-page="(page) => crgLog.goToPage(page)"
                        />
                    </div>
                </template>
            </VModal>
        </VLoader>
    </div>
</template>

<style lang="scss">
.broker-billing-recalculate-logs {
    padding: 10px;
    min-height: 500px;

    .log-recalculate-bg-true {
        background-color: var(--success);

        * {
            color: var(--white) !important;
        }
    }

    .log-recalculate-bg-false {
        background-color: var(--danger);

        * {
            color: var(--white) !important;
        }
    }
}

.broker-billing-general-page {
    .radio.is-solid input:disabled + span::after {
        color: var(--white);
    }

    .text-muted {
        color: var(--dark-dark-text);
    }

    .block {
        padding-bottom: 40px;

        h2 {
            font-size: 28px;
            font-weight: bold;
        }
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
