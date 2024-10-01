<script setup lang="ts">
import { reactive } from 'vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import VModal from '/@src/components/base/modal/VModal.vue'

export interface ConfirmData {
    uid: number
    title: string
    message: string
    resolve(value: boolean): void
}
</script>

<script lang="ts">
const confirms: ConfirmData[] = reactive([])
let nextUid = 1

function remove(confirm: ConfirmData) {
    const idx = confirms.indexOf(confirm)
    if (idx >= 0) {
        confirms.splice(idx, 1)
    }
}

export function confirmAsync(message: string, title?: string) {
    return new Promise((resolve) => {
        confirms.push({
            uid: nextUid++,
            title: title ?? document.title,
            message: message,
            resolve,
        })
    })
}
</script>

<template>
    <ApiForm
        v-for="confirm in confirms"
        :key="confirm.uid"
        :wrapper="VModal"
        :title="confirm.title"
        :fetch-data="{}"
        :scheme="schemeConfirm(confirm.message)"
        store-method="post"
        :store-data="{}"
        @store-data="remove(confirm), confirm.resolve(true)"
        @close="remove(confirm), confirm.resolve(false)"
    />
</template>
