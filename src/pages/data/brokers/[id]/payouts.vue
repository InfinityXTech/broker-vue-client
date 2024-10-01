<script setup lang="ts">
import { h, ref } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useDictionary } from '/@src/composable/useDictionary'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { RenderLogs } from '/@src/utils/datatable/simple-render'
import { ToggleSwitchApiCell } from '/@src/utils/datatable/api-render'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeSearch from '/@src/schemes/brokers/payoutsSearch.json'
import SchemeList from '/@src/schemes/brokers/payoutsList.json'
import SchemeEdit from '/@src/schemes/brokers/payoutEdit.json'
import SchemeNew from '/@src/schemes/brokers/payoutNew.json'
import SchemeLogList from '/@src/schemes/brokers/payoutLogList.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import { useUserSession } from '/@src/stores/userSession'
import { checkBrokerAccess } from '/@src/utils/broker/access'
import VIconButton from '/@src/components/base/button/VIconButton.vue'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const languages = useDictionary().load({ dictionary: 'languages' })

const viewWrapper = useViewWrapper()
// viewWrapper.setPageTitle(SchemeList.title)

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('payouts')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('payouts')

const api = useApi()
api.get('/broker/' + props.id).then((response: any) => {
    checkBrokerAccess(response?.data)
    viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - Payouts Management')
})

const custom = {
    Language() {
        return (value: string) => (languages.isLoading ? h(VPlaceload) : languages.map[value] ?? 'general')
    },
    CostType() {
        return (value: string) => ({ '1': 'CPA', '2': 'CPL' }[value] ?? '')
    },
    Enabled() {
        return (value: boolean, row: any) => {
            if (is_access_edit) {
                return ToggleSwitchApiCell('PUT', `/broker/${props.id}/payouts/enable/${row._id}`, row, 'enabled')
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
            }
            items.push(h(VIconButton, { icon: 'fas fa-file-alt', onClick: () => (logs.value = row._id) } /*, () => 'Log'*/))
            return items
        }
    },
}

const update = ref<string | false>(false)
const create = ref(false)
const logs = ref<string | false>(false)
const datatable = ref<DatatableMethods>()

const initial = {
    cost_type: '1',
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />
    <DatatableSearch :config="SchemeSearch" :data="searchData" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Country </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/broker/${props.id}/payouts/all`"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <VModal v-if="logs" open tabs title="Logs" size="big" cancel-label="Close" actions="right" @close="logs = false">
        <template #content>
            <Datatable :columns="SchemeLogList.columns" :uri="`/broker/${props.id}/payouts/logs/${logs}`" :render-row="RenderLogs" />
        </template>
    </VModal>

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Country"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/broker/${props.id}/payouts/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Payout"
        :fetch-data="`/broker/${props.id}/payouts/${update}`"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-method="put"
        :store-data="`/broker/${props.id}/payouts/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />
</template>
