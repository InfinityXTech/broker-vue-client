<route lang="yaml">
meta:
    requiresAuth: true
</route>
<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useSidemenu } from '/@src/composable/useSidemenu'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import Scheme from '/@src/schemes/dashboard/mainMenu.json'
import VBillboardJS from '/@src/components/base/plugins/VBillboardJS.vue'
// import { radar } from 'billboard.js'
import { spline } from 'billboard.js'
import { useThemeColors } from '/@src/composable/useThemeColors'
import { useApi } from '/@src/composable/useApi'
import VLoader from '/@src/components/base/loader/VLoader.vue'
import { isArray } from '@vue/shared'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Main dashboard')

const sidemenu = useSidemenu()

onBeforeUnmount(sidemenu.pop)
onBeforeMount(() => sidemenu.push(Scheme))

const themeColors = useThemeColors()
const isLoading = ref(true)
const billboardJsOptions = ref<any>([])

const api = useApi()
const request: Promise<any> = api.get('/dashboard')
request.then((response) => {
    isLoading.value = false
    if (isArray(response?.data)) {
        response?.data?.forEach((response_chart: any) => {
            const chart = {
                data: {
                    x: 'x',
                    // xs: {
                    //     Today: 'x1',
                    //     Yesterday: 'x1',
                    //     Hours: 'x2',
                    // },
                    columns: [
                        // ['x1', ...response_chart[response_chart.by]],
                        // ['x1', ...response_chart[response_chart.by]],
                        // ['x2', ...response_chart[response_chart.by]],
                        ['x', ...response_chart[response_chart?.by].split(',')],
                        ['Today', ...response_chart.today.split(',')],
                        ['Yesterday', ...response_chart.yesterday.split(',')],
                    ],
                    colors: {
                        Today: themeColors.accent,
                        Yesterd: themeColors.primary,
                    },
                    type: spline(),
                    labels: true,
                },
                axis: {
                    x: {
                        type: 'category',
                        categories: response_chart[response_chart.by].split(','),
                    },
                    y: {
                        title: {
                            text: 'Leads',
                        },
                    },
                },
                // linearGradient: true,
                size: {
                    height: 280,
                },
                padding: {
                    bottom: 20,
                },
                title: {
                    text: response_chart.title,
                    // position: 'top-left',
                    position: 'left',
                    padding: {
                        bottom: 20,
                        right: 20,
                        top: 0,
                        left: 20,
                    },
                },
                legend: {
                    position: 'inset',
                },
            }
            billboardJsOptions.value.push(chart)
        })
    }
})
</script>

<template>
    <VLoader :active="isLoading" size="xl">
        <SidebarLayout>
            <!-- Content Wrapper -->
            <div class="columns is-multiline">
                <div v-for="(item, key) in billboardJsOptions" :key="key" class="column inv-column" :class="['is-6']">
                    <VBillboardJS :options="item" />
                </div>
            </div>
        </SidebarLayout>
    </VLoader>
</template>
