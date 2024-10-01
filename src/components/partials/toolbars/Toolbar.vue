<script setup lang="ts">
import { useDarkmode } from '/@src/stores/darkmode'
import { useNotifications } from '/@src/stores/notifications'

const darkmode = useDarkmode()
const singltonNotify = useNotifications()
</script>

<template>
    <div class="toolbar ml-auto">
        <div id="toolbar" class="toolbar"></div>
        <div class="toolbar">
            <slot></slot>

            <div class="toolbar-link">
                <label tabindex="0" class="dark-mode ml-auto" @keydown.space.prevent="(e) => (e.target as HTMLLabelElement).click()">
                    <input type="checkbox" :checked="!darkmode.isDark" @change="darkmode.onChange" />
                    <span></span>
                </label>
            </div>
        </div>
        <ToolbarNotification :items="singltonNotify.notifications" />
    </div>
</template>
