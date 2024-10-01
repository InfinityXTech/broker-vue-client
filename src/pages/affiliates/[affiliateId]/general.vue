<script setup lang="ts">
import { h, provide, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import VButton from '/@src/components/base/button/VButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeEdit from '/@src/schemes/affiliates/integrationEdit.json'
import { useUserSession } from '/@src/stores/userSession'

export interface AffiliateProps {
    affiliateId: string
}

const props = defineProps<AffiliateProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Affiliate Credentials')

const userSession = useUserSession()
const is_role_admin = userSession.roles().is('admin')
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = is_role_admin || (perm.is_allow('all', 'edit') && perm.is_allow('integration'))
const is_access_add = is_role_admin || (perm.is_allow('all', 'add') && perm.is_allow('integration'))

const notif = useNotyf()

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Affiliate: #' + data.token + ' - General')
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
</script>

<template>
    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Affiliate"
        :fetch-data="'/affiliates/' + props.affiliateId"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        :store-data="'/affiliates/' + props.affiliateId + '/credentials'"
        store-on="delay"
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
        :store-data="'/affiliates/reset_password/' + props.affiliateId"
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
