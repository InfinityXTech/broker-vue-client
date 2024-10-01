<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { hasOwn } from '@vue/shared'
import { MoneyColor } from '/@src/utils/datatable/simple-render'
import { useUserSession } from '/@src/stores/userSession'
import { useApi } from '/@src/composable/useApi'
import { FormComponent, FormCheckComponentAccess } from '/@src/components/partials/Form.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { getFormVal } from '/@src/components/partials/Form.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeList from '/@src/schemes/traffic_endpoints/billing/adjustmentsList.json'
import SchemeEdit from '/@src/schemes/traffic_endpoints/billing/adjustmentEdit.json'
import SchemeNew from '/@src/schemes/traffic_endpoints/billing/adjustmentEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import { isString } from '@vueuse/shared'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const viewWrapper = useViewWrapper()
const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_billing = perm.is_allow('is_billing')
let is_access_edit = perm.is_allow('all', 'edit') && userSession.roles().is('financial')
let is_access_add = perm.is_allow('all', 'add') && userSession.roles().is('financial')

if (userSession.roles().is('account_manager') && !perm.is_allow('allocate_am')) {
    is_access_add = is_access_edit = false
}

const api = useApi()
api.get('/traffic_endpoint/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Billing Adjustments')
)

const custom = {
    Actions() {
        return (value: any, row: any) => {
            if (!hasOwn(row, 'payment_request') && is_access_edit) {
                return [
                    h(VButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) }, () => 'Edit'),
                    ' ',
                    h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete'),
                ]
            }
            return []
        }
    },
}

const checkComponentAccess: FormCheckComponentAccess = (component: FormComponent): boolean => {
    const userSession = useUserSession()
    if (component?.data == 'bi') {
        for (let acc in component?.props?.access) {
            const only_traffic_endpoint = getFormVal(userSession?.user?.permissions, component?.props?.access[acc])
            if (only_traffic_endpoint) {
                if (isString(only_traffic_endpoint) && only_traffic_endpoint != props.id) {
                    return false
                } else if (Array.isArray(only_traffic_endpoint) && only_traffic_endpoint.indexOf(props.id) < 0) {
                    return false
                }
            }
        }
    }
    return true
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
    <div class="list-flex-toolbar">
        <div>
            <VCard>Total: <component :is="{ render: () => renderMoneyColor(totalSum) }" /></VCard>
        </div>
        <VButtons>
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Adjustment </VButton>
        </VButtons>
    </div>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/traffic_endpoint/${props.id}/billing/adjustments/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
        @changed="onChanged"
    />

    <ApiForm
        v-if="create"
        :gauth="true"
        :wrapper="VModal"
        title="Add Adjustment"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/adjustments/create`"
        :check-component-access="checkComponentAccess"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :gauth="true"
        :wrapper="VModal"
        title="Update Adjustment"
        :fetch-data="`/traffic_endpoint/${props.id}/billing/adjustments/${update}`"
        :scheme="SchemeEdit"
        store-method="put"
        :readonly="!is_access_edit"
        :store-data="`/traffic_endpoint/${props.id}/billing/adjustments/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :gauth="true"
        :wrapper="VModal"
        size="small"
        title="Delete Adjustment"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/traffic_endpoint/${props.id}/billing/adjustments/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
