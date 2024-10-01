<script setup lang="ts">
import { useNotyf } from '/@src/composable/useNotyf'
import ThinPage from '/@src/components/partials/ThinPage.vue'

const notif = useNotyf()

const SchemeForm = {
    type: 'Form',
    content: [
        {
            component: 'SelectField',
            data: 'type',
            props: {
                label: 'Type',
                layout: '3',
                default: false,
                required: true,
                options: [
                    {
                        value: 'crg',
                        label: 'CRG',
                    },
                    {
                        value: 'cpl',
                        label: 'CPL',
                    },
                ],
            },
        },
        {
            component: 'TextAreaField',
            data: 'leadIds',
            props: {
                label: 'Lead Ids',
                rows: 6,
                required: true,
            },
        },
        {
            component: 'SelectField',
            data: 'broker_reason_change',
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
            data: 'broker_reason_change',
            props: {
                values: ['other'],
            },
            children: [
                {
                    component: 'TextAreaField',
                    data: 'broker_reason_change2',
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
        notif.success('Updated Successfully')
    } else {
        notif.error(data.error)
    }
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title="UnPayable Leads"
        :scheme="SchemeForm"
        :fetch-data="{}"
        store-label="Submit"
        store-method="post"
        :store-data="'/broker/un_payable_leads'"
        @store-data="onStored"
    />
</template>
