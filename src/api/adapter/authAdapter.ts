/**
 * 认证API适配器
 * 用于将后端API响应格式转换为前端需要的格式
 */
import { BaseResult } from '@/types/axios'
import { UserInfo } from '@/types/store'
import defaultAvatar from '@imgs/user/avatar.png'

/**
 * 将后端登录响应转换为前端格式
 * @param response 后端响应
 * @returns 转换后的响应
 */
export function adaptLoginResponse(response: any): BaseResult {
  // 检查响应格式是否符合预期
  if (response.code === 200 && response.data) {
    return {
      code: 200,
      message: response.message || '登录成功',
      data: {
        accessToken: response.data.accessToken || response.data.token,
        refreshToken: response.data.refreshToken,
        userInfo: response.data.userInfo
      }
    }
  }

  // 如果登录失败，返回错误信息
  return {
    code: response.code || 401,
    message: response.message || '用户名或密码错误',
    data: null
  }
}

/**
 * 将后端刷新令牌响应转换为前端格式
 * @param response 后端响应
 * @returns 转换后的响应，包含新的访问令牌
 */
export function adaptRefreshTokenResponse(response: any): BaseResult<string> {
  // 检查响应格式是否符合预期
  if (response.code === 200 && response.data) {
    return {
      code: 200,
      message: response.message || '刷新令牌成功',
      data: response.data // 新的访问令牌
    }
  }

  // 如果刷新令牌失败，返回错误信息
  return {
    code: response.code || 401,
    message: response.message || '刷新令牌失败',
    data: null as any
  }
}

/**
 * 将后端用户信息响应转换为前端格式
 * @param response 后端响应
 * @returns 转换后的用户信息
 */
export function adaptUserInfoResponse(response: any): BaseResult<UserInfo> {
  // 检查响应格式是否符合预期
  if (response.code === 200 && response.data) {
    const userData = response.data

    return {
      code: 200,
      message: response.message || '获取用户信息成功',
      data: {
        id: userData.id || '1',
        name: userData.name || userData.nickname || '未命名用户',
        username: userData.username || '',
        avatar: userData.avatar || defaultAvatar,
        email: userData.email || '',
        mobile: userData.mobile || '',
        gender: userData.gender !== undefined ? userData.gender : undefined,
        status: userData.status !== undefined ? userData.status : undefined,
        roles: Array.isArray(userData.roles) ? userData.roles : [],
        permissions: Array.isArray(userData.permissions) ? userData.permissions : []
      }
    }
  }

  // 如果获取用户信息失败，返回错误信息
  return {
    code: response.code || 500,
    message: response.message || '获取用户信息失败',
    data: null as any
  }
}
