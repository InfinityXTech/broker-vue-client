<script setup lang="ts">
import { h, provide, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { customDictionary } from '/@src/utils/dictionary'
import VButton from '/@src/components/base/button/VButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeEdit from '/@src/schemes/affiliates/technicalEdit.json'
import { useUserSession } from '/@src/stores/userSession'

export interface AffiliateProps {
    affiliateId: string
}

const props = defineProps<AffiliateProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Affiliate Postbacks')

const userSession = useUserSession()
const is_role_admin = userSession.roles().is('admin')
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = is_role_admin || (perm.is_allow('all', 'edit') && perm.is_allow('integration'))
const is_access_add = is_role_admin || (perm.is_allow('all', 'add') && perm.is_allow('integration'))

const notif = useNotyf()

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Affiliate: #' + data.token + ' - Postbacks')
}
const onStored = () => {
    notif.success('Updated Successfully')
}

provide(
    'custom_blocked_offers',
    customDictionary(`/affiliates/sprav/offers`, (item) => item)
)
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
        :store-data="'/affiliates/postbacks/' + props.affiliateId"
        store-on="delay"
        @fetch-data="onFetched"
        @store-data="onStored"
    />
</template>
