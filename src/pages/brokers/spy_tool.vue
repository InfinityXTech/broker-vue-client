<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { SelectOption } from '/@src/composable/useDictionary'
//import HtmlField from '/@src/components/partials/forms/HtmlField.vue'
import { useApi } from '/@src/composable/useApi'
import { AxiosResponse } from 'axios'
// import Scheme from '/@src/schemes/brokers/spyToolForm.json'

interface SelectIntegrationOption extends SelectOption {
    brokerId: string
}

interface ResponseDataValue {
    success: boolean
    data_log: any
    log_response: string
    redirects: any[]
}

const api = useApi()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Broker Spy Tool')

const isSpravLoading = ref(false)
const isStoring = ref(false)
const dataValue = ref<ResponseDataValue | undefined>()
const dataLeadId = ref('')
const dataBroker = ref('')
const dataIntegration = ref('')

const dataAllBrokers = ref<SelectOption[]>([])
const dataAllIntegrations = ref<SelectIntegrationOption[]>([])
const dataIntegrations = ref<SelectOption[]>([])

const storeData = ref({})
watch([dataLeadId, dataBroker, dataIntegration], () => {
    storeData.value = {
        lead_id: dataLeadId.value,
        broker: dataBroker.value,
        integration: dataIntegration.value,
    }
    dataValue.value = undefined
})

const onStored = (response: any) => {
    dataValue.value = response.data
    isStoring.value = false
}

watch(dataBroker, () => {
    dataIntegrations.value = dataAllIntegrations.value.filter((x: SelectIntegrationOption) => x.brokerId == dataBroker.value)
    const def = dataIntegrations.value.find((x: SelectOption) => x.default == true)
    if (def) {
        dataIntegration.value = def.value
    }
})

watch(dataLeadId, () => {
    initSprav()
})

const initSprav = () => {
    if (dataLeadId.value) {
        const promiseBrokersAndIntegrations = api.get('/broker/spy_tool/brokers_and_integrations/' + dataLeadId.value)
        isSpravLoading.value = true
        promiseBrokersAndIntegrations.then((response: AxiosResponse<any>) => {
            dataAllBrokers.value = response.data.brokers
            const def = response.data.brokers.find((x: SelectOption) => x.default == true)
            if (def) {
                dataBroker.value = def.value
            }
            dataAllIntegrations.value = response.data.integrations
            isSpravLoading.value = false
        })
    }
}

interface HTMLElementActive {
    [key: string]: boolean
}
const htmlItemActive = ref<HTMLElementActive>({})
</script>

<template>
    <div class="column is-3">
        <div class="field is-12">
            <label>Lead ID</label>
            <input v-model="dataLeadId" :required="true" placeholder="Enter Lead ID" type="text" class="column input" autocomplete="off" />
        </div>
        <div v-if="dataLeadId && dataLeadId.length == 24" class="field is-12">
            <label>Broker</label>
            <Multiselect
                :model-value="dataBroker"
                track-by="value"
                label="label"
                :loading="isSpravLoading"
                :options="dataAllBrokers"
                :searchable="true"
                :can-clear="false"
                :can-deselect="false"
                :allow-empty="false"
                :mode="'single'"
                :placeholder="'Select Some Option'"
                :no-options-text="'The list is empty'"
                :no-results-text="'No results found'"
                @update:model-value="(value) => (dataBroker = value.toString())"
            />
        </div>

        <div v-if="dataLeadId && dataLeadId.length == 24 && dataBroker" class="field is-12">
            <label>Integration</label>
            <Multiselect
                :model-value="dataIntegration"
                track-by="value"
                label="label"
                :options="dataIntegrations"
                :searchable="true"
                :can-clear="false"
                :can-deselect="false"
                :allow-empty="false"
                :mode="'single'"
                :placeholder="'Select Some Option'"
                :no-options-text="'The list is empty'"
                :no-results-text="'No results found'"
                @update:model-value="(value) => (dataIntegration = value.toString())"
            />
        </div>

        <ApiCallButton
            v-if="dataLeadId && dataLeadId.length == 24 && dataBroker && dataIntegration"
            mode="single"
            label="Analize"
            store-method="post"
            :data="storeData"
            :uri="'/broker/spy_tool/run'"
            @before-store-data="() => (isStoring = true)"
            @store-data="onStored"
        />
    </div>

    <VLoader :active="isStoring" size="xl">
        <ul v-if="dataValue">
            <li v-if="dataValue.log_response">
                <div class="alert alert-info" role="alert">
                    <button style="border: 1px solid silver; margin-bottom: 4px" class="response">response</button>
                    <pre style="display: none">{{ dataValue.log_response }}</pre>
                    <!--<a href="' . $analizeData['redirect_url'] . '" target="__blank">' . $analizeData['redirect_url'] . '</a>-->
                </div>
            </li>

            <li v-for="(item, index) in dataValue?.redirects" :key="index">
                <VCardAdvanced>
                    <template #header-left>
                        <span class="head-text">Redirect #{{ index + 1 }}</span>
                    </template>
                    <template #content>
                        <div :class="[item.http_code && 'success']">
                            <a :href="item.url" target="__blank">{{ item.url }} </a>
                            <div v-if="item.html">
                                <button style="border: 1px solid silver" class="html" @click="() => (htmlItemActive[index.toString()] = true)">html</button>
                                <div v-if="htmlItemActive[index.toString()]">
                                    <textarea class="col-12" :rows="20" v-html="item.html"></textarea>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #footer-left>
                        <span>HTTP Code : {{ item.http_code }}</span>
                        &nbsp;|&nbsp;
                        <span>Execution Time: {{ (item.execution_time_ms ?? 1) / 1000 }} сек.</span>
                        &nbsp;|&nbsp;
                        <span>IP: {{ item.ip }}</span>
                    </template>
                </VCardAdvanced>
            </li>
        </ul>
    </VLoader>
</template>