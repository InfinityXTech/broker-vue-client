<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { useDictionary } from '/@src/composable/useDictionary'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/brokers/billing/entitiesList.json'
import SchemeEdit from '/@src/schemes/brokers/billing/entitiesEdit.json'
import SchemeNew from '/@src/schemes/brokers/billing/entitiesEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_billing_entities = userSession.roles().is('financial') || perm.is_custom_allow('billing_entities')

const api = useApi()
api.get('/broker/' + props.id).then((response: any) => viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - Billing Entities'))

const dictionary = useDictionary()
const countries = dictionary.load({ dictionary: 'countries' })

const custom = {
    Country() {
        return (value: string) => (countries.isLoading ? h(VPlaceload) : countries.map[value])
    },
    Actions() {
        return (value: any, row: any) => {
            return [
                h(VButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) }, () => 'Edit'),
                ' ',
                h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete'),
            ]
        }
    },
}

const update = ref<string | false>(false)
const remove = ref<string | false>(false)
const create = ref(false)
const datatable = ref<DatatableMethods>()

const initial = {
    amount_sign: 1,
}
</script>

<template>
    <LocalToolbar>
        <CurrencyConverter />
    </LocalToolbar>

    <div class="list-flex-toolbar">
        <VButtons>
            <VButton v-if="is_access_billing_entities" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Billing Entity </VButton>
        </VButtons>
    </div>

    <Datatable :columns="SchemeList.columns" :uri="`/broker/${props.id}/billing/entities/all`" :custom="custom" @init="(value) => (datatable = value)" />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Billing Entity"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/entities/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Billing Entity"
        :fetch-data="`/broker/${props.id}/billing/entities/${update}`"
        :scheme="SchemeEdit"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/entities/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        size="small"
        title="Delete Billing Entity"
        :fetch-data="{}"
        :gauth="true"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/broker/${props.id}/billing/entities/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
