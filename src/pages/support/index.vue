<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink } from 'vue-router'
import { DatatableMethods /*, SearchFunc, MapDataFunction*/ } from '/@src/components/partials/tables/Datatable.vue'
import VFlexPagination from '/@src/components/base/pagination/VFlexPagination.vue'
import { DateTime } from '/@src/utils/datatable/simple-render'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import { useNotyf } from '/@src/composable/useNotyf'
// import SchemeSearch from '/@src/schemes/support/supportSearch.json'
import SchemeFormSearch from '/@src/schemes/support/supportFormSearch.json'
import SchemeList from '/@src/schemes/support/supportList.json'
import SchemeNew from '/@src/schemes/support/supportNewTicket.json'
import VModal from '/@src/components/base/modal/VModal.vue'
// import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const notif = useNotyf()

const datatable = ref<DatatableMethods>()
const dataValue = ref([])
const formEvents = ref()
const isLoading = ref(false)

const custom = {
    Ticket() {
        return (value: string, row: any) => {
            return [h(RouterLink, { to: { name: 'support-id', params: { id: row._id } } }, () => h('b', value))]
        }
    },
    Category() {
        return (value: string, row: any) => {
            let items = [h('span', value)]
            if (row.broker_user) {
                items.push(h('br'))
                items.push(
                    h(
                        RouterLink,
                        { to: { name: 'brokers-id', params: { id: row.broker_user._id } }, target: '_blank' },
                        () => 'Broker: ' + row.broker_user.partner_name_secure
                    )
                )
            }
            if (row.endpoint_user) {
                items.push(h('br'))
                items.push(
                    h(
                        RouterLink,
                        { to: { name: 'traffic_endpoints-id', params: { id: row.endpoint_user._id } }, target: '_blank' },
                        () => 'TrafficEndpoing: ' + row.endpoint_user.token
                    )
                )
            }
            return items
        }
    },
    AccountName() {
        return (value: any) => {
            return h('div', [h('div', value?.name), h('div', value?.account_email)])
        }
    },
    AssignedName() {
        return (value: any, row: any) => {
            // return h('div', [h('div', value?.name), h('div', value?.account_email)])
            // console.log(row.assigned_to_users_data)
            const users = (row.assigned_to_users_data ?? []).map((user: any) => user.name + ' (' + user.account_email + ')').join(', ')
            return h('div', users)
        }
    },
    Timestamp() {
        return (value: any, row: any) => {
            let items = [h('div', [h('b', 'Created At: '), h('span', DateTime()(row.timestamp))])]
            if (row.timestamp_progress) {
                if (row.timestamp_progress.finished) {
                    items.push(h('div', [h('b', 'Finished: '), h('span', DateTime()(row.timestamp_progress.finished))]))
                }
                if (row.timestamp_progress.opened) {
                    items.push(h('div', [h('b', 'Open: '), h('span', row.timestamp_progress.opened)]))
                }
                if (row.timestamp_progress.taken) {
                    items.push(h('div', [h('b', 'Taken: '), h('span', row.timestamp_progress.taken)]))
                }
            }
            return items
        }
    },
}

const onCreateStored = () => {
    setTimeout(() => formEvents?.value?.onStoreSubmit(), 10)
    // datatable.value?.fetchData()
    notif.success('Updated Successfully')
}

const onFilterBeforeStored = () => {
    isLoading.value = true
}

const onFilterStored = (data: any) => {
    dataValue.value = data.items
    pagination.setTotalItems(data.total)
    isLoading.value = false
}

const onFilterUpdated = () => {
    pagination.setPage(1)
}

const pagination = (function () {
    const uri = ref<string>('/support/page/1')
    const itemPerPage = ref<number>(10)
    const totalItems = ref<number>(1)
    const currentPage = ref<number>(1)

    const setPage = (_currentPage: number) => {
        uri.value = '/support/page/' + _currentPage
        currentPage.value = _currentPage
        setTimeout(() => formEvents?.value?.onStoreSubmit(), 10)
    }

    const setTotalItems = (total: number) => {
        totalItems.value = total
    }

    return {
        uri,
        itemPerPage,
        totalItems,
        currentPage,
        setPage,
        setTotalItems,
    }
})()

// const OnMapData: MapDataFunction = (data: any) => {
//     pagination.setTotalItems(data.total)
//     return data.items
// }

// const OnDatatableSearch = (value: any, search: any) => {
//     console.log(value)
//     searchFunc.value = value
// }

const createTicket = ref(false)
const initial = { type: '1' }
const initialForm = { status: ['1,3'], timeframe: DefaultTimeRange }

// const searchData = ref<any[] | null>(null)
// const searchFunc = ref<SearchFunc>()
</script>

<template>
    <div class="columns is-multiline">
        <div class="field column">
            <!-- <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
                <VButton color="primary" @click="createTicket = true">Create Ticket</VButton>
            </DatatableSearch> -->

            <LocalToolbar> &nbsp;<VButton color="primary" @click="createTicket = true">Create Ticket</VButton> </LocalToolbar>

            <ApiForm
                :wrapper="PageToolbarNoButton"
                title=""
                size="6xl"
                :scheme="SchemeFormSearch"
                :fetch-data="initialForm"
                store-on="change"
                store-label="Search"
                store-method="post"
                :store-data="pagination.uri.value"
                @events="(value) => (formEvents = value)"
                @before-store="onFilterBeforeStored"
                @store-data="onFilterStored"
                @update:data="onFilterUpdated"
            />
        </div>
    </div>

    <VLoader :active="isLoading" size="xl">
        <Datatable :columns="SchemeList.columns" :custom="custom" :model-value="dataValue" @init="(value) => (datatable = value)">
            <template #bottom>
                <VFlexPagination
                    :item-per-page="pagination.itemPerPage.value"
                    :total-items="pagination.totalItems.value"
                    :current-page="pagination.currentPage.value"
                    :no-router="true"
                    @update:current-page="pagination.setPage"
                ></VFlexPagination>
            </template>
        </Datatable>
    </VLoader>

    <ApiForm
        v-if="createTicket"
        :wrapper="VModal"
        title="Create a Ticket"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/support/create`"
        @store-data="
            () => {
                onCreateStored()
                createTicket = false
            }
        "
        @close="createTicket = false"
    />
</template>