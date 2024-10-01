<route lang="yaml">
meta:
    requiresAuth: true
</route>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, ref, h } from 'vue'
import { useSidemenu } from '/@src/composable/useSidemenu'
import { useApi } from '/@src/composable/useApi'
import Scheme from '/@src/schemes/performance/performancesMenu.json'
import SchemeSettingsList from '/@src/schemes/performance/performancesSettingsList.json'
import SchemeSchemeSettingsFrom from '/@src/schemes/performance/performancesSettingsForm.json'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import VModal from '/@src/components/base/modal/VModal.vue'

const sidemenu = useSidemenu()

const datatable = ref<DatatableMethods>()
const api = useApi()

const settings = (function () {
    const isShow = ref(false)
    const isLoading = ref(false)
    const isNewFrom = ref(false)
    const editFrom = ref<boolean | string>(false)

    const deleteRow = async (id: string) => {
        if (confirm('Are you sure you want to delete this record?')) {
            const { data: response } = await api.request({ method: 'DELETE', url: '/performance/settings/broker_statuses/delete/' + id })
            // console.log(response)
            if (response) {
                datatable.value?.fetchData()
            }
        }
    }
    const onNewEditStore = () => {
        editFrom.value = false
        isNewFrom.value = false
        datatable.value?.fetchData()
    }

    return {
        isShow: isShow,
        isLoading: isLoading,
        isNewFrom: isNewFrom,
        editFrom: editFrom,
        deleteRow: deleteRow,
        onNewEditStore: onNewEditStore,
    }
})()

const custom = {
    Category() {
        return (value: any) => {
            const options = [
                {
                    value: 'tech',
                    label: 'TECH',
                },
                {
                    value: 'business',
                    label: 'BUSINESS',
                },
            ]
            return h('span', { innerHTML: options.find((x) => x.value == value)?.label })
        }
    },
    Actions() {
        return (value: any, row: any) => {
            return [
                h(VButton, { icon: 'fas fa-edit', onClick: () => (settings.editFrom.value = row._id) }, () => 'Edit'),
                h(VButton, { icon: 'fas fa-trash-alt', onClick: () => settings.deleteRow(row._id) }, () => 'Delete'),
            ]
        }
    },
}
onBeforeUnmount(sidemenu.pop)
onBeforeMount(() => sidemenu.push(Scheme))
</script>

<template>
    <div class="performance">
        <SidebarLayout :open-on-mounted="true">
            <LocalToolbar>
                <ToolbarItem icon="fas fa-cogs" title="Performance Settings" @click="settings.isShow.value = true" />
            </LocalToolbar>

            <RouterView />
        </SidebarLayout>

        <VModal :open="settings.isShow.value" title="Performance settings" size="3xl" @close="settings.isShow.value = false">
            <template #content>
                <VButton icon="fas fa-plus" color="primary" @click="settings.isNewFrom.value = true">Add</VButton>
                <Datatable
                    :columns="SchemeSettingsList.columns"
                    uri="/performance/settings/broker_statuses/all"
                    :custom="custom"
                    @init="(value) => (datatable = value)"
                />
            </template>
            <template #action> </template>
        </VModal>

        <ApiForm
            v-if="settings.isNewFrom.value"
            :wrapper="VModal"
            title="Create New Element"
            size="small"
            noclose
            :scheme="SchemeSchemeSettingsFrom"
            :fetch-data="{}"
            store-data="/performance/settings/broker_statuses/create"
            store-method="post"
            @close="settings.isNewFrom.value = false"
            @store-data="settings.onNewEditStore"
        />

        <ApiForm
            v-if="settings.editFrom.value"
            :wrapper="VModal"
            title="Update Element"
            size="small"
            noclose
            :scheme="SchemeSchemeSettingsFrom"
            :fetch-data="`/performance/settings/broker_statuses/get/${settings.editFrom.value}`"
            :store-data="`/performance/settings/broker_statuses/update/${settings.editFrom.value}`"
            store-method="put"
            @close="settings.editFrom.value = false"
            @store-data="settings.onNewEditStore"
        />
    </div>
</template>
<style lang="scss">
.performance {
    .is-right {
        float: right;
        margin: 10px;
    }

    .is-clear {
        clear: right;
    }
}
</style>
