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
    <VButton color="primary" icon="feather:download" role="menuitem" raised elevated @click="download.get('/broker/price/download')">Download Price</VButton>
</template>
