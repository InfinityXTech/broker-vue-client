<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import SchemeAdvertiser from '/@src/schemes/marketing_billings/advertiserFinancialApprovesList.json'
import SchemeAffiliate from '/@src/schemes/marketing_billings/affiliateFinancialApprovesList.json'
import SchemeForm from '/@src/schemes/marketing_billings/approvedForm.json'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const router = useRouter()
const userSession = useUserSession()
const perm = userSession.permissions('marketing_billings')

// if (!perm.is_allow('advertisers_balances')) {
//     if (perm.is_allow('affiliate_balances')) {
//         location.href = '/marketing_billings/affiliate_balances'
//     } else {
//         router.push({ name: '403' })
//     }
// }

const custom = {
    AdvertiserName() {
        return (value: string, row: any) => {
            if (row.advertiser_data?._id) {
                return h(
                    RouterLink,
                    { to: { name: 'advertisers-advertiserId-billing-completed', params: { advertiserId: row.advertiser_data._id } }, target: '_blank' },
                    () => row.advertiser_data.name + ' (' + row.advertiser_data.token + ')'
                )
            }
            return ''
        }
    },
    AffiliateName() {
        return (value: string, row: any) => {
            if (row.affiliate_data?._id) {
                return h(
                    RouterLink,
                    { to: { name: 'affiliates-affiliateId-billing-completed', params: { affiliateId: row.affiliate_data?._id } }, target: '_blank' },
                    () => row.affiliate_data.token
                )
            }
            return ''
        }
    },
}

const dataValue = ref<any>({})

const onStored = (data: any) => {
    dataValue.value = data
}

onUnmounted(() => {
    dataValue.value = null
})
</script>
    
    <template>
    <SidemenuTabs />

    <div style="max-width: 300px">
        <ApiForm
            title=""
            :wrapper="PageToolbar"
            :scheme="SchemeForm"
            :fetch-data="{ timeframe: DefaultTimeRange }"
            store-label="Search"
            store-method="post"
            :store-data="'/marketing_billings/approved'"
            store-on="init"
            @store-data="onStored"
        />
    </div>

    <br />

    <div class="billings-approved">
        <div class="columns is-multiline is-mobile">
            <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                <h1 class="title">Advertiser Approves</h1>
                <Datatable
                    :columns="SchemeAdvertiser.columns"
                    :custom="custom"
                    :model-value="dataValue.advertisers_approved"
                    :download="true"
                    :show-only-screen-data="false"
                />
            </div>
            <div class="column inv-column" :class="['is-12-mobile', 'is-half-mobile', 'is-two-quarter-desktop']">
                <h1 class="title">Affiliate Approves</h1>
                <Datatable
                    :columns="SchemeAffiliate.columns"
                    :custom="custom"
                    :model-value="dataValue.affiliates_approved"
                    :download="true"
                    :show-only-screen-data="false"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss">
</style>