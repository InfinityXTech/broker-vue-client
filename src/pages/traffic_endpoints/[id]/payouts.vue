<script setup lang="ts">
import { h, ref } from 'vue'
import { useDictionary } from '/@src/composable/useDictionary'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'
import { RenderLogs } from '/@src/utils/datatable/simple-render'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/traffic_endpoints/payoutsList.json'
import SchemeEdit from '/@src/schemes/traffic_endpoints/payoutEdit.json'
import SchemeNew from '/@src/schemes/traffic_endpoints/payoutNew.json'
import SchemeSearch from '/@src/schemes/traffic_endpoints/payoutSearch.json'
import SchemeLogList from '/@src/schemes/traffic_endpoints/payoutLogList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import SelectField from '/@src/components/partials/forms/SelectField.vue'
import InputField from '/@src/components/partials/forms/InputField.vue'
import ToggleSwitchField from '/@src/components/partials/forms/ToggleSwitchField.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const dictionary = useDictionary()
const countries = dictionary.load({ dictionary: 'countries' })
const languages = dictionary.load({ dictionary: 'languages' })

const viewWrapper = useViewWrapper()
// viewWrapper.setPageTitle(SchemeList.title)

const api = useApi()
api.get('/traffic_endpoint/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Payouts Management')
)

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('payouts')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('payouts')
const is_access_send_test_lead = userSession.roles().is('admin', 'super_admin', 'tech_support', 'integration_manager')

const isLoading = ref(false)

const custom = {
    Country() {
        return (value: string) => (countries.isLoading ? h(VPlaceload) : countries.map[value])
    },
    Language() {
        return (value: string) => (languages.isLoading ? h(VPlaceload) : languages.map[value] ?? 'general')
    },
    CostType() {
        return (value: string) => ({ '1': 'CPA', '2': 'CPL' }[value] ?? '')
    },
    Payout() {
        return (value: string, proxy: any) => {
            if (is_access_edit) {
                return h(InputField, {
                    label: '',
                    modelValue: value,
                    'onUpdate:modelValue': (value: string) => {
                        proxy.payout = value
                        onSave(proxy)
                    },
                })
            } else {
                return h('span', { innerHTML: value })
            }
        }
    },
    DailyCap() {
        return (value: string, proxy: any) => {
            if (is_access_edit) {
                return h(InputField, {
                    label: '',
                    modelValue: value,
                    'onUpdate:modelValue': (value: string) => {
                        proxy.daily_cap = value
                        onSave(proxy, 'daily_cap')
                    },
                })
            } else {
                return h('span', { innerHTML: value })
            }
        }
    },
    Enabled() {
        return (value: boolean, proxy: any) => {
            if (is_access_edit) {
                return h(ToggleSwitchField, {
                    label: '',
                    modelValue: value,
                    'onUpdate:modelValue': (value: boolean) => {
                        proxy.enabled = value
                        onSave(proxy, 'enable')
                    },
                })
            } else {
                return h('span', { innerHTML: value ? 'Yes' : 'No' })
            }
        }
    },
    DistributionsCRG() {
        return (value: boolean, proxy: any) => {
            if (is_access_edit) {
                return h(ToggleSwitchField, {
                    label: '',
                    modelValue: value,
                    'onUpdate:modelValue': (value: boolean) => {
                        proxy.distributions_crg = value
                        onSave(proxy, 'distributions_crg')
                    },
                })
            } else {
                return h('span', { innerHTML: value ? 'Yes' : 'No' })
            }
        }
    },
    OffWeekendDistributionsCRG() {
        return (value: boolean, proxy: any) => {
            if (is_access_edit) {
                return h(ToggleSwitchField, {
                    label: '',
                    modelValue: value,
                    'onUpdate:modelValue': (value: boolean) => {
                        proxy.weekend_off_distributions_crg = value
                        onSave(proxy, 'weekend_off_distributions_crg')
                    },
                })
            } else {
                return h('span', { innerHTML: value ? 'Yes' : 'No' })
            }
        }
    },
    Actions() {
        return (value: any, row: any) => {
            let items = []
            if (is_access_edit) {
                items.push(h(VIconButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) } /*, () => 'Edit'*/))
            }
            items.push(h(VIconButton, { icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) } /*, () => 'Log'*/))

            if (is_access_send_test_lead) {
                items.push(' ')
                items.push(h(VIconButton, { title: 'Test Lead', icon: 'fas fa-fire', onClick: () => (test_lead.value = row) } /* () => 'Test Lead'*/))
            }

            return items
        }
    },
}

const update = ref<string | false>(false)
const create = ref(false)
const test_lead = ref<any | boolean>(false)
const logs = ref<string | false>(false)
const datatable = ref<DatatableMethods>()

const initial = {
    TrafficEndpoint: props.id,
    country_code: '',
    payout: 0,
    cost_type: '1',
}
const onStored = () => {
    update.value = false
    create.value = false
    datatable.value?.fetchData()
}

const onSave = function (data: any, path: string = 'update') {
    const api = useApi()
    let request: Promise<any> = api.put(`/traffic_endpoint/${props.id}/payouts/${path}/${data._id}`, data)
    request.then(() => {
        isLoading.value = false
    })
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()
</script>

<template>
    <SidemenuTabs menu-id="payout_private_deals-tabs" />
    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Country </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/traffic_endpoint/${props.id}/payouts/all`"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <VModal v-if="logs" open tabs title="Logs" size="big" cancel-label="Close" actions="right" @close="logs = false">
        <template #content>
            <Datatable :columns="SchemeLogList.columns" :uri="`/traffic_endpoint/${props.id}/payouts/logs/${logs}`" :render-row="RenderLogs" />
        </template>
    </VModal>

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Country"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/payouts/create`"
        @store-data="onStored"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Payout"
        :fetch-data="`/traffic_endpoint/${props.id}/payouts/${update}`"
        :scheme="SchemeEdit"
        store-method="put"
        :store-data="`/traffic_endpoint/${props.id}/payouts/update/${update}`"
        @store-data="onStored"
        @close="update = false"
    />

    <TestLead
        :open="test_lead != false"
        :data="{
            endpointId: test_lead.TrafficEndpoint,
            country: test_lead.country?.code,
            funnel_language: test_lead?.language?.code,
        }"
        :countries="test_lead?.country?.code ? [test_lead.country.code] : undefined"
        :languages="test_lead?.language?.code ? [test_lead?.language?.code] : undefined"
        @close="test_lead = false"
    />
</template>
