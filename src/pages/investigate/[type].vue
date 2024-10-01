<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'

export interface InvestigateProps {
    type: string
}

const props = defineProps<InvestigateProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Investigate: ' + props.type)
</script>
<template>
    <RouterView />
</template>
