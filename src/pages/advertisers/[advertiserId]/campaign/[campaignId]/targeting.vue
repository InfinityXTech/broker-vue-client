<script setup lang="ts">
import { h, ref, provide, computed } from 'vue'
// import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'
import { useNotyf } from '/@src/composable/useNotyf'
// import { customDictionary } from '/@src/utils/dictionary'
import { ToggleSwitchApiCell } from '/@src/utils/datatable/api-render'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import SchemeSearch from '/@src/schemes/advertisers/campaigns/targetingsSearch.json'
import SchemeList from '/@src/schemes/advertisers/campaigns/targetingsList.json'
import SchemeEdit from '/@src/schemes/advertisers/campaigns/targetingEdit.json'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface CampaignProps {
    advertiserId: string
    campaignId: string
}

const props = defineProps<CampaignProps>()

// const viewWrapper = useViewWrapper()
const notif = useNotyf()

const worldWide = ref(false)
const isInit = ref(true)
const isLoading = ref(false)

const api = useApi()

const dataTitleComponent = ref()
api.get(`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}`).then((response: any) => {
    worldWide.value = response.data.world_wide_targeting ?? false
    isInit.value = false
    // viewWrapper.setPageTitle('Campaign: ' + response?.data?.name + ' (' + response?.data?.token + ') - Targeting Location')
    dataTitleComponent.value = h(AdvertiserHeader, {
        advertiserId: props.advertiserId,
        title: 'Campaign: ' + response?.data?.name + ' (' + response?.data?.token + ') - Targeting Location',
    })
})

const userSession = useUserSession()
const perm = userSession.permissions('campaigns')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const custom = {
    // Language() {
    //     return (value: string) => (languages.isLoading ? h(VPlaceload) : languages.map[value] ?? 'general')
    // },
    Regions() {
        return (value: string, row: any) => {
            return row.region_name?.map((item: { code: string; name: string }) => item.name).join(', ')
        }
    },
    Enabled() {
        return (value: boolean, row: any) => {
            if (is_access_edit) {
                return ToggleSwitchApiCell(
                    'PUT',
                    `/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/targeting_locations/enable/${row._id}`,
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
            const loading = ref<boolean>(false)
            if (is_access_edit) {
                items.push(
                    h(
                        VIconButton,
                        {
                            loading: loading.value,
                            icon: 'fas fa-edit',
                            onClick: () => {
                                loading.value = true
                                isLoading.value = true
                                getDataValue(row._id, () => {
                                    update.value = row._id
                                    loading.value = false
                                    isLoading.value = false
                                })
                            },
                        } /*, () => 'Edit'*/
                    )
                )
                // items.push(h(VIconButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) } /*, () => 'Delete'*/))
            }
            // items.push(h(VIconButton, { icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) } /*, () => 'Log'*/))
            return items
        }
    },
}

const onWorldWideUpdate = (value: boolean) => {
    worldWide.value = value
    api.put(`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/targeting/world_wide/update`, { world_wide_targeting: value }).then(() =>
        notif.success('Updated Successfully')
    )
}

const onDeleteStored = () => {
    remove.value = false
    datatable.value?.fetchData()
}

const dataValue = ref({})
const getDataValue = (id: string, afterCall: any) => {
    regions = api.get(`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/targeting_locations/${id}`)
    regions.then((response: any) => {
        country_code.value = response.data.country_code
        getRegion(() => {
            dataValue.value = response.data
            afterCall()
        })
    })
}

const getRegion = (afterCall: any) => {
    regions = api.get(`/dictionary/regions?country_code=${country_code.value}`)
    regions.then(afterCall)
}

const country_code = ref<string>('ad')
const onUpdateData = (data: any, target: any, value: any) => {
    switch (target) {
        case 'country_code': {
            country_code.value = value
            getRegion(() => {
                createFormEvents.value?.forceReRenderForm()
                updateFormEvents.value?.forceReRenderForm()
            })
            break
        }
    }
}

const onUpdateFetched = (data: any) => {
    country_code.value = data.country_code
    regions = api.get(`/dictionary/regions?country_code=${country_code.value}`)
    updateFormEvents.value?.forceReRenderForm()
}

let regions = api.get(`/dictionary/regions?country_code=${country_code.value}`)
provide(
    'regions',
    () =>
        regions.then((response) =>
            response.data.map((item: any) => {
                return { value: item.key, label: item.value }
            })
        )
    // customDictionary(regionsUrl(), (item: any) => {
    //     console.log(country_code.value)
    //     return { value: item.key, label: item.value }
    // })
)

const createFormEvents = ref()
const updateFormEvents = ref()
const update = ref<string | false>(false)
const create = ref(false)
const remove = ref(false)
const datatable = ref<DatatableMethods>()

const initial_add = () => {
    return { country_code: country_code.value }
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()
</script>
<template>
    <component :is="dataTitleComponent"></component>

    <SidemenuTabs menu-id="campaign-tabs" />

    <ToggleSwitchField label="World Wide" :model-value="worldWide" @update:model-value="onWorldWideUpdate" />

    <div v-if="!worldWide && !isInit">
        <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Targeting Location </VButton>
        </DatatableSearch>

        <VLoader :active="isLoading" size="xl">
            <Datatable
                :columns="SchemeList.columns"
                :uri="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/targeting_locations`"
                :custom="custom"
                :search="searchFunc"
                @init="(value) => (datatable = value)"
                @changed="(value) => (searchData = value)"
            />
        </VLoader>
    </div>

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Targeting Location"
        :fetch-data="initial_add"
        :scheme="SchemeEdit"
        store-method="post"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/targeting_locations/create`"
        @events="(value) => (createFormEvents = value)"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
        @update:data="onUpdateData"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Targeting Location"
        :fetch-data="dataValue"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-method="put"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/targeting_locations/update/${update}`"
        @fetch-data="onUpdateFetched"
        @events="(value) => (updateFormEvents = value)"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
        @update:data="onUpdateData"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        title="Delete Targeting Location"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/${props.campaignId}/targeting_locations/delete/${remove}`"
        @store-data="onDeleteStored"
        @close="remove = false"
    />
</template>