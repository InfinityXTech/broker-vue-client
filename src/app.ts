import { createApp as createClientApp, h, Suspense } from 'vue'

import { createHead } from '@vueuse/head'
import { createPinia } from 'pinia'
import { createRouter } from './router'
import VueroApp from './VueroApp.vue'
import './styles'

import { initDarkmode } from '/@src/stores/darkmode'
import { createApi } from '/@src/composable/useApi'

import { useClients } from '/@src/stores/clients'

import VueHighlightJS from 'vue3-highlightjs'
import 'highlight.js/styles/a11y-light.css'

export type VueroAppContext = Awaited<ReturnType<typeof createApp>>

import { registerGlobalComponents, registerRouterNavigationGuards } from './app-custom'

export async function createApp() {
    const head = createHead()
    const router = createRouter()
    const pinia = createPinia()
    const api = createApi()

    const clients = await useClients()
    const clientConfig = clients.config
    const favicon_url = clientConfig.favicon_url

    const createFavicon = (favicon_url: string, mime: string) => {
        let favicon = document.querySelector('link[rel="icon"]')
        if (favicon) {
            favicon.setAttribute('type', mime)
            favicon.setAttribute('href', favicon_url)
        } else {
            favicon = document.createElement('link')
            favicon.setAttribute('rel', 'icon')
            favicon.setAttribute('type', mime)
            favicon.setAttribute('href', favicon_url)
            document.getElementsByTagName('head')[0].appendChild(favicon)
        }
    }
    document
        .querySelectorAll('link[rel=apple-touch-icon], link[rel=icon], link[rel="shortcut icon"], meta[name=msapplication-TileImage]')
        .forEach((e) => e.remove())

    createFavicon('/favicon-16x16.png', 'image/png')

    const app = createClientApp({
        // This is the global app setup function
        setup() {
            /**
             * Initialize the darkmode watcher
             *
             * @see /@src/stores/darkmode
             */
            initDarkmode()

            /**
             * Here we are creating a render function for our main app with
             * the main VueroApp component, wrapped in a Suspense component
             * to handle async loading of the app.
             * Template equivalent would be:
             *
             * <template>
             *   <Susupense>
             *     <VueroApp />
             *   </Susupense>
             * </template>
             */
            return () => {
                /**
                 * The Suspense component is needed to use async in child components setup
                 * @see https://v3.vuejs.org/guide/migration/suspense.html
                 */
                return h(Suspense, null, {
                    default: () => h(VueroApp),
                })
            }
        },
    })

    const vuero = {
        app,
        api,
        router,
        head,
        pinia,
    }

    await registerGlobalComponents(vuero)
    app.use(vuero.pinia)
    app.use(vuero.head)

    registerRouterNavigationGuards(vuero)
    app.use(vuero.router)

    app.use(VueHighlightJS)

    return vuero
}
