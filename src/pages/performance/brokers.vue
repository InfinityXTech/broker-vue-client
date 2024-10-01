<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { usePerformance } from '/@src/stores/performance'
import { useDownload } from '/@src/composable/useDownload'
import SchemeForm from '/@src/schemes/performance/brokersForm.json'
import SchemeList from '/@src/schemes/performance/brokersList.json'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'

const custom = {
    Name() {
        return (value: any, row: any) => {
            return h(RouterLink, { to: { name: 'performance-deep_dive' }, onClick: () => performance.setError(row.type) }, () => value)
        }
    },
    Actions() {
        return (value: any, row: any) => {
            if (row.count > 0) {
                return h(VIconButton, {
                    title: 'Download Leads',
                    icon: 'fas fa-download',
                    onClick: () => download.post('/performance/download', performance.getRequest(SchemeForm, { error_type: row.type }), 'leads.csv'),
                })
            }
            return ''
        }
    },
}

const performance = usePerformance()
const download = useDownload()
const data = ref<any[] | null>()
onUnmounted(() => {
    data.value = null
})
</script>

<template>
    <SidemenuTabs />

    <ApiForm
        :wrapper="PageToolbarNoButton"
        title="Brokers Performance"
        :fetch-data="performance.data"
        :scheme="SchemeForm"
        store-method="post"
        store-data="/performance/brokers"
        store-on="change"
        @before-store="(value) => ((data = undefined), performance.setData(value))"
        @store-data="(value) => (data = value)"
    />
    <br />

    <div class="head-text">Brokers</div>
    <Datatable :columns="SchemeList.columns" :custom="custom" :model-value="data" />
</template>

<style scoped lang="scss">
.head-text {
    font-size: 26px;
}
</style>