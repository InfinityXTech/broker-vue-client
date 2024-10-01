<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink, useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import VTag from '/@src/components/base/tags/VTag.vue'
import SchemeSearch from '/@src/schemes/traffic_endpoints/endpointsSearch.json'
import Scheme from '/@src/schemes/traffic_endpoints/endpointNew.json'
import TrafficEndpointTableScheme from '/@src/schemes/traffic_endpoints/endpointsList.json'
import { useDownload } from '/@src/composable/useDownload'
import { useUserSession } from '/@src/stores/userSession'
import VModal from '/@src/components/base/modal/VModal.vue'

const RenderRow = (row: any): Record<string, any> => {
    return {
        class: [row.in_house && 'in_house'],
    }
}

const custom = {
    Token() {
        return (value: string, row: any) => {
            const items = [h(RouterLink, { to: { name: 'traffic_endpoints-id', params: { id: row._id } } }, () => h('b', value))]
            if (row.probation == 2) {
                items.push(h('span', { style: { marginLeft: '5px' } }))
                items.push(h(VTag, { color: 'black', size: 'tiny' }, () => 'probation'))
            }
            if (row.status == '0' && row.deactivation_reason != undefined) {
                items.push(h('br'))
                items.push(h(VTag, { class: 'is-' + row.deactivation_reason.toLowerCase().replace(' ', '-'), size: 'tiny' }, () => row.deactivation_reason))
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

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(TrafficEndpointTableScheme.title)

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')
const is_access_download_crg_deals = perm.is_custom_allow('download_crg_deals')
const is_access_download_price = perm.is_custom_allow('download_price')

const datatable = ref<DatatableMethods>()
const download = useDownload()

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

const create = ref(false)

const router = useRouter()
const onStored = (data: any) => {
    router.push({ name: 'traffic_endpoints-id', params: { id: data._id } })
    create.value = false
}

onUnmounted(() => {
    searchData.value = null
    datatable.value = undefined
})
</script>

<template>
    <div class="traffic_endpoints">
        <LocalToolbar />

        <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
            <VButton v-if="is_access_add || is_access_edit" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Traffic Endpoint </VButton>
        </DatatableSearch>

        <Datatable
            :columns="TrafficEndpointTableScheme.columns"
            :uri="TrafficEndpointTableScheme.uri"
            :custom="custom"
            :render-row="RenderRow"
            :freeze-row="(row) => row.in_house"
            :show-only-screen-data="true"
            :search="searchFunc"
            @init="(value) => (datatable = value)"
            @changed="(value) => (searchData = value)"
        />

        <ApiForm
            v-if="create"
            :wrapper="VModal"
            title="Add New TrafficEndpoint"
            :fetch-data="{}"
            :scheme="Scheme"
            store-label="Add Traffic Endpoint"
            store-method="post"
            store-data="/traffic_endpoint/create"
            @store-data="onStored"
            @close="create = false"
        />
    </div>
</template>
<style lang="scss">
.traffic_endpoints {
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
.is-company-closed {
    background-color: #ff9a00 !important;
    color: #fff !important;
}
.is-fraud {
    background-color: #f00 !important;
    color: #fff !important;
}
.is-duplicated-endpoint {
    background-color: #b2afa9 !important;
    color: #fff !important;
}
.is-other {
    background-color: #ffeabf !important;
    color: #000 !important;
}
</style>