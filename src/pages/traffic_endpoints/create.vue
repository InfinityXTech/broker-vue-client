<script setup lang="ts">
import { useRouter } from 'vue-router'
import Scheme from '/@src/schemes/traffic_endpoints/endpointNew.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import { useUserSession } from '/@src/stores/userSession'

const router = useRouter()

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const initial = {}
const onStored = (data: any) => {
    router.push({ name: 'traffic_endpoints-id', params: { id: data._id } })
}
</script>

<template>
    <ApiForm
        v-if="is_access_add || is_access_edit"
        :wrapper="ThinPage"
        title="Add New TrafficEndpoint"
        :fetch-data="initial"
        :scheme="Scheme"
        store-label="Add Traffic Endpoint"
        store-method="post"
        store-data="/traffic_endpoint/create"
        @store-data="onStored"
    />
</template>
