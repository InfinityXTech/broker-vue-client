<route lang="yaml">
meta:
    requiresAuth: true
</route>
<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount } from 'vue'
import { useSidemenu } from '/@src/composable/useSidemenu'
import Scheme from '/@src/schemes/admin/adminMenu.json'

const sidemenu = useSidemenu()

onBeforeUnmount(sidemenu.pop)
onBeforeMount(() => sidemenu.push(Scheme))
</script>
<template>
    <SidebarLayout :open-on-mounted="true">
        <RouterView />
    </SidebarLayout>
</template>