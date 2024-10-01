<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { FormComponent } from '/@src/components/partials/Form.vue'
import { useUserSession } from '/@src/stores/userSession'
import { useApi } from '/@src/composable/useApi'
import VModal from '/@src/components/base/modal/VModal.vue'

export interface TestLeadEmits {
    (e: 'close'): void
}

export interface TestLeadData {
    integrationId?: string
    endpointId?: string
    country?: string
    funnel_language?: string
    first_name?: string
    last_name?: string
    funnel_lp?: string
    sub_publisher?: string
    password?: string
}

export interface TestLeadProps {
    wrapper?: any
    open: boolean
    size?: 'small' | 'medium' | 'large' | 'big' | '3xl' | '4xl' | '5xl' | '6xl' | undefined
    data?: TestLeadData
    countries?: string[]
    languages?: string[]
}

const props = withDefaults(defineProps<TestLeadProps>(), {
    size: 'big',
    wrapper: VModal,
    open: false,
    data: undefined,
    countries: undefined,
    languages: undefined,
})

const userSession = useUserSession()
const is_role_admin_or_support = userSession.roles().is('tech_support', 'admin', 'integration_manager')

const api = useApi()

const formData = computed(() => {
    let json: { type: string; content: FormComponent[] } = {
        type: 'Form',
        content: [],
    }

    // main
    json.content.push({
        component: 'ColumnBlock',
        props: {
            layout: '12',
        },
        children: [],
    })

    // integrationId
    if (modelValue.value?.integrationId) {
        json.content[0].children?.push({
            component: 'SelectField',
            data: 'integrationId',
            props: {
                label: 'Integration',
                readonly: true,
                default: true,
                layout: 6,
                options: {
                    // dictionary: 'broker_integrations',
                    custom: 'brokers_and_integrations',
                },
            },
        })
        json.content[0].children?.push({
            component: 'SelectField',
            data: 'endpointId',
            props: {
                label: 'Traffic Endpoint',
                readonly: props.data.endpointId != undefined,
                required: true,
                default: false,
                layout: '6',
                options: {
                    // dictionary: 'traffic_endpoints',
                    custom: 'traffic_endpoints',
                },
            },
        })
    } else {
        // endpointId
        if (modelValue.value?.endpointId) {
            json.content[0].children?.push({
                component: 'SelectField',
                data: 'integrationId',
                props: {
                    label: 'Integration',
                    readonly: false,
                    default: true,
                    layout: '6',
                    options: {
                        // dictionary: 'broker_integrations',
                        custom: 'brokers_and_integrations',
                    },
                },
            })
        }

        json.content[0].children?.push({
            component: 'SelectField',
            data: 'endpointId',
            props: {
                label: 'Traffic Endpoint',
                readonly: props.data.endpointId != undefined,
                required: true,
                layout: '6',
                default: true,
                options: {
                    // dictionary: 'traffic_endpoints',
                    custom: 'traffic_endpoints',
                },
            },
        })
    }

    // form data
    // column one
    json.content.push({
        component: 'ColumnBlock',
        props: {
            layout: '6',
        },
        children: [
            {
                component: 'SelectField',
                data: 'country',
                props: {
                    label: 'Country',
                    required: true,
                    default: true,
                    options: {
                        // dictionary: 'countries',
                        custom: 'countries',
                    },
                },
            },
            {
                component: 'InputField',
                data: 'first_name',
                props: {
                    layout: '6',
                    label: 'First Name',
                    required: true,
                },
            },
            {
                component: 'InputField',
                data: 'last_name',
                props: {
                    layout: '6',
                    label: 'Last Name',
                    required: true,
                },
            },
            {
                component: 'InputField',
                data: 'email',
                props: {
                    label: 'Email',
                    required: true,
                },
            },
            {
                component: 'InputField',
                data: 'ip',
                props: {
                    layout: '6',
                    label: 'IP',
                    required: true,
                },
            },
            {
                component: 'InputField',
                data: 'password',
                props: {
                    layout: '6',
                    label: 'Password',
                    required: true,
                },
            },
        ],
    })

    // column two
    json.content.push({
        component: 'ColumnBlock',
        props: {
            layout: '6',
        },
        children: [
            {
                component: 'SelectField',
                data: 'funnel_language',
                props: {
                    label: 'Funnel Language',
                    required: true,
                    default: true,
                    options: {
                        custom: 'languages',
                    },
                },
            },
            {
                component: 'InputField',
                data: 'funnel_lp',
                props: {
                    layout: '6',
                    label: 'Funnel',
                    required: true,
                },
            },
            {
                component: 'InputField',
                data: 'sub_publisher',
                props: {
                    layout: '6',
                    label: 'Sub Publisher',
                    required: true,
                },
            },
            {
                component: 'InputField',
                data: 'phone',
                props: {
                    label: 'Phone',
                    required: true,
                },
            },
            {
                component: 'InputField',
                data: 'clicktoken',
                props: {
                    label: 'Click Id',
                    required: false,
                },
            },
        ],
    })

    // if (is_role_admin_or_support || true) {
    //     json.content.push({
    //         component: 'ColumnBlock',
    //         props: {
    //             layout: '12',
    //         },
    //         children: [
    //             {
    //                 component: 'InputField',
    //                 data: 'password',
    //                 props: {
    //                     layout: '6',
    //                     label: 'Password',
    //                     required: true,
    //                 },
    //             },
    //             {
    //                 component: 'InputField',
    //                 data: 'clicktoken',
    //                 props: {
    //                     layout: '6',
    //                     label: 'Click Id',
    //                     required: false,
    //                 },
    //             },
    //         ],
    //     })
    // }
    return json
})

const emit = defineEmits<TestLeadEmits>()

const modelValue = computed<TestLeadData>(() => props.data)
const sprav = ref<any>()
const init_sprav = ref<boolean>(false)
const response = ref<boolean | any>(false)
const formEvents = ref()
const isFetching = ref(false)

const remap = (item: { key: string; value: string; default?: boolean }) => {
    return {
        value: item.key,
        label: item.value,
        default: item.default,
    }
}

provide('brokers_and_integrations', () => sprav.value['all_brokers_and_integrations'].map(remap))
provide('traffic_endpoints', () => sprav.value['traffic_endpoints'].map(remap))

provide('countries', () => {
    if (sprav.value) {
        const countries = sprav.value['countries'].map(remap)
        if (props.countries) {
            return countries.filter((item: any) => props.countries.some((country) => item.value == country))
        }
        return countries
    }
    return []
})

provide('languages', () => {
    if (sprav.value) {
        const languages = sprav.value['languages'].map(remap)
        if (props.languages && (props.languages ?? []).indexOf('general') < 0) {
            return languages.filter((item: any) => props.languages.some((language) => item.value == language))
        }
        return languages
    }
    return []
})

const onClose = () => {
    emit('close')
}

const onStore = (data: any) => {
    response.value = data
    isFetching.value = false
    // emit('close')
}

const onUpdateData = (data: any, target: any, value: any) => {
    switch (target) {
        case 'country': {
            modelValue.value.country = value
            modelValue.value.funnel_language = undefined
            onRefreshData()
        }
    }
}

const onRefreshData = () => {
    formEvents.value?.resetData({
        integrationId: modelValue.value.integrationId,
        endpointId: modelValue.value.endpointId,
        country: modelValue.value.country,

        funnel_language: modelValue.value?.funnel_language,
        first_name: modelValue.value?.first_name,
        last_name: modelValue.value?.last_name,
        funnel_lp: modelValue.value?.funnel_lp,
        sub_publisher: modelValue.value?.sub_publisher,
        password: modelValue.value?.password,
    })
    formEvents.value?.fetchData()
}

watch(props, () => {
    if (!init_sprav.value) {
        init_sprav.value = true
        const request = api.get('/dictionary', { params: { dictionaries: 'all_brokers_and_integrations,traffic_endpoints,countries,languages' } })
        request.then((response) => (sprav.value = response.data))
    }
})
</script>

<template>
    <div class="test-lead">
        <ApiForm
            v-if="props.open"
            :wrapper="props.wrapper"
            title="Send Test Lead"
            :fetch-data="'/leads/send_test_lead/data'"
            :fetch-method="'post'"
            :model-value="modelValue"
            :size="props.size"
            :scheme="formData"
            store-method="post"
            store-label="Send"
            :store-data="`/leads/send_test_lead/send`"
            @before-fetch="isFetching = true"
            @fetch-data="isFetching = false"
            @events="(value) => (formEvents = value)"
            @before-store="isFetching = true"
            @store-data="onStore"
            @update:data="onUpdateData"
            @close="onClose"
        >
            <template #action>
                <VButton color="warning" :loading="isFetching" elevated @click="onRefreshData">Refresh</VButton>
            </template>
        </ApiForm>

        <VModal v-if="response != false" :open="response != false" size="3xl" title="Result Data" actions="right" @close="response = false">
            <template #content>
                <label>Response</label>
                <div v-if="response.data">
                    <div class="dataTable-wrapper">
                        <div class="dataTable-container">
                            <table class="dataTable-table table test-lead-response">
                                <thead>
                                    <tr>
                                        <th scope="col">Key</th>
                                        <th scope="col">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, key) in Object.keys(response.data)" :key="key" :class="[item + '-' + (response.data[item] ?? 'error')]">
                                        <td>{{ item }}</td>
                                        <td v-if="item == 'redirect_url'">
                                            <a :href="response.data[item]" target="_blank">{{ response.data[item] }}</a>
                                        </td>
                                        <td v-else>{{ response.data[item] }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div v-else-if="response.output">
                    <div v-if="response.error">{{ response.error }}</div>
                    <pre>{{ response.output }}</pre>
                </div>
                <pre v-else>{{ response }}</pre>
                <div v-if="response.logs && response.logs.user_log && response.logs.user_log.length > 0">
                    <div v-for="(item, key) in response.logs.user_log" :key="key" class="test-lead-log dataTable-wrapper">
                        <hr />
                        <label :class="[item.requestResponse?.success ? 'primary' : 'danger']">Log #{{ key + 1 }}</label>
                        <div style="font-size: 13px; color: gray">
                            <span v-if="item.broker._id"
                                >Broker: <a :href="'/brokers/' + item.broker._id" target="_blank"> {{ item.broker.name }}</a></span
                            >
                            <span v-if="item.broker._id && item.response_code">, </span>
                            <span v-if="item.response_code">ResponseCode: {{ item.response_code }}, Time: {{ item.time }}</span>
                        </div>
                        <div v-if="item.logs && item.logs.length > 0" class="dataTable-container">
                            <table class="dataTable-table table">
                                <thead>
                                    <tr>
                                        <th scope="col">Key</th>
                                        <th scope="col">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(log_item, log_key) in Object.keys(item.logs)" :key="log_key">
                                        <td>{{ item.logs[log_key].title }}</td>
                                        <td v-if="item.logs[log_key].value && item.logs[log_key].title == 'redirect_url'">
                                            <a :href="item.logs[log_key].value" target="_blank"> {{ item.logs[log_key].value }}</a>
                                        </td>
                                        <td v-else>{{ item.logs[log_key].value }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </template>
        </VModal>
    </div>
</template>

<style lang="scss">
.test-lead-response {
    tr {
        &.success-true {
            background: green;

            td {
                color: white;
            }
        }

        &.success-error,
        &.success-false {
            background: var(--danger);

            td {
                color: white;
            }
        }
    }
}

.test-lead-log {
    .primary {
        background: var(--primary);
        padding: 3px 10px;
        display: block;
        color: white;
    }

    .danger {
        background: var(--danger);
        padding: 10px;
        display: block;
        color: white;
    }
}
</style>
