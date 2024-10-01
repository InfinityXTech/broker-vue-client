<script setup lang="ts">
import { h, ref } from 'vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import VButton from '/@src/components/base/button/VButton.vue'
// import { useViewWrapper } from '/@src/stores/viewWrapper'
// import { useApi } from '/@src/composable/useApi'
import SchemeList from '/@src/schemes/advertisers/billing/paymentMethodsList.json'
import CryptoIcon from '/@src/components/svg/icons/CryptoIcon.vue'
import WireIcon from '/@src/components/svg/icons/WireIcon.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
// import { useUserSession } from '/@src/stores/userSession'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface AdvertiserProps {
    advertiserId: string
}

const props = defineProps<AdvertiserProps>()

// const viewWrapper = useViewWrapper()

// const userSession = useUserSession()
// const perm = userSession.permissions('marketing_advertisers')
// const is_access_marketing_advertiser_name = perm.is_allow('marketing_advertiser_name')

// const api = useApi()
// api.get('/advertisers/' + props.advertiserId).then((response: any) =>
//     viewWrapper.setPageTitle('Advertiser: ' + response?.data?.name + ' - Billing Payment Methods')
// )

const icons: Record<string, any> = { crypto: CryptoIcon, wire: WireIcon }

const custom = {
    Icon() {
        return (value: any, row: any) => h(icons[value], { class: [row.status && 'is-active-payment'] })
    },
    Payment() {
        return (value: any, row: any) => {
            const currency = row.currency_code || row.currency_crypto_code
            return h('span', [row.payment_method.toUpperCase(), h('br'), currency.toUpperCase()])
        }
    },
    Details1() {
        return (value: any, row: any) => {
            if (row.payment_method == 'wire') {
                return ['Bank name: ' + row.bank_name, h('br'), 'Swift: ' + row.swift]
            }
            if (row.payment_method == 'crypto') {
                if (row.currency_crypto_code == 'usdt') {
                    return ['Wallet ERC 20: ' + row.wallet, h('br'), row.wallet2 && 'Wallet TRC 20: ' + row.wallet2]
                }
                return 'Wallet: ' + row.wallet
            }
            return row.payment_method
        }
    },
    Details2() {
        return (value: any, row: any) => {
            if (row.payment_method == 'wire') {
                return ['Account Name: ' + row.account_name, h('br'), 'Account Number: ' + row.account_number]
            }
            return ''
        }
    },
    Actions() {
        return (value: any, row: any) => {
            return h(
                VButton,
                { icon: 'feather:check', color: row.status ? 'primary' : undefined, onClick: () => (select.value = row._id) },
                () => 'Set as default'
            )
        }
    },
}

const select = ref<string | false>(false)
const datatable = ref<DatatableMethods>()
</script>

<template>
    <AdvertiserHeader :advertiser-id="props.advertiserId" title="Billing Payment Methods"></AdvertiserHeader>

    <LocalToolbar>
        <CurrencyConverter />
    </LocalToolbar>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/advertisers/${props.advertiserId}/billing/payment_methods/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
    />

    <ApiForm
        v-if="select"
        :wrapper="VModal"
        size="small"
        title="Change payment details"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to change the payment details?')"
        store-method="put"
        :store-data="`/advertisers/${props.advertiserId}/billing/payment_methods/select/${select}`"
        @store-data="datatable?.fetchData(), (select = false)"
        @close="select = false"
    />
</template>

<style lang="scss">
.is-active-payment {
    color: var(--primary);
}
</style>