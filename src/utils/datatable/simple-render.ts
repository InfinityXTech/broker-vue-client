import { h } from 'vue'
import { DatatableColumn } from '/@src/components/partials/tables/Datatable.vue'
import VTag, { VTagColor } from '/@src/components/base/tags/VTag.vue'
import VPlaceHolder from '/@src/components/partials/general/VPlaceHolder.vue'
import { format } from 'date-fns'
import { isNumber } from '@vueuse/shared'
import { isString, hasOwn } from '@vue/shared'
import { useDownload } from '/@src/composable/useDownload'

const Format = 'dd.MM.yyyy'
const download = useDownload()

interface Timestamp {
    $date: { $numberLong: number }
}

export function RenderLogs(row: any): Record<string, any> {
    if (isString(row.action)) {
        return { class: row?.action && 'logs-' + row.action?.toLowerCase() }
    } else if (row.action?.value) {
        return { class: row?.action.value && 'logs-' + row.action.value?.toLowerCase() }
    }
    return { class: 'logs-' }
}

export function StatusTag(params?: any) {
    if (Object.keys(params ?? {}).length > 0) {
        return (value: number | string) => {
            const color = params[value] != undefined ? params[value].color : 'light'
            const label = params[value] != undefined ? params[value].title : 'Unknown'
            return h(VTag, {
                color: color,
                label: label,
            })
        }
    }

    return (value: number | boolean) => {
        if (value === true) {
            value = 1
        }
        if (value === false) {
            value = 0
        }
        const colors: VTagColor[] = ['orange', 'primary', 'light', 'light']
        const labels = ['PAUSED', 'ACTIVE', 'ARCHIVE', 'DRAFT']
        return h(VTag, {
            color: colors[value] ?? colors[0],
            label: labels[value] ?? labels[0],
        })
    }
}

export function Money(cents = true) {
    return (value: number) => {
        if (isString(value) && !isNaN(parseFloat(value)) && isFinite(value)) {
            value = parseFloat(value)
        }
        if (isNumber(value)) {
            const str = cents ? value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&\u00A0') : value.toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&\u00A0')
            return ('$' + str).replace('$-', '-$')
        }
        return value
    }
}

export function MoneyColor(cents = true) {
    return (value: number) => {
        if (isString(value) && !isNaN(parseFloat(value)) && isFinite(value)) {
            value = parseFloat(value)
        }
        if (isNumber(value)) {
            const str = cents ? value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&\u00A0') : value.toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&\u00A0')
            const money = ('$' + str).replace('$-', '-$')
            return h('span', { class: value < 0 ? 'danger-text' : value > 0 ? 'success-text' : undefined }, [money])
        }
        return value
    }
}

export function Percent() {
    return (value: number) => (isNumber(value) ? value.toFixed(2) + '%' : value)
}

export function UpperCase() {
    return (value: string) => value.toUpperCase()
}

export function Date() {
    return (value: Timestamp | string | undefined | null) => {
        try {
            if (isString(value) && value.length > 0) {
                const dt = new window.Date(value)
                return format(dt, Format)
            } else if (!isString(value) && value?.$date?.$numberLong) {
                const dt = new window.Date(+value.$date.$numberLong)
                return format(dt, Format)
            }
        } catch {}
        return value
    }
}

export function DateTime() {
    return (value: Timestamp | string | undefined | null) => {
        try {
            if (isString(value) && value.length > 0) {
                const dt = new window.Date(value)
                return format(dt, Format) + ' ' + dt.toLocaleTimeString()
            } else if (!isString(value) && value?.$date?.$numberLong) {
                const dt = new window.Date(+value.$date.$numberLong)
                return format(dt, Format) + ' ' + dt.toLocaleTimeString()
            }
        } catch {}
        return value
    }
}

export function Id() {
    return (value: { $oid: string }) => value.$oid
}

export function Index() {
    return (value: any, row: any, column: DatatableColumn, index: number) => index + 1
}

export function Files() {
    return (value: any[]) => {
        return value.map((file) =>
            h(VTag, {
                color: 'light',
                rounded: true,
                label: file.original_file_name,
                style: {
                    cursor: 'pointer',
                    margin: '1px',
                },
                onClick() {
                    download.get(`/storage/download/${file._id}`, file.original_file_name)
                },
            })
        )
    }
}

export function PlaceHolder() {
    return (value: any) => {
        return h(VPlaceHolder, { title: value.toString(), content: value.toString() })
    }
}

export function Html() {
    return (value: any) => {
        return h('span', { innerHTML: value })
    }
}
