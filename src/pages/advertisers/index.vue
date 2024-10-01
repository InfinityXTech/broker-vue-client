<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink, useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import SchemeSearch from '/@src/schemes/advertisers/advertisersSearch.json'
import SchemeList from '/@src/schemes/advertisers/advertisersList.json'
import SchemeNew from '/@src/schemes/advertisers/advertiserNew.json'
import SchemeEdit from '/@src/schemes/advertisers/advertiserEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import { useUserSession } from '/@src/stores/userSession'
import VButton from '/@src/components/base/button/VButton.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const userSession = useUserSession()
const perm = userSession.permissions('marketing_advertisers')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')
const is_campaigns = perm.is_allow('campaigns')
const is_post_events = perm.is_allow('post_events')
const is_billing = perm.is_allow('is_billing')

const RenderRow = (row: any): Record<string, any> => {
    return {
        class: [row.in_house && 'in_house'],
    }
}

const custom = {
    AdvertiserName() {
        return (value: string, row: any) => {
            if (is_access_edit) {
                // let items = [h(RouterLink, { to: { name: 'advertisers-advertiserId', params: { advertiserId: row._id } } }, () => h('b', value))]
                // let items = [h('a', { onClick: () => (update.value = row._id) }, h('b', value))]
                let items = []
                items.push(h(RouterLink, { to: { name: 'advertisers-advertiserId-campaigns', params: { advertiserId: row._id } } }, h('b', value)))
                if (is_campaigns) {
                    items.push(h('br'))
                    items.push(h(RouterLink, { to: { name: 'advertisers-advertiserId-campaigns', params: { advertiserId: row._id } } }, () => 'Campaigns'))
                }
                if (is_post_events) {
                    if (items.length > 1) {
                        items.push(h('span', { innerHTML: '&nbsp;|&nbsp;' }))
                    } else {
                        items.push(h('br'))
                    }
                    items.push(h(RouterLink, { to: { name: 'advertisers-advertiserId-post_events', params: { advertiserId: row._id } } }, () => 'Post events'))
                }
                if (is_billing) {
                    if (items.length > 1) {
                        items.push(h('span', { innerHTML: '&nbsp;|&nbsp;' }))
                    } else {
                        items.push(h('br'))
                    }
                    items.push(h(RouterLink, { to: { name: 'advertisers-advertiserId-billing-general', params: { advertiserId: row._id } } }, () => 'Billing'))
                }

                items.push(h('br'))
                items.push(h('small', row._id))
                return items
            }
            return [h('b', value), h('br'), h('small', row._id)]
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
                                update.value = row._id
                                // router.push({ name: 'advertisers-advertiserId', params: { advertiserId: row._id } })
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
const update = ref<string | boolean>(false)
const remove = ref<string | boolean>(false)
const initial = {}

// const router = useRouter()
const onCreateStored = (data: any) => {
    // router.push({ name: 'advertisers-advertiserId', params: { advertiserId: data._id } })
    create.value = false
    datatable.value?.fetchData()
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
    <div class="advertisers">
        <LocalToolbar> </LocalToolbar>

        <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Advertiser </VButton>
        </DatatableSearch>

        <Datatable
            :columns="SchemeList.columns"
            uri="/advertisers"
            :freeze-row="(row) => row.in_house"
            :render-row="RenderRow"
            :custom="custom"
            :search="searchFunc"
            :show-only-screen-data="true"
            @init="(value) => (datatable = value)"
            @changed="(value) => (searchData = value)"
        />

        <ApiForm
            v-if="create"
            :wrapper="VModal"
            title="Add Advertiser"
            :fetch-data="initial"
            :scheme="SchemeNew"
            store-method="post"
            store-data="/advertisers/create"
            @store-data="onCreateStored"
            @close="create = false"
        />

        <ApiForm
            v-if="update"
            :wrapper="VModal"
            title="Update Advertiser"
            :fetch-data="`/advertisers/${update}`"
            :scheme="SchemeEdit"
            :readonly="!is_access_edit"
            store-method="put"
            :store-data="`/advertisers/update/${update}`"
            @store-data="datatable?.fetchData(), (update = false)"
            @close="update = false"
        />

        <ApiForm
            v-if="remove"
            :wrapper="VModal"
            title="Delete"
            :fetch-data="{}"
            :scheme="schemeConfirm('Are you sure you want to delete this record?')"
            store-method="delete"
            :store-data="`/advertisers/delete/${remove}`"
            @store-data="onDeleteStored"
            @close="remove = false"
        />
    </div>
</template>
<style lang="scss">
.advertisers {
    .dataTable-table {
        tbody tr.in_house {
            background-color: #f5f5f5;

            // td {
            //     color: white;
            // }

            // td a {
            //     color: white;
            // }
        }
    }
}

.is-dark {
    .traffic_endpoints {
        .dataTable-table {
            tbody tr.in_house {
                background-color: #1f1f21;

                // td {
                //     color: black;
                // }

                // td a {
                //     color: black;
                // }
            }
        }
    }
}
</style>