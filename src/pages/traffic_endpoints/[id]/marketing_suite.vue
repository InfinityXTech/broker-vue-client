<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { AxiosError } from 'axios'
import { ref } from 'vue'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()
const notif = useNotyf()
const api = useApi()
const viewWrapper = useViewWrapper()

api.get('/traffic_endpoint/' + props.id).then((response: any) => viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - Marketing Suite'))

const { data } = await api.get('/traffic_endpoint/' + props.id + '/offers/access')
const options = data.map((item: any) => ({
    value: item._id,
    label: `${item.name} (${item.token})`,
}))
const enabled = ref(data.filter((x: any) => x.enabled).map((x: any) => x._id))

const onStore = async (value: string[]) => {
    try {
        enabled.value = value
        const data = enabled.value.map((x: string) => ({ key: x }))
        await api.put('/traffic_endpoint/' + props.id + '/offers/update/access', data)
        notif.success('Updated Successfully')
    } catch (ex) {
        const error = ex as AxiosError
        const response = error.response?.data

        if (response.exception) {
            notif.dismissAll()
            notif.error({ message: response?.data?.error ?? response.message, duration: 9000 })
        } else {
            notif.dismissAll()
            notif.error(error?.response?.data?.error ?? error.message)
        }
    }
}
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />
    <div style="max-width: 750px">
        <TwoSideMultiSelect :options="options" :model-value="enabled" @update:model-value="onStore" />
    </div>
</template>