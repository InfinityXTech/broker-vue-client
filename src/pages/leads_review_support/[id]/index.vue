<script setup lang="ts">
import { ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotifications } from '/@src/stores/notifications'
import { useNotyf } from '/@src/composable/useNotyf'
import Scheme from '/@src/schemes/leads_review/supportEdit.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'

export interface SupportProps {
    id: string
}

export interface Conversation {
    id: number
    name: string
    lastMessage: string
    unreadMessages: boolean
    avatar: string
}

export interface Message {
    id: number
    conversationId: number
    messageId: number
    type: 'msg' | 'image' | 'imagelink' | 'system'
    sender: string | null
    avatar: string | null
    content: {
        time: string | null
        text?: string
        subtext?: string
        image_url?: string
        link_image?: string
        link_badge?: string
    }
}

const props = defineProps<SupportProps>()

const notif = useNotyf()
const notifications = useNotifications()
const viewWrapper = useViewWrapper()

const supportData = ref<any>({})

const onFetched = (data: any) => {
    supportData.value = data
    viewWrapper.setPageTitle('Leads Review Support Ticket #' + data.ticketNumber)
}
const onStored = () => {
    notifications?.refresh()
    notif.success('Updated Successfully')
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title="Support Ticket"
        :fetch-data="'/leads_review/tickets/' + props.id"
        :scheme="Scheme"
        store-label="Update"
        store-method="post"
        store-on="delay"
        :store-data="'/leads_review/tickets/update/' + props.id"
        @fetch-data="onFetched"
        @store-data="onStored"
    />
</template>

<style lang="scss">
.wide-vertical-block {
    .field > label {
        width: 160px;
    }

    .field > .control {
        width: calc(100% - 160px);
    }
}
</style>