<template>
  <div class="vp-doc">
    <table class="vp-table">
      <tbody>
        <tr>
          <td>Created:</td>
          <td>{{ formatTimestamp(props.createdTimestamp) }}</td>
        </tr>
        <tr v-if="props.createdTimestamp !== props.updatedTimestamp">
          <td>Updated:</td>
          <td>{{ formatTimestamp(props.updatedTimestamp) }}</td>
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
const formatTimestamp = (ts: string | number | Date) => new Date(ts).toLocaleDateString(locales, options);
</script>