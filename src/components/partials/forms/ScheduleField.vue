<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useDictionary } from '/@src/composable/useDictionary'
import { LayoutSize } from '/@src/utils/layout-size'

export interface ScheduleFieldValue {
    [day: number]: number[] | undefined
    '1'?: number[]
    '2'?: number[]
    '3'?: number[]
    '4'?: number[]
    '5'?: number[]
    '6'?: number[]
    '7'?: number[]
    timezone?: string
}
export interface ScheduleFieldEmits {
    (e: 'update:modelValue', value: ScheduleFieldValue): void
}
export interface ScheduleFieldProps {
    label?: string
    layout?: LayoutSize
    modelValue?: ScheduleFieldValue
    readonly?: boolean
    errors?: string[]
}

const emit = defineEmits<ScheduleFieldEmits>()
const props = withDefaults(defineProps<ScheduleFieldProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
    readonly: false,
})

const dictionary = useDictionary().load({ dictionary: 'timezones' })

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const timetable: Record<number, Record<number, { hover: boolean; blocked: boolean }>> = reactive({})

const onHover = (enable: boolean, day: null | number, hour: null | number) => {
    const days = day === null ? [1, 2, 3, 4, 5, 6, 7] : [day]
    const hours = hour === null ? [...Array(24).keys()] : [hour]
    days.forEach((day) => hours.forEach((hour) => (timetable[day][hour].hover = enable)))
}

const onUpdateTimezone = (timezone: string) => {
    const value: ScheduleFieldValue = Object.assign({}, props.modelValue)
    if (timezone) {
        value.timezone = timezone
    } else {
        delete value.timezone
    }
    emit('update:modelValue', value)
}

const onClick = (day: null | number, hour: null | number) => {
    const days = day === null ? [1, 2, 3, 4, 5, 6, 7] : [day]
    const hours = hour === null ? [...Array(24).keys()] : [hour]
    let blocked: boolean | undefined
    days.forEach((day) =>
        hours.forEach((hour) => {
            if (blocked === undefined) {
                blocked = !timetable[day][hour].blocked
                // by hour
                if (hours.length > 1) {
                    hours.forEach((h) => {
                        if (!timetable[day][h].blocked) {
                            blocked = true
                        }
                    })
                }
                // by day
                if (days.length > 1) {
                    days.forEach((d) => {
                        if (!timetable[d][hour].blocked) {
                            blocked = true
                        }
                    })
                }
            }
            timetable[day][hour].blocked = blocked
        })
    )

    const value: ScheduleFieldValue = {}
    if (props.modelValue?.timezone) {
        value.timezone = props.modelValue?.timezone
    }
    for (let i = 1; i <= 7; i++) {
        const row: number[] = []
        for (let j = 0; j < 24; j++) {
            if (timetable[i][j].blocked) {
                row.push(j)
            }
        }
        if (row.length > 0) {
            value[i] = row
        }
    }
    emit('update:modelValue', value)
}

const clear = () => {
    for (let i = 1; i <= 7; i++) {
        timetable[i] = {}
        for (let j = 0; j < 24; j++) {
            timetable[i][j] = { hover: false, blocked: false }
        }
    }
}

const init = () => {
    clear()
    for (let i = 1; i <= 7; i++) {
        for (let j = 0; j < 24; j++) {
            timetable[i][j].blocked = (props.modelValue?.[i]?.indexOf(j) ?? -1) >= 0
        }
    }
}
watch(() => props.modelValue, init)
init()
</script>

<template>
    <VField class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <table class="schedule">
                <tr>
                    <td></td>
                    <td
                        v-for="hour in Array(24).keys()"
                        :key="hour"
                        class="hour"
                        @mouseenter="onHover(true, null, hour)"
                        @mouseleave="onHover(false, null, hour)"
                        @focusin="onHover(true, null, hour)"
                        @focusout="onHover(false, null, hour)"
                        @click="onClick(null, hour)"
                        @keydown.space.prevent="onClick(null, hour)"
                    >
                        {{ hour < 10 ? '0' + hour : hour }}
                    </td>
                </tr>
                <tr v-for="(day, index) in days" :key="day">
                    <td
                        class="day"
                        @mouseenter="onHover(true, index + 1, null)"
                        @mouseleave="onHover(false, index + 1, null)"
                        @focusin="onHover(true, index + 1, null)"
                        @focusout="onHover(false, index + 1, null)"
                        @click="onClick(index + 1, null)"
                        @keydown.space.prevent="onClick(index + 1, null)"
                    >
                        {{ day }}
                    </td>
                    <td
                        v-for="hour in Array(24).keys()"
                        :key="day + '_' + hour"
                        class="day-hour"
                        :class="[timetable[index + 1][hour].blocked && 'is-blocked', timetable[index + 1][hour].hover && 'is-hover']"
                        @mouseenter="onHover(true, index + 1, hour)"
                        @mouseleave="onHover(false, index + 1, hour)"
                        @focusin="onHover(true, index + 1, hour)"
                        @focusout="onHover(false, index + 1, hour)"
                        @click="onClick(index + 1, hour)"
                        @keydown.space.prevent="onClick(index + 1, hour)"
                    />
                </tr>
            </table>
        </VControl>
        <label>Timezone</label>
        <VControl :has-error="!!errors">
            <Multiselect
                :model-value="modelValue?.timezone ?? ''"
                :loading="dictionary.isLoading"
                :options="dictionary.options"
                :disabled="props.readonly"
                :searchable="true"
                :can-clear="false"
                :can-deselect="false"
                mode="single"
                placeholder="Select Timezone"
                @update:model-value="onUpdateTimezone"
            />
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style lang="scss">
table.schedule {
    width: 100%;

    td {
        height: 25px;
        border: 1px solid var(--fade-grey);
    }

    .hour {
        cursor: pointer;
        text-align: center;
        color: var(--light-text);
    }

    .day {
        cursor: pointer;
        vertical-align: middle;
        padding: 0 1rem;
        color: var(--light-text);
    }

    .day-hour {
        cursor: pointer;

        &.is-hover {
            background: var(--light-blue) !important;

            &.is-blocked {
                background: var(--primary-grey) !important;
            }
        }

        &:not(.is-blocked) {
            background: var(--blue);
        }
    }
}

.is-dark {
    table.schedule {
        td {
            border: 1px solid var(--dark-sidebar-light-12);
        }
    }
}
</style>
