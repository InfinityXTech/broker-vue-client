<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotifications } from '/@src/stores/notifications'
import { useUserSession } from '/@src/stores/userSession'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { format } from 'date-fns'
import VButton from '/@src/components/base/button/VButton.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import SchemeSearch from '/@src/schemes/affiliates/affiliatesApplicationSearch.json'
import AffiliateTableScheme from '/@src/schemes/affiliates/affiliatesApplicationList.json'
import VModal from '/@src/components/base/modal/VModal.vue'

const custom = {
    Token() {
        return (value: string, row: any) => {
            return [
                h('span', {
                    innerHTML: value,
                }),
                h('br'),
                h('small', row._id),
                h('br'),
                h('a', {
                    innerHTML: 'show full application',
                    style: 'border-bottom: 1px dashed silver',
                    onClick: () => {
                        details.value = row.ApplicationJson
                    },
                }),
            ]
        }
    },
    ActionsIcons() {
        return (value: string, row: any) => {
            const actions = []

            //Approve
            if (row.under_review == 0 || row.under_review == 2) {
                actions.push(
                    h(
                        VButton,
                        {
                            icon: 'fa fa-check',
                            color: 'primary',
                            title: 'Approve',
                            onClick: () => (approve.value = row._id),
                        },
                        () => 'Approve'
                    )
                )
            }
            //Reject
            if (row.under_review == 0 || row.under_review == 1) {
                if (actions.length > 0) {
                    actions.push(' ')
                }

                actions.push(
                    h(
                        VButton,
                        {
                            icon: 'fas fa-ban',
                            color: 'danger',
                            title: 'Reject',
                            onClick: () => (reject.value = row._id),
                        },
                        () => 'Reject'
                    )
                )
            }
            return actions
        }
    },
    ApplicationJson() {
        return (value: any) => {
            return value
        }
    },
    Country() {
        return (value: any, row: any) => {
            return row.ApplicationJson?.country
        }
    },
    Ip() {
        return (value: any, row: any) => {
            return row.ApplicationJson?.ip
        }
    },
    Timestamp() {
        return (value: any, row: any) => {
            const Format = 'dd.MM.yyyy'
            return row.ApplicationJson?.timestamp ? format(row.ApplicationJson.timestamp, Format) : ''
        }
    },
}

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(AffiliateTableScheme.title)

const notifications = useNotifications()
const userSession = useUserSession()
const is_admin = userSession.roles().is('admin')
const datatable = ref<DatatableMethods>()

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

const formData = { under_review: '0' } //'0,1,2'
const details = ref<boolean | Record<string, string>>(false)
const approve = ref(false)
const reject = ref(false)

const onStored = () => {
    approve.value = false
    reject.value = false
    datatable.value?.fetchData()
    notifications.refresh()
}
</script>

<template>
    <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)"> </DatatableSearch>

    <Datatable
        v-if="is_admin"
        :columns="AffiliateTableScheme.columns"
        :uri="AffiliateTableScheme.uri"
        method="post"
        :form-data="formData"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <VModal :open="details !== false" title="Details" size="3xl" @close="details = false">
        <template #content>
            <div class="dataTable-wrapper">
                <div class="dataTable-container">
                    <table :class="['dataTable-table', 'table']">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, key) in details" :key="key">
                                <td>{{ key }}</td>
                                <td>{{ item }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
        <template #action> </template>
    </VModal>

    <ApiForm
        v-if="approve"
        :wrapper="VModal"
        title="Approve Affiliate Application"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to approve this record?')"
        store-method="put"
        :store-data="`/affiliates/${approve}/application/approve`"
        @store-data="onStored"
        @close="approve = false"
    />

    <ApiForm
        v-if="reject"
        :wrapper="VModal"
        title="Reject Affiliate Application"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reject this record?')"
        store-method="put"
        :store-data="`/affiliates/${reject}/application/reject`"
        @store-data="onStored"
        @close="reject = false"
    />
</template>
