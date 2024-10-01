<script setup lang="ts">
import { computed } from 'vue'

export interface CapProgressProps {
    live: number
    daily: number
}

const props = defineProps<CapProgressProps>()

const percent = computed(() => ((props.live * 100) / props.daily).toFixed(0) + '%')
</script>

<template>
    <div class="cap-progress" :class="live >= daily && 'filled'" :title="percent">
        <div :style="[{ width: percent }]"></div>
        <div>{{ live }} / {{ daily }}</div>
    </div>
</template>

<style lang="scss">
.cap-progress {
    text-align: center;
    position: relative;
    border-radius: 1em;
    background: var(--background-grey);
    overflow: hidden;
    line-height: 24px;

    & > div {
        position: relative;
    }

    & > div:first-child {
        position: absolute;
        background: var(--primary-light-20);
        height: 100%;
    }

    &.filled {
        & > div:first-child {
            background: var(--danger) !important;
        }

        & > div {
            color: var(--white) !important;
        }
    }
}

.is-dark {
    .cap-progress {
        background: var(--dark-sidebar);
    }

    .cap-progress > div:first-child {
        background: var(--primary-dark-20);
    }
}
</style>