<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { useDropdown } from '/@src/composable/useDropdown'
import { onceImageErrored } from '/@src/utils/via-placeholder'
import { NotificationItem } from '/@src/stores/notifications'
import { isObject, isString } from '@vue/shared'

const Format = 'dd.MM.yyyy HH:mm:ss'
const dropdownElement = ref<HTMLElement>()
const dropdown = useDropdown(dropdownElement)

const props = withDefaults(
    defineProps<{
        items?: NotificationItem[]
    }>(),
    {
        items: undefined,
    }
)

const pulsate = computed<boolean>(() => props.items?.some((x) => x.level == 'warning' || x.level == 'dangerous') ?? false)
const newIndicator = computed<boolean>(() => props.items?.some((x) => x.level == 'warning' || x.level == 'dangerous') ?? false)
</script>

<template>
    <div class="toolbar-notifications is-hidden-mobile">
        <div ref="dropdownElement" class="dropdown is-spaced is-dots is-right dropdown-trigger">
            <div tabindex="0" class="is-trigger" aria-haspopup="true" @click="dropdown.toggle" @keydown.space.prevent="dropdown.toggle">
                <i aria-hidden="true" class="iconify" data-icon="feather:bell"></i>
                <span :class="[newIndicator && 'new-indicator', pulsate && 'pulsate']"></span>
            </div>
            <div class="dropdown-menu" role="menu">
                <div class="dropdown-content">
                    <div class="heading">
                        <div class="heading-left">
                            <h6 class="heading-title">Notifications</h6>
                        </div>
                        <!-- <div class="heading-right">
                            <RouterLink class="notification-link" :to="{ name: 'sidebar-layouts-profile-notifications' }"> See all </RouterLink>
                        </div> -->
                    </div>
                    <ul v-if="props.items && props.items.length > 0" class="notification-list">
                        <li v-for="(item, key) in props.items" :key="key" :data-key="key">
                            <a :href="item.link" class="notification-item">
                                <div v-if="item.icon" class="img-left">
                                    <img
                                        v-if="item.icon?.src"
                                        class="user-photo"
                                        alt=""
                                        :src="item.icon.src"
                                        @error.once="(event) => onceImageErrored(event, item.icon?.size ?? '')"
                                    />
                                    <span v-else style="margin-right:10px" v-html="item.icon"></span>
                                </div>
                                <div class="user-content">
                                    <p class="user-info">
                                        <div v-if="item.info && isString(item.info)"><span class="name" v-html="item.info"></span></div>
                                        <div v-else-if="item.info && isObject(item.info)">
                                            <span class="name">{{ item.info.name }}</span>
                                            {{ item.info.value }}
                                        </div>
                                    </p>
                                    <p v-if="item.time" class="time">{{ format(item.time, Format) }}</p>
                                </div>
                            </a>
                        </li>
                    </ul>
                    <ul v-else>
                        <li style="text-align: center">No Notifications</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>
