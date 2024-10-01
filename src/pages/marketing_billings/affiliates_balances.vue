<script setup lang="ts">
import { computed, h, ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import SchemeAffiliate from '/@src/schemes/marketing_billings/affiliateBalancesList.json'
import SchemeAdvertiserForm from '/@src/schemes/marketing_billings/advertiserBalancesForm.json'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const router = useRouter()
const userSession = useUserSession()
const perm = userSession.permissions('marketing_billings')

const isLoading = ref(true)

 if (!perm.is_allow('affiliates_balances')) {
     router.push({ name: '403' })
 }

const custom = {
    AdvertiserName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'advertisers-advertiserId-billing-general', params: { advertiserId: row.id } }, target: '_blank' }, () => value)
        }
    },
    AffiliateName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'affiliates-affiliateId-billing-general', params: { affiliateId: row.id } }, target: '_blank' }, () => value)
        }
    },
    Collection() {
        return (value: boolean) => {
            return h('span', { innerHTML: value == true ? 'collection' : 'active' })
        }
    },
    Status() {
        return (value: boolean) => {
            return h('span', { innerHTML: value ? 'active' : 'inactive' })
        }
    },
}

const onStored = (data: any) => {
    datatable.value = data
    isLoading.value = false
}

const datatable = ref<any[]>([])
const datatable_minus = computed(() => datatable.value?.filter((item) => item.balance <= -10))
const datatable_plus = computed(() => datatable.value?.filter((item) => item.balance >= 10))
onUnmounted(() => {
    datatable.value = []
})
</script>

<template>
    <SidemenuTabs />
    <div class="affiliate_balances">
        <div style="max-width: 300px">
            <ApiForm
                title=""
                :wrapper="PageToolbar"
                :scheme="SchemeAdvertiserForm"
                :fetch-data="{ collection: true }"
                store-method="post"
                store-data="/marketing_billings/affiliates_balances"
                store-on="change"
                @before-store="isLoading = true"
                @store-data="onStored"
            />
        </div>

        <VLoader :active="isLoading" size="large">
            <div v-if="!isLoading" class="columns is-multiline is-mobile">
                <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                    <h1 class="title">Affiliates</h1>
                    <Datatable :columns="SchemeAffiliate.columns" :model-value="datatable" :custom="custom" :download="true" :show-only-screen-data="false" />
                </div>
                <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                    <h1 class="title">Affiliates (minus)</h1>
                    <Datatable :columns="SchemeAffiliate.columns" :model-value="datatable_minus" :custom="custom" :download="true" />
                </div>
                <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                    <h1 class="title">Affiliates (plus)</h1>
                    <Datatable :columns="SchemeAffiliate.columns" :model-value="datatable_plus" :custom="custom" :download="true" />
                </div>
            </div>
            <div v-else style="height: 100px"></div>
        </VLoader>
    </div>
</template>
<style lang="scss">
.affiliate_balances table {
    th[data-key='is_collection'],
    td[data-key='is_collection'],
    th[data-key='status'],
    td[data-key='status'],
    th[data-key='account_manager.account_email'],
    td[data-key='account_manager.account_email'] {
        display: none;
    }

    tfoot {
        td:nth-child(1),
        td:nth-child(2),
        td:nth-child(3) {
            display: none;
        }
    }
}
</style>