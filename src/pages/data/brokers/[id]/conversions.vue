<script setup lang="ts">
import { h } from 'vue'
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

const api = useApi()
api.get('/broker/' + props.id).then((response: any) => {
    checkBrokerAccess(response?.data)
    viewWrapper.setPageTitle('Broker: ' + response?.data?.partner_name_secure + ' - Daily Conversion Rates')
})

const { data } = await api.get(`/broker/${props.id}/conversion_rates`)

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

data.header.forEach((item: any, index: number) => {
    scheme['day' + index] = {
        label: item.date,
        sortable: false,
        renderCell,
    }
})
</script>

<template>
    <SidemenuTabs menu-id="technical-tabs" />
    <div class="conversion-rate-container">
        <Datatable :columns="scheme" :model-value="data.rates" />
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