<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import SchemeEdit from '/@src/schemes/traffic_endpoints/integrationEdit.json'
import { useUserSession } from '/@src/stores/userSession'
import { ref } from 'vue'
import { provide } from 'vue'
import { h } from 'vue'
import VButton from '/@src/components/base/button/VButton.vue'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Traffic Endpoint Integration')

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('integration')
const report_deposits_manually = perm.is_custom_allow('report_deposits_manually')

const notif = useNotyf()

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Traffic Endpoint: #' + data.token + ' - Integration')
}
const onStored = () => {
    notif.success('Updated Successfully')
}

const resetPassword = ref(false)

provide('custom.ResetPassword', () => {
    const isLoading = ref(false)
    if (is_access_edit) {
        return () =>
            h(
                VButton,
                {
                    color: 'primary',
                    loading: isLoading.value,
                    onClick() {
                        resetPassword.value = true
                    },
                },
                () => 'Reset Password'
            )
    } else {
        return h('span')
    }
})

const resetPassowrdModal = (function () {
    const active = ref(false)
    const password = ref('')
    return {
        active,
        password,
    }
})()

const _delete_field = (field: string) => {
    for (let j = 0; j < SchemeEdit.content.length; j++) {
        for (let i = 0; i < (SchemeEdit.content[j].children ?? []).length; i++) {
            if (SchemeEdit.content[j].children[i]?.data == field) {
                SchemeEdit.content[j].children.splice(i, 1)
                if ((SchemeEdit.content[j]?.children ?? []).length == 0) {
                    SchemeEdit.content.splice(j, 1)
                }
                return
            }
        }
    }
}

if (!report_deposits_manually) {
    _delete_field('statusDeposit')
}
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />

    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Traffic Endpoint"
        :fetch-data="'/traffic_endpoint/' + props.id"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        :store-data="'/traffic_endpoint/update/' + props.id"
        store-on="delay"
        @fetch-data="onFetched"
        @store-data="onStored"
    />
</template>
