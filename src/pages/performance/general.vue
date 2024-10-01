<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { usePerformance } from '/@src/stores/performance'
import { useDownload } from '/@src/composable/useDownload'
import { RouterLink } from 'vue-router'
import SchemeForm from '/@src/schemes/performance/generalForm.json'
import SchemeList from '/@src/schemes/performance/generalList.json'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'

export interface GeneralData {
    endpoints?: any[]
    brokers?: any[]
}

const custom = {
    Name() {
        return (value: any, row: any) => {
            if (row.endpoint) {
                return h(RouterLink, { to: { name: 'performance-traffic_endpoints' }, onClick: () => performance.setIds(row) }, () => value)
            }
            if (row.broker) {
                return h(RouterLink, { to: { name: 'performance-brokers' }, onClick: () => performance.setIds(row) }, () => value)
            }
            return value
        }
    },
    Actions() {
        return (value: any, row: any) => {
            return h(VIconButton, {
                title: 'Download Leads',
                icon: 'fas fa-download',
                onClick: () =>
                    download.post('/performance/download', performance.getRequest(SchemeForm, { endpointId: row.endpoint, brokerId: row.broker }), 'leads.csv'),
            })
        }
    },
}

const performance = usePerformance()
const download = useDownload()
const data = ref<GeneralData | null>({})
onUnmounted(() => {
    data.value = null
})
</script>

<template>
    <SidemenuTabs />

    <ApiForm
        :wrapper="PageToolbarNoButton"
        title="General Performance"
        :fetch-data="performance.data"
        :scheme="SchemeForm"
        store-method="post"
        store-data="/performance/general"
        store-on="change"
        @before-store="(value) => ((data = {}), performance.setData(value))"
        @store-data="(value) => (data = value)"
    />

    <br />

    <div class="columns is-multiline">
        <div class="column inv-column is-6">
            <div class="head-text">Traffic Endpoints</div>
            <Datatable :columns="SchemeList.columns" :custom="custom" :model-value="data.endpoints" />
        </div>
        <div class="column inv-column is-6">
            <div class="head-text">Brokers</div>
            <Datatable :columns="SchemeList.columns" :custom="custom" :model-value="data.brokers" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.head-text {
    font-size: 26px;
}
</style>