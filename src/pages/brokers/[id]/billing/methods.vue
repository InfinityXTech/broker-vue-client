<script setup lang="ts">
import { h, ref } from 'vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import SchemeList from '/@src/schemes/traffic_endpoints/billing/paymentMethodsList.json'
import SchemeNew from '/@src/schemes/traffic_endpoints/billing/paymentMethodsNew.json'
import SchemeFilesList from '/@src/schemes/traffic_endpoints/billing/paymentMethodFilesList.json'
import CryptoIcon from '/@src/components/svg/icons/CryptoIcon.vue'
import WireIcon from '/@src/components/svg/icons/WireIcon.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { ApiFormValidate } from '/@src/components/partials/ApiForm.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_billing = perm.is_allow('is_billing')

let is_access_edit = perm.is_allow('all', 'edit') && userSession.roles().is('financial')
let is_access_add = perm.is_allow('all', 'add') && userSession.roles().is('financial')

if (userSession.roles().is('account_manager') && !perm.is_allow('allocate_am')) {
    is_access_add = is_access_edit = false
}

const api = useApi()
api.get('/broker/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle(
        'Broker: ' +
            response?.data?.partner_name_secure +
            (is_access_billing ? (' - Balance: $' + response?.data?.balance).replace('$-', '-$') : '') +
            ' - Billing Payment Methods'
    )
)

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
    Files() {
        return (value: number, row: any) => {
            if (row.files?.length > 0) {
                return h(VButton, { icon: 'fas fa-file', title: 'Files', onClick: () => (files.value = row._id) })
            }
            return []
        }
    },
    Actions() {
        return (value: any, row: any) => {
            let items = []
            if (is_access_edit) {
                if (!row.wallet_validate) {
                    items.push(h(VButton, { icon: 'fas fa-edit', title: 'Edit', onClick: () => (update.value = row._id) }))
                }
                items.push(
                    h(VButton, { icon: 'feather:check', color: row.status && 'primary', onClick: () => (select.value = row._id) }, () => 'Set as default')
                )
            }
            return items
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
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Payment Method </VButton>
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
        :readonly="!is_access_edit"
        :store-data="`/broker/${props.id}/billing/payment_methods/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Payment Method"
        :fetch-data="`/broker/${props.id}/billing/payment_methods/${update}`"
        :scheme="SchemeNew"
        :validates="payment_method_validates"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/payment_methods/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <Datatable :columns="SchemeList.columns" :uri="`/broker/${props.id}/billing/payment_methods/all`" :custom="custom" @init="(value) => (datatable = value)" />

    <ApiForm
        v-if="select"
        :wrapper="VModal"
        size="small"
        title="Change payment details"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to change the payment details?')"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/payment_methods/select/${select}`"
        @store-data="datatable?.fetchData(), (select = false)"
        @close="select = false"
    />

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable :columns="SchemeFilesList.columns" :uri="`/broker/${props.id}/billing/payment_methods/files/${files}`" :custom="custom" />
        </template>
    </VModal>
</template>

<style lang="scss">
.is-active-payment {
    color: var(--primary);
}
</style>
