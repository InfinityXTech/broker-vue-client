<script setup lang="ts">
import { h, ref, provide, onUnmounted } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useDictionary } from '/@src/composable/useDictionary'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableColumn, DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { RenderLogs } from '/@src/utils/datatable/simple-render'
import { isArray } from '@vue/shared'
import { DateTime } from '/@src/utils/datatable/simple-render'
import VButton from '/@src/components/base/button/VButton.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import SchemeList from '/@src/schemes/traffic_endpoints/privateDealsList.json'
// import SchemeList from '/@src/schemes/traffic_endpoints/privateDealsListInline.json'
import SchemeLogList from '/@src/schemes/traffic_endpoints/privateDealsLogList.json'
import SchemeEdit from '/@src/schemes/traffic_endpoints/privateDealNew.json'
import SchemeEditIfHasLeads from '/@src/schemes/traffic_endpoints/privateDealEditIfHasLeads.json'
import SchemeNew from '/@src/schemes/traffic_endpoints/privateDealNew.json'
import SchemeSearch from '/@src/schemes/traffic_endpoints/privateDealSearch.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const api = useApi()

interface IKeyValue {
    [key: string]: string
}

const dictionary = useDictionary()
const countries = dictionary.load({ dictionary: 'countries' })
const endpoints = dictionary.load({ dictionary: 'traffic_endpoints' })
const types: IKeyValue = { '1': 'Payout Deal', '2': 'CRG Deal', '3': 'Payout + CRG Deal' }

const viewWrapper = useViewWrapper()
// viewWrapper.setPageTitle(SchemeList.title)

api.get('/traffic_endpoint/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Private Deals Management')
)

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('payouts')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('payouts')

const m_permission = userSession.permissions('*')
const is_permission_show_crg_deal_id = m_permission.is_allow('show_crg_deal_id')

const custom = {
    Name() {
        return (value: string, row: any) => {
            let items = [h('strong', row.name)]
            if (is_permission_show_crg_deal_id) {
                items.push(h('br'))
                items.push(h('small', row._id))
            }
            if ((row.description ?? '').length > 0) {
                items.push(h('br'))
                items.push(h('small', row.description))
            }
            if ((row.funnel_list ?? []).length > 0) {
                items.push(h('br'))
                items.push(h('small', 'funnels: ' + row.funnel_list.join(', ')))
            }
            if ((row.sub_publisher_list ?? []).length > 0) {
                items.push(h('br'))
                items.push(h('small', 'sub publisher: ' + row.sub_publisher_list?.join(', ')))
            }
            return items
        }
    },
    Description() {
        return (value: string, row: any) => {
            let items = []
            const makeItem = (name: string, value: string) => {
                return h('div', { class: 'field column', innerHTML: `<strong>${name}: </strong>${value}` })
            }
            if (row.type) {
                const type = types[row.type] ?? row.type
                items.push(makeItem('Deal Type', type))
            }
            if (row.endpoint && isArray(row.endpoint) && row.endpoint.length > 0) {
                if (!endpoints.isLoading && isArray(row.endpoint) && row.endpoint.length > 0) {
                    items.push(makeItem('Limited to Endpoints', row.endpoint.map((id: string) => endpoints.map[id]).join(', ')))
                }
            }
            if (row.country_code) {
                const country = countries.isLoading ? h(VPlaceload) : countries.map[row.country_code]
                const languages = row.language_code && row.language_code.length > 0 ? row.language_code.join(', ') : ''
                items.push(makeItem('Country', country + (languages.length > 0 ? '(' + languages + ')' : '')))
            }
            if (row.limited_leads) {
                const limited_leads = ['None', 'Limited Daily', 'Limited Total'][row.limited_leads || 0]
                items.push(makeItem('Leads Limitation', limited_leads))
            }
            if (row.end_date) {
                items.push(makeItem('End Date', DateTime()(row.end_date)))
            }
            // if (row.min_crg) {
            items.push(makeItem('Min CRG', row.min_crg ? row.min_crg + '%' : 'None'))
            // }
            return items
        }
    },
    DealType() {
        return (value: string) => types[value] ?? value
    },
    LeadsLimitation() {
        return (value: number) => h('span', ['None', 'Limited Daily', 'Limited Total'][value || 0])
    },
    Endpoints() {
        return (value: string[], row: any, column: DatatableColumn) => {
            if (endpoints.isLoading) {
                return h(VPlaceload)
            }
            if (isArray(value) && value.length > 0) {
                return value.map((id) => endpoints.map[id]).join(', ')
            }
            return column.default
        }
    },
    Country() {
        return (value: string[]) => {
            // countries.isLoading ? h(VPlaceload) : countries.map[value]
            if (countries.isLoading) {
                return h(VPlaceload)
            }
            let countries_str = ''
            if (value && value?.length > 0) {
                value?.forEach((country) => {
                    countries_str += country && country.length > 0 ? (countries_str.length > 0 ? ', ' : '') + countries.map[country] : ''
                })
            }
            return countries_str
        }
    },
    Language() {
        return (value: string[]) => {
            return value && value?.length > 0 ? value?.join(', ') : ''
        }
    },
    Actions() {
        return (value: any, row: any) => {
            if (is_access_edit) {
                return [
                    h(VIconButton, { title: 'Edit', icon: 'fas fa-edit', onClick: () => (update.value = row._id) }),
                    ' ',
                    h(VIconButton, { title: 'Duplicate', icon: 'fas fa-copy', onClick: () => (create.value = row._id) }),
                    ' ',
                    h(VIconButton, { title: 'Log', icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) }),
                ]
            } else {
                return [
                    h(VIconButton, { title: 'View', icon: 'fas fa-edit', onClick: () => (update.value = row._id) }),
                    ' ',
                    h(VIconButton, { title: 'Log', icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) }),
                ]
            }
        }
    },
}

const logs = ref<string | false>(false)
const update = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const createPrivateDeal = async () => {
    modelValue.value = {}
    if (create.value === true) {
        return { status: 0, type: '2', ignore_lead_statuses: [], calc_period_crg: '2' }
    } else {
        const { data } = await api.get(`/traffic_endpoint/${props.id}/private_deals/${create.value}`)
        delete data._id
        data.status = 0
        getSubPublisherList(data.endpoint)
        return data
    }
}

const actualSchemeEdit = ref(SchemeEdit)
const onFetchPrivateDeal = async () => {
    modelValue.value = { ignore_lead_statuses: false }
    const { data: response } = await api.request({ url: `/traffic_endpoint/${props.id}/private_deals/${update.value}` })
    modelValue.value = response
    if (response.has_leads) {
        actualSchemeEdit.value = SchemeEditIfHasLeads
    } else {
        actualSchemeEdit.value = SchemeEdit
    }
    return modelValue.value
}

const modelValue = ref()
provide('add_invalid_statuses', () => {
    setTimeout(() => {
        ;['Wrong Number', 'Under Age', 'Language barrier', 'Invalid'].forEach((status: string) => {
            if (!modelValue.value) {
                modelValue.value = {}
            }
            if (!isArray(modelValue.value.ignore_lead_statuses)) {
                modelValue.value.ignore_lead_statuses = []
            }
            if ((modelValue.value.ignore_lead_statuses ?? []).map((item: string) => item.toLowerCase().trim()).indexOf(status.toLowerCase().trim()) < 0) {
                modelValue.value.ignore_lead_statuses.push(status)
            }
        })
        if (create.value) {
            createFormEvents.value?.forceReRenderForm({ ignore_lead_statuses: modelValue.value.ignore_lead_statuses })
        }
        if (update.value !== false) {
            updateFormEvents.value?.forceReRenderForm({ ignore_lead_statuses: modelValue.value.ignore_lead_statuses })
        }
    }, 1)
})

const getSubPublisherList = (traffic_endpoints: string[]) => {
    if (traffic_endpoints?.length > 0) {
        api.post('/traffic_endpoint/sprav/sub_publisher_tokens', { traffic_endpoints: traffic_endpoints, hide_traffic_endpoint_name: true }).then(
            (response) => {
                dataSubPublisherList.value = response?.data
                if (create.value) {
                    createFormEvents.value.forceReRenderForm()
                }
                if (update.value) {
                    updateFormEvents.value.forceReRenderForm()
                }
            }
        )
    }
}

const dataSubPublisherList = ref<any>()
provide('custom_sub_publisher_list', () => dataSubPublisherList.value)
getSubPublisherList([props.id])

const onUpdateForm = (data: any, target: any, v: any) => {
    if (target == 'ignore_lead_statuses') {
        modelValue.value.ignore_lead_statuses = v
    }
}

const createFormEvents = ref()
const updateFormEvents = ref()

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

onUnmounted(() => {
    searchData.value = null
    datatable.value = undefined
})
</script>

<template>
    <SidemenuTabs menu-id="payout_private_deals-tabs" />
    <div class="traffic-endpoint-private-deal">
        <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Private Deal </VButton>
        </DatatableSearch>

        <Datatable
            :columns="SchemeList.columns"
            :uri="`/traffic_endpoint/${props.id}/private_deals/all`"
            :custom="custom"
            :search="searchFunc"
            :header="true"
            @init="(value) => (datatable = value)"
            @changed="(value) => (searchData = value)"
        />

        <ApiForm
            v-if="create"
            :wrapper="VModal"
            size="big"
            title="Add Private Deal"
            :fetch-data="createPrivateDeal"
            :scheme="SchemeNew"
            store-method="post"
            :store-data="`/traffic_endpoint/${props.id}/private_deals/create`"
            :model-value="modelValue"
            @events="(value) => (createFormEvents = value)"
            @update:data="onUpdateForm"
            @store-data="datatable?.fetchData(), (create = false)"
            @close="create = false"
        />

        <ApiForm
            v-if="update"
            :wrapper="VModal"
            :readonly="!is_access_edit"
            :fetch-data="onFetchPrivateDeal"
            size="big"
            title="Update Private Deal"
            :scheme="actualSchemeEdit"
            store-method="put"
            :store-data="`/traffic_endpoint/${props.id}/private_deals/update/${update}`"
            @events="(value) => (updateFormEvents = value)"
            @update:data="onUpdateForm"
            @store-data="datatable?.fetchData(), (update = false)"
            @close="update = false"
        />

        <VModal v-if="logs" open tabs title="Logs" size="big" cancel-label="Close" actions="right" @close="logs = false">
            <template #content>
                <Datatable :columns="SchemeLogList.columns" :uri="`/traffic_endpoint/${props.id}/private_deals/logs/${logs}`" :render-row="RenderLogs" />
            </template>
        </VModal>
    </div>
</template>
<style lang="scss">
.traffic-endpoint-private-deal .dataTable-wrapper .field.column {
    float: left;
    margin-right: 69px;
    margin-bottom: 5px;
}
</style>
