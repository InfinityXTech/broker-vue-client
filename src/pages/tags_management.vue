<route lang="yaml">
    meta:
        requiresAuth: true
    </route>
    <script setup lang="ts">
    import { onBeforeMount, onBeforeUnmount } from 'vue'
    import { useSidemenu } from '/@src/composable/useSidemenu'
    
    const sidemenu = useSidemenu()
    
    onBeforeUnmount(sidemenu.pop)
    </script>
    <template>
        <SidebarLayout :open-on-mounted="false">
            <RouterView />
        </SidebarLayout>
    </template>
    