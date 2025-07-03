<template>
  <div class="vp-doc">
    <table class="vp-table">
      <tbody>
        <tr>
          <td>Created:</td>
          <td>{{ createdDateString }}</td>
        </tr>
        <tr>
          <td>Updated:</td>
          <td>{{ updatedDateString }}</td>
        </tr>
        <tr>
          <td colspan="2">
            <Permalink :uid="uid" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { computed } from 'vue';
import Permalink from './Permalink.vue';

const props = defineProps({
  createdTimestamp: {
    type: String,
    required: true
  },
  updatedTimestamp: {
    type: String,
    required: true
  },
  uid: {
    type: String,
    required: true
  }
});

// todo: date based on locale, captions
const locales = 'it-IT';
const options = { day: '2-digit', month: '2-digit', year: 'numeric' } as Intl.DateTimeFormatOptions;
const formatTs = (ts: string | number | Date) => new Date(ts).toLocaleDateString(locales, options);

const createdDateString = computed(() => formatTs(props.createdTimestamp));
const updatedDateString = computed(() => formatTs(props.updatedTimestamp));
</script>