<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotifications } from '/@src/stores/notifications'
import { useUserSession } from '/@src/stores/userSession'
import { RouterLink } from 'vue-router'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import Scheme from '/@src/schemes/marketing_gravity/gravityList.json'
import SchemeInline from '/@src/schemes/marketing_gravity/gravityListInline.json'
import SchemeLogData from '/@src/schemes/marketing_gravity/gravityLogsList.json'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { DateTime } from '/@src/utils/datatable/simple-render'
import VButton from '/@src/components/base/button/VButton.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import VTag, { VTagColor } from '/@src/components/base/tags/VTag.vue'

export interface GravityProps {
    type: string
}

const props = defineProps<GravityProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(Scheme.title)

const userSession = useUserSession()
const notifications = useNotifications()
const perm = userSession.permissions('marketing_gravity')
const is_access_reject = userSession.roles().is('admin') || perm.is_custom_allow('btn_reject_deposit')

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
                makeItem('Timestamp', (timestamp ?? '').toString())
            }
            if (row.first_name || row.last_name) {
                makeItem('Full Name', (row.first_name + ' ' + row.last_name).trim())
            }
            if (row.advertiser._id) {
                makeItemComma()
                items.push(h('span', { class: '', innerHTML: '<span class="item-name">Advertiser: </span>' }))
                items.push(h(RouterLink, { to: { name: 'advertisers-advertiserId', params: { advertiserId: row.advertiser._id } } }, () => row.advertiser.name))
            }
            if (row.endpoint?._id) {
                makeItemComma()
                items.push(h('span', { class: '', innerHTML: '<span class="item-name">Affiliate: </span>' }))
                items.push(h(RouterLink, { to: { name: 'affiliates-affiliateId', params: { affiliateId: row.affiliate._id } } }, () => row.affiliate.name))
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
            if (row.funnel_lp) {
                makeItem('Funnel', row.funnel_lp)
            }
            // if (row.hit_the_redirect || true) {
            //     makeItemComma()
            //     items.push(h('span', { class: '', innerHTML: '<span class="item-name">Redirected: </span>' }))
            //     items.push(h(VTag, { color: row.hit_the_redirect ? 'primary' : 'danger' }, () => (row.hit_the_redirect ? 'Active' : 'Inactive')))
            // }
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
    AdvertiserName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'advertisers-advertiserId', params: { advertiserId: row.advertiser._id } } }, () => value)
        }
    },
    AffiliateName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'affiliates-affiliateId', params: { affiliateId: row.affiliate._id } } }, () => value)
        }
    },
    CampaignName() {
        return (value: string, row: any) => {
            return h(
                RouterLink,
                {
                    to: {
                        name: 'advertisers-advertiserId-campaign-campaignId-general',
                        params: { advertiserId: row.advertiser._id, campaignId: row.campaign._id },
                    },
                },
                () => value
            )
        }
    },
    Redirected() {
        return (value: string) => {
            if (value) return h(VTag, { color: 'primary' }, () => 'Active')
            return h(VTag, { color: 'danger' }, () => 'Inactive')
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
    email_ID() {
        return (value: string, row: any) => {
            return [h('small', row._id)]
            // return [h('span', row.email), h('br'), h('small', row._id)]
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
    <div class="marketing_gravity">
        <LocalToolbar>
            <ToolbarItem icon="fas fa-file-alt" title="Show log" @click="showModalLog = true" />
        </LocalToolbar>

        <SidemenuTabs />

        <Datatable :columns="Scheme.columns" :uri="`/marketing_gravity/leads/${props.type}`" :custom="custom" @init="(value) => (datatable = value)" />

        <ApiForm
            v-if="reject"
            :wrapper="VModal"
            title="Reject this FTD"
            :fetch-data="{}"
            :scheme="schemeConfirm('Are you sure you want to reject this FTD?')"
            store-method="get"
            :store-data="`/marketing_gravity/reject/${reject}`"
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
            :store-data="`/marketing_gravity/approve/${approve}`"
            @store-data="onStored"
            @close="approve = false"
        />

        <VModal v-if="showModalLog" open title="Log" size="5xl" cancel-label="Close" actions="right" @close="showModalLog = false">
            <template #content>
                <Datatable :columns="SchemeLogData.columns" uri="/marketing_gravity/log" :render-row="RenderRow" :custom="custom" />
            </template>
        </VModal>
    </div>
</template>

<style lang="scss">
.marketing_gravity {
    .dataTable-table {
        &.table {
            tr {
                td:last-child {
                    width: 120px;
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
