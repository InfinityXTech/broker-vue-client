<script setup lang="ts">
import { ref, h } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import Scheme from '/@src/schemes/advertisers/campaigns/limitationEdit.json'
import SchemeSearch from '/@src/schemes/advertisers/campaigns/subPublisherSearch.json'
import SchemeList from '/@src/schemes/advertisers/campaigns/subPublisherList.json'
import SchemeEdit from '/@src/schemes/advertisers/campaigns/subPublisherEdit.json'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import { RouterLink } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface CampaignProps {
    advertiserId: string
    campaignId: string
}

const props = defineProps<CampaignProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('campaigns')
const is_access_edit = userSession.roles().is('admin') || perm.is_allow('general')

const notif = useNotyf()
const api = useApi()

const dataTitleComponent = ref()
const onFetched = (data: any) => {
    // viewWrapper.setPageTitle('Campaign: ' + data.name + ' (' + data.token + ') - Limitation')
    dataTitleComponent.value = h(AdvertiserHeader, {
        advertiserId: props.advertiserId,
        title: 'Campaign: ' + data.name + ' (' + data.token + ') - Limitation',
    })
    forceSubPublisher.value = data.force_sub_publisher ?? false
}

const onStored = () => {
    notif.success('Updated Successfully')
}

const onForceSubPublisher = (value: boolean) => {
    forceSubPublisher.value = value
    api.put(`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/limitation/force_sub_publisher/update`, { force_sub_publisher: value })
}

const onDeleteForceSubPublisherStored = () => {
    remove.value = false
    datatable.value?.fetchData()
}

const forceSubPublisher = ref<boolean>(false)

const custom = {
    Endpoint() {
        return (value: string, row: any) => {
            return [h(RouterLink, { to: { name: 'traffic_endpoints-id', params: { id: row.traffic_endpoint_data._id } }, target: '_blank' }, () => value)]
        }
    },
    Actions() {
        return (value: any, row: any) => {
            let items = []
            if (is_access_edit) {
                items.push(h(VIconButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) } /*, () => 'Edit'*/))
                items.push(h(VIconButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) } /*, () => 'Delete'*/))
            }
            return items
        }
    },
}

const update = ref<string | false>(false)
const create = ref(false)
const remove = ref(false)
const datatable = ref<DatatableMethods>()

const initial = {}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()
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
        store-method="put"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/limitation/update`"
        store-on="delay"
        @fetch-data="onFetched"
        @store-data="onStored"
    />

    <ToggleSwitchField v-if="false" label="Force SubPublisher" :model-value="forceSubPublisher" @update:model-value="onForceSubPublisher" />

    <div v-if="false && forceSubPublisher">
        <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
            <VButton v-if="is_access_edit" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add </VButton>
        </DatatableSearch>

        <Datatable
            :columns="SchemeList.columns"
            :uri="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/limitations/subpublishers`"
            :custom="custom"
            :search="searchFunc"
            @init="(value) => (datatable = value)"
            @changed="(value) => (searchData = value)"
        />

        <ApiForm
            v-if="create"
            :wrapper="VModal"
            title="Add"
            :fetch-data="initial"
            :scheme="SchemeEdit"
            store-method="post"
            :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/limitations/subpublishers/create`"
            @store-data="datatable?.fetchData(), (create = false)"
            @close="create = false"
        />

        <ApiForm
            v-if="update"
            :wrapper="VModal"
            title="Update"
            :fetch-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/limitations/subpublishers/${update}`"
            :scheme="SchemeEdit"
            :readonly="!is_access_edit"
            store-method="put"
            :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/limitations/subpublishers/update/${update}`"
            @store-data="datatable?.fetchData(), (update = false)"
            @close="update = false"
        />

        <ApiForm
            v-if="remove"
            :wrapper="VModal"
            title="Delete"
            :fetch-data="{}"
            :scheme="schemeConfirm('Are you sure you want to delete this record?')"
            store-method="delete"
            :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/limitations/subpublishers/delete/${remove}`"
            @store-data="onDeleteForceSubPublisherStored"
            @close="remove = false"
        />
    </div>
</template>