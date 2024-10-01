<script setup lang="ts">
import { nextTick, computed, reactive, ref, useAttrs, watch, Ref, onUnmounted } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useRouter, useRoute } from 'vue-router'
import { useNotyf } from '/@src/composable/useNotyf'
import { AxiosError, Method } from 'axios/index'
import { VLoaderSize } from '/@src/components/base/loader/VLoader.vue'
import { isArray, isFunction, isObject, isString, hasOwn } from '@vue/shared'
import { reactiveReplace } from '/@src/utils/helpers'
import { FormCheckComponentAccess, forEachProperty } from '/@src/components/partials/Form.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface ApiFormMethods {
    onStoreSubmit(): void
    fetchData(): void
    checkValidate(): boolean
    resetData(defaultData: any): void
    forceReRenderForm(update_data: any): void
}

export type ApiFormEvents = (action: any, args: any) => void

export type ApiFormValidate = (data: any) => boolean | Promise<boolean>

export type ApiFormeSize = 'small' | 'medium' | 'large' | 'big' | '3xl' | '4xl' | '5xl' | '6xl' | undefined

export type ApiFormSheme = {
    type: string
    gauth?: boolean
    content: any[]
}

export interface ApiFormEmits {
    (e: 'before-fetch', payload: any): void
    (e: 'fetch-data', value: any): void
    (e: 'store-data', value: any): void
    (e: 'before-store', payload: any): void
    (e: 'update:data', data: any, target: any, v: any): void
    (e: 'close'): void
    (e: 'enter'): void
    (e: 'events', value: ApiFormMethods): void
}

export interface ApiFormProps {
    wrapper: any

    title: string
    size?: ApiFormeSize
    loaderSize?: VLoaderSize
    scheme?: ApiFormSheme
    gauth?: boolean

    modelValue?: any
    errors?: any

    fetchData: any
    fetchMethod?: Method

    storeData: any
    storeLabel?: string
    storeMethod?: Method
    storeOn?: 'click' | 'init' | 'change' | 'delay'
    storeButtonDisable?: Ref<boolean>
    storeEnterSubmit?: boolean

    readonly?: boolean

    classes?: string[]
    styles?: string[]

    validates?: Record<string, ApiFormValidate>

    events?: ApiFormEvents
    checkComponentAccess?: FormCheckComponentAccess
}

const props = withDefaults(defineProps<ApiFormProps>(), {
    size: undefined,
    loaderSize: 'xl',
    scheme: undefined,
    fetchData: undefined,
    fetchMethod: 'GET',
    storeLabel: 'Confirm',
    storeOn: 'click',
    storeMethod: undefined,
    storeEnterSubmit: false,
    modelValue: undefined,
    errors: undefined,
    events: undefined,
    checkComponentAccess: undefined,
    readonly: false,
    storeButtonDisable: undefined,
    classes: undefined,
    styles: undefined,
    validates: undefined,
})
const emit = defineEmits<ApiFormEmits>()
const api = useApi()
const notif = useNotyf()

const router = useRouter()
const route = useRoute()
const userSession = useUserSession()

let data: any = props.modelValue ? reactive(props.modelValue) : reactive({})
// let data: any = reactive(props.modelValue)
// if (data == null) {
//     data = {}
// }
// if (props.modelValue) {
//     watch(props.modelValue, () => {
//         data = props.modelValue
//         console.log(data)
//     })
// }

const renderForm = ref(true)
const errors: any = props.errors ?? reactive({})
const isStoring = ref(false)
const isFetching = ref(false)
const gauth = ref<boolean | undefined>(props.gauth || props.scheme?.gauth ? false : undefined)
const form_classes = computed(() => {
    let cl = ['columns', 'is-multiline', props.size && `is-${props.size}`]
    if (props.classes != undefined) {
        cl = [...cl, ...props.classes]
    }
    return cl
})

const formElement = ref<HTMLFormElement>()
const formComponent = ref()

const focus = computed(() => gauth.value === true)

const serializeData = () => {
    const check_file = (data: any, key: string): boolean => {
        if (Array.isArray(data[key]) && data[key].length > 0) {
            return data[key][0].file_size && data[key][0].original_file_name
        }
        return false
    }

    let is_file: boolean = false
    for (const key in data) {
        if (check_file(data, key)) {
            is_file = true
            break
        }
    }

    if (is_file) {
        const form = new FormData()
        for (const key in data) {
            if (data[key] === null || data[key] === undefined) {
                form.append(key, '')
            } else if (isArray(data[key])) {
                if (key == 'file' || check_file(data, key)) {
                    data[key].forEach((item: any) => form.append(key + '[]', item._id))
                } else {
                    data[key].forEach((item: any) => form.append(key + '[]', item))
                }
            } else if (isObject(data[key])) {
                form.append(key, JSON.stringify(data[key]))
            } else if (typeof data[key] == 'boolean') {
                form.append(key, data[key] ? '1' : '0')
            } else {
                form.append(key, data[key])
            }
        }
        return form
    }
    return data
}

const onStoreSubmit = async () => {
    if (props.readonly) {
        return
    }
    if (gauth.value === false) {
        errors.__auth_code__ = null
        data.__auth_code__ = null
        gauth.value = true
        return
    }
    if (isString(props.storeData)) {
        if (isStoring.value) {
            return
        }
        try {
            reactiveReplace(errors, {})

            // if (formElement.value && isFunction(formElement.value.checkValidity)) {
            // if (!formElement.value.checkValidity()) {

            for (let field in props.validates ?? []) {
                const func_validate: ApiFormValidate = props.validates[field]
                const func_req = await func_validate(data)
                if (func_req == false) {
                    let err: any = {}
                    err[field] = ['The "' + field + '" field is not valid.']
                    Object.assign(errors, err)
                }
            }

            if (formComponent.value && isFunction(formComponent.value.checkValidate)) {
                const required_errors = formComponent.value.checkValidate()
                if (Object.keys(required_errors).length > 0) {
                    Object.assign(errors, required_errors)
                }
            }
            // }
            // }

            if (Object.keys(errors ?? {}).length > 0) {
                return
            }

            isStoring.value = true

            if (isFunction(props.events)) {
                const events = props.events as ApiFormEvents
                events('before-store', {})
            }
            emit('before-store', data)

            const { data: response } = await api.request({ method: props.storeMethod, url: props.storeData, data: serializeData() })

            if (isFunction(props.events)) {
                const events = props.events as ApiFormEvents
                events('after-store', response)
            }
            emit('store-data', response)
        } catch (ex) {
            console.error(ex)

            const error = ex as AxiosError
            const response = error.response?.data

            if (response.exception) {
                notif.dismissAll()
                notif.error({ message: error?.response?.data?.error ?? response.message, duration: 9000 })
            } else {
                let message = error.message
                const getTitle = (name: string, prev_title: string, children: any[]) => {
                    let title = ''
                    children.forEach((element: any) => {
                        if (element?.data == name) {
                            title = element?.props?.label ?? ''
                            if (title == '') {
                                title = prev_title
                            }
                        }
                        if (title == '' && element?.children) {
                            prev_title = ''
                            if (element?.component == 'ToggleBlock') {
                                prev_title = element?.props?.label ?? ''
                            }
                            title = getTitle(name ?? '', prev_title ?? '', element?.children ?? [])
                        }
                    })
                    return title
                }
                for (var name in response) {
                    if (isString(name)) {
                        const title = getTitle(name ?? '', '', props.scheme?.content ?? [])
                        message += '<br/>--------<br/>' + (title.length > 0 ? '<b>' + title + ': </b>' : '') + response[name]

                        if (name == '__auth_code__') {
                            data.__auth_code__ = ''
                        }
                    }
                }
                reactiveReplace(errors, response)
                notif.dismissAll()
                notif.error(message)
            }
        } finally {
            if (isArray(errors.__auth_code__) && errors.__auth_code__.length > 0) {
                if (errors.__auth_code__.indexOf('Secret in the session is empty') >= 0) {
                    router.push({
                        name: 'auth',
                        query: { redirect: route.fullPath },
                    })
                    return
                }
            }

            if (gauth.value === true && !errors.__auth_code__) {
                gauth.value = false
            }
            isStoring.value = false
        }
    } else if (isFunction(props.storeData)) {
        isStoring.value = true
        try {
            await props.storeData(data)
            isStoring.value = false
            emit('before-store', data)
            emit('store-data', props.storeData)
            emit('close')
        } finally {
            isStoring.value = false
        }
    } else {
        reactiveReplace(props.storeData, data)
        emit('before-store', data)
        emit('store-data', props.storeData)
    }
}

const fetchData = async () => {
    console.assert(props.scheme?.type == 'Form', 'Not a Form scheme:', props.scheme)

    if (isString(props.fetchData)) {
        try {
            isFetching.value = true
            emit('before-fetch', data)
            const { data: response } = await api.request({ method: props.fetchMethod, url: props.fetchData, data: data })
            reactiveReplace(data, response)
            emit('fetch-data', data)
        } catch (ex) {
            console.error(ex)
            const error = ex as AxiosError
            notif.dismissAll()
            notif.error(error?.response?.data?.error ?? error.message)
        } finally {
            isFetching.value = false
        }
    } else if (isFunction(props.fetchData)) {
        try {
            isFetching.value = true

            const response = await props.fetchData()
            reactiveReplace(data, response)
            emit('fetch-data', data)
        } catch (ex) {
            console.error(ex)
            const error = ex as AxiosError
            notif.dismissAll()
            notif.error(error?.response?.data?.error ?? error.message)
        } finally {
            isFetching.value = false
        }
    } else {
        reactiveReplace(data, props.fetchData)
        emit('fetch-data', data)
    }
}

const resetData = (defaultData: any = {}) => {
    const getData = (property: string) => {
        for (var n in defaultData) {
            if (n == property) {
                return defaultData[n]
            }
        }
        return undefined
    }
    forEachProperty(data, (target: string, property: string) => {
        data[property] = getData(property)
    })
    emit('fetch-data', data)
}

const forceReRenderForm = async (update_data: any = null) => {
    if (update_data != null) {
        for (let n in update_data) {
            data[n] = update_data[n]
        }
        // reactiveReplace(data, update_data)
    }
    // Remove MyComponent from the DOM
    renderForm.value = false
    // Wait for the change to get flushed to the DOM
    await nextTick()
    // Add the component back in
    renderForm.value = true
}

const getWrapperProps = (): any => {
    let wrapperPropsDef: any = {}
    for (let n in props?.wrapper?.props) {
        if (hasOwn(props, n)) {
            wrapperPropsDef[n] = props[n] ? Object.assign(props[n]) : undefined
        }
        if (n == 'cancelLabel') {
            wrapperPropsDef[n] = props.readonly ? 'Close' : 'Cancel'
        }
        if (n == 'open') {
            wrapperPropsDef[n] = true
        }
        if (n == 'actions') {
            wrapperPropsDef[n] = 'right'
        }
    }
    if (props.wrapper?.emits?.some((x: string) => x == 'close')) {
        wrapperPropsDef['onClose'] = () => emit('close')
    }
    if (props.wrapper?.emits?.some((x: string) => x == 'enter')) {
        wrapperPropsDef['onEnter'] = () => {
            if (props.storeEnterSubmit) {
                onStoreSubmit()
            }
            emit('enter')
        }
    }
    return wrapperPropsDef
}

const wrapperProps = Object.assign(
    // {
    //     size: props.size,
    //     title: props.title,
    //     cancelLabel: props.readonly ? 'Close' : 'Cancel',
    //     open: true,
    //     actions: 'right',
    //     onClose: () => emit('close'),
    // },
    getWrapperProps(),
    useAttrs()
)

fetchData().then(() => {
    if (props.storeOn == 'delay') {
        let delay: number
        watch(data, () => {
            clearTimeout(delay)
            delay = setTimeout(onStoreSubmit, 500)
        })
    }
})

const parseScheme = (sheme: any) => {
    if (sheme && isArray(sheme) && sheme.length > 0) {
        for (let i = 0; i < sheme.length; i++) {
            if (sheme[i]) {
                let readonly = props.readonly
                let remove = false

                // readonly
                if (props.readonly && hasOwn(sheme[i], 'props')) {
                    readonly = true
                }

                // roles
                if (hasOwn(sheme[i], 'roles') && sheme[i].roles && sheme[i].roles.length > 0) {
                    let roles_action = (hasOwn(sheme[i], 'roles_action') && sheme[i].roles_action) ?? 'remove'
                    if (roles_action != 'remove' && roles_action != 'readonly') {
                        roles_action = 'readonly'
                    }
                    if (!userSession.roles().is(...sheme[i].roles)) {
                        if (roles_action == 'remove') {
                            remove = true
                        } else if (roles_action == 'readonly') {
                            readonly = true
                        }
                    }
                }

                // public_features
                if (hasOwn(sheme[i], 'public_features') && sheme[i].public_features && sheme[i].public_features.length > 0) {
                    let public_features_action = (hasOwn(sheme[i], 'public_features_action') && sheme[i].public_features_action) ?? 'hide'
                    if (public_features_action != 'remove' && public_features_action != 'readonly') {
                        public_features_action = 'readonly'
                    }
                    if (!userSession.features().is_public(...sheme[i].public_features)) {
                        if (public_features_action == 'remove') {
                            remove = true
                        } else if (public_features_action == 'readonly') {
                            readonly = true
                        }
                    }
                }

                // private_features
                if (hasOwn(sheme[i], 'private_features') && sheme[i].private_features && sheme[i].private_features.length > 0) {
                    let private_features_action = (hasOwn(sheme[i], 'private_features_action') && sheme[i].private_features) ?? 'hide'
                    if (private_features_action != 'remove' && private_features_action != 'readonly') {
                        private_features_action = 'readonly'
                    }
                    if (!userSession.features().is_private(...sheme[i].private_features)) {
                        if (private_features_action == 'remove') {
                            remove = true
                        } else if (private_features_action == 'readonly') {
                            readonly = true
                        }
                    }
                }

                if (readonly === true && hasOwn(sheme[i], 'props')) {
                    sheme[i].props.readonly = true
                }

                if (remove === true) {
                    sheme.splice(i, 1)
                    parseScheme(sheme)
                    return
                }

                // children
                if (hasOwn(sheme[i], 'children') && isArray(sheme[i].children) && sheme[i].children.length > 0) {
                    parseScheme(sheme[i].children)
                }
            }
        }
    }
}

const _scheme = computed(() => props.scheme)
if (props.scheme && props.scheme.content && props.scheme.content.length > 0) {
    parseScheme(props.scheme.content)
} else {
    watch(_scheme, () => {
        if (props.scheme) {
            parseScheme(props.scheme.content)
        }
    })
}

if (props.storeOn == 'init') {
    setTimeout(onStoreSubmit, 0)
} else if (props.storeOn == 'change') {
    watch(data, onStoreSubmit)
    setTimeout(onStoreSubmit, 0)
}

const checkValidate = (): boolean => {
    const r = formElement.value?.checkValidity() ?? false
    formElement.value?.reportValidity()
    return r
}

emit('events', { onStoreSubmit, fetchData, resetData, forceReRenderForm, checkValidate })

onUnmounted(() => {
    data = {}
})
</script>

<template>
    <component :is="props.wrapper" v-bind="wrapperProps">
        <template #content>
            <VLoader :active="isFetching" :size="props.loaderSize">
                <form v-if="renderForm" ref="formElement" :class="form_classes" :style="props.styles" @submit.prevent="false">
                    <slot name="before-form"></slot>
                    <Form
                        ref="formComponent"
                        :data="data"
                        :children="props.scheme?.content"
                        :errors="errors"
                        :check-component-access="props.checkComponentAccess"
                        @update:data="(data, target, v) => emit('update:data', data, target, v)"
                    />
                    <slot name="after-form"></slot>
                </form>
            </VLoader>
        </template>
        <template v-if="!readonly" #action>
            <slot name="action"></slot>

            <VButton
                v-if="storeLabel && storeOn != 'change' && storeOn != 'delay'"
                color="primary"
                :loading="isStoring || isFetching"
                elevated
                @click="onStoreSubmit"
            >
                {{ props.storeLabel }}
            </VButton>
            <VLoader v-else :active="isFetching || ((storeOn == 'change' || storeOn == 'delay') && isStoring)" size="small" style="margin-top: -20px">
                <div v-if="isFetching || ((storeOn == 'change' || storeOn == 'delay') && isStoring)" style="width: 50px; height: 50px"></div>
            </VLoader>
            <VModal
                v-if="gauth !== undefined"
                :open="gauth"
                size="small"
                title="Confirm operation by Google authentication"
                actions="right"
                @close="gauth = false"
                @enter="onStoreSubmit"
            >
                <template #content>
                    <InputField
                        v-model="data.__auth_code__"
                        :maxlength="6"
                        :required="true"
                        :focus="focus"
                        label="Enter Authentication Code"
                        :errors="errors.__auth_code__"
                    />
                </template>
                <template #action>
                    <VButton color="primary" :loading="isStoring || isFetching" elevated @click="onStoreSubmit">Confirm</VButton>
                </template>
            </VModal>
        </template>
    </component>
</template>

<style lang="scss">
.control {
    &.has-validation {
        &.has-success {
            input,
            textarea {
                border-color: var(--success) !important;
                box-shadow: var(--light-box-shadow);
                transition: all 0.3s; // transition-all test
            }

            .validation-icon.is-success,
            .form-icon {
                opacity: 1 !important;

                svg,
                .form-icon svg {
                    color: var(--success) !important;
                }
            }
        }

        &.has-error {
            input,
            textarea,
            .multiselect {
                border-color: var(--danger) !important;
                box-shadow: var(--light-box-shadow);
            }

            .multiselect input {
                border-color: inherit;
                box-shadow: inherit;
            }

            .validation-icon.is-error,
            .form-icon {
                opacity: 1 !important;

                svg,
                .form-icon svg {
                    color: var(--danger) !important;
                }
            }

            .help-text span {
                &.info {
                    display: none;
                }

                &.error {
                    display: block;
                }
            }
        }
    }
}

.columns {
    &.is-6xl {
        width: 100%;
        max-width: 1620px;
    }

    &.is-5xl {
        width: 100%;
        max-width: 1440px;
    }

    &.is-4xl {
        width: 100%;
        max-width: 1280px;
    }

    &.is-3xl {
        width: 100%;
        max-width: 1024px;
    }

    &.is-big {
        width: 100%;
        max-width: 840px;
    }

    &.is-large {
        width: 100%;
        max-width: 720px;
    }

    &.is-medium {
        width: 100%;
        max-width: 640px;
    }

    &.is-small {
        width: 100%;
        max-width: 420px;
    }
}
</style>
