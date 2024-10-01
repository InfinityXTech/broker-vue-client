<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink } from 'vue-router'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import VFlexPagination from '/@src/components/base/pagination/VFlexPagination.vue'
import SchemeFormSearch from '/@src/schemes/leads_review/supportFormSearch.json'
import SchemeList from '/@src/schemes/leads_review/supportList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Leads Review Support Tickets')

const datatable = ref<DatatableMethods>()
const dataValue = ref([])
const formEvents = ref()
const isLoading = ref(false)

const custom = {
    Ticket() {
        return (value: string, row: any) => {
            return [h(RouterLink, { to: { name: 'leads_review_support-id', params: { id: row._id } } }, () => h('b', value)), h('br'), h('small', row._id)]
        }
    },
    AccountName() {
        return (value: any) => {
            return h('div', [h('div', value?.name), h('div', value?.account_email)])
        }
    },
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
    const uri = ref<string>('/leads_review/tickets/page/1')
    const itemPerPage = ref<number>(10)
    const totalItems = ref<number>(1)
    const currentPage = ref<number>(1)

    const setPage = (_currentPage: number) => {
        uri.value = '/leads_review/tickets/page/' + _currentPage
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

const initialForm = { status: ['1'] }
</script>

<template>
    <div class="columns is-multiline">
        <div class="field column is-7">
            <ApiForm
                :wrapper="PageToolbarNoButton"
                title=""
                size="big"
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
</template>