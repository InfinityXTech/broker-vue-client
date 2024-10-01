<script setup lang="ts">
import { h, ref, computed, watch } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useUserSession } from '/@src/stores/userSession'
import VModal from '/@src/components/base/modal/VModal.vue'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'
import SchemeEdit from '/@src/schemes/advertisers/advertiserEdit.json'

export interface AdvertiserHeaderProps {
    advertiserId: string
    title?: string
    styles?: string[]
    click?: string
}

const props = withDefaults(defineProps<AdvertiserHeaderProps>(), {
    title: '',
    styles: undefined,
    click: undefined,
})

const viewWrapper = useViewWrapper()
const userSession = useUserSession()
const api = useApi()

const perm = userSession.permissions('marketing_advertisers')
const is_access_edit = userSession.roles().is('admin') || (perm.is_allow('all', 'edit') && perm.is_allow('general'))
const is_admin = userSession.roles().is('admin')

const formEvents = ref()
const update = ref<string | boolean>(false)
const dataAdvertiser = ref({ name: '' })
const propsTitle = ref(props.title)
const dataTitle = computed(() => 'Advertiser: ' + dataAdvertiser.value.name + ' - ' + propsTitle.value)

const fetchData = () => {
    api.get(`/advertisers/${props.advertiserId}`).then((response) => {
        dataAdvertiser.value = response.data
        // viewWrapper.setPageTitle('Advertiser: ' + response.data.name + ' - ' + props.title)
        viewWrapper.setPageTitle('')
        viewWrapper.setPageTitleVNodes(dataTitle.value, [
            h(
                'a',
                {
                    style: { cursor: 'pointer' },
                    onClick: () => (update.value = props.advertiserId),
                },
                h('i', { 'aria-hidden': true, class: 'iconify', 'data-icon': 'fa-edit' })
            ),
            h('span', dataTitle.value),
        ])
    })
}

const onUpdate = async () => {
    await formEvents.value?.onStoreSubmit()
    setTimeout(fetchData, 10)
}

const email = ref<string | undefined>(undefined)
const onEmailStored = (data: any) => {
    email.value = data?.email?.length > 0 ? data.email : 'Empty'
}

fetchData()
watch(props, () => {
    propsTitle.value = props.title
})
</script>

<template>
    <VModal :open="update != false" title="Update Advertiser" size="3xl" cancel-label="Close" actions="right" @close="update = false">
        <template #content>
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
                v-if="update"
                :wrapper="PageToolbarNoButton"
                title=""
                :fetch-data="dataAdvertiser"
                :scheme="SchemeEdit"
                :readonly="!is_access_edit"
                store-method="put"
                :store-data="`/advertisers/update/${props.advertiserId}`"
                @events="(value) => (formEvents = value)"
                @store-data="update = false"
                @close="update = false"
            />
        </template>
        <template #action>
            <VButton v-if="is_access_edit" color="primary" elevated @click="onUpdate">Confirm</VButton>
        </template>
    </VModal>
</template>