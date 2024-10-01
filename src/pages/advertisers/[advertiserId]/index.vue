<script setup lang="ts">
import { ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useUserSession } from '/@src/stores/userSession'
// import { useSidemenu } from '/@src/composable/useSidemenu'
import Scheme from '/@src/schemes/advertisers/advertiserEdit.json'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import { useRouter } from 'vue-router'

export interface AdvertiserProps {
    advertiserId: string
}

const props = defineProps<AdvertiserProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()
// const sidemenu = useSidemenu()
const userSession = useUserSession()

const router = useRouter()
router.push({
    name: 'advertisers-advertiserId-campaigns',
    params: { advertiserId: props.advertiserId },
})

const perm = userSession.permissions('marketing_advertisers')
const is_access_edit = userSession.roles().is('admin') || (perm.is_allow('all', 'edit') && perm.is_allow('general'))
const is_admin = userSession.roles().is('admin')

const onFetched = (data: any) => {
    // let name = data.name + ' (' + data.token + ')'
    viewWrapper.setPageTitle('Advertiser: ' + data.name)
}
const onStored = () => {
    notif.success('Updated Successfully')
}

// Email
const email = ref<string | undefined>(undefined)
const onEmailStored = (data: any) => {
    email.value = data?.email?.length > 0 ? data.email : 'Empty'
}
</script>

<template>
    <div v-if="is_admin" class="columns">
        <ApiCallButton
            v-if="email == undefined"
            class="field column is-12"
            :gauth="true"
            mode="single"
            label="Show Email"
            method="post"
            :uri="`/advertisers/email/${props.advertiserId}`"
            @store-data="onEmailStored"
        />
        <br />
        <VTag v-if="is_admin && email != undefined" color="primary" :outlined="true" :curved="true" style="font-size: 14px">Email: {{ email }}</VTag>
        <br />
    </div>

    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Advertiser"
        :fetch-data="'/advertisers/' + props.advertiserId"
        :scheme="Scheme"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        :store-data="'/advertisers/update/' + props.advertiserId"
        store-on="delay"
        @fetch-data="onFetched"
        @store-data="onStored"
    />
</template>
