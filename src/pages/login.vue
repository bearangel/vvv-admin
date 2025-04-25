<template>
  <div class="login-container">
    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <!-- 主题切换按钮 -->
      <div class="theme-selector">
        <v-btn icon size="small" @click="toggleTheme">
          <v-icon>{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
        </v-btn>
      </div>

      <!-- 语言切换按钮 -->
      <div class="language-selector">
        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" size="small">
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
      </div>
    </div>

    <v-card
      class="login-form-container"
      elevation="8"
      :style="{ backgroundColor: formBackgroundColor }"
    >
      <div class="login-logo">
        <img src="@/assets/logo.svg" alt="Logo" height="60" />
      </div>
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="handleLogin">
          <v-text-field
            v-model="username"
            :rules="usernameRules"
            :label="t('login.username')"
            prepend-icon="mdi-account"
            required
            :theme="currentTheme"
            class="input-field"
          ></v-text-field>

          <v-text-field
            v-model="password"
            :rules="passwordRules"
            :label="t('login.password')"
            prepend-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            @click:append-inner="showPassword = !showPassword"
            required
            :theme="currentTheme"
            class="input-field password-field"
          ></v-text-field>

          <div class="d-flex justify-end mt-4">
            <v-btn
              color="primary"
              type="submit"
              :disabled="!valid"
              :loading="loading"
            >
              {{ t('login.loginButton') }}
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { loginContextStore } from '@/stores/loginContextStore';
import { loginServiceProvider } from '@/services/login';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';

// i18n
const { t } = useI18n();

// 语言设置
const languageStore = useLanguageStore();
const currentLanguage = computed(() => languageStore.language);

// 主题设置
const themeStore = useThemeStore();
const currentTheme = computed(() => themeStore.currentTheme);
const isDark = computed(() => themeStore.isDark);

// 根据主题计算表单背景色
const formBackgroundColor = computed(() =>
  isDark.value ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 0.8)'
);

// 切换语言
const changeLanguage = (lang: string) => {
  languageStore.setLanguage(lang);
};

// 切换主题
const toggleTheme = () => {
  themeStore.toggleTheme();
};

// Form validation
const valid = ref(false);
const form = ref(null);
const loading = ref(false);
const showPassword = ref(false);

// Form fields
const username = ref('');
const password = ref('');

// Validation rules
const usernameRules = [
  (v: string) => !!v || t('login.usernameRequired'),
  (v: string) => v.length >= 3 || t('login.usernameLength')
];

const passwordRules = [
  (v: string) => !!v || t('login.passwordRequired'),
  (v: string) => v.length >= 6 || t('login.passwordLength')
];

// Get router instance
const router = useRouter();

// Login handler
const handleLogin = async () => {
  if (!valid.value) return;

  loading.value = true;

  try {
    // Get the login service from the provider
    const loginService = loginServiceProvider.getLoginService();

    // Try to login with username/password
    const loginContext = await loginService.login(username.value, password.value);

    if (loginContext) {
      // Store the login context in the store
      const store = loginContextStore();
      store.setLoginContext(loginContext);
      // Navigate to dashboard or home page after login
      router.push('/home');
    } else {
      // Show error message
      alert(t('login.loginFailed') + t('login.incorrectCredentials'));
    }
  } catch (error) {
    console.error('Login failed:', error);
    alert(t('login.loginFailed') + (error instanceof Error ? error.message : t('common.unknownError')));
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url('@/assets/login-background.svg');
  background-size: cover;
  background-position: center;
}

.login-form-container {
  width: 400px;
  padding: 40px;
  border-radius: 8px;
}

.login-logo {
  text-align: center;
  margin-bottom: 20px;
}

.input-field {
  width: 100%;
}

.password-field :deep(.v-field__append-inner) {
  padding-top: 0;
  margin-top: 8px;
}

.password-field :deep(.v-field__append-inner button) {
  opacity: 0.7;
}

.top-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  gap: 10px;
}

.theme-selector,
.language-selector {
  padding: 5px;
  border-radius: 4px;
}
</style>
