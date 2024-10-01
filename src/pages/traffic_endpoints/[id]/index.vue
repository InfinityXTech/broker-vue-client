<script setup lang="ts">
import { ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useRouter, RouteLocationRaw } from 'vue-router'
import { useUserSession } from '/@src/stores/userSession'
import { useSidemenu } from '/@src/composable/useSidemenu'
import { RenderLogs } from '/@src/utils/datatable/simple-render'
import Scheme from '/@src/schemes/traffic_endpoints/endpointEdit.json'
import SchemeLogList from '/@src/schemes/traffic_endpoints/endpointLogList.json'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'

export interface TrafficEndpointProps {
    id: string
}
const props = defineProps<TrafficEndpointProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()
const userSession = useUserSession()
const sidemenu = useSidemenu()
const router = useRouter()

const perm = userSession.permissions('traffic_endpoint')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

// if (!perm.is_allow('general')) {
//     const allow_menu = userSession.menu().get_first_allow(sidemenu.menu?.value)
//     if (allow_menu) {
//         router.push(allow_menu.to as RouteLocationRaw)
//     } else {
//         router.push({ name: '403' })
//     }
// }

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Traffic Endpoint: #' + data.token + ' - General')
}

const onStored = () => {
    notif.success('Updated Successfully')
}

const logs = ref(false)
</script>

<template>
    <LocalToolbar>
        <ToolbarItem v-if="is_admin" icon="fas fa-file-alt" title="Log" @click="logs = true" />
    </LocalToolbar>

    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Traffic Endpoint"
        :fetch-data="'/traffic_endpoint/' + props.id"
        :scheme="Scheme"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        :store-data="'/traffic_endpoint/update/' + props.id"
        store-on="delay"
        @fetch-data="onFetched"
        @store-data="onStored"
    />

    <VModal v-if="logs" open tabs title="Logs" size="big" cancel-label="Close" actions="right" @close="logs = false">
        <template #content>
            <Datatable :columns="SchemeLogList.columns" :uri="`/traffic_endpoint/${props.id}/logs`" :render-row="RenderLogs" />
        </template>
    </VModal>
</template>
