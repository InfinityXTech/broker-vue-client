<script setup lang="ts">
export type VCardAdvancedRadius = 'regular' | 'smooth' | 'rounded'
export type VCardColor =
    | 'primary'
    | 'success'
    | 'info'
    | 'warning'
    | 'danger'
    | 'h-purple'
    | 'h-orange'
    | 'h-blue'
    | 'h-green'
    | 'h-red'
    | 'h-yellow'
    | 'h-gray'
export interface VCardAdvancedProps {
    radius?: VCardAdvancedRadius
    headerColor?: VCardColor
}

const props = withDefaults(defineProps<VCardAdvancedProps>(), {
    radius: 'regular',
    headerColor: undefined,
})
</script>

<template>
    <div
        :class="[
            props.radius === 'regular' && 's-card-advanced',
            props.radius === 'smooth' && 'r-card-advanced',
            props.radius === 'rounded' && 'l-card-advanced',
        ]"
    >
        <div class="card-head" :class="[props.headerColor && `is-${props.headerColor}`]">
            <div class="left">
                <slot name="header-left"></slot>
            </div>
            <div class="right">
                <slot name="header-right"></slot>
            </div>
        </div>
        <div class="card-body">
            <slot name="content"></slot>
        </div>
        <div class="card-foot">
            <div class="left">
                <slot name="footer-left"></slot>
            </div>
            <div class="right">
                <slot name="footer-right"></slot>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.card-head {
    &.is-primary {
        background: var(--primary);
    }
    &.is-info {
        background: var(--info);
    }

    &.is-warning {
        background: var(--warning);
    }

    &.is-danger {
        background: var(--danger);
    }
    &.is-h-gray {
        background: silver;
    }
}
</style>