import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LanguageEnum } from '@/enums/appEnum'
import { router, setPageTitle } from '@/router'
import { UserInfo } from '@/types/store'
import { useSettingStore } from './setting'
import { useWorktabStore } from './worktab'
import { getSysStorage } from '@/utils/storage'
import { MenuListType } from '@/types/menu'
import { useTableStore } from './table'
import { UserService } from '@/api/usersApi'
import { ElMessage } from 'element-plus'

/**
 * 最大允许的refreshToken失败次数
 */
export const MAX_REFRESH_FAIL_COUNT = 3

/**
 * 获取设备信息的工具函数
 * @returns 包含设备类型和设备ID的对象
 */
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent
  // 简单判断设备类型
  const deviceType = /mobile|tablet|ipad|android/i.test(userAgent) ? 'Mobile' : 'PC'
  // 浏览器和版本信息作为deviceId
  const browserInfo =
    userAgent.match(/(chrome|safari|firefox|opera|msie|trident(?=\/))\/?\s*(\d+)/i) || []
  const deviceId = `${browserInfo[1] || 'Unknown'}_${browserInfo[2] || '0'}`
  return { deviceType, deviceId }
}

// 刷新token的Promise，用于防止重复请求
let refreshTokenPromise: Promise<boolean> | null = null

// 标记是否正在执行登出流程，防止循环
let isLoggingOut = false

// 用户存储
export const useUserStore = defineStore('userStore', () => {
  const language = ref(LanguageEnum.ZH)
  const isLogin = ref(false)
  const isLock = ref(false)
  const lockPassword = ref('')
  const info = ref<Partial<UserInfo>>({})
  const searchHistory = ref<MenuListType[]>([])
  const accessToken = ref('')
  const refreshToken = ref('')

  const getUserInfo = computed(() => info.value)
  const getSettingState = computed(() => useSettingStore().$state)
  const getWorktabState = computed(() => useWorktabStore().$state)
  const getTableState = computed(() => useTableStore().$state)

  /**
   * 初始化用户状态，从存储中加载数据
   */
  const initState = () => {
    let sys = getSysStorage()

    if (sys) {
      sys = JSON.parse(sys)
      const {
        info: storedInfo,
        isLogin: storedIsLogin,
        language: storedLanguage,
        searchHistory: storedSearchHistory,
        isLock: storedIsLock,
        lockPassword: storedLockPassword,
        refreshToken: storedRefreshToken
      } = sys.user

      info.value = storedInfo || {}
      isLogin.value = storedIsLogin || false
      isLock.value = storedIsLock || false
      language.value = storedLanguage || LanguageEnum.ZH
      searchHistory.value = storedSearchHistory || []
      lockPassword.value = storedLockPassword || ''
      refreshToken.value = storedRefreshToken || ''
      accessToken.value = sessionStorage.getItem('accessToken') || ''
    }
  }

  /**
   * 检查refreshToken是否已经多次失败，超过阈值则清除状态并返回true
   * @param token 要检查的refreshToken，如果不提供则使用当前的refreshToken
   * @returns 如果失败次数超过阈值返回true，否则返回false
   */
  const checkRefreshTokenFailure = (token?: string): boolean => {
    const tokenToCheck = token || refreshToken.value

    if (!tokenToCheck) return false

    const failKey = `refreshToken_fail_${tokenToCheck}`
    const failCount = parseInt(sessionStorage.getItem(failKey) || '0')

    if (failCount >= MAX_REFRESH_FAIL_COUNT) {
      console.warn('刷新令牌已连续失败多次，停止尝试')
      if (isLogin.value) {
        ElMessage.error('登录已过期，请重新登录')
        logOut()
      }
      return true
    }

    return false
  }

  /**
   * 记录refreshToken的失败次数
   * @param token 要记录的refreshToken，如果不提供则使用当前的refreshToken
   * @returns 当前的失败次数
   */
  const recordRefreshTokenFailure = (token?: string): number => {
    const tokenToCheck = token || refreshToken.value

    if (!tokenToCheck) return 0

    const failKey = `refreshToken_fail_${tokenToCheck}`
    const failCount = parseInt(sessionStorage.getItem(failKey) || '0')
    const newFailCount = failCount + 1

    sessionStorage.setItem(failKey, newFailCount.toString())

    // 如果失败次数达到阈值，清除用户状态
    if (newFailCount >= MAX_REFRESH_FAIL_COUNT && isLogin.value) {
      console.warn(`刷新令牌连续失败${MAX_REFRESH_FAIL_COUNT}次，清除用户状态`)
      ElMessage.error('登录已过期，请重新登录')
      logOut()
    }

    return newFailCount
  }

  /**
   * 重置refreshToken的失败次数计数器
   * @param token 要重置的refreshToken，如果不提供则使用当前的refreshToken
   */
  const resetRefreshTokenFailure = (token?: string): void => {
    const tokenToCheck = token || refreshToken.value

    if (!tokenToCheck) return

    const failKey = `refreshToken_fail_${tokenToCheck}`
    sessionStorage.removeItem(failKey)
  }

  /**
   * 使用refreshToken刷新accessToken
   * 包含防重复刷新机制，确保同一时间只有一个刷新请求
   * @returns Promise<boolean> 刷新是否成功
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    // 已经有token，直接返回成功
    if (accessToken.value) return true

    // 没有refreshToken，无法刷新
    if (!refreshToken.value) return false

    // 检查是否已经失败过多次
    if (checkRefreshTokenFailure()) return false

    // 防止重复刷新
    if (refreshTokenPromise) return refreshTokenPromise

    refreshTokenPromise = (async () => {
      try {
        const { deviceType, deviceId } = getDeviceInfo()
        const res = await UserService.refreshToken(refreshToken.value, deviceType, deviceId)

        if (res.code === 200 && res.data) {
          // 成功时重置失败计数
          resetRefreshTokenFailure()
          setToken(res.data)
          return true
        }

        // 刷新失败，增加失败计数
        recordRefreshTokenFailure()
        return false
      } catch (error) {
        console.error('刷新令牌失败', error)
        // 出现异常，增加失败计数
        recordRefreshTokenFailure()
        return false
      } finally {
        // 完成后清除Promise引用
        refreshTokenPromise = null
      }
    })()

    return refreshTokenPromise
  }

  /**
   * 保存用户数据到存储
   */
  const saveUserData = () => {
    saveStoreStorage({
      user: {
        info: info.value,
        isLogin: isLogin.value,
        language: language.value,
        isLock: isLock.value,
        lockPassword: lockPassword.value,
        searchHistory: searchHistory.value,
        refreshToken: refreshToken.value,
        worktab: getWorktabState.value,
        setting: getSettingState.value,
        table: getTableState.value
      }
    })
  }

  /**
   * 设置用户信息
   * @param newInfo 新的用户信息
   */
  const setUserInfo = (newInfo: UserInfo) => {
    info.value = newInfo
  }

  /**
   * 设置登录状态
   * @param status 是否登录
   */
  const setLoginStatus = (status: boolean) => {
    isLogin.value = status
  }

  /**
   * 设置语言
   * @param lang 语言枚举值
   */
  const setLanguage = (lang: LanguageEnum) => {
    setPageTitle(router.currentRoute.value)
    language.value = lang
  }

  /**
   * 设置搜索历史
   * @param list 菜单列表
   */
  const setSearchHistory = (list: MenuListType[]) => {
    searchHistory.value = list
  }

  /**
   * 设置锁定状态
   * @param status 是否锁定
   */
  const setLockStatus = (status: boolean) => {
    isLock.value = status
  }

  /**
   * 设置锁定密码
   * @param password 密码
   */
  const setLockPassword = (password: string) => {
    lockPassword.value = password
  }

  /**
   * 设置令牌
   * @param newAccessToken 新的访问令牌
   * @param newRefreshToken 可选的新刷新令牌
   */
  const setToken = (newAccessToken: string, newRefreshToken?: string) => {
    accessToken.value = newAccessToken
    if (newRefreshToken) {
      refreshToken.value = newRefreshToken
    }
    sessionStorage.setItem('accessToken', newAccessToken)
    saveUserData()
  }

  /**
   * 退出登录
   * 调用退出接口并清除本地状态
   */
  const logOut = async () => {
    // 如果当前在登录页且没有登录状态，不执行登出逻辑
    if (router.currentRoute.value.path === '/login' && !isLogin.value) {
      return
    }

    // 如果已经在执行登出流程，直接返回，防止循环调用
    if (isLoggingOut) {
      return
    }

    try {
      isLoggingOut = true

      // 调用登出接口
      if (isLogin.value) {
        try {
          const { code } = await UserService.logout()

          // 只有在登出接口调用成功后，才清除前端状态
          if (code === 200) {
            clearUserState()
          }
        } catch (error) {
          console.error('登出请求失败', error)
          // 即使请求失败，也要尝试清除本地状态
          clearUserState()
        }
      } else {
        // 如果没有登录状态，直接清除本地状态
        clearUserState()
      }
    } finally {
      // 登出流程结束，重置标志
      setTimeout(() => {
        isLoggingOut = false
      }, 500)
    }
  }

  /**
   * 清除用户状态
   * 从存储中删除所有用户相关数据
   */
  const clearUserState = () => {
    setTimeout(() => {
      info.value = {}
      isLogin.value = false
      isLock.value = false
      lockPassword.value = ''
      accessToken.value = ''
      refreshToken.value = ''
      sessionStorage.removeItem('accessToken')
      useWorktabStore().opened = []
      saveUserData()
      sessionStorage.removeItem('iframeRoutes')
      // 只有当前不在登录页时，才跳转到登录页
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }, 300)
  }

  return {
    language,
    isLogin,
    isLock,
    lockPassword,
    info,
    searchHistory,
    accessToken,
    refreshToken,
    getUserInfo,
    getSettingState,
    getWorktabState,
    initState,
    saveUserData,
    setUserInfo,
    setLoginStatus,
    setLanguage,
    setSearchHistory,
    setLockStatus,
    setLockPassword,
    setToken,
    logOut,
    refreshAccessToken,
    checkRefreshTokenFailure,
    recordRefreshTokenFailure,
    resetRefreshTokenFailure
  }
})

// 数据持久化存储
function saveStoreStorage<T>(newData: T) {
  const version = import.meta.env.VITE_VERSION
  initVersion(version)
  const vs = localStorage.getItem('version') || version
  const storedData = JSON.parse(localStorage.getItem(`sys-v${vs}`) || '{}')

  // 合并新数据与现有数据
  const mergedData = { ...storedData, ...newData }
  localStorage.setItem(`sys-v${vs}`, JSON.stringify(mergedData))
}

// 初始化版本
function initVersion(version: string) {
  const vs = localStorage.getItem('version')
  if (!vs) {
    localStorage.setItem('version', version)
  }
}
