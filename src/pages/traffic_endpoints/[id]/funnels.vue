<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import SchemeEdit from '/@src/schemes/traffic_endpoints/funnelsEdit.json'
import { useUserSession } from '/@src/stores/userSession'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Traffic Endpoint Funnels')

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('funnels')

const notif = useNotyf()

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Traffic Endpoint: #' + data.token + ' - Funnels')
}
const onStored = () => {
    notif.success('Updated Successfully')
}
</script>

<template>
    <SidemenuTabs menu-id="optimization-tabs" />
    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Traffic Endpoint"
        :fetch-data="'/traffic_endpoint/' + props.id + '/integrations'"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        :store-data="'/traffic_endpoint/update/' + props.id + '/integrations'"
        @fetch-data="onFetched"
        @store-data="onStored"
    />
</template>
