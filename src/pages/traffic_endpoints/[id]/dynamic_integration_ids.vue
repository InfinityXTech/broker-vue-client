<script setup lang="ts">
import { h, computed, provide, ref, watch } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import VButton from '/@src/components/base/button/VButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import { useApi } from '/@src/composable/useApi'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import SchemeSearch from '/@src/schemes/traffic_endpoints/dynamicIntegrationIdsSearch.json'
import SchemeEdit from '/@src/schemes/traffic_endpoints/dynamicIntegrationIdsEdit.json'
import SchemeList from '/@src/schemes/traffic_endpoints/dynamicIntegrationIdsList.json'
import { useUserSession } from '/@src/stores/userSession'
import VIconButton from '/@src/components/base/button/VIconButton.vue'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Traffic Endpoint: Dynamic Integration IDs')

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_role_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const notif = useNotyf()

const api = useApi()
api.get('/traffic_endpoint/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Dynamic Integration IDs')
)

const custom = {
    Actions() {
        return (value: any, row: any) => {
            let items = []
            if (is_access_edit) {
                items.push(h(VIconButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) } /*, () => 'Edit'*/))
            }
            return items
        }
    },
}

const dicts = computed(() => {
    let result: any = {
        brokers: { '': 'All' },
        integrations: { '': 'All' },
    }
    searchData.value?.forEach((item: any) => {
        result.brokers[item.broker_data?._id] = item.broker_data?.partner_name_secure
        result.integrations[item.integration_data?._id] = item.integration_data?.name
    })
    // console.log(result)
    return result
})

const onStored = () => {
    create.value = false
    update.value = false
    datatable.value?.fetchData()
    notif.success('Updated Successfully')
}

const onFetched = () => {
    fetchIntegrations()
}

let setIntegrations: any = null
const fetchIntegrations = async () => {
    api.get(`/broker/${modelFormValue.value?.brokerId}/integrations/all`).then((response) => {
        if (setIntegrations) {
            setIntegrations(response.data.filter((item: any) => item.status == 1).map((item: any) => ({ value: item._id, label: item.name })))
        }
    })
}

const onUpdateData = (data: any, target: any, value: any) => {
    switch (target) {
        case 'brokerId': {
            modelFormValue.value.brokerId = value
            onRefreshData()
        }
    }
}

const onRefreshData = () => {
    // const data = {
    //     integrationId: modelFormValue.value.integrationId,
    //     brokerId: modelFormValue.value.brokerId,
    //     status: modelFormValue.value.status,
    // }
    // console.log(data)
    // formEvents.value?.resetData(data)
    // formEvents.value?.fetchData()
    fetchIntegrations()
    formEvents.value?.forceReRenderForm()
}

provide('custom_brokers', () => dicts.value.brokers)
provide('custom_integrations', () => dicts.value.integrations)
provide('active_integrations', () => new Promise((resolve) => (setIntegrations = resolve)))

const modelFormValue = ref({ status: 1, brokerId: null, integrationId: null })
const formEvents = ref()

const datatable = ref<DatatableMethods>()
const create = ref(false)
const update = ref<string | false>(false)

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />

    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click=";(modelFormValue.status = 1), (create = true)">
            Add Dynamic Integration
        </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/traffic_endpoint/${props.id}/dynamic_integration_ids`"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />
    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Dynamic Integration"
        :scheme="SchemeEdit"
        :fetch-data="{ status: 1 }"
        :model-value="modelFormValue"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/dynamic_integration_ids/create`"
        @events="(value) => (formEvents = value)"
        @store-data="onStored"
        @update:data="onUpdateData"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Dynamic Integration"
        :fetch-data="`/traffic_endpoint/${props.id}/dynamic_integration_ids/${update}`"
        :scheme="SchemeEdit"
        :model-value="modelFormValue"
        store-method="put"
        :store-data="`/traffic_endpoint/${props.id}/dynamic_integration_ids/update/${update}`"
        @events="(value) => (formEvents = value)"
        @fetch-data="onFetched"
        @store-data="onStored"
        @update:data="onUpdateData"
        @close="update = false"
    />
</template>
