import { useApi } from '/@src/composable/useApi'
import { CustomLoaderFunc, SelectOption } from '/@src/composable/useDictionary'

const api = useApi()

export function customDictionary(url: string, convert: (item: any) => SelectOption | undefined): CustomLoaderFunc {
    return async () => {
        const { data } = await api.get(url)
        return data.map(convert).filter((x: any) => x !== undefined)
    }
}

export function customSimpleDictionary(url: string, key: string, value: string): CustomLoaderFunc {
    return async () => {
        const { data } = await api.get(url)
        return data.map((item: any) => {
            return {
                value: item[key],
                label: item[value],
            }
        })
    }
}

export function customVarDictionary() {
    const resolvers: any[] = []
    return {
        wait() {
            return new Promise((resolve) => resolvers.push(resolve))
        },
        set(data: any) {
            resolvers.forEach((resolve) => resolve(data))
            resolvers.length = 0
        },
    }
}
