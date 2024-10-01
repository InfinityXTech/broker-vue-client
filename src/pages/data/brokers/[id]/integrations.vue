<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeSearch from '/@src/schemes/brokers/integrationsSearch.json'
import SchemeList from '/@src/schemes/brokers/integrationsList.json'
import SchemeEdit from '/@src/schemes/brokers/integrationEdit.json'
import SchemeNew from '/@src/schemes/brokers/integrationNew.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import TestLead from '/@src/components/leads/TestLead.vue'
import { useUserSession } from '/@src/stores/userSession'
import { checkBrokerAccess } from '/@src/utils/broker/access'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('api_integrations')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('api_integrations')
const is_access_send_test_lead = userSession.roles().is('admin', 'super_admin', 'tech_support', 'integration_manager')

const api = useApi()
api.get('/broker/' + props.id).then((response: any) => {
    checkBrokerAccess(response?.data)
    viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - ' + SchemeList.title)
})

const custom = {
    IntegrationName() {
        return (value: string, row: any) => {
            let items: any[] = []
            if (is_access_edit) {
                // return [h(VButton, { icon: 'far fa-edit', onClick: () => (update.value = row._id) }, () => value), h('br'), h('span', row._id)]
                items = [
                    h('a', { style: 'border-bottom: 1px dashed var(--light-text);', innerHTML: value, onClick: () => (update.value = row._id) }),
                    h('br'),
                    h('span', row._id),
                ]
                if (is_access_send_test_lead) {
                    items.push(h('br'))
                    items.push(
                        h('a', {
                            placeholder: 'Test Lead',
                            title: 'Test Lead',
                            style: '',
                            innerHTML: '<i class="uit uit-fire sidebar-svg" style="color: red;font-size: 16px;"></i>&nbsp;',
                            onClick: () => (test_lead.value = row._id),
                        })
                    )
                }
            } else {
                return [h('span', { innerHTML: value }), h('br'), h('span', row._id)]
            }
            return items
        }
    },
    LastAPICall() {
        return (value: string) => {
            const v = !Number.isNaN(value) ? parseFloat(value) : 0
            let s = ''
            if (v > 0) {
                if (v >= 1) {
                    const v2 = Math.round(v)
                    s = v2 == 1 ? 'a minute ago' : v2.toString() + ' minutes ago'
                } else {
                    const v2 = Math.round(v * 60)
                    if (v2 >= 1) {
                        s = v2 == 1 ? 'a second ago' : v2.toString() + ' seconds ago'
                    } else {
                        const v2 = Math.round(v * 60 * 1000)
                        s = v2 == 1 ? 'a millisecond ago' : v2.toString() + ' milliseconds ago'
                    }
                }
            }
            return h('span', { innerHTML: s })
        }
    },
}

const update = ref<string | false>(false)
const create = ref(false)
const test_lead = ref<string | boolean>(false)
const datatable = ref<DatatableMethods>()

const initial = {
    name: '',
    apivendor: '',
}
const onStored = () => {
    update.value = false
    create.value = false
    datatable.value?.fetchData()
}

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

onUnmounted(() => {
    searchData.value = null
    datatable.value = undefined
})
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />
    <!--div class="list-flex-toolbar">
        <VButtons>
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Integration </VButton>
        </VButtons>
    </div-->

    <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Integration </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/broker/${props.id}/integrations/all`"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Integration"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :readonly="!is_access_add"
        :store-data="`/broker/${props.id}/integrations/create`"
        @store-data="onStored"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        size="large"
        title="Update Integration"
        :fetch-data="`/broker/${props.id}/integrations/${update}`"
        :scheme="SchemeEdit"
        :readonly="!is_access_edit"
        store-method="put"
        :store-data="`/broker/${props.id}/integrations/update/${update}`"
        @store-data="onStored"
        @close="update = false"
    />

    <TestLead :open="test_lead != false" :data="{ integrationId: test_lead.toString() }" @close="test_lead = false" />
</template>
