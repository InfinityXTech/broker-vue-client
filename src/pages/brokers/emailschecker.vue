<script setup lang="ts">
import { useDownload } from '/@src/composable/useDownload'
import { format } from 'date-fns'
import Scheme from '/@src/schemes/emailschecker/emailschecker.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'

const initial = {
    type: 'emails',
}

const download = useDownload()

const onQuery = (query: any) => download.post('/emailschecker', query, 'export_' + format(new Date(), 'yyyy-MM-dd') + '.xlsx')
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title="Broker Tools"
        :scheme="Scheme"
        :fetch-data="initial"
        store-label="Download Excel"
        store-method="post"
        :store-data="{}"
        @store-data="onQuery"
    />
</template>