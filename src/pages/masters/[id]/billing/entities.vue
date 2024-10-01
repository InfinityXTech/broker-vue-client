<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { useDictionary } from '/@src/composable/useDictionary'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/masters/billing/entitiesList.json'
import SchemeEdit from '/@src/schemes/masters/billing/entitiesEdit.json'
import SchemeNew from '/@src/schemes/masters/billing/entitiesEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'

export interface MasterProps {
    id: string
}

const props = defineProps<MasterProps>()

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
    <div class="list-flex-toolbar">
        <VButtons>
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Billing Entity </VButton>
        </VButtons>
    </div>

    <Datatable :columns="SchemeList.columns" :uri="`/master/${props.id}/billing/entities/all`" :custom="custom" @init="(value) => (datatable = value)" />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Billing Entity"
        :fetch-data="initial"
        :gauth="true"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/master/${props.id}/billing/entities/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Billing Entity"
        :fetch-data="`/master/${props.id}/billing/entities/${update}`"
        :gauth="true"
        :scheme="SchemeEdit"
        store-method="post"
        :store-data="`/master/${props.id}/billing/entities/update/${update}`"
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
        :store-data="`/master/${props.id}/billing/entities/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
