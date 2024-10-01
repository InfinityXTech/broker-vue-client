<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/brokers/billing/our_paymentMethodsList.json'
import SchemeForm from '/@src/schemes/brokers/billing/our_paymentMethodsNew.json'
import CryptoIcon from '/@src/components/svg/icons/CryptoIcon.vue'
import WireIcon from '/@src/components/svg/icons/WireIcon.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { ApiFormValidate } from '/@src/components/partials/ApiForm.vue'

const viewWrapper = useViewWrapper()

viewWrapper.setPageTitle('Payment Methods (broker)')

const api = useApi()

const icons: Record<string, any> = { crypto: CryptoIcon, wire: WireIcon }

const custom = {
    Icon() {
        return (value: any, row: any) => h(icons[value], { class: [row.status && 'is-active-payment'] })
    },
    Payment() {
        return (value: any, row: any) => {
            const currency = row.payment_method == 'crypto' ? row.currency_crypto_code : row.currency_code
            return h('span', [row.payment_method?.toUpperCase(), h('br'), currency?.toUpperCase()])
        }
    },
    Details1() {
        return (value: any, row: any) => {
            if (row.payment_method == 'wire') {
                let items = []
                if (row.bank_name) {
                    items.push('Bank name: ' + row.bank_name)
                }
                if (row.swift) {
                    if (items.length > 0) {
                        items.push(h('br'))
                    }
                    items.push('Swift: ' + row.swift)
                }
                return items
            }
            if (row.payment_method == 'crypto') {
                if (row.currency_crypto_code == 'usdt') {
                    let items = []
                    if (row.wallet) {
                        items.push('Wallet ERC 20: ' + row.wallet)
                    }
                    if (row.wallet2) {
                        if (items.length > 0) {
                            items.push(h('br'))
                        }
                        items.push('Wallet TRC 20: ' + row.wallet2)
                    }
                    return items
                }
                return row.wallet ? 'Wallet: ' + row.wallet : ''
            }
            return row.payment_method ?? ''
        }
    },
    Details2() {
        return (value: any, row: any) => {
            if (row.payment_method == 'wire') {
                let items = []
                if (row.account_name) {
                    items.push('Account Name: ' + row.account_name)
                }
                if (items.length > 0) {
                    items.push(h('br'))
                }
                if (row.account_number) {
                    items.push('Account Number: ' + row.account_number)
                }
                return items
            }
            return []
        }
    },
    Actions() {
        return (value: any, row: any) => {
            return []
            // return h(
            //     VButton,
            //     { icon: 'feather:check', color: row.status ? 'primary' : undefined, onClick: () => (select.value = row._id) },
            //     () => 'Set as default'
            // )
        }
    },
}

const payment_method_validates: Record<string, ApiFormValidate> = {
    wallet: async (data: any): Promise<boolean> => {
        if (data.payment_method == 'crypto' && (data.currency_crypto_code == 'btc' || data.currency_crypto_code == 'usdt')) {
            let currency_crypto_code = data.currency_crypto_code
            if (data.currency_crypto_code == 'usdt') {
                if (data.currency_crypto_wallet_type == 'erc_20') {
                    currency_crypto_code = 'eth'
                } else if (data.currency_crypto_wallet_type == 'trc_20') {
                    currency_crypto_code = 'trx'
                } else {
                    currency_crypto_code = 'eth'
                }
            }
            if ((data.wallet ?? '').length == 0) {
                return false
            }
            const { data: validate } = await api.get(`/validate/cryptocurrency-address/${currency_crypto_code}/${data.wallet}`)
            return validate.validate
        }
        return true
    },
}

const create = ref<boolean>(false)
const datatable = ref<DatatableMethods>()
</script>

<template>
    <div class="list-flex-toolbar">
        <VButtons>
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Payment Method </VButton>
        </VButtons>
    </div>

    <Datatable :columns="SchemeList.columns" :uri="`/settings/payment_methods`" :custom="custom" @init="(value) => (datatable = value)" />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add payment methods"
        :fetch-data="{}"
        :validates="payment_method_validates"
        :scheme="SchemeForm"
        store-method="post"
        :store-data="`/settings/payment_methods/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />
</template>

<style lang="scss">
.is-active-payment {
    color: var(--primary);
}
</style>