<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { MoneyColor } from '/@src/utils/datatable/simple-render'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/brokers/billing/adjustmentsList.json'
import SchemeEdit from '/@src/schemes/brokers/billing/adjustmentEdit.json'
import SchemeNew from '/@src/schemes/brokers/billing/adjustmentEdit.json'
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
api.get('/broker/' + props.id).then((response: any) => viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - Billing Adjustments'))

const custom = {
    Actions() {
        return (value: any, row: any) => {
            if (row.payment_request) {
                return ''
            }
            return [
                h(VButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) }, () => 'Edit'),
                ' ',
                h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete'),
            ]
        }
    },
}

const update = ref<string | false>(false)
const remove = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const initial = {
    amount_sign: 1,
}

const renderMoneyColor = MoneyColor()
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
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Adjustment </VButton>
        </VButtons>
    </div>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/broker/${props.id}/billing/adjustments/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
        @changed="onChanged"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Adjustment"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/adjustments/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Adjustment"
        :fetch-data="`/broker/${props.id}/billing/adjustments/${update}`"
        :scheme="SchemeEdit"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/adjustments/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        size="small"
        title="Delete Adjustment"
        :fetch-data="{}"
        :gauth="true"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/broker/${props.id}/billing/adjustments/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
