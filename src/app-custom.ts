import { defineAsyncComponent } from 'vue'
import { SetupCalendar } from 'v-calendar'
import { plugin as VueTippy } from 'vue-tippy'
import { START_LOCATION } from 'vue-router'
import ContextMenu from '@imengyu/vue3-context-menu'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'

import { useNotyf } from './composable/useNotyf'
import { useUserSession } from './stores/userSession'

import type { VueroAppContext } from './app'

// Lazy load aditional components
export async function registerGlobalComponents({ app }: VueroAppContext) {
    const background = (await import('./directives/background')).default
    const tooltip = (await import('./directives/tooltip')).default

    app.use(ContextMenu)
    app.use(SetupCalendar, {})
    app.use(VueTippy, {
        component: 'Tippy',
        defaultProps: {
            theme: 'light',
        },
    })

    app.component(
        // eslint-disable-next-line vue/multi-word-component-names
        'Multiselect',
        defineAsyncComponent({
            loader: () => import('@vueform/multiselect').then((mod) => mod.default),
            delay: 0,
            suspensible: false,
        })
    )
    app.component(
        // eslint-disable-next-line vue/multi-word-component-names
        'Slider',
        defineAsyncComponent({
            loader: () => import('@vueform/slider').then((mod) => mod.default),
            delay: 0,
            suspensible: false,
        })
    )
    app.component(
        'VCalendar',
        defineAsyncComponent({
            loader: () => import('v-calendar').then((mod) => mod.Calendar),
            delay: 0,
            suspensible: false,
        })
    )
    app.component(
        'VDatePicker',
        defineAsyncComponent({
            loader: () => import('v-calendar').then((mod) => mod.DatePicker),
            delay: 0,
            suspensible: false,
        })
    )

    app.directive('background', background)
    app.directive('tooltip', tooltip)
}

/**
 * Here we are setting up two router navigation guards
 *
 * We can add meta to pages either by declaring them manualy in the
 * routes declaration (see /@src/router.ts)
 * or by adding a <route> tag into .vue files (see /@src/pages/sidebar/dashboards.ts)
 *
 * <route lang="yaml">
 * meta:
 *   requiresAuth: true
 * </route>
 *
 * <script setup lang="ts">
 *  // TS script
 * </script>
 *
 * <template>
 *  // HTML content
 * </template>
 */
export function registerRouterNavigationGuards({ router, api }: VueroAppContext) {
    router.beforeEach(async (to, from) => {
        const userSession = useUserSession()
        const notyf = useNotyf()

        const checkAfterSuccessProfileUrl = () => {
            if (location.pathname == '/auth/login') {
                const params = new Proxy(new URLSearchParams(window.location.search), {
                    get: (searchParams, prop: string) => searchParams.get(prop),
                })
                const redirect = params?.redirect
                if (typeof redirect == 'string' && redirect.length > 0) {
                    location.href = redirect
                } else {
                    location.href = '/'
                }
            }
        }

        const onTabActive = async () => {
            if (!document.hidden) {
                try {
                    const { data: user } = await api.get('/auth/profile')
                    if (user?.token?.length > 0) {
                        // relogin in another tab
                        if (user?.token != userSession?.token) {
                            console.log('There was relogin in another tab')
                            userSession.setUser(user)
                            userSession.setSessionHash(user.session_hash)
                            notyf.success(`Welcome back, ${user.name}`)
                        }
                        userSession.setToken(user.token)
                    }
                    if (user?.token?.length > 0) {
                        checkAfterSuccessProfileUrl()
                    }
                } catch (err) {}
            }
        }
        document.removeEventListener('visibilitychange', onTabActive)
        document.addEventListener('visibilitychange', onTabActive)

        if (from === START_LOCATION && userSession.isLoggedIn) {
            // 1. If the name is not set, it means we are navigating to the first page
            // and we are logged in, so we should check user information from the server
            try {
                // Do api request call to retreive user profile.
                const { data: user } = await api.get('/auth/profile')
                userSession.setUser(user)
                if (user?.token?.length > 0 && user?.token != userSession?.token) {
                    userSession.setToken(user.token)
                }
                userSession.setSessionHash(user.session_hash)
                notyf.success(`Welcome back, ${user.name}`)

                checkAfterSuccessProfileUrl()
            } catch (err) {
                // delete stored token if it fails
                userSession.logoutUser()
                notyf.error('Your session is invalid')

                if (to.meta.requiresAuth) {
                    // redirect the user somewhere
                    return {
                        // Will follow the redirection set in /@src/pages/auth/index.vue
                        name: 'auth',
                        // save the location we were at to come back later
                        query: { redirect: to.fullPath },
                    }
                }
            }
        } else if (to.meta.requiresAuth && !userSession.isLoggedIn) {
            // 2. If the requires auth via requiresAuth meta, check if user is logged in
            // if not, redirect to login page.
            notyf.error({
                message: 'Sorry, you should loggin to access this section (anything will work)',
                duration: 7000,
            })

            return {
                // Will follow the redirection set in /@src/pages/auth/index.vue
                name: 'auth',
                // save the location we were at to come back later
                query: { redirect: to.fullPath },
            }
        }
    })
}
