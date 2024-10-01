import { h } from 'vue'
import { RouterLink } from 'vue-router'
import { DatatableColumn } from '/@src/components/partials/tables/Datatable.vue'
import { ToggleSwitchApiCell } from '/@src/utils/datatable/api-render'
import LiveCaps from '/@src/components/brokers/LiveCaps.vue'
import CpaCrg from '/@src/components/brokers/CpaCrg.vue'
import CapErrors from '/@src/components/brokers/CapErrors.vue'
import FormatBlockedSchedule from '/@src/components/brokers/FormatBlockedSchedule.vue'
import { useUserSession } from '/@src/stores/userSession'

const userSession = useUserSession()
const is_access_edit = userSession.permissions('brokers').is_allow('all')

export const CapsRenders = {
    Index() {
        return (value: any, row: any, column: DatatableColumn, index: number) => {
            return h(CapErrors, { data: row }, () => index + 1)
        }
    },
    CPA() {
        return (value: any, row: any) => {
            return h(CpaCrg, { data: row.payouts_crg?.payout?.by_amount, countryCode: row.country?.code, languageCodes: row.languages ?? [], sign: '$' })
        }
    },
    CRG() {
        return (value: any, row: any) => {
            return h(CpaCrg, { data: row.payouts_crg?.crg?.by_amount, countryCode: row.country?.code, languageCodes: row.languages ?? [], sign: '%' })
        }
    },
    FormatBlockedSchedule() {
        return (value: any, row: any) => {
            // return h('span', { innerHTML: JSON.stringify(row.crg_blocked_schedule) })
            // return h('span', { innerHTML: JSON.stringify(row.crg_week) })
            if (value.length > 0) {
                return h(FormatBlockedSchedule, { data: value })
            } else {
                return h('span', { innerHTML: 'Inactive' })
            }
        }
    },
    BrokerName() {
        return (value: { _id: string; name: string; error: string }) => {
            return h(
                RouterLink,
                { to: { name: 'brokers-id-caps', params: { id: value._id } }, class: value.error && 'danger-text', title: value.error },
                () => value.name
            )
        }
    },
    Integration() {
        return (value: { _id: string; name: string; error: string }) => {
            return h('span', { class: value.error && 'danger-text', title: value.error }, value.name)
        }
    },
    CapType() {
        return (value: string) => ({ leads: 'Leads', ftd: 'FTD' }[value] ?? value)
    },
    Country() {
        return (value: { code: string; name: string }) => h('span', value.name ?? '')
    },
    Language() {
        return (value: { code: string; error: string }[]) => {
            const result: any[] = []
            value.forEach((item) => {
                result.push(h('span', { class: item.error && 'danger-text', title: item.error }, item.code))
                result.push(', ')
            })
            result.pop()
            return result
        }
    },
    LiveCaps() {
        return (value: number, row: any) => {
            return h(LiveCaps, { live: row.live_caps, daily: row.daily_cap, alloc: row.caps_alloc })
        }
    },
    TotalCaps() {
        return (value: number, row: any) => {
            return [
                h('small', { style: { 'text-align': 'center', display: 'block' } }, row?.stat?.total_cr_live_caps + '%'),
                h(
                    'small',
                    { style: { 'text-align': 'center', display: 'block' } },
                    `${row?.stat?.total_ftd_live_caps} ftds / ${row?.stat?.total_live_caps} leads`
                ),
            ]
        }
    },
    Enabled() {
        if (is_access_edit) {
            return (value: boolean, row: any) => ToggleSwitchApiCell('PUT', `/broker/broker_caps/enable/${row._id}`, row, 'enable_traffic')
        }
        return (value: boolean) => [h('div', { innerHTML: value ? 'Yes' : 'No' })]
    },
    Note() {
        return (value: boolean) => [
            h('div', {
                title: value,
                style: 'max-width: 200px;word-break: break-all;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;',
                innerHTML: value,
            }),
        ]
    },
    TotalCap() {
        return {
            initial: {
                caps: { leads: 0, ftd: 0 },
                live: { leads: 0, ftd: 0 },
            },
            add(state: any, value: any, row: any) {
                state.caps[row.cap_type] += parseInt(row.daily_cap) || 0
                state.live[row.cap_type] += parseInt(row.live_caps) || 0
                return state
            },
            render(state: any) {
                return [
                    h('div', [state.caps.leads ? `Leads: ${state.live.leads} / ${state.caps.leads}` : null]),
                    h('div', [state.caps.ftd ? `FTD: ${state.live.ftd} / ${state.caps.ftd}` : null]),
                ]
            },
        }
    },
}
