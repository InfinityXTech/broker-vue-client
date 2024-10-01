<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import { useApi } from '/@src/composable/useApi'
import SchemeList from '/@src/schemes/brokers/statusManagmentList.json'
import SchemeNew from '/@src/schemes/brokers/statusManagmentNew.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'
import { checkBrokerAccess } from '/@src/utils/broker/access'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('status_management')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('status_management')

const api = useApi()
api.get('/broker/' + props.id).then((response: any) => {
    checkBrokerAccess(response?.data)
    viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - ' + SchemeList.title)
})

const custom = {
    Actions() {
        return (value: any, row: any) => {
            if (is_access_edit) {
                return h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) } /*, () => 'Delete'*/)
            } else {
                return h('span')
            }
        }
    },
}

const remove = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const onStored = () => {
    remove.value = false
    create.value = false
    datatable.value?.fetchData()
}
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />
    <ThinPage size="small">
        <div class="list-flex-toolbar">
            <VButtons>
                <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Status </VButton>
            </VButtons>
        </div>

        <Datatable :columns="SchemeList.columns" :uri="`/broker/${props.id}/status_managment/all`" :custom="custom" @init="(value) => (datatable = value)" />

        <ApiForm
            v-if="create"
            :wrapper="VModal"
            title="Add Status"
            :fetch-data="{}"
            :scheme="SchemeNew"
            store-method="post"
            :store-data="`/broker/${props.id}/status_managment/create`"
            @store-data="onStored"
            @close="create = false"
        />

        <ApiForm
            v-if="remove"
            :wrapper="VModal"
            title="Delete Status"
            :fetch-data="{}"
            :scheme="schemeConfirm('Are you sure you want to delete this record?')"
            store-method="delete"
            :store-data="`/broker/${props.id}/status_managment/delete/${remove}`"
            @store-data="onStored"
            @close="remove = false"
        />
    </ThinPage>
</template>
