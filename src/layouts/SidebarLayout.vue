<script setup lang="ts">
import { ref, computed, watchPostEffect, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isMobileScreen, isMediumScreen, isLargeScreen } from '/@src/utils/responsive'
import { useSidemenu } from '../composable/useSidemenu'
import type { SidebarTheme } from '/@src/components/navigation/desktop/Sidebar.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { usePanels } from '/@src/stores/panels'
import { useClients } from '/@src/stores/clients'
import { useSystem, SystemId, systemOptions } from '/@src/stores/system'
import { useUserSession } from '/@src/stores/userSession'
import { useNotifications } from '/@src/stores/notifications'

const props = withDefaults(
    defineProps<{
        theme?: SidebarTheme
        closeOnChange?: boolean
        openOnMounted?: boolean
        subSidebarAutoHide?: boolean
        subSidebarAutoHidePopup?: boolean
        nowrap?: boolean
    }>(),
    {
        defaultSidebar: 'dashboard',
        theme: 'default',
        subSidebarAutoHide: true,
        subSidebarAutoHidePopup: true,
    }
)

const viewWrapper = useViewWrapper()
const sidemenu = useSidemenu()
const route = useRoute()
const router = useRouter()
const panels = usePanels()
const system = useSystem()
const userSession = useUserSession()
const singltonNotify = useNotifications()
const isMobileSidebarOpen = ref(false)
const isDesktopSidebarOpen = ref<any>(false)
const clients = await useClients()
const clientConfig = clients.config

const permission = userSession.permissions('*')
const is_permission_marketing_menu = permission.is_allow('marketing_menu')

const onActiveTools = () => {
    if (panels.active == 'tools') {
        panels.close()
    } else {
        panels.setActive('tools')
    }
}

if (props.openOnMounted) {
    setTimeout(() => (isDesktopSidebarOpen.value = sidemenu.isVisible.value), 0)
}

const onSelectSystem = (value: SystemId) => {
    system.setActive(value)
    router.push({ name: 'index' })
    singltonNotify.refresh()
}

/**
 * watchPostEffect callback will be executed each time dependent reactive values has changed
 */
watchPostEffect(() => {
    viewWrapper.setPushed(isDesktopSidebarOpen.value ?? false)
})
watch(
    () => route.fullPath,
    () => {
        isMobileSidebarOpen.value = false

        if (props.closeOnChange && isDesktopSidebarOpen.value) {
            isDesktopSidebarOpen.value = false
        }
    }
)
watch(sidemenu.isVisible, () => {
    isDesktopSidebarOpen.value = props.openOnMounted && sidemenu.isVisible.value
})

const subMouseOver = ref(false)

const logo_url_small = clientConfig.logo_url_small ? clientConfig.logo_url_small : '/images/empty.gif'

const layoutClasses = computed<string[]>(() => {
    let classess: string[] = ['sidebar-layout']
    if (props.subSidebarAutoHide) {
        classess.push('auto-hide')
    }
    if (props.subSidebarAutoHidePopup) {
        classess.push('popup')
    }
    if (subMouseOver.value) {
        classess.push('sub-mouse-over')
    }
    if (isLargeScreen.value === true) {
        classess.push('is-large-screen')
    } else if (isMediumScreen.value === true) {
        classess.push('is-medium-screen')
    } else if (isMobileScreen.value === true) {
        classess.push('is-mobile-screen')
    }

    return classess
})
</script>

<template>
    <div :class="layoutClasses">
        <div class="app-overlay"></div>

        <AuthModal />

        <!-- Mobile navigation -->
        <MobileNavbar :is-open="isMobileSidebarOpen" @toggle="isMobileSidebarOpen = !isMobileSidebarOpen">
            <template #brand>
                <RouterLink :to="{ name: 'index' }" class="navbar-item is-brand">
                    <!-- <AnimatedLogo width="38px" height="38px" /> -->
                    <img src="/logo.png" alt="Trackpilot" style="width: 50px;" />
                </RouterLink>

                <div class="brand-end">
                    <!-- <UserProfileDropdown /> -->
                    <a tabindex="0" class="is-trigger dropdown-trigger" aria-haspopup="true" @keydown.space.prevent="onActiveTools" @click="onActiveTools">
                        <VAvatar picture="/logo.png" />
                    </a>
                </div>
            </template>
        </MobileNavbar>

        <!-- Mobile sidebar links -->
        <MobileSidebar :is-open="isMobileSidebarOpen" @toggle="isMobileSidebarOpen = !isMobileSidebarOpen">
            <template #links>
                <SidebarLayoutLinks />
                <SidebarLayoutLinks position="bottom" />
            </template>
        </MobileSidebar>

        <Transition name="slide-x">
            <KeepAlive>
                <SubsidebarMobileLayout v-if="isMobileSidebarOpen && sidemenu.isVisible.value" />
            </KeepAlive>
        </Transition>

        <Sidebar :theme="props.theme" :is-open="isDesktopSidebarOpen">
            <template #links>
                <SidebarLayoutLinks />
            </template>
            <template #bottom-links>
                <SidebarLayoutLinks position="bottom" />
                <!-- <li>
                    <UserProfileDropdown up />
                </li> -->
            </template>
        </Sidebar>

        <Transition name="slide-x">
            <KeepAlive>
                <SubsidebarLayout
                    v-if="isDesktopSidebarOpen && sidemenu.isVisible.value"
                    :auto-hide="props.subSidebarAutoHide"
                    @close="isDesktopSidebarOpen = false"
                    @on-mouseover="subMouseOver = true"
                    @on-mouseleave="subMouseOver = false"
                />
            </KeepAlive>
        </Transition>

        <VViewWrapper>
            <VPageContentWrapper>
                <template v-if="props.nowrap">
                    <slot></slot>
                </template>
                <VPageContent v-else class="is-relative">
                    <div class="page-title has-text-centered-222">
                        <!-- Sidebar Trigger -->
                        <div
                            v-if="sidemenu.isVisible.value && sidemenu.menu?.value?.children_desktop !== false"
                            class="vuero-hamburger nav-trigger push-resize"
                            tabindex="0"
                            @keydown.space.prevent="isDesktopSidebarOpen = !isDesktopSidebarOpen"
                            @click="isDesktopSidebarOpen = !isDesktopSidebarOpen"
                        >
                            <span v-if="!props.subSidebarAutoHide" class="menu-toggle has-chevron">
                                <span :class="[isDesktopSidebarOpen && 'active']" class="icon-box-toggle">
                                    <span class="rotate">
                                        <i aria-hidden="true" class="icon-line-top"></i>
                                        <i aria-hidden="true" class="icon-line-center"></i>
                                        <i aria-hidden="true" class="icon-line-bottom"></i>
                                    </span>
                                </span>
                            </span>
                        </div>

                        <ul v-if="!isMobileScreen && system.active == 'crm'" class="header-menu">
                            <li v-if="userSession.permissions('gravity').is_active()">
                                <RouterLink
                                    :to="{ name: 'gravity-type', params: { type: 'auto' } }"
                                    title="Gravity Dashboard"
                                    tooltip="Gravity Dashboard"
                                    style="font-size: 12px"
                                >
                                    <div class="gravity-btn">Gravity</div>
                                </RouterLink>
                            </li>
                            <li v-if="userSession.permissions('brokers').is_active() && userSession.permissions('brokers').is_allow('daily_cap')">
                                <RouterLink :to="{ name: 'brokers-caps', params: { type: 'auto' } }" title="Caps Dashboard" tooltip="Caps Dashboard">
                                    <div class="capdashboard-btn">Cap Dashboard</div>
                                </RouterLink>
                            </li>
                        </ul>

                        <div class="title-wrap">
                            <h1 class="title">
                                <span v-if="viewWrapper.pageTitle?.length > 0">{{ viewWrapper.pageTitle }}</span>
                                <span v-else-if="viewWrapper.pageTitleHtml !== undefined" v-html="viewWrapper.pageTitleHtml"></span>
                                <span v-for="(item, key) in viewWrapper.pageTitleNodes ?? []" v-else :key="key" style="margin-left: 5px">
                                    <component :is="{ render: () => item }" :key="key"></component>
                                </span>
                            </h1>
                        </div>

                        <div v-if="is_permission_marketing_menu && userSession?.user?.systemId == 'crm'" class="system-wrap">
                            <Multiselect
                                v-model="system.active"
                                :options="systemOptions"
                                :required="true"
                                :allow-empty="false"
                                :can-clear="false"
                                @update:model-value="onSelectSystem"
                            />
                        </div>

                        <Toolbar class="desktop-toolbar"></Toolbar>
                    </div>
                    <div class="tp-container">
                        <slot></slot>
                    </div>
                </VPageContent>
            </VPageContentWrapper>
        </VViewWrapper>
    </div>
</template>

<style lang="scss">
.sidebar-layout {
    .header-menu {
        display: grid;
        column-gap: 5px;
        /* width: 60px; */
        grid-template-columns: auto auto;
        margin: 0 -5px;

        li {
            text-align: center;
        }
    }

    &.auto-hide {
        @keyframes slide-left {
            0% {
                left: 80px;
            }

            100% {
                left: -135px;
            }
        }

        @keyframes slide-right {
            0% {
                left: -135px;
            }

            100% {
                left: 80px;
            }
        }

        .sidebar-panel {
            &.is-generic {
                animation-delay: 2s;

                &.auto-hide {
                    // left: -135px;
                    animation: slide-left 0.5s forwards;
                    border-right: 1px solid;
                    border-right-color: #fff;
                    box-shadow: -13px 1px 9px 10px #7f7f7f;

                    .simplebar-content ul {
                        position: relative;
                        right: 35px;
                    }
                }
            }
        }

        .view-wrapper.is-pushed-full {
            margin-left: 80px;
            width: calc(100% - 80px);
        }

        &.sub-mouse-over {
            &:not(.popup) .view-wrapper.is-pushed-full {
                margin-left: 320px;
                width: calc(100% - 320px);
            }

            .sidebar-panel {
                &.is-generic {
                    &.auto-hide {
                        // left: 80px;
                        animation: slide-right 0.5s forwards;

                        .simplebar-content ul {
                            position: inherit;
                            right: inherit;
                        }
                    }
                }
            }
        }
    }
}
.gravity-btn { background-color: #e5f6ff; color: #08a1f7; width: fit-content; padding: 7px; font-size: 13px; font-weight: 600; padding-right: 16px; padding-left: 16px; border-radius: 3px; }
.gravity-btn:hover { background-color: #07a2f7; color: #fff; }
.capdashboard-btn { font-weight: 600; background-color: #f9f9f9; width: fit-content; color: #29acf7; padding: 8px; font-size: 13px; }
</style>