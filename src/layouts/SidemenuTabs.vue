<script setup lang="ts">
import { computed } from 'vue'
import { SidemenuConfig, useSidemenu } from '/@src/composable/useSidemenu'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'

export interface SidemenuTabsProps {
    config?: SidemenuConfig
    menuId?: string
}

const props = defineProps<SidemenuTabsProps>()
const sidemenu = useSidemenu()

const userSession = useUserSession()

const menu = computed(() => {
    const root = props.config ?? sidemenu.menu.value
    if (props.menuId === undefined) {
        return root
    }
    const queue = [root]
    while (queue.length > 0) {
        const item = queue.pop()
        if (item?.id == props.menuId) {
            return item
        }
        queue.push(...(item?.children ?? []))
    }
    return null
})

const get_uri_title = (menu: SidemenuConfig) => {
    if (menu.uri_title) {
        const api = useApi()
        const request = api.get(menu.uri_title)
        request.then((response) => (menu.title = response.data))
    }
}

const is_allow = (permission_name: string | undefined, menu_item: SidemenuConfig | undefined): boolean => {
    if (permission_name) {
        const permission = userSession.permissions(permission_name ?? '')
        if (menu_item?.access) {
            return permission && permission.is_allow(...menu_item?.access)
        }
    }
    return true
}
const only_allows = (permission_name: string | undefined, children: SidemenuConfig[] | undefined): SidemenuConfig[] => {
    return (
        children?.filter((menu_item: SidemenuConfig) => {
            const allow = is_allow(menu_item?.permission_name ?? permission_name, menu_item)
            if (allow) {
                get_uri_title(menu_item)
            }
            return allow
        }) ?? []
    )
}
</script>

<template>
    <div class="tabs-wrapper">
        <div class="tabs-inner">
            <div class="tabs is-centered">
                <ul>
                    <li v-for="item in only_allows(menu?.permission_name, menu?.children)" :key="item.title">
                        <RouterLink v-if="item.to" :to="item.to">
                            <VIcon v-if="item.icon" :icon="item.icon" />
                            {{ item.title }}
                        </RouterLink>
                        <template v-else>
                            <VIcon v-if="item.icon" :icon="item.icon" />
                            {{ item.title }}
                        </template>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.tabs-wrapper .tabs a {
    padding: 0.5em 0.97em;
}
</style>