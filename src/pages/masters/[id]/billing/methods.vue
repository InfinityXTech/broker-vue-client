<script setup lang="ts">
import { h, ref } from 'vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import SchemeList from '/@src/schemes/masters/billing/paymentMethodsList.json'
import SchemeNew from '/@src/schemes/masters/billing/paymentMethodsNew.json'
import SchemeFilesList from '/@src/schemes/masters/billing/paymentMethodFilesList.json'
import CryptoIcon from '/@src/components/svg/icons/CryptoIcon.vue'
import WireIcon from '/@src/components/svg/icons/WireIcon.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { ApiFormValidate } from '/@src/components/partials/ApiForm.vue'

export interface MasterProps {
    id: string
}

const props = defineProps<MasterProps>()

const viewWrapper = useViewWrapper()

const api = useApi()
api.get('/master/' + props.id).then((response: any) => viewWrapper.setPageTitle('Master: #' + response?.data?.token + ' - Billing Payment Methods'))

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
                return ['Bank name: ' + row.bank_name, h('br'), 'Swift: ' + row.swift]
            }
            if (row.payment_method == 'crypto') {
                if (row.currency_crypto_code == 'usdt') {
                    if ((row.currency_crypto_wallet_type ?? '').length > 0) {
                        return ['Wallet ' + row.currency_crypto_wallet_type.replace('_', ' ').toUpperCase() + ': ' + row.wallet]
                    }
                    return ['Wallet ERC 20: ' + row.wallet, h('br'), row.wallet2 && 'Wallet TRC 20: ' + row.wallet2]
                }
                return ['Wallet: ' + row.wallet]
            }
            return [row.payment_method]
        }
    },
    Details2() {
        return (value: any, row: any) => {
            if (row.payment_method == 'wire') {
                return ['Account Name: ' + row.account_name, h('br'), 'Account Number: ' + row.account_number]
            }
            return h('div', { innerHTML: '' })
        }
    },
    Files() {
        return (value: number, row: any) => {
            return row.files?.length == 0 || !row.wallet_validate
                ? h(VButton, { icon: 'fas fa-edit', title: 'Edit', onClick: () => (update.value = row._id) })
                : h(VButton, { icon: 'fas fa-file', title: 'Files', onClick: () => (files.value = row._id) })
        }
    },
    Actions() {
        return (value: any, row: any) => {
            return h(VButton, { icon: 'feather:check', color: row.status && 'primary', onClick: () => (select.value = row._id) }, () => 'Set as default')
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

const select = ref<string | false>(false)
const create = ref(false)
const files = ref<string | false>(false)
const update = ref<string | false>(false)
const datatable = ref<DatatableMethods>()
const initial = { payment_method: 'wire' }
</script>

<template>
    <div class="list-flex-toolbar">
        <VButtons>
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Payment Method </VButton>
        </VButtons>
    </div>

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Payment Method"
        :fetch-data="initial"
        :scheme="SchemeNew"
        :validates="payment_method_validates"
        store-method="post"
        :store-data="`/master/${props.id}/billing/payment_methods/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Payment Method"
        :fetch-data="`/master/${props.id}/billing/payment_methods/${update}`"
        :scheme="SchemeNew"
        :validates="payment_method_validates"
        store-method="post"
        :store-data="`/master/${props.id}/billing/payment_methods/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <Datatable :columns="SchemeList.columns" :uri="`/master/${props.id}/billing/payment_methods/all`" :custom="custom" @init="(value) => (datatable = value)" />

    <ApiForm
        v-if="select"
        :wrapper="VModal"
        size="small"
        title="Change payment details"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to change the payment details?')"
        store-method="put"
        :store-data="`/master/${props.id}/billing/payment_methods/select/${select}`"
        @store-data="datatable?.fetchData(), (select = false)"
        @close="select = false"
    />

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable :columns="SchemeFilesList.columns" :uri="`/master/${props.id}/billing/payment_methods/files/${files}`" :custom="custom" />
        </template>
    </VModal>
</template>

<style lang="scss">
.is-active-payment {
    color: var(--primary);
}
</style>
