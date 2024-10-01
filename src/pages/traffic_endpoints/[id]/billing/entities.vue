<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeList from '/@src/schemes/traffic_endpoints/billing/entitiesList.json'
import SchemeEdit from '/@src/schemes/traffic_endpoints/billing/entitiesEdit.json'
import SchemeNew from '/@src/schemes/traffic_endpoints/billing/entitiesEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'

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
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Billing Entities')
)

const custom = {
    Actions() {
        return (value: any, row: any) => {
            if (is_access_edit) {
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

const update = ref<string | false>(false)
const remove = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const initial = {}
</script>

<template>
    <div class="list-flex-toolbar">
        <VButtons>
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Entity </VButton>
        </VButtons>
    </div>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/traffic_endpoint/${props.id}/billing/entities/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Entity"
        :fetch-data="initial"
        :gauth="true"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/entities/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Entity"
        :fetch-data="`/traffic_endpoint/${props.id}/billing/entities/${update}`"
        :gauth="true"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/billing/entities/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        size="small"
        title="Delete Entity"
        :fetch-data="{}"
        :gauth="true"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/traffic_endpoint/${props.id}/billing/entities/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
