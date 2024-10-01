<script setup lang="ts">
import { ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import VButton from '/@src/components/base/button/VButton.vue'
import Scheme from '/@src/schemes/admin/settingsCompanyEdit.json'
import { useApi } from '/@src/composable/useApi'
import VCardAdvanced from '/@src/components/base/card/VCardAdvanced.vue'
import VModal from '/@src/components/base/modal/VModal.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Payment Companies')

type OrganizationItem = {
    organization_name?: string
    organization_address?: string
}

const api = useApi()
const isLoading = ref(true)
const notif = useNotyf()
const payment_companies = ref<OrganizationItem[]>()
const create = ref<boolean>(false)

const fetchData = () => {
    const request: Promise<any> = api.get('/settings/payment_companies')
    request.then((response) => {
        isLoading.value = false
        payment_companies.value = response.data
    })
}
fetchData()

const onStored = () => {
    notif.success('Updated Successfully')
}
</script>

<template>
    <div class="list-flex-toolbar">
        <VButtons>
            <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Payment Companies </VButton>
        </VButtons>
    </div>

    <VLoader :active="isLoading" size="xl">
        <div class="columns is-multiline">
            <div v-for="(item, index) in payment_companies" :key="index" class="column inv-column" :class="['is-4']">
                <VCardAdvanced>
                    <template #header-left>
                        <span class="head-text">{{ item.organization_name }}</span>
                    </template>
                    <template #content>
                        {{ item.organization_address }}
                    </template>
                </VCardAdvanced>
            </div>
        </div>
    </VLoader>

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Payment Companies"
        :fetch-data="{}"
        :scheme="Scheme"
        store-label="Add Payment Companies"
        store-method="post"
        store-data="/settings/payment_companies/create"
        @store-data="onStored(), fetchData(), (create = false)"
        @close="create = false"
    />
</template>