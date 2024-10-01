<script setup lang="ts">
import { h, ref } from 'vue'
import Scheme from '/@src/schemes/response_tools/response_tools.json'
import SchemeList from '/@src/schemes/response_tools/response_toolsList.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import { useUserSession } from '/@src/stores/userSession'

const userSession = useUserSession()
const is_tech_support = userSession.roles().is('tech_support', 'integration_manager')

if (!is_tech_support) {
    window.location.href = '/403'
}

const initial = {
    type: 'token',
}

const dataValue = ref([])

const onStored = (data: any) => {
    dataValue.value = data
    //notif.success('Updated Successfully')
}

const custom = {
    Location() {
        return (value: string, row: any) => {
            return h('span', row.country + ' - ' + row.language)
        }
    },
}
</script>


<template>
    <ApiForm
        :wrapper="ThinPage"
        title="Response Tools"
        :scheme="Scheme"
        :fetch-data="initial"
        store-label="Check response"
        store-method="post"
        :store-data="'/traffic_endpoint/response_tools'"
        @store-data="onStored"
    />
    <br />
    <Datatable :columns="SchemeList.columns" :model-value="dataValue" :custom="custom" />
</template>
