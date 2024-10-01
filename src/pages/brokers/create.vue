<script setup lang="ts">
import { useRouter } from 'vue-router'
import Scheme from '/@src/schemes/brokers/brokerNew.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import { useUserSession } from '/@src/stores/userSession'

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const router = useRouter()
const initial = {
    partner_type: 1,
}
const onStored = (data: any) => {
    router.push({ name: 'brokers-id', params: { id: data._id } })
}
</script>

<template>
    <ApiForm
        v-if="is_access_add || is_access_edit"
        :wrapper="ThinPage"
        title="Add New Broker"
        :fetch-data="initial"
        :scheme="Scheme"
        store-label="Add Broker"
        store-method="post"
        store-data="/broker/create"
        @store-data="onStored"
    />
</template>