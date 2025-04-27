<template>
  <!-- 左侧菜单栏 -->
  <v-navigation-drawer class="fill-height">
    <!-- 系统logo和名称 -->
    <div class="d-flex align-center logo-container">
      <img src="@/assets/logo.svg" alt="Logo" height="32" class="mr-2" />
      <h2>VVV Admin</h2>
    </div>

    <!-- 菜单列表 -->
    <v-list>
      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :value="item"
        :title="t(item.titleKey)"
        :prepend-icon="item.icon"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <!-- 顶部工具条 -->
  <v-app-bar color="primary" density="comfortable">
    <v-spacer></v-spacer>
    <!-- 设置按钮 -->
    <v-btn icon @click="openSettings">
      <v-icon>mdi-cog</v-icon>
    </v-btn>
    <!-- 明暗主题切换按钮 -->
    <v-btn icon @click="toggleTheme">
      <v-icon>{{ themeStore.isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
    </v-btn>
    <!-- 国际化下拉菜单 -->
    <v-menu
      v-model="languageMenu"
      location="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-translate</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          @click="changeLanguage('zh-CN')"
          :active="currentLanguage === 'zh-CN'"
        >
          <v-list-item-title>简体中文</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="changeLanguage('zh-TW')"
          :active="currentLanguage === 'zh-TW'"
        >
          <v-list-item-title>繁體中文</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="changeLanguage('en-US')"
          :active="currentLanguage === 'en-US'"
        >
          <v-list-item-title>English</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <!-- 全屏按钮 -->
    <v-btn icon @click="toggleFullscreen">
      <v-icon>mdi-fullscreen</v-icon>
    </v-btn>
    <!-- 通知按钮 -->
    <v-btn icon @click="openNotifications">
      <v-icon>mdi-bell</v-icon>
    </v-btn>
    <!-- 用户头像和下拉菜单 -->
    <v-menu
      v-model="userMenu"
      location="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-avatar v-if="currentUser?.avatar" size="32">
            <v-img :src="currentUser.avatar" alt="用户头像"></v-img>
          </v-avatar>
          <DefaultAvatar v-else :size="32" />
        </v-btn>
      </template>
      <v-card min-width="300">
        <!-- 用户信息 -->
        <v-card-text class="pa-4">
          <div class="d-flex align-center">
            <v-avatar size="48" class="mr-4">
              <v-img v-if="currentUser?.avatar" :src="currentUser.avatar" alt="用户头像"></v-img>
              <DefaultAvatar v-else :size="48" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ currentUser?.userName || '未登录' }}</div>
              <div class="text-caption">{{ currentUser?.email || '' }}</div>
            </div>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <!-- 功能菜单 -->
        <v-list>
          <v-list-item @click="openPasswordChange">
            <template v-slot:prepend>
              <v-icon>mdi-lock-reset</v-icon>
            </template>
            <v-list-item-title>修改密码</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <template v-slot:prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>退出登录</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <!-- 右侧功能区 -->
  <v-main class="fill-height pa-0">
    <v-card class="fill-height rounded-0">
      <v-card-title>{{ t('common.welcome') }}</v-card-title>
      <v-card-text>
        <p>{{ t('common.mainContent') }}</p>
      </v-card-text>
    </v-card>
  </v-main>

  <!-- 密码修改对话框 -->
  <v-dialog v-model="showPasswordDialog" max-width="500px">
    <v-card>
      <v-card-title>修改密码</v-card-title>
      <v-card-text>
        <v-form ref="passwordForm" v-model="passwordFormValid" @submit.prevent="changePassword">
          <v-text-field
            v-model="currentPassword"
            :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showCurrentPassword ? 'text' : 'password'"
            label="当前密码"
            required
            @click:append="showCurrentPassword = !showCurrentPassword"
            variant="underlined"
          ></v-text-field>

          <v-text-field
            v-model="newPassword"
            :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showNewPassword ? 'text' : 'password'"
            label="新密码"
            required
            :rules="[v => !!v || '请输入新密码', v => (v && v.length >= 6) || '密码长度至少为6个字符']"
            @click:append="showNewPassword = !showNewPassword"
            variant="underlined"
          ></v-text-field>

          <v-text-field
            v-model="confirmPassword"
            :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showConfirmPassword ? 'text' : 'password'"
            label="确认新密码"
            required
            :rules="[
              v => !!v || '请确认新密码',
              v => v === newPassword || '两次输入的密码不一致'
            ]"
            @click:append="showConfirmPassword = !showConfirmPassword"
            variant="underlined"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="showPasswordDialog = false">取消</v-btn>
        <v-btn
          color="primary"
          :disabled="!passwordFormValid || isChangingPassword"
          :loading="isChangingPassword"
          @click="changePassword"
        >
          确认修改
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
        关闭
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLanguageStore } from '@/stores/languageStore';
import { loginContextStore } from '@/stores/loginContextStore';
import { useRouter } from 'vue-router';
import { loginServiceProvider } from '@/services/login';
import DefaultAvatar from '@/components/DefaultAvatar.vue';

// i18n
const { t } = useI18n();

// 路由
const router = useRouter();

// 语言设置
const languageStore = useLanguageStore();
const currentLanguage = computed(() => languageStore.language);
const currentLanguageName = computed(() => languageStore.languageName);

// 用户信息
const loginStore = loginContextStore();
const currentUser = computed(() => loginStore.loginContext?.loginUser);
const userMenu = ref(false);

// 密码修改表单
const passwordForm = ref(null);
const passwordFormValid = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const isChangingPassword = ref(false);

// 提示消息
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// 菜单项数据
const menuItems = [
  {titleKey: 'home.menu.dashboard', icon: 'mdi-view-dashboard'},
  {titleKey: 'home.menu.userManagement', icon: 'mdi-account-group'},
  {titleKey: 'home.menu.settings', icon: 'mdi-cog'},
  {titleKey: 'home.menu.help', icon: 'mdi-help-circle'},
];

// 主题切换
import { useThemeStore } from '@/stores/themeStore';
const themeStore = useThemeStore();
const toggleTheme = () => {
  themeStore.toggleTheme();
};

// 全屏切换
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`${t('home.fullscreenError')}: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// 打开设置
const openSettings = () => {
  console.log('打开设置');
};

// 切换语言
const changeLanguage = (lang: string) => {
  languageStore.setLanguage(lang);
};

// 语言菜单控制
const languageMenu = ref(false);

// 打开通知
const openNotifications = () => {
  console.log('打开通知');
};

// 打开密码修改对话框
const showPasswordDialog = ref(false);
const openPasswordChange = () => {
  showPasswordDialog.value = true;
};

// 退出登录
const logout = () => {
  loginStore.clearLoginContext();
  router.push('/login');
};

// 修改密码
const changePassword = async () => {
  if (!passwordFormValid.value) return;

  isChangingPassword.value = true;

  try {
    // 使用登录服务修改密码
    const success = await loginServiceProvider.getLoginService().changePassword(
      currentUser.value?.email || '',
      currentPassword.value,
      newPassword.value
    );

    if (!success) {
      throw new Error('密码修改失败，请检查当前密码是否正确');
    }

    // 成功
    snackbarColor.value = 'success';
    snackbarText.value = '密码修改成功';
    showSnackbar.value = true;

    // 重置表单并关闭对话框
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    showPasswordDialog.value = false;
  } catch (error) {
    snackbarColor.value = 'error';
    snackbarText.value = error instanceof Error ? error.message : '密码修改失败';
    showSnackbar.value = true;
  } finally {
    isChangingPassword.value = false;
  }
};
</script>

<style scoped>
.logo-container {
  height: 48px; /* 与工具栏高度一致 */
  padding-left: 16px;
  padding-right: 16px;
}
</style>
