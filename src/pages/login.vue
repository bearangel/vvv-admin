<template>
  <div class="login-container">
    <v-card class="login-form-container" elevation="8">
      <div class="login-logo">
        <img src="@/assets/logo.svg" alt="Logo" height="60" />
      </div>
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="handleLogin">
          <v-text-field
            v-model="username"
            :rules="usernameRules"
            label="账号"
            prepend-icon="mdi-account"
            required
            theme="dark"
            class="input-field"
          ></v-text-field>

          <v-text-field
            v-model="password"
            :rules="passwordRules"
            label="密码"
            prepend-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            @click:append-inner="showPassword = !showPassword"
            required
            theme="dark"
            class="input-field password-field"
          ></v-text-field>

          <div class="d-flex justify-end mt-4">
            <v-btn
              color="primary"
              type="submit"
              :disabled="!valid"
              :loading="loading"
            >
              登录
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginContextStore } from '@/stores/loginContextStore';
import { loginServiceProvider } from '@/services/login';

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
  (v: string) => !!v || '请输入账号',
  (v: string) => v.length >= 3 || '账号长度不能少于3个字符'
];

const passwordRules = [
  (v: string) => !!v || '请输入密码',
  (v: string) => v.length >= 6 || '密码长度不能少于6个字符'
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
      router.push('/dashboard');
    } else {
      // Show error message
      alert('登录失败：用户名或密码错误');
    }
  } catch (error) {
    console.error('Login failed:', error);
    alert('登录失败：' + (error instanceof Error ? error.message : '未知错误'));
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
  background-color: rgba(40, 40, 40, 0.8); /* Dark background with 80% opacity */
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
</style>
