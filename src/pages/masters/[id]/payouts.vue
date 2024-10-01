<script setup lang="ts">
import { h, ref } from 'vue'
import { useDictionary } from '/@src/composable/useDictionary'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { ToggleSwitchApiCell } from '/@src/utils/datatable/api-render'
import VButton from '/@src/components/base/button/VButton.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeList from '/@src/schemes/masters/payoutsList.json'
import SchemeEdit from '/@src/schemes/masters/payoutEdit.json'
import SchemeNew from '/@src/schemes/masters/payoutNew.json'
import SchemeSearch from '/@src/schemes/masters/payoutSearch.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface MasterProps {
    id: string
}

const props = defineProps<MasterProps>()

const dictionary = useDictionary()
const countries = dictionary.load({ dictionary: 'countries' })
const languages = dictionary.load({ dictionary: 'languages' })

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const userSession = useUserSession()
const perm = userSession.permissions('masters')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('payouts')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('payouts')

const custom = {
    Country() {
        return (value: string) => (countries.isLoading ? h(VPlaceload) : countries.map[value])
    },
    Language() {
        return (value: string) => (languages.isLoading ? h(VPlaceload) : languages.map[value] ?? 'general')
    },
    CostType() {
        return (value: string) => ({ '1': 'CPA', '2': 'CPL' }[value] ?? '')
    },
    Enabled() {
        return (value: boolean, row: any) => {
            if (is_access_edit) {
                return ToggleSwitchApiCell('PUT', `/master/${props.id}/payouts/enable/${row._id}`, row, 'enabled')
            } else {
                return h('span', { innerHTML: value ? 'Yes' : 'No' })
            }
        }
    },
    Actions() {
        return (value: any, row: any) => {
            if (is_access_edit) {
                return [
                    h(VButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) }, () => 'Edit'),
                    // h('br'),
                    // h(VButton, { color: 'primary', icon: 'fas fa-trash', onClick: () => (remove.value = row._id) }, () => 'Delete'),
                ]
            } else {
                return h('span')
            }
        }
    },
}

const update = ref<string | false>(false)
const create = ref(false)
const remove = ref<string | false>(false)
const datatable = ref<DatatableMethods>()

const initial = {
    cost_type: '1',
}

const onStored = () => {
    remove.value = false
    update.value = false
    create.value = false
    datatable.value?.fetchData()
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()
</script>

<template>
    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Country </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/master/${props.id}/payouts/all`"
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
        :store-data="`/master/${props.id}/payouts/create`"
        @store-data="onStored"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Payout"
        :fetch-data="`/master/${props.id}/payouts/${update}`"
        :scheme="SchemeEdit"
        store-method="put"
        :store-data="`/master/${props.id}/payouts/update/${update}`"
        @store-data="onStored"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        title="Delete Status"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/master/${props.id}/payouts/delete/${remove}`"
        @store-data="onStored"
        @close="remove = false"
    />
</template>
