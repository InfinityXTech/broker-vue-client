<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { ref, h, onUnmounted } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { RouterLink } from 'vue-router'
import { isArray, isString } from '@vue/shared'
import VLoader from '/@src/components/base/loader/VLoader.vue'
import { VAccordionItem } from '/@src/components/base/accordion/VAccordion.vue'
import VAccordion from '/@src/components/base/accordion/VAccordion.vue'
import SchemeUserDataList from '/@src/schemes/marketing_investigate/userDataList.json'
import SchemeEventDataList from '/@src/schemes/marketing_investigate/eventDataList.json'
import SchemeUserPostDataList from '/@src/schemes/marketing_investigate/userPostDataList.json'
import Datatable from '/@src/components/partials/tables/Datatable.vue'
import VCardAdvanced from '/@src/components/base/card/VCardAdvanced.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface InvestigateUserProps {
    type: string
    id: string
}
const props = defineProps<InvestigateUserProps>()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Investigate ClickID: ' + props.id)

const userSession = useUserSession()
const is_access_post_data = userSession.roles().is('admin', 'tech_support', 'integration_manager')

const isLoading = ref(true)
const dataValue = ref({
    user_data: [],
    event_data: [],
    redirect_data: [],
    log_data: [],
})

const getName = (data: any) => {
    return data ? (data.name && data.name.length > 0 ? data.name + (data.token ? ' (' + data.token + ')' : '') : data.token ? data.token : '') : ''
}
const custom = {
    AdvertiserName() {
        return (value: string, row: any) => {
            if (row.advertiser_data) {
                return h(RouterLink, { to: { name: 'advertisers-advertiserId', params: { advertiserId: row.advertiser_data._id } }, target: '_blank' }, () =>
                    getName(row.advertiser_data)
                )
            }
            return []
        }
    },
    AffiliateName() {
        return (value: string, row: any) => {
            if (row.affiliate_data) {
                return h(RouterLink, { to: { name: 'affiliates-affiliateId', params: { affiliateId: row.affiliate_data._id } }, target: '_blank' }, () =>
                    getName(row.affiliate_data)
                )
            }
            return []
        }
    },
    CampaignName() {
        return (value: string, row: any) => {
            if (row.advertiser_data && row.campaign_data) {
                return h(
                    RouterLink,
                    {
                        to: {
                            name: 'advertisers-advertiserId-campaign-campaignId-general',
                            params: { advertiserId: row.advertiser_data._id, campaignId: row.campaign_data._id },
                        },
                    },
                    () => getName(row.campaign_data)
                )
            }
            return []
        }
    },
    Location() {
        return (value: string, row: any) => {
            return h('span', row.GeoCountryName + ' - ' + row.UserLanguage)
        }
    },
}

const accordion = ref<VAccordionItem[]>([])

const api = useApi()
let request: Promise<any> = api.get(`/marketing_investigate/${props.type}/${decodeURIComponent(props.id)}`)
request.then((response) => {
    isLoading.value = false
    dataValue.value = response.data

    accordion.value = []
    accordion.value.push({
        title: 'USER DATA',
        content: h(Datatable, { columns: SchemeUserDataList.columns, custom: custom, 'model-value': dataValue.value.user_data }),
    })
    if (is_access_post_data) {
        accordion.value.push({
            title: 'EVENT DATA',
            content:
                dataValue.value.user_data.length > 0 && dataValue.value.event_data
                    ? h(Datatable, { columns: SchemeEventDataList.columns, custom: custom, 'model-value': dataValue.value.event_data })
                    : '',
        })
    }

    if (is_access_post_data && dataValue.value.redirect_data?.length > 0) {
        accordion.value.push({
            title: 'REDIRECT DATA',
            content: h(Datatable, { columns: SchemeUserPostDataList.columns, 'model-value': dataValue.value.redirect_data }),
        })
    }

    accordion.value.push({
        title: 'LOGS',
        content: () => {
            const result: any[] = []
            const campaignIds = Object.keys(dataValue.value.log_data)
            campaignIds.forEach((campaignId: string) => {
                const log_by_campaign = dataValue.value.log_data[campaignId] ?? []
                log_by_campaign.forEach((item: any, index: number) => {
                    let header_ext: string[] = []
                    if (item.advertiser_data && item.campaign_data) {
                        header_ext.push(
                            `Campaign: <a href="/advertisers/${item.advertiser_data._id}/campaign/${item.campaign_data._id}/general" target="_blank"><b>${item.campaign_data.name}</b></a>`
                        )
                    }
                    let header = '<span class="title is-5">Log #' + (index + 1) + '</span>'
                    if (header_ext.length > 0) {
                        header += '&nbsp;&nbsp;&nbsp;' + header_ext.join(' | ')
                    }

                    const color = item?.success ? 'primary' : 'danger'
                    const renderCard = (items: { title: string; content: string | string[] }[]) => {
                        let content_items: any[] = []
                        let content = item.content
                        if (isArray(item.content)) {
                            content =
                                '<ol>' +
                                item.content.reduce(
                                    (previousValue: string, currentValue: string) => '<li>' + previousValue + '</li><li>' + currentValue + '</li>'
                                ) +
                                '</ol>'
                        }
                        content_items.push([
                            h('div', { style: 'float:left;width:200px;', innerHTML: item.title }),
                            h('div', { style: 'margin-left:200px;', innerHTML: content }),
                            h(items.length > 1 ? 'hr' : 'div', { style: 'clear:left' }),
                        ])
                        return h(
                            VCardAdvanced,
                            { headerColor: color },
                            {
                                'header-left': () => [h('div', { style: 'margin-right:10px;color:white;font-size:16px;', innerHTML: header })],
                                content: () => content_items,
                            }
                        )
                    }

                    const card = renderCard(item)
                    result.push(card)
                })
            })
            return result
        },
    })
})

onUnmounted(() => {
    dataValue.value.user_data = []
    dataValue.value.event_data = []
    dataValue.value.redirect_data = []
    dataValue.value.log_data = []
    accordion.value = []
})
</script>

<template>
    <div class="marketing_investigate">
        <VLoader :active="isLoading" size="xl">
            <VAccordion :items="accordion" :open-items="[0]"> </VAccordion>
        </VLoader>
    </div>
</template>
<style lang="scss">
.marketing_investigate {
    .dataTable-wrapper .dataTable-container table.dataTable-table {
        width: 99%;
    }

    .s-card-advanced {
        margin-bottom: 20px;

        .button {
            height: 21px;
        }

        .title,
        .card-head a,
        .card-head {
            color: white;
        }

        a:hover {
            text-decoration: underline;
        }
    }

    .s-card-advanced:last-child {
        margin-bottom: 0;
    }
}
</style>
