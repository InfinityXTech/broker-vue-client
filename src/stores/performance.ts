import { ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { Last3DaysTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import { forEachProperty, FormComponent } from '/@src/components/partials/Form.vue'

export interface RowData {
    broker?: string,
    endpoint?: string
    apivendor?: string
}
export interface PerformanceData {
    timeframe: string
    brokerId?: string
    endpointId?: string
    apivendorId?: string
    error_type?: string
} 

export const usePerformance = defineStore('performance', () => {
    const data = ref<PerformanceData>({
        timeframe: Last3DaysTimeRange
    })

    function getRequest(scheme: { content: FormComponent[] }, additional?: any) {
        const result: any = {}
        const queue = [...scheme.content]
        while (queue.length > 0) {
            const item = queue.shift()
            forEachProperty(item?.data, (target: string) => (result[target] = (data.value as any)[target]))
            queue.push(...(item?.children ?? []))
        }
        return Object.assign(result, additional ?? {})
    }

    function setData(value: PerformanceData) {
        data.value = value
    }

    function setIds(row: RowData) {
        const value = Object.assign({}, data.value)
        value.brokerId = row.broker
        value.endpointId = row.endpoint
        value.apivendorId = row.apivendor
        data.value = value
    }
    
    function setError(type: string) {
        const value = Object.assign({}, data.value)
        value.error_type = type
        data.value = value
    }

    return {
        data,
        getRequest,
        setIds,
        setData,
        setError,
    } as const
})

/**
 * Pinia supports Hot Module replacement so you can edit your stores and
 * interact with them directly in your app without reloading the page.
 *
 * @see https://pinia.esm.dev/cookbook/hot-module-replacement.html
 * @see https://vitejs.dev/guide/api-hmr.html
 */
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(usePerformance, import.meta.hot))
}
