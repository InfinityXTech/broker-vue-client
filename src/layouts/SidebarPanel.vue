<script setup lang="ts">
import { ref } from 'vue'
import { isMobileScreen } from '/@src/utils/responsive'
import { usePanels } from '/@src/stores/panels'

export type SidebarPannelPosition = 'left' | 'bottom' | 'popup'
export type SidebarPannelEvent = 'click' | 'hover'

export interface SidebarPannelProps {
    tooltip?: string
    dropdown?: boolean
    position?: SidebarPannelPosition
    event?: SidebarPannelEvent
}

const isActive = ref(false)

const panels = usePanels()

const props = withDefaults(defineProps<SidebarPannelProps>(), {
    tooltip: undefined,
    dropdown: false,
    position: 'left',
    event: 'click',
})

let toogleHoverTimeout: any = null
const onHoverToogle = (over: boolean) => {
    if (!isMobileScreen.value && props.event == 'hover') {
        if (over) {
            if (toogleHoverTimeout != null) {
                clearTimeout(toogleHoverTimeout)
                toogleHoverTimeout = null
            }
            if (isActive.value != true) {
                isActive.value = true
            }
        } else {
            if (toogleHoverTimeout != null) {
                clearTimeout(toogleHoverTimeout)
                toogleHoverTimeout = null
            }
            toogleHoverTimeout = setTimeout(() => (isActive.value = false), 500)
            panels.close()
        }
    }
}
const onToogle = () => {
    isActive.value = !isActive.value
}
const onClose = () => {
    isActive.value = false
    panels.close()
}
</script>

<template>
    <Tippy placement="right">
        <template v-if="props.tooltip" #content>
            {{ tooltip }}
        </template>

        <VDropdown v-if="props.dropdown == true && panels.active === 'tools'" up spaced modern class="sidebar-panel-dropdown">
            <template #button="{ toggle }">
                <a
                    v-if="props.event == 'click'"
                    tabindex="0"
                    class="is-trigger dropdown-trigger"
                    aria-haspopup="true"
                    @keydown.space.prevent="toggle"
                    @click="toggle"
                >
                    <slot name="icon"></slot>
                </a>
            </template>
            <template #content>
                <div class="dropdown-item is-button">
                    <ul>
                        <slot name="items"></slot>
                    </ul>
                </div>
            </template>
        </VDropdown>

        <div
            v-else
            class="sidebar-panel-simplebar"
            @mouseover="onHoverToogle(true)"
            @focusin="onHoverToogle(true)"
            @mouseout="onHoverToogle(false)"
            @blur="onHoverToogle(false)"
        >
            <a tabindex="0" @click="onToogle" @keydown.space.prevent="onToogle">
                <slot name="icon"></slot>
            </a>
            <!--desktop-->
            <div :class="['sidebar-panel', 'is-generic', props.position && 'position-' + props.position, (isActive || panels.active === 'tools') && 'active']">
                <div class="subpanel-header">
                    <h3 class="no-mb">
                        <slot name="title"></slot>
                    </h3>
                    <div
                        v-if="!isMobileScreen && props.event != 'hover'"
                        class="panel-close"
                        tabindex="0"
                        @keydown.space.prevent="onClose()"
                        @click="onClose()"
                    >
                        <i aria-hidden="true" class="iconify" data-icon="feather:x"></i>
                    </div>
                </div>
                <div class="inner" data-simplebar>
                    <ul>
                        <slot name="items"></slot>
                    </ul>
                </div>
            </div>

            <!--mobile-->
            <div
                v-if="isActive || panels.active === 'tools'"
                :class="['mobile-subsidebar', 'is-activity', props.position && 'mobile-position-' + props.position]"
            >
                <div class="inner">
                    <div class="sidebar-title">
                        <h3><slot name="title"></slot></h3>
                        <div class="panel-close" tabindex="0" @keydown.space.prevent="onClose()" @click="onClose()">
                            <i aria-hidden="true" class="iconify" data-icon="feather:x"></i>
                        </div>
                    </div>

                    <ul class="submenu">
                        <slot name="items"></slot>
                    </ul>
                </div>
            </div>
        </div>
    </Tippy>
</template>
<style lang="scss">
@import '../scss/layout/sidebar-panel';

.sidebar-panel-dropdown {
    .dropdown-menu {
        left: 65px !important;
        bottom: 0 !important;
    }

    .panel-close {
        display: block !important;
    }

    .dropdown-item {
        li {
            width: 100% !important;
            height: auto !important;
            text-align: left !important;
            justify-content: left !important;
            padding-left: 20px;

            > a {
                text-align: left !important;
                justify-content: left !important;
            }
        }
    }
}

.sidebar-panel-simplebar {
    .position-bottom {
        bottom: 0;
        top: auto;
        width: 100%;
        height: 200px;

        .inner {
            width: 100% !important;
            height: 400px;
            overflow: scroll;

            .simplebar-wrapper {
                height: 100%;
            }

            .simplebar-content {
                overflow: inherit;
                height: 100%;
            }

            .simplebar-mask {
                position: inherit;
                overflow: inherit;
                height: 100%;
            }

            .simplebar-content-wrapper {
                overflow: inherit;
                height: 100%;
            }

            ul {
                height: 100%;
            }

            li {
                display: inline-block;
                max-width: calc(100% / 4);
            }
        }
    }

    .position-popup {
        position: absolute;
        bottom: 5px;
        left: 85px;
        top: auto;
        width: 450px;
        height: 525px;
        background: white;
        box-shadow: 5px 5px 23px rgb(0 0 0 / 25%);
        border-radius: 6px;
        animation-delay: 2s;
        opacity: 0;
        transition: all 0.2s;
        visibility: hidden;

        .inner {
            width: 100%;
            height: calc(525px - 60px);
            border-radius: 0 0 5px 5px;
        }

        &:not(.active) {
            transform: translateY(+50px);
            opacity: 0;
        }

        &.active {
            visibility: visible;
            opacity: 1;
            transform: translateY(0);
        }
    }

    .mobile-subsidebar {
        z-index: -1 !important;
        top: 0 !important;
    }

    .panel-close {
        display: block !important;
    }

    .mobile-subsidebar .panel-close {
        position: absolute;
        right: 20px;
    }

    .simplebar-content,
    .mobile-subsidebar {
        li {
            width: 100% !important;
            min-height: 45px !important;
            text-align: left !important;
            justify-content: left !important;
            padding-left: 0;
            display: flex;
            align-items: center;

            > a {
                text-align: left !important;
                justify-content: left !important;
                vertical-align: middle;
                display: inline-flex;
                padding: 0 0 0 20px !important;

                > svg , i{
                    vertical-align: middle;
                    display: inline-flex;
                    max-width: 25px !important;
                    height: auto !important;
                    margin-right: 10px;
                    margin-top: -3px;
                }
            }
        }
    }

    .mobile-subsidebar {
        li {
            height: 45px !important;

            > a {
                padding: 0 !important;
            }
        }
    }
}
</style>
