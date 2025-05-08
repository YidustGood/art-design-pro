import api from '@/utils/http'
import { AuthApi } from '@/api/config/apiConfig'
import { BaseResult } from '@/types/axios'

// 角色类型定义
export interface RoleType {
  id?: string // 明确定义ID为字符串类型
  roleName: string
  roleCode: string
  description: string
  sort?: number
  status: number
  createTime?: string
  updateTime?: string
  permissionIds?: number[]
  menuIds?: number[]
}

/**
 * 获取角色列表
 * @returns 角色列表
 */
export function getRoleList() {
  return api.get<BaseResult<RoleType[]>>({ url: AuthApi.ROLE_LIST })
}

/**
 * 分页查询角色列表
 * @param params 分页参数
 * @returns 分页角色列表
 */
export function pageRoles(params: {
  pageNum?: number
  pageSize?: number
  roleName?: string
  roleCode?: string
  description?: string
  status?: number
}) {
  return api.get<BaseResult<any>>({
    url: AuthApi.ROLE_PAGE,
    params
  })
}

/**
 * 获取角色详情
 * @param id 角色ID
 * @returns 角色详情
 */
export function getRoleDetail(id: string) {
  return api.get<BaseResult<RoleType>>({ url: `${AuthApi.ROLE_DETAIL}/${id}` })
}

/**
 * 新增角色
 * @param data 角色数据
 * @returns 操作结果
 */
export function addRole(data: RoleType) {
  // 转换前端字段名称为后端字段名称
  const requestData = {
    roleName: data.roleName,
    roleCode: data.roleCode,
    description: data.description,
    sort: data.sort,
    status: data.status,
    permissionIds: data.permissionIds
  }
  return api.post<BaseResult<boolean>>({ url: AuthApi.ROLE_ADD, data: requestData })
}

/**
 * 更新角色
 * @param data 角色数据
 * @returns 操作结果
 */
export function updateRole(data: RoleType) {
  // 转换前端字段名称为后端字段名称
  const requestData = {
    id: data.id,
    roleName: data.roleName,
    roleCode: data.roleCode,
    description: data.description,
    sort: data.sort,
    status: data.status,
    permissionIds: data.permissionIds
  }
  return api.put<BaseResult<boolean>>({ url: AuthApi.ROLE_UPDATE, data: requestData })
}

/**
 * 删除角色
 * @param id 角色ID
 * @returns 操作结果
 */
export function deleteRole(id: string) {
  const url = `${AuthApi.ROLE_DELETE}/${id}`
  console.log('删除角色，请求URL:', url)

  return api.del<BaseResult<boolean>>({ url })
}

/**
 * 获取角色菜单权限
 * @param roleId 角色ID
 * @returns 菜单ID列表
 */
export function getRoleMenuPermissions(roleId: string) {
  return api.get<BaseResult<number[]>>({ url: `${AuthApi.ROLE_GET_MENU_PERMISSIONS}/${roleId}` })
}

/**
 * 设置角色菜单权限
 * @param roleId 角色ID
 * @param menuIds 菜单ID列表
 * @returns 操作结果
 */
export function setRoleMenuPermissions(roleId: string, menuIds: number[]) {
  return api.post<BaseResult<boolean>>({
    url: `${AuthApi.ROLE_SET_MENU_PERMISSIONS}/${roleId}`,
    data: menuIds
  })
}

/**
 * 获取角色功能权限
 * @param roleId 角色ID
 * @returns 权限ID列表
 */
export function getRoleFuncPermissions(roleId: string) {
  return api.get<BaseResult<number[]>>({ url: `${AuthApi.ROLE_GET_FUNC_PERMISSIONS}/${roleId}` })
}

/**
 * 设置角色功能权限
 * @param roleId 角色ID
 * @param permissionIds 权限ID列表
 * @returns 操作结果
 */
export function setRoleFuncPermissions(roleId: string, permissionIds: number[]) {
  return api.post<BaseResult<boolean>>({
    url: `${AuthApi.ROLE_SET_FUNC_PERMISSIONS}/${roleId}`,
    data: permissionIds
  })
}
