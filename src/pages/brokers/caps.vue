<script setup lang="ts">
import { h, computed, provide, ref, onUnmounted } from 'vue'
import { useUserSession } from '/@src/stores/userSession'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import { ApiFormMethods } from '/@src/components/partials/ApiForm.vue'
import { RenderLogs } from '/@src/utils/datatable/simple-render'
import { CapsRenders } from '/@src/utils/datatable/caps-render'
import { useDownload } from '/@src/composable/useDownload'
import SchemeEdit from '/@src/schemes/brokers/brokerCapEdit.json'
import SchemeList from '/@src/schemes/brokers/brokerCapsList.json'
import SchemeLogList from '/@src/schemes/brokers/brokerCapsLogList.json'
import SchemeSearch from '/@src/schemes/brokers/brokerCapsSearchForm.json'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'

const custom = Object.assign(CapsRenders, {
    Actions() {
        return (value: any, row: any) => {
            let items: any[] = []
            if (is_access_edit) {
                items.push(h(VIconButton, { title: 'Edit', icon: 'fas fa-edit', onClick: () => (update.value = row._id) } /*, () => 'Edit'*/))
            }

            if (items.length > 0) {
                items.push(' ')
            }

            items.push(h(VIconButton, { title: 'Log', icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) } /*, () => 'Log'*/))

            if (is_access_send_test_lead) {
                items.push(' ')
                items.push(h(VIconButton, { title: 'Test Lead', icon: 'fas fa-fire', onClick: () => (test_lead.value = row) } /* () => 'Test Lead'*/))
            }

            return items
        }
    },
})

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const api = useApi()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('daily_cap')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('daily_cap')
const is_access_download = perm.is_custom_allow('download_caps_country')
const is_access_send_test_lead = userSession.roles().is('admin', 'super_admin', 'tech_support', 'integration_manager')

if (userSession.roles().is('account_manager') && !perm.is_allow('allocate_am')) {
    is_access_add = is_access_edit = false
}

const download = useDownload()

const search = ref<ApiFormMethods>()

const caps = ref<any[]>()
const logs = ref<string | false>(false)
const update = ref<string | false>(false)
const test_lead = ref<any | boolean>(false)

let setIntegrations: any = null
let originalDailyCap = 0
const fetchCap = async () => {
    const { data } = await api.get(`/broker/broker_caps/${update.value}`)
    originalDailyCap = data.daily_cap
    api.get(`/broker/${data.broker}/integrations/all`).then((response) => {
        if (setIntegrations) {
            setIntegrations(response.data.filter((item: any) => item.status == 1).map((item: any) => ({ value: item._id, label: item.name })))
        }
    })
    return data
}

const availableEndpointsCap = (function () {
    const active = ref<boolean>(false)
    const loading = ref<boolean>(false)
    const content = ref<any>()

    const onClick = async () => {
        if (update.value) {
            loading.value = true
            let html = '<table>'
            const { data } = await api.get(`/broker/broker_caps/available_endpoints/${update.value}`)
            data.forEach((item: any) => {
                html += `<tr><td style="width: 200px"><a href="/traffic_endpoints/${item._id}" target="_blank">${item.title}</td><td style="color:green">available</td></tr>`
            })
            html += '</table>'
            content.value = html
            active.value = true
            loading.value = false
        }
    }

    return {
        active,
        loading,
        content,
        onClick,
    }
})()

const dicts = computed(() => {
    let result: any = {
        brokers: {},
        integrations: {},
        countries: {},
        languages: {},
    }
    caps.value?.forEach((item) => {
        result.brokers[item.broker?._id] = item.broker?.name
        result.integrations[item.integration?._id] = item.integration?.name
        result.countries[item.country?.code] = item.country?.name
        item.languages.forEach((lang: any) => (result.languages[lang?.code] = lang?.name))
    })
    return result
})

const beforeCapStore = () => {
    caps.value = undefined
}

const storeCap = (data: any) => {
    caps.value = data
    search.value?.forceReRenderForm(null)
}

provide('custom_brokers', () => dicts.value.brokers)
provide('custom_integrations', () => dicts.value.integrations)
provide('custom_countries', () => dicts.value.countries)
provide('custom_languages', () => dicts.value.languages)

// var dictionaries = api.get('/broker/broker_caps/dictionaries')
// provide('custom_brokers', () => dictionaries.then((response) => response.data.brokers))
// provide('custom_integrations', () => dictionaries.then((response) => response.data.integrations))
// provide('custom_countries', () => dictionaries.then((response) => response.data.countries))
// provide('custom_languages', () => dictionaries.then((response) => response.data.languages))

provide('active_integrations', () => new Promise((resolve) => (setIntegrations = resolve)))
provide('daily_cap_change_reason', (value: number) => value != originalDailyCap)

onUnmounted(() => {
    search.value = undefined
})
</script>

<template>
    <LocalToolbar>
        <ToolbarItem
            v-if="is_access_download"
            icon="fas fa-download"
            title="Download Unique Countries"
            @click="download.get('/broker/broker_caps/countries')"
        />
    </LocalToolbar>

    <ApiForm
        :wrapper="PageToolbarNoButton"
        title=""
        :scheme="SchemeSearch"
        store-label="Search"
        store-method="post"
        :fetch-data="{ enable_traffic: 1 }"
        store-data="/broker/broker_caps"
        store-on="change"
        @before-store="beforeCapStore()"
        @store-data="(data) => storeCap(data)"
        @events="(value) => (search = value)"
    />

    <Datatable :columns="SchemeList.columns" :model-value="caps" :custom="custom" :show-only-screen-data="true" />

    <VModal v-if="logs" open tabs title="Logs" size="big" cancel-label="Close" actions="right" @close="logs = false">
        <template #content>
            <Datatable :columns="SchemeLogList.columns" :uri="`/broker/broker_caps/logs/${logs}`" :render-row="RenderLogs" />
        </template>
    </VModal>

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        size="4xl"
        title="Update Daily Cap"
        :fetch-data="fetchCap"
        :scheme="SchemeEdit"
        store-method="put"
        :readonly="!is_access_edit"
        :store-data="`/broker/broker_caps/update/${update}`"
        @store-data="search?.onStoreSubmit(), (update = false)"
        @close="update = false"
    >
        <template #action>
            <a
                style="position: absolute; left: 17px"
                :class="['button', 'v-button', 'is-elevated', 'is-primary', availableEndpointsCap.loading.value && 'is-loading']"
                @click="availableEndpointsCap.onClick"
                >Show Available Endpoints
            </a>

            <VModal
                :open="availableEndpointsCap.active.value"
                title="Available Endpoints"
                cancel-label="Close"
                actions="right"
                @close="availableEndpointsCap.active.value = false"
            >
                <template #content> <div v-html="availableEndpointsCap.content.value"></div> </template>
            </VModal>
        </template>
    </ApiForm>

    <TestLead
        :open="test_lead != false"
        :data="{
            integrationId: test_lead.integration?._id.toString(),
            country: test_lead.country?.code,
            funnel_language: test_lead?.languages?.length > 0 ? test_lead.languages[0].code : undefined,
        }"
        :countries="test_lead?.country?.code ? [test_lead.country.code] : undefined"
        :languages="test_lead?.languages?.map((x) => x.code)"
        @close="test_lead = false"
    />
</template>
