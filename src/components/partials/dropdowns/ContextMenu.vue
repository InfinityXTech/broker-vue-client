<script lang="ts">
import { h, onMounted, onUnmounted, ref, render } from 'vue'
import ContextMenu from './ContextMenu.vue'

export interface ContextMenuItem {
    icon: string
    label: string
    divided?: boolean
    disabled?: boolean
    onClick(): void
}
export interface ContextMenuOptions {
    x: number
    y: number
    items: ContextMenuItem[]
}

export function showContextMenu(options: ContextMenuOptions) {
    const container = document.createElement('div')
    render(h(ContextMenu, { options, onClose: () => render(null, container) }), container)
    document.body.appendChild(container.firstElementChild as Node)
}
</script>

<script setup lang="ts">
export interface ContextMenuEmits {
    (e: 'close'): void
}
export interface ContextMenuProps {
    options: ContextMenuOptions
}

const emit = defineEmits<ContextMenuEmits>()
const props = defineProps<ContextMenuProps>()

const ready = ref(false)
const close = () => {
    emit('close')
}

onMounted(() => {
    setTimeout(() => {
        document.addEventListener('click', close)
        document.addEventListener('contextmenu', close)
        ready.value = true
    }, 0)
})
onUnmounted(() => {
    document.removeEventListener('click', close)
    document.removeEventListener('contextmenu', close)
})
</script>

<template>
    <div
        v-if="props.options.items.length > 0"
        class="context-menu"
        :class="[ready && 'ready']"
        :style="{
            left: `${options.x}px`,
            top: `${options.y}px`,
        }"
    >
        <div v-for="(item, i) in options.items" :key="i">
            <div class="context-menu-item" :class="[item.disabled && 'disabled']" @click="item.onClick" @keydown.space.prevent="item.onClick">
                <span class="text">
                    <i class="icon" :class="item.icon"></i>
                    <span>{{ item.label }}</span>
                </span>
            </div>
            <div v-if="item.divided" class="context-menu-item-sperator"></div>
        </div>
    </div>
</template>

<style lang="scss">
.context-menu {
    z-index: 100;
    min-width: 100px;
    max-width: 600px;
    display: inline-block;
    overflow: visible;
    position: absolute;
    background-color: #fff;
    border-radius: 10px;
    padding: 12px 0;
    box-shadow: 0 10px 40px 10px rgba(#000, 0.1);
    opacity: 0;
    transition: all 0.2s ease-in-out;

    &.ready {
        opacity: 1;
    }
}

.context-menu-items {
    position: relative;
    overflow: hidden;
    overflow-y: scroll;

    &::-webkit-scrollbar {
        display: none;
    }
}

.context-menu-item {
    display: block;
    position: relative;
    padding: 6px 20px;
    user-select: none;

    &:hover {
        background-color: #f1f1f1;
    }

    &:active {
        background-color: #dfdfdf;
    }

    &.disabled {
        cursor: not-allowed;
    }

    &.disabled:hover,
    &.disabled:active {
        background-color: transparent;
    }

    &.disabled .text {
        color: #9f9f9f;
    }

    .text {
        color: #2e2e2e;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        .icon {
            display: inline-block;
            width: 26px;
            font-size: 16px;
            color: #636363;
        }

        span {
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-right: 16px;
        }
    }
}

.context-menu-item-sperator {
    display: block;
    padding: 5px 0;
    background-color: #fff;

    &::after {
        display: block;
        content: '';
        background-color: #f0f0f0;
        height: 1px;
    }
}
</style>