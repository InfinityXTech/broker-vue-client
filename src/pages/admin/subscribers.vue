<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import Scheme from '/@src/schemes/admin/settingsSubscribersEdit.json'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Subscribers')

const notif = useNotyf()

const onStored = () => {
    notif.success('Updated Successfully')
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Subscribers"
        store-on="delay"
        fetch-data="/settings/subscribers"
        :scheme="Scheme"
        store-label=""
        store-method="post"
        store-data="/settings/subscribers/update"
        @store-data="onStored"
    />
</template>