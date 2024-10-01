<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import Scheme from '/@src/schemes/admin/settingsEdit.json'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('General Settings')

const notif = useNotyf()

const onStored = () => {
    notif.success('Updated Successfully')
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title=""
        :fetch-data="'/settings'"
        :scheme="Scheme"
        store-label="Update"
        store-method="put"
        :store-data="'/settings/set'"
        @store-data="onStored"
    />
</template>