<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { RouterLink } from 'vue-router'
import SchemeAdvertiser from '/@src/schemes/marketing_billings/advertiserPendingPaymentsList.json'
import SchemeAffiliate from '/@src/schemes/marketing_billings/affiliatePendingPaymentsList.json'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const api = useApi()
const router = useRouter()
const userSession = useUserSession()
const perm = userSession.permissions('marketing_billings')

 if (!perm.is_allow('pending_payments')) {
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

const custom = {
    AdvertiserName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'advertisers-advertiserId-billing-requests', params: { advertiserId: row.advertiser._id } }, target: '_blank' }, () => value)
        }
    },
    AffiliateName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'affiliates-affiliateId-billing-requests', params: { affiliateId: row.affiliate._id } }, target: '_blank' }, () => value)
        }
    },
}
const isLoading = ref<boolean>(true)
const dataValue = ref<any>({
    advertisers_pending_payments: { items: [] },
    affiliates_pending_payments: { items: [] },
})
const request = api.get('/marketing_billings/pending_payments')
request.then((response: any) => {
    dataValue.value = response.data
    isLoading.value = false
})
onUnmounted(() => {
    dataValue.value = null
})
</script>

<template>
    <SidemenuTabs />

    <VLoader :active="isLoading" size="xl">
        <div class="columns is-multiline is-mobile">
            <div class="column inv-column" :class="['is-one-quarter-fullhd', 'is-helf-desktop']">
                <h1 class="title">Advertisers</h1>
                <Datatable
                    :columns="SchemeAdvertiser.columns"
                    :model-value="dataValue.advertisers_pending_payments.items"
                    :show-only-screen-data="false"
                    :custom="custom"
                    :download="true"
                />
            </div>
            <div class="column inv-column" :class="['is-one-quarter-fullhd', 'is-helf-desktop']">
                <h1 class="title">Affiliates</h1>
                <Datatable
                    :columns="SchemeAffiliate.columns"
                    :model-value="dataValue.affiliates_pending_payments.items"
                    :show-only-screen-data="false"
                    :custom="custom"
                    :download="true"
                />
            </div>
        </div>
    </VLoader>
</template>
