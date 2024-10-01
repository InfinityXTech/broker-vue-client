<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'
import { useUserSession } from '/@src/stores/userSession'
import VModal from '/@src/components/base/modal/VModal.vue'

const route = useRoute()
const router = useRouter()
const userSession = useUserSession()

const scheme = {
    type: 'Form',
    content: [
        {
            component: 'InputField',
            data: '__auth_code__',
            props: {
                maxlength: 6,
                focus: true,
                label: 'Enter Authentication Code',
            },
        },
    ],
}

const onStore = (data: any) => {
    userSession.setToken(data.access_token)
    userSession.setUser(data.user)
    userSession.setSessionHash(data.session_hash)
    router.go(0)
}

const onClose = () => {
    router.push({
        name: 'auth',
        query: { redirect: route.fullPath },
    })
}

const init = {
    session_hash: userSession.getSessionHash(),
}
</script>

<template>
    <ApiForm
        v-if="userSession.needRelogin"
        :wrapper="VModal"
        title="Restore session with Google authenticator"
        size="small"
        noclose
        :scheme="scheme"
        :fetch-data="init"
        store-data="/auth/refresh"
        store-method="post"
        :store-enter-submit="true"
        @close="onClose"
        @store-data="onStore"
    />
</template>