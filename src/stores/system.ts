/**
 * This is a store that hold left panel state
 * It could be one of the ActivePanelId
 *
 * Using useStorage from @vueuse/core allow persistance storage accross tabs/sessions
 *
 * We can import and set activePanel anywhere in our project
 * @see /src/components/partials/toolbars/Toolbar.vue
 * @see /src/components/partials/panels/ActivityPanel.vue
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { useUserSession } from '/@src/stores/userSession'
import { useApi } from '/@src/composable/useApi'

export type SystemId = 'crm' | 'marketing' | 'data'

export const systemOptions = [
    { value: 'crm', label: 'CRM' },
    { value: 'marketing', label: 'Marketing' },
    // { value: 'data', label: 'Data' },
]

export const useSystem = defineStore('system', () => {
    const active = useStorage<SystemId>('active-system', 'crm')

    const updateProfile = async () => {
        try {
            const userSession = useUserSession()
            const api = useApi()

            const { data: user } = await api.get('/auth/profile')
            userSession.setUser(user)
        } catch (err) {}
    }

    function setActive(systemId: SystemId) {
        active.value = systemId
        updateProfile()
    }

    return {
        active,
        setActive,
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
    import.meta.hot.accept(acceptHMRUpdate(useSystem, import.meta.hot))
}
