<script setup lang="ts">
import { h, ref, provide } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { RenderLogs } from '/@src/utils/datatable/simple-render'
import { RouterLink } from 'vue-router'
import { ToggleSwitchApiCell } from '/@src/utils/datatable/api-render'
import { useNotyf } from '/@src/composable/useNotyf'
import { useDictionary } from '/@src/composable/useDictionary'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeSearch from '/@src/schemes/advertisers/campaigns/budgetEndpointCapSearch.json'
import SchemeList from '/@src/schemes/advertisers/campaigns/budgetEndpointCapList.json'
import SchemeEndpointCapEdit from '/@src/schemes/advertisers/campaigns/budgetEndpointCapEdit.json'
import SchemeEdit from '/@src/schemes/advertisers/campaigns/budgetEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import { useUserSession } from '/@src/stores/userSession'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface CampaignProps {
    advertiserId: string
    campaignId: string
}

const props = defineProps<CampaignProps>()

const viewWrapper = useViewWrapper()

// const languages = useDictionary().load({ dictionary: 'languages' })

const dictionary = useDictionary()
const countries = dictionary.load({ dictionary: 'countries' })

const userSession = useUserSession()
const perm = userSession.permissions('campaigns')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const custom = {
    // Language() {
    //     return (value: string) => (languages.isLoading ? h(VPlaceload) : languages.map[value] ?? 'general')
    // },
    Enabled() {
        return (value: boolean, row: any) => {
            if (is_access_edit) {
                return ToggleSwitchApiCell(
                    'PUT',
                    `/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/budget/endpoint_allocation/enable/${row._id}`,
                    row,
                    'enabled'
                )
            } else {
                return h('span', { innerHTML: value ? 'Enabled' : 'Disabled' })
            }
        }
    },
    Endpoint() {
        return (value: string, row: any) => {
            if (row.affiliate_data?._id) {
                return [
                    h(RouterLink, { to: { name: 'affiliates-affiliateId', params: { affiliateId: row.affiliate_data?._id } }, target: '_blank' }, () => value),
                ]
            }
            return []
        }
    },
    Country() {
        return (value: string) => (countries.isLoading ? h(VPlaceload) : countries.map[value])
    },
    Actions() {
        return (value: any, row: any) => {
            let items = []
            if (is_access_edit) {
                items.push(h(VIconButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) } /*, () => 'Edit'*/))
                // items.push(h(VIconButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) } /*, () => 'Delete'*/))
            }
            // items.push(h(VIconButton, { icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) } /*, () => 'Log'*/))
            return items
        }
    },
}

const notif = useNotyf()

const dataTitleComponent = ref()
const onFetched = (data: any) => {
    // viewWrapper.setPageTitle('Campaign: ' + data.name + ' (' + data.token + ') - Budget')
    dataTitleComponent.value = h(AdvertiserHeader, {
        advertiserId: props.advertiserId,
        title: 'Campaign: ' + data.name + ' (' + data.token + ') - Budget',
    })
}

const onStored = () => {
    notif.success('Updated Successfully')
}

const onDeleteStored = () => {
    remove.value = false
    datatable.value?.fetchData()
}

provide('general_cap_inactive', (value: number) => (value ?? 0) == 0)
provide('daily_cap_inactive', (value: number) => (value ?? 0) == 0)

const update = ref<string | false>(false)
const create = ref(false)
const remove = ref(false)
// const logs = ref<string | false>(false)
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
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/budget/update/${props.campaignId}`"
        store-on="delay"
        @fetch-data="onFetched"
        @store-data="onStored"
    />

    <h1 class="title is-5">Affiliate Allocation</h1>
    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Traffic Endpoint Cap </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/budget/endpoint_allocations`"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Affiliate Cap"
        :fetch-data="initial"
        :scheme="SchemeEndpointCapEdit"
        store-method="post"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/budget/endpoint_allocation/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Affiliate Cap"
        :fetch-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/budget/endpoint_allocation/${update}`"
        :scheme="SchemeEndpointCapEdit"
        :readonly="!is_access_edit"
        store-method="put"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/budget/endpoint_allocation/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        title="Delete Affiliate Cap"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/budget/endpoint_allocation/delete/${remove}`"
        @store-data="onDeleteStored"
        @close="remove = false"
    />
</template>
<style lang="scss">
.switch-segment {
}
</style>