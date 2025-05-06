import axios, { InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import EmojiText from '../emojo'
import AppConfig from '@/config'
import { getBaseApiUrl } from '@/config/env/api-config'
import { router } from '@/router'

const axiosInstance = axios.create({
  timeout: 15000, // 请求超时时间(毫秒)
  baseURL: getBaseApiUrl() || AppConfig.apiBaseUrl || import.meta.env.VITE_API_URL, // API地址
  withCredentials: true, // 异步是否请求携带cookie
  transformRequest: [(data) => JSON.stringify(data)], // 请求数据转换为 JSON 字符串
  validateStatus: (status) => status >= 200 && status < 300, // 只接受 2xx 的状态码
  headers: {
    get: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    post: { 'Content-Type': 'application/json;charset=utf-8' }
  },
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (contentType && contentType.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  async (request: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    let { accessToken } = userStore
    const { refreshToken } = userStore

    // 如果是刷新token的请求，检查是否已经失败太多次
    if (request.url?.includes('refreshToken') && refreshToken) {
      // 使用统一的检查失败方法
      if (userStore.checkRefreshTokenFailure(refreshToken)) {
        // 抛出错误，阻止请求发送
        throw new axios.Cancel('Token refresh has failed too many times')
      }
    }

    // 如果没有accessToken但有refreshToken，尝试刷新token
    // 排除刷新token的请求，避免循环
    if (!accessToken && refreshToken && !request.url?.includes('refreshToken')) {
      try {
        // 使用统一的刷新token方法
        await userStore.refreshAccessToken()
        // 获取最新的accessToken
        accessToken = userStore.accessToken
      } catch (error) {
        console.error('刷新令牌失败', error)
      }
    }

    // 如果 token 存在，则设置请求头
    if (accessToken) {
      request.headers.set({
        'Content-Type': 'application/json',
        Authorization: accessToken
      })
    }

    return request // 返回修改后的配置
  },
  (error) => {
    ElMessage.error(`服务器异常！ ${EmojiText[500]}`) // 显示错误消息
    return Promise.reject(error) // 返回拒绝的 Promise
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const userStore = useUserStore()
    const { refreshToken } = userStore
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 特殊处理logout请求返回401的情况
    if (error.response?.status === 401 && originalRequest.url?.includes('logout')) {
      console.warn('登出请求返回401，直接清理本地状态')
      // 这种情况直接清理本地状态，不尝试刷新token
      userStore.accessToken = ''
      userStore.refreshToken = ''
      userStore.isLogin = false
      sessionStorage.removeItem('accessToken')
      // 使用直接的localStorage清理，避免引用其他工具函数
      const version = import.meta.env.VITE_VERSION || '1.0.0'
      localStorage.removeItem(`sys-v${version}`)
      // 重定向到登录页
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
      return Promise.reject(error)
    }

    // 如果是refreshToken请求失败，记录失败次数
    if (originalRequest.url?.includes('refreshToken') && refreshToken) {
      // 使用统一的记录失败方法
      userStore.recordRefreshTokenFailure(refreshToken)
    }

    // 如果是401错误（未授权）且有refreshToken且请求未重试过且不是刷新token的请求
    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('refreshToken')
    ) {
      originalRequest._retry = true

      try {
        // 使用统一的刷新token方法
        const refreshSuccess = await userStore.refreshAccessToken()

        if (refreshSuccess) {
          // 刷新成功，重新发起原请求
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = userStore.accessToken
          }
          return axiosInstance(originalRequest)
        } else {
          // 刷新token失败时由refreshAccessToken方法统一处理结果和跳转逻辑
          return Promise.reject(error)
        }
      } catch (refreshError) {
        // 刷新token出错时由refreshAccessToken方法统一处理结果和跳转逻辑
        return Promise.reject(refreshError)
      }
    }

    // 其他错误处理
    if (axios.isCancel(error)) {
      console.log('repeated request: ' + error.message)
    } else {
      const errorMessage = error.response?.data.message
      ElMessage.error(
        errorMessage
          ? `${errorMessage} ${EmojiText[500]}`
          : `请求超时或服务器异常！${EmojiText[500]}`
      )
    }
    return Promise.reject(error)
  }
)

// 请求
async function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  // 对 POST | PUT 请求特殊处理
  if (config.method?.toUpperCase() === 'POST' || config.method?.toUpperCase() === 'PUT') {
    // 如果已经有 data，则保留原有的 data
    if (config.params && !config.data) {
      config.data = config.params
      config.params = undefined // 使用 undefined 而不是空对象
    }
  }

  try {
    const res = await axiosInstance.request<T>({ ...config })
    return res.data
  } catch (e) {
    if (axios.isAxiosError(e)) {
      // 可以在这里处理 Axios 错误
    }
    return Promise.reject(e)
  }
}

// API 方法集合
const api = {
  get<T>(config: AxiosRequestConfig): Promise<T> {
    return request({ ...config, method: 'GET' }) // GET 请求
  },
  post<T>(config: AxiosRequestConfig): Promise<T> {
    return request({ ...config, method: 'POST' }) // POST 请求
  },
  put<T>(config: AxiosRequestConfig): Promise<T> {
    return request({ ...config, method: 'PUT' }) // PUT 请求
  },
  del<T>(config: AxiosRequestConfig): Promise<T> {
    return request({ ...config, method: 'DELETE' }) // DELETE 请求
  }
}

export default api
