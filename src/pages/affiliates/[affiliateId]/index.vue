<script setup lang="ts">
import { ref, provide } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useRouter, RouteLocationRaw } from 'vue-router'
import { useUserSession } from '/@src/stores/userSession'
import { useSidemenu } from '/@src/composable/useSidemenu'
import { useApi } from '/@src/composable/useApi'
import { AxiosResponse } from 'axios'
import { RenderLogs } from '/@src/utils/datatable/simple-render'
import Scheme from '/@src/schemes/affiliates/affiliateEdit.json'
// import SchemeLogList from '/@src/schemes/affiliates/endpointLogList.json'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'

export interface AffiliatetProps {
    affiliateId: string
}
const props = defineProps<AffiliatetProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()
const userSession = useUserSession()
const sidemenu = useSidemenu()
const router = useRouter()

const api = useApi()

const perm = userSession.permissions('marketing_affiliates')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('general')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('general')

// if (!perm.is_allow('general')) {
//     const allow_menu = userSession.menu().get_first_allow(sidemenu.menu?.value)
//     if (allow_menu) {
//         router.push(allow_menu.to as RouteLocationRaw)
//     } else {
//         router.push({ name: '403' })
//     }
// }

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Affiliate: #' + data.token)
}

const onStored = () => {
    notif.success('Updated Successfully')
}

const logs = ref(false)

// Email
const email = ref<string | undefined>(undefined)
const onEmailStored = (data: any) => {
    email.value = data?.email?.length > 0 ? data.email : 'Empty'
}

// Tracking Link
const isTrackingLinkLoading = ref(false)
const trackingLink = ref<string>('')
const getTrackingLink = (category: string) => {
    trackingLink.value = ''
    if (category?.length > 0) {
        const promiseGetTrackingLink = api.post(`/affiliates/tracking_link/${props.affiliateId}`, { category: category })
        promiseGetTrackingLink.then((response: AxiosResponse<any>) => {
            trackingLink.value = response.data.link
        })
    }
}

provide('active_categories', async () => {
    isTrackingLinkLoading.value = true
    const { data } = await api.get('/affiliates/allow_categories/' + props.affiliateId)
    isTrackingLinkLoading.value = false
    return data.categories
})

const copyLoading = ref<boolean>(false)
const onCopyTrackingLink = () => {
    copyLoading.value = true
    setTimeout(() => (copyLoading.value = false), 300)

    // Copy To Clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(trackingLink.value).then(
            function () {
                console.log('Async: Copying to clipboard was successful!')
            },
            function (err) {
                console.error('Async: Could not copy text: ', err)
            }
        )
    } else {
        var textArea = document.createElement('textarea')
        document.body.appendChild(textArea)
        textArea.value = trackingLink.value
        textArea.focus()
        textArea.select()
        // temp.setSelectionRange(0, textArea.value.length)
        try {
            var successful = document.execCommand('copy')
            var msg = successful ? 'successful' : 'unsuccessful'
            console.log('Fallback: Copying text command was ' + msg)
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err)
        }
        document.body.removeChild(textArea)
    }
}
</script>

<template>
    <LocalToolbar>
        <ToolbarItem v-if="is_admin" icon="fas fa-file-alt" title="Log" @click="logs = true" />
    </LocalToolbar>

    <div v-if="is_admin" class="columns">
        <ApiCallButton
            v-if="email == undefined"
            class="field column is-12"
            :gauth="true"
            mode="single"
            label="Show Email"
            method="post"
            :uri="`/affiliates/email/${props.affiliateId}`"
            @store-data="onEmailStored"
        />
        <br />
        <VTag v-if="is_admin && email != undefined" color="primary" :outlined="true" :curved="true" style="font-size: 14px">Email: {{ email }}</VTag>
        <br />
    </div>

    <div v-if="false" class="columns">
        <!-- <h2 class="field column is-2">Tracking Link</h2> -->
        <SelectField
            label="Tracking Link ( Select Category )"
            layout="3"
            :default="true"
            :required="false"
            :options="{ custom: 'active_categories' }"
            @update:model-value="(value) => getTrackingLink(value)"
        />
        <div v-if="trackingLink?.length > 0" class="column is-9">
            <h2 class="field column is-2" style="padding: 0; margin: 0">Tracking Link</h2>
            <input v-model="trackingLink" class="input" :readonly="true" :disabled="false" />
            <VButton color="light" :loading="copyLoading" @click="onCopyTrackingLink">Copy</VButton>
        </div>
        <br />
        <br />
        <br />
    </div>

    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Affiliate"
        :fetch-data="'/affiliates/' + props.affiliateId"
        :scheme="Scheme"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        :store-data="'/affiliates/update/' + props.affiliateId"
        store-on="delay"
        @fetch-data="onFetched"
        @store-data="onStored"
    />

    <!-- <VModal v-if="logs" open tabs title="Logs" size="big" cancel-label="Close" actions="right" @close="logs = false">
        <template #content>
            <Datatable :columns="SchemeLogList.columns" :uri="`/affiliates/${props.id}/logs`" :render-row="RenderLogs" />
        </template>
    </VModal> -->
</template>
