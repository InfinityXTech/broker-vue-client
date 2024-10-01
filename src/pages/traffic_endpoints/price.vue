<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useDownload } from '/@src/composable/useDownload'

const viewWrapper = useViewWrapper()
setTimeout(() => {
    viewWrapper.setPageTitle('Price')
}, 0)

const download = useDownload()
</script>

<template>
    <VButton :color="'primary'" icon="feather:download" elevated @click="download.get('/traffic_endpoint/price/download')">Download Price</VButton>
</template>
