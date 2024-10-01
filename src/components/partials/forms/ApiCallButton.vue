<script setup lang="ts">
import { ref, computed } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { Method } from 'axios/index'
import { VButtonColor, VButtonSize } from '/@src/components/base/button/VButton.vue'

export interface ApiCallButtonEmits {
    (e: 'before-store-data', value: any): void
    (e: 'store-data', value: any): void
}

export interface ApiCallButtonProps {
    label?: string
    mode?: string //form | single
    icon?: string
    method?: Method
    color?: VButtonColor
    size?: VButtonSize
    uri: string
    confirm?: string
    tag?: 'button' | 'a'
    data?: any
    gauth?: boolean
}

const api = useApi()
const notif = useNotyf()
const props = withDefaults(defineProps<ApiCallButtonProps>(), {
    label: '',
    mode: 'form', //form | single
    icon: undefined,
    method: 'post',
    color: 'primary',
    uri: undefined,
    confirm: undefined,
    data: undefined,
    tag: 'button',
    size: undefined,
    gauth: undefined,
})

const emit = defineEmits<ApiCallButtonEmits>()
const isLoading = ref(false)
const isConfirm = ref(false)

const gauth = ref<boolean>(false)
const focus = computed(() => gauth.value === true)
const __auth_code__ = ref<string>()

const onClick = async (confirm_action: boolean | null = null) => {
    if (isLoading.value) {
        return
    }

    if (props.gauth && gauth.value === false) {
        __auth_code__.value = undefined
        gauth.value = true
        return
    }

    try {
        if (typeof props.confirm == 'string' && props.confirm.length > 0 && confirm_action == null) {
            // && !confirm(props.confirm)
            isConfirm.value = true
            return
        }

        isLoading.value = true
        emit('before-store-data', props)

        let requestData = props.data
        if (props.gauth) {
            requestData = { ...props.data, ...{ __auth_code__: __auth_code__.value } }
            // console.log(requestData)
        }

        const { data: response } = await api.request({
            method: props.method,
            url: props.uri,
            data: requestData,
        })
        emit('store-data', response)
    } catch (err) {
        notif.dismissAll()
        notif.error((err as Error).message)
    } finally {
        isLoading.value = false
    }
}

const onConfirm = async () => {
    isConfirm.value = false
    await onClick(true)
}
</script>

<template>
    <span :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), 'api-button', props.tag && 'tag-' + props.tag]">
        <VButton
            v-if="props.mode == 'single'"
            :color="props.color"
            :class="['mode-' + (props.mode ? props.mode : 'form')]"
            :loading="isLoading"
            :icon="props.icon"
            :size="props.size"
            elevated
            @click="onClick()"
        >
            <slot></slot>
            {{ props.label }}
        </VButton>
        <VField v-else :class="['column', props.label?.trim().replace(/ /g, '-').toLowerCase()]">
            <label>{{ props.label }}</label>
            <VButton
                :color="props.color"
                :loading="isLoading"
                :class="['mode-' + (props.mode ? props.mode : 'form')]"
                :icon="props.icon"
                elevated
                @click="onClick()"
            >
                <slot></slot>
                {{ props.label }}
            </VButton>
        </VField>

        <VModal
            v-if="props.confirm != undefined && isConfirm"
            :open="props.confirm != undefined && isConfirm"
            size="small"
            :title="'Confirm operation'"
            actions="right"
            @close="isConfirm = false"
            @enter="onConfirm"
        >
            <template #content>
                {{ props.confirm }}
            </template>
            <template #action>
                <VButton color="primary" elevated @click="onConfirm">Confirm</VButton>
            </template>
        </VModal>

        <VModal
            v-if="gauth !== undefined"
            :open="gauth"
            size="small"
            title="Confirm operation by Google authentication"
            actions="right"
            @close="gauth = false"
            @enter="onClick"
        >
            <template #content>
                <InputField v-model="__auth_code__" :maxlength="6" :required="true" :focus="focus" label="Enter Authentication Code" />
            </template>
            <template #action>
                <VButton color="primary" :loading="isLoading" elevated @click="onClick">Confirm</VButton>
            </template>
        </VModal>
    </span>
</template>

<style lang="scss">
.api-button {
    &.tag-a button {
        background: none;
        border: 0;
        border-radius: 0;
        box-shadow: none !important;
        display: inline-block !important;

        span {
            border-bottom: 1px dashed var(--light-text);
        }

        &.is-primary {
            color: var(--light-text);
        }

        &:hover {
            background: none;

            span {
                border-bottom: 1px dashed var(--light-text);
            }
        }
    }

    .button.mode-form {
        display: inline-block !important;
    }
}

html.is-dark body .app-wrapper {
    .api-button {
        &.tag-a button {
            background: none;
            box-shadow: none !important;
        }
    }
}
</style>
