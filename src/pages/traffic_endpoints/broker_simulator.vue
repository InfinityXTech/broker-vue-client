<script setup lang="ts">
import { ref, provide } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import { Module, render } from 'viz.js/full.render.js'
import { customVarDictionary } from '/@src/utils/dictionary'
import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import Scheme from '/@src/schemes/traffic_endpoints/brokerSimulatorForm.json'
import Viz from 'viz.js'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Broker Simulator')

interface SimulatorResponse {
    success: boolean
    feed?: string
}

const api = useApi()
const graph = ref<string>()
const loading = ref(false)

const decodeHtmlCharCodes = (str: string) => {
    return str.replace(/(&#(\d+);)/g, function (match, capture, charCode) {
        return String.fromCharCode(charCode)
    })
}

const onStored = async (data: SimulatorResponse) => {
    loading.value = false
    if (data.feed) {
        const viz = new Viz({ Module, render })
        const dot = await viz.renderString(data.feed)
        graph.value = dot.replace(/(<text[^>]*>)(.*?)(<\/text>)/g, (match, open, text, close) => {
            text = decodeHtmlCharCodes(text)
            if (text[0] == '\u0336') {
                // text = text.substring(1).split('').join('\u0336')
                text = text.replace('\u0336', '')
                open = open.substring(0, open.length - 1) + ' style="text-decoration: line-through;">'
                console.log(open)
            }
            return open + text + close
        })
    } else {
        graph.value = ''
    }
}

const formEvents = ref()

// const group_by_fields = customVarDictionary()
const sub_funnel_list = ref({ sub_publisher_list: [], funnel_list: [] })
const updateFunnelList = (traffic_endpoint_id: string) => {
    api.get(`/traffic_endpoint/${traffic_endpoint_id}/feed_visualization_group_by_fields`).then((response: any) => {
        //'/traffic_endpoint/broker_simulator/group_by_fields'
        sub_funnel_list.value = response?.data
        formEvents.value?.forceReRenderForm()
    })
}

provide('sub_publishers', () => sub_funnel_list.value.sub_publisher_list ?? [])
provide('funnels', () => sub_funnel_list.value.funnel_list ?? [])

const onUpdateData = (data: any, target: any, value: any) => {
    if (target == 'traffic_endpoint') {
        updateFunnelList(value)
    }
}
</script>

<template>
    <ApiForm
        title=""
        :wrapper="PageToolbar"
        :scheme="Scheme"
        :fetch-data="{}"
        store-label="Search"
        store-method="post"
        store-data="/traffic_endpoint/broker_simulator"
        @events="(value) => (formEvents = value)"
        @update:data="onUpdateData"
        @before-store=";(loading = true), (graph = '')"
        @store-data="onStored"
    />
    <br />
    <VLoader :active="loading" size="xl" grey>
        <div v-if="loading" class="loading w-auto"></div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <VCard v-if="graph" class="w-auto dot-graph" radius="rounded" v-html="graph"></VCard>
        <VCard v-else class="w-auto">There is no Broker integration connections at the current time</VCard>
    </VLoader>
</template>

<style scoped lang="scss">
.loading {
    height: 200px;
}

.w-auto {
    width: auto;
}
</style>

<style lang="scss">
.is-dark {
    .dot-graph {
        svg {
            filter: invert(80%);
        }

        polygon {
            fill: none !important;
        }

        .edge polygon {
            fill: black !important;
        }
    }
}
</style>