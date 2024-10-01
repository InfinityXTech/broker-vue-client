<script setup lang="ts">
import { computed } from 'vue'

export interface CapErrorsProps {
    data: any
}

const props = defineProps<CapErrorsProps>()

const errors = computed(() => {
    const errors: string[] = [props.data.broker.error, props.data.integration.error, ...props.data.languages.map((x: any) => x.error)]
    return errors.filter((x) => x)
})
</script>

<template>
    <span class="cap-index">
        <slot></slot>
    </span>
    <Tippy v-if="errors.length > 0" placement="right" class="cap-errors-icon">
        <i class="iconify" data-icon="feather:alert-triangle" aria-hidden="true"></i>
        <template #content>
            <div v-for="error in errors" :key="error">{{ error }}</div>
        </template>
    </Tippy>
</template>

<style scoped lang="scss">
.cap-index {
    vertical-align: sub;
}

.cap-errors-icon {
    float: right;
    font-size: 20px;
    color: var(--danger);
}
</style>