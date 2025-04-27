<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- 背景圆形 -->
    <circle cx="50" cy="50" r="50" :fill="bgColor" />

    <!-- 创意风格的头像 - 抽象几何图形组合 -->
    <!-- 头部轮廓 -->
    <ellipse cx="50" cy="45" rx="25" ry="28" fill="#FFFFFF" />

    <!-- 左眼 -->
    <circle cx="40" cy="40" r="5" fill="#333333" />

    <!-- 右眼 -->
    <circle cx="60" cy="40" r="5" fill="#333333" />

    <!-- 嘴巴 - 微笑曲线 -->
    <path d="M35,55 Q50,65 65,55" stroke="#333333" stroke-width="3" fill="none" />

    <!-- 几何装饰元素 -->
    <rect x="30" y="20" width="40" height="5" rx="2" fill="#FFFFFF" opacity="0.7" />
    <rect x="25" y="70" width="50" height="3" rx="1.5" fill="#FFFFFF" opacity="0.5" />

    <!-- 随机几何图形装饰 -->
    <circle cx="20" cy="30" r="4" fill="#FFFFFF" opacity="0.6" />
    <circle cx="80" cy="30" r="4" fill="#FFFFFF" opacity="0.6" />
    <circle cx="15" cy="60" r="3" fill="#FFFFFF" opacity="0.5" />
    <circle cx="85" cy="60" r="3" fill="#FFFFFF" opacity="0.5" />

    <!-- 抽象线条装饰 -->
    <path d="M15,40 L25,45" stroke="#FFFFFF" stroke-width="2" opacity="0.6" />
    <path d="M85,40 L75,45" stroke="#FFFFFF" stroke-width="2" opacity="0.6" />
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// 定义组件属性
const props = defineProps({
  // 头像大小
  size: {
    type: [Number, String],
    default: 32
  },
  // 背景颜色
  bgColor: {
    type: String,
    default: '#1976D2' // 默认使用 primary 颜色
  }
});
</script>

<style scoped>
/* 可以添加一些悬停效果 */
svg:hover {
  filter: brightness(1.1);
  transition: filter 0.3s ease;
}
</style>
