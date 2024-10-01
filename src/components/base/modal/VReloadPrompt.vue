<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { ref } from 'vue'

export interface VReloadPromptProps {
    appName: string
}

const loading = ref(false)
const props = defineProps<VReloadPromptProps>()

// const offlineReady = ref(false)
// const needRefresh = ref(false)

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(swr) {
        console.log(`SW registered: ${swr}`)
        // console.log(swr)
    },
    onRegisterError(error) {
        console.log('SW registration error', error)
    },
    onOfflineReady() {
        console.log('SW ready for offline')
        setTimeout(() => close(), 3000)
    },
})

const close = async () => {
    loading.value = false
    offlineReady.value = false
    needRefresh.value = false
}
const update = async () => {
    loading.value = true
    await updateServiceWorker(true)
    loading.value = false
}
</script>

<template>
    <Transition name="from-bottom">
        <VCard v-if="offlineReady || needRefresh" class="pwa-toast" role="alert" radius="smooth">
            <div class="pwa-message">
                <!-- <span v-if="offlineReady">
                    {{ props.appName + ' is ready to work offline' }}
                </span>
                <span v-else>
                    {{ `A new version of ${props.appName} is available, click on reload button to update.` }}
                </span> -->
                <span v-if="needRefresh">
                    {{ `A new version of ${props.appName} is available, click on reload button to update.` }}
                </span>
            </div>
            <VButtons align="right">
                <VButton v-if="needRefresh" color="primary" icon="ion:reload-outline" :loading="loading" @click="() => update()">
                    {{ 'Reload' }}
                </VButton>
                <VButton icon="feather:x" @click="close">{{ 'Close' }}</VButton>
            </VButtons>
        </VCard>
    </Transition>
</template>

<style lang="scss">
.pwa-toast {
    position: fixed;
    right: 0;
    bottom: 0;
    max-width: 350px;
    margin: 16px;
    padding: 12px;
    border: 1px solid #8885;
    border-radius: 4px;
    z-index: 10;
    text-align: left;
    box-shadow: 3px 4px 5px 0 #8885;
}

.pwa-message {
    padding: 0.5rem 1rem;
    margin-bottom: 1rem;
    font-size: 1.1rem;
}
</style>
