<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
// import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import SchemeSearch from '/@src/schemes/advertisers/post_events/search.json'
import SchemeList from '/@src/schemes/advertisers/post_events/list.json'
import SchemeNew from '/@src/schemes/advertisers/post_events/edit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import { useUserSession } from '/@src/stores/userSession'
import VButton from '/@src/components/base/button/VButton.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface AdvertiserProps {
    advertiserId: string
}
const props = defineProps<AdvertiserProps>()

// const viewWrapper = useViewWrapper()
// viewWrapper.setPageTitle(SchemeList.title)

const userSession = useUserSession()
const perm = userSession.permissions('marketing_advertisers')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const custom = {
    Actions() {
        return (value: any, row: any) => {
            if (is_access_edit) {
                return [
                    h(VIconButton, {
                        icon: 'fas fa-edit',
                        onClick: () => (update.value = row._id),
                    }),
                    h(VIconButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }),
                ]
            }
            return []
        }
    },
}

const datatable = ref<DatatableMethods>()

const create = ref<string | boolean>(false)
const update = ref<string | boolean>(false)
const remove = ref<string | boolean>(false)
const initial = {}

const onCreateStored = () => {
    datatable.value?.fetchData()
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
    <AdvertiserHeader :advertiser-id="props.advertiserId" :title="SchemeList.title"></AdvertiserHeader>

    <LocalToolbar> </LocalToolbar>

    <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Post Event </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/advertisers/${props.advertiserId}/post_events`"
        :custom="custom"
        :search="searchFunc"
        :show-only-screen-data="true"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Post Event"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/advertisers/${props.advertiserId}/post_events/create`"
        @store-data="onCreateStored"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Post Event"
        :fetch-data="`/advertisers/${props.advertiserId}/post_events/${update}`"
        :scheme="SchemeNew"
        :readonly="!is_access_edit"
        store-method="put"
        :store-data="`/advertisers/${props.advertiserId}/post_events/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        title="Delete Post Event"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/advertisers/${props.advertiserId}/post_events/delete/${remove}`"
        @store-data="onDeleteStored"
        @close="remove = false"
    />
</template>
