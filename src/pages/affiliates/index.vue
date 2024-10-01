<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink, useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import SchemeSearch from '/@src/schemes/affiliates/affiliatesSearch.json'
import SchemeList from '/@src/schemes/affiliates/affiliatesList.json'
import SchemeNew from '/@src/schemes/affiliates/affiliateNew.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import { useUserSession } from '/@src/stores/userSession'
import VButton from '/@src/components/base/button/VButton.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const userSession = useUserSession()
const perm = userSession.permissions('marketing_affiliates')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const custom = {
    Name() {
        return (value: string, row: any) => {
            const items = [h(RouterLink, { to: { name: 'affiliates-affiliateId', params: { affiliateId: row._id } } }, () => h('b', value)), h('br')]
            items.push(h('small', row._id))
            return items
        }
    },

    Actions() {
        return (value: any, row: any) => {
            if (is_access_edit) {
                return [
                    h(
                        VIconButton,
                        {
                            icon: 'fas fa-edit',
                            onClick: () => {
                                router.push({ name: 'affiliates-affiliateId', params: { affiliateId: row._id } })
                            },
                        } /*,
                        () => 'Edit'*/
                    ),
                    // h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete'),
                ]
            }
            return []
        }
    },
}

const datatable = ref<DatatableMethods>()

const create = ref<string | boolean>(false)
const remove = ref<string | boolean>(false)
const initial = {}

const router = useRouter()
const onCreateStored = (data: any) => {
    router.push({ name: 'affiliates-affiliateId', params: { affiliateId: data._id } })
    create.value = false
}

const onDeleteStored = () => {
    remove.value = false
    datatable.value?.fetchData()
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

onUnmounted(() => {
    searchData.value = null
    datatable.value = undefined
})
</script>

<template>
    <LocalToolbar> </LocalToolbar>

    <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_admin || is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Affiliate </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        uri="/affiliates"
        :custom="custom"
        :search="searchFunc"
        :show-only-screen-data="true"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Affiliate"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        store-data="/affiliates/create"
        @store-data="onCreateStored"
        @close="create = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        title="Delete"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/affiliates/delete/${remove}`"
        @store-data="onDeleteStored"
        @close="remove = false"
    />
</template>
