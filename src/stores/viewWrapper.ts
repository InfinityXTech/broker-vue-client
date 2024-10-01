import { ref, VNode } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { isFunction } from '@vueuse/core'

export interface PageTitleFields {
    title?: string
    html?: string
}
export type PageTitleFunc = () => PageTitleFields

export const useViewWrapper = defineStore('viewWrapper', () => {
    const isPushed = ref(false)
    const isPushedBlock = ref(false)
    const pageTitle = ref('Welcome')
    const pageTitleHtml = ref<string | undefined>(undefined)
    const pageTitleNodes = ref<VNode[] | undefined>(undefined)

    function setPushed(value: boolean) {
        isPushed.value = value
    }
    function setPushedBlock(value: boolean) {
        isPushedBlock.value = value
    }
    function setPageTitle(value: string) {
        pageTitle.value = value
        document.title = value
        pageTitleHtml.value = undefined
        pageTitleNodes.value = undefined
    }
    function setPageTitleHtml(value: string, html: string) {
        pageTitle.value = value
        pageTitleHtml.value = html
        document.title = value
    }
    function setPageTitleVNodes(value: string, nodes: VNode[]) {
        // pageTitle.value = value
        pageTitleNodes.value = nodes
        document.title = value
    }
    function setPageTitleFunc(value: PageTitleFunc) {
        if (isFunction(value)) {
            const v = value()
            pageTitle.value = v.html ?? v.title ?? ''
            document.title = v.title ?? ''
        }
    }

    return {
        isPushed,
        isPushedBlock,
        pageTitle,
        pageTitleHtml,
        pageTitleNodes,
        setPushed,
        setPushedBlock,
        setPageTitle,
        setPageTitleHtml,
        setPageTitleVNodes,
        setPageTitleFunc,
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
    import.meta.hot.accept(acceptHMRUpdate(useViewWrapper, import.meta.hot))
}
