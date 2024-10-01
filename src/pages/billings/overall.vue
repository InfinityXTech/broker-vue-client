<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { Money } from '/@src/utils/datatable/simple-render'
import VCardAdvanced from '/@src/components/base/card/VCardAdvanced.vue'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const api = useApi()
const router = useRouter()
const userSession = useUserSession()
const perm = userSession.permissions('billings')

if (!perm.is_allow('overall')) {
    if (perm.is_allow('pending_payments')) {
        location.href = '/billings/pending_payments'
    } else {
        if (perm.is_allow('brokers_balances')) {
            location.href = '/billings/brokers_balances'
        } else {
            if (perm.is_allow('endpoint_balances')) {
                location.href = '/billings/endpoint_balances'
            } else {
                router.push({ name: '403' })
            }
        }
    }
}

const renderMoney = Money(false)

const isLoading = ref(true)
const overall = ref<any | null>({
    brokers_debt_balance: 0,
    brokers_overall_balance: 0,
    brokers_prepayment_balance: 0,
    brokers_collection_balance: 0,
    endpoints_debt_balance: 0,
    endpoints_overall_balance: 0,
    endpoints_prepayment_balance: 0,
    endpoints_collection_balance: 0,
    time: 0,
})
let request: Promise<any> = api.get('/billings/overall')
request.then((response) => {
    isLoading.value = false
    overall.value = response.data
})
onUnmounted(() => {
    overall.value = null
})
</script>

<template>
    <SidemenuTabs />
    <div class="billings-page">
        <VLoader :active="isLoading" size="xl">
            <div class="columns is-multiline">
                <div class="column inv-column" :class="['is-5']">
                    <VCardAdvanced>
                        <template #header-left> <span class="head-text">Brokers</span> </template>
                        <template #content>
                            <h2>Total balance:</h2>
                            <span class="big-text total-balance" :class="overall.brokers_overall_balance < 0 ? 'money-negative' : 'money-positive'">{{
                                renderMoney(overall.brokers_overall_balance)
                            }}</span>
                        </template>
                        <template #footer-left>
                            <div class="item">
                                <h3>Total prepayment:</h3>
                                <span
                                    class="middle-text total-prepayment"
                                    :class="overall.brokers_prepayment_balance < 0 ? 'money-negative' : 'money-positive'"
                                    >{{ renderMoney(overall.brokers_prepayment_balance) }}</span
                                >
                            </div>
                            <div class="item">
                                <h4>Total debt:</h4>
                                <span class="middle-text total-debt" :class="overall.brokers_debt_balance < 0 ? 'money-negative' : 'money-positive'">{{
                                    renderMoney(overall.brokers_debt_balance)
                                }}</span>
                            </div>
                            <div class="item">
                                <h4>Total collection:</h4>
                                <span class="middle-text total-collection" :class="'money-negative'">{{
                                    renderMoney(overall.brokers_collection_balance)
                                }}</span>
                            </div>
                        </template>
                    </VCardAdvanced>
                </div>
                <div class="column inv-column" :class="['is-5']">
                    <VCardAdvanced>
                        <template #header-left> <span class="head-text">Endpoints</span> </template>
                        <template #content>
                            <h2>Total balance:</h2>
                            <span class="big-text total-balance" :class="overall.endpoints_overall_balance < 0 ? 'money-negative' : 'money-positive'">{{
                                renderMoney(overall.endpoints_overall_balance)
                            }}</span>
                        </template>
                        <template #footer-left>
                            <div class="item">
                                <h3>Total prepayment:</h3>
                                <span
                                    class="middle-text total-prepayment"
                                    :class="overall.endpoints_prepayment_balance < 0 ? 'money-negative' : 'money-positive'"
                                    >{{ renderMoney(overall.endpoints_prepayment_balance) }}</span
                                >
                            </div>
                            <div class="item">
                                <h4>Total debt:</h4>
                                <span class="middle-text total-debt" :class="overall.endpoints_debt_balance < 0 ? 'money-negative' : 'money-positive'">{{
                                    renderMoney(overall.endpoints_debt_balance)
                                }}</span>
                            </div>
                            <div class="item total-collection">
                                <h4>Total collection:</h4>
                                <span class="middle-text" :class="'money-negative'">{{ renderMoney(overall.endpoints_collection_balance) }}</span>
                            </div>
                        </template>
                    </VCardAdvanced>
                </div>
            </div>
        </VLoader>
    </div>
</template>
<style lang="scss">
.billings-page {
    .card-foot {
        .left {
            display: block !important;
        }

        .item {
            display: block;
        }
    }

    .text-muted {
        color: var(--dark-dark-text);
    }

    .head-text {
        font-size: 26px;
    }

    .big-text {
        font-size: 36px;
        font-weight: bold;
    }

    .middle-text {
        font-size: 26px;
        margin: 0 10px;
    }

    .money-negative {
        color: var(--danger);
    }
}
</style>
