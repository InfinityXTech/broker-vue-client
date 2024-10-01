<script setup lang="ts">
import { useNotyf } from '/@src/composable/useNotyf'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import ThinPage from '/@src/components/partials/ThinPage.vue'

const notif = useNotyf()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Advertiser UnPayable')

const SchemeForm = {
    type: 'Form',
    content: [
        {
            component: 'TextAreaField',
            data: 'clickIds',
            props: {
                label: 'Click Ids',
                rows: 6,
                required: true,
            },
        },
        {
            component: 'SelectField',
            data: 'reason_change',
            props: {
                label: 'Reason',
                default: true,
                options: {
                    dictionary: 'reasons_un_payable_leads',
                },
            },
        },
        {
            component: 'ConditionalBlock',
            data: 'reason_change',
            props: {
                values: ['other'],
            },
            children: [
                {
                    component: 'TextAreaField',
                    data: 'reason_change2',
                    props: {
                        label: 'Custom Reason change',
                    },
                },
            ],
        },
    ],
}
const onStored = (data: any) => {
    if (data.success) {
        notif.success('Updated ' + data.count + ' rows Successfully')
    } else {
        notif.error(data.error)
    }
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title="UnPayable"
        :scheme="SchemeForm"
        :fetch-data="{}"
        store-label="Submit"
        store-method="post"
        :store-data="'/advertisers/un_payable'"
        @store-data="onStored"
    />
</template>
