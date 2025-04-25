# 国际化 (Internationalization)

## 安装依赖

在使用国际化功能前，需要先安装 vue-i18n 依赖：

```bash
npm install vue-i18n@9
```

## 目录结构

- `zh-CN.ts` - 中文语言包
- `en-US.ts` - 英文语言包

## 使用方法

### 在模板中使用

```vue
<template>
  <div>
    <!-- 使用 $t 函数访问翻译 -->
    <h1>{{ $t('common.welcome') }}</h1>
    <p>{{ $t('common.mainContent') }}</p>
  </div>
</template>
```

### 在脚本中使用

```typescript
import { useI18n } from 'vue-i18n';

// 在 setup 中使用
const { t, locale } = useI18n();

// 使用 t 函数访问翻译
console.log(t('common.welcome'));

// 切换语言
const toggleLanguage = () => {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
};
```

## 添加新的翻译

在 `zh-CN.ts` 和 `en-US.ts` 文件中添加新的翻译键值对。请确保两个文件中的键保持一致。