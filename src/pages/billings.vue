<route lang="yaml">
meta:
    requiresAuth: true
</route>
<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount } from 'vue'
import { useViewWrapper } from '../stores/viewWrapper'
import { useSidemenu } from '/@src/composable/useSidemenu'
import Scheme from '/@src/schemes/billings/billingsMenu.json'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Billings')

const sidemenu = useSidemenu()

onBeforeUnmount(sidemenu.pop)
onBeforeMount(() => sidemenu.push(Scheme))
</script>
<template>
    <SidebarLayout>
        <RouterView />
    </SidebarLayout>
</template>