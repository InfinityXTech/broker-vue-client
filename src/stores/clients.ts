/**
 * This is a store that hold the dark mode state
 * It could be auto (fit system preference), dark or light
 *
 * Using useStorage from @vueuse/core allow persistance storage accross tabs/sessions
 *
 * We can import and set isDark anywhere in our project
 * @see /src/components/navigation/LandingNavigation.vue
 * @see /src/components/partials/toolbars/Toolbar.vue
 */

// import { acceptHMRUpdate, defineStore } from 'pinia'
import axios from 'axios'

export interface Client {
    _id?: { $oid: string }
    nickname?: string
    api_domain?: string
    crm_domain?: string
    master_domain?: string
    partner_domain?: string
    favicon_url?: string
    login_background?: string
    logo_url_big?: string
    logo_url_small?: string
    status?: boolean
}

const getDomain = (url: string): string =>
    url
        .replace(/^(http|https):\/\//, '')
        .replace(/\/.+/, '')
        .toLowerCase()

const getJson = async (): Promise<Client> => {
    const is_local = window.location.hostname.toLocaleLowerCase() == 'localhost' || window.location.hostname.toLocaleLowerCase() == '127.0.0.1'
    const url_json = (is_local ? '/data/clients.json' : '/clients.php') + `?t=${new Date().getTime()}`
    const response = await axios.get(url_json, { baseURL: window.location?.origin as any })

    const clients: Client[] = response?.data as Client[]

    if (is_local && clients && clients.length > 0) {
        return clients[0]
    }

    const config = clients ? clients.find((x: Client) => x.crm_domain && getDomain(x.crm_domain ?? '') == getDomain(window.location.origin)) : null

    if (config) {
        return config
    }

    let url = import.meta.env.VITE_API_BASE_URL
    if (import.meta.env.DEV) {
        url = import.meta.env.VITE_API_HOST + url
    }

    return { api_domain: url } as Client
}

let config: Client | undefined = undefined

export const useClients = async () => {
    if (config == undefined) {
        config = await getJson()
    }
    return {
        config,
    }
}

/**
 * Pinia supports Hot Module replacement so you can edit your stores and
 * interact with them directly in your app without reloading the page.
 *
 * @see https://pinia.esm.dev/cookbook/hot-module-replacement.html
 * @see https://vitejs.dev/guide/api-hmr.html
 */
//  if (import.meta.hot) {
// import.meta.hot.accept(acceptHMRUpdate(useClients, import.meta.hot))
// }
