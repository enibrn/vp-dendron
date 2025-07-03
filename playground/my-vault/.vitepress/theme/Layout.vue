<template>
  <Layout>
    <template #aside-top>
      <AsideTable
        :created-timestamp="frontmatter.created"
        :updated-timestamp="frontmatter.updated"
        :uid="frontmatter.id"
      />
    </template>
  </Layout>
</template>

<script
  setup
  lang="ts"
>
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import AsideTable from './components/AsideTable.vue';

const { Layout } = DefaultTheme;
const { frontmatter } = useData();

</script>