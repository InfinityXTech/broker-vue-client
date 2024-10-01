import axios, { AxiosInstance } from 'axios'

import { useUserSession } from '/@src/stores/userSession'
import { useClients } from '/@src/stores/clients'
import { useSystem } from '/@src/stores/system'
import { hasOwn } from '@vue/shared'

let api: AxiosInstance

export function createApi() {
    let url = import.meta.env.VITE_API_BASE_URL
    if (import.meta.env.DEV) {
        url = import.meta.env.VITE_API_HOST + url
    }

    axios.defaults.withCredentials = false

    // Here we set the base URL for all requests made to the api
    api = axios.create({ baseURL: url, withCredentials: false })

    // We set an interceptor for each request to
    // include Bearer token to the request if user is logged in
    api.interceptors.request.use(async (config) => {
        const userSession = useUserSession()

        const system = useSystem()

        const is_local = window.location.hostname.toLocaleLowerCase() == 'localhost' || window.location.hostname.toLocaleLowerCase() == '127.0.0.1'
        if (!is_local) {
            const clients = await useClients()
            if (clients.config.api_domain) {
                config.baseURL = clients.config.api_domain + '/api'
            }
        }

        config.headers = {
            ...config.headers,
            SessionHash: userSession.getSessionHash(),
            SystemId: system.active,
            // Authorization: `Bearer ${userSession.token}`,
        }

        // if (userSession.isLoggedIn) {
        if (userSession.token?.length > 0) {
            config.headers.Authorization = `Bearer ${userSession.token}`
        }

        const env = /environment=([^&\;]+)/.exec(document.cookie)
        if (env && env.length > 1) {
            config.headers['environment'] = env[1]
        }

        config.withCredentials = false

        return config
    })

    api.interceptors.response.use(undefined, (error) => {
        if (error.response.status == 401) {
            const data = error.response?.data
            if (!data?.__auth_code__) {
                if (hasOwn(data, 'google_relogin')) {
                    if (data.google_relogin == true) {
                        const userSession = useUserSession()
                        userSession.setToken('')
                        userSession.setNeedRelogin(true)
                    } else if (location.pathname.indexOf('/auth/login') < 0) {
                        location.href = '/auth/login?redirect=' + location.pathname

                        // it's not work in custom typescript. Only in setup
                        // router.push({
                        //     name: 'auth',
                        //     query: { redirect: route.fullPath },
                        // })
                    }
                }
            }
        }
        if (error.response.status == 403) {
            Promise.reject(error)
            window.location.href = '/403'
            // setTimeout(() => (window.location.href = '/403'), 1000)
        }
        return Promise.reject(error)
    })

    return api
}

export function useApi() {
    if (!api) {
        createApi()
    }
    return api
}
