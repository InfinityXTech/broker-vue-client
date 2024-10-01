<script setup lang="ts">
import { useSidemenu, SidemenuConfig } from '../composable/useSidemenu'
import { useUserSession } from '/@src/stores/userSession'

const userSession = useUserSession()
const sidemenu = useSidemenu()
const menu: any = sidemenu.menu

const is_allow = (permission_name: string, menu_item: SidemenuConfig): boolean => {
    if (permission_name) {
        const permission = userSession.permissions(permission_name)
        if (menu_item?.access) {
            return permission && permission.is_allow(...menu_item?.access)
        }
    }
    return true
}
const only_allows = (permission_name: string, children: SidemenuConfig[]): SidemenuConfig[] => {
    return children.filter((menu_item: SidemenuConfig) => is_allow(menu_item?.permission_name ?? permission_name, menu_item))
}
</script>

<template>
    <div class="mobile-subsidebar is-activity">
        <div class="inner">
            <div class="sidebar-title">
                <h3>{{ menu.title }}</h3>
            </div>

            <ul class="submenu">
                <template v-for="(item, index) in only_allows(menu?.permission_name, menu?.children)" :key="index">
                    <VCollapseLinks v-if="item.children">
                        <template #header>
                            {{ item.title }}
                            <i aria-hidden="true" class="iconify" data-icon="feather:chevron-right" />
                        </template>
                        <template v-for="subitem in item.children" :key="subitem.title">
                            <RouterLink :to="subitem.to ?? {}" class="is-submenu">
                                {{ subitem.title }}
                            </RouterLink>
                        </template>
                    </VCollapseLinks>
                    <li v-else-if="item.to">
                        <RouterLink :to="item.to">{{ item.title }}</RouterLink>
                    </li>
                    <li v-else class="divider with-label">
                        <span class="divider-label">{{ item.title }}</span>
                    </li>
                </template>
            </ul>
        </div>
    </div>
</template>