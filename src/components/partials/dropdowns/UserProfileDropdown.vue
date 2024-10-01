<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useUserSession } from '/@src/stores/userSession'

const api = useApi()
const notif = useNotyf()
const router = useRouter()
const userSession = useUserSession()
const isLoading = ref(false)
const user = userSession.user ?? {}

const handleLogout = async () => {
    if (isLoading.value) {
        return
    }
    try {
        isLoading.value = true

        await api.post('/auth/logout')
        userSession.logoutUser()
        router.push({ name: 'auth-login' })
    } catch (err) {
        notif.dismissAll()
        notif.error((err as Error).message)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <VDropdown right spaced class="user-dropdown profile-dropdown">
        <template #button="{ toggle }">
            <a tabindex="0" class="is-trigger dropdown-trigger" aria-haspopup="true" @keydown.space.prevent="toggle" @click="toggle">
                <VAvatar picture="/images/avatars/vuero-1.svg" />
            </a>
        </template>

        <template #content>
            <div class="dropdown-head">
                <VAvatar size="large" picture="/images/avatars/vuero-1.svg" />

                <div class="meta">
                    <span>{{ user.name }}</span>
                    <span>{{ user.account_email }}</span>
                </div>
            </div>

            <div class="dropdown-item is-button">
                <VButton
                    :loading="isLoading"
                    class="logout-button"
                    icon="feather:log-out"
                    color="primary"
                    role="menuitem"
                    raised
                    fullwidth
                    @click="handleLogout"
                >
                    Logout
                </VButton>
            </div>
        </template>
    </VDropdown>
</template>
