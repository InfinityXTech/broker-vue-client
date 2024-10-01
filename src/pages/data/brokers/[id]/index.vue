<script setup lang="ts">
import { ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useUserSession } from '/@src/stores/userSession'
import { useSidemenu } from '/@src/composable/useSidemenu'
import { useRouter, RouteLocationRaw } from 'vue-router'
import { checkBrokerAccess } from '/@src/utils/broker/access'
import Scheme from '/@src/schemes/brokers/brokerEdit.json'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'

export interface BrokerProps {
    id: string
}
const props = defineProps<BrokerProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()
const sidemenu = useSidemenu()
const userSession = useUserSession()
const router = useRouter()

const perm = userSession.permissions('brokers')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('general')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('general')
const is_access_broker_name = perm.is_allow('broker_name')

if (!perm.is_allow('general')) {
    const allow_menu = userSession.menu().get_first_allow(sidemenu.menu?.value)
    if (allow_menu) {
        router.push(allow_menu.to as RouteLocationRaw)
    } else {
        router.push({ name: '403' })
    }
}

const isFetching = ref(true)
const onFetched = (data: any) => {
    checkBrokerAccess(data)

    if (!is_access_broker_name) {
        for (let i = 0; i < Scheme.content[0].children.length; i++) {
            if (Scheme.content[0].children[i].data == 'partner_name') {
                Scheme.content[0].children[i].data = 'token'
                Scheme.content[0].children[i].props.readonly = true
                break
            }
        }
    }
    viewWrapper.setPageTitle('Broker: ' + data.partner_name_secure + ' - General')
    setTimeout(() => (isFetching.value = false), 60)
}
const onStored = () => {
    notif.success('Updated Successfully')
}
</script>

<template>
    <VLoader :active="isFetching" size="xl">
        <ApiForm
            :wrapper="ThinPageFullWidth"
            title="Broker"
            :fetch-data="'/broker/' + props.id"
            :scheme="Scheme"
            :readonly="!is_access_edit"
            store-label="Update"
            store-method="put"
            :store-data="'/broker/update/' + props.id"
            store-on="delay"
            @fetch-data="onFetched"
            @store-data="onStored"
        />
    </VLoader>
</template>
