<script setup lang="ts">
import { computed } from 'vue'

export interface LiveCapsProps {
    live: number
    daily: number
    alloc: { name: string; daily_cap: number; live_cap: number }[]
}

const props = defineProps<LiveCapsProps>()

const isFilled = computed(() => props.alloc.some((item) => item.live_cap >= item.daily_cap))
</script>

<template>
    <div class="columns live-caps-container">
        <div class="p-0 column">
            <CapProgress :live="live" :daily="daily" />
        </div>
        <Tippy interactive>
            <div class="p-0 column live-caps-popover-icon" :class="isFilled && 'filled'">{{ isFilled ? '!' : '&darr;' }}</div>
            <template #content>
                <div class="live-caps-popover columns is-multiline">
                    <template v-for="row in alloc" :key="row.name">
                        <div class="column is-3">{{ row.name }}</div>
                        <div class="column is-9">
                            <CapProgress :live="row.live_cap" :daily="row.daily_cap" />
                        </div>
                    </template>
                </div>
            </template>
        </Tippy>
    </div>
</template>

<style lang="scss">
.live-caps-container {
    max-width: 255px;
}

.live-caps-popover-icon {
    text-align: center;
    position: relative;
    border-radius: 12px;
    width: 24px;
    line-height: 24px;
    margin-left: 5px;
    background: var(--background-grey);
    overflow: hidden;

    &.filled {
        background: var(--danger) !important;
        color: var(--white);
    }
}

.live-caps-popover {
    padding: 1rem 0.5rem;
    width: 255px;

    .column {
        padding-top: 3px;
        padding-bottom: 3px;
    }
}

.is-dark {
    .live-caps-popover-icon {
        background: var(--dark-sidebar);
    }

    .live-caps-popover {
        .cap-progress {
            background: var(--dark-sidebar-light-6);
        }
    }
}
</style>