<script setup lang="ts">
import { reactive, watch, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink } from 'vue-router'
import { useNotyf } from '/@src/composable/useNotyf'
import { h, provide, ref, Ref } from 'vue'

import { DatatableColumn } from '/@src/components/partials/tables/Datatable.vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'

import CreateAlertScheme from '/@src/schemes/crm/createAlert.json'

import SchemeFormLead from '/@src/schemes/crm/crmFormLead.json'
import SchemeFormFTD from '/@src/schemes/crm/crmFormFTD.json'
import SchemeFormMismatch from '/@src/schemes/crm/crmFormMismatch.json'

import SchemeReSyncLeads from '/@src/schemes/crm/crmReSyncLeads.json'
import SchemeReSyncLeadsList from '/@src/schemes/crm/crmReSyncLeadsList.json'

import SchemeListLead from '/@src/schemes/crm/crmListLead.json'
import SchemeListMismatch from '/@src/schemes/crm/crmListMismatch.json'
import SchemeListFTD from '/@src/schemes/crm/crmListFTD.json'

import SchemeCRG from '/@src/schemes/crm/crmFormCRG.json'
import SchemeChangeCPL from '/@src/schemes/crm/crmFormCPL.json'
import SchemeCRGFTD from '/@src/schemes/crm/crmFormCRGFTD.json'
import SchemeFireFTD from '/@src/schemes/crm/crmFormFireFTD.json'

import SchemeRevenueCost from '/@src/schemes/crm/crmFormRevenueCost.json'
import SchemeStatusLeadHistory from '/@src/schemes/crm/statusLeadHistory.json'

import { schemeConfirm } from '/@src/components/partials/Form.vue'

// import VButton from '/@src/components/base/button/VButton.vue'
import ApiCallButton from '/@src/components/partials/forms/ApiCallButton.vue'
import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import VTag, { VTagColor } from '/@src/components/base/tags/VTag.vue'
import Warning from '/@src/components/crm/Warning.vue'
import { showContextMenu } from '/@src/components/partials/dropdowns/ContextMenu.vue'
import Multiselect from '@vueform/multiselect'
import { useUserSession } from '/@src/stores/userSession'
import { customVarDictionary } from '/@src/utils/dictionary'
import { useDownload } from '/@src/composable/useDownload'

export interface CRMProps {
    type: string
}

type TypeData = {
    data: Ref<any[]>
    formSheme: any
    sheme: any
    datatable: DatatableMethods | undefined
    reSync: any
    selectedltems: Ref<string[]>
}

const props = defineProps<CRMProps>()

const download = useDownload()
const viewWrapper = useViewWrapper()
watch(props, () => viewWrapper.setPageTitle(dataValue[props.type].formSheme.title))

const notif = useNotyf()
const userSession = useUserSession()
const permission = userSession.permissions('crm')
const is_permission_resync = permission.is_custom_allow('resync')
const is_permission_mark_test = permission.is_custom_allow('manage_test')
const is_permission_mark_ftd = permission.is_custom_allow('manage_ftd')
const is_permission_mark_fire_ftd = permission.is_custom_allow('manage_fire_ftd')
const is_permission_mark_crg = permission.is_custom_allow('manage_crg')
const is_permission_change_payout_cpl = permission.is_custom_allow('change_payout_cpl')
const is_permission_change_revenue_cost = permission.is_custom_allow('change_revenue_cost')
const is_permission_change_crg_deal_ftd = permission.is_custom_allow('change_crg_deal_ftd')
const is_permission_test_lead_bg = permission.is_custom_allow('test_lead_bg')

const is_permission_show_broker_statuses = permission.is_custom_allow('show_broker_statuses')
const is_permission_lead_email = permission.is_custom_allow('lead_email')
// const is_permission_show_crg_deal_id = permission.is_custom_allow('show_crg_deal_id')
const is_permission_show_scrub_source = permission.is_custom_allow('show_scrub_source')
const is_permission_show_resync = permission.is_custom_allow('show_resync_source')
// const is_permission_mismatch_timestamp = permission.is_custom_allow('mismatch_timestamp')

// const is_role_admin = userSession.roles().is('admin')
const is_role_admin_or_support = userSession.roles().is('tech_support', 'admin', 'integration_manager')

const m_permission = userSession.permissions('*')
const is_permission_show_crg_deal_id = m_permission.is_allow('show_crg_deal_id')

const isLoading = ref<boolean>(false)
const formActionEvents = (action: string) => {
    switch (action) {
        case 'before-store': {
            isLoading.value = true
            dataValue[props.type].data.value = []
            break
        }
        case 'after-store': {
            isLoading.value = false
            break
        }
    }
}

const formEvents = ref()

const onStoredLeads = (data: any) => {
    dataValue[props.type].data.value = data
}

const onStored = async (value: any) => {
    if (value && (testlead.value || fireftd.value)) {
        await formEvents?.value?.onStoreSubmit()
    }
    notif.success('Updated Successfully')
}

const onFetch = () => {
    // dataValue[props.type].data.value = []
}

const initial = {
    timeframe: DefaultTimeRange,
}

const CRGStatus = (crg_deal: boolean, crg_percentage_id: string) => {
    let color = ''
    let text = ''
    if (crg_deal) {
        color = 'success'
        text = 'CRG'
    } else {
        if (crg_percentage_id.length > 0) {
            color = 'danger'
            text = 'Removed CRG'
        } else {
            color = 'purple'
            text = 'No CRG'
        }
    }

    return h(VTag, { color: color, size: 'tiny' }, () => text)
}

const custom = {
    Id() {
        return (value: string, row: any, column: DatatableColumn, index: number) => {
            return h('span', { innerHTML: ++index })
        }
    },
    BrokerName() {
        return (value: string, row: any) => {
            let items = []
            if (row.broker && row.broker._id && row.broker._id.length > 0) {
                items.push(h(RouterLink, { to: { name: 'brokers-id', params: { id: row.broker._id } } }, () => value))
                if (row.test_lead == 0) {
                    items.push(h('br'))
                    if (row.broker_cpl) {
                        items.push(h(VTag, { color: row.revenue == 0 ? 'warning' : 'success', size: 'tiny' }, () => 'CPL'))
                    } else {
                        items.push(CRGStatus(row.broker_crg_deal, row.broker_crg_percentage_id))
                        if (row.broker_crg_deal && row.broker_crg_ignored_by_status) {
                            items.push(h(VTag, { color: 'warning', size: 'tiny' }, () => '% Invalid'))
                        }
                        if (is_permission_show_crg_deal_id && row.broker_crg_deal) {
                            items.push(h('small', row.broker_crg_percentage_id))
                        }
                    }
                }
            }
            return items
        }
    },
    EndpointName() {
        return (value: string, row: any) => {
            let items = []
            if (row.endpoint && row.endpoint._id && row.endpoint._id.length > 0) {
                items.push(h(RouterLink, { to: { name: 'traffic_endpoints-id', params: { id: row.endpoint._id } } }, () => value))
                if (row.test_lead == 0 && row.match_with_broker == 1) {
                    items.push(h('br'))
                    if (row.isCPL) {
                        items.push(h(VTag, { color: row.cost == 0 ? 'warning' : 'success', size: 'tiny' }, () => 'CPL'))
                    } else {
                        items.push(CRGStatus(row.crg_deal, row.crg_percentage_id))
                        if (row.crg_deal && row.crg_ignored_by_status) {
                            items.push(h(VTag, { color: 'warning', size: 'tiny' }, () => '% Invalid'))
                        }
                        if (is_permission_show_crg_deal_id && row.crg_deal) {
                            //items.push(h('br'))
                            items.push(h('small', row.crg_percentage_id))
                        }
                    }
                }

                let items2 = []
                if (is_permission_show_scrub_source) {
                    if (row.scrubSourceId?.length > 0) {
                        items2.push(
                            h(
                                VTag,
                                { style: [items2.length > 0 && { 'margin-left': '5px' }], color: 'purple', size: 'tiny' },
                                () => 'ScrubSource: ' + row.scrubSource
                            )
                        )
                    }

                    if (row.scrubFrom?.length > 0) {
                        items2.push(
                            h(
                                VTag,
                                { style: [items2.length > 0 && { 'margin-left': '5px' }], color: 'purple', size: 'tiny' },
                                () => 'Scrub' // + row.scrubFrom
                            )
                        )
                    }

                    // if (row.reSyncFrom?.length > 0) {
                    //     items2.push(
                    //         h(
                    //             VTag,
                    //             { style: [items2.length > 0 && { 'margin-left': '5px' }], color: 'purple', size: 'tiny' },
                    //             () => 'ReSyncFrom: ' + row.reSyncFrom
                    //         )
                    //     )
                    // }

                    if (items2.length > 0) {
                        items.push(h('br'))
                        items.push(...items2)
                    }
                }

                if (is_permission_show_resync && row.reSyncFromTrafficEndpoint?.token) {
                    if (items2.length == 0) {
                        items.push(h('br'))
                    }
                    items.push(
                        h(
                            VTag,
                            { style: [{ 'margin-left': '5px' }], color: 'purple', size: 'tiny' },
                            () => 'ReSyncFrom: ' + row.reSyncFromTrafficEndpoint.token
                        )
                    )
                }
            }
            return items
        }
    },
    Redirected() {
        return (value: string, row: any) => {
            let items = []
            let errors = []

            if (row.real_ip?.length > 0 && row.ip != row.real_ip) {
                errors.push('Income IP and Real IP is different')
            }

            // row?.ip != row?.real_ip &&  && row.country != row.real_country
            // if (row.userCountryMatch == false) {
            if ((row.blockReasons ?? []).length > 0) {
                items.push(h(VTag, { color: 'danger' }, () => 'Blocked'))
                row.blockReasons.forEach((reason: string) => errors.push(reason))
            } else if (value) {
                items.push(h(VTag, { color: 'primary' }, () => 'Active'))
            } else {
                items.push(h(VTag, { color: 'danger' }, () => 'Inactive'))
            }

            if (errors.length > 0) {
                items.push(h(Warning, { errors: errors }))
            }

            return items
        }
    },
    Status() {
        return (value: string, row: any) => {
            let items = [h('div', { style: 'text-align: center;' + (row.status_style ?? ''), innerHTML: value })]
            if (row.enable_reapprove) {
                items.push(
                    h(
                        ApiCallButton,
                        {
                            color: 'danger',
                            method: 'put',
                            confirm: 'Are you sure you want to reApprove this lead?',
                            uri: '/leads/approve/' + row._id,
                            onStoreData: async () => {
                                await formEvents?.value?.onStoreSubmit()
                            },
                        },
                        () => 'Re Approve'
                    )
                )
            }
            return items
        }
    },
    StatusHistory() {
        return (value: string, row: any) => {
            const items = []

            if (row.broker_status) {
                items.push(h('span', row.broker_status))
            } /*else {
                items.push(h('br'))
            }*/

            items.push(
                h(
                    ApiCallButton,
                    {
                        // icon: 'far fa-edit',
                        color: 'primary',
                        method: 'get',
                        tag: 'a',
                        uri: '/crm/status_lead_history/' + row._id,
                        onStoreData: StoreDataLog,
                    },
                    () => 'Show History'
                )
            )
            return items
        }
    },
    email_ID() {
        return (value: string, row: any) => {
            return [
                h('span', row.email),
                h('br'),
                h(
                    'small',
                    h('a', {
                        href: '/investigate/user/' + row._id,
                        target: '_blank',
                        innerHTML: row._id,
                    })
                ), // h('small', row._id)
            ]
        }
    },
    LeadName() {
        return (value: string, row: any) => {
            return [h('span', row.first_name), h('br'), h('span', row.last_name)]
        }
    },
    Location() {
        return (value: string, row: any) => {
            return h('span', row.country + ' - ' + row.language)
        }
    },
    riskScale() {
        return (value: string, row: any) => {
            const colors: { [key: string]: string } = { 'Low Risk': 'success', 'Medium Risk': 'warning', 'High Risk': 'danger', 'Very High Risk': 'danger' }
            if (!value) value = 'Unknown'
            const color = colors[value] ?? 'light'
            let items = [h(VTag, { color: color as VTagColor }, () => value), h('br'), h('small', row.riskScore)]

            if (row.depositor && row.riskFactorScore > 0) {
                items.push(h('br'))
                items.push(h('small', 'factor score: ' + row.riskFactorScore))
            }

            let errors = []
            if (row.depositor && row.riskFactorScoreData?.ip_address) {
                if (row.riskFactorScoreData?.ip_address?.is_anonymous) {
                    errors.push('Anonymous')
                }
                if (row.riskFactorScoreData?.ip_address?.is_anonymous_vpn) {
                    errors.push('Anonymous VPN')
                }
                if (row.riskFactorScoreData?.ip_address?.is_anonymous_proxy) {
                    errors.push('Anonymous Proxy')
                }
                if (row.riskFactorScoreData?.ip_address?.is_public_proxy) {
                    errors.push('Public Proxy')
                }
                if (row.riskFactorScoreData?.ip_address?.is_residential_proxy) {
                    errors.push('Residential Proxy')
                }
                if (row.riskFactorScoreData?.ip_address?.is_legitimate_proxy) {
                    errors.push('Legitimate Proxy')
                }

                if (errors.length > 0) {
                    items.push(h(Warning, { errors: errors }))
                }
            }
            return items
        }
    },
}

const modalHistory = ref(false)
const modalHistoryData = ref([])

const StoreDataLog = (data: any) => {
    modalHistory.value = true
    modalHistoryData.value = data
}

const contextMenuLeadId = ref<string>('')
const testlead = ref<boolean>(false)
const createAlert = ref<boolean>(false)
const markcrglead = ref<boolean>(false)
const change_payout_cpl_lead = ref<boolean>(false)

const fireftd = ref<boolean>(false)
const updatepayout = ref<boolean>(false)

const changecrgdealftd = ref<boolean>(false)

const RenderRow = (row: any): Record<string, any> => {
    return {
        class: [
            props.type,
            is_permission_test_lead_bg ? 'allow-test-bg' : '',
            row.depositor && 'bg-ftd',
            row.fakeDepositor && 'bg-fake-ftd',
            row.match_with_broker == 0 && 'bg-mismatch',
            row.test_lead == 1 && 'bg-test_lead',
        ],
        onContextmenu: (ev: MouseEvent) => {
            contextMenuLeadId.value = row._id
            ev.preventDefault()

            let items = [
                {
                    icon: 'uit uit-eye',
                    label: 'View User Log',
                    onClick: () => {
                        window.open('/investigate/user/' + row._id, '_blank')
                        //router.push({ name: 'brokers-id', params: { id: row._id } })
                    },
                },
                {
                    icon: 'uit uit-jackhammer',
                    label: 'View Endpoint',
                    onClick: () => {
                        window.open('/traffic_endpoints/' + row.endpoint._id, '_blank')
                        //router.push({ name: 'traffic_endpoints-id', params: { id: row.endpoint._id } })
                    },
                },
                /*{
                        label: 'A submenu',
                        children: [{ label: 'Item1' }, { label: 'Item2' }, { label: 'Item3' }],
                    },
                    {
                        label: 'Id: ' + row._id,
                    },*/
            ]

            if (row.match_with_broker) {
                items.push({
                    icon: 'uit uit-channel',
                    label: 'View Broker',
                    onClick: () => {
                        window.open('/brokers/' + row.broker._id, '_blank')
                        //router.push({ name: 'brokers-id', params: { id: row.broker._id } })
                    },
                })
                if (is_role_admin_or_support) {
                    if (is_permission_mark_test) {
                        items.push({
                            icon: 'uit uit-trash',
                            label: 'Mark Lead as Test',
                            onClick: () => {
                                testlead.value = true
                            },
                        })
                    }

                    if (1 == 1) {
                        // some permission?
                        items.push({
                            icon: 'lnil lnil-alarm',
                            label: 'Create Alert',
                            onClick: () => {
                                createAlert.value = true
                            },
                        })
                    }

                    if (is_permission_change_payout_cpl && (row.broker_cpl == true || row.isCPL == true)) {
                        items.push({
                            icon: 'uit uit-grid',
                            label: 'Change Payout CPL',
                            onClick: () => {
                                change_payout_cpl_lead.value = true
                            },
                        })
                    }

                    if (is_permission_mark_crg && (row.broker_cpl == false || row.isCPL == false)) {
                        items.push({
                            icon: 'uit uit-gold',
                            label: 'Mark Lead as CRG',
                            onClick: () => {
                                markcrglead.value = true
                            },
                        })
                    }
                    if (is_permission_mark_ftd) {
                        if (!row.depositor && props.type != 'ftd') {
                            items.push({
                                icon: 'uit uit-fire',
                                label: 'Mark Lead as FTD',
                                onClick: () => {
                                    fireftd.value = true
                                },
                            })
                        }
                    }
                    if ((row.depositor || row.fakeDepositor) && props.type === 'ftd') {
                        if (is_permission_change_revenue_cost) {
                            items.push({
                                icon: 'fas fa-hand-pointer',
                                label: 'Update deposit Revenue/Cost',
                                onClick: () => {
                                    updatepayout.value = true
                                },
                            })
                        }
                        if (is_permission_change_crg_deal_ftd && (row.crg_deal || row.broker_crg_deal)) {
                            items.push({
                                icon: 'fas fa-hand-pointer',
                                label: 'Change CRG deal for FTD',
                                onClick: () => {
                                    changecrgdealftd.value = true
                                },
                            })
                        }
                    }
                }
            }

            showContextMenu({
                x: ev.pageX,
                y: ev.pageY,
                items: items,
            })
        },
    }
}

const reSync = function () {
    interface IKeyValue {
        [key: string]: string
    }
    interface ILeaData {
        leads: string[]
        integrations: IKeyValue
    }
    interface ILeaData {
        leads: string[]
        integrations: IKeyValue
    }
    interface ILeadStoreData {
        task_lps: string
        endpoint: string
        interval: number | null
        integrations: IKeyValue
    }

    const isActive = ref<boolean>(false)
    const leadsData = ref<ILeaData>({
        leads: [],
        integrations: {},
    })

    const leadsStoreDataInit = (): ILeadStoreData => {
        return {
            task_lps: '1',
            endpoint: '',
            interval: null,
            integrations: {},
        }
    }
    const leadsStoreData = reactive(leadsStoreDataInit())

    const custom = {
        BrokerIntegration() {
            return (value: string, row: any) => {
                const selected = null //Object.keys(leadsData.value.integrations)[0]
                return h(Multiselect, {
                    modelValue: selected,
                    options: leadsData.value.integrations,
                    searchable: true,
                    canClear: false,
                    canDeselect: false,
                    allowEmpty: false,
                    mode: 'single',
                    key: row._id,
                    createTag: false,
                    style: 'width: 300px',
                    'onUpdate:modelValue': (id: any) => onIntegrationSelect(row._id, id),
                })
            }
        },
    }

    const onFetchData = async (data: any) => {
        leadsData.value = data
        // const integration = Object.keys(data.integrations)[0]
        // for (var n in data.leads) {
        //     const id = data.leads[n]['_id']
        //     leadsStoreData.integrations[id] = integration
        // }
        isActive.value = true
    }

    const onIntegrationSelect = (id: string, value: string) => {
        leadsStoreData.integrations[id] = value
    }

    const onStore = async () => {
        isActive.value = false
        dataValue[props.type].selectedltems.value = []
        // dataValue[props.type].datatable?.fetchData()
        formEvents?.value?.onStoreSubmit()
        notif.success('Updated Successfully')
    }

    return {
        isActive,
        leadsData,
        leadsStoreData,
        leadsStoreDataInit,
        custom,
        onFetchData,
        onStore,
        onIntegrationSelect,
    }
}

const dataValue: { [key: string]: TypeData } = {
    mismatch: {
        data: ref<any[]>([]),
        formSheme: SchemeFormMismatch,
        sheme: SchemeListMismatch.columns,
        datatable: undefined,
        reSync: reSync(),
        selectedltems: ref<any[]>([]),
    },
    leads: {
        data: ref([]),
        formSheme: SchemeFormLead,
        sheme: SchemeListLead.columns,
        datatable: undefined,
        reSync: reSync(),
        selectedltems: ref<any[]>([]),
    },
    ftd: {
        data: ref([]),
        formSheme: SchemeFormFTD,
        sheme: SchemeListFTD.columns,
        datatable: undefined,
        reSync: reSync(),
        selectedltems: ref<any[]>([]),
    },
}

for (let t in dataValue) {
    for (let column_name in dataValue[t].sheme) {
        if (column_name == 'email' && !is_permission_lead_email) {
            delete dataValue[t].sheme[column_name]
        }
        if (column_name == 'broker_status' && !is_permission_show_broker_statuses) {
            delete dataValue[t].sheme[column_name]
        }
        // if (!is_permission_mismatch_timestamp && column_name == 'Timestamp') {
        //     delete dataValue[t].sheme[column_name]
        // }

        // if (column_name == 'select_resync' && !is_permission_resync) {
        //     delete dataValue[t].sheme[column_name]
        // }
    }
}

if (!is_permission_show_broker_statuses) {
    for (let column_name in SchemeStatusLeadHistory.columns) {
        if (column_name == 'broker_status') {
            delete SchemeStatusLeadHistory.columns[column_name]
        }
    }
}

const dataMarkCRGValue = customVarDictionary()
let dataMarkCRG: any = null
provide('custom_broker_crg_percentage_id', () =>
    dataMarkCRGValue.wait().then((data: any) => {
        crg_deal_change.value = false
        broker_crg_deal_change.value = false
        dataMarkCRG = { ...data }
        return data.broker_deals
    })
)
provide('custom_broker_crg_payout', () => dataMarkCRGValue.wait().then((data: any) => data.broker_payouts))
provide('custom_crg_percentage_id', () => dataMarkCRGValue.wait().then((data: any) => data.deals))
provide('custom_crg_payout', () => dataMarkCRGValue.wait().then((data: any) => data.payouts))

const crg_deal_change = ref<boolean>(false)
provide('change_crg_function', (value: boolean) => {
    crg_deal_change.value = (dataMarkCRG?.crg_percentage_id && !value) || (!dataMarkCRG?.crg_percentage_id && value)
})
provide('reason_change_crg_conditional', (): boolean => {
    return crg_deal_change.value
})
const broker_crg_deal_change = ref<boolean>(false)
provide('broker_change_crg_function', (value: boolean) => {
    broker_crg_deal_change.value = (dataMarkCRG?.broker_crg_percentage_id && !value) || (!dataMarkCRG?.broker_crg_percentage_id && value)
})
provide('broker_reason_change_crg_conditional', (): boolean => {
    return broker_crg_deal_change.value
})

onUnmounted(() => {
    for (let n in dataValue) {
        dataValue[n].data.value = []
        dataValue[n].datatable = undefined
    }
})
</script>

<template>
    <div :class="['page-crm', `crm-${props.type}`]">
        <ApiForm
            v-if="props.type === 'mismatch' || props.type === 'ftd' || props.type === 'leads'"
            :title="dataValue[type].formSheme.title"
            :wrapper="PageToolbarButtonDown"
            :scheme="dataValue[type].formSheme"
            :fetch-data="initial"
            store-label="Search"
            store-method="post"
            :store-data="`/crm/${props.type}`"
            :events="formActionEvents"
            @store-data="onStoredLeads"
            @fetch-data="onFetch"
            @events="(value) => (formEvents = value)"
        />
        <br />

        <ApiCallButton
            v-if="is_permission_resync && dataValue[props.type].selectedltems.value.length > 0"
            color="danger"
            method="post"
            mode="single"
            :uri="'/crm/resync/get'"
            :data="{ ids: dataValue[props.type].selectedltems.value }"
            @store-data="dataValue[props.type].reSync.onFetchData"
        >
            Re Sync Leads </ApiCallButton
        >&nbsp;

        <VButton
            v-if="dataValue[props.type].selectedltems.value.length > 0"
            color="primary"
            icon="feather:download"
            role="menuitem"
            raised
            elevated
            @click="download.post('/crm/download_recalculation_changes_log', { ids: dataValue[props.type].selectedltems.value })"
            >Download Recalculation Log</VButton
        >

        <ApiForm
            v-if="dataValue[props.type].reSync.isActive.value"
            :title="'ReSyncLeads'"
            :wrapper="VModal"
            :size="'large'"
            :scheme="SchemeReSyncLeads"
            :model-value="dataValue[props.type].reSync.leadsStoreData"
            :fetch-data="dataValue[props.type].reSync.leadsStoreDataInit"
            store-label="ReSync"
            store-method="post"
            :store-data="'/crm/resync'"
            @store-data="dataValue[props.type].reSync.onStore"
            @close="dataValue[props.type].reSync.isActive.value = false"
        >
            <template #after-form>
                <Datatable
                    :columns="SchemeReSyncLeadsList.columns"
                    :model-value="dataValue[props.type].reSync.leadsData.value.leads"
                    :custom="dataValue[props.type].reSync.custom"
                />
            </template>
        </ApiForm>
        <br />
        <VLoader :active="isLoading" size="xl">
            <Datatable
                :select-mode="true"
                :columns="dataValue[props.type].sheme"
                :model-value="dataValue[props.type].data?.value"
                :custom="custom"
                :classes="[props.type]"
                :render-row="RenderRow"
                :show-only-screen-data="true"
                @changed="dataValue[props.type].selectedltems.value = []"
                @selected="(items) => (dataValue[props.type].selectedltems.value = items)"
                @init="(value) => (dataValue[props.type].datatable = value)"
            />
        </VLoader>

        <VModal :open="modalHistory" title="Lead Status History" size="big" cancel-label="Close" actions="right" @close="modalHistory = false">
            <template #content>
                <Datatable :columns="SchemeStatusLeadHistory.columns" :model-value="modalHistoryData" :custom="custom" />
            </template>
        </VModal>

        <ApiForm
            v-if="testlead"
            :wrapper="VModal"
            loader-size="small"
            title="Mark lead as Test"
            :fetch-data="{}"
            :scheme="schemeConfirm('Are you sure you want to mark this lead as Test?')"
            store-method="put"
            :store-data="`/leads/test_lead/${contextMenuLeadId}`"
            store-label="Confirm"
            @store-data="
                (value) => {
                    onStored(value)
                    testlead = false
                }
            "
            @close="testlead = false"
        />

        <ApiForm
            v-if="createAlert"
            :wrapper="VModal"
            title="Create Alert"
            :fetch-data="{}"
            :scheme="CreateAlertScheme"
            store-method="post"
            :store-data="`/leads/alerts/${contextMenuLeadId}`"
            store-label="Create"
            @store-data="
                (value:any) => {
                    onStored(value)
                    createAlert = false
                }
            "
            @close="createAlert = false"
        />

        <ApiForm
            v-if="fireftd"
            :wrapper="VModal"
            loader-size="small"
            title="Fire FTD"
            :fetch-data="{}"
            :scheme="is_permission_mark_fire_ftd ? SchemeFireFTD : schemeConfirm('Are you sure you want to fire this lead as FTD?')"
            :gauth="true"
            store-method="put"
            :store-data="`/leads/fire_ftd/${contextMenuLeadId}`"
            store-label="Fire"
            @store-data="
                (value) => {
                    onStored(value)
                    fireftd = false
                }
            "
            @close="fireftd = false"
        />

        <ApiForm
            v-if="markcrglead"
            :wrapper="VModal"
            loader-size="small"
            title="Change CRG deal"
            size="large"
            :fetch-data="`/leads/${contextMenuLeadId}/crg_lead`"
            :scheme="SchemeCRG"
            store-method="post"
            :store-data="`/leads/mark_crg_lead/${contextMenuLeadId}`"
            store-label="Submit"
            @fetch-data="dataMarkCRGValue.set"
            @store-data="
                (value) => {
                    onStored(value)
                    markcrglead = false
                }
            "
            @close="markcrglead = false"
        />

        <ApiForm
            v-if="change_payout_cpl_lead"
            :wrapper="VModal"
            loader-size="small"
            title="Change Payout CPL"
            size="large"
            :fetch-data="`/leads/${contextMenuLeadId}/change_payout_cpl_lead`"
            :scheme="SchemeChangeCPL"
            store-method="post"
            :store-data="`/leads/${contextMenuLeadId}/change_payout_cpl_lead`"
            store-label="Submit"
            @store-data="
                (value) => {
                    onStored(value)
                    change_payout_cpl_lead = false
                }
            "
            @close="change_payout_cpl_lead = false"
        />

        <ApiForm
            v-if="changecrgdealftd"
            :wrapper="VModal"
            loader-size="small"
            title="Change CRG deal only for FTD"
            :fetch-data="`/leads/${contextMenuLeadId}/crg_ftd`"
            :scheme="SchemeCRGFTD"
            store-method="post"
            :store-data="`/leads/change_crg_ftd/${contextMenuLeadId}`"
            store-label="Submit"
            @fetch-data="dataMarkCRGValue.set"
            @store-data="
                (value) => {
                    onStored(value)
                    changecrgdealftd = false
                }
            "
            @close="changecrgdealftd = false"
        />

        <ApiForm
            v-if="updatepayout"
            :wrapper="VModal"
            loader-size="small"
            title="Update Deposit Revenue / Cost"
            :scheme="SchemeRevenueCost"
            fetch-method="get"
            :fetch-data="`/leads/${contextMenuLeadId}/payout`"
            store-method="post"
            :store-data="`/leads/update/${contextMenuLeadId}/payout`"
            store-label="Submit"
            @store-data="
                (value) => {
                    onStored(value)
                    updatepayout = false
                }
            "
            @close="updatepayout = false"
        />
    </div>
</template>
<style lang="scss">
.page-crm {
    .select-all {
        position: absolute;
        top: 20px;
        left: 9px;
    }

    .list-flex-toolbar {
        .columns {
            .column {
                padding-top: 2px;
                padding-bottom: 1px;
            }
        }
    }

    .dataTable-table.table {
        td[data-key='broker_status'] .api-button div {
            //padding-top: 0;
            padding: 0;
            float: none;
            clear: both;

            * {
                //padding-top: 0;
                padding: 0;
                font-size: 11px;
            }
        }

        .mismatch.bg-mismatch td {
            background-color: var(--danger);
            color: var(--white);

            * {
                color: var(--white);
            }
        }

        .leads.bg-ftd {
            background-color: var(--info);

            td:not([data-key='riskScale'], [data-key='hit_the_redirect']) {
                color: var(--white);

                * {
                    color: var(--white);
                }
            }
        }

        tr.bg-ftd {
            td[data-key='status'] .api-button {
                border: 0;
            }
        }

        .leads.bg-fake-ftd:not(.bg-test_lead) td {
            background-color: #0a6183;
            color: var(--white);
        }

        .allow-test-bg.leads.bg-test_lead,
        .allow-test-bg.ftd.bg-test_lead {
            background-color: var(--warning);

            td:not([data-key='riskScale'], [data-key='hit_the_redirect']) {
                color: var(--white);

                * {
                    color: var(--white);
                }
            }
        }
    }
}
.v-modal .modal-content {
    min-height: 80% !important;
}
</style>
