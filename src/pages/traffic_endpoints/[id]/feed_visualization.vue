<script setup lang="ts">
import { ref, provide } from 'vue'
import { Tippy } from 'vue-tippy'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { customVarDictionary } from '/@src/utils/dictionary'
import Scheme from '/@src/schemes/traffic_endpoints/feed_visualizationForm.json'
import VMessage from '/@src/components/base/message/VMessage.vue'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import VCardAdvanced from '/@src/components/base/card/VCardAdvanced.vue'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()

const api = useApi()
api.get('/traffic_endpoint/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Feed Visualization')
)

const dataValue = ref<any>([])
const isFetching = ref(true)

const onStored = (data: any) => {
    dataValue.value = data
    isFetching.value = false
    notif.success('Successfully')
}

const group_by_fields = customVarDictionary()
api.get(`/traffic_endpoint/${props.id}/feed_visualization_group_by_fields`).then((response: any) => group_by_fields.set(response?.data))
provide('feed_visualization_sub_publishers', () => group_by_fields.wait().then((data: any) => data.sub_publisher_list ?? []))
provide('feed_visualization_funnels', () => group_by_fields.wait().then((data: any) => data.funnel_list ?? []))

const initial = {
    skip_details: 'hide',
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Feed Visualization"
        :scheme="Scheme"
        store-label="Search"
        store-method="post"
        :fetch-data="initial"
        :store-data="'/traffic_endpoint/' + props.id + '/feed_visualization'"
        store-on="change"
        @before-store="isFetching = true"
        @store-data="onStored"
    />

    <br />
    <br />
    <!-- <VLoader :active="isFetching" size="xl"> -->
    <!-- <div v-if="isFetching" style="min-height: 300px"></div> -->
    <div v-if="!isFetching" class="columns is-multiline">
        <VMessage v-if="dataValue.message" color="danger">{{ dataValue.message }}</VMessage>
        <div
            v-for="item in dataValue"
            v-else
            :key="item"
            class="column inv-column"
            :class="['is-4']"
            data-country="{{item.country}}"
            data-language="{{item.language}}"
        >
            <VCardAdvanced>
                <template #header-left>
                    <img :src="'/@src/assets/illustrations/flags/' + item.country + '.png'" alt="" />
                    <span class="full-country-title">{{ item.country_title }}<span v-if="item.language_title"> — </span>{{ item.language_title }}</span>
                </template>
                <template #content>
                    <ul v-if="item.list" class="list-group list-group-flush">
                        <li v-for="li in item.list" :key="li" class="list-group-item">
                            <div class="columns is-multiline">
                                <div class="column is-8 px-0">
                                    <Tippy interactive placement="left">
                                        <span v-html="li.icon"></span> {{ li.broker_title }}<span v-if="li.broker_title"> &mdash; </span
                                        >{{ li.integration_title }}
                                        <template #content>
                                            <ul v-if="li.skip_details && li.skip_details.length > 0" class="list-group list-group-flush" style="color: red">
                                                <li v-for="skip in li.skip_details" :key="skip" class="list-group-item">- {{ skip }}</li>
                                            </ul>
                                            <div v-else style="color: green">Success</div>
                                        </template>
                                    </Tippy>
                                </div>
                                <div class="column is-4 px-0">{{ li.cap_type }}: {{ li.ep_live_caps }} / {{ li.ep_daily_cap }}</div>
                            </div>
                        </li>
                    </ul>
                    <div v-else><span v-html="item.icon"></span> {{ item.body }}</div>
                    <div v-if="item.message"><span v-html="item.icon"></span> {{ item.message }}</div>
                </template>
            </VCardAdvanced>
        </div>
    </div>
    <!-- </VLoader> -->
    <!-- <Datatable :columns="SchemeList.columns" :model-value="dataValue" :custom="custom" /> -->
</template>

<style scoped lang="scss">
.card-head > .left > img {
    width: 17px;
    margin-right: 5px;
}
</style>