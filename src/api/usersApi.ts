// import request from '@/utils/http'
// import { BaseResult } from '@/types/axios'
import AppConfig from '@/config'
import { BaseResult } from '@/types/axios'
import { UserInfo } from '@/types/store'
import avatar from '@imgs/user/avatar.png'
import api from '@/utils/http'
import {
  adaptLoginResponse,
  adaptUserInfoResponse,
  adaptRefreshTokenResponse
} from './adapter/authAdapter'
import { AuthApi } from './config/apiConfig'
import { useUserStore } from '@/store/modules/user'

export class UserService {
  // 用户登录接口
  static async login(options: { body: string }): Promise<BaseResult> {
    const bodyData = JSON.parse(options.body)

    // 开发环境使用模拟数据
    if (import.meta.env.MODE === 'development' && AppConfig.useMock) {
      return new Promise((resolve) => {
        const { username, password } = bodyData

        if (
          username === AppConfig.systemInfo.login.username &&
          password === AppConfig.systemInfo.login.password
        ) {
          resolve({
            code: 200,
            message: '登录成功',
            data: {
              accessToken:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkpvaG4gU25vdyIsImlhdCI6MTcwNjg2NTYwMCwiZXhwIjoxNzA2OTUyMDAwfQ.8f9D4kJ2m3XlH5Q0y6Z1r2Y3n4X5pL6q8K9v2W3n4X5'
            }
          })
        } else {
          resolve({
            code: 401,
            message: '用户名或密码错误',
            data: null
          })
        }
      })
    }

    // 生产环境调用真实接口
    try {
      const response = await api.post<BaseResult>({
        url: AuthApi.LOGIN,
        data: {
          username: bodyData.username,
          password: bodyData.password
        }
      })

      // 使用适配器处理响应
      return adaptLoginResponse(response)
    } catch (error) {
      console.error('登录请求失败', error)
      return {
        code: 500,
        message: '登录请求失败，请检查网络连接',
        data: null
      }
    }
  }

  // 获取用户信息
  static async getUserInfo(): Promise<BaseResult<UserInfo>> {
    // 开发环境使用模拟数据
    if (import.meta.env.MODE === 'development' && AppConfig.useMock) {
      return new Promise((resolve) => {
        resolve({
          code: 200,
          message: '获取用户信息成功',
          data: {
            id: '1',
            name: '张三',
            username: 'John Snow',
            avatar: avatar,
            email: 'art.design@gmail.com',
            mobile: '13800138000',
            gender: 1,
            status: 1,
            roles: ['admin', 'user'],
            permissions: ['system:view', 'user:add', 'user:edit', 'user:delete']
          }
        })
      })
    }

    // 生产环境调用真实接口
    try {
      const response = await api.get<BaseResult>({
        url: AuthApi.USER_INFO
      })

      // 使用适配器处理响应
      return adaptUserInfoResponse(response)
    } catch (error) {
      console.error('获取用户信息失败', error)
      return {
        code: 500,
        message: '获取用户信息失败，请检查网络连接',
        data: null as any
      }
    }
  }

  // 用户退出
  static async logout(): Promise<BaseResult<void>> {
    // 开发环境使用模拟数据
    if (import.meta.env.MODE === 'development' && AppConfig.useMock) {
      return new Promise((resolve) => {
        resolve({
          code: 200,
          message: '退出登录成功',
          data: undefined
        })
      })
    }

    const userStore = useUserStore()

    // 检查是否有有效的accessToken，如果没有则不发送请求
    if (!userStore.accessToken) {
      console.warn('登出时没有有效的accessToken，跳过API请求')
      return {
        code: 200,
        message: '退出登录成功',
        data: undefined
      }
    }

    // 生产环境调用真实接口
    try {
      const response = await api.post<BaseResult>({
        url: AuthApi.LOGOUT,
        params: {
          refreshToken: userStore.refreshToken
        }
      })

      return {
        code: response.code || 200,
        message: response.message || '退出登录成功',
        data: undefined
      }
    } catch (error) {
      console.error('退出登录失败', error)
      return {
        code: 500,
        message: '退出登录失败，请检查网络连接',
        data: undefined
      }
    }
  }

  // 检查用户名是否存在
  static async checkUsernameExists(username: string): Promise<BaseResult<boolean>> {
    // 开发环境使用模拟数据
    if (import.meta.env.MODE === 'development' && AppConfig.useMock) {
      return new Promise((resolve) => {
        resolve({
          code: 200,
          message: '检查用户名成功',
          data: false
        })
      })
    }

    // 生产环境调用真实接口
    try {
      const response = await api.get<BaseResult>({
        url: AuthApi.CHECK_USERNAME,
        params: { username }
      })

      return {
        code: response.code || 200,
        message: response.message || '检查用户名成功',
        data: !!response.data
      }
    } catch (error) {
      console.error('检查用户名失败', error)
      return {
        code: 500,
        message: '检查用户名失败，请检查网络连接',
        data: false
      }
    }
  }

  // 检查手机号是否存在
  static async checkMobileExists(mobile: string): Promise<BaseResult<boolean>> {
    // 开发环境使用模拟数据
    if (import.meta.env.MODE === 'development' && AppConfig.useMock) {
      return new Promise((resolve) => {
        resolve({
          code: 200,
          message: '检查手机号成功',
          data: false
        })
      })
    }

    // 生产环境调用真实接口
    try {
      const response = await api.get<BaseResult>({
        url: AuthApi.CHECK_MOBILE,
        params: { mobile }
      })

      return {
        code: response.code || 200,
        message: response.message || '检查手机号成功',
        data: !!response.data
      }
    } catch (error) {
      console.error('检查手机号失败', error)
      return {
        code: 500,
        message: '检查手机号失败，请检查网络连接',
        data: false
      }
    }
  }

  // 更新用户信息
  static async updateUserInfo(userInfo: Partial<UserInfo>): Promise<BaseResult<UserInfo>> {
    // 开发环境使用模拟数据
    if (import.meta.env.MODE === 'development' && AppConfig.useMock) {
      return new Promise((resolve) => {
        resolve({
          code: 200,
          message: '更新用户信息成功',
          data: {
            ...userInfo,
            id: userInfo.id || '1'
          } as UserInfo
        })
      })
    }

    // 生产环境调用真实接口
    try {
      const response = await api.post<BaseResult>({
        url: AuthApi.UPDATE_USER_INFO,
        data: userInfo
      })

      // 使用适配器处理响应
      return adaptUserInfoResponse(response)
    } catch (error) {
      console.error('更新用户信息失败', error)
      return {
        code: 500,
        message: '更新用户信息失败，请检查网络连接',
        data: null as any
      }
    }
  }

  // 修改密码
  static async updatePassword(params: {
    oldPassword: string
    newPassword: string
  }): Promise<BaseResult<boolean>> {
    // 开发环境使用模拟数据
    if (import.meta.env.MODE === 'development' && AppConfig.useMock) {
      return new Promise((resolve) => {
        resolve({
          code: 200,
          message: '修改密码成功',
          data: true
        })
      })
    }

    // 生产环境调用真实接口
    try {
      const response = await api.post<BaseResult>({
        url: AuthApi.UPDATE_PASSWORD,
        data: params
      })

      return {
        code: response.code || 200,
        message: response.message || '修改密码成功',
        data: response.code === 200
      }
    } catch (error) {
      console.error('修改密码失败', error)
      return {
        code: 500,
        message: '修改密码失败，请检查网络连接',
        data: false
      }
    }
  }

  // 刷新令牌
  static async refreshToken(
    refreshToken: string,
    deviceType?: string,
    deviceId?: string
  ): Promise<BaseResult<string>> {
    // 开发环境使用模拟数据
    if (import.meta.env.MODE === 'development' && AppConfig.useMock) {
      return new Promise((resolve) => {
        resolve({
          code: 200,
          message: '刷新令牌成功',
          data: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkpvaG4gU25vdyIsImlhdCI6MTcwNjg2NTYwMCwiZXhwIjoxNzA2OTUyMDAwfQ.8f9D4kJ2m3XlH5Q0y6Z1r2Y3n4X5pL6q8K9v2W3n4X5'
        })
      })
    }

    // 生产环境调用真实接口
    try {
      const response = await api.post<BaseResult>({
        url: AuthApi.REFRESH_TOKEN,
        data: {
          refreshToken,
          deviceType,
          deviceId
        }
      })

      // 使用适配器处理响应
      return adaptRefreshTokenResponse(response)
    } catch (error) {
      console.error('刷新令牌失败', error)
      return {
        code: 500,
        message: '刷新令牌失败，请检查网络连接',
        data: null as any
      }
    }
  }
}
