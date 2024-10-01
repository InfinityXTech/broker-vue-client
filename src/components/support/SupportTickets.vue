<script setup lang="ts">
import { h, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { DateTime } from '/@src/utils/datatable/simple-render'
import { DatatablePagination } from '/@src/components/partials/tables/Datatable.vue'
import SchemeList from '/@src/schemes/support/supportList.json'

export interface SupportTicketsProps {
    uri?: string
    filter?: any
}

const props = withDefaults(defineProps<SupportTicketsProps>(), {
    uri: '/support/page/{page}',
    filter: undefined,
})

const pagination = ref<DatatablePagination>({ page: 1, count_in_page: 20, total_items: 0 })

const custom = {
    Ticket() {
        return (value: string, row: any) => {
            return [h(RouterLink, { to: { name: 'support-id', params: { id: row._id } }, target: '_blank' }, () => h('b', value)), h('br'), h('small', row._id)]
        }
    },
    AccountName() {
        return (value: any) => {
            return h('div', [h('div', value?.name), h('div', value?.account_email)])
        }
    },
    Category() {
        return (value: any) => {
            return h('div', [h('div', value)])
        }
    },
    AssignedName() {
        return (value: any, row: any) => {
            // return h('div', [h('div', value?.name), h('div', value?.account_email)])
            // console.log(row.assigned_to_users_data)
            const users = (row.assigned_to_users_data ?? []).map((user: any) => user.name + ' (' + user.account_email + ')').join(', ')
            return h('div', users)
        }
    },
    Timestamp() {
        return (value: any, row: any) => {
            let items = [h('div', [h('b', 'Created At: '), h('span', DateTime()(row.timestamp))])]
            if (row.timestamp_progress) {
                if (row.timestamp_progress.finished) {
                    items.push(h('div', [h('b', 'Finished: '), h('span', DateTime()(row.timestamp_progress.finished))]))
                }
                if (row.timestamp_progress.opened) {
                    items.push(h('div', [h('b', 'Open: '), h('span', row.timestamp_progress.opened)]))
                }
                if (row.timestamp_progress.taken) {
                    items.push(h('div', [h('b', 'Taken: '), h('span', row.timestamp_progress.taken)]))
                }
            }
            return items
        }
    },
}

watch(props, () => {})
</script>

<template>
    <div class="support_ticket">
        <Datatable :columns="SchemeList.columns" method="POST" :pagination="pagination" :uri="props.uri" :custom="custom" :form-data="props.filter" />
    </div>
</template>

<style lang="scss">
</style>
