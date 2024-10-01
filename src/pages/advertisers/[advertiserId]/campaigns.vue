<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink, useRouter } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import { AxiosResponse } from 'axios'
import SchemeSearch from '/@src/schemes/advertisers/campaigns/campaignsSearch.json'
import SchemeList from '/@src/schemes/advertisers/campaigns/campaignsList.json'
import SchemeNew from '/@src/schemes/advertisers/campaigns/campaignNewModal.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VIconButton from '/@src/components/base/button/VIconButton.vue'
import { useUserSession } from '/@src/stores/userSession'
import VButton from '/@src/components/base/button/VButton.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { isString } from '@vue/shared'
import VTag from '/@src/components/base/tags/VTag.vue'
import AdvertiserHeader from '/@src/components/partials/forms/advertisers/AdvertiserHeader.vue'

export interface AdvertiserCampaignsProps {
    advertiserId: string
}

const props = defineProps<AdvertiserCampaignsProps>()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const api = useApi()
const userSession = useUserSession()
const perm = userSession.permissions('campaigns')
const is_admin = userSession.roles().is('admin')
const is_access_edit = perm.is_allow('all', 'edit')
const is_access_add = perm.is_allow('all', 'add')

const custom = {
    OfferToken() {
        return (value: string, row: any) => {
            if (is_access_edit) {
                return [
                    h(
                        RouterLink,
                        {
                            to: {
                                name: 'advertisers-advertiserId-campaign-campaignId-general',
                                params: { advertiserId: props.advertiserId, campaignId: row._id },
                            },
                        },
                        () => h('b', value)
                    ),
                    h('br'),
                    h('small', row._id),
                ]
            }
            return [h('b', value), h('br'), h('small', row._id)]
        }
    },
    CampaignName() {
        return (value: string, row: any) => {
            // if (is_access_edit) {
            //     return [
            //         h(
            //             RouterLink,
            //             {
            //                 to: {
            //                     name: 'advertisers-advertiserId-campaign-campaignId-general',
            //                     params: { advertiserId: props.advertiserId, campaignId: row._id },
            //                 },
            //             },
            //             () => h('b', value)
            //         ),
            //         h('br'),
            //         h('small', row._id),
            //     ]
            // }
            let items = [h('b', value)]
            if ((row.tags ?? []).length > 0) {
                items.push(h('br'))
                let _tags = {
                    top: {
                        icon: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--mdi" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" data-icon="mdi:alpha-t-box" style="color: rgb(0, 169, 186); width: 20px; height: 20px;"><path fill="currentColor" d="M9 7v2h2v8h2V9h2V7H9M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"></path></svg>',
                        title: 'Top',
                    },
                    exclusive: {
                        icon: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--mdi" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" data-icon="mdi:alpha-e-box" style="color: rgb(101, 61, 224); width: 20px; height: 20px;"><path fill="currentColor" d="M9 7v10h6v-2h-4v-2h4v-2h-4V9h4V7H9M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"></path></svg>',
                        title: 'Exclusive',
                    },
                }

                row.tags.forEach((tag: string) => {
                    items.push(h('span', { innerHTML: _tags[tag].icon, title: _tags[tag].title, style: { 'margin-right': '0px' } }))
                    // items.push(h(VTag, { color: 'success' }, () => tag))
                })
            }
            return items //, h('br'), h('small', row._id)]
        }
    },
    Targeting() {
        return (value: string, row: any) => {
            return row.world_wide_targeting == true ? 'World Wide' : row.targeting_value?.map((geo: any) => geo?.name).join(', ')
        }
    },
    Countries() {
        return (value: string, row: any) => {
            return row.world_wide_targeting == true ? 'World Wide' : row.country_value?.map((geo: any) => geo?.name).join(', ')
        }
    },
    Actions() {
        return (value: any, row: any) => {
            let items = []
            if (is_access_edit) {
                items.push(
                    h(
                        VIconButton,
                        {
                            icon: 'fas fa-edit',
                            style: { 'margin-right': '5px' },
                            onClick: () => {
                                router.push({
                                    name: 'advertisers-advertiserId-campaign-campaignId-general',
                                    params: { advertiserId: props.advertiserId, campaignId: row._id },
                                })
                            },
                        } /*,
                        () => 'Edit'*/
                    )
                    // h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete'),
                )
            }

            items.push(
                h(
                    VIconButton,
                    {
                        icon: 'fas fa-link',
                        onClick: () => (trackingLinkModal.value = row._id),
                    } /*,
                        () => 'Edit'*/
                )
            )

            items.push(
                h(
                    VIconButton,
                    {
                        style: { 'margin-left': '5px' },
                        icon: 'fas fa-tags',
                        onClick: () => tags.open(row._id),
                    } /*,
                        () => 'Edit'*/
                )
            )
            return items
        }
    },
}

const datatable = ref<DatatableMethods>()

const create = ref<string | boolean>(false)
const remove = ref<string | boolean>(false)
const initial = {}

const router = useRouter()
const onCreateStored = (data: any) => {
    router.push({ name: 'advertisers-advertiserId-campaign-campaignId-general', params: { advertiserId: props.advertiserId, campaignId: data._id } })
    create.value = false
}

const onDeleteStored = () => {
    remove.value = false
    datatable.value?.fetchData()
}

const isTrackingLinkLoading = ref(false)
const trackingLinkModal = ref<string | boolean>(false)
const trackingLink = ref<string>('')
const getTrackingLink = (affiliate: any) => {
    trackingLink.value = ''
    if (affiliate?.length > 0) {
        isTrackingLinkLoading.value = true
        const promiseGetTrackingLink = api.post(`/advertisers/tracking_link/${props.advertiserId}`, {
            affiliateId: affiliate,
            campaignId: trackingLinkModal.value,
        })
        promiseGetTrackingLink.then((response: AxiosResponse<any>) => {
            trackingLink.value = response.data.link
            isTrackingLinkLoading.value = false
        })
    }
}

const copyLoading = ref<boolean>(false)
const onCopyTrackingLink = () => {
    copyLoading.value = true
    setTimeout(() => (copyLoading.value = false), 300)

    // Copy To Clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(trackingLink.value).then(
            function () {
                console.log('Async: Copying to clipboard was successful!')
            },
            function (err) {
                console.error('Async: Could not copy text: ', err)
            }
        )
    } else {
        var textArea = document.createElement('textarea')
        document.body.appendChild(textArea)
        textArea.value = trackingLink.value
        textArea.focus()
        textArea.select()
        // temp.setSelectionRange(0, textArea.value.length)
        try {
            var successful = document.execCommand('copy')
            var msg = successful ? 'successful' : 'unsuccessful'
            console.log('Fallback: Copying text command was ' + msg)
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err)
        }
        document.body.removeChild(textArea)
    }
}

const tags = (function () {
    const isLoading = ref<boolean>(false)
    const openModal = ref<string | boolean>(false)
    const values = ref<string[]>([])
    const sheme = [
        { value: 'top', label: 'Top' },
        { value: 'exclusive', label: 'Exclusive' },
    ]
    const set = (tags: any) => {
        values.value = tags
    }
    const save = () => {
        isLoading.value = true
        const promiseSetTags = api.put(`/advertisers/${props.advertiserId}/campaigns/tags/update/${openModal.value}`, {
            tags: values.value,
        })
        promiseSetTags.then(() => {
            openModal.value = false
            isLoading.value = false
            datatable.value?.fetchData()
        })
    }
    const open = (campaignId: string) => {
        openModal.value = campaignId
        load()
    }
    const load = () => {
        isLoading.value = true
        const promiseSetTags = api.get(`/advertisers/${props.advertiserId}/campaigns/tags/${openModal.value}`)
        promiseSetTags.then((response: any) => {
            values.value = response.data.tags
            isLoading.value = false
        })
    }

    return {
        isLoading,
        openModal,
        values,
        sheme,
        set,
        save,
        open,
    }
})()

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

onUnmounted(() => {
    searchData.value = null
    datatable.value = undefined
})
</script>

<template>
    <LocalToolbar> </LocalToolbar>

    <AdvertiserHeader :advertiser-id="props.advertiserId" :title="SchemeList.title"></AdvertiserHeader>

    <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Campaign </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/advertisers/${props.advertiserId}/campaigns`"
        :custom="custom"
        :search="searchFunc"
        :show-only-screen-data="true"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Campaign"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/create`"
        @store-data="onCreateStored"
        @close="create = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        title="Delete Status"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/advertisers/${props.advertiserId}/campaigns/delete/${remove}`"
        @store-data="onDeleteStored"
        @close="remove = false"
    />

    <VModal
        v-if="trackingLinkModal"
        :open="isString(trackingLinkModal)"
        size="big"
        :cancel="false"
        title="Trackung Link"
        actions="right"
        @close="trackingLinkModal = false"
    >
        <template #content>
            <SelectField
                label="Affiliate"
                layout="5"
                :default="true"
                :required="false"
                :options="{ dictionary: 'affiliates' }"
                @update:model-value="(value) => getTrackingLink(value)"
            />
            <div class="field column is-7">
                <label>&nbsp;</label>
                <div class="control">&nbsp;</div>
            </div>
            <VLoader :active="isTrackingLinkLoading" size="small" style="position: absolute; min-height: 50px; min-width: 50px; left: 350px; top: 85px">
            </VLoader>
            <div v-if="!isTrackingLinkLoading && trackingLink?.length > 0" class="column is-12">
                <label></label>
                <input v-model="trackingLink" class="input" :readonly="true" :disabled="false" />
                <VButton color="light" :loading="copyLoading" @click="onCopyTrackingLink">Copy</VButton>
            </div>
        </template>
    </VModal>

    <VModal
        v-if="tags.openModal.value"
        :open="isString(tags.openModal.value)"
        size="small"
        :cancel="false"
        title="Tags"
        actions="right"
        @close="tags.openModal.value = false"
    >
        <template #content>
            <SelectField
                label="Tags"
                layout="12"
                :default="true"
                mode="multiple"
                :required="false"
                :model-value="tags.values.value"
                :options="tags.sheme"
                @update:model-value="(value) => tags.set(value)"
            />
        </template>
        <template #action>
            <VButton color="primary" :loading="tags.isLoading.value" elevated @click="tags.save()">Confirm</VButton>
        </template>
    </VModal>
</template>
