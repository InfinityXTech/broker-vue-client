<script setup lang="ts">
import { provide, reactive, ref } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { Money, RenderLogs } from '/@src/utils/datatable/simple-render'
import { useNotyf } from '/@src/composable/useNotyf'
import { AxiosError } from 'axios'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeLogList from '/@src/schemes/masters/billing/generalLogList.json'
import SchemeBalanceLogList from '/@src/schemes/masters/billing/generalBalanceLogList.json'
import SchemeLogForm from '/@src/schemes/traffic_endpoints/billing/generalLogForm.json'
import SchemeCreditForm from '/@src/schemes/masters/billing/generalCreditForm.json'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import RadioGroupField from '/@src/components/partials/forms/RadioGroupField.vue'

export interface MasterProps {
    id: string
}

const api = useApi()
const notif = useNotyf()

const props = defineProps<MasterProps>()

const renderMoney = Money(true)

const isFetching = ref(true)
const general = ref({ balance: 0, status: '', desc: '' })
api.get(`/master/${props.id}/billing/general/balance`).then((response: any) => {
    general.value = response.data
    isFetching.value = false
})

const balanceLog = (function () {
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
                const { data: response } = await api.get(`/broker/${props.id}/billing/general/balance/logs`)
                data.value = response
                isActive.value = true
            } catch (ex) {
                const error = ex as AxiosError
                notif.dismissAll()
                notif.error(error?.response?.data?.error ?? error.message)
            } finally {
                isLoading.value = false
            }
        },
    }
})()

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
                const { data: response } = await api.post(`/master/${props.id}/billing/general/logs`, { extended: true })
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

const log_collections = reactive([])
provide('log_collections', async () => log_collections)
</script>

<template>
    <div class="block">
        <VLoader :active="isFetching" size="xl">
            <h2>
                Balance:
                <span class="big-text balance" :class="general.balance < 0 ? 'money-negative' : 'money-positive'">{{ renderMoney(general.balance) }}</span>
                <span class="big-text balance-status" :class="'status-' + general.status?.toLowerCase()">({{ general.status }})</span>
            </h2>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="text-muted" v-html="general.desc"></div>

            <br />
            <br />
            <div class="block block-log">
                <h2>Log</h2>
                <Datatable :columns="SchemeLogList.columns" :uri="`/master/${props.id}/billing/general/logs`" :render-row="RenderLogs" />
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
                        :store-data="`/master/${props.id}/billing/general/logs`"
                        @store-data="changeLog.onData"
                    />
                    <Datatable :columns="SchemeLogList.columns" :model-value="changeLog.data.value" :render-row="RenderLogs" />
                </template>
            </VModal>
        </VLoader>
    </div>
</template>

<style scoped lang="scss">
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
</style>