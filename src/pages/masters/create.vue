<script setup lang="ts">
import { useRouter } from 'vue-router'
import Scheme from '/@src/schemes/masters/masterNew.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import { useUserSession } from '/@src/stores/userSession'

const router = useRouter()

const userSession = useUserSession()
const perm = userSession.permissions('masters')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const initial = {
    partner_type: 1,
}
const onStored = (data: any) => {
    router.push({ name: 'masters-id', params: { id: data._id } })
}
</script>

<template>
    <ApiForm
        v-if="is_access_add"
        :wrapper="ThinPage"
        title="Add New Master"
        :fetch-data="initial"
        :scheme="Scheme"
        store-label="Add Master"
        store-method="post"
        store-data="/master/create"
        @store-data="onStored"
    />
</template>