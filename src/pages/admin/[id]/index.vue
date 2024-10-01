<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import Scheme from '/@src/schemes/admin/userEdit.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface UserProps {
    id: string
}
const props = defineProps<UserProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const is_admin = userSession.roles().is('admin')
const is_billing = userSession.features().is_public('PV38')

if (!is_admin) {
    window.location.href = '/403'
}

if (!is_billing) {
    for (let i = 0; i < Scheme.content.length; i++) {
        if (Scheme?.content && Scheme.content[i].data == 'roles') {
            for (let j = 0; j < Scheme?.content[i]?.props?.options?.length; j++) {
                if (Scheme?.content[i]?.props?.options[j].value == 'financial') {
                    Scheme?.content[i]?.props?.options.splice(j, 1)
                    break
                }
            }
        }
    }
}

const onFetched = (data: any) => {
    viewWrapper.setPageTitle('User: ' + data.name)
}
const onStored = () => {
    notif.success('Updated Successfully')
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title="User Update"
        :fetch-data="`/user/${props.id}`"
        :scheme="Scheme"
        store-label="Update User"
        store-method="put"
        :store-data="`/user/update/${props.id}`"
        @fetch-data="onFetched"
        @store-data="onStored"
    />
</template>
