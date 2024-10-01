<script setup lang="ts">
import { ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'
import { useUserSession } from '/@src/stores/userSession'

const userSession = useUserSession()
const is_tech_support = userSession.roles().is('tech_support', 'integration_manager')

if (!is_tech_support) {
    window.location.href = '/403'
}

const notif = useNotyf()
const viewWrapper = useViewWrapper()

setTimeout(() => {
    viewWrapper.setPageTitle('Lead Analysis')
}, 0)

const SchemeForm = {
    type: 'Form',
    content: [
        {
            component: 'InputField',
            data: 'leadId',
            props: {
                label: 'Lead Id',
                required: true,
            },
        },
    ],
}

interface LeadAnalizeItemResponse {
    success: boolean
    message: string
    error?: string
}
interface LeadAnalizeResponse {
    items: LeadAnalizeItemResponse[]
    lead: string
    success: boolean
    error?: string
}

const leadAnalisisData = ref<LeadAnalizeResponse>({ items: [], lead: '', success: false })
const onStored = (data: any) => {
    leadAnalisisData.value = data
    notif.success('Updated Successfully')
}
</script>

<template>
    <div class="lead-analisis">
        <ApiForm
            size="small"
            :wrapper="PageToolbarButtonDown"
            title="Traffic Endpoint"
            :fetch-data="{}"
            :scheme="SchemeForm"
            store-label="Submit"
            store-method="post"
            :store-data="'/traffic_endpoint/lead_analisis'"
            @store-data="onStored"
        />
        <br />

        <VCard v-if="leadAnalisisData.success == false && leadAnalisisData.error" :color="'danger'">
            <p>{{ leadAnalisisData.error }}</p>
        </VCard>

        <ul>
            <li v-for="(row, index) in leadAnalisisData.items" :key="index" style="margin-bottom: 10px">
                <VCard :color="row.success ? 'success' : 'danger'">
                    <p>
                        {{ row.success == true ? row.message : row.error }}
                    </p>
                </VCard>
            </li>

            <div v-if="leadAnalisisData.lead">
                <h2><b>Only for admin & support</b></h2>
                <pre v-highlightjs="JSON.stringify(leadAnalisisData.lead, null, 4)"><code class="javascript"></code></pre>
            </div>
        </ul>
    </div>
</template>
<style lang="scss">
.lead-analisis {
}
</style>
