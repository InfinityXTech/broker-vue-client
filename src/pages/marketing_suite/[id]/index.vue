<script setup lang="ts">
import { provide, ref, h } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { AxiosResponse } from 'axios'
import Scheme from '/@src/schemes/marketing_suite/marketingSuiteEdit.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface MarketingSuiteProps {
    id: string
}
const props = defineProps<MarketingSuiteProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('marketing_suite')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('marketing_suite')

const api = useApi()

const dataValue = ref<any>({})
const trackingLink = ref<string>('')

const onFetched = (data: any) => {
    dataValue.value = data
    viewWrapper.setPageTitle('Marketing Suite: #' + data.token)
}
const onStored = () => {
    notif.success('Updated Successfully')
}

const getTrackingLink = () => {
    const promiseGetTrackingLink = api.get(`/marketing_suite/get_tracking_link/${props.id}`)
    promiseGetTrackingLink.then((response: AxiosResponse<any>) => {
        trackingLink.value = response.data
    })
}

const copyLoading = ref<boolean>(false)
provide('custom.get_tracking_link', () => {
    return () => {
        return [
            h('input', { class: 'input', value: trackingLink.value }),
            h(
                VButton,
                {
                    color: 'light',
                    loading: copyLoading.value,
                    onClick() {
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
                    },
                },
                () => 'Copy'
            ),
        ]
    }
})

getTrackingLink()

// watch(dataValue, () => getTrackingLink())
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title="Marketing Suite"
        :fetch-data="'/marketing_suite/' + props.id"
        :scheme="Scheme"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="post"
        :store-data="'/marketing_suite/update/' + props.id"
        @fetch-data="onFetched"
        @store-data="onStored"
    />
</template>
