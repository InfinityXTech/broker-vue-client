<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { ref, h, onUnmounted } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { RouterLink } from 'vue-router'
import { isArray, isString } from '@vue/shared'
import VLoader from '/@src/components/base/loader/VLoader.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import { VAccordionItem } from '/@src/components/base/accordion/VAccordion.vue'
import VAccordion from '/@src/components/base/accordion/VAccordion.vue'
import SchemeUserDataList from '/@src/schemes/investigate/userDataList.json'
import SchemeUserPostDataList from '/@src/schemes/investigate/userPostDataList.json'
import Datatable from '/@src/components/partials/tables/Datatable.vue'
import VCardAdvanced from '/@src/components/base/card/VCardAdvanced.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface InvestigateUserProps {
    id: string
}
const props = defineProps<InvestigateUserProps>()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Investigate User: #' + props.id)

const userSession = useUserSession()
const is_access_post_data = userSession.roles().is('admin', 'tech_support', 'integration_manager')

const isLoading = ref(true)
const dataValue = ref({
    user_data: [],
    user_redirect_data: [],
    user_log: [],
    user_data_redirect_logs: { columns: [], items: [] },
})
const redirect_logs = ref(false)

const custom = {
    Endpoint() {
        return (value: string, row: any) => {
            return [
                h(RouterLink, { to: { name: 'traffic_endpoints-id', params: { id: row.endpoint._id } }, target: '_blank' }, () => value),
                h('br'),
                h('small', row._id),
            ]
        }
    },
    Location() {
        return (value: string, row: any) => {
            return h('span', row.country + ' - ' + row.language)
        }
    },
}

const redirectCustom = {
    RiskReason() {
        return (value: any, row: any) => {
            if (isString(row.riskReason)) {
                return h('span', row.riskReason)
            }
            return h('span', (row.riskReason ?? []).map((item: any) => item.reason).join(', '))
        }
    },
    BlockReasons() {
        return (value: any, row: any) => {
            let items = row.blockReasons ?? []
            if (items.length == 0) {
                return h('span', 'false')
            } else {
                let s = ''
                items.forEach((item: string) => (s += '<li>' + item + '</li>'))
                return h('ol', { innerHTML: s })
            }
        }
    },
}

const accordion = ref<VAccordionItem[]>([])

const api = useApi()
let request: Promise<any> = api.get(`/investigate/user/${props.id}`)
request.then((response) => {
    dataValue.value = response.data

    accordion.value = []
    accordion.value.push({
        title: 'USER DATA',
        content: h(Datatable, { columns: SchemeUserDataList.columns, custom: custom, 'model-value': dataValue.value.user_data }),
    })
    if (is_access_post_data) {
        accordion.value.push({
            title: 'POST DATA',
            content:
                dataValue.value.user_data.length > 0 && dataValue.value.user_data[0].log_post
                    ? h(Datatable, { columns: SchemeUserPostDataList.columns, 'model-value': dataValue.value.user_data[0].log_post })
                    : '',
        })
    }

    if (is_access_post_data && (dataValue.value?.user_redirect_data?.length > 0 || dataValue.value?.user_data_redirect_logs?.items?.length > 0)) {
        accordion.value.push({
            title: 'REDIRECT DATA',
            content: [
                h(
                    VButton,
                    {
                        color: 'info',
                        icon: 'fa fa-list-ol',
                        size: 'middle',
                        title: 'Logs',
                        style: { height: '21px' },
                        onClick: () => (redirect_logs.value = true),
                    },
                    () => 'Logs'
                ),
                h(Datatable, {
                    columns: SchemeUserPostDataList.columns,
                    modelValue: dataValue.value.user_redirect_data,
                }),
            ],
        })
    }

    accordion.value.push({
        title: 'LOGS',
        content: () => {
            const result: any[] = []
            dataValue.value.user_log.forEach((item: any, index: any) => {
                let header_ext: string[] = []
                let header = '<span class="title is-5">Log #' + (index + 1) + '</span>'

                if (item.broker_integrations && item.broker_integrations?.name) {
                    header_ext.push(`Integration: <b>${item.broker_integrations.name}</b>`)
                }
                if (item.broker && item.broker?.name) {
                    header_ext.push(`Broker: <a href="/brokers/${item.broker._id}" target="_blank"><b>${item.broker.name}</b></a>`)
                }
                if (item.response_code > 0) {
                    header_ext.push(`Response Code: <b>${item.response_code}${item.time}</b>`)
                }
                header += '&nbsp;&nbsp;&nbsp;' + header_ext.join(' | ')
                // if (item.resplonse_download_content) {
                if (item.broker && item.broker?.name) {
                    header += `&nbsp;&nbsp;
                                    <a href="data:text/html;charset=utf-8,${item.resplonse_download_content}" download="response.txt">
                                        <button type="button" title="Download Response" class="button is-outlined is-light">
                                        <span class="icon">
                                            <i class="fas fa-download"></i>
                                        </span>
                                        </button>
                                    </a>`
                }

                const color = item?.requestResponse.success ? 'primary' : 'danger'
                const renderCard = (items: { title: string; content: string }[]) => {
                    let content_items: any[] = []
                    items.forEach((x: { title: string; content: string }) => {
                        content_items.push([
                            h('div', { style: 'float:left;width:200px;', innerHTML: x.title }),
                            h('div', { style: 'margin-left:200px;', innerHTML: x.content }),
                            h(items.length > 1 ? 'hr' : 'div', { style: 'clear:left' }),
                        ])
                    })
                    return h(
                        VCardAdvanced,
                        { headerColor: color },
                        {
                            'header-left': () => [
                                h('div', { style: 'margin-right:10px;color:white;font-size:16px;', innerHTML: header }),
                                item.broker && item.broker?.name
                                    ? h(VIconButton, {
                                          title: 'Request',
                                          light: true,
                                          outlined: true,
                                          icon: 'fas fa-folder-open',
                                          onClick: () => {
                                              if (item?.requestResponse?.request) {
                                                  logPOSTData.value = item?.requestResponse?.request ?? {} //JSON.stringify(item?.requestResponse?.request ?? {}, null, 2)
                                              } else {
                                                  logPOSTData.value = 'Empty'
                                              }
                                          },
                                      })
                                    : h('span'),
                            ],
                            content: () => content_items,
                        }
                    )
                }

                let items: { title: string; content: string }[] = []
                item.logs.forEach((el: any) => {
                    let content = ''

                    if (item.skip_broker && item.skip_broker.name && item.skip_broker.name.length > 0) {
                        content += '<div><b>Broker</b>: <a href="/brokers/' + item.skip_broker._id + '" target="_blank">' + item.skip_broker.name + '</a></div>'
                    }
                    if (item.skip_broker_integrations && item.skip_broker_integrations.name && item.skip_broker_integrations.name.length > 0) {
                        content += '<div><b>Integration</b>: ' + item.skip_broker_integrations.name + '</div>'
                    }

                    if (isArray(el.value)) {
                        el.value.forEach((el2: any) => {
                            content += '<b>' + el2.name + '</b>: ' + el2.message + '<br>'
                        })
                    } else if (isString(el?.value)) {
                        let result = el?.value?.split(/\r?\n/)
                        if (result && isArray(result)) {
                            result.forEach((e: any) => {
                                content += e + '<br>'
                            })
                        } else {
                            content = el.value
                        }
                    } else {
                        content = el.value
                    }
                    items.push({ title: el.title, content: content })
                })
                const card = renderCard(items)
                result.push(card)
            })
            return result
        },
    })

    isLoading.value = false
})

const logPOSTData = ref<boolean | string>(false)

onUnmounted(() => {
    dataValue.value.user_data = []
    dataValue.value.user_log = []
    accordion.value = []
    logPOSTData.value = false
})
</script>

<template>
    <VLoader :active="isLoading" size="xl">
        <div v-if="isLoading" style="min-height: 300px"></div>
        <div class="investigate">
            <VAccordion :items="accordion" :open-items="[0]"> </VAccordion>
            <VModal :open="!!logPOSTData" title="Request" cancel-label="Close" actions="right" @close="logPOSTData = false">
                <template #content>
                    <div class="investigate">
                        <pre v-highlightjs="JSON.stringify(logPOSTData, null, 4)"><code class="javascript"></code></pre>
                    </div>
                </template>
            </VModal>
        </div>
    </VLoader>
    <VModal :open="redirect_logs" title="Redirect Logs" size="6xl" cancel-label="Close" actions="right" @close="redirect_logs = false">
        <template #content>
            <div style="overflow: auto">
                <Datatable
                    :columns="dataValue.user_data_redirect_logs.columns"
                    :custom="redirectCustom"
                    :model-value="dataValue.user_data_redirect_logs.items"
                ></Datatable>
            </div>
        </template>
        /></VModal
    >
</template>
<style lang="scss">
.investigate {
    .dataTable-wrapper .dataTable-container table.dataTable-table {
        width: 99.9%;
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
