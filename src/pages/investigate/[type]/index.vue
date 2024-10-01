<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import Scheme from '/@src/schemes/brokers/brokerEdit.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'

export interface BrokerProps {
    id: string
}
const props = defineProps<BrokerProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Broker: ' + data.partner_name_secure)
}
const onStored = () => {
    notif.success('Updated Successfully')
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title="Broker"
        :fetch-data="'/broker/' + props.id"
        :scheme="Scheme"
        store-label="Update Broker"
        store-method="put"
        :store-data="'/broker/update/' + props.id"
        @fetch-data="onFetched"
        @store-data="onStored"
    />
</template>