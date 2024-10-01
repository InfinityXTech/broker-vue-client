<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink } from 'vue-router'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import Scheme from '/@src/schemes/resync/resyncForm.json'
import SchemeList from '/@src/schemes/resync/resyncList.json'
import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const dataValue = ref([])

const initial = {
    timeframe: DefaultTimeRange,
}

const onStored = (data: any) => {
    dataValue.value = data
}

const custom = {
    EndpointName() {
        return (value: string, row: any) => {
            if (row.endpoint_data?._id) {
                return h(RouterLink, { to: { name: 'traffic_endpoints-id', params: { id: row.endpoint_data._id } }, target: '_blank' }, () => value)
            }
            return []
        }
    },
    TaskName() {
        return (value: string) => {
            const task_name: any = {
                '1': 'Sync to new broker',
                '2': 'Create new and Sync to new broker',
            }
            return task_name[value] ?? ''
        }
    },
    Working() {
        return (value: string) => {
            return value == 'true' ? 'processing...' : 'no'
        }
    },
    Leads() {
        return (value: string, row: any) => {
            let items: any[] = []
            if ((row.leads ?? []).length > 0) {
                row.leads.forEach((item: any) => {
                    if (items.length > 0) {
                        items.push(h('span', ', '))//{}, () => ', '))
                    }
                    items.push(h(RouterLink, { to: { name: 'investigate-type-id', params: { type: 'user', id: item.id } }, target: '_blank' }, () => item.id))
                })
            }
            return items
        }
    },
    DuplicateLeads() {
        return (value: string, row: any) => {
            let items: any[] = []
            if ((row.duplicate_leads ?? []).length > 0) {
                row.duplicate_leads.forEach((item: any) => {
                    if (items.length > 0) {
                        items.push(h('span',', '))// {}, () => ', '))
                    }
                    items.push(h(RouterLink, { to: { name: 'investigate-type-id', params: { type: 'user', id: item.id } }, target: '_blank' }, () => item.id))
                })
            }
            return items
        }
    }
}

onUnmounted(() => {
    dataValue.value = []
})
</script>

<template>
    <ApiForm
        title=""
        :wrapper="PageToolbarButtonDown"
        :scheme="Scheme"
        :fetch-data="initial"
        store-label="Search"
        store-method="post"
        :store-data="'/resync_report'"
        @store-data="onStored"
    />
    <br />
    <Datatable :columns="SchemeList.columns" :model-value="dataValue" :custom="custom" />
</template>