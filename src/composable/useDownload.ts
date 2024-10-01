import { useApi } from './useApi'

const api = useApi()

const getFileNameFromHeader = (response: any): string | null => {
    const contentDisposition = response.headers['content-disposition']
    if (contentDisposition) {
        const match = contentDisposition.match(/filename\s*=\s*(.+)/i)
        const filename = match ? match[1] ?? null : null
        return filename
    }
    return null
}

export function useDownload() {
    return {
        link(href: string, name: string) {
            const link = document.createElement('a')
            link.download = name
            link.href = href
            link.click()
        },

        file(file: File, name?: string) {
            const reader = new FileReader()
            reader.onloadend = () => this.link(name ?? file.name, reader.result as string)
            reader.readAsDataURL(file)
        },

        async get(uri: string, name?: string) {
            const response = await api.get(uri, { responseType: 'blob' })
            const href = window.URL.createObjectURL(new Blob([response.data]))
            const filename = getFileNameFromHeader(response)
            this.link(href, name ?? filename ?? 'download')
        },

        async post(uri: string, data?: any, name?: string) {
            const response = await api.post(uri, data, { responseType: 'blob' })
            const href = window.URL.createObjectURL(new Blob([response.data]))
            const filename = getFileNameFromHeader(response)
            this.link(href, name ?? filename ?? 'download')
        },
    }
}
