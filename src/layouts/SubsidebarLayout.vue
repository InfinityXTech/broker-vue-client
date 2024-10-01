<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouteLocationRaw } from 'vue-router'
import { useSidemenu, SidemenuConfig } from '../composable/useSidemenu'
import { useUserSession } from '/@src/stores/userSession'

const emit = defineEmits(['close', 'onMouseover', 'onMouseleave'])

const userSession = useUserSession()
const sidemenu = useSidemenu()
const menu: any = sidemenu.menu

const props = withDefaults(
    defineProps<{
        autoHide?: boolean
    }>(),
    {
        autoHide: false,
    }
)

const get_first_only_allows = (menu_item: SidemenuConfig): RouteLocationRaw | undefined => {
    let to: RouteLocationRaw | undefined = undefined
    if (menu) {
        const menu = userSession.menu().get_first_allow(menu_item)
        if (menu) {
            to = menu.to as RouteLocationRaw
        }
    }
    return to
}

const mouseover = ref(false)
let mouseoveTime: any = null
const onMouseover = () => {
    if (mouseoveTime != null) {
        clearTimeout(mouseoveTime)
        mouseoveTime = null
    }
    mouseoveTime = setTimeout(() => {
        mouseover.value = true
        emit('onMouseover')
    }, 200)
}
const onMouseleave = () => {
    if (mouseoveTime != null) {
        clearTimeout(mouseoveTime)
        mouseoveTime = null
    }
    mouseover.value = false
    emit('onMouseleave')
}
</script>

<template>
    <div
        :class="['sidebar-panel', 'is-generic', props.autoHide && 'auto-hide', mouseover && 'mouseover']"
        @mouseover="onMouseover"
        @focusin="onMouseover"
        @mouseleave="onMouseleave"
        @blur="onMouseleave"
    >
        <div class="subpanel-header">
            <h3 class="no-mb">
                <RouterLink v-if="menu.to" :to="menu.to">{{ menu.title }}</RouterLink>
                <template v-else>{{ menu.title }}</template>
            </h3>
            <div class="panel-close" tabindex="0" @keydown.space.prevent="emit('close')" @click="emit('close')">
                <i aria-hidden="true" class="iconify" data-icon="feather:x"></i>
            </div>
        </div>
        <div v-if="menu.children_desktop !== false" class="inner" data-simplebar>
            <ul>
                <template v-for="(item, index) in userSession.menu().only_allows(menu?.permission_name, menu?.children)" :key="index">
                    <div v-if="item.children_desktop === false">
                        <li v-if="get_first_only_allows(item) != undefined">
                            <RouterLink :to="get_first_only_allows(item) ?? {}"> {{ item.title }} </RouterLink>
                        </li>
                    </div>
                    <VCollapseLinks v-else-if="item.children" :class="item.class">
                        <template #header>
                            {{ item.title }}
                            <i aria-hidden="true" class="iconify" data-icon="feather:chevron-right" />
                        </template>
                        <template v-for="subitem in userSession.menu().only_allows(menu?.permission_name, item?.children)" :key="subitem.title">
                            <RouterLink :to="subitem.to ?? {}" class="is-submenu">
                                {{ subitem.title }}
                            </RouterLink>
                        </template>
                    </VCollapseLinks>
                    <li v-else-if="item.to">
                        <!-- <a :href="'/' + item.to.name">{{ item.title }}</a> -->
                        <RouterLink :to="item.to ?? {}">{{ item.title }}</RouterLink>
                    </li>
                    <li v-else class="divider with-label">
                        <span class="divider-label">{{ item.title }}</span>
                    </li>
                </template>
            </ul>
        </div>
    </div>
</template>

<style lang="scss">
@import '../scss/layout/sidebar-panel';
</style>
