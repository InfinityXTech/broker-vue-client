<script setup lang="ts">
export interface FormatBlockedScheduleProps {
    data: any[]
}

const props = defineProps<FormatBlockedScheduleProps>()
</script>

<template>
    <span class="format-blocked-schedule-container">
        <Tippy interactive>
            <span v-for="(item, key) in props.data" :key="key" style="display: block">
                {{ item.schedule }}
            </span>
            <template #content>
                <div class="dataTable-wrapper">
                    <div class="dataTable-container">
                        <table class="dataTable-table table">
                            <thead>
                                <tr>
                                    <th scope="col">Traffic Endpoint</th>
                                    <th scope="col">Schedule</th>
                                    <th scope="col">Timezone</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, key) in props.data" :key="key">
                                    <td>
                                        {{ (item.traffic_endpoints ?? []).length > 0 ? item.traffic_endpoints.join(', ') : '' }}
                                    </td>
                                    <td>
                                        {{ item.schedule }}
                                    </td>
                                    <td>{{ item.timezone }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </template>
        </Tippy>
    </span>
</template>
