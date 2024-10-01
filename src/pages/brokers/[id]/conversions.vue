<script setup lang="ts">
import { h, ref } from 'vue'
import { DatatableColumn } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import { checkBrokerAccess } from '/@src/utils/broker/access'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useUserSession } from '/@src/stores/userSession'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_billing = perm.is_allow('is_billing')

const isLoading = ref(true)
const data = ref({ header: [], rates: [] })

const api = useApi()
api.get('/broker/' + props.id).then((response: any) => {
    checkBrokerAccess(response?.data)
    viewWrapper.setPageTitle(
        'Broker: ' +
            response?.data?.partner_name_secure +
            (is_access_billing ? (' - Balance: $' + response?.data?.balance).replace('$-', '-$') : '') +
            ' - Daily Conversion Rates'
    )
})

api.get(`/broker/${props.id}/conversion_rates`).then((response: any) => {
    data.value = response.data
    data.value?.header.forEach((item: any, index: number) => {
        scheme['day' + index] = {
            label: item.date,
            sortable: false,
            renderCell,
        }
    })
    setTimeout(() => (isLoading.value = false), 10)
})

const scheme: Record<string, DatatableColumn> = {
    country_name: {
        label: 'Country',
        sortable: false,
    },
}

function renderCell(cell: any) {
    return h(
        'span',
        {
            class: ['conversion-rate', 'color-' + cell.color],
            title: [cell.title, 'Depositors: ' + cell.depositors, 'Leads: ' + cell.leads].join('\n'),
        },
        [cell.cr + '%']
    )
}
</script>

<template>
    <div class="conversion-rate-container">
        <Datatable :loading="isLoading" :columns="scheme" :model-value="data.rates" />
    </div>
</template>

<style lang="scss">
.conversion-rate-container {
    table.dataTable-table {
        tbody {
            td {
                padding: 0 !important;
                text-align: center;
            }

            td[data-key='country_name'] {
                text-align: left;
            }

            .conversion-rate {
                // margin: -11px -19px;
                // padding: 11px 19px;
                // border-radius: 4px;
                padding: 0;
                margin: 0;
                border-radius: 0;
                width: 100%;
                height: 100%;
                text-align: center;
                display: block;
            }
        }
    }
}

@for $i from 0 to 192 {
    .color-#{$i} {
        /* stylelint-disable-next-line color-function-notation */
        background-color: hsla(var(--primary-h), var(--primary-s), var(--primary-l), (255 - $i) * 1% / 255%);
        color: black;
    }
}
@for $i from 192 to 256 {
    .color-#{$i} {
        /* stylelint-disable-next-line color-function-notation */
        background-color: hsla(var(--primary-h), var(--primary-s), var(--primary-l), (255 - $i) * 1% / 255%);
    }
}
</style>