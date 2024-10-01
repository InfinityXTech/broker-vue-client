<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import VButton from '/@src/components/base/button/VButton.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeList from '/@src/schemes/affiliates/billing/entitiesList.json'
import SchemeEdit from '/@src/schemes/affiliates/billing/entitiesEdit.json'
import SchemeNew from '/@src/schemes/affiliates/billing/entitiesEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'

export interface AffiliateProps {
    affiliateId: string
}

const props = defineProps<AffiliateProps>()

const viewWrapper = useViewWrapper()

const api = useApi()
api.get('/affiliates/' + props.affiliateId).then((response: any) => viewWrapper.setPageTitle('Affiliate: #' + response?.data?.token + ' - Billing Entities'))

const custom = {
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

const initial = {}
</script>

<template>
    <div class="list-flex-toolbar">
        <VButtons>
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Entity </VButton>
        </VButtons>
    </div>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/affiliates/${props.affiliateId}/billing/entities/all`"
        :custom="custom"
        @init="(value) => (datatable = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Entity"
        :fetch-data="initial"
        :gauth="true"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/affiliates/${props.affiliateId}/billing/entities/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Entity"
        :fetch-data="`/affiliates/${props.affiliateId}/billing/entities/${update}`"
        :gauth="true"
        :scheme="SchemeEdit"
        store-method="post"
        :store-data="`/affiliates/${props.affiliateId}/billing/entities/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        size="small"
        title="Delete Entity"
        :fetch-data="{}"
        :gauth="true"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/affiliates/${props.affiliateId}/billing/entities/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />
</template>
