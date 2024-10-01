<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotifications } from '/@src/stores/notifications'
import { useUserSession } from '/@src/stores/userSession'
import { RouterLink } from 'vue-router'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { DatatablePagination } from '/@src/components/partials/tables/Datatable.vue'
import Scheme from '/@src/schemes/gravity/gravityList.json'
import SchemeFinancial from '/@src/schemes/gravity/gravityFinancialList.json'
import SchemeInline from '/@src/schemes/gravity/gravityListInline.json'
import SchemeLogData from '/@src/schemes/gravity/gravityLogsList.json'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { DateTime } from '/@src/utils/datatable/simple-render'
import VButton from '/@src/components/base/button/VButton.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import VTag, { VTagColor } from '/@src/components/base/tags/VTag.vue'
import Warning from '/@src/components/crm/Warning.vue'

export interface GravityProps {
    type: string
}

const props = defineProps<GravityProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(Scheme.title)

const userSession = useUserSession()
const notifications = useNotifications()
const perm = userSession.permissions('gravity')
const is_access_reject = perm.is_custom_allow('btn_reject_deposit')

/*const permission = userSession.permissions('crm')
const is_permission_show_scrub_source = permission.is_custom_allow('show_scrub_source')
const is_permission_show_resync = permission.is_custom_allow('show_resync_source')*/

const datatable = ref<DatatableMethods>()

const reject = ref<string | false>(false)
const approve = ref<string | false>(false)
const onStored = () => {
    reject.value = false
    approve.value = false
    datatable.value?.fetchData()
    notifications.refresh()
}

interface IKeyValue {
    [key: string]: string
}

const riskScaleColors: IKeyValue = { Unknown: 'light', 'Low Risk': 'success', 'Medium Risk': 'warning', 'High Risk': 'danger', 'Very High Risk': 'danger' }

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
    Description() {
        return (value: string, row: any) => {
            let items = []
            const makeItemComma = () => {
                if (items.length > 0) {
                    items.push(h('span', { class: 'comma', innerHTML: ' ' }))
                }
            }
            const makeItem = (name: string, value: string) => {
                makeItemComma()
                items.push(h('span', { class: '', innerHTML: `<span class="item-name">${name}: </span>${value}` }))
            }
            if (row.timestamp) {
                const timestamp = DateTime()(row.timestamp)
                makeItem('Timestamp', timestamp.toString())
            }
            if (row.first_name || row.last_name) {
                makeItem('Full Name', (row.first_name + ' ' + row.last_name).trim())
            }
            if (row.broker._id) {
                makeItemComma()
                items.push(h('span', { class: '', innerHTML: '<span class="item-name">Broker: </span>' }))
                items.push(h(RouterLink, { to: { name: 'brokers-id', params: { id: row.broker._id } } }, () => row.broker.name))
            }
            if (row.endpoint?._id) {
                makeItemComma()
                items.push(h('span', { class: '', innerHTML: '<span class="item-name">Endpoint: </span>' }))
                items.push(h(RouterLink, { to: { name: 'traffic_endpoints-id', params: { id: row.endpoint._id } } }, () => row.endpoint.name))
            }
            if (row.country || row.language) {
                makeItem('Geo', row.country?.toUpperCase() + (row.language ? '_' + row.language?.toLowerCase() : ''))
            }
            // if (row.broker_lead_id) {
            //     makeItem('Broker Lead ID', row.broker_lead_id)
            // }
            if (row._id) {
                makeItem('Lead ID', row._id)
            }
            if (row.integration?.name) {
                makeItem('Integration', row.integration.name)
            }
            if (row.funnel_lp) {
                makeItem('Funnel', row.funnel_lp)
            }
            if (row.hit_the_redirect || true) {
                makeItemComma()
                items.push(h('span', { class: '', innerHTML: '<span class="item-name">Redirected: </span>' }))
                items.push(h(VTag, { color: row.hit_the_redirect ? 'primary' : 'danger' }, () => (row.hit_the_redirect ? 'Active' : 'Inactive')))
            }
            if (row.riskScore) {
                makeItem('Risk Score', row.riskScore)
            }
            if (row.riskScale || true) {
                makeItemComma()
                let riskScale = row.riskScale ?? 'Unknown'
                if (riskScale.length == 0) {
                    riskScale = 'Unknown'
                }
                let color = riskScaleColors[riskScale] ?? 'light'
                items.push(h('span', { class: '', innerHTML: '<span class="item-name">Risk Scale: </span>' }))
                items.push(h(VTag, { color: color }, () => riskScale))
            }
            return items
        }
    },
    BrokerName() {
        /* return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'brokers-id', params: { id: row.broker._id } } }, () => value)
        }*/
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
                    }
                }
            }
            return items
        }
    },
    EndpointName() {
        /*return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'traffic_endpoints-id', params: { id: row.endpoint._id } } }, () => value)
        }*/
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
                    }
                }

                /*let items2 = []
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
                }*/
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

            // if (value) return h(VTag, { color: 'primary' }, () => 'Active')
            // return h(VTag, { color: 'danger' }, () => 'Inactive')

            return items
        }
    },
    DepositStatus() {
        return (value: string) => {
            return h('div', { innerHTML: value ? 'Approved' : 'Rejected' })
        }
    },
    riskScale() {
        return (value: string, row: any) => {
            const colors: { [key: string]: string } = { 'Low Risk': 'success', 'Medium Risk': 'warning', 'High Risk': 'danger', 'Very High Risk': 'danger' }
            if (!value) value = 'Unknown'
            const color = colors[value] ?? 'light'
            //return h(VTag, { color: color as VTagColor }, () => value)
            return [h(VTag, { color: color as VTagColor }, () => value), h('br'), h('small', row.riskScore)]
        }
    },
    depositGravityFinRiskReasons() {
        return (value: any) => {
            let s = ''
            value?.forEach((item: string) => (s += `<li>${item}</li>`))
            return h('ol', { innerHTML: s })
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
            return h('span', row.country + (row.language?.length > 0 ? ' - ' + row.language : ''))
        }
    },
    Actions() {
        return (value: string, row: any) => {
            //console.log(row)

            return [
                //Approve
                h(
                    VButton,
                    {
                        icon: 'far fa-edit',
                        fullwidth: true,
                        color: 'primary',
                        onClick: () => (console.log(row._id, 'Approve'), (approve.value = row._id)),
                    },
                    () => 'Approve'
                ),
                ' ',
                //Reject
                is_access_reject
                    ? h(
                          VButton,
                          {
                              icon: 'far fa-edit',
                              fullwidth: true,
                              color: 'danger',
                              onClick: () => (console.log(row._id, 'reject'), (reject.value = row._id)),
                          },
                          () => 'Reject'
                      )
                    : '',
            ]
        }
    },
    ActionsIcons() {
        return (value: string, row: any) => {
            //console.log(row)

            return [
                //Approve
                h(VIconButton, {
                    icon: 'fa fa-check',
                    color: 'primary',
                    title: 'Approve',
                    onClick: () => (console.log(row._id, 'Approve'), (approve.value = row._id)),
                }),
                ' ',
                //Reject
                is_access_reject
                    ? h(
                          VIconButton,
                          {
                              icon: 'fas fa-ban',
                              color: 'danger',
                              title: 'Reject',
                              onClick: () => (console.log(row._id, 'reject'), (reject.value = row._id)),
                          },
                          () => 'Reject'
                      )
                    : '',
            ]
        }
    },
}

const showModalLog = ref(false)
const paginationLog = ref<DatatablePagination>({ page: 1, count_in_page: 10, total_items: 0 })

const RenderRow = (row: any): Record<string, any> => {
    return {
        class: [row.deposit_reject ? 'gravity-bg-approved' : 'gravity-bg-rejected'],
    }
}

onUnmounted(() => {
    datatable.value = undefined
})
</script>

<template>
    <div class="gravity">
        <LocalToolbar>
            <ToolbarItem icon="fas fa-file-alt" title="Show log" @click="showModalLog = true" />
        </LocalToolbar>

        <SidemenuTabs />

        <Datatable
            :columns="props.type == 'financial' ? SchemeFinancial.columns : Scheme.columns"
            :uri="`/gravity/leads/${props.type}`"
            :custom="custom"
            @init="(value) => (datatable = value)"
        />

        <ApiForm
            v-if="reject"
            :wrapper="VModal"
            title="Reject this FTD"
            :fetch-data="{}"
            :scheme="schemeConfirm('Are you sure you want to reject this FTD?')"
            store-method="get"
            :store-data="`/gravity/reject/${reject}`"
            @store-data="onStored"
            @close="reject = false"
        />

        <ApiForm
            v-if="approve"
            :wrapper="VModal"
            title="Approve this FTD"
            :fetch-data="{}"
            :scheme="schemeConfirm('Are you sure you want to approve this FTD?')"
            store-method="get"
            :store-data="`/gravity/approve/${approve}`"
            @store-data="onStored"
            @close="approve = false"
        />

        <VModal v-if="showModalLog" open title="Log" size="5xl" cancel-label="Close" actions="right" @close="showModalLog = false">
            <template #content>
                <Datatable
                    :columns="SchemeLogData.columns"
                    uri="/gravity/post_log"
                    method="post"
                    :pagination="paginationLog"
                    :render-row="RenderRow"
                    :custom="custom"
                />
            </template>
        </VModal>
    </div>
</template>

<style lang="scss">
.gravity {
    .dataTable-table {
        &.table {
            tr {
                td:last-child {
                    width: 120px;
                }
            }

            td[data-key='depositGravityFinRiskReasons'] {
                ol {
                    margin-left: 5px;
                }
            }
        }
    }

    .item-name {
        color: #393030;
    }

    .comma {
        margin-right: 10px;
    }

    .is-dark {
        .item-name {
            color: #e0e0e0;
        }
    }
}

.gravity-bg-approved {
    background-color: var(--success);

    * {
        color: var(--white) !important;
    }
}

.gravity-bg-rejected {
    background-color: var(--danger);

    * {
        color: var(--white) !important;
    }
}
</style>
