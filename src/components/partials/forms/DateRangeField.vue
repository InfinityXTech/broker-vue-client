<script lang="ts">
const today = startOfToday()
const Format = 'dd.MM.yyyy'
export const DefaultTimeRange = format(today, Format) + ' - ' + format(today, Format)
export const Last3DaysTimeRange = format(addDays(today, -2), Format) + ' - ' + format(today, Format)
</script>
<script setup lang="ts">
import { computed } from 'vue'
import { LayoutSize } from '/@src/utils/layout-size'
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, parse, startOfMonth, startOfToday, startOfWeek } from 'date-fns'
// import Datepicker from '@vuepic/vue-datepicker'
// import '@vuepic/vue-datepicker/dist/main.css'
import DateRangePicker from 'daterange-picker-vue3'
import 'daterange-picker-vue3/dist/daterange-picker-vue3.css'

// export interface DateRange {
//     0: Date
//     1: Date
// }
export interface Range2 {
    startDate: Date
    endDate: Date
}
export type DateFieldValue = string
export interface DateFieldEmits {
    (e: 'update:modelValue', value: DateFieldValue): void
}
export interface DateFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: DateFieldValue
    readonly?: boolean
    default?: boolean
    calendarClassName?: string
    menuClassName?: string
}

const emit = defineEmits<DateFieldEmits>()
const props = withDefaults(defineProps<DateFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    readonly: false,
    default: true,
    calendarClassName: undefined,
    menuClassName: undefined,
})

// const presets = [
//     { label: 'Today', range: [today, today] },
//     { label: 'Yesterday', range: [addDays(today, -1), addDays(today, -1)] },
//     { label: 'Last 3 Days', range: [addDays(today, -2), today] },
//     { label: 'Last 7 Days', range: [addDays(today, -6), today] },
//     { label: 'Last 30 Days', range: [addDays(today, -29), today] },
//     { label: 'This Month', range: [startOfMonth(today), today] },
//     { label: 'Last Month', range: [startOfMonth(addMonths(today, -1)), endOfMonth(addMonths(today, -1))] },
//     { label: 'Last 3 Months', range: [startOfMonth(addMonths(today, -3)), endOfMonth(addMonths(today, -1))] },
// ]

// const onUpdate = (value: DateRange) => {
//     emit('update:modelValue', format(value[0], Format) + ' - ' + format(value[1], Format))
// }
// const range = computed(() => {
//     const [start, end] = props.modelValue?.split(' - ') ?? ['', '']
//     return [parse(start, Format, new Date()), parse(end, Format, new Date())]
// })

// calendar 2

const range2 = computed(() => {
    if (props.default && !props.modelValue) {
        return { startDate: today, endDate: today }
    }
    const [start, end] = props.modelValue?.split(' - ') ?? ['', '']
    return { startDate: parse(start, Format, today), endDate: parse(end, Format, today) }
})

const ranges2 = computed(() => ({
    Today: [today, today],
    Yesterday: [addDays(today, -1), addDays(today, -1)],
    'Last 3 Days': [addDays(today, -2), today],
    // 'Last 7 Days': [addDays(today, -6), today],
    'This Week': [startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 })],
    'Last Week': [startOfWeek(addWeeks(today, -1), { weekStartsOn: 1 }), endOfWeek(addWeeks(today, -1), { weekStartsOn: 1 })],
    'Last 30 Days': [addDays(today, -29), today],
    'This Month': [startOfMonth(today), today],
    'Last Month': [startOfMonth(addMonths(today, -1)), endOfMonth(addMonths(today, -1))],
    'Last 3 Months': [startOfMonth(addMonths(today, -3)), endOfMonth(today)],
    'Past 3 Months': [startOfMonth(addMonths(today, -3)), endOfMonth(addMonths(today, -1))],
}))

const onUpdate2 = (value: Range2) => {
    emit('update:modelValue', format(value.startDate, Format) + ' - ' + format(value.endDate, Format))
}

const onUpdate2Input = (value: any) => {
    const [start, end] = value.target.value.split(' - ') ?? ['', '']
    emit('update:modelValue', start + ' - ' + end)
}
</script>

<template>
    <div class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <VField>
            <label>{{ props.label }}</label>
            <VControl>
                <!-- <Datepicker
                    auto-apply
                    range
                    multi-calendars
                    text-input
                    :clearable="false"
                    :preset-ranges="presets"
                    :format="Format"
                    placeholder="Select date range"
                    :enable-time-picker="false"
                    :model-value="range"
                    :calendar-class-name="props.calendarClassName"
                    :menu-class-name="props.menuClassName"
                    @update:model-value="onUpdate"
                /> -->
                <DateRangePicker
                    ref="picker"
                    v-model="range2"
                    :opens="'right'"
                    :locale-data="{ firstDay: 1, format: Format }"
                    :date-range="{ startDate: null, endDate: null }"
                    :ranges="ranges2"
                    :time-picker="false"
                    :time-picker24-hour="false"
                    :show-week-numbers="false"
                    :show-dropdowns="true"
                    :auto-apply="true"
                    :always-show-calendars="false"
                    :close-on-esc="true"
                    :linked-calendars="false"
                    @update="onUpdate2"
                >
                    <template #input="picker">
                        <!-- <i class="glyphicon glyphicon-calendar fa fa-calendar"></i>&nbsp; -->
                        <input
                            type="text"
                            class="input"
                            :value="format(range2.startDate, Format) + ' - ' + format(range2.endDate, Format)"
                            @change="onUpdate2Input"
                        />
                        <!-- <b class="caret"></b> -->
                    </template>
                </DateRangePicker>
            </VControl>
        </VField>
    </div>
</template>

<style lang="scss">
.dp__main {
    min-width: 180px;
}

[aria-label*='Datepicker'] {
    border-radius: var(--ms-radius, 4px);
}

.is-dark {
    [aria-label*='Datepicker'] {
        background: var(--dark-sidebar) !important;
        border: 1px solid var(--dark-sidebar-light-8) !important;

        .dp__range_between,
        .dp__range_end,
        .dp__range_start,
        .dp__active_date {
            background: var(--dark-sidebar-light-6) !important;
            color: var(--dark-text) !important;
            font-weight: bold;
            border-color: var(--dark-sidebar-light-6);
        }

        .dp__input {
            background-color: var(--dark-sidebar-light-2);
            border-color: var(--dark-sidebar-light-4);
            color: var(--dark-dark-text);
        }

        .dp__arrow_top {
            border-color: var(--dark-sidebar) !important;
            background: var(--dark-sidebar) !important;
        }

        .dp__preset_range:hover,
        .dp__month_year_select:hover {
            background: var(--dark-sidebar-light-4) !important;
            color: var(--dark-text) !important;
        }
    }
}
</style>
<style lang="scss">
.is-dark {
    .daterangepicker::before,
    .daterangepicker::after {
        border-bottom-color: var(--dark-sidebar-light-4) !important;
    }

    .daterangepicker {
        background: var(--dark-sidebar-light-4) !important;
        color: var(--dark-text) !important;
        border-color: var(--dark-sidebar-light-4) !important;

        .calendars-container,
        .calendar-table,
        .calendar-table th,
        .calendar-table td:not(.active, .in-range, .weekend),
        .calendar-table select,
        .calendar-table input {
            background: var(--dark-sidebar-light-4) !important;
            color: var(--dark-text) !important;
        }

        .calendar-table {
            border-color: var(--dark-sidebar-light-4) !important;

            .prev span,
            .next span {
                color: var(--dark-text) !important;
                border-color: var(--dark-text) !important;
            }

            td.active,
            td.in-range {
                background: var(--dark-sidebar-light-20) !important;
                color: silver !important;
            }

            .weekend {
                background: var(--dark-sidebar-light-8) !important;
                color: silver !important;
            }
        }
    }
}

.daterangepicker {
    &.single.show-ranges:not(.hide-calendars) {
        min-width: 381px !important;
    }
}

.vue-daterange-picker {
    width: 100%;

    .form-control.reportrange-text {
        padding: 0;
        width: 100%;
        border: 0;
        border-radius: 3px;
    }

    input {
        width: 100%;
        border-radius: 0;
    }
}
</style>