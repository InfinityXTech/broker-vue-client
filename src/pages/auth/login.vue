<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'

// import { useDarkmode } from '/@src/stores/darkmode'
import { useUserSession } from '/@src/stores/userSession'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { useClients } from '/@src/stores/clients'
import LoginImage from '/@src/components/svg/LoginImage.vue'
import PhoneImage from '/@src/components/svg/PhoneImage.vue'
import { nextTick } from 'vue'
import { computed } from 'vue'

type StepId = 'login' | 'gauth'
const step = ref<StepId>('login')
const isLoading = ref(false)
// const darkmode = useDarkmode()
const router = useRouter()
const route = useRoute()
const notif = useNotyf()
const userSession = useUserSession()
const redirect = route.query.redirect as string
const api = useApi()
const clients = await useClients()
const clientConfig = clients.config

type LoginResponse = {
    success: boolean
    session_hash: string
}
type GoogleResponse = {
    success: boolean
    error: string
    code_valid: boolean
    access_token: string
}

const email = ref<string>('')
const password = ref<string>('')
const gauth = computed(() => {
    return codeInputs.value.join('')
})

const inputLoginElement = ref<HTMLInputElement>()
setTimeout(() => {
    if (inputLoginElement.value) {
        inputLoginElement.value.focus()
    }
}, 10)

const inputGoogleCodeElement = ref<HTMLInputElement>()
watch(step, () => {
    if (step.value == 'gauth' && inputGoogleCodeElement.value) {
        setTimeout(() => {
            if (inputGoogleCodeElement.value) {
                inputGoogleCodeElement.value.focus()
            }
        }, 10)
    }
})

const onKeyPressOnlyDigits = ($event: any) => {
    const keyCode = $event.keyCode ? $event.keyCode : $event.which
    if ((keyCode < 48 || keyCode > 57) && keyCode !== 46 && keyCode != 13) {
        // 46 is dot
        $event.preventDefault()
    }
}

const handleLogin = async () => {
    if (isLoading.value) {
        return
    }
    try {
        isLoading.value = true

        const { data } = await api.post<LoginResponse>('/auth/login', {
            email: email.value,
            password: password.value,
        })

        if (!data.success) {
            throw new Error('Invalid Login / Password')
        }
        userSession.setSessionHash(data.session_hash)
        password.value = ''
        step.value = 'gauth'
    } catch (err) {
        notif.dismissAll()
        notif.error((err as Error).message)
    } finally {
        isLoading.value = false
    }
}

const handleGAuth = async () => {
    if (isLoading.value) {
        return
    }
    try {
        isLoading.value = true

        const { data } = await api.post<GoogleResponse>('/auth/google', {
            code: gauth.value,
            session_hash: userSession.getSessionHash(),
        })

        if (!data.access_token) {
            if (!data.success && data.error) {
                password.value = ''
                step.value = 'login'
                throw new Error(data.error)
            }

            if (!data.code_valid) {
                throw new Error('Invalid Google Code')
            }

            password.value = ''
            step.value = 'login'
            throw new Error('Auth token has been expired')
        }

        userSession.setToken(data.access_token)

        const { data: user } = await api.get('/auth/profile')
        userSession.setUser(user)

        if (redirect) {
            router.push(redirect)
        } else {
            router.push({
                name: 'index',
            })
        }
    } catch (err) {
        notif.dismissAll()
        notif.error((err as Error).message)
    } finally {
        isLoading.value = false
    }
}

useHead({
    title: 'Auth Login',
})

const codeInputs = ref(new Array(6).fill(''))

const updateInputValue = (index: number, value: number) => {
    codeInputs.value[index] = value
}

const codeInputRefs = [ref(null), ref(null), ref(null), ref(null), ref(null), ref(null)]

const focusInput = (index) => {
    const currentInput = codeInputs.value[index]
    if (currentInput === '') {
        if (index > 0) {
            codeInputs.value[index - 1] = ''
            nextTick(() => {
                codeInputRefs[index - 1].value[0].focus()
            })
        }
    } else {
        if (index < codeInputs.value.length - 1) {
            const nextInputRef = codeInputRefs[index + 1].value
            nextTick(() => {
                nextInputRef[0].focus()
            })
        }
    }
}

const login_background: string = clientConfig.login_background ? clientConfig.login_background : '/images/empty.gif'
const logo: string = clientConfig.logo_url_small ? clientConfig.logo_url_small : '/images/empty.gif'
</script>

<template>
    <div class="modern-login container-fluid">
        <div class="columns is-vcentered is-fullheight main">
            <div class="column bg screen is-fullheight">
                <div class="p-5 has-text-weight-semibold">
                    <a href="" class="has-text-black logo">
                        <img src="/logo.png" width="50" alt="Trackpilot" />
                    </a>
                </div>
                <div class="is-hidden-mobile is-hidden-tablet-only is-flex is-align-items-center is-justify-content-center" style="height: calc(100vh - 30px)">
                    <LoginImage width="500" />
                </div>
            </div>
            <div class="column is-3 is-12-touch has-background-white is-fullheight right-side" style="background-color: #fff">
                <div class="min-vh-100 columns is-centered is-vcentered p-4">
                    <div class="column login-form">
                        <h2 class="is-size-3 has-text-weight-semibold has-text-centered">Welcome Back</h2>

                        <form :class="[step !== 'login' && 'is-hidden']" class="login-wrapper mt-3" @submit.prevent="handleLogin">
                            <p class="mt-3 is-size-5 has-text-centered">Your Admin Panel</p>
                            <div class="control has-validation mt-3">
                                <label for="exampleInputEmail1" class="label">Username</label>
                                <input
                                    ref="inputLoginElement"
                                    v-model="email"
                                    type="text"
                                    name="email"
                                    class="input"
                                    placeholder="Email Address"
                                    autocomplete="email"
                                    required
                                />
                            </div>
                            <div class="control has-validation mt-3">
                                <label for="exampleInputPassword1" class="label">Password</label>
                                <input
                                    v-model="password"
                                    name="password"
                                    type="password"
                                    class="input"
                                    placeholder="Password"
                                    required
                                    autocomplete="current-password"
                                />
                            </div>

                            <div class="button-wrap mt-5">
                                <VButton
                                    :loading="isLoading"
                                    :disabled="email?.length == 0 || password?.length == 0"
                                    color="primary"
                                    type="submit"
                                    class="button is-primary is-fullwidth py-8 mb-4 rounded-2"
                                >
                                    Sign In
                                </VButton>
                            </div>
                        </form>

                        <form :class="[step !== 'gauth' && 'is-hidden']" class="form is-fullwidth mb-6" @submit.prevent="handleGAuth">
                            <div class="has-text-centered mt-6 mb-6">
                                <PhoneImage height="125px" />
                            </div>
                            <!--end::Icon-->

                            <!--begin::Heading-->
                            <div class="has-text-centered mb-6">
                                <h1 class="is-size-4 has-text-weight-semibold">Two-Factor Verification</h1>
                                <div class="mt-3 is-size-5">Type your 6 digit security code</div>
                            </div>
                            <div class="mb-6">
                                <div class="field is-grouped is-flex-wrap-wrap is-flex is-justify-content-center">
                                    <div v-for="(input, index) in codeInputs" :key="index" class="control">
                                        <input
                                            v-model="codeInputs[index]"
                                            type="text"
                                            :ref="codeInputRefs[index]"
                                            autocomplete="off"
                                            :name="'code_' + (index + 1)"
                                            :maxlength="1"
                                            class="input is-transparent has-background-none has-text-centered is-size-2 has-fixed-size cube"
                                            inputmode="text"
                                            @input="updateInputValue(index, $event.target.value)"
                                            @keyup="focusInput(index)"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div class="control has-validation">
                                <input
                                    ref="inputGoogleCodeElement"
                                    v-model="gauth"
                                    type="hidden"
                                    class="input"
                                    autocomplete="off"
                                    maxlength="6"
                                    @keypress="onKeyPressOnlyDigits"
                                />
                            </div>

                            <div class="has-text-centered">
                                <VButton
                                    :loading="isLoading"
                                    :disabled="gauth?.length < 6"
                                    class="button is-primary is-large has-text-weight-bold has-text-white"
                                    type="submit"
                                >
                                    Confirm
                                </VButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import '../../scss/abstracts/mixins';
.modern-login {
    min-height: 100vh;
    height: 100vh;
    background: radial-gradient(rgba(210, 241, 223, 0.8), rgba(211, 215, 250, 0.8), rgba(186, 216, 244, 0.8)) 0 0/400% 400%;
    box-sizing: border-box;
    overflow: hidden;
    .columns {
        height: -webkit-fill-available;
    }

    .login-form {
        width: 400px;
        max-width: 400px;
        margin: 0 auto;
    }

    .input {
        background-color: initial !important;
        border-color: #dbdbdb !important;
    }

    .logo {
        display: flex;
        justify-items: center;
        span {
            line-height: 30px;
            font-size: 25px;
            padding-left: 5px;
        }
    }
    .right-side {
        min-width: 500px;
    }
}
@media only screen and (max-width: 1023px) {
    .screen {
        height: 80px !important;
    }
    .main {
        display: block !important;
    }
    .right-side {
        min-width: 100% !important;
    }
    .right-side > .columns {
        display: flex;
    }
}
.cube {
    width: 50px;
    height: 50px;
    padding: 0;
}
.is-fullheight {
    height: 100%;
}
</style>
