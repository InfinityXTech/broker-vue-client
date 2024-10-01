<script setup lang="ts">
import { h, provide, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { customDictionary } from '/@src/utils/dictionary'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import { Money, MoneyColor } from '/@src/utils/datatable/simple-render'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/brokers/billing/chargebacksList.json'
import SchemeEdit from '/@src/schemes/brokers/billing/chargebackEdit.json'
import SchemeNew from '/@src/schemes/brokers/billing/chargebackEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')

const api = useApi()
api.get('/broker/' + props.id).then((response: any) => viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - Billing Chargebacks'))

const renderMoney = Money()
const renderMoneyColor = MoneyColor()

const custom = {
    PaymentMethod() {
        return (value: any) => {
            switch (value.payment_method) {
                case 'crypto':
                    return `${value.payment_method} (${value.currency_crypto_code})`.toUpperCase()
                case 'wire':
                    return `${value.payment_method} (${value.currency_code}) `.toUpperCase() + value.bank_name
                default:
                    return value.payment_method.toUpperCase()
            }
        }
    },
    Actions() {
        return (value: any, row: any) => {
            return h('div', { style: row.payment_request ? 'display:none' : null }, [
                h(VButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) }, () => 'Edit'),
                ' ',
                h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete'),
            ])
        }
    },
}

provide(
    'broker_payment_methods',
    customDictionary(`/broker/${props.id}/billing/our_payment_methods/all`, (item) => {
        const label = [
            item.payment_method?.toUpperCase(),
            item.currency_code?.toUpperCase(),
            item.bank_name,
            item.account_name,
            item.account_number,

            item.currency_crypto_code?.toUpperCase(),
            item.wallet,
            item.wallet2,
        ]
            .filter((x) => x)
            .join(' - ')
            .replace(' -  - ', ' - ')
        return { value: item._id, label }
    })
)
provide(
    'broker_payment_requests',
    customDictionary(`/broker/${props.id}/billing/payment_requests/completed`, (item) => {
        if (item.chargeback) {
            return undefined
        }
        return {
            value: item._id,
            label: renderMoney(item.total),
        }
    })
)

const update = ref<string | false>(false)
const remove = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const initial = async () => {
    const { data } = await api.get(`/broker/${props.id}/billing/our_payment_methods/all`)
    const payment_method = data.find((item: any) => item.status)
    return {
        payment_method: payment_method?._id,
    }
}

const totalSum = ref(0)
const onChanged = (data: any[] | null) => (totalSum.value = data?.reduce((sum, row) => sum + row.amount, 0) ?? 0)
</script>

<template>
    <LocalToolbar>
        <CurrencyConverter />
    </LocalToolbar>

    <div class="list-flex-toolbar">
        <div>
            <VCard>Total: <component :is="{ render: () => renderMoneyColor(totalSum) }" /></VCard>
        </div>

        <VButtons>
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Chargeback </VButton>
        </VButtons>
    </div>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/broker/${props.id}/billing/chargeback/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
        @changed="onChanged"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Chargeback"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/chargeback/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Chargeback"
        :fetch-data="`/broker/${props.id}/billing/chargeback/${update}`"
        :scheme="SchemeEdit"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/chargeback/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        size="small"
        title="Delete Chargeback"
        :fetch-data="{}"
        :gauth="true"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/broker/${props.id}/billing/chargeback/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
