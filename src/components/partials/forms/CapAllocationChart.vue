<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { CapAllocationValue } from './CapAllocationTable.vue'
import { LayoutSize } from '/@src/utils/layout-size'
import { useDictionary } from '/@src/composable/useDictionary'
import ApexChart from 'vue3-apexcharts'

export interface CapAllocationChartProps {
    layout?: LayoutSize
    totalCap?: number | string
    modelValue?: CapAllocationValue | null
}

const props = withDefaults(defineProps<CapAllocationChartProps>(), {
    layout: '12',
    totalCap: undefined,
    modelValue: undefined,
})

const dictionary = useDictionary().load({ dictionary: 'traffic_endpoints' })

const series = computed(() => {
    const values = props.modelValue?.daily_cap?.map((x) => Math.round(parseInt(x as any))) ?? []
    const remained = Math.max(
        0,
        values.reduce((a, b) => Math.round(a - b), Math.round(parseInt(props.totalCap as any) || 0))
    )
    values.unshift(Math.round(remained + Number.EPSILON))
    return values
})

const labels = computed(() => {
    return ['Market cap', ...(props.modelValue?.endpoint?.map((x) => dictionary.map[x] ?? '') ?? [])]
})

const options = computed(() => ({
    series: series.value,
    chart: {
        type: 'pie',
        animations: {
            enabled: false,
        },
    },
    labels: labels.value,
    responsive: [
        {
            breakpoint: 350,
            options: {
                chart: {
                    width: 200,
                },
                legend: {
                    position: 'bottom',
                },
            },
        },
    ],
}))
onUnmounted(() => {})
</script>

<template>
    <div class="column" :class="[layout && 'is-' + layout]">
        <ApexChart type="pie" :series="series" :options="options"> </ApexChart>
    </div>
</template>