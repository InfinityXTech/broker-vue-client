<script setup lang="ts">
import { h, ref, provide, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { SearchFunc, DatatableColumn } from '/@src/components/partials/tables/Datatable.vue'
import { RouterLink, useRouter } from 'vue-router'
import Scheme from '/@src/schemes/marketing_report/reportForm.json'
import SchemeSearch from '/@src/schemes/marketing_report/reportSearch.json'
import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import { useApi } from '/@src/composable/useApi'
import { AxiosResponse } from 'axios'
import { useDownload } from '/@src/composable/useDownload'
import { useUserSession } from '/@src/stores/userSession'

const api = useApi()
const download = useDownload()

// const router = useRouter()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('BI Dashboard')

const userSession = useUserSession()
const perm = userSession.permissions('marketing_reports')
const is_account_manager = perm.is_custom_allow('account_manager')
// const is_adjustment = perm.is_custom_allow('adjustment')

const del_cheme_field = (name: string) => {
    for (let i = 0; i < Scheme.content.length; i++) {
        if (Scheme.content[i].data == name) {
            Scheme.content.splice(i, 1)
        }
    }
}
if (!is_account_manager) {
    del_cheme_field('account_manager')
}

type ResponseData = {
    columns: Record<string, DatatableColumn>
    items: any[]
    totals: any[]
}

const dataValue = ref<ResponseData>({
    columns: {},
    items: [],
    totals: [],
})

const custom = {
    ClickID() {
        return (value: string, row: any) => {
            return h(
                RouterLink,
                { to: { name: 'marketing_investigate-type-id', params: { type: 'event', id: encodeURIComponent(row.ClickID) } }, target: '_blank' },
                () => value
            )
        }
    },
}

// const initial = {
//     pivot: ['revenue'],
//     metrics: [],
// }

const onStored = (data: any) => {
    dataValue.value = data
    //notif.success('Updated Successfully')
}

const onFetched = (data: any) => {
    initial.value = data
}

const onUpdateData = (data: any, target: any, v: any) => {
    switch (target) {
        case 'pivot': {
            api.put('/auth/user_profile_data/marketing_report_pivot', { data: v })
            break
        }
        case 'metrics': {
            api.put('/auth/user_profile_data/marketing_report_metrics', { data: v })
            break
        }
    }
}

const initial = ref<any>({})
const fetchInitial = async () => {
    let pivot = Array<string>()
    await sprav.promisePivot.then(function (items: any) {
        pivot = items.filter((item: any) => item.selected == true).map((item: any) => item.value)
    })

    let metrics = Array<string>()
    await sprav.promiseMetrics.then(function (items: any) {
        metrics = items.filter((item: any) => item.selected == true).map((item: any) => item.value)
    })

    initial.value = {
        pivot: pivot,
        metrics: metrics,
        timeframe: DefaultTimeRange,
        adjustment: false,
    }
}
const sprav = (function () {
    if (userSession.roles().is('admin') || perm.is_active()) {
        const requestPivot = api.get('/marketing_report/pivot')
        const promisePivot = requestPivot.then((response: AxiosResponse<any>) => response.data)
        provide('marketing_pivot', () => promisePivot)

        const requestMetrics = api.get('/marketing_report/metrics')
        const promiseMetrics = requestMetrics.then((response: AxiosResponse<any>) => response.data)
        provide('marketing_metrics', () => promiseMetrics)

        return {
            promisePivot,
            promiseMetrics,
        }
    }
    return {
        promisePivot: new Promise(() => {}),
        promiseMetrics: new Promise(() => {}),
    }
})()

if (userSession.roles().is('admin') || perm.is_active()) {
    await fetchInitial()
}

const exports = (function () {
    const isActive = ref(false)
    const isLoading = ref(false)
    const data = ref<any[]>([])
    return {
        isActive,
        isLoading,
        data,
        show() {
            data.value = initial.value.metrics
            isActive.value = true
        },
        download() {
            const query: any = Object.assign({}, initial.value)
            query.metrics = data.value
            download.post('/marketing_report/download', query, 'report.csv')
        },
    }
})()

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

onUnmounted(() => {
    searchData.value = null
    dataValue.value = {
        columns: {},
        items: [],
        totals: [],
    }
    initial.value = null
})
</script>

<template>
    <div class="report-page">
        <ApiForm
            title=""
            :wrapper="PageToolbarButtonDown"
            :scheme="Scheme"
            :fetch-data="initial"
            store-label="Search"
            store-method="post"
            :store-data="'/marketing_report'"
            @fetch-data="onFetched"
            @store-data="onStored"
            @update:data="onUpdateData"
        />

        <br />

        <div class="columns is-multiline" style="align-items: right; justify-content: right">
            <div class="field column is-4">
                <DatatableSearch :config="SchemeSearch" class="report" :data="searchData" @changed="(value) => (searchFunc = value)">
                    <VButton icon="fas fa-file-csv" @click="exports.show">Export</VButton>
                </DatatableSearch>
            </div>
        </div>

        <Datatable
            :columns="dataValue.columns"
            :custom="custom"
            :search="searchFunc"
            :model-value="dataValue.items"
            :total-value="dataValue.totals"
            :show-only-screen-data="true"
            @changed="(value) => (searchData = value)"
        />

        <VModal
            v-if="exports.isActive.value"
            open
            title="Select the columns that will be visible in the exported CSV"
            size="big"
            actions="right"
            @close="exports.isActive.value = false"
        >
            <template #content>
                <CheckboxMultiSelect
                    :columns="3"
                    :model-value="exports.data.value"
                    :options="{ custom: 'marketing_metrics' }"
                    @update:model-value="(value) => (exports.data.value = value)"
                />
            </template>
            <template #action>
                <VButton color="primary" :loading="exports.isLoading.value" elevated @click="exports.download">Download CSV</VButton>
            </template>
        </VModal>
    </div>
</template>
<style lang="scss">
// .report-calendar-menu {
//     &.dp__menu {
//         min-width: 100px;
//     }

//     .dp__instance_calendar {
//         display: none;
//     }
// }
</style>