import { fourDotsSpinnerSvg } from '@/assets/svg/loading'
import { asyncRoutes } from '@/router/modules/asyncRoutes'
import { MenuListType } from '@/types/menu'
import { processRoute } from '@/utils/menu'
import { ElLoading } from 'element-plus'
import api from '@/utils/http'
import { ServiceNames, getServicePath } from './config/apiConfig'
import { envConfig } from '@/config/env/env-config'

// 菜单接口路径
const MenuApi = {
  ROUTES: `${getServicePath(ServiceNames.AUTH)}/menu/routes`,
  LIST: `${getServicePath(ServiceNames.AUTH)}/menu/list`
}

// 菜单接口
export const menuService = {
  // 获取菜单列表
  getMenuList(
    delay: number = 300
  ): Promise<{ menuList: MenuListType[]; closeLoading: () => void }> {
    // 显示加载动画
    const loading = ElLoading.service({
      lock: true,
      background: 'rgba(0, 0, 0, 0)',
      svg: fourDotsSpinnerSvg,
      svgViewBox: '0 0 40 40'
    })

    // 判断是否使用模拟数据或禁用动态路由
    if (import.meta.env.VITE_USE_MOCK === 'true' || !envConfig.useDynamicRoutes) {
      // 使用前端静态路由配置
      const menuList = asyncRoutes
      // 处理后的菜单数据
      const processedMenuList: MenuListType[] = menuList.map((route) => processRoute(route))

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            menuList: processedMenuList,
            closeLoading: () => loading.close()
          })
        }, delay)
      })
    } else {
      // 使用后端动态路由配置
      return new Promise((resolve, reject) => {
        api
          .get({
            url: MenuApi.ROUTES
          })
          .then((res: any) => {
            // 处理后端返回的菜单数据
            const processedMenuList: MenuListType[] = res.data.map((route: any) => {
              // 转换后端返回的数据为前端需要的格式
              return {
                id: route.id,
                path: route.path,
                name: route.name,
                component: route.component,
                meta: route.meta,
                children: route.children
              }
            })

            resolve({
              menuList: processedMenuList,
              closeLoading: () => loading.close()
            })
          })
          .catch((error: unknown) => {
            loading.close()
            reject(error)
          })
      })
    }
  }
}
