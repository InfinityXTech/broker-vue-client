<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink, useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import SchemeSearch from '/@src/schemes/brokers/brokersSearch.json'
import SchemeList from '/@src/schemes/brokers/brokersList.json'
import SchemeNew from '/@src/schemes/brokers/brokerNewModal.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useDownload } from '/@src/composable/useDownload'
import { useUserSession } from '/@src/stores/userSession'
import VTag from '/@src/components/base/tags/VTag.vue'

const RenderRow = (row: any): Record<string, any> => {
    return {
        class: [row.in_house && 'in_house'],
    }
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

if (!userSession.features().is_public('PT100')) {
    if (SchemeList.columns['tag_management']) {
        delete SchemeList.columns['tag_management']
    }
    for (let i = 0; i < SchemeSearch.columns.length; i++) {
        if (SchemeSearch.columns[i].value == 'tag_management._id') {
            SchemeSearch.columns.splice(i, 1)
            break
        }
    }
}

const create = ref(false)
const initial = {
    partner_type: 1,
}

const custom = {
    BrokerName() {
        return (value: string, row: any) => {
            let items = []

            // if (is_access_edit) {
            items.push(h(RouterLink, { to: { name: 'brokers-id', params: { id: row._id } } }, () => h('b', value)))
            // } else {
            //     items.push(h('b', value))
            // }

            if (row.billing_manual_status == 'collection') {
                items.push(h('span', { style: { marginLeft: '5px' } }))
                items.push(h(VTag, { color: 'warning', size: 'tiny' }, () => 'collection'))
            }

            items.push(h('br'))
            items.push(h('small', row._id))

            return items
        }
    },
    AccountName() {
        return (value: any) => {
            return value?.name
            //return h('div', [h('div', value?.name), h('div', value?.account_email)])
        }
    },
    Tags() {
        return (value: any) => {
            let arr: any[] = []
            value.forEach((element: { color: any; name: any }) => {
                arr.push(
                    h(
                        VTag,
                        {
                            color: '',
                            size: 'tiny',
                            style: { marginRight: '5px', backgroundColor: element.color, color: '#fff' },
                        },
                        () => element.name
                    )
                )
            })
            return arr
        }
    },
}

const router = useRouter()
const onStored = (data: any) => {
    router.push({ name: 'brokers-id', params: { id: data._id } })
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
    <div class="brokers">
        <LocalToolbar />

        <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
            <!-- <VButton v-if="is_access_add || is_access_edit" :to="{ name: 'brokers-create' }" color="primary" icon="fas fa-plus" elevated> Add Broker </VButton> -->
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Broker </VButton>
        </DatatableSearch>

        <Datatable
            :columns="SchemeList.columns"
            uri="/broker/all"
            :custom="custom"
            :render-row="RenderRow"
            :freeze-row="(row: { in_house: any }) => row.in_house"
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
            store-data="/broker/create"
            @store-data="onStored"
            @close="create = false"
        />
    </div>
</template>
<style lang="scss">
.brokers {
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
