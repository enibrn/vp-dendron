<template>
  <div class="custom-layout">
    <div class="hello-world-container">
      <h1>hello-world</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple Vue component for the custom homepage
</script>

<style scoped>
.custom-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.hello-world-container {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hello-world-container h1 {
  margin: 0;
  color: #333;
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}
</style>