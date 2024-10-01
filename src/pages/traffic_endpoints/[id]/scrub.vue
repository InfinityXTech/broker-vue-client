<script setup lang="ts">
import { h, ref } from 'vue'
import { useDictionary } from '/@src/composable/useDictionary'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import SchemeList from '/@src/schemes/traffic_endpoints/scrubList.json'
import SchemeNew from '/@src/schemes/traffic_endpoints/scrubNew.json'
import VButton from '/@src/components/base/button/VButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import InputField from '/@src/components/partials/forms/InputField.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface TrafficEndpointProps {
    id: string
}

const props = defineProps<TrafficEndpointProps>()

const dictionary = useDictionary()
const countries = dictionary.load({ dictionary: 'countries' })
// const languages = dictionary.load({ dictionary: 'languages' })

const notif = useNotyf()

const isLoading = ref(false)

const viewWrapper = useViewWrapper()

const api = useApi()
api.get('/traffic_endpoint/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle('Traffic Endpoint: #' + response?.data?.token + ' - ' + SchemeList.title)
)

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('is_scrub_permission')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('is_scrub_permission')

const custom = {
    Country() {
        return (value: string) => (countries.isLoading ? h(VPlaceload) : countries.map[value])
    },
    // Language() {
    //     return (value: string) => (languages.isLoading ? h(VPlaceload) : languages.map[value] ?? 'general')
    // },
    Payout() {
        return (value: string, proxy: any) => {
            if (is_access_edit) {
                return h(InputField, {
                    label: '',
                    min: 0,
                    max: 100,
                    onlyDigits: true,
                    type: 'number',
                    default: 0,
                    modelValue: value,
                    'onUpdate:modelValue': (value: string) => {
                        // console.log(value)
                        proxy.payout = value
                        onSave(proxy)
                    },
                })
            } else {
                return h('span', { innerHTML: value })
            }
        }
    },
}

const update = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const initial = {
    TrafficEndpoint: props.id,
    country_code: '',
    payout: '',
}
const onStored = () => {
    update.value = false
    create.value = false
    datatable.value?.fetchData()
}

const onSave = function (data: any) {
    let request: Promise<any> = api.put(`/traffic_endpoint/${props.id}/scrub/update/${data._id}`, data)
    request.then(() => {
        notif.success('Updated Successfully')
        isLoading.value = false
    })
    // request.then((response) => {})
}
</script>

<template>
    <SidemenuTabs menu-id="optimization-tabs" />
    <div class="list-flex-toolbar">
        <VButtons>
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Country </VButton>
        </VButtons>
    </div>

    <Datatable
        size="small"
        :columns="SchemeList.columns"
        :uri="`/traffic_endpoint/${props.id}/scrub/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Country"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/traffic_endpoint/${props.id}/scrub/create`"
        @store-data="onStored"
        @close="create = false"
    />
</template>
