<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>{{ t('menu.management') }}</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          {{ t('menu.create') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- 菜单列表 -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="menus"
        :loading="loading"
        class="elevation-1"
      >
        <template v-slot:item.icon="{ item }">
          <v-icon>{{ item.icon }}</v-icon>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            color="primary"
            @click="openEditDialog(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 创建/编辑菜单对话框 -->
    <v-dialog v-model="showDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ isEditing ? t('menu.edit') : t('menu.create') }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="formData.name"
              :label="t('menu.name')"
              required
              :rules="[v => !!v || t('menu.nameRequired')]"
              variant="underlined"
            ></v-text-field>

            <v-text-field
              v-model="formData.icon"
              :label="t('menu.icon')"
              required
              :rules="[v => !!v || t('menu.iconRequired')]"
              variant="underlined"
              append-icon="mdi-help-circle"
              @click:append="openIconHelp"
            ></v-text-field>

            <v-text-field
              v-model="formData.path"
              :label="t('menu.path')"
              required
              :rules="[v => !!v || t('menu.pathRequired')]"
              variant="underlined"
            ></v-text-field>

            <v-text-field
              v-model.number="formData.order"
              type="number"
              :label="t('menu.order')"
              required
              :rules="[v => !!v || t('menu.orderRequired')]"
              variant="underlined"
            ></v-text-field>

            <v-text-field
              v-model="formData.i18nKey"
              :label="t('menu.i18nKey')"
              required
              :rules="[v => !!v || t('menu.i18nKeyRequired')]"
              variant="underlined"
            ></v-text-field>

            <v-select
              v-model="formData.parentId"
              :items="parentMenuOptions"
              item-title="name"
              item-value="id"
              :label="t('menu.parent')"
              variant="underlined"
              clearable
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="showDialog = false"
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!formValid || isSaving"
            :loading="isSaving"
            @click="saveMenu"
          >
            {{ t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>
          {{ t('menu.confirmDelete') }}
        </v-card-title>
        <v-card-text>
          {{ t('menu.deleteWarning', { name: menuToDelete?.name }) }}
          <div v-if="menuToDelete?.children.length" class="mt-4 text-error">
            {{ t('menu.deleteChildrenWarning') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="showDeleteDialog = false"
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="isDeleting"
            @click="deleteMenu"
          >
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 图标帮助对话框 -->
    <v-dialog v-model="showIconHelp" max-width="600px">
      <v-card>
        <v-card-title>
          {{ t('menu.iconHelp') }}
        </v-card-title>
        <v-card-text>
          <p>{{ t('menu.iconHelpText') }}</p>
          <p>{{ t('menu.iconHelpExample') }}</p>
          <div class="d-flex flex-wrap">
            <div v-for="icon in commonIcons" :key="icon" class="ma-2 text-center">
              <v-icon size="large">{{ icon }}</v-icon>
              <div class="caption">{{ icon }}</div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="showIconHelp = false"
          >
            {{ t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提示消息 -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      location="top right"
      :timeout="3000"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="showSnackbar = false"
        >
          {{ t('common.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Menu } from '@/models/menu.ts';
import { menuServiceProvider } from '@/services/menu';
import { loginContextStore } from '@/stores/loginContextStore.ts';
import { v4 as uuidv4 } from 'uuid';

// i18n
const { t } = useI18n();

// 登录上下文
const loginStore = loginContextStore();
const tenantId = computed(() => 'default');

// 表格列定义
const headers = [
  { title: t('menu.name'), key: 'name' },
  { title: t('menu.icon'), key: 'icon' },
  { title: t('menu.path'), key: 'path' },
  { title: t('menu.order'), key: 'order' },
  { title: t('menu.parent'), key: 'parentId' },
  { title: t('common.actions'), key: 'actions', sortable: false },
];

// 菜单数据
const menus = ref<Menu[]>([]);
const loading = ref(true);
const flatMenus = ref<Menu[]>([]);

// 表单数据
const form = ref(null);
const formValid = ref(false);
const formData = ref({
  id: '',
  name: '',
  icon: '',
  path: '',
  order: 0,
  parentId: null as string | null,
  i18nKey: '',
});

// 对话框控制
const showDialog = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const showDeleteDialog = ref(false);
const menuToDelete = ref<Menu | null>(null);
const isDeleting = ref(false);
const showIconHelp = ref(false);

// 提示消息
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// 常用图标列表
const commonIcons = [
  'mdi-home',
  'mdi-account',
  'mdi-cog',
  'mdi-view-dashboard',
  'mdi-account-group',
  'mdi-file-document',
  'mdi-chart-bar',
  'mdi-calendar',
  'mdi-email',
  'mdi-bell',
  'mdi-menu',
  'mdi-settings',
];

// 父菜单选项
const parentMenuOptions = computed(() => {
  return flatMenus.value
    .filter(menu => menu.parentId === null) // 只显示顶级菜单作为父菜单选项
    .map(menu => ({
      id: menu.id,
      name: menu.name,
    }));
});

// 初始化
onMounted(async () => {
  await loadMenus();
});

// 加载菜单数据
async function loadMenus() {
  loading.value = true;
  try {
    const menuService = menuServiceProvider.getMenuService();
    const menuData = await menuService.getAllMenus(tenantId.value);
    menus.value = menuData;

    // 创建扁平化的菜单列表，包含所有菜单（包括子菜单）
    flatMenus.value = [];
    for (const menu of menuData) {
      flatMenus.value.push(menu);
      for (const child of menu.children) {
        flatMenus.value.push(child);
      }
    }
  } catch (error) {
    console.error('加载菜单失败:', error);
    showSnackbar.value = true;
    snackbarColor.value = 'error';
    snackbarText.value = t('menu.loadError');
  } finally {
    loading.value = false;
  }
}

// 打开创建菜单对话框
function openCreateDialog() {
  isEditing.value = false;
  formData.value = {
    id: '',
    name: '',
    icon: 'mdi-menu',
    path: '',
    order: menus.value.length + 1,
    parentId: null,
    i18nKey: '',
  };
  showDialog.value = true;
}

// 打开编辑菜单对话框
function openEditDialog(item: Menu) {
  isEditing.value = true;
  formData.value = {
    id: item.id,
    name: item.name,
    icon: item.icon,
    path: item.path,
    order: item.order,
    parentId: item.parentId,
    i18nKey: item.i18nKey,
  };
  showDialog.value = true;
}

// 保存菜单
async function saveMenu() {
  isSaving.value = true;
  try {
    const menuService = menuServiceProvider.getMenuService();

    // 创建Menu对象
    const menu = new Menu(
      isEditing.value ? '' : uuidv4(), // 编辑时不需要新的gid
      tenantId.value,
      formData.value.id || uuidv4(),
      formData.value.name,
      formData.value.icon,
      formData.value.path,
      formData.value.order,
      formData.value.parentId,
      formData.value.i18nKey,
      [] // 子菜单会在服务层处理
    );

    if (isEditing.value) {
      await menuService.updateMenu(menu);
      snackbarText.value = t('menu.updateSuccess');
    } else {
      await menuService.createMenu(menu);
      snackbarText.value = t('menu.createSuccess');
    }

    // 重新加载菜单
    await loadMenus();

    // 显示成功消息
    showSnackbar.value = true;
    snackbarColor.value = 'success';

    // 关闭对话框
    showDialog.value = false;
  } catch (error) {
    console.error('保存菜单失败:', error);
    showSnackbar.value = true;
    snackbarColor.value = 'error';
    snackbarText.value = isEditing.value
      ? t('menu.updateError')
      : t('menu.createError');
  } finally {
    isSaving.value = false;
  }
}

// 确认删除菜单
function confirmDelete(item: Menu) {
  menuToDelete.value = item;
  showDeleteDialog.value = true;
}

// 删除菜单
async function deleteMenu() {
  if (!menuToDelete.value) return;

  isDeleting.value = true;
  try {
    const menuService = menuServiceProvider.getMenuService();
    const success = await menuService.deleteMenu(tenantId.value, menuToDelete.value.id);

    if (success) {
      // 重新加载菜单
      await loadMenus();

      // 显示成功消息
      showSnackbar.value = true;
      snackbarColor.value = 'success';
      snackbarText.value = t('menu.deleteSuccess');
    } else {
      throw new Error('删除失败');
    }

    // 关闭对话框
    showDeleteDialog.value = false;
  } catch (error) {
    console.error('删除菜单失败:', error);
    showSnackbar.value = true;
    snackbarColor.value = 'error';
    snackbarText.value = t('menu.deleteError');
  } finally {
    isDeleting.value = false;
  }
}

// 打开图标帮助对话框
function openIconHelp() {
  showIconHelp.value = true;
}
</script>
