<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import SchemeList from '/@src/schemes/masters/billing/adjustmentsList.json'
import SchemeEdit from '/@src/schemes/masters/billing/adjustmentEdit.json'
import SchemeNew from '/@src/schemes/masters/billing/adjustmentEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'

export interface MasterProps {
    id: string
}

const props = defineProps<MasterProps>()

const custom = {
    Actions() {
        return (value: any, row: any) => {
            if (row.payment_request) {
                return ''
            }
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
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Adjustment </VButton>
        </VButtons>
    </div>

    <Datatable :columns="SchemeList.columns" :uri="`/master/${props.id}/billing/adjustments/all`" :custom="custom" @init="(value) => (datatable = value)" />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Adjustment"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/master/${props.id}/billing/adjustments/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Adjustment"
        :fetch-data="`/master/${props.id}/billing/adjustments/${update}`"
        :scheme="SchemeEdit"
        store-method="put"
        :store-data="`/master/${props.id}/billing/adjustments/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        size="small"
        title="Delete Adjustment"
        :fetch-data="{}"
        :gauth="true"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/master/${props.id}/billing/adjustments/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
