<script setup lang="ts">
import { ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import Scheme from '/@src/schemes/tags_management/tagsManagementEdit.json'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'

export interface TagManagementProps {
    id: string
}
const props = defineProps<TagManagementProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()

const isFetching = ref(true)
const onFetched = (data: any) => {
    viewWrapper.setPageTitle('Tag Management: ' + data.name)
    setTimeout(() => (isFetching.value = false), 60)
}
const onStored = () => {
    notif.success('Updated Successfully')
}
</script>

<template>
    <VLoader :active="isFetching" size="xl">
        <ApiForm
            :wrapper="ThinPageFullWidth"
            title="Tag Management"
            :fetch-data="'/tag_management/' + props.id"
            :scheme="Scheme"
            store-label="Update"
            store-method="post"
            :store-data="'/tag_management/update/' + props.id"
            @fetch-data="onFetched"
            @store-data="onStored"
        />
    </VLoader>
</template>
