<script setup lang="ts">
import { ref, h, provide } from 'vue'
// import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { customDictionary } from '/@src/utils/dictionary'
import Scheme from '/@src/schemes/advertisers/campaigns/campaignEdit.json'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import { useUserSession } from '/@src/stores/userSession'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface CampaignProps {
    advertiserId: string
    campaignId: string
}

const props = defineProps<CampaignProps>()

// const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('campaigns')
const is_access_edit = userSession.roles().is('admin') || perm.is_allow('general')

const notif = useNotyf()

const dataTitleComponent = ref()
const onFetched = (data: any) => {
    // viewWrapper.setPageTitle('Campaign: ' + data.name + ' (' + data.token + ') - General')
    dataTitleComponent.value = h(AdvertiserHeader, {
        advertiserId: props.advertiserId,
        title: 'Campaign: ' + data.name + ' (' + data.token + ') - General',
    })
}

const onStored = () => {
    notif.success('Updated Successfully')
}

provide(
    'marketing_post_events',
    customDictionary(`/dictionary/marketing_post_events?advertiserId=${props.advertiserId}`, (item: any) => {
        return { value: item.key, label: item.value }
    })
)

provide('show_macros', () => (makros.value = true))

const makros = ref(false)
</script>
<template>
    <component :is="dataTitleComponent"></component>
    <SidemenuTabs menu-id="campaign-tabs" />
    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Campaign"
        :fetch-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}`"
        :scheme="Scheme"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="post"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/update/${props.campaignId}`"
        store-on="delay"
        @fetch-data="onFetched"
        @store-data="onStored"
    />

    <VModal :open="makros" title="Macros List" :cancel="false" @close="makros = false">
        <template #content>
            <div class="dataTable-wrapper">
                <div class="dataTable-container">
                    <table class="dataTable-table table" style="width: 100%">
                        <thead>
                            <tr>
                                <th scope="col">Title</th>
                                <th scope="col">Macros</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ClickId</td>
                                <td>{clickid}</td>
                            </tr>
                            <tr>
                                <td>Sub Publisher</td>
                                <td>{sid}</td>
                            </tr>
                            <tr>
                                <td>Funnel</td>
                                <td>{funnel}</td>
                            </tr>
                            <tr>
                                <td>App name</td>
                                <td>{appname}</td>
                            </tr>
                            <tr>
                                <td>Bundle Id</td>
                                <td>{bundleid}</td>
                            </tr>
                            <tr>
                                <td>Cachebuster</td>
                                <td>{cachebuster}</td>
                            </tr>
                            <tr>
                                <td>Creative Id</td>
                                <td>{cid}</td>
                            </tr>
                            <tr>
                                <td>Device Id</td>
                                <td>{deviceid}</td>
                            </tr>
                            <tr>
                                <td>Country Id</td>
                                <td>{geocountry}</td>
                            </tr>
                            <tr>
                                <td>City</td>
                                <td>{geocity}</td>
                            </tr>
                            <tr>
                                <td>Creative Height</td>
                                <td>{cid_h}</td>
                            </tr>
                            <tr>
                                <td>Creative Width</td>
                                <td>{cid_w}</td>
                            </tr>
                            <tr>
                                <td>Page Url</td>
                                <td>{page_url}</td>
                            </tr>
                            <tr>
                                <td>Campaign Id</td>
                                <td>{campaign}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
        <template #action> </template>
    </VModal>
</template>
