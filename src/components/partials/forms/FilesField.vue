<script setup lang="ts">
import { isString } from '@vue/shared'
import { ref } from 'vue'
import { LayoutSize } from '/@src/utils/layout-size'
import { useDownload } from '/@src/composable/useDownload'

export interface FileInfo {
    _id: string | File
    original_file_name: string
    file_size: number
    link?: string
}

export type FilesFieldValue = Array<FileInfo>
export interface FilesFieldEmits {
    (e: 'update:modelValue', value: FilesFieldValue): void
}
export interface FilesFieldProps {
    label?: string
    layout?: LayoutSize
    multiple?: boolean
    readonly?: boolean
    required?: boolean
    modelValue?: FilesFieldValue
    accept?: string
    maxSize?: number
    errors?: string[]
}

const emit = defineEmits<FilesFieldEmits>()
const props = withDefaults(defineProps<FilesFieldProps>(), {
    label: '',
    layout: '12',
    multiple: true,
    readonly: false,
    required: false,
    modelValue: undefined,
    accept: undefined,
    maxSize: undefined,
    errors: undefined,
})

const input = ref<HTMLInputElement>()
const isDragOver = ref(false)
const download = useDownload()

const humanFileSize = (size: number) => {
    const i = Math.floor(Math.log(size) / Math.log(1024))
    return +(size / Math.pow(1024, i)).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i]
}

const checkSize = (file: File) => {
    console.log(props.maxSize)
    if (file && props.maxSize != undefined && props.maxSize > 0) {
        if (file.size > props.maxSize) {
            alert('The file "' + file.name + '" must be less than ' + humanFileSize(props.maxSize))
            return false
        }
    }
    return true
}

const downloadFile = (file: FileInfo) => {
    if (file.link) {
        download.get(file.link, file.original_file_name)
    } else {
        download.file(file._id as File, file.original_file_name)
    }
}

const removeAllFiles = () => {
    if (confirm('Are you sure you want to delete this files?')) {
        emit('update:modelValue', [])
    }
}

const removeFile = (file: FileInfo) => {
    if (confirm('Are you sure you want to delete the file?')) {
        const result = [...(props.modelValue ?? [])]
        const index = result.indexOf(file)
        result.splice(index, 1)
        emit('update:modelValue', result)
    }
}

const addLocalFiles = (files: FileList | null | undefined) => {
    if (files && files.length > 0) {
        const result = [...(props.modelValue ?? [])]
        for (let i = 0; i < files.length; i++) {
            if (checkSize(files[i])) {
                result.push({
                    _id: files[i],
                    original_file_name: files[i].name,
                    file_size: files[i].size,
                })
            }
        }
        emit('update:modelValue', result)
    }
}

const onFilesChange = () => {
    isDragOver.value = false

    if (input.value) {
        addLocalFiles(input.value.files)
        input.value.files = new DataTransfer().files
    }
}
const onFileDrop = (e: DragEvent) => {
    isDragOver.value = false
    addLocalFiles(e.dataTransfer?.files)
}
</script>

<template>
    <VField class="column" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase(), layout && 'is-' + layout]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <div
                v-show="!props.readonly && (props.multiple || !props.modelValue?.length)"
                class="dropzone border_dropzone"
                :class="[isDragOver && 'is-dragover']"
            >
                <div class="file-head">
                    <i class="fas fa-1x fa-cloud-upload-alt"></i><span>Select File{{ props.multiple ? 's' : '' }}<i v-if="props.required">*</i></span>
                </div>
                <div class="file-desc">Drop file here or click <a href="#">browse</a> throught your mathine</div>
                <input
                    ref="input"
                    type="file"
                    class="form-control-file"
                    :multiple="props.multiple"
                    :accept="props.accept"
                    @change="onFilesChange"
                    @dragover.prevent.stop="isDragOver = true"
                    @dragenter.prevent.stop="isDragOver = true"
                    @dragleave.prevent.stop="isDragOver = false"
                    @dragend.prevent.stop="isDragOver = false"
                    @drop.prevent.stop="onFileDrop"
                />
            </div>
            <div>
                <div v-for="(file, index) in props.modelValue" :key="index" class="file-item">
                    <div class="file-title">
                        <i v-if="!isString(file._id)" class="fas fa-file-upload" aria-hidden="true"></i>
                        <i v-else class="fas fa-file-alt" aria-hidden="true"></i>
                        &nbsp;
                        <a href="#" @click.prevent="downloadFile(file)">{{ file.original_file_name }}</a>
                    </div>
                    <div v-if="!props.readonly" class="file-remove" @keydown.space.prevent="removeFile(file)" @click="removeFile(file)">
                        <i aria-hidden="true" class="iconify" data-icon="feather:x"></i>
                    </div>
                    <div class="file-size">{{ humanFileSize(file.file_size) }}</div>
                </div>
            </div>

            <div
                v-if="!props.readonly && props.multiple && props.modelValue?.length > 0"
                class="files-remove-all"
                @keydown.space.prevent="removeAllFiles"
                @click="removeAllFiles"
            >
                REMOVE ALL
            </div>
        </VControl>
        <span v-if="!!errors" class="help-text">
            <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
        </span>
    </VField>
</template>

<style scoped lang="scss">
.help-text span {
    &.error {
        color: red;
    }
}

.dropzone {
    width: 100%;
    padding: 10px 40px;
    line-height: 28px;
    overflow: hidden;
    position: relative;
    white-space: nowrap;
}

.dropzone .file-head .fas {
    color: var(--blue);
    margin-right: 10px;
}

.dropzone .file-head span {
    font-size: 18px;
    font-weight: 400;
    color: var(--dark-text);
}

.dropzone .file-desc {
    color: var(--dark-dark-text);
}

.dropzone input[type='file'] {
    cursor: pointer;
    opacity: 0;
    position: absolute;
    top: -50%;
    left: 0;
    width: 100%;
    height: 200%;
    margin: 0;
    padding: 0;
}

.border_dropzone {
    border: 1px dashed var(--dark-dark-text);

    &.is-dragover {
        border: 1px dashed var(--primary);
        box-shadow: var(--primary-box-shadow);
        z-index: 1;
    }
}

.file-item {
    border-left: 1px solid var(--dark-dark-text);
    border-right: 1px solid var(--dark-dark-text);
    border-bottom: 1px solid var(--dark-dark-text);
    line-height: 30px;
    padding: 10px;
    position: relative;

    &:first-child {
        border-top: 1px solid var(--dark-dark-text);
        margin-top: -1px;
    }
}

.file-item .file-title {
    width: 90%;
    overflow: hidden;
    white-space: nowrap;
    font-size: 15px;
}

.file-item .file-title .fas {
    color: var(--blue);
    margin-right: 3px;
}

.file-item .file-remove {
    color: var(--dark-dark-text);
    cursor: pointer;
    text-align: center;
    position: absolute;
    padding: 7px;
    font-size: 18px;
    top: 9px;
    right: 7px;
}

.file-size {
    font-size: 10px;
}

.files-remove-all {
    color: var(--dark-dark-text);
    text-align: right;
    cursor: pointer;
}
</style>