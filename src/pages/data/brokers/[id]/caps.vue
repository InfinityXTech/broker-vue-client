<script setup lang="ts">
import { h, provide, ref, onUnmounted } from 'vue'
import { useUserSession } from '/@src/stores/userSession'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import { customDictionary } from '/@src/utils/dictionary'
import { ApiFormMethods } from '/@src/components/partials/ApiForm.vue'
import { RenderLogs } from '/@src/utils/datatable/simple-render'
import { CapsRenders } from '/@src/utils/datatable/caps-render'
import { checkBrokerAccess } from '/@src/utils/broker/access'
import SchemeNew from '/@src/schemes/brokers/brokerCapNew.json'
import SchemeEdit from '/@src/schemes/brokers/brokerCapEdit.json'
import SchemeList from '/@src/schemes/brokers/brokerCapsList.json'
import SchemeLogList from '/@src/schemes/brokers/brokerCapsLogList.json'
import SchemeSearch from '/@src/schemes/brokers/brokerCapsSearchForm.json'
import VButton from '/@src/components/base/button/VButton.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_edit = perm.is_allow('all')
const is_access_add = perm.is_allow('all')
const is_access_send_test_lead = userSession.roles().is('admin', 'super_admin', 'tech_support', 'integration_manager')

const api = useApi()
api.get('/broker/' + props.id).then((response: any) => {
    checkBrokerAccess(response?.data)
    viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - ' + SchemeList.title)
})

const custom = Object.assign(CapsRenders, {
    Actions() {
        return (value: any, row: any) => {
            let items: any[] = []
            if (is_access_edit) {
                items = [
                    h(VIconButton, { title: 'Edit', icon: 'fas fa-edit', onClick: () => (update.value = row._id) } /*, () => 'Edit'*/),
                    ' ',
                    h(VIconButton, { title: 'Duplicate', icon: 'fas fa-copy', onClick: () => (create.value = row._id) } /*, () => 'Duplicate'*/),
                    ' ',
                    h(VIconButton, { title: 'Log', icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) } /*, () => 'Log'*/),
                ]
            } else {
                items = [
                    h(VIconButton, { title: 'View', icon: 'fas fa-edit', onClick: () => (update.value = row._id) } /*, () => 'Edit'*/),
                    ' ',
                    h(VIconButton, { title: 'Log', icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) } /* () => 'Log'*/),
                ]
            }

            if (is_access_send_test_lead) {
                items.push(' ')
                items.push(h(VIconButton, { title: 'Test Lead', icon: 'fas fa-fire', onClick: () => (test_lead.value = row) } /* () => 'Test Lead'*/))
            }

            return items
        }
    },
})

const datatable = ref<ApiFormMethods>()

const caps = ref<any[]>()
const logs = ref<string | false>(false)
const create = ref<string | boolean>(false)
const update = ref<string | false>(false)
const test_lead = ref<any | boolean>(false)

let originalDailyCap = 0
const fetchCap = async () => {
    const { data } = await api.get(`/broker/broker_caps/${update.value}`)
    originalDailyCap = data.daily_cap
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
                html += `<tr><td style="width: 100px"><a href="/traffic_endpoints/${item._id}" target="_blank">${item.title}</td><td style="color:green">available</td></tr>`
            })
            html += '</table>'
            content.value = html
            active.value = true
            loading.value = false
            // console.log(data)
        }
    }

    return {
        active,
        loading,
        content,
        onClick,
    }
})()

const createCap = async () => {
    if (create.value === true) {
        const { data } = await api.get(`/broker/name/${props.id}`)
        return {
            broker_name: data.partner_name_secure ?? props.id,
            period_type: 'D',
            restrict_type: null,
            blocked_funnels_type: null,
        }
    } else {
        const { data } = await api.get(`/broker/broker_caps/${create.value}`)
        delete data._id
        return data
    }
}

var dictionaries = api.get(`/broker/${props.id}/broker_caps/dictionaries`)
provide('custom_brokers', () => dictionaries.then((response) => response.data.brokers))
provide('custom_integrations', () => dictionaries.then((response) => response.data.integrations))
provide('custom_countries', () => dictionaries.then((response) => response.data.countries))
provide('custom_languages', () => dictionaries.then((response) => response.data.languages))

provide(
    'active_integrations',
    customDictionary(`/broker/${props.id}/integrations/all`, (item: any) => {
        return item.status == 1 ? { value: item._id, label: item.name } : undefined
    })
)
provide('daily_cap_change_reason', (value: number) => value != originalDailyCap)

// Use same scheme but without Actions column
const columns: any = Object.assign({}, SchemeList.columns)
delete columns.broker

// const search: any = Object.assign({}, SchemeSearch)
const search: any = JSON.parse(JSON.stringify(SchemeSearch))
delete search.content[0]

onUnmounted(() => {
    datatable.value = undefined
})
</script>

<template>
    <ApiForm
        :wrapper="PageToolbar"
        title=""
        :scheme="search"
        store-label="Search"
        store-method="post"
        :fetch-data="{ enable_traffic: 1 }"
        :store-data="`/broker/${props.id}/broker_caps`"
        store-on="change"
        @before-store="caps = undefined"
        @store-data="(data) => (caps = data)"
        @events="(value) => (datatable = value)"
    >
        <template #action>
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Daily Cap </VButton>
        </template>
    </ApiForm>

    <Datatable :columns="columns" :model-value="caps" :custom="custom" :show-only-screen-data="true" />

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
        :store-data="`/broker/broker_caps/update/${update}`"
        :readonly="!is_access_edit"
        @store-data="datatable?.onStoreSubmit(), (update = false)"
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

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        size="4xl"
        title="Add Daily Cap"
        :fetch-data="createCap"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/broker/${props.id}/broker_caps/create`"
        @store-data="datatable?.onStoreSubmit(), (create = false)"
        @close="create = false"
    />

    <TestLead
        :open="test_lead != false"
        :data="{
            integrationId: test_lead.integration?._id.toString(),
            country: test_lead.country?.code,
            funnel_language: test_lead?.languages?.length > 0 ? test_lead.languages[0].code : undefined,
        }"
        :countries="test_lead.country?.code ? [test_lead.country?.code] : undefined"
        :languages="test_lead?.languages?.map((x) => x.code)"
        @close="test_lead = false"
    />
</template>
