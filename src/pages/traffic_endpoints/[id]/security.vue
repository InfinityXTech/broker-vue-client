<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/traffic_endpoints/securityList.json'
import SchemeNew from '/@src/schemes/traffic_endpoints/securityNew.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import ApiCallButton from '/@src/components/partials/forms/ApiCallButton.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface TrafficEndpointProps {
    id: string
}
const props = defineProps<TrafficEndpointProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const api = useApi()
api.get('/traffic_endpoint/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - ' + SchemeList.title)
)

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('security')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('security')

const update = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const initial = {
    ip: '',
}

const custom = {
    IP() {
        return (value: string) => value
    },
    Actions() {
        // return (value: any, row: any) => {
        //     return h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete')
        // }
        return (value: string, proxy: any) => {
            if (is_access_edit) {
                return h(
                    ApiCallButton,
                    {
                        // label: 'Delete',
                        // icon: 'feather:trash-2',
                        mode: 'single',
                        icon: 'fas fa-trash-alt',
                        modelValue: value,
                        method: 'DELETE',
                        uri: '/traffic_endpoint/' + props.id + '/security/delete/' + proxy._id,
                        confirm: 'Are you sure you want to delete this record?',
                        onStoreData: onStored,
                        // onStoreData: function () {
                        //     onDeletedStored(proxy)
                        // },
                    }
                    //,() => 'Delete'
                )
            } else {
                return h('span')
            }
        }
    },
}

// const onDeletedStored = function (proxy: any) {
//     for (var i = 0; i < datatable.value.length; i++) {
//         if (datatable.value[i]._id == proxy._id) {
//             datatable.value.splice(i, 1)
//             break
//         }
//     }
// }

const onStored = () => {
    update.value = false
    create.value = false
    datatable.value?.fetchData()
}
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />
    <div class="traffic-endpoint-security">
        <div class="list-flex-toolbar">
            <VButtons>
                <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add New IP </VButton>
            </VButtons>
        </div>

        <Datatable
            size="small"
            :columns="SchemeList.columns"
            :uri="`/traffic_endpoint/${props.id}/security/all`"
            :custom="custom"
            @init="(value) => (datatable = value)"
        />

        <ApiForm
            v-if="create"
            :wrapper="VModal"
            title="Add New IP"
            :fetch-data="initial"
            :scheme="SchemeNew"
            store-method="post"
            :store-data="`/traffic_endpoint/${props.id}/security/create`"
            @store-data="onStored"
            @close="create = false"
        />
    </div>
</template>

<style scoped lang="scss">
.traffic-endpoint-security {
    .dataTable-table td button {
        width: 38px;
        padding: 0 0 0 12px;
    }
}
</style>