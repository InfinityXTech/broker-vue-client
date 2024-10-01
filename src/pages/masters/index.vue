<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink, useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import SchemeSearch from '/@src/schemes/masters/mastersSearch.json'
import SchemeList from '/@src/schemes/masters/mastersList.json'
import SchemeNew from '/@src/schemes/masters/masterNewModal.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'

const userSession = useUserSession()
const perm = userSession.permissions('masters')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const custom = {
    Token() {
        return (value: string, row: any) => {
            let nickname = row.nickname != undefined && row.nickname != "" ? ' - ' + row.nickname : ""
            return [h(RouterLink, { to: { name: 'masters-id', params: { id: row._id } } }, () => h('b', value + nickname)), h('br'), h('small', row._id)]
        }
    },
    AccountName() {
        return (value: any) => {
            return value?.name
            //return h('div', [h('div', value?.name), h('div', value?.account_email)])
        }
    },
}

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const datatable = ref<DatatableMethods>()

const create = ref(false)
const initial = {}

const router = useRouter()
const onStored = (data: any) => {
    router.push({ name: 'masters-id', params: { id: data._id } })
    create.value = false
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()
</script>

<template>
    <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
        <!-- <VButton v-if="is_access_add" :to="{ name: 'masters-create' }" color="primary" icon="fas fa-plus" elevated> Add Master </VButton> -->
        <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Master </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        uri="/master/all"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Master"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        store-data="/master/create"
        @store-data="onStored"
        @close="create = false"
    />
</template>
