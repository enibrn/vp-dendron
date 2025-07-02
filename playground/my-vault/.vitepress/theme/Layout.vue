<template>
  <div>
    <!-- Show custom homepage for root route -->
    <Index v-if="isHomePage" />
    <!-- Show default theme layout for all other pages -->
    <DefaultTheme.Layout v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, withBase } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Index from './Index.vue'

const route = useRoute()

// Check if current route is the homepage
const isHomePage = computed(() => {
  const homePaths = [
    '/',
    '/index',
    '/index.html'
  ];

  return homePaths.some(path => route.path === withBase(path));
})
</script>