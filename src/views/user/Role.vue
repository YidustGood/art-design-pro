<template>
  <div class="page-content">
    <el-row class="search-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-input
          v-model="searchParams.roleName"
          placeholder="角色名称"
          @keyup.enter="searchRoles"
        ></el-input>
      </el-col>
      <div style="width: 12px"></div>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-input
          v-model="searchParams.roleCode"
          placeholder="角色编码"
          @keyup.enter="searchRoles"
        ></el-input>
      </el-col>
      <div style="width: 12px"></div>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-input
          v-model="searchParams.description"
          placeholder="描述"
          @keyup.enter="searchRoles"
        ></el-input>
      </el-col>
      <div style="width: 12px"></div>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-select v-model="searchParams.status" placeholder="状态" clearable style="width: 100%">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-col>
      <div style="width: 12px"></div>
      <el-col :xs="24" :sm="12" :lg="6" class="el-col2">
        <el-button v-ripple @click="searchRoles">搜索</el-button>
        <el-button v-ripple @click="resetSearch">重置</el-button>
        <el-button @click="showDialog('add')" v-ripple>新增角色</el-button>
      </el-col>
    </el-row>

    <div class="table-container">
      <art-table :data="tableData" :loading="loading" :height="tableHeight" :empty-text="emptyText">
        <template #default>
          <el-table-column label="角色名称" prop="roleName" />
          <el-table-column label="角色编码" prop="roleCode" />
          <el-table-column label="描述" prop="description" />
          <el-table-column label="排序" prop="sort" width="80px" />
          <el-table-column label="状态" prop="status" width="100px">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'primary' : 'info'">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="createTime">
            <template #default="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="100px">
            <template #default="scope">
              <el-row>
                <ArtButtonMore
                  :list="[
                    { key: 'permission', label: '菜单权限' },
                    { key: 'edit', label: '编辑角色' },
                    { key: 'delete', label: '删除角色' }
                  ]"
                  @click="buttonMoreClick($event, scope.row)"
                />
              </el-row>
            </template>
          </el-table-column>
        </template>
      </art-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
      width="30%"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit(formRef)">提交</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialog" title="菜单权限" width="30%">
      <div :style="{ maxHeight: '500px', overflowY: 'scroll' }">
        <el-tree
          ref="permissionTreeRef"
          :data="menuList"
          show-checkbox
          node-key="id"
          :default-expanded-keys="[1, 2, 3, 4, 5, 6, 7, 8]"
          :props="defaultProps"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialog = false">取消</el-button>
          <el-button type="primary" @click="savePermissions">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useMenuStore } from '@/store/modules/menu'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { formatMenuTitle } from '@/utils/menu'
  import { ButtonMoreItem } from '@/components/core/forms/ArtButtonMore.vue'
  import {
    pageRoles,
    getRoleDetail,
    addRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    setRolePermissions,
    type RoleType
  } from '@/api/modules/roleApi'
  import { ApiStatus } from '@/utils/http/status'
  import { AuthApi } from '@/api/config/apiConfig'

  const dialogVisible = ref(false)
  const permissionDialog = ref(false)
  const { menuList } = storeToRefs(useMenuStore())
  const loading = ref(false)
  const permissionTreeRef = ref()
  const currentRoleId = ref<string>('')
  const tableHeight = ref('500px')
  const emptyText = ref('暂无数据')

  const formRef = ref<FormInstance>()

  // 定义搜索参数对象
  const searchParams = reactive({
    roleName: '',
    roleCode: '',
    description: '',
    status: undefined as number | undefined,
    pageNum: 1,
    pageSize: 10
  })

  const rules = reactive<FormRules>({
    roleName: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    roleCode: [
      { required: true, message: '请输入角色编码', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
  })

  const form = reactive<RoleType>({
    id: '',
    roleName: '',
    roleCode: '',
    description: '',
    sort: 0,
    status: 1
  })

  const tableData = ref<RoleType[]>([])

  const dialogType = ref('add')

  // 初始化
  onMounted(() => {
    // 设置适当的表格高度
    calculateTableHeight()
    window.addEventListener('resize', calculateTableHeight)
    loadRoleList()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', calculateTableHeight)
  })

  // 计算表格高度
  const calculateTableHeight = () => {
    // 基于视口高度动态设置表格高度
    // 考虑到页面上方的搜索区域和页面底部的边距
    const searchHeight = 80 // 搜索区域高度估计值
    const bottomMargin = 60 // 底部边距
    const pageHeight = window.innerHeight
    const availableHeight = pageHeight - searchHeight - bottomMargin - 100 // 100是顶部导航和其他元素的高度
    tableHeight.value = `${Math.max(400, availableHeight)}px` // 最小高度为400px
  }

  // 加载角色列表
  const loadRoleList = async () => {
    loading.value = true
    try {
      // 使用分页接口查询角色列表
      const res = await pageRoles({
        pageNum: searchParams.pageNum,
        pageSize: searchParams.pageSize,
        roleName: searchParams.roleName || undefined,
        roleCode: searchParams.roleCode || undefined,
        description: searchParams.description || undefined,
        status: searchParams.status
      })

      if (res.code === ApiStatus.success) {
        // 判断是否返回的是分页数据还是记录数组
        if (res.data && res.data.records) {
          tableData.value = res.data.records
        } else {
          tableData.value = res.data || []
        }
      } else {
        ElMessage.error(res.message || '获取角色列表失败')
      }
    } catch (error) {
      console.error('获取角色列表失败', error)
      ElMessage.error('获取角色列表失败')
    } finally {
      loading.value = false
    }
  }

  // 搜索角色
  const searchRoles = () => {
    searchParams.pageNum = 1 // 搜索时重置为第一页
    loadRoleList()
  }

  // 重置搜索条件
  const resetSearch = () => {
    searchParams.roleName = ''
    searchParams.roleCode = ''
    searchParams.description = ''
    searchParams.status = undefined
    searchParams.pageNum = 1
    loadRoleList()
  }

  // 显示弹窗
  const showDialog = async (type: string, row?: RoleType) => {
    dialogVisible.value = true
    dialogType.value = type

    resetForm()

    if (type === 'edit' && row) {
      // 先用列表中的数据填充表单，提供即时反馈
      form.id = String(row.id)
      form.roleName = row.roleName
      form.roleCode = row.roleCode
      form.description = row.description
      form.sort = row.sort || 0
      form.status = row.status

      // 然后再通过API获取完整数据
      try {
        const res = await getRoleDetail(String(row.id))
        if (res.code === ApiStatus.success && res.data) {
          const roleDetail = res.data
          form.id = roleDetail.id
          form.roleName = roleDetail.roleName
          form.roleCode = roleDetail.roleCode
          form.description = roleDetail.description
          form.sort = roleDetail.sort || 0
          form.status = roleDetail.status
        }
      } catch (error) {
        console.error('获取角色详情失败', error)
        ElMessage.error('获取角色详情失败')
      }
    }
  }

  // 重置表单
  const resetForm = () => {
    form.id = ''
    form.roleName = ''
    form.roleCode = ''
    form.description = ''
    form.sort = 0
    form.status = 1
  }

  // 按钮点击事件
  const buttonMoreClick = async (item: ButtonMoreItem, row: RoleType) => {
    if (item.key === 'permission') {
      await showPermissionDialog(row)
    } else if (item.key === 'edit') {
      showDialog('edit', row)
    } else if (item.key === 'delete') {
      confirmDeleteRole(row)
    }
  }

  // 显示权限对话框
  const showPermissionDialog = async (row: RoleType) => {
    if (!row.id) {
      ElMessage.warning('角色ID不能为空')
      return
    }

    currentRoleId.value = String(row.id)
    permissionDialog.value = true

    try {
      const res = await getRolePermissions(currentRoleId.value)
      if (res.code === ApiStatus.success && permissionTreeRef.value) {
        // 设置选中的节点
        permissionTreeRef.value.setCheckedKeys(res.data || [])
      }
    } catch (error) {
      console.error('获取角色权限失败', error)
      ElMessage.error('获取角色权限失败')
    }
  }

  // 保存权限
  const savePermissions = async () => {
    if (!currentRoleId.value) {
      ElMessage.warning('角色ID不能为空')
      return
    }

    if (!permissionTreeRef.value) {
      ElMessage.warning('权限树未加载')
      return
    }

    const checkedKeys = permissionTreeRef.value.getCheckedKeys()
    const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys()
    const allKeys = [...checkedKeys, ...halfCheckedKeys]

    console.log('保存权限, 角色ID:', currentRoleId.value, '权限IDs:', allKeys)

    try {
      const res = await setRolePermissions(currentRoleId.value, allKeys)
      console.log('保存权限结果:', res)

      if (res.code === ApiStatus.success) {
        ElMessage.success('设置权限成功')
        permissionDialog.value = false
      } else {
        ElMessage.error(res.message || '设置权限失败')
      }
    } catch (error) {
      console.error('设置权限失败', error)
      ElMessage.error('设置权限失败，请检查网络或服务器状态')
    }
  }

  const defaultProps = {
    children: 'children',
    label: (data: any) => formatMenuTitle(data.meta?.title) || ''
  }

  // 确认删除角色
  const confirmDeleteRole = (row: RoleType) => {
    if (!row.id) {
      ElMessage.warning('角色ID不能为空')
      return
    }

    ElMessageBox.confirm('确定删除该角色吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })
      .then(async () => {
        try {
          const id = String(row.id)
          console.log('删除角色，ID:', id, '类型:', typeof id)
          console.log('删除角色请求URL:', `${AuthApi.ROLE_DELETE}/${id}`)

          const res = await deleteRole(id)
          console.log('删除结果:', res)

          if (res.code === ApiStatus.success) {
            ElMessage.success('删除成功')
            loadRoleList()
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除角色失败', error)
          ElMessage.error('删除失败，请检查网络或服务器状态')
        }
      })
      .catch(() => {
        // 用户取消删除操作
      })
  }

  // 提交表单
  const handleSubmit = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    await formEl.validate(async (valid) => {
      if (valid) {
        try {
          console.log('提交表单数据:', form) // 调试日志
          let res
          if (dialogType.value === 'add') {
            res = await addRole(form)
          } else {
            res = await updateRole(form)
          }

          console.log('操作结果:', res) // 调试日志
          if (res.code === ApiStatus.success) {
            const message = dialogType.value === 'add' ? '新增成功' : '修改成功'
            ElMessage.success(message)
            dialogVisible.value = false
            loadRoleList()
          } else {
            ElMessage.error(res.message || '操作失败')
          }
        } catch (error) {
          console.error('保存角色失败', error)
          ElMessage.error('操作失败，请检查网络或服务器状态')
        }
      }
    })
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    return new Date(date)
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      .replace(/\//g, '-')
  }
</script>

<style lang="scss" scoped>
  .page-content {
    position: relative;
    height: 100%;

    .search-row {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 16px;

      .el-col {
        margin-bottom: 10px;
      }

      .el-button {
        margin-right: 10px;
      }
    }

    .table-container {
      position: relative;
      height: calc(100% - 80px);

      :deep(.el-table) {
        height: 100%;

        .el-table__empty-block {
          position: absolute;
          top: 40%;
          left: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100% !important;
          height: auto !important;
          min-height: 200px;
          transform: translate(-50%, -50%);
        }

        .el-table__empty-text {
          position: static;
          line-height: 1.5;
        }
      }
    }

    .svg-icon {
      width: 1.8em;
      height: 1.8em;
      overflow: hidden;
      vertical-align: -8px;
      fill: currentcolor;
    }
  }
</style>
