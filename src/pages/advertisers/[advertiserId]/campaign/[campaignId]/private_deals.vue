<script setup lang="ts">
import { h, ref } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { ToggleSwitchApiCell } from '/@src/utils/datatable/api-render'
import { RouterLink } from 'vue-router'
import { useDictionary } from '/@src/composable/useDictionary'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeSearch from '/@src/schemes/advertisers/campaigns/privateDealsSearch.json'
import SchemeList from '/@src/schemes/advertisers/campaigns/privateDealsList.json'
import SchemeEdit from '/@src/schemes/advertisers/campaigns/privateDealsEdit.json'
import SchemeNew from '/@src/schemes/advertisers/campaigns/privateDealsNew.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import { useUserSession } from '/@src/stores/userSession'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { isString } from '@vueuse/shared'
import { isArray } from '@vue/shared'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface CampaignProps {
    advertiserId: string
    campaignId: string
}

const props = defineProps<CampaignProps>()

// const viewWrapper = useViewWrapper()

const languages = useDictionary().load({ dictionary: 'languages' })

const userSession = useUserSession()
const perm = userSession.permissions('campaigns')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const custom = {
    AffiliateName() {
        return (value: string, row: any) => {
            if (row.affiliate_data && is_access_edit) {
                return [
                    h(
                        RouterLink,
                        {
                            to: {
                                name: 'affiliates-affiliateId',
                                params: { affiliateId: row.affiliate_data._id },
                            },
                            target: '_blank',
                        },
                        () => h('b', value)
                    ),
                ]
            }
            return [h('b', value), h('br'), h('small', row._id)]
        }
    },
    Language() {
        return (value: any) => {
            if (languages.isLoading) {
                return h(VPlaceload)
            } else if (isString(value)) {
                return languages.map[value] ?? 'general'
            } else if (isArray(value)) {
                return value.map((item: any) => languages.map[item] ?? '').join(', ')
            }
            return ''
        }
    },
    Enabled() {
        return (value: boolean, row: any) => {
            if (is_access_edit) {
                return ToggleSwitchApiCell(
                    'PUT',
                    `/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/private_deals/enable/${row._id}`,
                    row,
                    'enabled'
                )
            } else {
                return h('span', { innerHTML: value ? 'Enabled' : 'Disabled' })
            }
        }
    },
    Actions() {
        return (value: any, row: any) => {
            let items = []
            if (is_access_edit) {
                items.push(h(VIconButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) } /*, () => 'Edit'*/))
                // items.push(h(VIconButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) } /*, () => 'Delete'*/))
            }
            return items
        }
    },
}

const onDeleteStored = () => {
    remove.value = false
    datatable.value?.fetchData()
}

const update = ref<string | false>(false)
const create = ref(false)
const remove = ref(false)
const datatable = ref<DatatableMethods>()

const initial = {}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

const api = useApi()

const dataTitleComponent = ref()
api.get(`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}`).then((response: any) => {
    // viewWrapper.setPageTitle('Campaign: ' + response?.data?.name + ' (' + response?.data?.token + ') - Targeting Location')
    dataTitleComponent.value = h(AdvertiserHeader, {
        advertiserId: props.advertiserId,
        title: 'Campaign: ' + response?.data?.name + ' (' + response?.data?.token + ') - Private Deals',
    })
})
</script>

<template>
    <component :is="dataTitleComponent"></component>
    <SidemenuTabs menu-id="campaign-tabs" />
    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Country </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/private_deals`"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Country"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/private_deals/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Payout"
        :fetch-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/private_deals/${update}`"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-method="put"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/private_deals/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        title="Delete Payout"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/private_deals/delete/${remove}`"
        @store-data="onDeleteStored"
        @close="remove = false"
    />
</template>
