<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink, useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import SchemeSearch from '/@src/schemes/data/brokers/brokersSearch.json'
import SchemeList from '/@src/schemes/data/brokers/brokersList.json'
import SchemeNew from '/@src/schemes/data/brokers/brokerNewModal.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useDownload } from '/@src/composable/useDownload'
import { useUserSession } from '/@src/stores/userSession'

const custom = {
    BrokerName() {
        return (value: string, row: any) => {
            return [h(RouterLink, { to: { name: 'data-brokers-id', params: { id: row._id } } }, () => h('b', value)), h('br'), h('small', row._id)]
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

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')
const is_access_download_crg_deals = perm.is_custom_allow('download_crg_deals')
const is_access_download_price = perm.is_custom_allow('download_price')

const datatable = ref<DatatableMethods>()
const download = useDownload()

const create = ref(false)
const initial = {
    partner_type: 1,
}

const router = useRouter()
const onStored = (data: any) => {
    router.push({ name: 'data-brokers-id', params: { id: data._id } })
    create.value = false
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

onUnmounted(() => {
    searchData.value = null
    datatable.value = undefined
})
</script>

<template>
    <LocalToolbar>
        <ToolbarItem
            v-if="is_access_download_crg_deals"
            icon="fas fa-file-contract"
            title="Download CRG deals"
            @click="download.get('/data/broker/crgdeals/download')"
        />
        <ToolbarItem v-if="is_access_download_price" icon="fas fa-download" title="Download Price" @click="download.get('/data/broker/price/download')" />
    </LocalToolbar>

    <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
        <!-- <VButton v-if="is_access_add || is_access_edit" :to="{ name: 'brokers-create' }" color="primary" icon="fas fa-plus" elevated> Add Broker </VButton> -->
        <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Broker </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        uri="/data/broker/all"
        :custom="custom"
        :search="searchFunc"
        :show-only-screen-data="true"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Broker"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        store-data="/data/broker/create"
        @store-data="onStored"
        @close="create = false"
    />
</template>
