<script setup lang="ts">
export interface CRMWarningProps {
    errors: []
}

const props = defineProps<CRMWarningProps>()
</script>

<template>
    <span class="crm-index">
        <slot></slot>
    </span>
    <Tippy v-if="errors.length > 0" placement="right" class="crm-errors-icon">
        <i class="iconify" data-icon="feather:alert-triangle" aria-hidden="true"></i>
        <template #content>
            <div v-for="error in props.errors" :key="error">{{ error }}</div>
        </template>
    </Tippy>
</template>

<style scoped lang="scss">
.crm-index {
    vertical-align: sub;
}

.crm-errors-icon {
    float: right;
    font-size: 20px;
    color: var(--danger) !important;

    * {
        color: var(--danger) !important;
    }
}
</style>