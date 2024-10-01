<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { usePerformance } from '/@src/stores/performance'
import { useDownload } from '/@src/composable/useDownload'
import SchemeListGeneral from '/@src/schemes/performance/deepDiveListGeneral.json'
import SchemeListCountry from '/@src/schemes/performance/deepDiveListCountry.json'
import SchemeListVendor from '/@src/schemes/performance/deepDiveListVendor.json'
import SchemeForm from '/@src/schemes/performance/deepDiveForm.json'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'

export interface DeepDiveData {
    general?: any[]
    country?: any[]
    vendor?: any[]
}

const custom = {
    Actions() {
        return (value: any, row: any) => {
            return h(VIconButton, {
                title: 'Download Leads',
                icon: 'fas fa-download',
                onClick: () =>
                    download.post(
                        '/performance/download',
                        performance.getRequest(SchemeForm, { error_message: row.message, country_code: row.country }),
                        'leads.csv'
                    ),
            })
        }
    },
}

const performance = usePerformance()
const download = useDownload()
const data = ref<DeepDiveData | null>({})

onUnmounted(() => {
    data.value = null
})
</script>

<template>
    <SidemenuTabs />

    <ApiForm
        :wrapper="PageToolbarNoButton"
        title="Deep Dive"
        :fetch-data="performance.data"
        :scheme="SchemeForm"
        store-method="post"
        store-data="/performance/deep_dive"
        store-on="change"
        @before-store="(value) => ((data = {}), performance.setData(value))"
        @store-data="(value) => (data = value)"
    />

    <br />

    <div class="columns is-multiline">
        <div class="column inv-column" :class="['is-6']">
            <div class="head-text">Errors General</div>
            <Datatable :columns="SchemeListGeneral.columns" :custom="custom" :model-value="data.general" />
        </div>
        <div class="column inv-column" :class="['is-6']">
            <div class="head-text">Errors by Country</div>
            <Datatable :columns="SchemeListCountry.columns" :custom="custom" :model-value="data.country" />
        </div>
        <div class="column inv-column" :class="['is-6']">
            <div class="head-text">Errors by API Vendor</div>
            <Datatable :columns="SchemeListVendor.columns" :custom="custom" :model-value="data.vendor" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.head-text {
    font-size: 26px;
}
</style>