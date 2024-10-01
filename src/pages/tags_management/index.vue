<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink, useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import SchemeSearch from '/@src/schemes/tags_management/tagsManagementSearch.json'
import SchemeList from '/@src/schemes/tags_management/tagsManagementList.json'
import SchemeNew from '/@src/schemes/tags_management/tagsManagementNewModal.json'
import VModal from '/@src/components/base/modal/VModal.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const datatable = ref<DatatableMethods>()

const create = ref(false)
const initial = {}

const custom = {
    permissions () {
        return (value: string, row: any) => {
            return [h('div', SchemeNew.content[1].props.options?.filter(opt => opt.value == value)[0].label)]
        }
    },
    Actions() {
        return (value: any, row: any) => {
            return [
                h(RouterLink, { to: { name: 'tags_management-id', params: { id: row._id } }}, () => 'Edit')
            ]
        }
    }
}

const router = useRouter()
const onStored = (data: any) => {
    router.push({ name: 'tags_management-id', params: { id: data._id } })
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
    <div class="tag_management">
        <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value:any) => (searchFunc = value)">
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true">Add Tag</VButton>
        </DatatableSearch>

        <Datatable
            :columns="SchemeList.columns"
            uri="/tag_management"
            :custom="custom"
            :search="searchFunc"
            :show-only-screen-data="true"
            @init="(value:any) => (datatable = value)"
            @changed="(value:any) => (searchData = value)"
        />

        <ApiForm
            v-if="create"
            :wrapper="VModal"
            title="Add Tag"
            :fetch-data="initial"
            :scheme="SchemeNew"
            store-method="post"
            store-data="/tag_management/create"
            @store-data="onStored"
            @close="create = false"
        />
    </div>
</template>
