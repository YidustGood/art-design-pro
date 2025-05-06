<template>
  <ElConfigProvider size="default" :locale="locales[language]" :z-index="3000">
    <RouterView></RouterView>
  </ElConfigProvider>
</template>

<script setup lang="ts">
  import { useUserStore } from './store/modules/user'
  import zh from 'element-plus/es/locale/lang/zh-cn'
  import en from 'element-plus/es/locale/lang/en'
  import { systemUpgrade } from './utils/upgrade'
  import { initState, saveUserData } from './utils/storage'
  import { UserService } from './api/usersApi'
  import { ApiStatus } from './utils/http/status'
  import { setThemeTransitionClass } from './utils/theme/animation'

  const userStore = useUserStore()
  const { language } = storeToRefs(userStore)

  const locales = {
    zh: zh,
    en: en
  }

  onBeforeMount(() => {
    setThemeTransitionClass(true)
  })

  onMounted(() => {
    initState()
    saveUserData()
    setThemeTransitionClass(false)
    systemUpgrade()
    getUserInfo()
  })

  // 获取用户信息
  const getUserInfo = async () => {
    // 检查refreshToken是否已经多次失败
    if (userStore.refreshToken && userStore.checkRefreshTokenFailure()) {
      return
    }

    // 如果已登录但没有accessToken，先尝试刷新token
    if (userStore.isLogin && !userStore.accessToken && userStore.refreshToken) {
      // 等待刷新令牌
      const refreshSuccess = await userStore.refreshAccessToken()
      if (!refreshSuccess) {
        // 如果刷新失败，则不再尝试获取用户信息
        return
      }
    }

    // 只有在有accessToken的情况下才获取用户信息
    if (userStore.isLogin && userStore.accessToken) {
      const userRes = await UserService.getUserInfo()
      if (userRes.code === ApiStatus.success) {
        userStore.setUserInfo(userRes.data)
      }
    }
  }
</script>
