
<script setup lang="ts">
import { ref, h } from 'vue'
// import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import { useUserSession } from '/@src/stores/userSession'
import Scheme from '/@src/schemes/advertisers/campaigns/endpoint_managmentEdit.json'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface CampaignProps {
    advertiserId: string
    campaignId: string
}

const props = defineProps<CampaignProps>()

// const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('campaigns')
const is_access_edit = userSession.roles().is('admin') || perm.is_allow('endpoint_managment')

const notif = useNotyf()

const dataTitleComponent = ref()
const onFetched = (data: any) => {
    // viewWrapper.setPageTitle('Campaign: ' + data.name + ' (' + data.token + ') - Endpoint Managment')
    dataTitleComponent.value = h(AdvertiserHeader, {
        advertiserId: props.advertiserId,
        title: 'Campaign: ' + data.name + ' (' + data.token + ') - Endpoint Managment',
    })
}

const onStored = () => {
    notif.success('Updated Successfully')
}
</script>
<template>
    <component :is="dataTitleComponent"></component>
    <SidemenuTabs menu-id="campaign-tabs" />
    <div class="advertiser-campaign-endpoint-managment">
        <ApiForm
            :wrapper="ThinPageFullWidth"
            title="Campaign"
            :fetch-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}`"
            :scheme="Scheme"
            :readonly="!is_access_edit"
            store-label="Update"
            store-method="put"
            store-on="delay"
            :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/endpoint_managment/update`"
            @fetch-data="onFetched"
            @store-data="onStored"
        />
    </div>
</template>
<style lang="scss">
.advertiser-campaign-endpoint-managment {
    .buttons.is-centered {
        justify-content: left;
        margin-top: 10px !important;

        .button {
            margin-left: 0 !important;
        }
    }
}
</style>