import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isString, useStorage } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
// import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useUserSession } from '/@src/stores/userSession'

export interface NotificationIcon {
    src?: string
    size?: string
}
export interface NotificationItem {
    icon?: NotificationIcon | string | undefined
    link?: string
    info?: string | { name: string; value: string }
    time?: Date
    level?: 'warning' | 'dangerous'
}

export interface NotificationData {
    items: Record<number, NotificationItem>
}

export type NotificationStorageSchema = {
    lastSync: number
    lock: boolean
}

export const useNotifications = defineStore('useNotifications', () => {
    // token will be synced with local storage
    // @see https://vueuse.org/core/usestorage/
    const _notifications = ref<NotificationData>({ items: {} })
    const ttl = 1000 * 60 // 1 minute
    const storage = useStorage<NotificationStorageSchema>('sync-notifications', { lastSync: new Date().getTime(), lock: false })

    const userSession = useUserSession()

    let lastPusherSync: number | null = null

    // pusher
    const VITE_PUSHER_APP_KEY = import.meta.env.VITE_PUSHER_APP_KEY
    const VITE_PUSHER_APP_CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER
    if (isString(VITE_PUSHER_APP_KEY) && VITE_PUSHER_APP_KEY.length > 0) {
        const user = userSession.user ?? {}

        // Enable pusher logging - don't include this in production
        if (import.meta.env.DEV) {
            // Pusher.logToConsole = true
        }
        const pusher = new Pusher(VITE_PUSHER_APP_KEY, {
            cluster: VITE_PUSHER_APP_CLUSTER as string,
            // forceTLS: true,
            authEndpoint: import.meta.env.VITE_API_BASE_URL + 'broadcasting/auth',
            auth: {
                headers: {
                    Authorization: 'Bearer ' + user.token,
                },
            },
        })

        const channel = pusher.subscribe((import.meta.env.DEV ? '' : 'production.') + 'notifications.user.' + user.id)
        channel.bind('message', function (data: any) {
            storage.value.lastSync = new Date().getTime()
            lastPusherSync = new Date().getTime()
            _notifications.value.items = []
            if (data?.message?.data) {
                data.message.data.forEach((notificationItem: NotificationItem) => {
                    push(notificationItem)
                })
            }
        })

        const channel_general = pusher.subscribe((import.meta.env.DEV ? '' : 'production.') + 'notifications')
        channel_general.bind('message', function (data: any) {
            storage.value.lastSync = new Date().getTime()
            lastPusherSync = new Date().getTime()
            _notifications.value.items = []
            if (data?.message?.data) {
                data.message.data.forEach((notificationItem: NotificationItem) => {
                    push(notificationItem)
                })
            }
        })
    }

    // storage.value.lock = false
    // let lock: boolean = false

    const hashCode = (str: string): number => {
        let h: number = 0
        for (let i = 0; i < str.length; i++) {
            h = 31 * h + str.charCodeAt(i)
        }
        return h // & 0xffffffff
    }

    const push = (notification: NotificationItem): number => {
        if (!_notifications.value.items) {
            _notifications.value.items = {}
        }

        const hash = hashCode(JSON.stringify(notification))
        _notifications.value.items[hash] = notification
        return hash
    }

    const remove = (hash: number): boolean => {
        if (_notifications.value.items[hash]) {
            delete _notifications.value.items[hash]
            return true
        }
        return false
    }

    const refresh = (force: boolean = false) => {
        if (!userSession.isLoggedIn) {
            return
        }

        // if (!force && (lock || storage.value.lock)) {
        //     return
        // }

        // if (!force && storage.value.lastSync) {
        //     const diff = new Date().getTime() - storage.value.lastSync
        //     if (diff < ttl) {
        //         return
        //     }
        // }

        if (!force && lastPusherSync != null) {
            const diff = new Date().getTime() - lastPusherSync
            if (diff < ttl * 2) {
                return
            }
        }

        // storage.value.lastSync = new Date().getTime()
        // storage.value.lock = lock = true

        const api = useApi()
        api.get('/notifications').then((response: any) => {
            // storage.value.lock = lock = false
            _notifications.value.items = []
            if (response?.data) {
                response?.data.forEach((notificationItem: NotificationItem) => {
                    push(notificationItem)
                })
            }
        })
    }

    const notifications = computed<NotificationItem[]>(() => {
        return Object.values(_notifications.value.items)
    })

    refresh(true)
    setInterval(refresh, ttl)

    return {
        push,
        remove,
        refresh,
        notifications,
    } as const
})

/**
 * Pinia supports Hot Module replacement so you can edit your stores and
 * interact with them directly in your app without reloading the page.
 *
 * @see https://pinia.esm.dev/cookbook/hot-module-replacement.html
 * @see https://vitejs.dev/guide/api-hmr.html
 */
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useNotifications, import.meta.hot))
}
