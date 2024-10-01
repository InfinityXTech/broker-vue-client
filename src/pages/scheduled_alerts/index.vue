<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import SchemeList from '/@src/schemes/crm/alertsList.json'
import VButton from '/@src/components/base/button/VButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'

const custom = {
    Actions() {
        return (value: string, row: any) => {
            return [
                row.status == 1 ? h(VButton, { icon: 'fas fa-trash-alt', onClick: () => deleteAlertID.value = row._id }, () => 'Delete') : ''
            ]
        }
    },
}

const onDeleted = () => {
    deleteAlertID.value = null
    window.location.reload()
}

const deleteAlertID = ref(null)

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const datatable = ref<DatatableMethods>()

onUnmounted(() => {
    datatable.value = undefined
})
</script>

<template>
    <div class="alerts">
        <Datatable
            :columns="SchemeList.columns"
            uri="/leads/alerts"
            :custom="custom"
            :show-only-screen-data="true"
            @init="(value:any) => (datatable = value)"
        />
        <ApiForm
            v-if="deleteAlertID != null"
            :wrapper="VModal"
            title="Delete"
            :fetch-data="{}"
            :scheme="schemeConfirm('Are you sure you want to delete this alert?')"
            store-method="delete"
            :store-data="`/leads/alerts/${deleteAlertID}`"
            @store-data="onDeleted"
            @close="deleteAlertID = null"
        />
    </div>
</template>