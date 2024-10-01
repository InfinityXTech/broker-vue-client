<script setup lang="ts">
import { ref, watch } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { format } from 'date-fns'
import { FormComponent, FormCheckComponentAccess } from '/@src/components/partials/Form.vue'
import Scheme from '/@src/schemes/support/supportEdit.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'
// import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'
import ChatCard from '/@src/components/partials/chat/ChatCard.vue'
import ChatMsg from '/@src/components/partials/chat/ChatMsg.vue'
import { DateTime } from '/@src/utils/datatable/simple-render'
import { useUserSession } from '/@src/stores/userSession'

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
const api = useApi()
const userSession = useUserSession()
const viewWrapper = useViewWrapper()

const supportData = ref<any>({})

const onFetched = (data: any) => {
    supportData.value = data
    viewWrapper.setPageTitle('Support Ticket #' + data.ticket_number)
}
const onStored = () => {
    notif.success('Updated Successfully')
}

const chat = (function () {
    const loading = ref(false)
    const messages = ref<Message[]>([])

    watch(
        () => supportData.value,
        () => {
            messages.value = supportData?.value?.comments.map((x: any) => {
                return {
                    id: x._id,
                    conversationId: 0,
                    messageId: x._id,
                    type: 'msg', //system
                    sender: x.current_user_id == x.created_by ? 'self' : 'other',
                    avatar: 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=' + x.created_by_user?.name,
                    content: {
                        text: x.comment,
                        time: DateTime()(x.timestamp),
                    },
                }
            })
        }
    )

    const addConversationOpen = () => {}
    const setAddConversationOpen = () => {}
    return {
        messages,
        loading,
        addConversationOpen,
        setAddConversationOpen,
    }
})()

const sendMessage = async (message: any) => {
    const response = await api.post('/support/' + props.id + '/send_comment', { comment: message })
    if (response.data) {
        const dt = new window.Date()
        const Format = 'dd.MM.yyyy'
        const time = format(dt, Format) + ' ' + dt.toLocaleTimeString()

        const username = userSession?.user?.name
        chat.messages.value.push({
            id: 0,
            conversationId: 0,
            messageId: 0,
            type: 'msg', //system
            sender: 'self',
            avatar: 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=' + username,
            content: {
                text: message,
                time: time,
            },
        })
    }
    // console.log(response.data)
}

const checkComponentAccess: FormCheckComponentAccess = (component: FormComponent): boolean => {
    if (!supportData.value.broker_api_documentstion && component.data == 'broker_api_documentstion') {
        return false
    }
    if (!supportData.value.broker && component.data == 'broker') {
        return false
    }
    if (!supportData.value.traffic_endpoint && component.data == 'traffic_endpoint') {
        return false
    }
    if (supportData.value.type != 5) {
        if (supportData.value.broker && component.data == 'traffic_endpoint') {
            return false
        }
        if (supportData.value.traffic_endpoint && component.data == 'broker') {
            return false
        }
    }
    return true
}
</script>

<template>
    <ApiForm
        :wrapper="ThinPage"
        title="Support Ticket"
        :fetch-data="'/support/' + props.id"
        store-on="delay"
        :scheme="Scheme"
        store-label="Update"
        store-method="post"
        :store-data="'/support/update/' + props.id"
        :check-component-access="checkComponentAccess"
        @fetch-data="onFetched"
        @store-data="onStored"
    />

    <div class="thin-page-wrapper chat">
        <!-- Chat Card -->
        <ChatCard @send-message="sendMessage">
            <template #body>
                <!-- <li v-if="chat.messages.value.length === 0" class="no-messages">
                    <img class="light-image" src="/@src/assets/illustrations/placeholders/search-4.svg" alt="" />
                    <img class="dark-image" src="/@src/assets/illustrations/placeholders/search-4-dark.svg" alt="" />
                    <div class="text">
                        <h3>No messages yet</h3>
                        <p>Start the conversation by typing a message</p>
                    </div>
                </li> -->

                <ChatMsg v-for="message in chat.messages.value" :key="message.id" :message="message" />

                <li class="chat-loader" :class="[chat.loading.value && 'is-active']">
                    <div class="loader is-loading"></div>
                </li>
            </template>
        </ChatCard>
    </div>
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

.message-field-wrapper {
    padding: 0;

    .add-content,
    .typing-indicator,
    .add-emoji {
        display: none !important;
    }

    #chat-input {
        padding-left: 16px;
    }
}

.thin-page-wrapper {
    &.chat {
        margin-top: -54px;
    }
}
</style>