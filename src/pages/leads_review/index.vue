<script setup lang="ts">
import { h, ref, onUnmounted } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import VButton from '/@src/components/base/button/VButton.vue'
import Scheme from '/@src/schemes/leads_review/form.json'
import SchemeCreateTicket from '/@src/schemes/leads_review/createTicketForm.json'
import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { VAccordionItem } from '/@src/components/base/accordion/VAccordion.vue'
import { DefaultTimeRange } from '/@src/components/partials/forms/DateRangeField.vue'
import { DateTime } from '/@src/utils/datatable/simple-render'
import ApiCallButton from '/@src/components/partials/forms/ApiCallButton.vue'

const notif = useNotyf()

const accordionValue = ref<VAccordionItem[]>([])

const isLoading = ref(false)
const createTicket = ref<string | boolean>(false)
const formEvents = ref()

const onStored = (data: any) => {
    accordionValue.value = []
    data.forEach((item: any) => {
        let content = []

        // broker
        if (item.broker_data) {
            content.push(
                h('div', {
                    innerHTML:
                        '<strong>Broker: </strong><a href="/brokers/' +
                        item.broker_data._id +
                        '" target="_blank">' +
                        item.broker_data.partner_name_secure +
                        '</a>',
                })
            )
        }

        // endpoint
        if (item.endpoint_data) {
            content.push(
                h('div', {
                    innerHTML:
                        '<strong>Traffic Endpoint: </strong><a href="/traffic_endpoints/' +
                        item.endpoint_data._id +
                        '" target="_blank">' +
                        item.endpoint_data.token +
                        '</a>',
                })
            )
        }

        // country
        content.push(
            h('div', {
                innerHTML: '<strong>Country: </strong>' + item.country,
            })
        )

        // Redirect URL
        content.push(
            h('div', {
                innerHTML:
                    '<strong>Redirect URL: </strong>' +
                    (item.redirect_url?.length > 0 ? '<a href="' + item.redirect_url + '" target="_blank">' + item.redirect_url + '</a>' : 'Empty'),
            })
        )

        const ticket_count = item.leads_review_tickets_count?.length ?? 0
        if (ticket_count > 0) {
            // Count tickets
            content.push(
                h('div', {
                    innerHTML: '<strong>Already Created Tickets: </strong>' + ticket_count,
                })
            )
        }

        content.push(h('br'))
        if (parseInt(item.review_status ?? 0) == 0) {
            content.push(
                h(ApiCallButton, {
                    label: 'Check',
                    confirm: 'Are you sure you want to set Checked Status this lead?',
                    mode: 'single',
                    size: 'middle',
                    method: 'put',
                    uri: `/leads_review/checked/${item._id}`,
                    'onStore-data': async () => {
                        await formEvents?.value?.onStoreSubmit()
                        notif.success('Checked Successfully')
                    },
                })
            )
            content.push(h('span', { style: 'width: 7px;display:inline-block;' }))
        }

        content.push(h(VButton, { color: 'warning', mode: 'single', size: 'middle', onClick: () => (createTicket.value = item._id) }, () => 'Create Ticket'))

        accordionValue.value.push({
            title:
                item._id +
                ': ' +
                DateTime()(item.Timestamp) +
                ' - ' +
                item.country +
                ' - ' +
                (parseInt(item.review_status ?? 0) == 1 ? 'Checked' : 'Unckecked'),
            content: content,
            class: parseInt(item.review_status ?? 0) == 1 ? 'checked' : 'unchecked',
        })
    })
}

const onStoredCreateTicket = () => {
    createTicket.value = false
    notif.success('Updated Successfully')
}

onUnmounted(() => {
    accordionValue.value = []
})
</script>

<template>
    <div class="leads-review">
        <ApiForm
            title=""
            :wrapper="PageToolbarButtonDown"
            :scheme="Scheme"
            :fetch-data="{ review_status: ['unchecked'], timeframe: DefaultTimeRange }"
            store-label="Search"
            store-method="post"
            :store-on="'change'"
            :store-data="'/leads_review'"
            @store-data="onStored"
            @events="(value) => (formEvents = value)"
        />
        <br />
        <VLoader :active="isLoading" size="xl">
            <VAccordion :items="accordionValue"> </VAccordion>
        </VLoader>

        <ApiForm
            v-if="createTicket"
            :wrapper="VModal"
            title="Create Ticket"
            :fetch-data="{}"
            :scheme="SchemeCreateTicket"
            store-method="post"
            :store-data="`/leads_review/tickets/create/${createTicket}`"
            @store-data="onStoredCreateTicket"
            @close="createTicket = false"
        />
    </div>
</template>
<style lang="scss">
.leads-review {
    .accordion-item {
        &.is-checked {
            background: var(--success);

            .accordion-header,
            .accordion-header:hover {
                background: var(--success);
                color: white;
            }
        }

        &.is-unchecked {
        }
    }
}
</style>
