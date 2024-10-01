<script setup lang="ts">
import { h, provide, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import VButton from '/@src/components/base/button/VButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeEdit from '/@src/schemes/traffic_endpoints/setupEdit.json'
import { useUserSession } from '/@src/stores/userSession'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Traffic Endpoint Setup')

const userSession = useUserSession()
const is_role_admin = userSession.roles().is('admin')
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('setup')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('setup')
const report_deposits_manually = perm.is_custom_allow('report_deposits_manually')

const notif = useNotyf()

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Traffic Endpoint: #' + data.token + ' - Setup')
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

if (!is_role_admin) {
    _delete_field('send_mismatch_again')
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
        :fetch-data="'/traffic_endpoint/' + props.id + '/integrations'"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        :store-data="'/traffic_endpoint/update/' + props.id + '/integrations'"
        @fetch-data="onFetched"
        @store-data="onStored"
    />

    <ApiForm
        v-if="resetPassword"
        :wrapper="VModal"
        size="small"
        title="Reset Password"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reset the password?')"
        store-method="put"
        :store-data="'/traffic_endpoint/reset_password/' + props.id"
        @store-data="
            (response) => {
                resetPassowrdModal.password = response.password
                onStored()
                resetPassword = false
                resetPassowrdModal.active.value = true
            }
        "
        @close="resetPassword = false"
    />

    <VModal :open="resetPassowrdModal.active.value" title="New Password" cancel-label="Close" actions="right" @close="resetPassowrdModal.active.value = false">
        <template #content> A new password is {{ resetPassowrdModal.password }} </template>
    </VModal>
</template>
