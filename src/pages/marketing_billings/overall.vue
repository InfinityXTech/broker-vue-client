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
const perm = userSession.permissions('marketing_billings')

if (!perm.is_allow('overall')) {
    if (perm.is_allow('pending_payments')) {
        location.href = '/marketing_billings/pending_payments'
    } else {
        if (perm.is_allow('advertisers_balances')) {
            location.href = '/marketing_billings/advertisers_balances'
        } else {
            if (perm.is_allow('affiliates_balances')) {
                location.href = '/marketing_billings/affiliates_balances'
            } else {
                router.push({ name: '403' })
            }
        }
    }
}

const renderMoney = Money(false)

const isLoading = ref(true)
const overall = ref<any | null>({
    advertisers_debt_balance: 0,
    advertisers_overall_balance: 0,
    advertisers_prepayment_balance: 0,
    advertisers_collection_balance: 0,
    affiliates_debt_balance: 0,
    affiliates_overall_balance: 0,
    affiliates_prepayment_balance: 0,
    affiliates_collection_balance: 0,
    time: 0,
})
let request: Promise<any> = api.get('/marketing_billings/overall')
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
                        <template #header-left> <span class="head-text">Advertisers</span> </template>
                        <template #content>
                            <h2>Total balance:</h2>
                            <span class="big-text balance" :class="overall.advertisers_overall_balance < 0 ? 'money-negative' : 'money-positive'">{{
                                renderMoney(overall.advertisers_overall_balance)
                            }}</span>
                        </template>
                        <template #footer-left>
                            <div class="item">
                                <h3>Total prepayment:</h3>
                                <span
                                    class="middle-text total-prepayment"
                                    :class="overall.advertisers_prepayment_balance < 0 ? 'money-negative' : 'money-positive'"
                                    >{{ renderMoney(overall.advertisers_prepayment_balance) }}</span
                                >
                            </div>
                            <div class="item">
                                <h4>Total debt:</h4>
                                <span class="middle-text total-debt" :class="overall.advertisers_debt_balance < 0 ? 'money-negative' : 'money-positive'">{{
                                    renderMoney(overall.advertisers_debt_balance)
                                }}</span>
                            </div>
                            <div class="item">
                                <h4>Total collection:</h4>
                                <span class="middle-text total-collection" :class="'money-negative'">{{
                                    renderMoney(overall.advertisers_collection_balance)
                                }}</span>
                            </div>
                        </template>
                    </VCardAdvanced>
                </div>
                <div class="column inv-column" :class="['is-5']">
                    <VCardAdvanced>
                        <template #header-left> <span class="head-text">Affiliates</span> </template>
                        <template #content>
                            <h2>Total balance:</h2>
                            <span class="big-text total-balance" :class="overall.affiliates_overall_balance < 0 ? 'money-negative' : 'money-positive'">{{
                                renderMoney(overall.affiliates_overall_balance)
                            }}</span>
                        </template>
                        <template #footer-left>
                            <div class="item">
                                <h3>Total prepayment:</h3>
                                <span
                                    class="middle-text total-prepayment"
                                    :class="overall.affiliates_prepayment_balance < 0 ? 'money-negative' : 'money-positive'"
                                    >{{ renderMoney(overall.affiliates_prepayment_balance) }}</span
                                >
                            </div>
                            <div class="item">
                                <h4>Total debt:</h4>
                                <span class="middle-text total-debt" :class="overall.affiliates_debt_balance < 0 ? 'money-negative' : 'money-positive'">{{
                                    renderMoney(overall.affiliates_debt_balance)
                                }}</span>
                            </div>
                            <div class="item">
                                <h4>Total collection:</h4>
                                <span class="middle-text total-collection" :class="'money-negative'">{{
                                    renderMoney(overall.affiliates_collection_balance)
                                }}</span>
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
